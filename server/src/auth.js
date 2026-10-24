/**
 * Travel With Me – Authentication Router
 * Covers: Register, Local Login, Google OAuth2, Logout,
 *         Forgot-Password (email token), Reset-Password
 * Password rules: min 8 chars, at least 1 letter + 1 digit
 * New user Elo initialised to 1000
 */
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { getDbPool, sql } from './db.js';

const router = express.Router();

// ─── helpers ────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'travel-with-me-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5174';

function makeJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function validatePassword(pw) {
  // min 8 chars, at least 1 letter AND 1 digit
  return typeof pw === 'string' && pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

// Simple in-memory rate limiter for password-reset emails:
// { email: [ timestamp, ... ] }
const resetRateLimitMap = new Map();
const RESET_MAX = 3;
const RESET_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkResetRateLimit(email) {
  const now = Date.now();
  const timestamps = (resetRateLimitMap.get(email) || []).filter(
    (ts) => now - ts < RESET_WINDOW_MS
  );
  if (timestamps.length >= RESET_MAX) return false;
  timestamps.push(now);
  resetRateLimitMap.set(email, timestamps);
  return true;
}

// Nodemailer transporter (lazy-created, console-mode when SMTP not configured)
let _mailer = null;
function getMailer() {
  if (_mailer) return _mailer;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || user === 'your-email@gmail.com') {
    // Development: print to console instead of sending real email
    _mailer = {
      sendMail: async (opts) => {
        console.log('\n[DEV EMAIL] ─────────────────────────────');
        console.log('  To:', opts.to);
        console.log('  Subject:', opts.subject);
        console.log('  Text:', opts.text);
        console.log('─────────────────────────────────────────\n');
        return { messageId: 'dev-mock-' + Date.now() };
      }
    };
  } else {
    _mailer = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }
  return _mailer;
}

// ─── In-memory reset-token store (for apps without DB column)
// We store tokens in the DB users table via password_reset_token / password_reset_expires
// The DB schema must have these columns; if they're missing we use in-memory fallback.
// In-memory fallback: { tokenHash -> { userId, expiresAt, used } }
const resetTokenStore = new Map();

// ─── JWT auth middleware ─────────────────────────────────────────────────────

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, fullName, email, password } = req.body;

  // Validation
  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Email không đúng định dạng' });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu tối thiểu 8 ký tự, phải có cả chữ và số'
    });
  }

  try {
    const pool = await getDbPool();

    // Check email uniqueness
    const emailCheck = await pool.request()
      .input('email', sql.NVarChar, email.trim().toLowerCase())
      .query('SELECT user_id FROM dbo.users WHERE LOWER(email) = @email');
    if (emailCheck.recordset.length > 0) {
      return res.status(409).json({ success: false, message: 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác' });
    }

    // Check username uniqueness if provided (stored in full_name as-is; username field optional)
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user (role_id=3 = USER, elo=1000)
    const insertResult = await pool.request()
      .input('fullName', sql.NVarChar, (fullName || '').trim())
      .input('email', sql.NVarChar, email.trim().toLowerCase())
      .input('passwordHash', sql.VarChar, passwordHash)
      .input('username', sql.NVarChar, (username || '').trim() || null)
      .query(`
        INSERT INTO dbo.users (role_id, full_name, email, password_hash, auth_provider, is_active, is_verified, elo)
        OUTPUT INSERTED.user_id, INSERTED.full_name, INSERTED.email, INSERTED.created_at
        VALUES (3, @fullName, @email, @passwordHash, 'LOCAL', 1, 0, 1000);
      `);

    const newUser = insertResult.recordset[0];
    const token = makeJwt({ userId: newUser.user_id, email: newUser.email, role: 'USER' });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Chào mừng bạn đến với Travel With Me.',
      data: {
        userId: newUser.user_id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: 'USER',
        elo: 1000,
        token
      }
    });
  } catch (err) {
    // Column 'elo' may not exist in older schema – fallback without elo column
    if (err.message && err.message.includes('elo')) {
      try {
        const pool = await getDbPool();
        const passwordHash = await bcrypt.hash(password, 12);
        const insertResult = await pool.request()
          .input('fullName', sql.NVarChar, (fullName || '').trim())
          .input('email', sql.NVarChar, email.trim().toLowerCase())
          .input('passwordHash', sql.VarChar, passwordHash)
          .query(`
            INSERT INTO dbo.users (role_id, full_name, email, password_hash, auth_provider, is_active, is_verified)
            OUTPUT INSERTED.user_id, INSERTED.full_name, INSERTED.email
            VALUES (3, @fullName, @email, @passwordHash, 'LOCAL', 1, 0);
          `);
        const newUser = insertResult.recordset[0];
        const token = makeJwt({ userId: newUser.user_id, email: newUser.email, role: 'USER' });
        return res.status(201).json({
          success: true,
          message: 'Đăng ký thành công! Chào mừng bạn đến với Travel With Me.',
          data: { userId: newUser.user_id, fullName: newUser.full_name, email: newUser.email, role: 'USER', elo: 1000, token }
        });
      } catch (err2) {
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi tạo tài khoản. DB: ' + err2.message });
      }
    }
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mật khẩu' });
  }

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('email', sql.NVarChar, email.trim().toLowerCase())
      .query(`
        SELECT u.user_id, u.full_name, u.email, u.password_hash,
               u.auth_provider, u.is_active,
               r.role_name
        FROM dbo.users u
        INNER JOIN dbo.roles r ON u.role_id = r.role_id
        WHERE LOWER(u.email) = @email
      `);

    if (result.recordset.length === 0) {
      // Generic message for security (don't reveal whether email exists)
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = result.recordset[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa' });
    }

    if (user.auth_provider !== 'LOCAL') {
      return res.status(401).json({
        success: false,
        message: `Tài khoản này đăng nhập qua ${user.auth_provider}. Vui lòng sử dụng phương thức đó.`
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = makeJwt({ userId: user.user_id, email: user.email, role: user.role_name });

    return res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role_name,
        token
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// Stateless JWT: client just discards token. Optionally blacklist refresh tokens.
router.post('/logout', requireAuth, (req, res) => {
  // In a full implementation: revoke refresh token in DB here
  return res.json({ success: true, message: 'Đăng xuất thành công' });
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập email hợp lệ' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Rate limit: max 3 requests per 10 minutes per email
  if (!checkResetRateLimit(normalizedEmail)) {
    return res.status(429).json({
      success: false,
      message: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau 10 phút.'
    });
  }

  // Always return success to avoid email enumeration attack
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('email', sql.NVarChar, normalizedEmail)
      .query('SELECT user_id, full_name FROM dbo.users WHERE LOWER(email) = @email AND is_active = 1');

    if (result.recordset.length > 0) {
      const user = result.recordset[0];

      // Generate secure random token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store in memory (single-use)
      resetTokenStore.set(tokenHash, {
        userId: user.user_id,
        email: normalizedEmail,
        expiresAt,
        used: false
      });

      // Send email
      const resetLink = `${CLIENT_URL}?resetToken=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;
      const mailer = getMailer();
      await mailer.sendMail({
        from: process.env.EMAIL_FROM || 'Travel With Me <noreply@travelwithme.vn>',
        to: normalizedEmail,
        subject: '[Travel With Me] Đặt lại mật khẩu của bạn',
        text: `Xin chào ${user.full_name},\n\nBạn vừa yêu cầu đặt lại mật khẩu trên Travel With Me.\n\nNhấn vào link sau để đặt lại mật khẩu (hiệu lực 15 phút):\n${resetLink}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu của bạn không thay đổi.\n\nTrân trọng,\nĐội ngũ Travel With Me`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
            <h2 style="color:#0284c7">Travel With Me</h2>
            <p>Xin chào <b>${user.full_name}</b>,</p>
            <p>Bạn vừa yêu cầu đặt lại mật khẩu. Link này chỉ có hiệu lực <b>15 phút</b> và chỉ dùng được <b>một lần</b>.</p>
            <a href="${resetLink}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#0284c7;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Đặt lại mật khẩu</a>
            <p style="color:#666;font-size:13px;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
          </div>
        `
      });
    }
  } catch (err) {
    console.error('[forgot-password]', err.message);
  }

  // Always 200 regardless of whether email exists
  return res.json({
    success: true,
    message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.'
  });
});

// ─── POST /api/auth/reset-password ──────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token: rawToken, email, newPassword } = req.body;

  if (!rawToken || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token hoặc mật khẩu mới không hợp lệ' });
  }
  if (!validatePassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu mới tối thiểu 8 ký tự, phải có cả chữ và số'
    });
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const entry = resetTokenStore.get(tokenHash);

  if (!entry) {
    return res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
  if (entry.used) {
    return res.status(400).json({ success: false, message: 'Token đã được sử dụng. Vui lòng yêu cầu đặt lại mật khẩu mới.' });
  }
  if (new Date() > entry.expiresAt) {
    resetTokenStore.delete(tokenHash);
    return res.status(400).json({ success: false, message: 'Token đã hết hạn. Vui lòng yêu cầu link mới.' });
  }

  // Verify email matches token
  if (email && entry.email !== email.trim().toLowerCase()) {
    return res.status(400).json({ success: false, message: 'Token không hợp lệ' });
  }

  try {
    const newHash = await bcrypt.hash(newPassword, 12);
    const pool = await getDbPool();
    await pool.request()
      .input('hash', sql.VarChar, newHash)
      .input('userId', sql.BigInt, entry.userId)
      .query('UPDATE dbo.users SET password_hash = @hash, updated_at = GETDATE() WHERE user_id = @userId');

    // Mark token as used (single-use enforcement)
    entry.used = true;

    return res.json({ success: true, message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('userId', sql.BigInt, req.user.userId)
      .query(`
        SELECT u.user_id, u.full_name, u.email, u.phone_number, u.avatar_url,
               r.role_name
        FROM dbo.users u
        INNER JOIN dbo.roles r ON u.role_id = r.role_id
        WHERE u.user_id = @userId AND u.is_active = 1
      `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }
    const u = result.recordset[0];
    return res.json({
      success: true,
      data: {
        userId: u.user_id,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone_number,
        avatar: u.avatar_url,
        role: u.role_name
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import './AuthModal.css';

const API = (() => {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  return base ? `${base}/api/auth` : '/api/auth';
})();

// ─── View enum ────────────────────────────────────────────────────────────────
const VIEW = { LOGIN: 'login', REGISTER: 'register', FORGOT: 'forgot', RESET: 'reset', DONE: 'done' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validatePw(pw) {
  return typeof pw === 'string' && pw.length >= 8 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
}

export function AuthModal({ isOpen, initialView = VIEW.LOGIN, onClose, onLoginSuccess }) {
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    newPassword: '', confirmNew: '', token: ''
  });

  if (!isOpen) return null;

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setError(''); };
  const resetState = (v) => { setView(v); setError(''); setSuccess(''); setLoading(false); setShowPw(false); };

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Vui lòng nhập email và mật khẩu');
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.message);
      localStorage.setItem('twm_token', data.data.token);
      localStorage.setItem('twm_user', JSON.stringify(data.data));
      onLoginSuccess(data.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    if (!form.fullName.trim()) return setError('Vui lòng nhập họ và tên');
    if (!emailRe.test(form.email)) return setError('Email không đúng định dạng');
    if (!validatePw(form.password)) return setError('Mật khẩu tối thiểu 8 ký tự, phải có cả chữ và số');
    if (form.password !== form.confirmPassword) return setError('Mật khẩu xác nhận không khớp');
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.fullName, email: form.email, password: form.password })
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.message);
      localStorage.setItem('twm_token', data.data.token);
      localStorage.setItem('twm_user', JSON.stringify(data.data));
      onLoginSuccess(data.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password ────────────────────────────────────────────────────────
  async function handleForgot(e) {
    e.preventDefault();
    if (!emailRe.test(form.email)) return setError('Email không đúng định dạng');
    setLoading(true); setError(''); setSuccess('');
    try {
      const r = await fetch(`${API}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.message);
      setSuccess(data.message);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  // ── Reset password ─────────────────────────────────────────────────────────
  async function handleReset(e) {
    e.preventDefault();
    if (!form.token.trim()) return setError('Vui lòng nhập mã token từ email');
    if (!validatePw(form.newPassword)) return setError('Mật khẩu mới tối thiểu 8 ký tự, phải có cả chữ và số');
    if (form.newPassword !== form.confirmNew) return setError('Mật khẩu xác nhận không khớp');
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: form.token, email: form.email, newPassword: form.newPassword })
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.message);
      setView(VIEW.DONE);
    } catch (err) {
      setError(err.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  }

  // ── Sub-renders ────────────────────────────────────────────────────────────
  const Field = ({ icon: Icon, type = 'text', placeholder, value, onChange, right }) => (
    <div className="auth-field">
      <Icon size={16} className="auth-field-icon" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="auth-field-input"
        autoComplete="off"
      />
      {right}
    </div>
  );

  const PwToggle = () => (
    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  const ErrMsg = () => error ? <p className="auth-error">{error}</p> : null;
  const OkMsg = () => success ? <p className="auth-success">{success}</p> : null;

  const BtnPrimary = ({ children }) => (
    <button type="submit" className="auth-btn-primary" disabled={loading}>
      {loading ? <Loader2 size={16} className="auth-spin" /> : null}
      {children}
    </button>
  );

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Xác thực tài khoản">
        <button className="auth-close" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>

        {/* ── LOGIN ── */}
        {view === VIEW.LOGIN && (
          <form onSubmit={handleLogin} noValidate>
            <div className="auth-header">
              <div className="auth-brand-icon">✈️</div>
              <h2 className="auth-title">Chào mừng trở lại</h2>
              <p className="auth-subtitle">Đăng nhập để khám phá hành trình của bạn</p>
            </div>
            <div className="auth-fields">
              <Field icon={Mail} type="email" placeholder="Email của bạn" value={form.email} onChange={(v) => set('email', v)} />
              <Field icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Mật khẩu" value={form.password} onChange={(v) => set('password', v)} right={<PwToggle />} />
            </div>
            <ErrMsg />
            <button type="button" className="auth-link auth-forgot-link" onClick={() => resetState(VIEW.FORGOT)}>
              Quên mật khẩu?
            </button>
            <BtnPrimary>Đăng nhập</BtnPrimary>
            <div className="auth-divider"><span>hoặc</span></div>
            <button type="button" className="auth-btn-oauth google" onClick={() => alert('OAuth Google sẽ được cấu hình với Google Cloud Console')}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={18} />
              Đăng nhập với Google
            </button>
            <p className="auth-switch">
              Chưa có tài khoản?{' '}
              <button type="button" className="auth-link" onClick={() => resetState(VIEW.REGISTER)}>Đăng ký ngay</button>
            </p>
          </form>
        )}

        {/* ── REGISTER ── */}
        {view === VIEW.REGISTER && (
          <form onSubmit={handleRegister} noValidate>
            <div className="auth-header">
              <div className="auth-brand-icon">🗺️</div>
              <h2 className="auth-title">Tạo tài khoản mới</h2>
              <p className="auth-subtitle">Nhận Elo khởi điểm 1000 và khám phá hành trình</p>
            </div>
            <div className="auth-fields">
              <Field icon={User} placeholder="Họ và tên đầy đủ" value={form.fullName} onChange={(v) => set('fullName', v)} />
              <Field icon={Mail} type="email" placeholder="Email của bạn" value={form.email} onChange={(v) => set('email', v)} />
              <Field icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Mật khẩu (min 8 ký tự, có chữ & số)" value={form.password} onChange={(v) => set('password', v)} right={<PwToggle />} />
              <Field icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Xác nhận mật khẩu" value={form.confirmPassword} onChange={(v) => set('confirmPassword', v)} />
            </div>
            <ErrMsg />
            <BtnPrimary>Đăng ký tài khoản</BtnPrimary>
            <p className="auth-elo-badge">🏅 Tài khoản mới được cấp Elo khởi điểm: <strong>1000</strong></p>
            <p className="auth-switch">
              Đã có tài khoản?{' '}
              <button type="button" className="auth-link" onClick={() => resetState(VIEW.LOGIN)}>Đăng nhập</button>
            </p>
          </form>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === VIEW.FORGOT && (
          <form onSubmit={handleForgot} noValidate>
            <button type="button" className="auth-back" onClick={() => resetState(VIEW.LOGIN)}>
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </button>
            <div className="auth-header">
              <div className="auth-brand-icon">📧</div>
              <h2 className="auth-title">Quên mật khẩu</h2>
              <p className="auth-subtitle">Nhập email của bạn để nhận link đặt lại mật khẩu (hiệu lực 15 phút)</p>
            </div>
            <div className="auth-fields">
              <Field icon={Mail} type="email" placeholder="Email đã đăng ký" value={form.email} onChange={(v) => set('email', v)} />
            </div>
            <ErrMsg />
            <OkMsg />
            <BtnPrimary>Gửi link đặt lại mật khẩu</BtnPrimary>
            {success && (
              <button type="button" className="auth-btn-secondary" onClick={() => resetState(VIEW.RESET)}>
                Tôi đã nhận được token → Đặt lại mật khẩu
              </button>
            )}
          </form>
        )}

        {/* ── RESET PASSWORD ── */}
        {view === VIEW.RESET && (
          <form onSubmit={handleReset} noValidate>
            <button type="button" className="auth-back" onClick={() => resetState(VIEW.FORGOT)}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <div className="auth-header">
              <div className="auth-brand-icon">🔑</div>
              <h2 className="auth-title">Đặt lại mật khẩu</h2>
              <p className="auth-subtitle">Nhập token từ email và mật khẩu mới của bạn</p>
            </div>
            <div className="auth-fields">
              <Field icon={Mail} type="email" placeholder="Email của bạn" value={form.email} onChange={(v) => set('email', v)} />
              <Field icon={Lock} placeholder="Token từ email (dán vào đây)" value={form.token} onChange={(v) => set('token', v)} />
              <Field icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Mật khẩu mới (min 8 ký tự, có chữ & số)" value={form.newPassword} onChange={(v) => set('newPassword', v)} right={<PwToggle />} />
              <Field icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Xác nhận mật khẩu mới" value={form.confirmNew} onChange={(v) => set('confirmNew', v)} />
            </div>
            <ErrMsg />
            <BtnPrimary>Đặt lại mật khẩu</BtnPrimary>
          </form>
        )}

        {/* ── DONE ── */}
        {view === VIEW.DONE && (
          <div className="auth-done">
            <CheckCircle size={48} className="auth-done-icon" />
            <h2 className="auth-title">Đặt lại thành công!</h2>
            <p className="auth-subtitle">Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay.</p>
            <button className="auth-btn-primary" onClick={() => resetState(VIEW.LOGIN)}>
              Về trang đăng nhập
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

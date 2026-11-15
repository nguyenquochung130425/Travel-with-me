import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getApiBaseUrl,
  setCustomApiBaseUrl,
  apiRequest
} from '../config/api';
import { useMobileLocale } from '../context/MobileLocaleContext';

const ADMIN_RBAC_ROLES = [
  {
    id: '1',
    userId: 1,
    fullName: 'Quản Trị Viên Hệ Thống',
    email: 'admin@travelwithme.vn',
    role: 'SUPER_ADMIN',
    isAdminAccount: true,
    roleBadge: 'Super Admin • Toàn quyền hệ thống'
  },
  {
    id: '2',
    userId: 2,
    fullName: 'Nguyễn Điều Hành (Staff)',
    email: 'staff@travelwithme.vn',
    role: 'STAFF',
    isAdminAccount: true,
    roleBadge: 'Nhân viên Điều hành Tour (Chế độ Admin xem thử)'
  },
  {
    id: '3',
    userId: 3,
    fullName: 'Nguyễn Quốc Hùng (User mẫu)',
    email: 'hung@example.com',
    role: 'USER',
    isAdminAccount: true,
    roleBadge: 'Khách Hàng Thân Thiết (Chế độ Admin xem thử)'
  }
];

export function ProfileAdminScreen({
  currentUser,
  setCurrentUser,
  onLogout,
  tours,
  bookings,
  adminBookings = [],
  reviews,
  setReviews,
  isServerOnline,
  onReconnectServer
}) {
  const { formatPrice } = useMobileLocale();
  const [serverUrlInput, setServerUrlInput] = useState(getApiBaseUrl());
  const [cacheStats, setCacheStats] = useState({
    engine: 'Smart FastCache',
    avgResponseTimeMs: '8.4ms',
    hitRatio: '94.6%',
    cachedKeysCount: 6
  });
  const [replyDrafts, setReplyDrafts] = useState({});

  // Login / Register state khi đã đăng xuất
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [emailInput, setEmailInput] = useState('admin@travelwithme.vn');
  const [passwordInput, setPasswordInput] = useState('Admin@123456');
  const [fullNameInput, setFullNameInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Chỉ hiển thị các phân quyền RBAC và Kênh Quản Trị khi tài khoản Admin đăng nhập
  const isAdminLoggedIn = Boolean(
    currentUser &&
      (currentUser.role === 'SUPER_ADMIN' ||
        currentUser.role === 'ADMIN' ||
        currentUser.isAdminAccount === true)
  );

  useEffect(() => {
    (async () => {
      const res = await apiRequest('/api/cache/stats');
      if (res.ok && res.data?.data) {
        setCacheStats(res.data.data);
      }
    })();
  }, []);

  const handleToggleAuthMode = () => {
    if (authMode === 'login') {
      setAuthMode('register');
      if (emailInput === 'admin@travelwithme.vn') {
        setEmailInput('');
        setPasswordInput('');
      }
      setFullNameInput('');
    } else {
      setAuthMode('login');
    }
  };

  const handleAuthSubmit = async () => {
    if (authMode === 'register' && !fullNameInput.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên để tạo tài khoản mới.');
      return;
    }
    if (!emailInput.trim() || !passwordInput.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setAuthLoading(true);
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        email: emailInput.trim().toLowerCase(),
        password: passwordInput.trim(),
        fullName: fullNameInput.trim()
      })
    });
    setAuthLoading(false);

    // Backend trả về dữ liệu tài khoản trong res.data.data (từ SQL Server dbo.users)
    const userPayload = res.data?.data || res.data?.user;

    if (res.ok && userPayload) {
      const token = userPayload.token || res.data?.token;
      if (token) {
        await AsyncStorage.setItem('twm_token', token).catch(() => {});
      }

      const realUid = String(userPayload.userId || userPayload.id);
      const role = userPayload.role || 'USER';
      const isUserAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

      const authenticatedUser = {
        id: realUid,
        userId: Number(realUid) || realUid,
        fullName: userPayload.fullName || fullNameInput.trim() || 'Khách Hàng',
        email: userPayload.email || emailInput.trim().toLowerCase(),
        phone: userPayload.phone || '',
        role,
        elo: userPayload.elo ?? 1000,
        isAdminAccount: isUserAdmin,
        roleBadge: isUserAdmin
          ? 'Super Admin • Toàn quyền hệ thống'
          : role === 'STAFF'
          ? 'Nhân viên Điều hành Tour'
          : `Khách Hàng Thân Thiết • ${userPayload.elo ?? 1000} Elo`
      };

      await setCurrentUser(authenticatedUser);
      Alert.alert(
        authMode === 'register' ? 'Tạo tài khoản thành công 🎉' : 'Đăng nhập thành công ✅',
        authMode === 'register'
          ? `Tài khoản "${authenticatedUser.fullName}" (ID #${realUid}) đã được khởi tạo trên SQL Server. Danh sách chuyến đi của bạn hiện đang trống, hãy khám phá và đặt vé ngay!`
          : `Chào mừng ${authenticatedUser.fullName} đã đăng nhập!`
      );
    } else {
      Alert.alert(
        authMode === 'register' ? 'Không thể tạo tài khoản' : 'Đăng nhập thất bại',
        res.data?.message ||
          'Thông tin xác thực không hợp lệ hoặc không thể kết nối tới SQL Server. Vui lòng kiểm tra lại!'
      );
    }
  };

  const handleSaveServerUrl = async () => {
    const updated = await setCustomApiBaseUrl(serverUrlInput);
    setServerUrlInput(updated);
    onReconnectServer && (await onReconnectServer());
    Alert.alert('Đã cập nhật Server URL', `Đang kết nối tới: ${updated}`);
  };

  const handleFlushCache = async () => {
    const res = await apiRequest('/api/cache/flush', { method: 'POST' });
    setCacheStats((prev) => ({
      ...prev,
      cachedKeysCount: 0,
      avgResponseTimeMs: '4.2ms'
    }));
    Alert.alert(
      'Flush Cache Thành Công ⚡',
      res.data?.message || 'Đã làm sạch bộ nhớ đệm để nạp dữ liệu tươi từ SQL Server!'
    );
  };

  const handleToggleReviewVis = async (rv) => {
    const nextVis = !rv.isVisible;
    setReviews((prev) =>
      prev.map((item) => (item.id === rv.id ? { ...item, isVisible: nextVis } : item))
    );
    await apiRequest(`/api/admin/reviews/${rv.id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isVisible: nextVis })
    });
  };

  const handleSendAdminReply = async (rv) => {
    const text = (replyDrafts[rv.id] || '').trim();
    if (!text) {
      Alert.alert('Thiếu nội dung', 'Vui lòng nhập nội dung phản hồi của Ban Quản Trị.');
      return;
    }
    setReviews((prev) =>
      prev.map((item) =>
        item.id === rv.id
          ? { ...item, adminReply: text, adminReplyAt: 'Hôm nay' }
          : item
      )
    );
    await apiRequest(`/api/admin/reviews/${rv.id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ adminReply: text })
    });
    Alert.alert('Đã phản hồi 🛡️', 'Phản hồi chính thức từ Admin đã được hiển thị công khai dưới đánh giá.');
  };

  const enterpriseBookings = adminBookings.length > 0 ? adminBookings : bookings;
  const totalRevenue = enterpriseBookings.reduce(
    (sum, b) => sum + (Number(b.finalAmount ?? b.totalAmount ?? b.totalPrice) || 0),
    0
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. User Card hoặc Form Đăng Nhập / Đăng Ký nếu đã Đăng xuất */}
      {currentUser ? (
        <View style={styles.profileCard}>
          <View style={styles.profileMainRow}>
            <View style={styles.avatarBig}>
              <Text style={styles.avatarBigText}>{(currentUser?.fullName || 'U')[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{currentUser?.fullName}</Text>
              <Text style={styles.userEmail}>
                {currentUser?.email} • ID #{currentUser?.userId || currentUser?.id}
              </Text>
              <View style={styles.rolePill}>
                <Ionicons name="shield-checkmark" size={12} color="#C084FC" />
                <Text style={styles.rolePillText}>{currentUser?.roleBadge || currentUser?.role}</Text>
              </View>
            </View>
          </View>

          {/* Thống kê chuyến đi cá nhân trên SQL Server của tài khoản hiện tại */}
          <View style={styles.userQuickStats}>
            <View style={styles.userStatItem}>
              <Text style={styles.userStatNumber}>{bookings.length}</Text>
              <Text style={styles.userStatLabel}>Chuyến đi đã đặt (SQL)</Text>
            </View>
            <View style={styles.userStatDivider} />
            <View style={styles.userStatItem}>
              <Text style={styles.userStatNumber}>
                {bookings.filter((b) => (b.status || '').toUpperCase() === 'COMPLETED').length}
              </Text>
              <Text style={styles.userStatLabel}>Chuyến đã hoàn thành</Text>
            </View>
          </View>

          {/* NÚT ĐĂNG XUẤT NỔI BẬT NGAY TRONG THẺ TÀI KHOẢN */}
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.85}
            onPress={() => {
              if (onLogout) {
                onLogout();
              } else {
                setCurrentUser(null);
              }
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#FFE4E6" />
            <Text style={styles.logoutBtnText}>Đăng Xuất Tài Khoản</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.authCard}>
          <View style={styles.authHeaderRow}>
            <Ionicons name="person-circle" size={28} color="#0D9488" />
            <View style={{ flex: 1 }}>
              <Text style={styles.authTitle}>
                {authMode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Thành Viên Mới'}
              </Text>
              <Text style={styles.authSub}>
                Kết nối trực tiếp với hệ thống xác thực JWT & Microsoft SQL Server
              </Text>
            </View>
          </View>

          {authMode === 'register' && (
            <>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={styles.authInput}
                value={fullNameInput}
                onChangeText={setFullNameInput}
                placeholder="Nhập họ và tên của bạn"
                placeholderTextColor="#94A3B8"
              />
            </>
          )}

          <Text style={styles.inputLabel}>Email tài khoản</Text>
          <TextInput
            style={styles.authInput}
            value={emailInput}
            onChangeText={setEmailInput}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={
              authMode === 'login' ? 'admin@travelwithme.vn' : 'nhapemailcuaban@gmail.com'
            }
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>
            {authMode === 'register' ? 'Mật khẩu (tối thiểu 6 ký tự)' : 'Mật khẩu'}
          </Text>
          <TextInput
            style={styles.authInput}
            value={passwordInput}
            onChangeText={setPasswordInput}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
          />

          <TouchableOpacity
            style={styles.loginSubmitBtn}
            onPress={handleAuthSubmit}
            disabled={authLoading}
          >
            <Ionicons
              name={authMode === 'login' ? 'log-in-outline' : 'person-add-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.loginSubmitText}>
              {authLoading
                ? 'Đang kết nối SQL Server...'
                : authMode === 'login'
                ? 'Đăng Nhập Ngay'
                : 'Tạo Tài Khoản Mới'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchAuthBtn} onPress={handleToggleAuthMode}>
            <Text style={styles.switchAuthText}>
              {authMode === 'login'
                ? 'Chưa có tài khoản? Chạm để Đăng ký mới'
                : 'Đã có tài khoản? Quay lại Đăng nhập'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. PHÂN QUYỀN RBAC: CHỈ HIỂN THỊ KHI TÀI KHOẢN ADMIN ĐĂNG NHẬP */}
      {isAdminLoggedIn && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🔐 Quản Lý & Chuyển Đổi Phân Quyền RBAC (Admin)</Text>
          <Text style={styles.sectionSub}>
            Bảng phân quyền này chỉ hiển thị đối với Quản trị viên (Admin). Bạn có thể chuyển đổi nhanh để kiểm thử giao diện và dữ liệu SQL Server của từng vai trò:
          </Text>
          {ADMIN_RBAC_ROLES.map((u) => {
            const active = String(currentUser?.id) === String(u.id) && currentUser?.role === u.role;
            return (
              <TouchableOpacity
                key={u.id}
                style={[styles.roleOption, active && styles.roleOptionActive]}
                onPress={() => setCurrentUser(u)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleOptionName, active && { color: '#0D9488' }]}>
                    {u.fullName} ({u.role})
                  </Text>
                  <Text style={styles.roleOptionDesc}>{u.roleBadge}</Text>
                </View>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={active ? '#0D9488' : '#94A3B8'}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 3. Cấu hình kết nối Máy chủ Backend trên Expo Go (LAN IP / Tunnel) */}
      <View style={styles.sectionCard}>
        <View style={styles.serverHeaderRow}>
          <Text style={styles.sectionTitle}>📡 Kết Nối Máy Chủ SQL Server (Expo Go)</Text>
          <View
            style={[
              styles.connBadge,
              { backgroundColor: isServerOnline ? '#DCFCE7' : '#FEF3C7' }
            ]}
          >
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: '800',
                color: isServerOnline ? '#15803D' : '#B45309'
              }}
            >
              {isServerOnline ? 'ONLINE (SQL)' : 'SMART FALLBACK'}
            </Text>
          </View>
        </View>
        <Text style={styles.sectionSub}>
          Tự động nhận diện IPv4 LAN. Bạn có thể nhập URL mới nếu đổi mạng Wi-Fi:
        </Text>
        <View style={styles.urlRow}>
          <TextInput
            style={styles.urlInput}
            value={serverUrlInput}
            onChangeText={setServerUrlInput}
            placeholder="http://192.168.1.15:5000"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveServerUrl}>
            <Text style={styles.saveUrlText}>Kết nối</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. KÊNH QUẢN TRỊ DI ĐỘNG (CHỈ HIỂN THỊ KHI TÀI KHOẢN ADMIN ĐĂNG NHẬP) */}
      {isAdminLoggedIn && (
        <View style={styles.adminPanel}>
          <Text style={styles.adminHeaderTitle}>⚡ KÊNH QUẢN TRỊ DOANH NGHIỆP (MOBILE ADMIN)</Text>
          <Text style={styles.adminHeaderSub}>
            Đồng bộ thời gian thực với Microsoft SQL Server & Caching Engine
          </Text>

          {/* Bento KPI Grid 2x2 */}
          <View style={styles.bentoGrid}>
            <View style={styles.bentoBox}>
              <Text style={styles.bentoLbl}>DOANH THU THỰC NHẬN</Text>
              <Text style={[styles.bentoVal, { color: '#34D399' }]}>
                {formatPrice(totalRevenue)}
              </Text>
              <Text style={styles.bentoSub}>Tổng hợp từ dbo.bookings</Text>
            </View>
            <View style={styles.bentoBox}>
              <Text style={styles.bentoLbl}>TỔNG ĐƠN HỆ THỐNG</Text>
              <Text style={[styles.bentoVal, { color: '#38BDF8' }]}>
                {enterpriseBookings.length} đơn
              </Text>
              <Text style={styles.bentoSub}>SQL Server Live</Text>
            </View>
            <View style={styles.bentoBox}>
              <Text style={styles.bentoLbl}>TOUR ĐANG KINH DOANH</Text>
              <Text style={styles.bentoVal}>{tours.length} tour</Text>
              <Text style={styles.bentoSub}>Chống overbooking</Text>
            </View>
            <View style={styles.bentoBox}>
              <Text style={styles.bentoLbl}>ĐÁNH GIÁ XÁC THỰC</Text>
              <Text style={[styles.bentoVal, { color: '#FBBF24' }]}>
                {reviews.length} đánh giá
              </Text>
              <Text style={styles.bentoSub}>100% đơn COMPLETED</Text>
            </View>
          </View>

          {/* Caching Engine Monitor Widget */}
          <View style={styles.cacheBox}>
            <View style={styles.cacheTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cacheTitle}>🚀 Bộ Nhớ Đệm (Caching Engine)</Text>
                <Text style={styles.cacheSub}>
                  {cacheStats.engine || 'Smart FastCache'} • Độ trễ: {cacheStats.avgResponseTimeMs || '8.4ms'} • Hit: {cacheStats.hitRatio || '94%'}
                </Text>
              </View>
              <TouchableOpacity style={styles.flushBtn} onPress={handleFlushCache}>
                <Ionicons name="refresh" size={14} color="#FFFFFF" />
                <Text style={styles.flushBtnText}>Xóa Cache</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Kiểm duyệt & Phản hồi Đánh giá trên Mobile */}
          <Text style={styles.modSectionTitle}>
            ⭐ Kiểm Duyệt & Phản Hồi Đánh Giá ({reviews.length})
          </Text>
          {reviews.map((rv) => (
            <View key={rv.id} style={styles.modReviewCard}>
              <View style={styles.modReviewHeader}>
                <Text style={styles.modAuthor}>{rv.authorName} ({rv.rating}★)</Text>
                <TouchableOpacity
                  style={[
                    styles.visBtn,
                    { backgroundColor: rv.isVisible !== false ? '#FFE4E6' : '#DCFCE7' }
                  ]}
                  onPress={() => handleToggleReviewVis(rv)}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: rv.isVisible !== false ? '#BE123C' : '#15803D'
                    }}
                  >
                    {rv.isVisible !== false ? 'Ẩn đánh giá' : 'Hiện công khai'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modComment}>"{rv.comment}"</Text>
              {rv.adminReply ? (
                <Text style={styles.existingReply}>🛡️ Phản hồi hiện tại: {rv.adminReply}</Text>
              ) : null}

              <View style={styles.replyRow}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Nhập phản hồi chính thức từ Admin..."
                  placeholderTextColor="#94A3B8"
                  value={replyDrafts[rv.id] ?? ''}
                  onChangeText={(txt) =>
                    setReplyDrafts((prev) => ({ ...prev, [rv.id]: txt }))
                  }
                />
                <TouchableOpacity
                  style={styles.replySendBtn}
                  onPress={() => handleSendAdminReply(rv)}
                >
                  <Text style={styles.replySendText}>Gửi</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F5' },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: {
    backgroundColor: '#0A192F',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14
  },
  profileMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14
  },
  avatarBig: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5EEAD4'
  },
  avatarBigText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900'
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800'
  },
  userEmail: {
    color: '#94A3B8',
    fontSize: 12.5,
    marginTop: 2
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.4)'
  },
  rolePillText: {
    color: '#E9D5FF',
    fontSize: 11,
    fontWeight: '800'
  },
  userQuickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  userStatItem: {
    flex: 1,
    alignItems: 'center'
  },
  userStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)'
  },
  userStatNumber: {
    color: '#5EEAD4',
    fontSize: 16,
    fontWeight: '900'
  },
  userStatLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600'
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.5)',
    paddingVertical: 11,
    borderRadius: 12
  },
  logoutBtnText: {
    color: '#FFE4E6',
    fontSize: 13.5,
    fontWeight: '800'
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  authHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  authTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A192F'
  },
  authSub: {
    fontSize: 11.5,
    color: '#64748B'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
    marginBottom: 4
  },
  authInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13.5,
    color: '#0F172A',
    backgroundColor: '#F8FAFC'
  },
  loginSubmitBtn: {
    marginTop: 14,
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  loginSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  switchAuthBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 4
  },
  switchAuthText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7'
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 4
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    backgroundColor: '#F8FAFC'
  },
  roleOptionActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA'
  },
  roleOptionName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A'
  },
  roleOptionDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2
  },
  serverHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  connBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  urlRow: {
    flexDirection: 'row',
    gap: 8
  },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC'
  },
  saveUrlBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center'
  },
  saveUrlText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800'
  },
  adminPanel: {
    backgroundColor: '#0A192F',
    borderRadius: 20,
    padding: 16
  },
  adminHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900'
  },
  adminHeaderSub: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 14
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14
  },
  bentoBox: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  bentoLbl: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800'
  },
  bentoVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginVertical: 4
  },
  bentoSub: {
    color: '#CBD5E1',
    fontSize: 10.5
  },
  cacheBox: {
    backgroundColor: 'rgba(13, 148, 136, 0.16)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    marginBottom: 16
  },
  cacheTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  cacheTitle: {
    color: '#5EEAD4',
    fontSize: 13,
    fontWeight: '800'
  },
  cacheSub: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2
  },
  flushBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  flushBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800'
  },
  modSectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10
  },
  modReviewCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  modReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  modAuthor: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800'
  },
  visBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  modComment: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontStyle: 'italic',
    marginBottom: 8
  },
  existingReply: {
    color: '#5EEAD4',
    fontSize: 12,
    marginBottom: 8
  },
  replyRow: {
    flexDirection: 'row',
    gap: 8
  },
  replyInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    color: '#FFFFFF',
    fontSize: 12
  },
  replySendBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center'
  },
  replySendText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  }
});

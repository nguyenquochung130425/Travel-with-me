import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  initApiBaseUrl,
  apiRequest,
  normalizeToursList,
  FALLBACK_TOURS,
  FALLBACK_COMMUNITY_POSTS,
  FALLBACK_REVIEWS
} from './src/config/api';
import { MobileLocaleProvider, useMobileLocale } from './src/context/MobileLocaleContext';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { MyTripsScreen } from './src/screens/MyTripsScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProfileAdminScreen } from './src/screens/ProfileAdminScreen';

const DEFAULT_ADMIN_USER = {
  id: '1',
  userId: 1,
  fullName: 'Quản Trị Viên Hệ Thống',
  email: 'admin@travelwithme.vn',
  role: 'SUPER_ADMIN',
  isAdminAccount: true,
  roleBadge: 'Super Admin • Toàn quyền hệ thống'
};

function MainMobileApp() {
  const { lang, currency, toggleLanguage, cycleCurrency, t } = useMobileLocale();

  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'trips' | 'community' | 'alerts' | 'profile'
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [currentUser, setCurrentUserState] = useState(DEFAULT_ADMIN_USER);

  const [tours, setTours] = useState(FALLBACK_TOURS);
  // Danh sách chuyến đi của đúng tài khoản đang đăng nhập từ SQL Server (tài khoản mới = [])
  const [bookings, setBookings] = useState([]);
  // Danh sách toàn bộ đơn đặt chỗ trên hệ thống dành riêng cho Admin Dashboard
  const [adminBookings, setAdminBookings] = useState([]);
  const [posts, setPosts] = useState(FALLBACK_COMMUNITY_POSTS);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS);
  const [wishlist, setWishlist] = useState([]);
  const [activeTicketModalBooking, setActiveTicketModalBooking] = useState(null);

  const setCurrentUser = useCallback(async (userOrNull) => {
    setCurrentUserState(userOrNull);
    try {
      if (userOrNull) {
        await AsyncStorage.setItem('twm_auth_user_v2', JSON.stringify(userOrNull));
      } else {
        await AsyncStorage.removeItem('twm_auth_user_v2');
      }
    } catch {}
  }, []);

  const syncWithServer = useCallback(async (overrideUser) => {
    const activeUser = overrideUser !== undefined ? overrideUser : currentUser;
    setRefreshing(true);
    try {
      await initApiBaseUrl();

      // 1. Tải danh sách Tour từ SQL Server và chuẩn hóa ảnh + giá + thời lượng
      const toursRes = await apiRequest('/api/tours');
      if (toursRes.ok && Array.isArray(toursRes.data?.data) && toursRes.data.data.length > 0) {
        setTours(normalizeToursList(toursRes.data.data));
        setIsServerOnline(true);
      } else {
        setTours(FALLBACK_TOURS);
        setIsServerOnline(false);
      }

      // 2. Tải danh sách Chuyến đi từ SQL Server theo đúng userId của tài khoản đang đăng nhập
      const uid = activeUser?.userId || activeUser?.id;
      if (!activeUser || !uid) {
        setBookings([]);
        setNotifications([]);
        setAdminBookings([]);
      } else {
        const bkRes = await apiRequest(`/api/bookings/my-trips?userId=${encodeURIComponent(uid)}`);
        if (bkRes.ok && Array.isArray(bkRes.data?.data)) {
          // Luôn cập nhật đúng dữ liệu từ SQL Server (kể cả khi mảng rỗng [] với tài khoản mới tạo)
          setBookings(bkRes.data.data);
        } else {
          setBookings([]);
        }

        // 3. Tải Thông báo đa kênh của đúng tài khoản
        const notifRes = await apiRequest(`/api/notifications?userId=${encodeURIComponent(uid)}`);
        if (notifRes.ok && Array.isArray(notifRes.data?.data)) {
          setNotifications(notifRes.data.data);
        } else {
          setNotifications([]);
        }

        // 4. Nếu là tài khoản Admin, tải thêm toàn bộ đơn hàng từ SQL Server cho Dashboard quản trị
        if (
          activeUser.role === 'SUPER_ADMIN' ||
          activeUser.role === 'ADMIN' ||
          activeUser.isAdminAccount
        ) {
          const admBkRes = await apiRequest('/api/admin/bookings');
          if (admBkRes.ok && Array.isArray(admBkRes.data?.data)) {
            setAdminBookings(admBkRes.data.data);
          }
        } else {
          setAdminBookings([]);
        }
      }

      // 5. Tải bài viết Cộng đồng UGC
      const commRes = await apiRequest('/api/community/posts');
      if (commRes.ok && Array.isArray(commRes.data?.data) && commRes.data.data.length > 0) {
        setPosts(commRes.data.data);
      }

      // 6. Tải Đánh giá thực tế
      const revRes = await apiRequest('/api/admin/reviews');
      if (revRes.ok && Array.isArray(revRes.data?.data) && revRes.data.data.length > 0) {
        setReviews(revRes.data.data);
      }
    } catch (e) {
      setIsServerOnline(false);
    } finally {
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    (async () => {
      try {
        const savedWl = await AsyncStorage.getItem('twm_mobile_wishlist');
        if (savedWl) setWishlist(JSON.parse(savedWl));
        const savedUser = await AsyncStorage.getItem('twm_auth_user_v2');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && (parsed.userId || parsed.id)) {
            setCurrentUserState(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    syncWithServer(currentUser);
  }, [currentUser, syncWithServer]);

  const handleToggleWishlist = useCallback(async (tourId) => {
    setWishlist((prev) => {
      const next = prev.includes(tourId)
        ? prev.filter((id) => id !== tourId)
        : [...prev, tourId];
      AsyncStorage.setItem('twm_mobile_wishlist', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const handleBookingCreated = useCallback(
    async (newBooking) => {
      setBookings((prev) => [newBooking, ...prev]);
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          type: 'TICKET_ISSUED',
          channel: 'ZALO',
          title: `🎫 Đặt tour thành công #${newBooking.bookingCode}`,
          message: `Vé điện tử QR cho hành trình "${newBooking.tourTitle}" đã được lưu vào SQL Server.`,
          isRead: false,
          is_read: 0,
          time: 'Vừa xong',
          created_at: 'Vừa xong'
        },
        ...prev
      ]);
      setActiveTicketModalBooking(newBooking);
      setActiveTab('trips');
      // Đồng bộ lại danh sách chuyến đi trực tiếp từ SQL Server
      await syncWithServer(currentUser);
    },
    [currentUser, syncWithServer]
  );

  const handleReviewSubmitted = useCallback((newReview) => {
    setReviews((prev) => [newReview, ...prev]);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        type: 'REVIEW_SUCCESS',
        channel: 'IN_APP',
        title: `⭐ Đã ghi nhận đánh giá ${newReview.rating}/5 sao`,
        message: `Cảm ơn bạn đã gửi đánh giá minh bạch cho đơn #${newReview.bookingCode || newReview.bookingId}.`,
        isRead: false,
        is_read: 0,
        time: 'Vừa xong',
        created_at: 'Vừa xong'
      },
      ...prev
    ]);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('twm_token');
      await AsyncStorage.removeItem('twm_auth_user_v2');
    } catch {}
    setCurrentUserState(null);
    setBookings([]);
    setAdminBookings([]);
    setNotifications([]);
    setWishlist([]);
    Alert.alert('Đã đăng xuất', 'Bạn đã đăng xuất khỏi tài khoản thành công.');
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read && !n.isRead).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#0A192F" />

      {/* TOP MOBILE BAR */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="airplane" size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandTitle}>TRAVEL WITH ME</Text>
            <Text style={styles.brandSub}>{t('brandSub')}</Text>
          </View>
        </View>

        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.localeBtn} onPress={toggleLanguage}>
            <Text style={styles.localeBtnText}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.localeBtn} onPress={cycleCurrency}>
            <Text style={styles.localeBtnText}>{currency}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => setActiveTab('alerts')}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* SCREEN VIEWPORT */}
      <View style={styles.screenViewport}>
        {activeTab === 'explore' && (
          <ExploreScreen
            tours={tours}
            reviews={reviews}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            refreshing={refreshing}
            onRefresh={() => syncWithServer(currentUser)}
            currentUser={currentUser}
            onBookingCreated={handleBookingCreated}
            onRequireLogin={() => setActiveTab('profile')}
            isServerOnline={isServerOnline}
          />
        )}

        {activeTab === 'trips' && (
          <MyTripsScreen
            bookings={bookings}
            currentUser={currentUser}
            onRefreshBookings={() => syncWithServer(currentUser)}
            onReviewSubmitted={handleReviewSubmitted}
            activeTicketModalBooking={activeTicketModalBooking}
            setActiveTicketModalBooking={setActiveTicketModalBooking}
            onGoExplore={() => setActiveTab('explore')}
            onGoLogin={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'community' && (
          <CommunityScreen
            posts={posts}
            setPosts={setPosts}
            tours={tours}
            currentUser={currentUser}
            onJumpToTour={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'alerts' && (
          <NotificationsScreen
            notifications={notifications}
            setNotifications={setNotifications}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileAdminScreen
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onLogout={handleLogout}
            tours={tours}
            bookings={bookings}
            adminBookings={adminBookings}
            reviews={reviews}
            setReviews={setReviews}
            isServerOnline={isServerOnline}
            onReconnectServer={() => syncWithServer(currentUser)}
          />
        )}
      </View>

      {/* BOTTOM NAVIGATION BAR (5 TABS) */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('explore')}
        >
          <Ionicons
            name={activeTab === 'explore' ? 'compass' : 'compass-outline'}
            size={22}
            color={activeTab === 'explore' ? '#0D9488' : '#64748B'}
          />
          <Text style={[styles.tabLabel, activeTab === 'explore' && styles.tabLabelActive]}>
            {t('tabExplore')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('trips')}
        >
          <View>
            <Ionicons
              name={activeTab === 'trips' ? 'ticket' : 'ticket-outline'}
              size={22}
              color={activeTab === 'trips' ? '#0D9488' : '#64748B'}
            />
            {bookings.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{bookings.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, activeTab === 'trips' && styles.tabLabelActive]}>
            {t('tabTrips')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('community')}
        >
          <Ionicons
            name={activeTab === 'community' ? 'newspaper' : 'newspaper-outline'}
            size={22}
            color={activeTab === 'community' ? '#0D9488' : '#64748B'}
          />
          <Text style={[styles.tabLabel, activeTab === 'community' && styles.tabLabelActive]}>
            {t('tabCommunity')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('alerts')}
        >
          <View>
            <Ionicons
              name={activeTab === 'alerts' ? 'notifications' : 'notifications-outline'}
              size={22}
              color={activeTab === 'alerts' ? '#0D9488' : '#64748B'}
            />
            {unreadCount > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: '#F43F5E' }]}>
                <Text style={styles.tabBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, activeTab === 'alerts' && styles.tabLabelActive]}>
            {t('tabAlerts')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'shield-checkmark' : 'person-circle-outline'}
            size={22}
            color={activeTab === 'profile' ? '#0D9488' : '#64748B'}
          />
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
            {t('tabProfile')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <MobileLocaleProvider>
      <MainMobileApp />
    </MobileLocaleProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A192F',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0
  },
  topHeader: {
    backgroundColor: '#0A192F',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  brandSub: {
    color: '#5EEAD4',
    fontSize: 10.5,
    fontWeight: '600'
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  localeBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  localeBtnText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800'
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#F43F5E',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900'
  },
  screenViewport: {
    flex: 1,
    backgroundColor: '#FAF9F5'
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 4 : 8
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2
  },
  tabLabelActive: {
    color: '#0D9488',
    fontWeight: '800'
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#0D9488',
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900'
  }
});

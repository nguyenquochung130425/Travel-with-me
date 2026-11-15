import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileLocale } from '../context/MobileLocaleContext';
import { apiRequest } from '../config/api';

const CATEGORIES = [
  { id: 'all', name: 'Tất cả' },
  { id: 'cat-beach', name: 'Biển Đảo & Du Thuyền' },
  { id: 'cat-mountain', name: 'Núi Rừng Tây Bắc' },
  { id: 'cat-heritage', name: 'Di Sản Miền Trung' }
];

const COUPONS = {
  WELCOME2026: { code: 'WELCOME2026', discountPercent: 10, desc: 'Giảm 10% cho khách đặt qua Mobile App' },
  SUMMER500K: { code: 'SUMMER500K', discountAmount: 500000, desc: 'Giảm trực tiếp 500.000đ cho đơn từ 3 triệu' }
};

export function ExploreScreen({
  tours,
  reviews,
  wishlist,
  onToggleWishlist,
  refreshing,
  onRefresh,
  currentUser,
  onBookingCreated,
  onRequireLogin,
  isServerOnline
}) {
  const { formatPrice, t } = useMobileLocale();
  const [keyword, setKeyword] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [onlyWishlist, setOnlyWishlist] = useState(false);

  // Modals
  const [selectedTour, setSelectedTour] = useState(null);
  const [bookingTour, setBookingTour] = useState(null);

  // Booking Form State
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [departureDate, setDepartureDate] = useState('2026-11-28');
  const [customerName, setCustomerName] = useState(currentUser?.fullName || 'Nguyễn Quốc Hùng');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '0912345678');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || 'hung@example.com');
  const [couponInput, setCouponInput] = useState('WELCOME2026');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      if (onlyWishlist && !wishlist.includes(tour.id)) return false;
      if (selectedCat !== 'all' && tour.categoryId !== selectedCat) {
        const catName = (tour.categoryName || '').toLowerCase();
        if (selectedCat === 'cat-beach' && !catName.includes('biển') && !catName.includes('đảo')) return false;
        if (selectedCat === 'cat-mountain' && !catName.includes('núi') && !catName.includes('tây bắc')) return false;
        if (selectedCat === 'cat-heritage' && !catName.includes('di sản') && !catName.includes('miền trung')) return false;
      }
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        const matchTitle = (tour.title || '').toLowerCase().includes(kw);
        const matchDest = (tour.destinationCity || '').toLowerCase().includes(kw);
        const matchDep = (tour.departureCity || '').toLowerCase().includes(kw);
        if (!matchTitle && !matchDest && !matchDep) return false;
      }
      return true;
    });
  }, [tours, onlyWishlist, wishlist, selectedCat, keyword]);

  const tourReviews = useMemo(() => {
    if (!selectedTour) return [];
    return (reviews || []).filter(
      (r) =>
        r.isVisible !== false &&
        (r.tourId === selectedTour.id ||
          (r.tourTitle && selectedTour.title && r.tourTitle.includes(selectedTour.title.slice(0, 14))))
    );
  }, [selectedTour, reviews]);

  const handleOpenBooking = (tour) => {
    const uid = currentUser?.userId || currentUser?.id;
    if (!currentUser || !uid) {
      setSelectedTour(null);
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập hoặc tạo tài khoản trước khi đặt vé để lưu chuyến đi vào SQL Server.',
        [
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Đăng nhập ngay',
            onPress: () => onRequireLogin && onRequireLogin()
          }
        ]
      );
      return;
    }
    setSelectedTour(null);
    setBookingTour(tour);
    setAdults(2);
    setChildrenCount(0);
    setDepartureDate(tour.schedules?.[0]?.departureDate || '2026-11-28');
    setCustomerName(currentUser?.fullName || '');
    setCustomerEmail(currentUser?.email || '');
    setCustomerPhone(currentUser?.phone || '0912345678');
  };

  const computeTotal = () => {
    if (!bookingTour) return { subtotal: 0, discount: 0, finalTotal: 0 };
    const unitPrice = Number(bookingTour.price) || 3000000;
    const subtotal = adults * unitPrice + childrenCount * Math.round(unitPrice * 0.7);
    let discount = 0;
    const code = couponInput.trim().toUpperCase();
    if (COUPONS[code]) {
      if (COUPONS[code].discountPercent) {
        discount = Math.round((subtotal * COUPONS[code].discountPercent) / 100);
      } else if (COUPONS[code].discountAmount && subtotal >= 3000000) {
        discount = COUPONS[code].discountAmount;
      }
    }
    return {
      subtotal,
      discount,
      finalTotal: Math.max(0, subtotal - discount)
    };
  };

  const handleConfirmBooking = async () => {
    const uid = currentUser?.userId || currentUser?.id;
    if (!currentUser || !uid) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập tài khoản để đặt tour.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại liên hệ.');
      return;
    }

    const { subtotal, discount, finalTotal } = computeTotal();
    setSubmittingBooking(true);

    const firstSchedule = bookingTour.schedules?.[0];
    const payload = {
      userId: Number(uid) || uid,
      tourId: bookingTour.id,
      scheduleId: firstSchedule?.id || null,
      numAdults: adults,
      numChildren: childrenCount,
      numInfants: 0,
      contactName: customerName.trim(),
      contactPhone: customerPhone.trim(),
      contactEmail: (customerEmail || currentUser?.email || '').trim(),
      couponCode: couponInput.trim().toUpperCase(),
      paymentMethod: 'VIETQR',
      baseAmount: subtotal,
      discountAmount: discount,
      finalAmount: finalTotal
    };

    const res = await apiRequest('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setSubmittingBooking(false);
    if (res.ok && res.data?.data) {
      setBookingTour(null);
      onBookingCreated && onBookingCreated(res.data.data);
    } else {
      Alert.alert(
        'Không thể đặt tour',
        res.data?.message || 'Vui lòng kiểm tra kết nối máy chủ SQL Server và thử lại.'
      );
    }
  };

  const renderTourItem = ({ item }) => {
    const isLiked = wishlist.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.tourCard}
        activeOpacity={0.9}
        onPress={() => setSelectedTour(item)}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: item.image || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80' }}
            style={styles.tourImage}
          />
          <View style={styles.badgeTopRow}>
            <View style={styles.categoryPill}>
              <Ionicons name="compass" size={12} color="#CCFBF1" />
              <Text style={styles.categoryPillText}>{item.categoryName || 'Tour Cao Cấp'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.wishlistBtn, isLiked && styles.wishlistBtnActive]}
              onPress={() => onToggleWishlist(item.id)}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={isLiked ? '#F43F5E' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating || 4.9}</Text>
            <Text style={styles.reviewCountText}>({item.reviewsCount || 48})</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#0D9488" />
              <Text style={styles.metaText}>{item.departureCity} → {item.destinationCity}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
          </View>

          <Text style={styles.tourTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.tourSummary} numberOfLines={2}>
            {item.summary}
          </Text>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.priceLabel}>Giá trọn gói / khách</Text>
              <Text style={styles.priceValue}>{formatPrice(item.price)}</Text>
            </View>
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => handleOpenBooking(item)}
            >
              <Text style={styles.bookBtnText}>{t('bookNow')}</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const { subtotal, discount, finalTotal } = computeTotal();

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTours}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTourItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D9488" />
        }
        ListHeaderComponent={
          <View>
            {/* Hero Banner */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.liveServerBadge}>
                  <View style={[styles.pulseDot, { backgroundColor: isServerOnline ? '#34D399' : '#FBBF24' }]} />
                  <Text style={styles.liveServerText}>
                    {isServerOnline ? 'SQL SERVER LIVE • FASTCACHE' : 'EXPO GO SMART FALLBACK'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.wishlistFilterChip, onlyWishlist && styles.wishlistFilterChipActive]}
                  onPress={() => setOnlyWishlist(!onlyWishlist)}
                >
                  <Ionicons name="heart" size={13} color={onlyWishlist ? '#FFFFFF' : '#FDA4AF'} />
                  <Text style={styles.wishlistFilterText}>Yêu thích ({wishlist.length})</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.heroTitle}>Hành Trình Đẳng Cấp Cùng Travel With Me</Text>
              <Text style={styles.heroSub}>
                Đặt tour trực tuyến, nhận vé QR tức thì & chia sẻ nhật ký du lịch trên Expo Go
              </Text>

              {/* Search Box */}
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('searchPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  value={keyword}
                  onChangeText={setKeyword}
                />
                {keyword.length > 0 && (
                  <TouchableOpacity onPress={() => setKeyword('')}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {CATEGORIES.map((cat) => {
                const active = selectedCat === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => setSelectedCat(cat.id)}
                  >
                    <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.resultHeaderRow}>
              <Text style={styles.resultCountText}>
                Hiển thị {filteredTours.length} hành trình精选
              </Text>
              <Text style={styles.pullHintText}>Vuốt xuống để đồng bộ SQL</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="compass-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Không tìm thấy tour phù hợp</Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setKeyword('');
                setSelectedCat('all');
                setOnlyWishlist(false);
              }}
            >
              <Text style={styles.resetBtnText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* MODAL 1: CHI TIẾT TOUR & ĐÁNH GIÁ MINH BẠCH */}
      <Modal
        visible={!!selectedTour}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedTour(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedTour && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                    Chi Tiết Hành Trình
                  </Text>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedTour(null)}
                  >
                    <Ionicons name="close" size={22} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <Image
                    source={{ uri: selectedTour.image }}
                    style={styles.detailHeroImage}
                  />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailTitle}>{selectedTour.title}</Text>
                    <Text style={styles.detailPrice}>{formatPrice(selectedTour.price)} / khách</Text>
                    <Text style={styles.detailSummary}>{selectedTour.summary}</Text>

                    {/* Điểm nổi bật */}
                    {selectedTour.highlights && selectedTour.highlights.length > 0 && (
                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionHeading}>✨ Điểm nổi bật của hành trình</Text>
                        {selectedTour.highlights.map((hl, idx) => (
                          <View key={idx} style={styles.highlightRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#0D9488" />
                            <Text style={styles.highlightText}>{hl}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Lịch trình chi tiết */}
                    {selectedTour.itinerary && selectedTour.itinerary.length > 0 && (
                      <View style={styles.sectionBox}>
                        <Text style={styles.sectionHeading}>🗓️ Lịch trình từng ngày</Text>
                        {selectedTour.itinerary.map((it, idx) => (
                          <View key={idx} style={styles.itineraryCard}>
                            <Text style={styles.itineraryDay}>Ngày {it.day}: {it.title}</Text>
                            <Text style={styles.itineraryDesc}>{it.desc}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Đánh giá xác thực từ khách đã COMPLETED */}
                    <View style={styles.sectionBox}>
                      <Text style={styles.sectionHeading}>
                        ⭐ Đánh giá thực tế từ khách hàng ({tourReviews.length})
                      </Text>
                      {tourReviews.length === 0 ? (
                        <Text style={styles.emptyReviewText}>
                          Chưa có đánh giá nào cho tour này. Chỉ khách hàng có đơn COMPLETED mới được gửi đánh giá.
                        </Text>
                      ) : (
                        tourReviews.map((rv, idx) => (
                          <View key={idx} style={styles.reviewItem}>
                            <View style={styles.reviewItemHeader}>
                              <Text style={styles.reviewAuthor}>{rv.authorName}</Text>
                              <View style={styles.verifiedBadge}>
                                <Ionicons name="shield-checkmark" size={12} color="#047857" />
                                <Text style={styles.verifiedBadgeText}>
                                  Đơn COMPLETED #{rv.bookingCode || rv.bookingId}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.reviewStars}>
                              {'★'.repeat(Number(rv.rating) || 5)} ({rv.rating}/5)
                            </Text>
                            <Text style={styles.reviewComment}>{rv.comment}</Text>

                            {rv.adminReply ? (
                              <View style={styles.adminReplyBox}>
                                <Text style={styles.adminReplyLabel}>
                                  🛡️ Phản hồi chính thức từ Travel With Me:
                                </Text>
                                <Text style={styles.adminReplyText}>{rv.adminReply}</Text>
                              </View>
                            ) : null}
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooterBar}>
                  <View>
                    <Text style={styles.footerPriceLabel}>Giá ưu đãi</Text>
                    <Text style={styles.footerPriceVal}>{formatPrice(selectedTour.price)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.primaryCtaBtn}
                    onPress={() => handleOpenBooking(selectedTour)}
                  >
                    <Text style={styles.primaryCtaText}>Đặt Tour Này Ngay</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ĐẶT TOUR & THANH TOÁN VIETQR */}
      <Modal
        visible={!!bookingTour}
        animationType="slide"
        transparent
        onRequestClose={() => setBookingTour(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {bookingTour && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>Đặt Chỗ & Phát Hành Vé QR</Text>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setBookingTour(null)}
                  >
                    <Ionicons name="close" size={22} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.detailContent}>
                    <Text style={styles.bookingTourName}>{bookingTour.title}</Text>

                    <Text style={styles.inputLabel}>Ngày khởi hành</Text>
                    <TextInput
                      style={styles.textInput}
                      value={departureDate}
                      onChangeText={setDepartureDate}
                      placeholder="YYYY-MM-DD"
                    />

                    {/* Số lượng hành khách */}
                    <View style={styles.counterRow}>
                      <View>
                        <Text style={styles.counterTitle}>Người lớn (100% giá)</Text>
                        <Text style={styles.counterSub}>{formatPrice(bookingTour.price)} / khách</Text>
                      </View>
                      <View style={styles.counterBtns}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setAdults(Math.max(1, adults - 1))}
                        >
                          <Text style={styles.stepBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepVal}>{adults}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setAdults(adults + 1)}
                        >
                          <Text style={styles.stepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.counterRow}>
                      <View>
                        <Text style={styles.counterTitle}>Trẻ em (70% giá)</Text>
                        <Text style={styles.counterSub}>Từ 5 - 11 tuổi</Text>
                      </View>
                      <View style={styles.counterBtns}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                        >
                          <Text style={styles.stepBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepVal}>{childrenCount}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => setChildrenCount(childrenCount + 1)}
                        >
                          <Text style={styles.stepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.inputLabel}>Họ và tên người đặt</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customerName}
                      onChangeText={setCustomerName}
                    />

                    <Text style={styles.inputLabel}>Số điện thoại nhận vé Zalo ZNS / SMS</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customerPhone}
                      onChangeText={setCustomerPhone}
                      keyboardType="phone-pad"
                    />

                    <Text style={styles.inputLabel}>Mã giảm giá (Thử: WELCOME2026 hoặc SUMMER500K)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={couponInput}
                      onChangeText={setCouponInput}
                      autoCapitalize="characters"
                    />

                    <View style={styles.summaryCard}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLbl}>Tạm tính ({adults} NL, {childrenCount} TE):</Text>
                        <Text style={styles.summaryVal}>{formatPrice(subtotal)}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLbl}>Ưu đãi Coupon:</Text>
                        <Text style={[styles.summaryVal, { color: '#10B981' }]}>
                          -{formatPrice(discount)}
                        </Text>
                      </View>
                      <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                        <Text style={styles.summaryTotalLbl}>Tổng thanh toán:</Text>
                        <Text style={styles.summaryTotalVal}>{formatPrice(finalTotal)}</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooterBar}>
                  <View>
                    <Text style={styles.footerPriceLabel}>Tổng cộng</Text>
                    <Text style={styles.footerPriceVal}>{formatPrice(finalTotal)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.primaryCtaBtn}
                    onPress={handleConfirmBooking}
                    disabled={submittingBooking}
                  >
                    <Text style={styles.primaryCtaText}>
                      {submittingBooking ? 'Đang xử lý...' : 'Xác Nhận & Nhận Vé QR'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F5' },
  listContent: { padding: 16, paddingBottom: 32 },
  heroCard: {
    backgroundColor: '#0A192F',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0A192F',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  liveServerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6
  },
  liveServerText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  wishlistFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(244,63,94,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.35)'
  },
  wishlistFilterChipActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48'
  },
  wishlistFilterText: {
    color: '#FFE4E6',
    fontSize: 11,
    fontWeight: '700'
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 4
  },
  heroSub: {
    color: '#94A3B8',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A'
  },
  catScroll: {
    paddingBottom: 12,
    gap: 8
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8
  },
  catChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488'
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  catChipTextActive: {
    color: '#FFFFFF'
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  resultCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  pullHintText: {
    fontSize: 11,
    color: '#64748B'
  },
  tourCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3
  },
  imageWrap: {
    height: 185,
    position: 'relative'
  },
  tourImage: {
    width: '100%',
    height: '100%'
  },
  badgeTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10, 25, 47, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999
  },
  categoryPillText: {
    color: '#CCFBF1',
    fontSize: 11,
    fontWeight: '700'
  },
  wishlistBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  wishlistBtnActive: {
    backgroundColor: '#FFE4E6'
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  reviewCountText: {
    color: '#CBD5E1',
    fontSize: 11
  },
  cardBody: {
    padding: 15
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600'
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A192F',
    lineHeight: 22,
    marginBottom: 6
  },
  tourSummary: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748B'
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0D9488'
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#475569'
  },
  resetBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0D9488',
    borderRadius: 10
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.65)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A192F'
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalScroll: {
    maxHeight: 520
  },
  detailHeroImage: {
    width: '100%',
    height: 200
  },
  detailContent: {
    padding: 18
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 6
  },
  detailPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D9488',
    marginBottom: 10
  },
  detailSummary: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 14
  },
  sectionBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 10
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19
  },
  itineraryCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  itineraryDay: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  itineraryDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18
  },
  emptyReviewText: {
    fontSize: 12.5,
    color: '#64748B',
    fontStyle: 'italic'
  },
  reviewItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4
  },
  reviewAuthor: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A'
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  verifiedBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#047857'
  },
  reviewStars: {
    color: '#F59E0B',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 4
  },
  reviewComment: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18
  },
  adminReplyBox: {
    marginTop: 8,
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    padding: 10,
    borderRadius: 8
  },
  adminReplyLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: 2
  },
  adminReplyText: {
    fontSize: 12.5,
    color: '#1E293B',
    lineHeight: 17
  },
  modalFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF'
  },
  footerPriceLabel: {
    fontSize: 11,
    color: '#64748B'
  },
  footerPriceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D9488'
  },
  primaryCtaBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  bookingTourName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC'
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  counterTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A'
  },
  counterSub: {
    fontSize: 11.5,
    color: '#64748B'
  },
  counterBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  stepVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: 20,
    textAlign: 'center'
  },
  summaryCard: {
    marginTop: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  summaryLbl: {
    fontSize: 13,
    color: '#475569'
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  summaryTotalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0'
  },
  summaryTotalLbl: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46'
  },
  summaryTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669'
  }
});


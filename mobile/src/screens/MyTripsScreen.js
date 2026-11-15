import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMobileLocale } from '../context/MobileLocaleContext';
import { apiRequest } from '../config/api';

const PRESET_REVIEW_PHOTOS = [
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=500&q=80'
];

export function MyTripsScreen({
  bookings,
  currentUser,
  onRefreshBookings,
  onReviewSubmitted,
  activeTicketModalBooking,
  setActiveTicketModalBooking,
  onGoExplore,
  onGoLogin
}) {
  const { formatPrice, t } = useMobileLocale();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('Hành trình tuyệt vời, hướng dẫn viên chu đáo và dịch vụ đúng chuẩn 5 sao!');
  const [selectedPhotos, setSelectedPhotos] = useState([PRESET_REVIEW_PHOTOS[0]]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === 'ALL') return true;
    return (b.status || '').toUpperCase() === filterStatus;
  });

  const handleOpenReview = (booking) => {
    const st = (booking.status || '').toUpperCase();
    if (st !== 'COMPLETED') {
      Alert.alert(
        'Chính sách Đánh giá Minh bạch',
        'Chỉ những chuyến đi ở trạng thái ĐÃ HOÀN THÀNH (COMPLETED) mới được phép gửi đánh giá nhằm ngăn chặn đánh giá ảo.'
      );
      return;
    }
    setReviewTarget(booking);
    setRating(5);
    setComment('Hành trình tuyệt vời, hướng dẫn viên chu đáo và dịch vụ đúng chuẩn 5 sao!');
    setSelectedPhotos([PRESET_REVIEW_PHOTOS[0]]);
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget) return;
    if (!comment.trim()) {
      Alert.alert('Thiếu nội dung', 'Vui lòng nhập nhận xét của bạn về chuyến đi.');
      return;
    }

    setSubmittingReview(true);
    const payload = {
      bookingId: reviewTarget.bookingCode || reviewTarget.id,
      tourId: reviewTarget.tourId,
      tourTitle: reviewTarget.tourTitle,
      userId: currentUser?.userId || currentUser?.id,
      authorName:
        reviewTarget.contactName ||
        reviewTarget.customerName ||
        currentUser?.fullName ||
        'Khách hàng',
      rating,
      comment: comment.trim(),
      photos: selectedPhotos
    };

    const res = await apiRequest('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setSubmittingReview(false);

    if (!res.ok && res.status === 403) {
      Alert.alert('Từ chối đánh giá', res.data?.message || 'Chỉ đơn COMPLETED mới được gửi đánh giá.');
      return;
    }

    const newReview = res.ok && res.data?.data
      ? res.data.data
      : {
        ...payload,
        id: Date.now(),
        bookingCode: payload.bookingId,
        isVisible: true,
        date: new Date().toISOString().slice(0, 10)
      };

    setReviewTarget(null);
    onReviewSubmitted && onReviewSubmitted(newReview);
    Alert.alert('Thành công ⭐', 'Cảm ơn bạn đã gửi đánh giá xác thực cho chuyến đi!');
  };

  const togglePhoto = (url) => {
    if (selectedPhotos.includes(url)) {
      setSelectedPhotos(selectedPhotos.filter((p) => p !== url));
    } else {
      setSelectedPhotos([...selectedPhotos, url]);
    }
  };

  const getStatusStyle = (status) => {
    const st = (status || '').toUpperCase();
    if (st === 'COMPLETED') return { bg: '#DCFCE7', text: '#15803D', label: 'ĐÃ HOÀN THÀNH (COMPLETED)' };
    if (st === 'CONFIRMED' || st === 'PAID') return { bg: '#E0F2FE', text: '#0369A1', label: 'ĐÃ XÁC NHẬN VÉ QR' };
    if (st === 'CANCELLED') return { bg: '#FFE4E6', text: '#BE123C', label: 'ĐÃ HỦY' };
    return { bg: '#FEF3C7', text: '#B45309', label: st || 'CHỜ XỬ LÝ' };
  };

  const renderBookingCard = ({ item }) => {
    const badge = getStatusStyle(item.status);
    const isCompleted = (item.status || '').toUpperCase() === 'COMPLETED';
    const code = item.bookingCode || item.id;
    const adultCount = item.numAdults ?? item.adults ?? 1;
    const childCount = item.numChildren ?? item.children ?? 0;
    const totalPay = Number(item.finalAmount ?? item.totalAmount ?? item.totalPrice) || 0;

    return (
      <View style={styles.tripCard}>
        <View style={styles.tripTopRow}>
          <View style={styles.codePill}>
            <Ionicons name="qr-code-outline" size={13} color="#0D9488" />
            <Text style={styles.codeText}>#{code}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <Text style={styles.tripTitle}>{item.tourTitle}</Text>

        <View style={styles.tripInfoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Khởi hành</Text>
            <Text style={styles.infoVal}>{item.departureDate}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Hành khách</Text>
            <Text style={styles.infoVal}>
              {adultCount} NL{childCount > 0 ? `, ${childCount} TE` : ''}
            </Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Tổng thanh toán</Text>
            <Text style={[styles.infoVal, { color: '#0D9488' }]}>
              {formatPrice(totalPay)}
            </Text>
          </View>
        </View>

        {/* Banner bảo chứng đánh giá minh bạch */}
        <View style={[styles.policyBar, isCompleted ? styles.policyBarUnlocked : styles.policyBarLocked]}>
          <Ionicons
            name={isCompleted ? 'shield-checkmark' : 'lock-closed'}
            size={14}
            color={isCompleted ? '#047857' : '#64748B'}
          />
          <Text style={[styles.policyText, isCompleted && { color: '#047857', fontWeight: '700' }]}>
            {isCompleted ? t('verifiedCompleted') : t('lockedReview')}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.qrBtn}
            onPress={() => setActiveTicketModalBooking(item)}
          >
            <Ionicons name="qr-code" size={15} color="#0F172A" />
            <Text style={styles.qrBtnText}>{t('viewTicket')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reviewBtn, !isCompleted && styles.reviewBtnDisabled]}
            onPress={() => handleOpenReview(item)}
          >
            <Ionicons name="star" size={15} color="#FFFFFF" />
            <Text style={styles.reviewBtnText}>{t('writeReview')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {[
          { id: 'ALL', label: 'Tất cả' },
          { id: 'CONFIRMED', label: 'Sắp đi' },
          { id: 'COMPLETED', label: 'Đã hoàn thành' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.filterChip, filterStatus === tab.id && styles.filterChipActive]}
            onPress={() => setFilterStatus(tab.id)}
          >
            <Text style={[styles.filterChipText, filterStatus === tab.id && styles.filterChipTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item, index) => String(item.bookingCode || item.id || index)}
        renderItem={renderBookingCard}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefreshBookings}
        refreshing={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="airplane-outline" size={48} color="#94A3B8" />
            {!currentUser ? (
              <>
                <Text style={styles.emptyTitle}>Bạn chưa đăng nhập tài khoản</Text>
                <Text style={styles.emptySub}>
                  Vui lòng đăng nhập hoặc tạo tài khoản mới để đồng bộ các chuyến đi từ SQL Server.
                </Text>
                {onGoLogin && (
                  <TouchableOpacity style={styles.emptyCtaBtn} onPress={onGoLogin}>
                    <Text style={styles.emptyCtaText}>Đăng Nhập / Tạo Tài Khoản</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>
                  Tài khoản {currentUser.fullName} chưa có chuyến đi nào
                </Text>
                <Text style={styles.emptySub}>
                  Dữ liệu được kết nối trực tiếp với SQL Server (User ID #{currentUser.userId || currentUser.id}). Hãy đặt vé tour đầu tiên của bạn!
                </Text>
                {onGoExplore && (
                  <TouchableOpacity style={styles.emptyCtaBtn} onPress={onGoExplore}>
                    <Text style={styles.emptyCtaText}>Khám Phá & Đặt Tour Ngay</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        }
      />

      {/* MODAL 1: BOARDING PASS E-TICKET QR CODE */}
      <Modal
        visible={!!activeTicketModalBooking}
        animationType="fade"
        transparent
        onRequestClose={() => setActiveTicketModalBooking(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.ticketCard}>
            {activeTicketModalBooking && (
              <>
                <View style={styles.ticketHeader}>
                  <View>
                    <Text style={styles.ticketKicker}>TRAVEL WITH ME • E-BOARDING PASS</Text>
                    <Text style={styles.ticketCode}>
                      #{activeTicketModalBooking.bookingCode || activeTicketModalBooking.id}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeCircle}
                    onPress={() => setActiveTicketModalBooking(null)}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.ticketBody}>
                  <Text style={styles.ticketTourTitle}>{activeTicketModalBooking.tourTitle}</Text>
                  <View style={styles.qrFrame}>
                    <Image
                      source={{
                        uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                          `TWM-PASS|${activeTicketModalBooking.qrCodeToken || activeTicketModalBooking.bookingCode || activeTicketModalBooking.id}|${activeTicketModalBooking.contactName || activeTicketModalBooking.customerName || currentUser?.fullName || ''}`
                        )}`
                      }}
                      style={styles.qrImage}
                    />
                  </View>
                  <Text style={styles.qrHint}>
                    Xuất trình mã QR này trên ứng dụng Expo Go cho Hướng dẫn viên khi lên xe/du thuyền
                  </Text>

                  <View style={styles.ticketMetaBox}>
                    <View style={styles.ticketMetaRow}>
                      <Text style={styles.ticketMetaLbl}>Hành khách:</Text>
                      <Text style={styles.ticketMetaVal}>
                        {activeTicketModalBooking.contactName ||
                          activeTicketModalBooking.customerName ||
                          currentUser?.fullName ||
                          'Khách hàng'}
                      </Text>
                    </View>
                    <View style={styles.ticketMetaRow}>
                      <Text style={styles.ticketMetaLbl}>Ngày khởi hành:</Text>
                      <Text style={styles.ticketMetaVal}>{activeTicketModalBooking.departureDate}</Text>
                    </View>
                    <View style={styles.ticketMetaRow}>
                      <Text style={styles.ticketMetaLbl}>Tổng tiền:</Text>
                      <Text style={[styles.ticketMetaVal, { color: '#0D9488' }]}>
                        {formatPrice(
                          Number(
                            activeTicketModalBooking.finalAmount ??
                              activeTicketModalBooking.totalAmount ??
                              activeTicketModalBooking.totalPrice
                          ) || 0
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: CHẤM SAO & ĐÁNH GIÁ CHUYẾN ĐI ĐÃ COMPLETED */}
      <Modal
        visible={!!reviewTarget}
        animationType="slide"
        transparent
        onRequestClose={() => setReviewTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.reviewSheet}>
            {reviewTarget && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Đánh Giá Chuyến Đi Hoàn Thành</Text>
                  <TouchableOpacity onPress={() => setReviewTarget(null)}>
                    <Ionicons name="close" size={22} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <View style={styles.verifiedBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                  <Text style={styles.verifiedBannerText}>
                    Bảo chứng minh bạch: Đơn #{reviewTarget.bookingCode || reviewTarget.id} đã hoàn thành
                  </Text>
                </View>

                <Text style={styles.reviewTourName}>{reviewTarget.tourTitle}</Text>

                <View style={styles.starSelectRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                      <Ionicons
                        name={s <= rating ? 'star' : 'star-outline'}
                        size={34}
                        color="#F59E0B"
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Chia sẻ trải nghiệm thực tế của bạn:</Text>
                <TextInput
                  style={styles.commentInput}
                  multiline
                  numberOfLines={4}
                  value={comment}
                  onChangeText={setComment}
                />

                <Text style={styles.fieldLabel}>Đính kèm ảnh chụp thực tế chuyến đi:</Text>
                <View style={styles.photoPickerRow}>
                  {PRESET_REVIEW_PHOTOS.map((url, idx) => {
                    const active = selectedPhotos.includes(url);
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.photoOption, active && styles.photoOptionActive]}
                        onPress={() => togglePhoto(url)}
                      >
                        <Image source={{ uri: url }} style={styles.photoThumb} />
                        {active && (
                          <View style={styles.photoCheckBadge}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.submitReviewBtn}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  <Text style={styles.submitReviewBtnText}>
                    {submittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá Xác Thực'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F5' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  filterChipActive: {
    backgroundColor: '#0A192F',
    borderColor: '#0A192F'
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569'
  },
  filterChipTextActive: {
    color: '#FFFFFF'
  },
  listContent: {
    padding: 16,
    paddingBottom: 32
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  tripTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99F6E4'
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800'
  },
  tripTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0A192F',
    marginBottom: 12
  },
  tripInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10
  },
  infoCell: {
    flex: 1
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  policyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 12
  },
  policyBarUnlocked: {
    backgroundColor: '#ECFDF5'
  },
  policyBarLocked: {
    backgroundColor: '#F1F5F9'
  },
  policyText: {
    fontSize: 11.5,
    color: '#64748B'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10
  },
  qrBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  qrBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  reviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0D9488'
  },
  reviewBtnDisabled: {
    backgroundColor: '#94A3B8'
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '800',
    textAlign: 'center'
  },
  emptySub: {
    marginTop: 6,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18
  },
  emptyCtaBtn: {
    marginTop: 16,
    backgroundColor: '#0D9488',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18
  },
  ticketCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden'
  },
  ticketHeader: {
    backgroundColor: '#0A192F',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ticketKicker: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  ticketCode: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2
  },
  closeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ticketBody: {
    padding: 20,
    alignItems: 'center'
  },
  ticketTourTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0A192F',
    textAlign: 'center',
    marginBottom: 16
  },
  qrFrame: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#0D9488',
    marginBottom: 12
  },
  qrImage: {
    width: 190,
    height: 190
  },
  qrHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16
  },
  ticketMetaBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  ticketMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  ticketMetaLbl: {
    fontSize: 12.5,
    color: '#64748B'
  },
  ticketMetaVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  reviewSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    maxHeight: '88%'
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sheetTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0A192F'
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12
  },
  verifiedBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46'
  },
  reviewTourName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12
  },
  starSelectRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 13.5,
    color: '#0F172A',
    backgroundColor: '#F8FAFC'
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  photoOption: {
    width: 74,
    height: 74,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  photoOptionActive: {
    borderColor: '#0D9488'
  },
  photoThumb: {
    width: '100%',
    height: '100%'
  },
  photoCheckBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitReviewBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center'
  },
  submitReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  }
});


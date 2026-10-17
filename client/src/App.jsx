import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FilterBar } from './components/FilterBar';
import { TourCard } from './components/TourCard';
import { TourDetailModal } from './components/TourDetailModal';
import { BookingModal } from './components/BookingModal';
import { TicketModal } from './components/TicketModal';
import { MyTripsModal } from './components/MyTripsModal';
import { ReviewModal } from './components/ReviewModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ChatbotWidget } from './components/ChatbotWidget';

import {
  mockTours,
  mockCategories,
  mockCoupons,
  initialBookings
} from './data/mockData';

import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('client'); // 'client' | 'admin'
  const [tours, setTours] = useState(mockTours);
  const [categories, setCategories] = useState(mockCategories);
  const [coupons, setCoupons] = useState(mockCoupons);
  const [bookings, setBookings] = useState(initialBookings);
  const [wishlist, setWishlist] = useState(['tour-1']); // Default 1 item

  // Toast notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Search & Filter State
  const [filters, setFilters] = useState({
    departureCity: 'all',
    destinationCity: 'all',
    departureDate: '',
    priceRange: 'all'
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  // Modals state
  const [activeTourDetail, setActiveTourDetail] = useState(null);
  const [bookingDraft, setBookingDraft] = useState(null);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [showMyTrips, setShowMyTrips] = useState(false);
  const [reviewBookingTarget, setReviewBookingTarget] = useState(null);

  // Fetch from Express API with fallback
  useEffect(() => {
    fetch('/api/tours')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setTours(res.data);
        }
      })
      .catch(() => {
        // Fallback to local mock data
        setTours(mockTours);
      });
  }, []);

  // Filter calculation
  const filteredTours = tours.filter((t) => {
    // Keyword
    if (keyword) {
      const kw = keyword.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(kw);
      const matchDest = t.destinationCity.toLowerCase().includes(kw);
      const matchDep = t.departureCity.toLowerCase().includes(kw);
      if (!matchTitle && !matchDest && !matchDep) return false;
    }

    // Departure City
    if (filters.departureCity !== 'all') {
      if (!t.departureCity.toLowerCase().includes(filters.departureCity.toLowerCase())) {
        return false;
      }
    }

    // Destination City
    if (filters.destinationCity !== 'all') {
      if (!t.destinationCity.toLowerCase().includes(filters.destinationCity.toLowerCase())) {
        return false;
      }
    }

    // Category
    if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) {
      return false;
    }

    // Price Range
    const minTourPrice = Math.min(...t.schedules.map((s) => Number(s.adultPrice)));
    if (filters.priceRange === 'under_4m' && minTourPrice >= 4000000) return false;
    if (filters.priceRange === '4m_6m' && (minTourPrice < 4000000 || minTourPrice > 6000000)) return false;
    if (filters.priceRange === 'above_6m' && minTourPrice <= 6000000) return false;

    return true;
  });

  // Sorting
  const sortedTours = [...filteredTours].sort((a, b) => {
    const minA = Math.min(...a.schedules.map((s) => Number(s.adultPrice)));
    const minB = Math.min(...b.schedules.map((s) => Number(s.adultPrice)));

    if (sortBy === 'price_asc') return minA - minB;
    if (sortBy === 'price_desc') return minB - minA;
    if (sortBy === 'rating') return b.ratingAverage - a.ratingAverage;
    return b.reviewCount - a.reviewCount; // popular
  });

  // Wishlist toggle
  const handleToggleWishlist = (tourId) => {
    setWishlist((prev) => {
      const exists = prev.includes(tourId);
      if (exists) {
        showToast('Đã xóa tour khỏi danh sách yêu thích');
        return prev.filter((id) => id !== tourId);
      } else {
        showToast('Đã lưu tour vào danh sách yêu thích!');
        return [...prev, tourId];
      }
    });
  };

  // Start Booking Flow
  const handleStartBooking = (draft) => {
    setActiveTourDetail(null);
    setBookingDraft(draft);
  };

  // Booking Success
  const handleBookingSuccess = (newBooking) => {
    setBookings((prev) => [newBooking, ...prev]);

    // Update remaining slots in local tours
    setTours((prev) =>
      prev.map((t) => {
        if (t.id === newBooking.tourId) {
          const updatedSchedules = t.schedules.map((s) => {
            if (s.id === newBooking.scheduleId) {
              const booked = s.bookedSlots + (newBooking.numAdults + newBooking.numChildren);
              return {
                ...s,
                bookedSlots: booked,
                status: booked >= s.maxCapacity ? 'SOLD_OUT' : 'AVAILABLE'
              };
            }
            return s;
          });
          return { ...t, schedules: updatedSchedules };
        }
        return t;
      })
    );

    setBookingDraft(null);
    setViewingTicket(newBooking);
    showToast(`Chúc mừng! Đặt tour thành công - Mã vé: ${newBooking.bookingCode}`);
  };

  // Cancel Booking with Refund Policy
  const handleCancelBooking = (booking) => {
    const depDate = new Date(booking.departureDate);
    const now = new Date();
    const diffDays = Math.ceil((depDate - now) / (1000 * 60 * 60 * 24));

    let refundPercent = 0;
    if (diffDays >= 15) refundPercent = 100;
    else if (diffDays >= 7) refundPercent = 70;
    else if (diffDays >= 3) refundPercent = 50;
    else refundPercent = 0;

    const refundAmount = (booking.finalAmount * refundPercent) / 100;

    const confirmMsg =
      `Chính sách hoàn hủy cho chuyến đi (Còn ${diffDays} ngày trước khởi hành):\n` +
      `• Tỷ lệ hoàn tiền: ${refundPercent}%\n` +
      `• Số tiền hoàn lại: ${refundAmount.toLocaleString('vi-VN')} đ\n\n` +
      `Bạn có chắc chắn muốn hủy đơn hàng này không?`;

    if (window.confirm(confirmMsg)) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? { ...b, status: refundPercent > 0 ? 'REFUNDED' : 'CANCELLED', refundAmount }
            : b
        )
      );

      // Restore slot in tours
      setTours((prev) =>
        prev.map((t) => {
          if (t.id === booking.tourId) {
            const updated = t.schedules.map((s) => {
              if (s.departureDate === booking.departureDate) {
                return {
                  ...s,
                  bookedSlots: Math.max(0, s.bookedSlots - (booking.numAdults + booking.numChildren)),
                  status: 'AVAILABLE'
                };
              }
              return s;
            });
            return { ...t, schedules: updated };
          }
          return t;
        })
      );

      showToast('Yêu cầu hủy đơn và hoàn tiền đã được xử lý thành công.');
    }
  };

  // Submit Review
  const handleSubmitReview = (reviewData) => {
    setTours((prev) =>
      prev.map((t) => {
        if (t.id === reviewData.tourId) {
          const revCount = t.reviewCount + 1;
          const newAvg = Number(
            (((t.ratingAverage * t.reviewCount) + reviewData.rating) / revCount).toFixed(1)
          );
          const newReviewObj = {
            id: `rev-${Date.now()}`,
            tourId: t.id,
            authorName: reviewData.authorName,
            authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            rating: reviewData.rating,
            date: new Date().toLocaleDateString('vi-VN'),
            comment: reviewData.comment,
            photos: []
          };
          return {
            ...t,
            ratingAverage: newAvg,
            reviewCount: revCount,
            reviews: [newReviewObj, ...(t.reviews || [])]
          };
        }
        return t;
      })
    );
    showToast('Cảm ơn bạn đã gửi đánh giá trải nghiệm!');
  };

  // Admin update booking status
  const handleUpdateBookingStatus = (bookingId, newStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    showToast(`Đã cập nhật trạng thái đơn thành: ${newStatus}`);
  };

  return (
    <div className="travel-app-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification-pill animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        wishlistCount={wishlist.length}
        openMyTrips={() => setShowMyTrips(true)}
        openWishlist={() => {
          setKeyword('');
          setSelectedCategory('all');
          showToast(`Đang hiển thị ${wishlist.length} tour trong danh sách yêu thích của bạn`);
        }}
      />

      {/* MAIN VIEW: CLIENT OR ADMIN */}
      {currentView === 'client' ? (
        <main>
          {/* Hero Section with Smart Search */}
          <HeroSection
            filters={filters}
            setFilters={setFilters}
            onSearch={() => {
              const el = document.getElementById('catalog-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Filter Bar & Tour Catalog */}
          <section id="catalog-section" className="container tours-grid-section">
            <FilterBar
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              keyword={keyword}
              setKeyword={setKeyword}
              sortBy={sortBy}
              setSortBy={setSortBy}
              totalResults={sortedTours.length}
            />

            {/* Tour Cards Grid */}
            {sortedTours.length > 0 ? (
              <div className="tours-cards-grid">
                {sortedTours.map((tour) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    onSelectTour={(t) => setActiveTourDetail(t)}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlist.includes(tour.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="no-tours-found glass-panel">
                <h3>Không tìm thấy tour phù hợp</h3>
                <p>Quý khách vui lòng thử điều chỉnh lại bộ lọc hoặc tìm kiếm từ khóa khác.</p>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setKeyword('');
                    setSelectedCategory('all');
                    setFilters({
                      departureCity: 'all',
                      destinationCity: 'all',
                      departureDate: '',
                      priceRange: 'all'
                    });
                  }}
                >
                  Xóa toàn bộ bộ lọc
                </button>
              </div>
            )}
          </section>
        </main>
      ) : (
        /* ADMIN DASHBOARD VIEW */
        <main>
          <AdminDashboard
            tours={tours}
            bookings={bookings}
            coupons={coupons}
            onUpdateBookingStatus={handleUpdateBookingStatus}
          />
        </main>
      )}

      {/* FOOTER */}
      <footer className="footer-wrapper">
        <div className="container footer-container">
          <div className="footer-col">
            <h4 className="footer-title">TRAVEL WITH ME</h4>
            <p className="footer-desc">
              Hệ thống đặt tour du lịch trực tuyến số 1 Việt Nam. Khám phá vẻ đẹp kỳ vĩ của dải đất hình chữ S với dịch vụ tận tâm và chuyên nghiệp.
            </p>
            <div className="footer-hotline">
              <span>Hotline hỗ trợ 24/7:</span>
              <strong>1900 6868 - 0912 345 678</strong>
            </div>
          </div>

          <div className="footer-col">
            <h5 className="col-heading">Điểm Đến Hấp Dẫn</h5>
            <ul className="footer-links">
              <li>Du Thuyền Vịnh Hạ Long</li>
              <li>Đà Nẵng - Cầu Vàng - Hội An</li>
              <li>Chinh Phục Đỉnh Fansipan Sa Pa</li>
              <li>Thiên Đường Biển Đảo Phú Quốc</li>
              <li>Mùa Hoa Tam Giác Mạch Hà Giang</li>
            </ul>
          </div>

          <div className="footer-col">
            <h5 className="col-heading">Chính Sách & Hỗ Trợ</h5>
            <ul className="footer-links">
              <li>Điều khoản sử dụng</li>
              <li>Chính sách bảo mật thông tin</li>
              <li>Chính sách hoàn tiền & Hủy tour</li>
              <li>Bảo hiểm du lịch trọn gói</li>
              <li>Hướng dẫn thanh toán trực tuyến</li>
            </ul>
          </div>

          <div className="footer-col">
            <h5 className="col-heading">Phương Thức Thanh Toán</h5>
            <div className="payment-badges-row">
              <span className="pay-badge">VNPay</span>
              <span className="pay-badge">MoMo</span>
              <span className="pay-badge">VietQR</span>
              <span className="pay-badge">Visa</span>
              <span className="pay-badge">Mastercard</span>
            </div>
            <p className="license-text">
              Giấy phép kinh doanh lữ hành Quốc tế số: 01-1234/2026/TCDL-GP LHQT.
            </p>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="container bottom-bar-inner">
            <span>© 2026 Travel With Me. Tất cả quyền được bảo lưu.</span>
            <span>Thiết kế & Vận hành bởi Travel With Me Team.</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Chatbot Advisor */}
      <ChatbotWidget />

      {/* MODALS */}
      {/* 1. Tour Detail Modal */}
      {activeTourDetail && (
        <TourDetailModal
          tour={activeTourDetail}
          onClose={() => setActiveTourDetail(null)}
          onStartBooking={handleStartBooking}
        />
      )}

      {/* 2. Booking Modal */}
      {bookingDraft && (
        <BookingModal
          bookingDraft={bookingDraft}
          onClose={() => setBookingDraft(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* 3. Electronic Ticket Modal */}
      {viewingTicket && (
        <TicketModal
          booking={viewingTicket}
          onClose={() => setViewingTicket(null)}
          onOpenMyTrips={() => setShowMyTrips(true)}
        />
      )}

      {/* 4. My Trips Modal */}
      {showMyTrips && (
        <MyTripsModal
          bookings={bookings}
          onClose={() => setShowMyTrips(false)}
          onViewTicket={(b) => setViewingTicket(b)}
          onOpenReview={(b) => setReviewBookingTarget(b)}
          onCancelBooking={handleCancelBooking}
        />
      )}

      {/* 5. Review Modal */}
      {reviewBookingTarget && (
        <ReviewModal
          booking={reviewBookingTarget}
          onClose={() => setReviewBookingTarget(null)}
          onSubmitReview={handleSubmitReview}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { X, Calendar, QrCode, Star, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

export function MyTripsModal({
  bookings,
  onClose,
  onViewTicket,
  onOpenReview,
  onCancelBooking
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'UPCOMING') return b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'PENDING_PAYMENT';
    if (activeTab === 'COMPLETED') return b.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED' || b.status === 'REFUNDED';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PAID':
        return <span className="badge badge-emerald">Đã Xác Nhận</span>;
      case 'COMPLETED':
        return <span className="badge badge-blue">Đã Hoàn Thành</span>;
      case 'REFUNDED':
        return <span className="badge badge-amber">Đã Hoàn Tiền</span>;
      case 'CANCELLED':
        return <span className="badge badge-rose">Đã Hủy Vé</span>;
      case 'PENDING_PAYMENT':
        return <span className="badge badge-amber">Chờ Thanh Toán</span>;
      default:
        return <span className="badge badge-blue">{status}</span>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog mytrips-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mytrips-header">
          <div className="mytrips-title-group">
            <h3>Lịch Sử Chuyến Đi Của Tôi</h3>
            <p>Quản lý các chuyến đi đã đặt, tải vé điện tử hoặc gửi đánh giá</p>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="mytrips-tabs-bar">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả ({bookings.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'UPCOMING' ? 'active' : ''}`}
            onClick={() => setActiveTab('UPCOMING')}
          >
            Sắp khởi hành
          </button>
          <button
            className={`tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            Đã hoàn thành
          </button>
          <button
            className={`tab-btn ${activeTab === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setActiveTab('CANCELLED')}
          >
            Đã hủy / Hoàn tiền
          </button>
        </div>

        {/* Trips List Body */}
        <div className="mytrips-body">
          {filteredBookings.length === 0 ? (
            <div className="empty-trips-view" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: '42px', marginBottom: '14px' }}>✈️</div>
              <h4 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
                {activeTab === 'all' ? 'Bạn chưa có chuyến đi nào' : 'Không có chuyến đi nào trong mục này'}
              </h4>
              <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '380px', margin: '0 auto 20px', lineHeight: '1.5' }}>
                {activeTab === 'all'
                  ? 'Lịch sử chuyến đi sẽ xuất hiện tại đây sau khi bạn đặt tour thành công trên hệ thống.'
                  : 'Hãy kiểm tra các tab khác hoặc đặt thêm các hành trình khám phá mới nhé.'}
              </p>
              {activeTab === 'all' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    const el = document.getElementById('catalog-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
                >
                  <span>Khám Phá Tour Ngay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="trips-cards-list">
              {filteredBookings.map((b) => (
                <div key={b.id} className="trip-booking-card animate-fade-in">
                  <div className="trip-thumb-box">
                    <img src={b.tourImage} alt="tour" className="trip-thumb-img" />
                  </div>

                  <div className="trip-details-box">
                    <div className="trip-top-row">
                      <span className="booking-code-chip">Mã: {b.bookingCode}</span>
                      {getStatusBadge(b.status)}
                    </div>

                    <h4 className="trip-tour-title">{b.tourTitle}</h4>

                    <div className="trip-meta-row">
                      <span>
                        <Calendar size={14} className="inline mr-1 text-primary-600" />
                        Khởi hành: <strong>{b.departureDate}</strong> - Về: <strong>{b.returnDate}</strong>
                      </span>
                      <span>Hành khách: <strong>{b.totalPassengers} người</strong></span>
                    </div>

                    <div className="trip-footer-row">
                      <div className="trip-price">
                        <span className="price-label">Tổng thanh toán:</span>
                        <strong className="text-emerald">{b.finalAmount.toLocaleString('vi-VN')} đ</strong>
                      </div>

                      {/* Action buttons */}
                      <div className="trip-actions-group">
                        {/* View Ticket QR */}
                        {(b.status === 'CONFIRMED' || b.status === 'PAID') && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => onViewTicket(b)}
                          >
                            <QrCode size={15} />
                            <span>Xem Vé QR</span>
                          </button>
                        )}

                        {/* Review Button: only available if COMPLETED */}
                        {b.status === 'COMPLETED' && (
                          <button
                            className="btn btn-accent btn-sm"
                            onClick={() => onOpenReview(b)}
                          >
                            <Star size={15} />
                            <span>Đánh Giá Chuyến Đi</span>
                          </button>
                        )}

                        {/* Cancel Button */}
                        {(b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'PENDING_PAYMENT') && (
                          <button
                            className="btn btn-ghost btn-sm text-rose"
                            onClick={() => onCancelBooking(b)}
                          >
                            <RotateCcw size={14} />
                            <span>Hủy Vé</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

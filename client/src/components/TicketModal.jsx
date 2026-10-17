import React from 'react';
import { X, CheckCircle, Printer, Download, MapPin, Calendar, Users, ShieldCheck, QrCode } from 'lucide-react';

export function TicketModal({ booking, onClose, onOpenMyTrips }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog ticket-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header Success Bar */}
        <div className="ticket-modal-header">
          <div className="success-banner">
            <CheckCircle size={28} className="text-emerald animate-bounce" />
            <div>
              <h3 className="success-title">Đặt Tour Thành Công!</h3>
              <p className="success-sub">Hệ thống đã gửi email xác nhận và vé điện tử đến {booking.contactEmail}</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* E-Ticket Boarding Pass Body */}
        <div className="ticket-content-body printable-area">
          <div className="boarding-pass-card">
            {/* Top Pass Header */}
            <div className="pass-top">
              <div className="pass-brand">
                <span className="brand-logo-text">TRAVEL WITH ME</span>
                <span className="pass-type-badge">VÉ ĐIỆN TỬ DU LỊCH (E-TICKET)</span>
              </div>
              <div className="pass-code-box">
                <span className="code-label">MÃ ĐƠN ĐẶT</span>
                <strong className="code-value">{booking.bookingCode}</strong>
              </div>
            </div>

            {/* Middle Pass Content */}
            <div className="pass-middle">
              <h3 className="pass-tour-title">{booking.tourTitle}</h3>

              <div className="pass-info-grid">
                <div className="info-cell">
                  <span className="cell-label">NGÀY KHỞI HÀNH</span>
                  <strong className="cell-value text-primary-700">
                    <Calendar size={14} className="inline mr-1" />
                    {booking.departureDate}
                  </strong>
                </div>

                <div className="info-cell">
                  <span className="cell-label">NGÀY KẾT THÚC</span>
                  <strong className="cell-value">
                    <Calendar size={14} className="inline mr-1" />
                    {booking.returnDate}
                  </strong>
                </div>

                <div className="info-cell">
                  <span className="cell-label">TRƯỞNG ĐOÀN</span>
                  <strong className="cell-value">{booking.contactName}</strong>
                </div>

                <div className="info-cell">
                  <span className="cell-label">SỐ ĐIỆN THOẠI</span>
                  <strong className="cell-value">{booking.contactPhone}</strong>
                </div>

                <div className="info-cell">
                  <span className="cell-label">SỐ LƯỢNG HÀNH KHÁCH</span>
                  <strong className="cell-value">
                    <Users size={14} className="inline mr-1" />
                    {booking.totalPassengers} Khách ({booking.numAdults} Lớn{booking.numChildren > 0 ? `, ${booking.numChildren} Trẻ` : ''})
                  </strong>
                </div>

                <div className="info-cell">
                  <span className="cell-label">TỔNG TIỀN ĐÃ THANH TOÁN</span>
                  <strong className="cell-value text-emerald font-bold">
                    {booking.finalAmount.toLocaleString('vi-VN')} đ
                  </strong>
                </div>
              </div>

              {/* Passenger manifest list */}
              {booking.passengers && booking.passengers.length > 0 && (
                <div className="passenger-manifest-box">
                  <span className="manifest-title">Danh sách hành khách tham gia chuyến đi:</span>
                  <div className="manifest-tags">
                    {booking.passengers.map((p, idx) => (
                      <span key={idx} className="manifest-tag">
                        {idx + 1}. {p.fullName || 'Hành khách'} ({p.passengerType === 'ADULT' ? 'Người lớn' : 'Trẻ em'})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pass Perforated Line */}
            <div className="pass-perforation">
              <div className="circle-notch left"></div>
              <div className="dash-line"></div>
              <div className="circle-notch right"></div>
            </div>

            {/* Bottom Pass: QR Check-in */}
            <div className="pass-bottom">
              <div className="qr-container">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${booking.qrCodeToken}`}
                  alt="QR Ticket Code"
                  className="ticket-qr-img"
                />
                <span className="qr-hint">Mã QR Check-in khởi hành</span>
              </div>

              <div className="ticket-security-notice">
                <div className="notice-badge">
                  <ShieldCheck size={16} className="text-emerald" />
                  <span>Vé điện tử có hiệu lực chính thức</span>
                </div>
                <p>
                  Quý khách vui lòng xuất trình mã QR này cho Hướng dẫn viên tại điểm tập trung vào ngày khởi hành.
                  Có mặt trước giờ khởi hành tối thiểu 30 phút.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="ticket-modal-footer">
          <button className="btn btn-outline" onClick={handlePrint}>
            <Printer size={16} />
            <span>In / Lưu file PDF</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onClose();
              onOpenMyTrips();
            }}
          >
            <span>Xem Danh Sách Chuyến Đi</span>
          </button>
        </div>
      </div>
    </div>
  );
}

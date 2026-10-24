import React, { useState, useEffect } from 'react';
import {
  X, ShieldCheck, Clock, Tag, CreditCard, QrCode, Building,
  ArrowRight, Check, AlertCircle, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function BookingModal({
  bookingDraft,
  onClose,
  onBookingSuccess,
  authUser
}) {
  const { tour, schedule, numAdults, numChildren, numInfants, totalPrice } = bookingDraft;

  // Countdown timer for 15-minute slot reservation (Overbooking lock)
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Contact Form
  const [contactName, setContactName] = useState(authUser?.fullName || 'Nguyễn Quốc Hùng');
  const [contactPhone, setContactPhone] = useState(authUser?.phone || '0912345678');
  const [contactEmail, setContactEmail] = useState(authUser?.email || 'hung.nguyen@example.com');
  const [specialNotes, setSpecialNotes] = useState('');

  // Passengers list
  const totalPassengers = numAdults + numChildren + numInfants;
  const [passengers, setPassengers] = useState(
    Array.from({ length: totalPassengers }, (_, idx) => ({
      fullName: idx === 0 ? (authUser?.fullName || 'Nguyễn Quốc Hùng') : '',
      passengerType: idx < numAdults ? 'ADULT' : idx < numAdults + numChildren ? 'CHILD' : 'INFANT',
      gender: 'MALE',
      birthDate: idx === 0 ? '1995-04-25' : '',
      idCardNumber: idx === 0 ? '001095012345' : ''
    }))
  );

  const updatePassenger = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('VNPAY'); // 'VNPAY' | 'MOMO' | 'VIETQR' | 'STRIPE' | 'CASH'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply Coupon Logic
  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setTimeout(() => {
      const code = couponCode.toUpperCase().trim();
      if (code === 'TRAVEL2026') {
        const discount = Math.min(1000000, (totalPrice * 10) / 100);
        setAppliedCoupon({
          code: 'TRAVEL2026',
          discountAmount: discount,
          description: 'Giảm 10% (Tối đa 1.000.000 đ)'
        });
      } else if (code === 'WELCOME500K') {
        if (totalPrice >= 5000000) {
          setAppliedCoupon({
            code: 'WELCOME500K',
            discountAmount: 500000,
            description: 'Tặng 500.000 đ cho đơn từ 5tr'
          });
        } else {
          setCouponError('Mã này chỉ áp dụng cho đơn từ 5.000.000 đ');
        }
      } else {
        setCouponError('Mã ưu đãi không hợp lệ hoặc đã hết hạn');
      }
      setCouponLoading(false);
    }, 400);
  };

  const discountVal = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPaymentAmount = Math.max(0, totalPrice - discountVal);

  // Handle Submit Booking & Lưu vào SQL Server
  const handleSubmitBooking = async () => {
    if (!contactName.trim() || !contactPhone.trim() || !contactEmail.trim()) {
      alert('Vui lòng điền đầy đủ thông tin người liên hệ');
      return;
    }

    setIsSubmitting(true);

    const bookingPayload = {
      userId: authUser?.userId || authUser?.id || 3,
      tourId: tour.id,
      tourTitle: tour.title,
      tourImage: tour.thumbnailUrl || tour.image,
      scheduleId: schedule.id,
      departureDate: schedule.departureDate,
      returnDate: schedule.returnDate,
      numAdults,
      numChildren,
      numInfants,
      totalPassengers,
      baseAmount: totalPrice,
      discountAmount: discountVal,
      finalAmount: finalPaymentAmount,
      contactName,
      contactEmail,
      contactPhone,
      specialNotes,
      passengers,
      paymentMethod,
      couponCode: appliedCoupon ? appliedCoupon.code : null
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      const json = await res.json();
      if (json.success && json.data) {
        // Fire confetti celebration
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore
        }

        setIsSubmitting(false);
        onBookingSuccess(json.data);
      } else {
        setIsSubmitting(false);
        alert(json.message || 'Đặt tour không thành công. Vui lòng thử lại!');
      }
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu đặt tour:', err);
      setIsSubmitting(false);
      alert('Không thể kết nối máy chủ để đặt tour. Vui lòng thử lại!');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog booking-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="booking-modal-header">
          <div className="booking-header-title">
            <h3 className="modal-title">Xác Nhận Đặt Tour & Thanh Toán</h3>
            <span className="booking-tour-name">{tour.title}</span>
          </div>

          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* 15-Minute Reservation Countdown */}
        <div className="reservation-timer-banner">
          <Clock size={16} className="text-amber animate-spin-slow" />
          <span>
            Hệ thống đang tạm giữ <strong>{numAdults + numChildren}</strong> chỗ cho bạn trong:{' '}
            <strong className="timer-digits text-amber">{formatTime(timeLeft)}</strong>
          </span>
        </div>

        {/* Modal Body */}
        <div className="booking-modal-body">
          <div className="booking-split-grid">
            {/* LEFT: Forms (Contact, Passengers, Payment) */}
            <div className="booking-left-forms">
              {/* 1. Contact Information */}
              <div className="form-card-block">
                <h4 className="block-title">1. Thông tin người đại diện đặt vé</h4>
                <div className="form-row-grid">
                  <div className="form-field">
                    <label>Họ và tên *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="form-field">
                    <label>Số điện thoại *</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="0912345678"
                    />
                  </div>
                  <div className="form-field form-full">
                    <label>Email nhận vé điện tử & Hóa đơn *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="example@gmail.com"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Passengers Details */}
              <div className="form-card-block">
                <h4 className="block-title">2. Danh sách hành khách đi cùng ({totalPassengers} người)</h4>
                <div className="passengers-list">
                  {passengers.map((p, idx) => (
                    <div key={idx} className="passenger-entry-box">
                      <div className="passenger-badge">
                        <span>Khách {idx + 1} ({p.passengerType === 'ADULT' ? 'Người lớn' : p.passengerType === 'CHILD' ? 'Trẻ em' : 'Em bé'})</span>
                      </div>
                      <div className="form-row-grid">
                        <div className="form-field">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Họ và tên hành khách"
                            value={p.fullName}
                            onChange={(e) => updatePassenger(idx, 'fullName', e.target.value)}
                          />
                        </div>
                        <div className="form-field">
                          <input
                            type="date"
                            className="form-control"
                            title="Ngày sinh"
                            value={p.birthDate}
                            onChange={(e) => updatePassenger(idx, 'birthDate', e.target.value)}
                          />
                        </div>
                        <div className="form-field">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="CCCD / Hộ chiếu (Nếu có)"
                            value={p.idCardNumber}
                            onChange={(e) => updatePassenger(idx, 'idCardNumber', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="form-field mt-3">
                  <label>Ghi chú yêu cầu đặc biệt (Ăn chay, dị ứng, tầng khách sạn...)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Nhập ghi chú gửi đến hướng dẫn viên..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* 3. Multi-Channel Payment Options */}
              <div className="form-card-block">
                <h4 className="block-title">3. Lựa chọn hình thức thanh toán</h4>
                <div className="payment-options-grid">
                  {/* VNPay */}
                  <label className={`payment-card ${paymentMethod === 'VNPAY' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'VNPAY'}
                      onChange={() => setPaymentMethod('VNPAY')}
                    />
                    <div className="payment-info">
                      <strong>Cổng VNPay (Thẻ ATM / QR / Mobile Banking)</strong>
                      <small>Thanh toán bảo mật tức thì, xác nhận tự động</small>
                    </div>
                  </label>

                  {/* MoMo */}
                  <label className={`payment-card ${paymentMethod === 'MOMO' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'MOMO'}
                      onChange={() => setPaymentMethod('MOMO')}
                    />
                    <div className="payment-info">
                      <strong>Ví điện tử MoMo</strong>
                      <small>Quét mã QR qua ứng dụng MoMo</small>
                    </div>
                  </label>

                  {/* VietQR */}
                  <label className={`payment-card ${paymentMethod === 'VIETQR' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'VIETQR'}
                      onChange={() => setPaymentMethod('VIETQR')}
                    />
                    <div className="payment-info">
                      <strong>Chuyển khoản VietQR Nhanh 24/7</strong>
                      <small>Tự động tạo mã QR có số tiền và nội dung chuyển khoản</small>
                    </div>
                  </label>

                  {/* Stripe / Visa */}
                  <label className={`payment-card ${paymentMethod === 'STRIPE' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'STRIPE'}
                      onChange={() => setPaymentMethod('STRIPE')}
                    />
                    <div className="payment-info">
                      <strong>Thẻ Quốc Tế (Visa / Mastercard / JCB)</strong>
                      <small>Tích hợp cổng thanh toán bảo mật Stripe</small>
                    </div>
                  </label>

                  {/* Cash */}
                  <label className={`payment-card ${paymentMethod === 'CASH' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'CASH'}
                      onChange={() => setPaymentMethod('CASH')}
                    />
                    <div className="payment-info">
                      <strong>Thanh toán tại văn phòng công ty</strong>
                      <small>Giữ chỗ trong 24h, thanh toán trực tiếp</small>
                    </div>
                  </label>
                </div>

                {/* If VietQR Selected: Dynamic QR Code Box Preview */}
                {paymentMethod === 'VIETQR' && (
                  <div className="vietqr-preview-box animate-fade-in">
                    <div className="qr-image-wrapper">
                      <img
                        src={`https://api.vietqr.io/image/970422-0912345678-compact2.jpg?amount=${finalPaymentAmount}&addInfo=TWM%20DAT%20TOUR`}
                        alt="VietQR code"
                        className="vietqr-img"
                        onError={(e) => {
                          // Fallback mockup SVG QR code if offline
                          e.target.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TRAVEL_WITH_ME_VIETQR";
                        }}
                      />
                    </div>
                    <div className="qr-transfer-instructions">
                      <h5>Hướng dẫn quét mã VietQR:</h5>
                      <p>Ngân hàng: <strong>MBBank (Ngân hàng Quân Đội)</strong></p>
                      <p>Số tài khoản: <strong>0912345678</strong></p>
                      <p>Chủ tài khoản: <strong>CÔNG TY DU LỊCH TRAVEL WITH ME</strong></p>
                      <p>Số tiền: <strong className="text-emerald">{finalPaymentAmount.toLocaleString('vi-VN')} đ</strong></p>
                      <p>Nội dung: <strong>TWM TOUR {contactPhone}</strong></p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Order Summary & Coupon & Submit */}
            <div className="booking-right-summary">
              <div className="order-summary-card glass-panel">
                <h4 className="summary-title">Tóm tắt đơn đặt tour</h4>

                <div className="summary-tour-meta">
                  <img src={tour.thumbnailUrl} alt="tour" className="meta-thumb" />
                  <div>
                    <h5 className="meta-title">{tour.title}</h5>
                    <p className="meta-dates">
                      Khởi hành: <strong>{schedule.departureDate}</strong>
                    </p>
                    <p className="meta-passengers">
                      Hành khách: {numAdults} Lớn{numChildren > 0 ? `, ${numChildren} Trẻ` : ''}{numInfants > 0 ? `, ${numInfants} Bé` : ''}
                    </p>
                  </div>
                </div>

                <div className="summary-divider"></div>

                {/* Coupon Input Box */}
                <div className="coupon-box">
                  <label className="coupon-label">
                    <Tag size={15} />
                    <span>Mã giảm giá / Voucher:</span>
                  </label>
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      className="coupon-input"
                      placeholder="Nhập mã (TRAVEL2026, WELCOME500K)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? 'Kiểm tra...' : 'Áp dụng'}
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="coupon-success-msg">
                      <Check size={14} />
                      <span>Đã áp dụng: {appliedCoupon.description}</span>
                    </div>
                  )}
                  {couponError && (
                    <div className="coupon-error-msg">
                      <AlertCircle size={14} />
                      <span>{couponError}</span>
                    </div>
                  )}
                </div>

                <div className="summary-divider"></div>

                {/* Calculation Rows */}
                <div className="summary-calc-rows">
                  <div className="calc-row">
                    <span>Tổng tiền gốc:</span>
                    <span>{totalPrice.toLocaleString('vi-VN')} đ</span>
                  </div>
                  {discountVal > 0 && (
                    <div className="calc-row discount-row text-emerald">
                      <span>Khuyến mãi ({appliedCoupon?.code}):</span>
                      <span>- {discountVal.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <div className="calc-row">
                    <span>Bảo hiểm du lịch:</span>
                    <span className="text-emerald font-bold">Miễn phí (Tặng kèm)</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="calc-row final-row">
                    <span>Tổng thanh toán:</span>
                    <strong className="final-price text-emerald">
                      {finalPaymentAmount.toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                </div>

                {/* Final Submit Button */}
                <button
                  className="btn btn-accent btn-block btn-pay-now animate-glow"
                  onClick={handleSubmitBooking}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Đang xử lý giao dịch...</span>
                  ) : (
                    <>
                      <span>Hoàn Tất Đặt Chỗ</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className="guarantee-box">
                  <ShieldCheck size={16} className="text-emerald" />
                  <span>Cam kết bảo mật giao dịch & Giữ giá tốt nhất</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

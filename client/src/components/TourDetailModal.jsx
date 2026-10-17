import React, { useState } from 'react';
import {
  X, Star, MapPin, Calendar, Clock, Plane, Bus, CheckCircle2,
  XCircle, AlertCircle, Users, ArrowRight, ShieldCheck, MessageSquare, Map
} from 'lucide-react';

export function TourDetailModal({ tour, onClose, onStartBooking }) {
  const [activeTab, setActiveTab] = useState('itinerary'); // 'itinerary' | 'policy' | 'reviews' | 'map'
  const [selectedScheduleId, setSelectedScheduleId] = useState(
    tour.schedules[0] ? tour.schedules[0].id : null
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Passenger counts
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const selectedSchedule =
    tour.schedules.find((s) => s.id === selectedScheduleId) || tour.schedules[0];

  const availableSlots = selectedSchedule
    ? selectedSchedule.maxCapacity - selectedSchedule.bookedSlots
    : 0;

  // Tổng tiền tạm tính
  const totalPrice = selectedSchedule
    ? adults * selectedSchedule.adultPrice +
      children * selectedSchedule.childPrice +
      infants * selectedSchedule.infantPrice
    : 0;

  const handleProceedBooking = () => {
    if (availableSlots < adults + children) {
      alert(`Rất tiếc! Đợt khởi hành này chỉ còn ${availableSlots} chỗ trống.`);
      return;
    }
    onStartBooking({
      tour,
      schedule: selectedSchedule,
      numAdults: adults,
      numChildren: children,
      numInfants: infants,
      totalPrice
    });
  };

  const images = tour.albumImages && tour.albumImages.length > 0 ? tour.albumImages : [tour.thumbnailUrl];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog detail-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header bar */}
        <div className="detail-modal-header">
          <div className="header-tags">
            <span className="badge badge-emerald">
              {tour.durationDays} Ngày {tour.durationNights} Đêm
            </span>
            <span className="badge badge-blue">
              {tour.transportType === 'PLANE' ? <Plane size={12} /> : <Bus size={12} />}
              {tour.transportType === 'PLANE' ? ' Máy bay khứ hồi' : ' Xe Limousine VIP'}
            </span>
            <span className="badge badge-amber">
              <Star size={12} fill="#92400e" /> {tour.ratingAverage} ({tour.reviewCount} đánh giá)
            </span>
          </div>

          <button className="btn-close-modal" onClick={onClose} title="Đóng">
            <X size={22} />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="detail-modal-body">
          {/* Main Title */}
          <h2 className="detail-tour-title">{tour.title}</h2>
          <div className="detail-route-info">
            <MapPin size={16} className="text-primary-600" />
            <span>Khởi hành: <strong>{tour.departureCity}</strong> — Điểm đến: <strong>{tour.destinationCity}</strong></span>
          </div>

          {/* Photo Gallery with Thumbnail selector */}
          <div className="gallery-wrapper">
            <div className="main-image-box">
              <img src={images[activeImageIndex]} alt={tour.title} className="main-display-img" />
            </div>
            {images.length > 1 && (
              <div className="thumbnail-strip">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`thumb-box ${activeImageIndex === idx ? 'thumb-active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img src={img} alt="preview" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2-Column Grid: Left Content / Right Booking Box */}
          <div className="detail-layout-grid">
            {/* LEFT COLUMN: Itinerary & Details */}
            <div className="detail-left-content">
              {/* Tabs Navigation */}
              <div className="detail-nav-tabs">
                <button
                  className={`tab-btn ${activeTab === 'itinerary' ? 'active' : ''}`}
                  onClick={() => setActiveTab('itinerary')}
                >
                  <Calendar size={16} />
                  <span>Lịch trình chi tiết</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'policy' ? 'active' : ''}`}
                  onClick={() => setActiveTab('policy')}
                >
                  <ShieldCheck size={16} />
                  <span>Dịch vụ & Chính sách</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
                  onClick={() => setActiveTab('map')}
                >
                  <Map size={16} />
                  <span>Bản đồ lộ trình</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  <MessageSquare size={16} />
                  <span>Đánh giá ({tour.reviewCount})</span>
                </button>
              </div>

              {/* Tab 1: Itinerary */}
              {activeTab === 'itinerary' && (
                <div className="tab-pane animate-fade-in">
                  <div className="overview-text-box">
                    <p>{tour.overviewDescription}</p>
                  </div>

                  <div className="itinerary-timeline">
                    {tour.itineraries.map((item) => (
                      <div key={item.dayNumber} className="timeline-node">
                        <div className="timeline-day-badge">
                          <span>Ngày {item.dayNumber}</span>
                        </div>
                        <div className="timeline-card">
                          <h4 className="timeline-title">{item.title}</h4>
                          <p className="timeline-desc">{item.description}</p>
                          
                          {/* Activities pills */}
                          {item.activities && item.activities.length > 0 && (
                            <div className="timeline-activities">
                              {item.activities.map((act, i) => (
                                <span key={i} className="act-pill">
                                  ✓ {act}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="timeline-meta-footer">
                            <span>🍽️ Bữa ăn: <strong>{item.meals || 'Theo chương trình'}</strong></span>
                            <span>🏨 Khách sạn: <strong>{item.hotel || 'Khách sạn cao cấp'}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Policy & Services */}
              {activeTab === 'policy' && (
                <div className="tab-pane animate-fade-in">
                  <div className="services-box-grid">
                    <div className="service-column service-inclusions">
                      <div className="service-col-header text-emerald">
                        <CheckCircle2 size={18} />
                        <h4>Dịch vụ bao gồm (Inclusions)</h4>
                      </div>
                      <p className="service-desc">{tour.inclusions}</p>
                    </div>

                    <div className="service-column service-exclusions">
                      <div className="service-col-header text-rose">
                        <XCircle size={18} />
                        <h4>Dịch vụ chưa bao gồm (Exclusions)</h4>
                      </div>
                      <p className="service-desc">{tour.exclusions}</p>
                    </div>
                  </div>

                  {/* Cancellation Policy */}
                  <div className="cancellation-policy-box">
                    <div className="policy-header">
                      <AlertCircle size={18} className="text-amber" />
                      <h4>Chính sách hoàn tiền & Hủy vé</h4>
                    </div>
                    <p>{tour.cancellationPolicy}</p>
                    <div className="policy-table">
                      <div className="policy-row">
                        <span>Trước ngày khởi hành &gt;= 15 ngày</span>
                        <strong className="text-emerald">Hoàn lại 100%</strong>
                      </div>
                      <div className="policy-row">
                        <span>Trước ngày khởi hành 7 - 14 ngày</span>
                        <strong className="text-emerald">Hoàn lại 70%</strong>
                      </div>
                      <div className="policy-row">
                        <span>Trước ngày khởi hành 3 - 6 ngày</span>
                        <strong className="text-amber">Hoàn lại 50%</strong>
                      </div>
                      <div className="policy-row">
                        <span>Dưới 3 ngày trước khởi hành</span>
                        <strong className="text-rose">Không hoàn tiền</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Interactive Route Map Simulation */}
              {activeTab === 'map' && (
                <div className="tab-pane animate-fade-in">
                  <div className="map-simulation-card">
                    <div className="map-badge-header">
                      <MapPin size={16} />
                      <span>Lộ trình các điểm dừng chân nổi bật</span>
                    </div>
                    <div className="map-graphic-box">
                      <div className="map-road-track">
                        <div className="map-stop-point" style={{ left: '10%' }}>
                          <div className="pin-point start-pin">1</div>
                          <span className="point-name">{tour.departureCity} (Đón khách)</span>
                        </div>
                        <div className="map-stop-point" style={{ left: '45%' }}>
                          <div className="pin-point way-pin">2</div>
                          <span className="point-name">Danh thắng trọng điểm</span>
                        </div>
                        <div className="map-stop-point" style={{ left: '85%' }}>
                          <div className="pin-point end-pin">3</div>
                          <span className="point-name">{tour.destinationCity}</span>
                        </div>
                      </div>
                    </div>
                    <p className="map-hint">
                      Bản đồ tích hợp hiển thị đầy đủ các điểm tham quan, trạm dừng chân và khách sạn lưu trú trong tour.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 4: Reviews */}
              {activeTab === 'reviews' && (
                <div className="tab-pane animate-fade-in">
                  <div className="reviews-summary-bar">
                    <div className="score-big">
                      <Star size={32} className="star-filled" />
                      <span>{tour.ratingAverage}</span>
                      <small>/ 5.0</small>
                    </div>
                    <div className="summary-text">
                      <strong>100% Đánh giá từ khách hàng đã tham gia chuyến đi</strong>
                      <p>Mọi nhận xét đều được xác thực thông qua mã vé điện tử QR hoàn thành tour.</p>
                    </div>
                  </div>

                  <div className="reviews-list">
                    {tour.reviews && tour.reviews.length > 0 ? (
                      tour.reviews.map((rev) => (
                        <div key={rev.id} className="review-item-card">
                          <div className="review-user-row">
                            <img src={rev.authorAvatar} alt={rev.authorName} className="rev-avatar" />
                            <div>
                              <div className="rev-name">{rev.authorName}</div>
                              <div className="rev-stars">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star key={i} size={13} className="star-filled" />
                                ))}
                                <span className="rev-date">{rev.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="rev-comment">{rev.comment}</p>
                          {rev.photos && rev.photos.length > 0 && (
                            <div className="rev-photos-row">
                              {rev.photos.map((p, i) => (
                                <img key={i} src={p} alt="user photo" className="rev-photo-thumb" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">Chưa có đánh giá nào cho tour này.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Sticky Booking Calculation Widget */}
            <div className="detail-right-booking">
              <div className="booking-widget-card glass-panel">
                <div className="widget-header">
                  <span className="widget-tag">Giá ưu đãi từ</span>
                  <div className="widget-price">
                    {selectedSchedule ? selectedSchedule.adultPrice.toLocaleString('vi-VN') : 0} 
                    <span className="currency">đ / khách</span>
                  </div>
                </div>

                {/* Select Departure Date */}
                <div className="widget-section">
                  <label className="widget-label">
                    <Calendar size={16} className="text-primary-600" />
                    <span>Chọn Ngày Khởi Hành:</span>
                  </label>
                  <div className="schedules-radio-list">
                    {tour.schedules.map((sch) => {
                      const slots = sch.maxCapacity - sch.bookedSlots;
                      const isSoldOut = slots <= 0;
                      return (
                        <div
                          key={sch.id}
                          className={`schedule-option ${selectedScheduleId === sch.id ? 'selected' : ''} ${isSoldOut ? 'disabled' : ''}`}
                          onClick={() => !isSoldOut && setSelectedScheduleId(sch.id)}
                        >
                          <div className="sch-dates">
                            <strong>{sch.departureDate}</strong>
                            <small>Đến {sch.returnDate}</small>
                          </div>
                          <div className="sch-slots-badge">
                            {isSoldOut ? (
                              <span className="text-rose font-bold">Hết chỗ</span>
                            ) : (
                              <span className="text-emerald">Còn {slots} chỗ</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Passenger Counters */}
                <div className="widget-section">
                  <label className="widget-label">
                    <Users size={16} className="text-primary-600" />
                    <span>Số lượng hành khách:</span>
                  </label>
                  
                  {/* Adult */}
                  <div className="counter-row">
                    <div>
                      <div className="counter-title">Người lớn</div>
                      <div className="counter-desc">&gt;= 12 tuổi</div>
                    </div>
                    <div className="counter-controls">
                      <button
                        className="counter-btn"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                      >
                        -
                      </button>
                      <span className="counter-value">{adults}</span>
                      <button
                        className="counter-btn"
                        onClick={() => setAdults(adults + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Child */}
                  <div className="counter-row">
                    <div>
                      <div className="counter-title">Trẻ em</div>
                      <div className="counter-desc">2 - 11 tuổi (75% giá)</div>
                    </div>
                    <div className="counter-controls">
                      <button
                        className="counter-btn"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                      >
                        -
                      </button>
                      <span className="counter-value">{children}</span>
                      <button
                        className="counter-btn"
                        onClick={() => setChildren(children + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Infant */}
                  <div className="counter-row">
                    <div>
                      <div className="counter-title">Em bé</div>
                      <div className="counter-desc">&lt; 2 tuổi (Bảo hiểm)</div>
                    </div>
                    <div className="counter-controls">
                      <button
                        className="counter-btn"
                        onClick={() => setInfants(Math.max(0, infants - 1))}
                      >
                        -
                      </button>
                      <span className="counter-value">{infants}</span>
                      <button
                        className="counter-btn"
                        onClick={() => setInfants(infants + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instant Pricing Breakdown */}
                <div className="widget-price-breakdown">
                  <div className="breakdown-row">
                    <span>Người lớn ({adults} x {selectedSchedule?.adultPrice.toLocaleString('vi-VN')} đ):</span>
                    <span>{(adults * (selectedSchedule?.adultPrice || 0)).toLocaleString('vi-VN')} đ</span>
                  </div>
                  {children > 0 && (
                    <div className="breakdown-row">
                      <span>Trẻ em ({children} x {selectedSchedule?.childPrice.toLocaleString('vi-VN')} đ):</span>
                      <span>{(children * (selectedSchedule?.childPrice || 0)).toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  {infants > 0 && (
                    <div className="breakdown-row">
                      <span>Em bé ({infants} x {selectedSchedule?.infantPrice.toLocaleString('vi-VN')} đ):</span>
                      <span>{(infants * (selectedSchedule?.infantPrice || 0)).toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <div className="breakdown-divider"></div>
                  <div className="breakdown-total">
                    <span>Tổng tiền tạm tính:</span>
                    <strong className="total-val">{totalPrice.toLocaleString('vi-VN')} đ</strong>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  className="btn btn-accent btn-block btn-booking-submit animate-glow"
                  onClick={handleProceedBooking}
                  disabled={availableSlots < adults + children}
                >
                  <span>Tiến Hành Đặt Tour</span>
                  <ArrowRight size={18} />
                </button>
                <div className="widget-guarantee">
                  <ShieldCheck size={14} className="text-emerald" />
                  <span>Giữ chỗ tức thì 15 phút - Xác nhận qua Email & QR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

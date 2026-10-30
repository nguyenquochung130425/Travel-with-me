import React from 'react';
import { Star, Clock, Plane, Bus, Heart, Calendar, ArrowRight, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

export function TourCard({ tour, onSelectTour, onToggleWishlist, isWishlisted }) {
  // Tìm giá thấp nhất từ schedules
  const minPrice = Math.min(...tour.schedules.map((s) => Number(s.adultPrice)));
  // Giá niêm yết tham chiếu (để hiển thị tiết kiệm giá trị)
  const originalPrice = Math.round((minPrice * 1.15) / 100000) * 100000;
  // Lịch gần nhất còn chỗ
  const upcomingSchedule = tour.schedules.find((s) => s.status === 'AVAILABLE') || tour.schedules[0];
  const remainingSlots = upcomingSchedule ? upcomingSchedule.maxCapacity - upcomingSchedule.bookedSlots : 0;

  return (
    <div className="tour-card animate-fade-in">
      {/* Thumbnail Box */}
      <div className="tour-card-image-box" onClick={() => onSelectTour(tour)}>
        <img src={tour.thumbnailUrl} alt={tour.title} className="tour-card-img" loading="lazy" />
        <div className="tour-card-overlay"></div>

        {/* Top Badges */}
        <div className="card-top-tags">
          <span className="badge badge-duration">
            <Clock size={12} />
            {tour.durationDays}N{tour.durationNights}Đ
          </span>
          {tour.transportType === 'PLANE' ? (
            <span className="badge badge-transport">
              <Plane size={12} /> Vé máy bay
            </span>
          ) : (
            <span className="badge badge-transport">
              <Bus size={12} /> Limousine VIP
            </span>
          )}
        </div>

        {/* Wishlist Heart Icon */}
        <button
          className={`wishlist-heart-btn ${isWishlisted ? 'favorited heart-pop' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(tour.id);
          }}
          title={isWishlisted ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
          aria-label="Wishlist"
        >
          <Heart size={18} fill={isWishlisted ? '#f43f5e' : 'none'} color={isWishlisted ? '#f43f5e' : '#fff'} />
        </button>

        {/* Discount Badge & Category Pill on bottom of image */}
        <div className="card-bottom-tags">
          <span className="card-category-pill">
            {tour.categoryName}
          </span>
          <span className="card-discount-pill">
            <Sparkles size={11} /> Giảm 15%
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="tour-card-body">
        {/* Rating & Departure */}
        <div className="card-meta-row">
          <div className="card-rating">
            <Star size={15} className="star-filled" />
            <span className="rating-val">{tour.ratingAverage}</span>
            <span className="rating-count">({tour.reviewCount} đánh giá)</span>
          </div>
          <div className="card-departure">
            <MapPin size={13} className="text-primary-600 inline-icon" />
            <span>Từ: <strong>{tour.departureCity}</strong></span>
          </div>
        </div>

        {/* Tour Title */}
        <h3 className="tour-card-title" onClick={() => onSelectTour(tour)} title={tour.title}>
          {tour.title}
        </h3>

        {/* Highlight points / Schedules */}
        <div className="card-schedule-info">
          <div className="schedule-date-wrap">
            <Calendar size={14} className="text-primary-600" />
            <span>Khởi hành: <strong>{upcomingSchedule ? upcomingSchedule.departureDate : 'Hàng tuần'}</strong></span>
          </div>
          {remainingSlots > 0 ? (
            <span className="slots-warning">
              <span className="status-dot pulse-warning"></span>
              Còn {remainingSlots} chỗ
            </span>
          ) : (
            <span className="slots-soldout">
              <span className="status-dot dot-soldout"></span>
              Hết chỗ
            </span>
          )}
        </div>

        {/* Card Footer: Pricing & Action */}
        <div className="tour-card-footer">
          <div className="card-price-box">
            <div className="price-original-row">
              <span className="price-original">{originalPrice.toLocaleString('vi-VN')} đ</span>
              <span className="price-tag-save">Tiết kiệm 15%</span>
            </div>
            <div className="price-value">
              {minPrice.toLocaleString('vi-VN')} <span className="currency">đ</span>
              <span className="price-unit">/khách</span>
            </div>
          </div>
          
          <button
            className="btn btn-primary btn-sm btn-card-action"
            onClick={() => onSelectTour(tour)}
          >
            <span>Đặt Chỗ</span>
            <ArrowRight size={15} className="btn-arrow-slide" />
          </button>
        </div>
      </div>
    </div>
  );
}

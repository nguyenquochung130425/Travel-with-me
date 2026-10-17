import React from 'react';
import { Star, Clock, Plane, Bus, Heart, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

export function TourCard({ tour, onSelectTour, onToggleWishlist, isWishlisted }) {
  // Tìm giá thấp nhất từ schedules
  const minPrice = Math.min(...tour.schedules.map((s) => Number(s.adultPrice)));
  // Lịch gần nhất còn chỗ
  const upcomingSchedule = tour.schedules.find((s) => s.status === 'AVAILABLE') || tour.schedules[0];
  const remainingSlots = upcomingSchedule ? upcomingSchedule.maxCapacity - upcomingSchedule.bookedSlots : 0;

  return (
    <div className="tour-card animate-fade-in">
      {/* Thumbnail Box */}
      <div className="tour-card-image-box" onClick={() => onSelectTour(tour)}>
        <img src={tour.thumbnailUrl} alt={tour.title} className="tour-card-img" />
        <div className="tour-card-overlay"></div>

        {/* Top Floating Badges */}
        <div className="card-top-tags">
          <span className="badge badge-emerald">
            {tour.durationDays}N{tour.durationNights}Đ
          </span>
          {tour.transportType === 'PLANE' ? (
            <span className="badge badge-blue">
              <Plane size={12} /> Bay khứ hồi
            </span>
          ) : (
            <span className="badge badge-blue">
              <Bus size={12} /> Xe Limousine
            </span>
          )}
        </div>

        {/* Wishlist Heart Icon */}
        <button
          className={`wishlist-heart-btn ${isWishlisted ? 'favorited' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(tour.id);
          }}
          title={isWishlisted ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
        >
          <Heart size={18} fill={isWishlisted ? '#f43f5e' : 'none'} color={isWishlisted ? '#f43f5e' : '#fff'} />
        </button>

        {/* Category Pill on bottom of image */}
        <div className="card-category-pill">
          <span>{tour.categoryName}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="tour-card-body">
        {/* Rating & Departure */}
        <div className="card-meta-row">
          <div className="card-rating">
            <Star size={15} className="star-filled" />
            <span className="rating-val">{tour.ratingAverage}</span>
            <span className="rating-count">({tour.reviewCount})</span>
          </div>
          <div className="card-departure">
            <span>Từ: <strong>{tour.departureCity}</strong></span>
          </div>
        </div>

        {/* Tour Title */}
        <h3 className="tour-card-title" onClick={() => onSelectTour(tour)}>
          {tour.title}
        </h3>

        {/* Highlight points / Schedules */}
        <div className="card-schedule-info">
          <Calendar size={14} className="text-primary-600" />
          <span>Gần nhất: {upcomingSchedule ? upcomingSchedule.departureDate : 'Hàng tuần'}</span>
          {remainingSlots > 0 ? (
            <span className="slots-warning">Còn {remainingSlots} chỗ</span>
          ) : (
            <span className="slots-soldout">Hết chỗ</span>
          )}
        </div>

        {/* Card Footer: Pricing & Action */}
        <div className="tour-card-footer">
          <div className="card-price-box">
            <span className="price-label">Giá trọn gói từ</span>
            <div className="price-value">
              {minPrice.toLocaleString('vi-VN')} <span className="currency">đ</span>
            </div>
          </div>
          
          <button
            className="btn btn-primary btn-sm btn-card-action"
            onClick={() => onSelectTour(tour)}
          >
            <span>Đặt Chỗ</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

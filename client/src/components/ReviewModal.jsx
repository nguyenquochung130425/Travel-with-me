import React, { useState } from 'react';
import { X, Star, Upload, CheckCircle2 } from 'lucide-react';

export function ReviewModal({ booking, onClose, onSubmitReview }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Vui lòng chia sẻ cảm nghĩ của bạn về chuyến đi');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitReview({
        bookingId: booking.id,
        tourId: booking.tourId,
        rating,
        comment,
        authorName: booking.contactName,
        photos: []
      });
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog review-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h3>Đánh Giá Chuyến Đi</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="review-form-body">
          <div className="review-tour-preview">
            <img src={booking.tourImage} alt="tour" className="review-thumb" />
            <div>
              <h4 className="review-tour-name">{booking.tourTitle}</h4>
              <p className="review-tour-date">Đã hoàn thành ngày {booking.returnDate}</p>
            </div>
          </div>

          {/* Star selector */}
          <div className="star-picker-box">
            <label className="picker-label">Mức độ hài lòng của bạn:</label>
            <div className="stars-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className="star-btn"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    size={32}
                    className={(hoverRating || rating) >= star ? 'star-filled' : 'star-empty'}
                  />
                </button>
              ))}
            </div>
            <span className="star-label-text">
              {rating === 5 && 'Tuyệt vời, vượt xa mong đợi! (5/5)'}
              {rating === 4 && 'Rất tốt, dịch vụ chu đáo (4/5)'}
              {rating === 3 && 'Hài lòng cơ bản (3/5)'}
              {rating === 2 && 'Cần cải thiện (2/5)'}
              {rating === 1 && 'Chưa hài lòng (1/5)'}
            </span>
          </div>

          {/* Comment text */}
          <div className="form-field">
            <label>Chia sẻ cảm nhận chi tiết (khách sạn, hướng dẫn viên, đồ ăn...):</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Chuyến đi rất vui, hướng dẫn viên nhiệt tình, cảnh sắc Hạ Long tuyệt đẹp..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Photo upload mock */}
          <div className="photo-upload-mock">
            <Upload size={18} className="text-primary-600" />
            <span>Tải lên ảnh chụp thực tế trong chuyến đi (Tùy chọn)</span>
          </div>

          <div className="review-footer-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá Ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X, Star, Upload, CheckCircle2, ShieldCheck, Image, Trash2 } from 'lucide-react';

const SAMPLE_PHOTO_PRESETS = [
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80'
];

export function ReviewModal({ booking, onClose, onSubmitReview }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSamplePhoto = (url) => {
    if (!photos.includes(url)) {
      setPhotos([...photos, url]);
    }
  };

  const handleRemovePhoto = (idx) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Vui lòng chia sẻ cảm nghĩ của bạn về chuyến đi');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitReview({
        bookingId: booking.id || booking.bookingCode,
        tourId: booking.tourId || booking.tour_id,
        rating,
        comment,
        authorName: booking.contactName || booking.contact_name || 'Khách Du Lịch',
        photos
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Không thể gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog review-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <div>
            <h3>Đánh Giá Chuyến Đi</h3>
            <span className="review-sub-badge">
              <ShieldCheck size={14} className="text-cyan" />
              Chính sách minh bạch & xác thực 100%
            </span>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Policy Notice */}
        <div className="review-policy-notice">
          <CheckCircle2 size={16} className="text-emerald" />
          <span>
            Đánh giá này được bảo đảm bởi đơn hàng hoàn thành: <strong>#{booking.bookingCode || booking.id}</strong>.
            Nhận xét của bạn giúp cộng đồng du khách có góc nhìn thực tế và khách quan nhất.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="review-form-body">
          <div className="review-tour-preview">
            <img src={booking.tourImage || booking.tour_image} alt="tour" className="review-thumb" />
            <div>
              <h4 className="review-tour-name">{booking.tourTitle || booking.tour_title}</h4>
              <p className="review-tour-date">Đã hoàn thành ngày {booking.returnDate || booking.return_date}</p>
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

          {/* Photos Upload & Selected Previews */}
          <div className="review-photos-section">
            <label className="picker-label">Hình ảnh chụp thực tế trong chuyến đi:</label>
            <div className="photo-presets-chips">
              <span className="preset-hint">Thêm ảnh mẫu thực tế:</span>
              {SAMPLE_PHOTO_PRESETS.map((pUrl, i) => (
                <button
                  type="button"
                  key={i}
                  className="btn-add-sample-photo"
                  onClick={() => handleAddSamplePhoto(pUrl)}
                >
                  <Image size={13} />
                  <span>Ảnh thực tế {i + 1}</span>
                </button>
              ))}
            </div>

            {photos.length > 0 && (
              <div className="selected-photos-preview">
                {photos.map((p, idx) => (
                  <div key={idx} className="preview-photo-wrap">
                    <img src={p} alt="review" />
                    <button
                      type="button"
                      className="btn-remove-photo"
                      onClick={() => handleRemovePhoto(idx)}
                      title="Gỡ ảnh này"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="review-footer-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá Xác Thực'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

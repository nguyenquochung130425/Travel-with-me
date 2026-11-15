import React, { useState, useEffect } from 'react';
import {
  Heart, MessageCircle, Share2, Sparkles, Plus, Compass,
  MapPin, Calendar, CheckCircle2, ChevronRight, X, Send,
  Bookmark, User, Tag, Lightbulb, Image as ImageIcon, Flame
} from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

export function CommunitySection({
  authUser,
  openAuth,
  showToast,
  onSelectTour,
  completedBookings = []
}) {
  const { t, formatPrice } = useLocale();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [readingPost, setReadingPost] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());

  // Load posts from SQL Server
  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/community/posts');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPosts(json.data);
      }
    } catch (err) {
      console.error('[Community] Lỗi tải bài viết:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleLike = async (postId, e) => {
    if (e) e.stopPropagation();
    if (likedPosts.has(postId)) {
      showToast('Bạn đã thả tim bài viết này rồi!');
      return;
    }

    setLikedPosts((prev) => new Set(prev).add(postId));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p))
    );

    try {
      await fetch(`/api/community/posts/${postId}/like`, { method: 'POST' });
      showToast('Đã thả tim bài viết!');
    } catch {
      // rollback if failed
    }
  };

  const handleShare = (post, e) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/#community-${post.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Đã sao chép liên kết bài viết vào khay nhớ tạm!');
      });
    } else {
      showToast('Đã tạo liên kết chia sẻ thành công!');
    }
  };

  const openReading = async (postId) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setReadingPost(json.data);
      } else {
        const found = posts.find((p) => p.id === postId);
        if (found) setReadingPost(found);
      }
    } catch {
      const found = posts.find((p) => p.id === postId);
      if (found) setReadingPost(found);
    }
  };

  const filterTags = ['ALL', 'Vịnh Hạ Long', 'Sa Pa', 'Phú Quốc', 'Trekking', 'Du Thuyền'];

  const filteredPosts = posts.filter((p) => {
    if (selectedTag !== 'ALL') {
      const matchTag = p.locationTags?.some((t) =>
        t.toLowerCase().includes(selectedTag.toLowerCase())
      ) || p.title?.toLowerCase().includes(selectedTag.toLowerCase());
      if (!matchTag) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        p.title?.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.authorName?.toLowerCase().includes(q);
      if (!matchQuery) return false;
    }
    return true;
  });

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  return (
    <section className="community-section" id="community-section">
      <div className="community-container">
        {/* Editorial Section Header */}
        <div className="community-editorial-header">
          <div className="community-subtitle-row">
            <span className="editorial-pill">
              <Sparkles size={13} className="text-amber-500" />
              Góc Nhìn Thực Tế · Ký Ức Lữ Khách
            </span>
            <div className="community-live-indicator">
              <span className="live-dot pulse-emerald" />
              <span>Cập nhật liên tục từ các chuyến đi vừa hoàn thành</span>
            </div>
          </div>

          <div className="community-title-action-row">
            <div>
              <h2 className="community-editorial-title">
                Nhật Ký Hành Trình & Cộng Đồng Lữ Hành
              </h2>
              <p className="community-editorial-desc">
                Những thước phim chân thực, trải nghiệm người thật - việc thật cùng mẹo khám phá thực chiến
                được chia sẻ trực tiếp bởi du khách sau khi hoàn thành tour.
              </p>
            </div>

            {/* Create Story Action Button */}
            <button
              className="btn-create-story-luxe"
              onClick={() => {
                if (!authUser) {
                  showToast('Vui lòng đăng nhập để viết nhật ký hành trình của bạn!');
                  if (openAuth) openAuth();
                  return;
                }
                setShowCreateModal(true);
              }}
            >
              <Plus size={18} />
              <span>Chia Sẻ Nhật Ký Mới</span>
            </button>
          </div>

          {/* Filter Bar & Tags */}
          <div className="community-nav-filter-strip">
            <div className="community-tags-scroll">
              {filterTags.map((t) => (
                <button
                  key={t}
                  className={`community-tag-pill-btn ${selectedTag === t ? 'active' : ''}`}
                  onClick={() => setSelectedTag(t)}
                >
                  {t === 'ALL' ? 'Tất cả nhật ký' : `# ${t}`}
                </button>
              ))}
            </div>

            <div className="community-search-input-wrap">
              <Compass size={15} className="search-compass-icon" />
              <input
                type="text"
                placeholder="Tìm ký sự, địa danh, mẹo du lịch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="community-search-field"
              />
              {searchQuery && (
                <button className="btn-clear-search" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stories Content */}
        {isLoading ? (
          <div className="community-loading-state">
            <div className="spinner-border" />
            <p>Đang tải nhật ký hành trình từ cộng đồng lữ hành...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="community-empty-box">
            <Compass size={44} className="text-primary-400" />
            <h4>Chưa có bài viết nào phù hợp với bộ lọc</h4>
            <p>Hãy là người đầu tiên chia sẻ cảm nhận về chuyến đi tuyệt vời của bạn!</p>
          </div>
        ) : (
          <div className="community-bento-layout">
            {/* FEATURED STORY SPOTLIGHT (Tiêu điểm hành trình) */}
            {featuredPost && (
              <div
                className="bento-featured-card animate-fade-in"
                onClick={() => openReading(featuredPost.id)}
              >
                <div className="featured-media-col">
                  <img
                    src={featuredPost.thumbnailUrl}
                    alt={featuredPost.title}
                    className="featured-hero-img"
                    loading="lazy"
                  />
                  <div className="featured-top-badges">
                    <span className="badge-spotlight-gold">
                      <Sparkles size={13} />
                      Tiêu Điểm Lữ Hành
                    </span>
                    <span className="badge-verified-seal">
                      <CheckCircle2 size={13} />
                      {featuredPost.tripBadge || 'Chuyến đi thực tế'}
                    </span>
                  </div>
                  <div className="featured-media-overlay" />
                </div>

                <div className="featured-info-col">
                  <div className="featured-author-row">
                    <img
                      src={featuredPost.authorAvatar}
                      alt={featuredPost.authorName}
                      className="featured-author-avatar"
                    />
                    <div>
                      <h4 className="featured-author-name">{featuredPost.authorName}</h4>
                      <span className="featured-post-date">{featuredPost.date}</span>
                    </div>
                  </div>

                  <h3 className="featured-story-title">{featuredPost.title}</h3>
                  <p className="featured-story-summary">{featuredPost.summary}</p>

                  {/* Traveler's Field Secret Quote */}
                  {featuredPost.travelTips && (
                    <div className="featured-tip-quote-box">
                      <Lightbulb size={16} className="text-amber-500 flex-shrink-0" />
                      <div className="tip-quote-content">
                        <span className="tip-quote-lbl">Bí kíp thực tế từ tác giả:</span>
                        <p>{featuredPost.travelTips.split('\n')[0].replace(/^[•-]\s*/, '')}</p>
                      </div>
                    </div>
                  )}

                  {/* Conversion Tour Suggestion Box */}
                  {featuredPost.tourInfo && (
                    <div
                      className="featured-tour-link-box"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectTour)
                          onSelectTour({ id: featuredPost.tourId, title: featuredPost.tourInfo.title });
                      }}
                    >
                      <div className="tour-link-left">
                        <Compass size={16} className="text-cyan-600" />
                        <div>
                          <span className="tour-link-hint">Tour liên quan đến ký sự:</span>
                          <strong className="tour-link-title">{featuredPost.tourInfo.title}</strong>
                        </div>
                      </div>
                      <div className="tour-link-right">
                        <span className="tour-link-price">{formatPrice(featuredPost.tourInfo.price)}</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  )}

                  {/* Footer Interaction */}
                  <div className="featured-footer-actions">
                    <div className="actions-left">
                      <button
                        className={`btn-story-action ${likedPosts.has(featuredPost.id) ? 'liked' : ''}`}
                        onClick={(e) => handleLike(featuredPost.id, e)}
                      >
                        <Heart size={18} className={likedPosts.has(featuredPost.id) ? 'fill-rose-500 text-rose-500' : ''} />
                        <span>{featuredPost.likesCount} Thích</span>
                      </button>

                      <button
                        className="btn-story-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReading(featuredPost.id);
                        }}
                      >
                        <MessageCircle size={18} />
                        <span>{featuredPost.commentsCount} Bình luận</span>
                      </button>

                      <button
                        className="btn-story-action"
                        onClick={(e) => handleShare(featuredPost, e)}
                        title="Chia sẻ bài viết"
                      >
                        <Share2 size={18} />
                      </button>
                    </div>

                    <button className="btn-read-full-story">
                      <span>Đọc trọn vẹn ký sự</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* COMMUNITY AUTHENTICITY STATS STRIP */}
            <div className="community-stats-strip">
              <div className="stat-pill-item">
                <span className="stat-num">4,800+</span>
                <span className="stat-desc">Khoảnh khắc thực tế được chia sẻ</span>
              </div>
              <div className="stat-strip-divider" />
              <div className="stat-pill-item">
                <span className="stat-num">100%</span>
                <span className="stat-desc">Xác thực qua đơn hàng hoàn tất</span>
              </div>
              <div className="stat-strip-divider" />
              <div className="stat-pill-item">
                <span className="stat-num">4.9 / 5★</span>
                <span className="stat-desc">Độ tin cậy & truyền cảm hứng</span>
              </div>
            </div>

            {/* REMAINING STORIES GRID */}
            <div className="stories-grid-refined">
              {remainingPosts.map((post) => (
                <article
                  key={post.id}
                  className="story-card-refined animate-fade-in"
                  onClick={() => openReading(post.id)}
                >
                  {/* Thumbnail with overlay & badge */}
                  <div className="story-thumb-box">
                    <img
                      src={post.thumbnailUrl}
                      alt={post.title}
                      className="story-thumb-img"
                      loading="lazy"
                    />
                    <div className="story-badge-verified">
                      <CheckCircle2 size={12} />
                      <span>{post.tripBadge || 'Chuyến đi thực tế'}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="story-card-body">
                    <div className="story-author-meta">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="story-author-avatar"
                      />
                      <div>
                        <h4 className="story-author-name">{post.authorName}</h4>
                        <span className="story-date">{post.date}</span>
                      </div>
                    </div>

                    <h3 className="story-title">{post.title}</h3>
                    <p className="story-excerpt">{post.summary}</p>

                    {/* Travel Tips Callout */}
                    {post.travelTips && (
                      <div className="story-tips-preview">
                        <Lightbulb size={13} className="text-amber-500 flex-shrink-0" />
                        <span>{post.travelTips.split('\n')[0].replace(/^[•-]\s*/, '')}</span>
                      </div>
                    )}

                    {/* Tags */}
                    {post.locationTags && post.locationTags.length > 0 && (
                      <div className="story-tags-row">
                        {post.locationTags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="story-tag-pill">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Conversion Tour Suggestion Box */}
                    {post.tourInfo && (
                      <div
                        className="story-tour-conversion-box"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectTour)
                            onSelectTour({ id: post.tourId, title: post.tourInfo.title });
                        }}
                      >
                        <div className="conversion-tour-info">
                          <Compass size={14} className="text-cyan-600" />
                          <span className="conversion-tour-title">{post.tourInfo.title}</span>
                        </div>
                        <div className="conversion-tour-price">
                          {formatPrice(post.tourInfo.price)}
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    )}

                    {/* Actions Footer */}
                    <div className="story-card-footer">
                      <div className="story-interaction-left">
                        <button
                          className={`btn-story-action ${likedPosts.has(post.id) ? 'liked' : ''}`}
                          onClick={(e) => handleLike(post.id, e)}
                          title="Thích bài viết"
                        >
                          <Heart
                            size={16}
                            className={likedPosts.has(post.id) ? 'fill-rose-500 text-rose-500' : ''}
                          />
                          <span>{post.likesCount}</span>
                        </button>

                        <button
                          className="btn-story-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            openReading(post.id);
                          }}
                          title="Bình luận"
                        >
                          <MessageCircle size={16} />
                          <span>{post.commentsCount}</span>
                        </button>

                        <button
                          className="btn-story-action"
                          onClick={(e) => handleShare(post, e)}
                          title="Chia sẻ liên kết"
                        >
                          <Share2 size={16} />
                        </button>
                      </div>

                      <span className="story-read-link">
                        Đọc tiếp <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Đọc chi tiết bài viết (Reading Story Modal) */}
        {readingPost && (
          <StoryDetailModal
            post={readingPost}
            onClose={() => setReadingPost(null)}
            onLike={(id) => handleLike(id)}
            isLiked={likedPosts.has(readingPost.id || `post-${readingPost.postId}`)}
            onShare={(p) => handleShare(p)}
            onSelectTour={onSelectTour}
            showToast={showToast}
            authUser={authUser}
            openAuth={openAuth}
          />
        )}

        {/* Modal: Soạn nhật ký hành trình mới (Create Story Modal) */}
        {showCreateModal && (
          <CreateStoryModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadPosts();
              showToast('Bài viết nhật ký hành trình của bạn đã được xuất bản công khai!');
            }}
            authUser={authUser}
            completedBookings={completedBookings}
          />
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: StoryDetailModal
// ─────────────────────────────────────────────────────────────────────────────
function StoryDetailModal({
  post,
  onClose,
  onLike,
  isLiked,
  onShare,
  onSelectTour,
  showToast,
  authUser,
  openAuth
}) {
  const { formatPrice } = useLocale();
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!authUser) {
      showToast('Vui lòng đăng nhập để gửi bình luận!');
      if (openAuth) openAuth();
      return;
    }

    setIsSubmittingComment(true);
    const postIdClean = String(post.id || post.postId).replace(/^post-/, '');

    try {
      const res = await fetch(`/api/community/posts/${postIdClean}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText.trim(),
          authorName: authUser.fullName || authUser.email?.split('@')[0],
          authorAvatar: authUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          userId: authUser.userId || authUser.id
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setComments([json.data, ...comments]);
        setCommentText('');
        showToast('Đã gửi bình luận thành công!');
      }
    } catch {
      showToast('Lỗi gửi bình luận');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog story-detail-dialog animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="btn-close-modal" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>

        {/* Cover Photo */}
        <div className="story-detail-hero">
          <img src={post.thumbnailUrl} alt={post.title} className="story-detail-img" />
          <div className="story-detail-hero-overlay">
            <span className="story-hero-badge">
              <CheckCircle2 size={14} />
              {post.tripBadge || 'Chuyến đi thực tế đã xác thực'}
            </span>
            <h2 className="story-detail-title">{post.title}</h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="story-detail-body">
          {/* Author Header Bar */}
          <div className="story-detail-author-bar">
            <div className="author-left">
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                className="detail-author-avatar"
              />
              <div>
                <h4 className="detail-author-name">{post.authorName}</h4>
                <span className="detail-post-date">Ngày đăng: {post.date}</span>
              </div>
            </div>

            <div className="detail-actions-right">
              <button
                className={`btn btn-outline btn-detail-action ${isLiked ? 'text-rose-500 border-rose-400' : ''}`}
                onClick={() => onLike(post.id || `post-${post.postId}`)}
              >
                <Heart size={16} className={isLiked ? 'fill-current text-rose-500' : ''} />
                <span>Thích ({post.likesCount})</span>
              </button>
              <button className="btn btn-outline btn-detail-action" onClick={() => onShare(post)}>
                <Share2 size={16} />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>

          {/* Full Article Text */}
          <div className="story-detail-article-text">
            {post.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Travel Tips Box */}
          {post.travelTips && (
            <div className="story-detail-tips-box">
              <div className="tips-box-header">
                <Lightbulb size={20} className="text-amber-500" />
                <h4>Mẹo Du Lịch Hữu Ích Từ Tác Giả</h4>
              </div>
              <ul className="tips-list">
                {post.travelTips.split('\n').map((tip, idx) => (
                  <li key={idx}>{tip.replace(/^[•-]\s*/, '')}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Conversion Tour Suggestion */}
          {post.tourInfo && (
            <div className="story-conversion-tour-card">
              <div className="conversion-tour-left">
                <span className="card-sub-label">TOUR LIÊN QUAN TRONG BÀI VIẾT</span>
                <h3>{post.tourInfo.title}</h3>
                <p>Khởi hành từ: {post.tourInfo.departureLocation} · Thời lượng: {post.tourInfo.duration}</p>
              </div>
              <div className="conversion-tour-right">
                <div className="conversion-price">{formatPrice(post.tourInfo.price)}</div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    if (onSelectTour) onSelectTour({ id: post.tourId, title: post.tourInfo.title });
                  }}
                >
                  Đặt Chuyến Đi Tương Tự
                </button>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="story-comments-section">
            <h3 className="comments-heading">
              Bình luận & Thảo luận ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} className="comment-input-form">
              <textarea
                className="form-control"
                rows={2}
                placeholder="Chia sẻ cảm nghĩ hoặc đặt câu hỏi về chuyến đi này..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={isSubmittingComment}>
                <Send size={15} />
                <span>{isSubmittingComment ? 'Đang gửi...' : 'Gửi Bình Luận'}</span>
              </button>
            </form>

            {/* Comments List */}
            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments-hint">Chưa có bình luận nào. Hãy để lại lời nhắn đầu tiên!</p>
              ) : (
                comments.map((comm) => (
                  <div key={comm.id} className="comment-item-bubble">
                    <img
                      src={comm.authorAvatar}
                      alt={comm.authorName}
                      className="comment-avatar"
                    />
                    <div className="comment-content-box">
                      <div className="comment-header-row">
                        <span className="comment-author-name">{comm.authorName}</span>
                        <span className="comment-date">{comm.date}</span>
                      </div>
                      <p className="comment-text">{comm.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: CreateStoryModal
// ─────────────────────────────────────────────────────────────────────────────
function CreateStoryModal({ onClose, onSuccess, authUser, completedBookings = [] }) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [travelTips, setTravelTips] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [locationTags, setLocationTags] = useState('Vịnh Hạ Long, Du Thuyền 5 Sao');
  const [selectedTourId, setSelectedTourId] = useState(
    completedBookings.length > 0 ? completedBookings[0].tourId : 'tour-1'
  );
  const [tripBadge, setTripBadge] = useState('Đã hoàn thành chuyến đi thực tế');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Vui lòng điền tiêu đề và nội dung bài viết!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim() || title.trim(),
          content: content.trim(),
          travelTips: travelTips.trim(),
          thumbnailUrl:
            thumbnailUrl.trim() ||
            'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
          locationTags: locationTags.trim(),
          tourId: selectedTourId,
          tripBadge: tripBadge.trim(),
          authorName: authUser?.fullName || 'Du khách thân thiết',
          authorAvatar:
            authUser?.avatar ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          userId: authUser?.userId || authUser?.id
        })
      });

      const json = await res.json();
      if (json.success) {
        onSuccess();
      } else {
        alert(json.message || 'Lỗi đăng bài viết');
      }
    } catch {
      alert('Lỗi kết nối khi đăng bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog create-story-dialog animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-story-header">
          <div>
            <h3>Chia Sẻ Nhật Ký Hành Trình Của Bạn</h3>
            <p>Lan tỏa những khoảnh khắc đẹp, mẹo du lịch và kinh nghiệm thực tế tới cộng đồng</p>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-story-form">
          {/* Completed Trip Picker */}
          {completedBookings.length > 0 && (
            <div className="form-field">
              <label>Gắn bài viết với chuyến đi bạn đã hoàn thành:</label>
              <select
                className="form-control"
                value={selectedTourId}
                onChange={(e) => {
                  setSelectedTourId(e.target.value);
                  const selBk = completedBookings.find((b) => b.tourId === e.target.value);
                  if (selBk) {
                    setTripBadge(`Đã hoàn thành tour ${selBk.tourTitle?.slice(0, 30)}...`);
                  }
                }}
              >
                {completedBookings.map((b) => (
                  <option key={b.id || b.bookingId} value={b.tourId}>
                    {b.tourTitle} (Hoàn thành ngày {b.returnDate})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-field">
            <label>Tiêu đề bài viết:</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Kinh Nghiệm Du Thuyền Hạ Long 5 Sao Trọn Vẹn 2N1Đ..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Tóm tắt ngắn (1-2 câu):</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Chuyến đi hoàn hảo cho gia đình với buffet hải sản tôm hùm và chèo thuyền hang Luồn..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Nội dung chia sẻ chi tiết:</label>
            <textarea
              className="form-control"
              rows={6}
              placeholder="Chia sẻ trải nghiệm từng ngày, cảm xúc, khách sạn, hướng dẫn viên, đồ ăn..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Mẹo du lịch hữu ích (Travel Tips):</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="• Nên mang theo áo gió và kem chống nắng&#10;• Chọn phòng tầng cao để ngắm bình minh đẹp nhất..."
              value={travelTips}
              onChange={(e) => setTravelTips(e.target.value)}
            />
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label>Link ảnh bìa bài viết (URL ảnh thực tế):</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://images.unsplash.com/..."
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Thẻ tag địa điểm (phân cách bằng dấu phẩy):</label>
              <input
                type="text"
                className="form-control"
                placeholder="Vịnh Hạ Long, Du Thuyền 5 Sao, Check-in"
                value={locationTags}
                onChange={(e) => setLocationTags(e.target.value)}
              />
            </div>
          </div>

          <div className="create-story-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Hủy Bỏ
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang Xuất Bản...' : 'Xuất Bản Lên Cộng Đồng Ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

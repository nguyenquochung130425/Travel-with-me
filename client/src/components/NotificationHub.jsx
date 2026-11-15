import React, { useState } from 'react';
import {
  Bell, CheckCheck, Clock, Mail, MessageSquare, Smartphone,
  Sparkles, Ticket, X, ChevronRight, Send, AlertCircle, Heart,
  Compass, ShieldCheck, MapPin, ExternalLink
} from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

export function NotificationHub({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onViewTicket,
  onOpenReview,
  onOpenStory,
  onSimulateReminder,
  onActionClick
}) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState('ALL');
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('ZALO');

  if (!isOpen) return null;

  const checkIsUnread = (notif) => {
    if (notif.is_read !== undefined) return notif.is_read === 0 || notif.is_read === false;
    if (notif.isRead !== undefined) return notif.isRead === false;
    return false;
  };

  const hasUnread = notifications.some(checkIsUnread);
  const unreadCount = notifications.filter(checkIsUnread).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'TRIP') return n.type === 'BOOKING_CONFIRMED' || n.type === 'TICKET_ISSUED';
    if (activeTab === 'REMINDER') return n.type === 'TRIP_REMINDER_24H';
    if (activeTab === 'PROMO') return n.type === 'PROMOTION';
    if (activeTab === 'COMMUNITY') return n.type === 'COMMUNITY' || n.type === 'REVIEW_INVITATION' || n.type === 'REVIEW_SUCCESS';
    return true;
  });

  const getChannelBadge = (channel) => {
    switch (channel) {
      case 'ZALO':
        return {
          label: 'Zalo ZNS',
          icon: MessageSquare,
          className: 'channel-badge-zalo',
          color: '#0068FF',
          bg: 'rgba(0, 104, 255, 0.08)'
        };
      case 'SMS':
        return {
          label: 'SMS Brandname',
          icon: Smartphone,
          className: 'channel-badge-sms',
          color: '#059669',
          bg: 'rgba(16, 185, 129, 0.08)'
        };
      case 'EMAIL':
        return {
          label: 'Email',
          icon: Mail,
          className: 'channel-badge-email',
          color: '#D97706',
          bg: 'rgba(217, 119, 6, 0.08)'
        };
      case 'IN_APP':
      default:
        return {
          label: 'In-App Concierge',
          icon: Bell,
          className: 'channel-badge-inapp',
          color: '#0D9488',
          bg: 'rgba(13, 148, 136, 0.08)'
        };
    }
  };

  const handleAction = (notif) => {
    if (checkIsUnread(notif) && onMarkAsRead) {
      onMarkAsRead(notif.id);
    }

    if (onActionClick) {
      onActionClick(notif);
      return;
    }

    const payload = notif.data || {};
    if (payload.action === 'VIEW_TICKET' && onViewTicket) {
      onViewTicket({ bookingCode: payload.bookingCode });
      onClose();
    } else if (payload.action === 'WRITE_REVIEW' && onOpenReview) {
      onOpenReview({ id: payload.bookingId, tourId: payload.tourId });
      onClose();
    } else if (payload.action === 'VIEW_STORY' && onOpenStory) {
      onOpenStory(payload.postId);
      onClose();
    }
  };

  const handleTriggerSimulate = async () => {
    if (onSimulateReminder) {
      setIsSimulating(true);
      await onSimulateReminder(selectedChannel);
      setIsSimulating(false);
    }
  };

  return (
    <div className="notification-hub-backdrop" onClick={onClose}>
      <div
        className="notification-hub-drawer animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luxury Concierge Header */}
        <div className="notif-concierge-header">
          <div className="notif-header-top-meta">
            <span className="concierge-status-pill">
              <span className="concierge-live-dot" />
              Concierge Trực Tuyến 24/7
            </span>
            {hasUnread && (
              <span className="unread-counter-badge">
                {unreadCount} thông báo mới
              </span>
            )}
          </div>

          <div className="notif-header-main-row">
            <div className="notif-title-group">
              <div className="concierge-avatar-icon">
                <Compass size={22} className="text-amber-400" />
              </div>
              <div>
                <h3 className="notif-heading">Trợ Lý & Thông Báo Lữ Hành</h3>
                <p className="notif-subtext">Cập nhật thời gian thực qua Zalo, SMS Brandname & Email</p>
              </div>
            </div>

            <div className="notif-header-actions">
              {hasUnread && (
                <button
                  className="btn-mark-all-concierge"
                  onClick={onMarkAllAsRead}
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck size={15} />
                  <span className="hidden-mobile">Đã đọc hết</span>
                </button>
              )}
              <button className="btn-close-concierge" onClick={onClose} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Channel Tabs */}
          <div className="notif-concierge-tabs">
            <button
              className={`concierge-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              className={`concierge-tab-btn ${activeTab === 'REMINDER' ? 'active' : ''}`}
              onClick={() => setActiveTab('REMINDER')}
            >
              Nhắc lịch 24h
            </button>
            <button
              className={`concierge-tab-btn ${activeTab === 'TRIP' ? 'active' : ''}`}
              onClick={() => setActiveTab('TRIP')}
            >
              Vé & QR Code
            </button>
            <button
              className={`concierge-tab-btn ${activeTab === 'COMMUNITY' ? 'active' : ''}`}
              onClick={() => setActiveTab('COMMUNITY')}
            >
              Cộng đồng & Review
            </button>
            <button
              className={`concierge-tab-btn ${activeTab === 'PROMO' ? 'active' : ''}`}
              onClick={() => setActiveTab('PROMO')}
            >
              Ưu đãi
            </button>
          </div>
        </div>

        {/* Live Simulator Toolbar: Thử nghiệm tự động hóa đa kênh */}
        <div className="notif-concierge-simulator">
          <div className="simulator-label-wrap">
            <Sparkles size={14} className="text-amber-500" />
            <span className="sim-title">Giả lập tự động hóa:</span>
            <span className="sim-desc">Nhắc lịch 24h trước giờ bay/khởi hành</span>
          </div>
          <div className="simulator-actions-wrap">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="concierge-channel-select"
            >
              <option value="ZALO">Kênh Zalo ZNS (Official)</option>
              <option value="SMS">Kênh SMS Brandname (TravelWithMe)</option>
              <option value="EMAIL">Kênh Email Tự Động (VIP)</option>
            </select>
            <button
              className="btn-trigger-reminder"
              onClick={handleTriggerSimulate}
              disabled={isSimulating}
            >
              <Send size={13} />
              <span>{isSimulating ? 'Đang gửi...' : 'Gửi Thử Nghiệm'}</span>
            </button>
          </div>
        </div>

        {/* Notifications Stream */}
        <div className="notif-concierge-stream">
          {filteredNotifications.length === 0 ? (
            <div className="concierge-empty-state">
              <div className="empty-compass-box">
                <Compass size={38} className="text-slate-300" />
              </div>
              <h4 className="empty-title">Không có thông báo nào</h4>
              <p className="empty-desc">
                Hệ thống Concierge sẽ lập tức thông báo khi có vé mới, lịch trình khởi hành hoặc tương tác từ cộng đồng.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const channelInfo = getChannelBadge(notif.channel);
              const ChannelIcon = channelInfo.icon;
              const isUnread = checkIsUnread(notif);
              const isReminder = notif.type === 'TRIP_REMINDER_24H';
              const isTicket = notif.type === 'TICKET_ISSUED' || notif.type === 'BOOKING_CONFIRMED' || notif.data?.action === 'VIEW_TICKET';
              const isReview = notif.type === 'REVIEW_INVITATION' || notif.data?.action === 'WRITE_REVIEW';

              return (
                <div
                  key={notif.id}
                  className={`concierge-card ${isUnread ? 'unread' : 'read'} ${isReminder ? 'reminder-card' : ''}`}
                  onClick={() => handleAction(notif)}
                >
                  {/* Urgency Ribbon for 24h reminders */}
                  {isReminder && (
                    <div className="reminder-urgency-ribbon">
                      <Clock size={12} />
                      <span>Khởi hành trong 24 giờ tới</span>
                    </div>
                  )}

                  <div className="concierge-card-header">
                    <span
                      className="concierge-channel-chip"
                      style={{ color: channelInfo.color, background: channelInfo.bg }}
                    >
                      <ChannelIcon size={12} />
                      <span>{channelInfo.label}</span>
                    </span>

                    <span className="concierge-timestamp">
                      <Clock size={11} />
                      <span>{notif.time || (notif.created_at ? new Date(notif.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong')}</span>
                    </span>
                  </div>

                  <h4 className="concierge-card-title">{notif.title}</h4>
                  <p className="concierge-card-body">{notif.message}</p>

                  {/* Contextual Action CTA Buttons */}
                  {isTicket && (
                    <div className="concierge-action-row">
                      <button
                        className="btn-concierge-action ticket-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(notif);
                        }}
                      >
                        <Ticket size={14} />
                        <span>Xem Vé Điện Tử QR Code</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  {isReview && (
                    <div className="concierge-action-row">
                      <button
                        className="btn-concierge-action review-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(notif);
                        }}
                      >
                        <Sparkles size={14} />
                        <span>Viết Đánh Giá & Chia Sẻ Ảnh</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  {notif.data?.action === 'VIEW_STORY' && (
                    <div className="concierge-action-row">
                      <button
                        className="btn-concierge-action story-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(notif);
                        }}
                      >
                        <Heart size={14} />
                        <span>Xem Bài Viết Cộng Đồng</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}

                  {isUnread && <span className="concierge-unread-dot" title="Chưa đọc" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

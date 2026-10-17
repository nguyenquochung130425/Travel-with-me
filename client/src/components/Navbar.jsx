import React from 'react';
import { Compass, Heart, Briefcase, Shield, User, Sparkles, Crown, Key } from 'lucide-react';

export function Navbar({
  currentView,
  setCurrentView,
  wishlistCount,
  openMyTrips,
  openWishlist,
  currentUser,
  openRoleModal,
  showToast
}) {
  const handleToggleView = () => {
    if (currentView === 'client') {
      // Trying to enter Admin Portal
      if (currentUser?.role === 'USER') {
        showToast('🔒 Khách hàng (USER) không có quyền truy cập Kênh Quản trị! Vui lòng chọn tài khoản Quản trị.');
        openRoleModal();
        return;
      }
      setCurrentView('admin');
    } else {
      setCurrentView('client');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { text: 'Admin', className: 'badge-admin', icon: Crown };
      case 'STAFF':
        return { text: 'Staff', className: 'badge-staff', icon: Briefcase };
      default:
        return { text: 'Khách', className: 'badge-user', icon: User };
    }
  };

  const badgeInfo = getRoleBadge(currentUser?.role);
  const BadgeIcon = badgeInfo.icon;

  return (
    <header className="navbar-wrapper">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <div className="brand-logo" onClick={() => setCurrentView('client')}>
          <div className="logo-icon-box">
            <Compass className="logo-compass animate-spin-slow" size={28} />
          </div>
          <div>
            <div className="brand-name">
              TRAVEL <span className="brand-highlight">WITH ME</span>
            </div>
            <div className="brand-slogan">Trải Nghiệm Du Lịch Đích Thực</div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="nav-menu">
          <button
            className={`nav-link ${currentView === 'client' ? 'active' : ''}`}
            onClick={() => setCurrentView('client')}
          >
            Khám Phá Tour
          </button>
          <a href="#featured-section" className="nav-link">
            Tour Bán Chạy
          </a>
          <a href="#categories-section" className="nav-link">
            Chủ Đề Du Lịch
          </a>
          <button className="nav-link highlight-tag" onClick={openMyTrips}>
            <Briefcase size={16} />
            <span>Chuyến Đi Của Tôi</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="nav-actions">
          {/* Wishlist Button */}
          <button
            className="action-icon-btn"
            title="Tour Yêu Thích"
            onClick={openWishlist}
          >
            <Heart size={20} className={wishlistCount > 0 ? 'heart-active' : ''} />
            {wishlistCount > 0 && (
              <span className="badge-bubble">{wishlistCount}</span>
            )}
          </button>

          {/* Mode Switcher: Client vs Admin (RBAC Protected) */}
          <button
            className={`mode-toggle-btn ${currentView === 'admin' ? 'admin-active' : ''}`}
            onClick={handleToggleView}
            title={currentUser?.role === 'USER' ? 'Cần quyền Admin để mở' : 'Chuyển đổi giao diện Khách hàng & Quản trị'}
          >
            {currentView === 'client' ? (
              <>
                <Shield size={16} />
                <span>Kênh Quản Trị</span>
                {currentUser?.role === 'USER' && <span className="lock-dot" title="Chặn quyền">🔒</span>}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Xem Giao Diện Khách</span>
              </>
            )}
          </button>

          {/* User Profile Avatar with RBAC Switcher */}
          <div
            className="user-profile-btn"
            onClick={openRoleModal}
            title="Nhấp để xem và đổi phân quyền tài khoản (RBAC)"
          >
            <div className="user-avatar">
              <BadgeIcon size={18} />
            </div>
            <div className="user-meta">
              <span className="user-name">{currentUser?.fullName?.split(' ')[0] || 'Tài khoản'}</span>
              <span className={`user-role-pill ${badgeInfo.className}`}>
                {badgeInfo.text}
              </span>
            </div>
            <Key size={14} className="key-icon-hint text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
}


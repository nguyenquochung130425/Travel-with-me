import React from 'react';
import {
  Compass, Heart, Briefcase, Shield, User, Sparkles,
  Crown, Key, LogIn, LogOut, Award, ChevronLeft, ChevronRight,
  Flame, Layers, X, Menu, Palmtree, MapPin
} from 'lucide-react';

export function Sidebar({
  isOpen,
  onToggle,
  onClose,
  currentView,
  setCurrentView,
  wishlistCount,
  bookingsCount = 0,
  openMyTrips,
  openWishlist,
  currentUser,
  authUser,
  openRoleModal,
  openAuth,
  onLogout,
  showToast
}) {
  const effectiveRole = authUser?.role || currentUser?.role || 'USER';
  const isAdmin = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'ADMIN';
  const canAccessAdmin = isAdmin || effectiveRole === 'STAFF';

  const handleToggleView = () => {
    if (currentView === 'client') {
      if (!canAccessAdmin) {
        showToast('🔒 Khách hàng (USER) không có quyền truy cập Kênh Quản trị!');
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

  const badgeInfo = getRoleBadge(effectiveRole);
  const BadgeIcon = badgeInfo.icon;

  const displayName = authUser
    ? (authUser.fullName?.trim() || authUser.email?.split('@')[0] || 'Thành viên')
    : (currentUser?.fullName?.split(' ')[0] || 'Tài khoản');

  const eloScore = authUser?.elo ?? 1000;

  const handleNavClick = (action) => {
    if (action) action();
    // Trên màn hình mobile, tự động đóng drawer sau khi chọn
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div className="sidebar-backdrop-overlay" onClick={onClose} aria-hidden="true" />
      )}

      {/* Main Sidebar Element */}
      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => handleNavClick(() => setCurrentView('client'))}>
            <div className="sidebar-logo-box">
              <Compass className="animate-spin-slow" size={24} />
            </div>
            {isOpen && (
              <div className="sidebar-brand-text">
                <span className="sidebar-title">TRAVEL <span className="highlight">WITH ME</span></span>
                <span className="sidebar-subtitle">Khám Phá Việt Nam</span>
              </div>
            )}
          </div>

          {/* Toggle / Close Button */}
          <button
            className="sidebar-toggle-btn"
            onClick={onToggle}
            title={isOpen ? "Thu gọn menu (Ẩn)" : "Mở rộng menu"}
            aria-label={isOpen ? "Thu gọn menu" : "Mở rộng menu"}
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navigation Menu List */}
        <div className="sidebar-content">
          <div className="sidebar-section-label">
            {isOpen ? <span>DANH MỤC KHÁM PHÁ</span> : <span>•••</span>}
          </div>

          <nav className="sidebar-nav">
            {/* 1. Khám Phá Tour */}
            <button
              className={`sidebar-nav-item ${currentView === 'client' ? 'active' : ''}`}
              onClick={() => handleNavClick(() => setCurrentView('client'))}
              title="Khám Phá Tour"
            >
              <div className="nav-item-icon">
                <Compass size={20} />
              </div>
              {isOpen && <span className="nav-item-text">Khám Phá Tour</span>}
            </button>

            {/* 2. Tour Bán Chạy */}
            <a
              href="#catalog-section"
              className="sidebar-nav-item"
              onClick={() => handleNavClick()}
              title="Tour Bán Chạy"
            >
              <div className="nav-item-icon text-amber">
                <Flame size={20} />
              </div>
              {isOpen && (
                <>
                  <span className="nav-item-text">Tour Bán Chạy</span>
                  <span className="nav-item-tag hot">HOT</span>
                </>
              )}
            </a>

            {/* 3. Chủ Đề Du Lịch */}
            <a
              href="#catalog-section"
              className="sidebar-nav-item"
              onClick={() => handleNavClick()}
              title="Chủ Đề Du Lịch"
            >
              <div className="nav-item-icon text-cyan">
                <Palmtree size={20} />
              </div>
              {isOpen && <span className="nav-item-text">Chủ Đề Du Lịch</span>}
            </a>

            {/* 4. Chuyến Đi Của Tôi */}
            <button
              className="sidebar-nav-item highlight-item"
              onClick={() => handleNavClick(openMyTrips)}
              title="Chuyến Đi Của Tôi"
            >
              <div className="nav-item-icon text-orange">
                <Briefcase size={20} />
              </div>
              {isOpen && (
                <>
                  <span className="nav-item-text">Chuyến Đi Của Tôi</span>
                  {bookingsCount > 0 && (
                    <span className="nav-item-badge blue">{bookingsCount}</span>
                  )}
                </>
              )}
            </button>

            {/* 5. Tour Yêu Thích */}
            <button
              className="sidebar-nav-item"
              onClick={() => handleNavClick(openWishlist)}
              title="Tour Yêu Thích"
            >
              <div className="nav-item-icon text-rose">
                <Heart size={20} className={wishlistCount > 0 ? 'heart-active' : ''} />
              </div>
              {isOpen && (
                <>
                  <span className="nav-item-text">Tour Yêu Thích</span>
                  {wishlistCount > 0 && (
                    <span className="nav-item-badge rose">{wishlistCount}</span>
                  )}
                </>
              )}
            </button>

            {/* 6. Admin Portal (Only shown for Admin/Staff) */}
            {canAccessAdmin && (
              <>
                <div className="sidebar-section-label admin-label">
                  {isOpen ? <span>QUẢN TRỊ VIÊN</span> : <span>•••</span>}
                </div>
                <button
                  className={`sidebar-nav-item admin-item ${currentView === 'admin' ? 'active' : ''}`}
                  onClick={() => handleNavClick(handleToggleView)}
                  title="Kênh Quản Trị"
                >
                  <div className="nav-item-icon">
                    <Shield size={20} />
                  </div>
                  {isOpen && (
                    <>
                      <span className="nav-item-text">
                        {currentView === 'admin' ? 'Xem Giao Diện Khách' : 'Kênh Quản Trị'}
                      </span>
                      <span className="nav-item-badge purple">Portal</span>
                    </>
                  )}
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer User Section */}
        <div className="sidebar-footer">
          {authUser ? (
            <div className="sidebar-user-card">
              <div
                className={`sidebar-user-avatar-wrap ${isAdmin ? 'cursor-pointer' : ''}`}
                onClick={isAdmin ? openRoleModal : undefined}
                title={isAdmin ? "Quản lý phân quyền vai trò (RBAC)" : `Tài khoản: ${displayName}`}
              >
                <div className="sidebar-user-avatar">
                  {authUser.avatar ? (
                    <img src={authUser.avatar} alt="Avatar" className="user-avatar-img" />
                  ) : (
                    <BadgeIcon size={18} />
                  )}
                </div>
                {isOpen && (
                  <div className="sidebar-user-info">
                    <span className="sidebar-user-name">{displayName}</span>
                    <div className="sidebar-user-pills">
                      <span className="user-elo-pill">
                        <Award size={10} />
                        <span>{eloScore}</span>
                      </span>
                      <span className={`user-role-pill ${badgeInfo.className}`}>
                        {badgeInfo.text}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {isOpen && (
                <button
                  className="sidebar-logout-btn"
                  onClick={onLogout}
                  title="Đăng xuất"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="sidebar-guest-card">
              {isOpen ? (
                <button className="btn btn-primary btn-block btn-sidebar-login" onClick={openAuth}>
                  <LogIn size={17} />
                  <span>Đăng Nhập Ngay</span>
                </button>
              ) : (
                <button className="action-icon-btn btn-guest-icon" onClick={openAuth} title="Đăng nhập">
                  <LogIn size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

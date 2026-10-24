import React from 'react';
import { Compass, Heart, Briefcase, Shield, User, Sparkles, Crown, Key, LogIn, LogOut, Award } from 'lucide-react';

export function Navbar({
  currentView,
  setCurrentView,
  wishlistCount,
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
      // Trying to enter Admin Portal
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

          {/* Mode Switcher: Client vs Admin (Only shown for Admin & Staff) */}
          {canAccessAdmin && (
            <button
              className={`mode-toggle-btn ${currentView === 'admin' ? 'admin-active' : ''}`}
              onClick={handleToggleView}
              title="Chuyển đổi giao diện Khách hàng & Quản trị"
            >
              {currentView === 'client' ? (
                <>
                  <Shield size={16} />
                  <span>Kênh Quản Trị</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Xem Giao Diện Khách</span>
                </>
              )}
            </button>
          )}

          {/* User Auth & Profile Section */}
          {authUser ? (
            <div className="nav-auth-logged-in">
              <div
                className={`user-profile-btn ${!isAdmin ? 'cursor-default' : ''}`}
                onClick={isAdmin ? openRoleModal : undefined}
                title={isAdmin ? "Tài khoản Quản trị viên · Nhấp để quản lý phân quyền (RBAC)" : `Tài khoản: ${displayName}`}
              >
                <div className="user-avatar">
                  {authUser.avatar ? (
                    <img src={authUser.avatar} alt="Avatar" className="user-avatar-img" />
                  ) : (
                    <BadgeIcon size={18} />
                  )}
                </div>
                <div className="user-meta">
                  <span className="user-name">{displayName}</span>
                  <div className="user-sub-pills">
                    <span className="user-elo-pill" title={`Hệ số uy tín du lịch: ${eloScore} Elo`}>
                      <Award size={11} />
                      <span>{eloScore} Elo</span>
                    </span>
                    <span className={`user-role-pill ${badgeInfo.className}`}>
                      {badgeInfo.text}
                    </span>
                  </div>
                </div>
                {isAdmin && <Key size={14} className="key-icon-hint text-amber-500" title="Quản lý vai trò (RBAC)" />}
              </div>

              {/* Logout Button */}
              <button
                className="btn-auth-logout"
                onClick={onLogout}
                title="Đăng xuất khỏi tài khoản"
              >
                <LogOut size={16} />
                <span className="logout-text">Đăng Xuất</span>
              </button>
            </div>
          ) : (
            <div className="nav-auth-guest">
              <button
                className="btn-auth-login"
                onClick={openAuth}
                title="Đăng nhập hoặc đăng ký tài khoản"
              >
                <LogIn size={16} />
                <span>Đăng Nhập</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


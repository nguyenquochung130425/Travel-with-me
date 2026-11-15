import React, { useState, useRef, useEffect } from 'react';
import { Compass, Heart, Briefcase, Shield, User, Sparkles, Crown, Key, LogIn, LogOut, Award, Menu, PanelLeftClose, PanelLeftOpen, Bell, Globe, DollarSign, BookOpen } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

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
  showToast,
  isSidebarOpen,
  onToggleSidebar,
  onOpenNotifications,
  unreadNotificationsCount = 0
}) {
  const { language, setLanguage, currency, setCurrency, t } = useLocale();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showCurrDropdown, setShowCurrDropdown] = useState(false);
  const langRef = useRef(null);
  const currRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
      if (currRef.current && !currRef.current.contains(e.target)) {
        setShowCurrDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* Left Section: Sidebar Toggle & Brand */}
        <div className="navbar-left-group">
          <button
            className="sidebar-toggle-trigger"
            onClick={onToggleSidebar}
            title={isSidebarOpen ? "Ẩn thanh menu bên trái (Ctrl+B)" : "Hiện thanh menu bên trái (Ctrl+B)"}
            aria-label="Toggle Sidebar"
          >
            {isSidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={22} />}
            <span className="trigger-label hidden-mobile">
              {isSidebarOpen ? 'Ẩn Menu' : 'Hiện Menu'}
            </span>
          </button>

          {/* Brand Logo (Always visible or when sidebar is collapsed) */}
          <div className="brand-logo" onClick={() => setCurrentView('client')}>
            <div className="logo-icon-box">
              <Compass className="logo-compass animate-spin-slow" size={26} />
            </div>
            <div className="brand-text-block">
              <div className="brand-name">
                TRAVEL <span className="brand-highlight">WITH ME</span>
              </div>
              <div className="brand-slogan hidden-mobile">Trải Nghiệm Du Lịch Đích Thực</div>
            </div>
          </div>
        </div>

        {/* Center Section: Quick Highlights or Navigation */}
        <div className="navbar-center-info hidden-tablet">
          <button
            className={`nav-community-link ${currentView === 'community' ? 'active' : ''}`}
            onClick={() => setCurrentView(currentView === 'community' ? 'client' : 'community')}
            title="Khám phá Nhật ký hành trình & Cộng đồng du lịch"
          >
            <BookOpen size={15} className="text-cyan" />
            <span>{t('community')}</span>
            <span className="community-badge-glow">UGC</span>
          </button>
        </div>

        {/* Right Section: Action Controls */}
        <div className="nav-actions">
          {/* Language Selector Dropdown */}
          <div className="locale-dropdown-wrapper" ref={langRef}>
            <button
              className="locale-pill-btn"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              title="Chuyển đổi ngôn ngữ / Switch Language"
              aria-label="Language Selector"
            >
              <Globe size={16} />
              <span className="locale-curr-text">{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
            </button>
            {showLangDropdown && (
              <div className="locale-menu-popover animate-fade-in">
                <button
                  className={`locale-option ${language === 'vi' ? 'selected' : ''}`}
                  onClick={() => { setLanguage('vi'); setShowLangDropdown(false); }}
                >
                  <span className="flag-icon">🇻🇳</span>
                  <span>Tiếng Việt</span>
                </button>
                <button
                  className={`locale-option ${language === 'en' ? 'selected' : ''}`}
                  onClick={() => { setLanguage('en'); setShowLangDropdown(false); }}
                >
                  <span className="flag-icon">🇬🇧</span>
                  <span>English</span>
                </button>
              </div>
            )}
          </div>

          {/* Currency Selector Dropdown */}
          <div className="locale-dropdown-wrapper" ref={currRef}>
            <button
              className="locale-pill-btn"
              onClick={() => setShowCurrDropdown(!showCurrDropdown)}
              title="Chuyển đổi tiền tệ / Currency Rate"
              aria-label="Currency Selector"
            >
              <DollarSign size={16} />
              <span className="locale-curr-text">{currency}</span>
            </button>
            {showCurrDropdown && (
              <div className="locale-menu-popover animate-fade-in">
                <button
                  className={`locale-option ${currency === 'VND' ? 'selected' : ''}`}
                  onClick={() => { setCurrency('VND'); setShowCurrDropdown(false); }}
                >
                  <span className="curr-symbol">₫</span>
                  <span>VNĐ (Việt Nam)</span>
                </button>
                <button
                  className={`locale-option ${currency === 'USD' ? 'selected' : ''}`}
                  onClick={() => { setCurrency('USD'); setShowCurrDropdown(false); }}
                >
                  <span className="curr-symbol">$</span>
                  <span>USD (US Dollar)</span>
                </button>
                <button
                  className={`locale-option ${currency === 'EUR' ? 'selected' : ''}`}
                  onClick={() => { setCurrency('EUR'); setShowCurrDropdown(false); }}
                >
                  <span className="curr-symbol">€</span>
                  <span>EUR (Euro)</span>
                </button>
                <button
                  className={`locale-option ${currency === 'JPY' ? 'selected' : ''}`}
                  onClick={() => { setCurrency('JPY'); setShowCurrDropdown(false); }}
                >
                  <span className="curr-symbol">¥</span>
                  <span>JPY (Japanese Yen)</span>
                </button>
              </div>
            )}
          </div>

          {/* Notification Hub Trigger Button */}
          <button
            className="action-icon-btn notif-bell-btn"
            title="Trung tâm thông báo đa kênh"
            onClick={onOpenNotifications}
            aria-label="Notifications"
          >
            <Bell size={20} className={unreadNotificationsCount > 0 ? 'bell-ringing' : ''} />
            {unreadNotificationsCount > 0 && (
              <span className="badge-bubble badge-bubble-danger">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

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
                  <span className="hidden-mobile">{t('adminPortal')}</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span className="hidden-mobile">{t('clientPortal')}</span>
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
                <div className="user-meta hidden-mobile">
                  <span className="user-name">{displayName}</span>
                  <div className="user-sub-pills">
                    <span className="user-elo-pill" title={`Hệ số uy tín: ${eloScore} Elo`}>
                      <Award size={11} />
                      <span>{eloScore} Elo</span>
                    </span>
                    <span className={`user-role-pill ${badgeInfo.className}`}>
                      {badgeInfo.text}
                    </span>
                  </div>
                </div>
                {isAdmin && <Key size={14} className="key-icon-hint text-amber-500 hidden-mobile" title="Quản lý vai trò (RBAC)" />}
              </div>

              {/* Logout Button */}
              <button
                className="btn-auth-logout"
                onClick={onLogout}
                title="Đăng xuất khỏi tài khoản"
              >
                <LogOut size={16} />
                <span className="logout-text hidden-mobile">{t('logout')}</span>
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
                <span>{t('login')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


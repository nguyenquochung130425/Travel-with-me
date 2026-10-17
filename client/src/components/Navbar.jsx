import React from 'react';
import { Compass, Heart, Briefcase, Shield, User, Sparkles } from 'lucide-react';

export function Navbar({
  currentView,
  setCurrentView,
  wishlistCount,
  openMyTrips,
  openWishlist
}) {
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

          {/* Mode Switcher: Client vs Admin */}
          <button
            className={`mode-toggle-btn ${currentView === 'admin' ? 'admin-active' : ''}`}
            onClick={() => setCurrentView(currentView === 'client' ? 'admin' : 'client')}
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

          {/* User Profile Avatar */}
          <div className="user-profile-btn" onClick={openMyTrips}>
            <div className="user-avatar">
              <User size={18} />
            </div>
            <div className="user-meta">
              <span className="user-name">Quốc Hùng</span>
              <span className="user-role">Thành viên VIP</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

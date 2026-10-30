import React from 'react';
import { Search, MapPin, Calendar, DollarSign, Compass, Star, ShieldCheck, Award, Sparkles, TrendingUp } from 'lucide-react';

export function HeroSection({ filters, setFilters, onSearch }) {
  const handleInputChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuickDestination = (dest) => {
    setFilters((prev) => ({ ...prev, destinationCity: dest }));
    if (onSearch) onSearch();
  };

  return (
    <section className="hero-section">
      {/* Dynamic Ambient Background Glows */}
      <div className="hero-backdrop-glow hero-glow-1"></div>
      <div className="hero-backdrop-glow hero-glow-2"></div>
      
      <div className="container hero-content">
        {/* Badges on top */}
        <div className="hero-top-badges animate-fade-in">
          <span className="hero-pill hero-pill-premium">
            <Award size={15} className="text-amber" />
            <span>Nền tảng đặt tour trực tuyến số 1 Việt Nam</span>
          </span>
          <span className="hero-pill">
            <ShieldCheck size={15} className="text-emerald" />
            <span>Cam kết giữ chỗ 100% & Hoàn tiền linh hoạt</span>
          </span>
          <span className="hero-pill hero-pill-hot hidden-mobile">
            <Sparkles size={14} className="text-cyan" />
            <span>Ưu đãi mùa lễ hội tới 30%</span>
          </span>
        </div>

        {/* Main Title with Majestic Typography */}
        <h1 className="hero-title animate-fade-in">
          Khám Phá Vẻ Đẹp Việt Nam <br />
          <span className="hero-title-gradient">Cùng Những Hành Trình Độc Bản</span>
        </h1>
        <p className="hero-subtitle animate-fade-in">
          Tận hưởng kỳ nghỉ sang trọng trên du thuyền Hạ Long 5 sao, chạm tay vào đỉnh Fansipan hùng vĩ 
          hay đắm mình trong làn nước ngọc bích Phú Quốc với dịch vụ chuẩn quốc tế.
        </p>

        {/* Smart Multi-Filter Floating Box */}
        <div className="hero-filter-card glass-panel animate-fade-in">
          <div className="filter-grid">
            {/* Điểm khởi hành */}
            <div className="filter-field">
              <label className="field-label">
                <MapPin size={16} className="text-primary" />
                <span>Điểm khởi hành</span>
              </label>
              <div className="field-select-wrapper">
                <select
                  className="field-input"
                  value={filters.departureCity}
                  onChange={(e) => handleInputChange('departureCity', e.target.value)}
                >
                  <option value="all">Tất cả điểm đi</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP.HCM">TP. Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>
            </div>

            {/* Điểm đến */}
            <div className="filter-field">
              <label className="field-label">
                <Compass size={16} className="text-primary" />
                <span>Điểm đến mơ ước</span>
              </label>
              <div className="field-select-wrapper">
                <select
                  className="field-input"
                  value={filters.destinationCity}
                  onChange={(e) => handleInputChange('destinationCity', e.target.value)}
                >
                  <option value="all">Tất cả điểm đến</option>
                  <option value="Hạ Long">Vịnh Hạ Long</option>
                  <option value="Đà Nẵng">Đà Nẵng - Hội An</option>
                  <option value="Sa Pa">Sa Pa - Fansipan</option>
                  <option value="Phú Quốc">Đảo Ngọc Phú Quốc</option>
                </select>
              </div>
            </div>

            {/* Ngày khởi hành */}
            <div className="filter-field">
              <label className="field-label">
                <Calendar size={16} className="text-primary" />
                <span>Ngày đi dự kiến</span>
              </label>
              <input
                type="date"
                className="field-input"
                value={filters.departureDate || ''}
                onChange={(e) => handleInputChange('departureDate', e.target.value)}
              />
            </div>

            {/* Mức giá */}
            <div className="filter-field">
              <label className="field-label">
                <DollarSign size={16} className="text-primary" />
                <span>Mức ngân sách</span>
              </label>
              <div className="field-select-wrapper">
                <select
                  className="field-input"
                  value={filters.priceRange}
                  onChange={(e) => handleInputChange('priceRange', e.target.value)}
                >
                  <option value="all">Mọi mức giá</option>
                  <option value="under_4m">Dưới 4.000.000 đ</option>
                  <option value="4m_6m">4.000.000 đ - 6.000.000 đ</option>
                  <option value="above_6m">Trên 6.000.000 đ</option>
                </select>
              </div>
            </div>

            {/* Action Search Button */}
            <div className="filter-action-box">
              <button className="btn btn-accent btn-search-hero" onClick={onSearch}>
                <Search size={20} />
                <span>Tìm Chuyến Đi</span>
              </button>
            </div>
          </div>

          {/* Quick Trending Destinations Bar */}
          <div className="hero-quick-tags">
            <span className="quick-tags-label">
              <TrendingUp size={14} className="text-amber" />
              <span>Gợi ý xu hướng:</span>
            </span>
            <button
              type="button"
              className={`quick-tag-btn ${filters.destinationCity === 'Hạ Long' ? 'active' : ''}`}
              onClick={() => handleQuickDestination('Hạ Long')}
            >
              Du thuyền Hạ Long
            </button>
            <button
              type="button"
              className={`quick-tag-btn ${filters.destinationCity === 'Phú Quốc' ? 'active' : ''}`}
              onClick={() => handleQuickDestination('Phú Quốc')}
            >
              Đảo Ngọc Phú Quốc
            </button>
            <button
              type="button"
              className={`quick-tag-btn ${filters.destinationCity === 'Đà Nẵng' ? 'active' : ''}`}
              onClick={() => handleQuickDestination('Đà Nẵng')}
            >
              Đà Nẵng - Cầu Vàng
            </button>
            <button
              type="button"
              className={`quick-tag-btn ${filters.destinationCity === 'Sa Pa' ? 'active' : ''}`}
              onClick={() => handleQuickDestination('Sa Pa')}
            >
              Sa Pa - Fansipan
            </button>
          </div>
        </div>

        {/* Quick Highlights Stats with Modern Glass Cards */}
        <div className="hero-stats-row">
          <div className="stat-card">
            <span className="stat-num">50.000+</span>
            <span className="stat-label">Khách hàng tin chọn</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-num">4.95★</span>
            <span className="stat-label">Đánh giá xuất sắc</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-num">100%</span>
            <span className="stat-label">Vé điện tử QR bảo mật</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-num">24/7</span>
            <span className="stat-label">Hỗ trợ hành trình tận tâm</span>
          </div>
        </div>
      </div>
    </section>
  );
}

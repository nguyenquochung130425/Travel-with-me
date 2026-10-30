import React from 'react';
import { Search, ArrowUpDown, X, Sparkles, Compass, Waves, Mountain, Palmtree, Landmark, Heart } from 'lucide-react';

export function FilterBar({
  categories,
  selectedCategory,
  setSelectedCategory,
  keyword,
  setKeyword,
  sortBy,
  setSortBy,
  totalResults
}) {
  const getCategoryIcon = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('du thuyền') || n.includes('biển')) return <Waves size={15} />;
    if (n.includes('núi') || n.includes('khám phá') || n.includes('sa pa')) return <Mountain size={15} />;
    if (n.includes('nghỉ dưỡng') || n.includes('đảo')) return <Palmtree size={15} />;
    if (n.includes('văn hóa') || n.includes('di sản')) return <Landmark size={15} />;
    return <Sparkles size={15} />;
  };

  return (
    <div className="filter-bar-container">
      {/* Categories Row with Icons */}
      <div className="categories-pills-row">
        <button
          className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          <Compass size={15} />
          <span>Tất cả chủ đề</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {getCategoryIcon(cat.name)}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Control Tools Bar */}
      <div className="filter-tools-row glass-panel">
        {/* Search Input with quick clear */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Tìm theo tên tour, địa danh (VD: Hạ Long, Bà Nà, Fansipan, Phú Quốc...)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button
              className="btn-clear-search"
              onClick={() => setKeyword('')}
              title="Xóa tìm kiếm"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="sort-wrapper">
          <ArrowUpDown size={16} className="text-primary-600" />
          <span className="sort-label">Sắp xếp:</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">🔥 Phổ biến nhất</option>
            <option value="rating">⭐ Đánh giá cao nhất (5★)</option>
            <option value="price_asc">📉 Giá từ thấp đến cao</option>
            <option value="price_desc">📈 Giá từ cao xuống thấp</option>
          </select>
        </div>

        {/* Counter Badge */}
        <div className="results-counter">
          Tìm thấy <span className="counter-badge">{totalResults}</span> tour phù hợp
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

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
  return (
    <div className="filter-bar-container">
      {/* Categories Row */}
      <div className="categories-pills-row">
        <button
          className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          <span>Tất cả chủ đề</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Control Tools Bar */}
      <div className="filter-tools-row">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Tìm theo tên tour, địa danh (VD: Hạ Long, Bà Nà, Fansipan...)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="sort-wrapper">
          <ArrowUpDown size={16} className="text-slate-500" />
          <span className="sort-label">Sắp xếp:</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popular">Phổ biến nhất</option>
            <option value="rating">Đánh giá cao nhất (5★)</option>
            <option value="price_asc">Giá từ thấp đến cao</option>
            <option value="price_desc">Giá từ cao xuống thấp</option>
          </select>
        </div>

        {/* Counter */}
        <div className="results-counter">
          Tìm thấy <strong>{totalResults}</strong> tour phù hợp
        </div>
      </div>
    </div>
  );
}

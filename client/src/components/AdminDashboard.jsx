import React, { useState } from 'react';
import {
  TrendingUp, Users, ShoppingBag, AlertTriangle, Download,
  CheckCircle, Clock, Search, Filter, ShieldCheck, Tag, ArrowUpRight,
  Plus, Pencil, Trash2
} from 'lucide-react';
import { AdminTourForm } from './AdminTourForm';

export function AdminDashboard({
  tours,
  managedTours = [],
  bookings,
  coupons,
  onUpdateBookingStatus,
  isTourAdmin,
  onCreateTour,
  onUpdateTour,
  onDeleteTour
}) {
  const [activeTab, setActiveTab] = useState('bookings'); // 'overview' | 'bookings' | 'inventory' | 'coupons'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingTour, setEditingTour] = useState(null);
  const [showTourForm, setShowTourForm] = useState(false);
  const [tourActionError, setTourActionError] = useState('');

  // Thống kê tổng
  const totalRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + Number(b.finalAmount), 0);

  const totalBookings = bookings.length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'REFUNDED').length;
  const cancellationRate = totalBookings > 0 ? ((cancelledCount / totalBookings) * 100).toFixed(1) : 0;

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tourTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Mã Đơn,Tên Khách Hàng,SĐT,Email,Tên Tour,Ngày Khởi Hành,Số Khách,Tổng Tiền,Trạng Thái\n';
    const rows = filteredBookings
      .map(
        (b) =>
          `"${b.bookingCode}","${b.contactName}","${b.contactPhone}","${b.contactEmail}","${b.tourTitle}","${b.departureDate}",${b.totalPassengers},${b.finalAmount},"${b.status}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_Sach_Hanh_Khach_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteTour = async (tour) => {
    if (!window.confirm(`Ngừng kinh doanh tour "${tour.title}"? Tour và lịch sử đơn đặt vẫn được giữ trong hệ thống.`)) return;
    setTourActionError('');
    try {
      await onDeleteTour(tour);
    } catch (error) {
      setTourActionError(error.message || 'Không thể ngừng kinh doanh tour.');
    }
  };

  const handleSaveTour = async (payload) => {
    if (editingTour) {
      await onUpdateTour(editingTour, payload);
    } else {
      await onCreateTour(payload);
    }
    setShowTourForm(false);
    setEditingTour(null);
  };

  return (
    <div className="admin-wrapper container animate-fade-in">
      {showTourForm && (
        <AdminTourForm
          tour={editingTour}
          onSave={handleSaveTour}
          onClose={() => {
            setShowTourForm(false);
            setEditingTour(null);
          }}
        />
      )}
      {/* Top Admin Bar */}
      <div className="admin-header-row">
        <div>
          <h2 className="admin-page-title">Hệ Thống Quản Trị Doanh Nghiệp (Admin Portal)</h2>
          <p className="admin-page-sub">Theo dõi doanh thu, điều phối số chỗ (Inventory) và duyệt đơn đặt tour</p>
        </div>

        <div className="admin-actions-bar">
          <button className="btn btn-primary btn-sm" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Xuất Excel / CSV Danh Sách Khách</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="admin-metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-icon-box bg-emerald-light">
            <TrendingUp size={24} className="text-emerald" />
          </div>
          <div className="metric-data">
            <span className="metric-label">Tổng doanh thu thực nhận</span>
            <h3 className="metric-val">{totalRevenue.toLocaleString('vi-VN')} đ</h3>
            <span className="metric-trend text-emerald">↑ +18.4% so với tháng trước</span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon-box bg-blue-light">
            <ShoppingBag size={24} className="text-primary-600" />
          </div>
          <div className="metric-data">
            <span className="metric-label">Tổng số đơn đặt tour</span>
            <h3 className="metric-val">{totalBookings} đơn</h3>
            <span className="metric-trend text-primary-600">{completedCount} chuyến đi đã hoàn thành</span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon-box bg-amber-light">
            <AlertTriangle size={24} className="text-amber" />
          </div>
          <div className="metric-data">
            <span className="metric-label">Tỷ lệ hủy tour / Hoàn tiền</span>
            <h3 className="metric-val">{cancellationRate}%</h3>
            <span className="metric-trend text-amber">{cancelledCount} đơn đã xử lý hoàn phí</span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-icon-box bg-rose-light">
            <ShieldCheck size={24} className="text-rose" />
          </div>
          <div className="metric-data">
            <span className="metric-label">Tour đang kinh doanh</span>
            <h3 className="metric-val">{tours.length} tour</h3>
            <span className="metric-trend text-emerald">100% Chỗ trống được kiểm soát</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart Visualizer */}
      <div className="admin-chart-card glass-panel">
        <div className="chart-header">
          <h4>Biểu đồ tăng trưởng doanh thu 6 tháng gần nhất (VNĐ)</h4>
          <span className="badge badge-emerald">Cập nhật theo thời gian thực</span>
        </div>
        <div className="chart-bars-container">
          {[
            { month: 'Tháng 5', val: 42, label: '42 triệu' },
            { month: 'Tháng 6', val: 68, label: '68 triệu' },
            { month: 'Tháng 7', val: 95, label: '95 triệu' },
            { month: 'Tháng 8', val: 78, label: '78 triệu' },
            { month: 'Tháng 9', val: 84, label: '84 triệu' },
            { month: 'Tháng 10', val: 112, label: '112 triệu' }
          ].map((bar, idx) => (
            <div key={idx} className="chart-column">
              <div className="chart-bar-bg">
                <div
                  className="chart-bar-fill"
                  style={{ height: `${(bar.val / 120) * 100}%` }}
                  title={`${bar.month}: ${bar.label}`}
                >
                  <span className="bar-tooltip">{bar.label}</span>
                </div>
              </div>
              <span className="chart-col-label">{bar.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="admin-subtabs-row">
        <button
          className={`subtab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <span>Quản lý Đơn đặt tour ({bookings.length})</span>
        </button>
        {isTourAdmin && (
          <button
            className={`subtab-btn ${activeTab === 'tours' ? 'active' : ''}`}
            onClick={() => setActiveTab('tours')}
          >
            <span>Quản lý Tour ({managedTours.length})</span>
          </button>
        )}
        <button
          className={`subtab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <span>Kiểm soát Suất đặt (Slots / Inventory)</span>
        </button>
        <button
          className={`subtab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          <span>Khuyến mãi & Coupons ({coupons.length})</span>
        </button>
      </div>

      {/* Tab Content: Bookings Management */}
      {activeTab === 'bookings' && (
        <div className="admin-table-card glass-panel">
          <div className="table-filters-bar">
            <div className="search-box-admin">
              <Search size={16} />
              <input
                type="text"
                placeholder="Tìm theo mã đơn, tên khách, tên tour..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="status-filter-select">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="IN_TOUR">Đang đi tour</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="REFUNDED">Đã hoàn tiền</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Khách Hàng</th>
                  <th>Tour Du Lịch</th>
                  <th>Ngày Đi</th>
                  <th>Số Khách</th>
                  <th>Tổng Tiền</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span className="font-mono font-bold text-primary-700">{b.bookingCode}</span>
                    </td>
                    <td>
                      <div className="customer-info-cell">
                        <strong>{b.contactName}</strong>
                        <small>{b.contactPhone}</small>
                      </div>
                    </td>
                    <td>
                      <span className="tour-title-cell" title={b.tourTitle}>
                        {b.tourTitle}
                      </span>
                    </td>
                    <td>{b.departureDate}</td>
                    <td>{b.totalPassengers} người</td>
                    <td>
                      <strong className="text-emerald">{b.finalAmount.toLocaleString('vi-VN')} đ</strong>
                    </td>
                    <td>
                      <select
                        className={`status-select status-${b.status.toLowerCase()}`}
                        value={b.status}
                        onChange={(e) => onUpdateBookingStatus(b.id, e.target.value)}
                      >
                        <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="IN_TOUR">Đang đi tour</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="CANCELLED">Hủy vé</option>
                        <option value="REFUNDED">Đã hoàn tiền</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => alert(`Chi tiết vé ${b.bookingCode}:\nEmail: ${b.contactEmail}\nGhi chú: ${b.specialNotes || 'Không có'}`)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tours' && isTourAdmin && (
        <div className="admin-table-card glass-panel">
          <div className="admin-tour-list-header">
            <div>
              <h3>Danh sách tour trong SQL Server</h3>
              <p>Tour mẫu chỉ để xem; các tour tạo tại đây có thể chỉnh sửa hoặc ngừng kinh doanh.</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditingTour(null);
                setTourActionError('');
                setShowTourForm(true);
              }}
            >
              <Plus size={16} /> Thêm tour
            </button>
          </div>
          {tourActionError && <p className="admin-tour-error" role="alert">{tourActionError}</p>}
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tour</th>
                  <th>Danh mục</th>
                  <th>Điểm đến</th>
                  <th>Lịch khởi hành</th>
                  <th>Giá từ</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {managedTours.map((tour) => {
                  const minPrice = Math.min(...tour.schedules.map((schedule) => Number(schedule.adultPrice)));
                  return (
                    <tr key={tour.id}>
                      <td>
                        <div className="admin-tour-name-cell">
                          <img src={tour.thumbnailUrl} alt="" />
                          <strong>{tour.title}</strong>
                        </div>
                      </td>
                      <td>{tour.categoryName}</td>
                      <td>{tour.destinationCity}</td>
                      <td>{tour.schedules.length}</td>
                      <td>{Number.isFinite(minPrice) ? `${minPrice.toLocaleString('vi-VN')} đ` : '—'}</td>
                      <td>
                        <span className={`admin-tour-status ${tour.isActive ? 'active' : 'inactive'}`}>
                          {tour.isActive ? 'Đang kinh doanh' : 'Đã ngừng'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-tour-row-actions">
                          <button
                            className="btn btn-outline btn-xs"
                            onClick={() => {
                              setEditingTour(tour);
                              setTourActionError('');
                              setShowTourForm(true);
                            }}
                          >
                            <Pencil size={14} /> Sửa
                          </button>
                          {tour.isActive && (
                            <button className="btn btn-outline btn-xs admin-tour-delete" onClick={() => handleDeleteTour(tour)}>
                              <Trash2 size={14} /> Ngừng
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {managedTours.length === 0 && (
                  <tr><td colSpan="7" className="admin-tour-empty">Chưa có tour nào trong database. Chọn “Thêm tour” để bắt đầu.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Inventory / Slots */}
      {activeTab === 'inventory' && (
        <div className="admin-table-card glass-panel">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên Tour</th>
                  <th>Ngày Khởi Hành</th>
                  <th>Ngày Về</th>
                  <th>Số Chỗ Tối Đa</th>
                  <th>Đã Đặt</th>
                  <th>Còn Lại</th>
                  <th>Tình Trạng</th>
                </tr>
              </thead>
              <tbody>
                {tours.flatMap((t) =>
                  t.schedules.map((s) => {
                    const remaining = s.maxCapacity - s.bookedSlots;
                    const percent = Math.round((s.bookedSlots / s.maxCapacity) * 100);
                    return (
                      <tr key={s.id}>
                        <td><strong>{t.title}</strong></td>
                        <td>{s.departureDate}</td>
                        <td>{s.returnDate}</td>
                        <td>{s.maxCapacity} chỗ</td>
                        <td>
                          <div className="slot-progress-cell">
                            <span>{s.bookedSlots} chỗ ({percent}%)</span>
                            <div className="progress-bar">
                              <div
                                className={`progress-fill ${percent >= 100 ? 'bg-rose' : percent >= 80 ? 'bg-amber' : 'bg-emerald'}`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong className={remaining <= 3 ? 'text-rose' : 'text-emerald'}>
                            {remaining} chỗ
                          </strong>
                        </td>
                        <td>
                          {remaining <= 0 ? (
                            <span className="badge badge-rose">Hết chỗ</span>
                          ) : (
                            <span className="badge badge-emerald">Đang mở bán</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Coupons */}
      {activeTab === 'coupons' && (
        <div className="admin-table-card glass-panel">
          <div className="coupons-grid">
            {coupons.map((c) => (
              <div key={c.code} className="coupon-admin-card">
                <div className="coupon-code-badge">
                  <Tag size={16} />
                  <span>{c.code}</span>
                </div>
                <p className="coupon-desc">{c.description}</p>
                <div className="coupon-meta">
                  <span>Mức giảm: <strong>{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `${c.discountValue.toLocaleString('vi-VN')} đ`}</strong></span>
                  <span>Đơn tối thiểu: <strong>{c.minOrder.toLocaleString('vi-VN')} đ</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

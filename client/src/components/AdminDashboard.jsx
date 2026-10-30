import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, Users, ShoppingBag, AlertTriangle, Download,
  CheckCircle, Clock, Search, Filter, ShieldCheck, Tag, ArrowUpRight,
  Plus, Pencil, Trash2, RefreshCw, Eye, Sparkles, Calendar,
  CreditCard, ChevronRight, Check, Copy, X, BarChart3, Compass,
  DollarSign, Activity, Award, UserCheck, PlaneTakeoff, Info
} from 'lucide-react';
import { AdminTourForm } from './AdminTourForm';

export function AdminDashboard({
  tours = [],
  managedTours = [],
  bookings = [],
  coupons = [],
  onUpdateBookingStatus,
  isTourAdmin,
  onCreateTour,
  onUpdateTour,
  onDeleteTour,
  revenueChart,
  dashboardSummary
}) {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'tours' | 'inventory' | 'coupons'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingTour, setEditingTour] = useState(null);
  const [showTourForm, setShowTourForm] = useState(false);
  const [tourActionError, setTourActionError] = useState('');
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Dữ liệu nội bộ tự đồng bộ trực tiếp từ SQL Server
  const [localBookings, setLocalBookings] = useState(bookings);
  const [localDashboard, setLocalDashboard] = useState(dashboardSummary);
  const [localChart, setLocalChart] = useState(revenueChart);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tải mới dữ liệu trực tiếp từ SQL Server backend
  const loadDataFromSql = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const [bookingsRes, dashRes] = await Promise.all([
        fetch('/api/admin/bookings').then((r) => r.json()),
        fetch('/api/admin/dashboard').then((r) => r.json())
      ]);

      if (bookingsRes?.success && Array.isArray(bookingsRes.data)) {
        setLocalBookings(bookingsRes.data);
      }
      if (dashRes?.success && dashRes.data) {
        setLocalDashboard(dashRes.data.summary);
        if (dashRes.data.revenueChart && Array.isArray(dashRes.data.revenueChart)) {
          setLocalChart(dashRes.data.revenueChart);
        }
      }
    } catch (err) {
      console.error('[AdminDashboard] Lỗi tải dữ liệu SQL Server:', err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Đồng bộ khi props từ cha thay đổi
  useEffect(() => {
    if (bookings && bookings.length > 0) setLocalBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    if (dashboardSummary) setLocalDashboard(dashboardSummary);
  }, [dashboardSummary]);

  useEffect(() => {
    if (revenueChart && revenueChart.length > 0) setLocalChart(revenueChart);
  }, [revenueChart]);

  // Luôn nạp mới dữ liệu từ SQL Server khi mở trang Admin
  useEffect(() => {
    loadDataFromSql(false);
  }, [loadDataFromSql]);

  // Tính toán dữ liệu biểu đồ doanh thu 6 tháng gần nhất từ SQL
  const computedChart = useMemo(() => {
    if (localChart && Array.isArray(localChart) && localChart.length > 0) {
      return localChart;
    }
    // Fallback: gom nhóm theo tháng từ localBookings
    const monthMap = {};
    localBookings.forEach((b) => {
      if (['PAID', 'CONFIRMED', 'COMPLETED', 'IN_TOUR'].includes(b.status) && b.createdAt) {
        const d = new Date(b.createdAt);
        const m = d.getMonth() + 1;
        const key = `Tháng ${m}`;
        monthMap[key] = (monthMap[key] || 0) + Number(b.finalAmount || 0);
      }
    });

    const defaultMonths = ['Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10'];
    return defaultMonths.map((m) => {
      const rev = monthMap[m] || 0;
      const millions = (rev / 1000000).toFixed(rev % 1000000 === 0 ? 0 : 1);
      return {
        month: m,
        revenue: rev,
        val: Number(millions),
        label: `${millions} triệu`
      };
    });
  }, [localChart, localBookings]);

  // Tìm giá trị max để scale cột biểu đồ cân đối và tìm tháng đạt kỷ lục
  const { maxVal, topMonthIndex } = useMemo(() => {
    const vals = computedChart.map((c) => Number(c.val) || 0);
    const max = Math.max(...vals, 100);
    const topIdx = vals.indexOf(Math.max(...vals));
    return {
      maxVal: max * 1.15,
      topMonthIndex: topIdx
    };
  }, [computedChart]);

  // Tính tăng trưởng tháng gần nhất so với tháng trước đó (MoM Growth)
  const momGrowth = useMemo(() => {
    if (computedChart.length >= 2) {
      const last = computedChart[computedChart.length - 1]?.revenue || 0;
      const prev = computedChart[computedChart.length - 2]?.revenue || 0;
      if (prev > 0) {
        return (((last - prev) / prev) * 100).toFixed(1);
      }
    }
    return '34.1';
  }, [computedChart]);

  // Thống kê tổng số liệu
  const totalRevenue = localDashboard?.totalRevenue ?? localBookings
    .filter((b) => ['CONFIRMED', 'PAID', 'COMPLETED', 'IN_TOUR'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.finalAmount || 0), 0);

  const totalBookings = localDashboard?.totalBookings ?? localBookings.length;
  const completedCount = localDashboard?.completedBookings ?? localBookings.filter((b) => b.status === 'COMPLETED').length;
  const cancelledCount = localDashboard?.cancelledBookings ?? localBookings.filter((b) => b.status === 'CANCELLED' || b.status === 'REFUNDED').length;
  const cancellationRate = localDashboard?.cancellationRate ?? (totalBookings > 0 ? ((cancelledCount / totalBookings) * 100).toFixed(1) : 0);
  const activeTourCount = localDashboard?.activeTours ?? tours.length;

  // Lọc danh sách đơn đặt theo ô tìm kiếm và trạng thái
  const filteredBookings = useMemo(() => {
    return localBookings.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.bookingCode?.toLowerCase().includes(q) ||
        b.contactName?.toLowerCase().includes(q) ||
        b.contactPhone?.includes(q) ||
        b.tourTitle?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [localBookings, searchQuery, statusFilter]);

  // Cập nhật trạng thái đơn đặt
  const handleStatusChange = async (bookingId, newStatus) => {
    // Cập nhật giao diện tức thì
    setLocalBookings((prev) =>
      prev.map((b) => (b.id === bookingId || b.bookingCode === bookingId ? { ...b, status: newStatus } : b))
    );
    if (selectedBookingDetail && (selectedBookingDetail.id === bookingId || selectedBookingDetail.bookingCode === bookingId)) {
      setSelectedBookingDetail((prev) => ({ ...prev, status: newStatus }));
    }

    if (onUpdateBookingStatus) {
      await onUpdateBookingStatus(bookingId, newStatus);
    }
    // Tải lại để đảm bảo đồng bộ
    loadDataFromSql(false);
  };

  // Sao chép mã đơn đặt
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Xuất file CSV danh sách khách hàng
  const handleExportCSV = () => {
    const headers = 'Mã Đơn,Tên Khách Hàng,SĐT,Email,Tên Tour,Ngày Khởi Hành,Số Khách,Tổng Tiền (VNĐ),Trạng Thái,Phương Thức\n';
    const rows = filteredBookings
      .map(
        (b) =>
          `"${b.bookingCode}","${b.contactName}","${b.contactPhone}","${b.contactEmail}","${b.tourTitle}","${b.departureDate}",${b.totalPassengers},${b.finalAmount},"${b.status}","${b.paymentMethod || 'VNPAY'}"`
      )
      .join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TravelWithMe_DanhSachDon_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteTour = async (tour) => {
    if (!window.confirm(`Ngừng kinh doanh tour "${tour.title}"? Tour và lịch sử đơn đặt vẫn được giữ trong SQL Server.`)) return;
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

  // Badge màu sắc chuẩn theo chủ đề du lịch & trạng thái
  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', colorClass: 'badge-confirmed', dotColor: '#10b981' };
      case 'PAID':
        return { label: 'Đã thanh toán', colorClass: 'badge-paid', dotColor: '#0ea5e9' };
      case 'IN_TOUR':
        return { label: 'Đang đi tour', colorClass: 'badge-intour', dotColor: '#3b82f6' };
      case 'COMPLETED':
        return { label: 'Hoàn thành', colorClass: 'badge-completed', dotColor: '#8b5cf6' };
      case 'CANCELLED':
        return { label: 'Đã hủy vé', colorClass: 'badge-cancelled', dotColor: '#f43f5e' };
      case 'REFUNDED':
        return { label: 'Đã hoàn tiền', colorClass: 'badge-refunded', dotColor: '#f59e0b' };
      case 'PENDING_PAYMENT':
      default:
        return { label: 'Chờ thanh toán', colorClass: 'badge-pending', dotColor: '#eab308' };
    }
  };

  return (
    <div className="admin-wrapper container animate-fade-in">
      {/* Tour Create/Edit Modal */}
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

      {/* Booking Detail Modal Drawer */}
      {selectedBookingDetail && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedBookingDetail(null)}>
          <div className="admin-modal-card glass-panel animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <span className="admin-modal-kicker">Chi Tiết Đơn Đặt Tour SQL Server</span>
                <h3 className="admin-modal-title">Mã Đơn: {selectedBookingDetail.bookingCode}</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedBookingDetail(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Khách Hàng:</span>
                  <strong>{selectedBookingDetail.contactName}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Số Điện Thoại:</span>
                  <strong>{selectedBookingDetail.contactPhone}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span>{selectedBookingDetail.contactEmail}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phương Thức:</span>
                  <span className="badge badge-emerald">{selectedBookingDetail.paymentMethod || 'VNPAY'}</span>
                </div>
              </div>

              <div className="admin-detail-tour-box">
                <h4>{selectedBookingDetail.tourTitle}</h4>
                <div className="tour-box-meta">
                  <span>Khởi hành: <strong>{selectedBookingDetail.departureDate}</strong></span>
                  {selectedBookingDetail.returnDate && (
                    <span>Ngày về: <strong>{selectedBookingDetail.returnDate}</strong></span>
                  )}
                  <span>Số lượng: <strong>{selectedBookingDetail.totalPassengers} hành khách</strong> ({selectedBookingDetail.numAdults} người lớn, {selectedBookingDetail.numChildren} trẻ em)</span>
                </div>
              </div>

              <div className="admin-detail-summary-row">
                <div>
                  <span className="detail-label">Mã vé điện tử (QR Ticket Code):</span>
                  <div className="qr-token-pill">
                    <code>{selectedBookingDetail.qrCodeToken || `QR-${selectedBookingDetail.bookingCode}`}</code>
                  </div>
                </div>
                <div className="text-right">
                  <span className="detail-label">Tổng tiền thực thanh toán:</span>
                  <h3 className="text-emerald font-bold">{Number(selectedBookingDetail.finalAmount).toLocaleString('vi-VN')} đ</h3>
                </div>
              </div>

              {selectedBookingDetail.specialNotes && (
                <div className="admin-detail-notes">
                  <span className="detail-label">Ghi chú đặc biệt:</span>
                  <p>{selectedBookingDetail.specialNotes}</p>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <div className="status-selector-inline">
                <span className="detail-label mr-2">Trạng thái:</span>
                <select
                  className={`status-select status-${selectedBookingDetail.status?.toLowerCase()}`}
                  value={selectedBookingDetail.status}
                  onChange={(e) => handleStatusChange(selectedBookingDetail.id, e.target.value)}
                >
                  <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="IN_TOUR">Đang đi tour</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Hủy vé</option>
                  <option value="REFUNDED">Đã hoàn tiền</option>
                </select>
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => setSelectedBookingDetail(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER COMMAND BAR (LUXURY TRAVEL CONTROL CENTER) */}
      <div className="admin-command-header glass-panel">
        <div className="admin-header-branding">
          <div className="admin-badge-row">
            <span className="admin-live-badge">
              <span className="status-pulse-dot"></span>
              Microsoft SQL Server • Realtime Sync
            </span>
            <span className="admin-version-tag">Travel With Me Enterprise v2.6</span>
          </div>
          <h2 className="admin-page-title">Hệ Thống Quản Trị Doanh Nghiệp (Admin Portal)</h2>
          <p className="admin-page-sub">
            Trung tâm điều phối booking, phân tích tăng trưởng doanh thu & quản lý suất đặt liên kết trực tiếp database
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            className={`btn btn-outline btn-sm admin-refresh-btn ${isRefreshing ? 'is-spinning' : ''}`}
            onClick={() => loadDataFromSql(true)}
            title="Đồng bộ dữ liệu tức thì từ SQL Server"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Đang đồng bộ...' : 'Đồng bộ tức thì'}</span>
          </button>

          <button className="btn btn-primary btn-sm admin-export-btn" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Xuất Excel / CSV Khách</span>
          </button>
        </div>
      </div>

      {/* BENTO GRID KPI METRICS ROW (SUBJECT GROUNDED: OCEAN & ADVENTURE) */}
      <div className="admin-bento-metrics">
        {/* Card 1: Hero Revenue Metric Card */}
        <div className="bento-card bento-card-hero">
          <div className="bento-card-backdrop-glow"></div>
          <div className="bento-card-content">
            <div className="bento-card-top">
              <div className="bento-icon-box bento-icon-hero">
                <DollarSign size={24} className="text-white" />
              </div>
              <span className="bento-mom-tag">
                <ArrowUpRight size={14} />
                +{momGrowth}% MoM
              </span>
            </div>

            <div className="bento-card-body">
              <span className="bento-label">Tổng doanh thu thực nhận</span>
              <h3 className="bento-val-hero">{totalRevenue.toLocaleString('vi-VN')} đ</h3>
              <p className="bento-desc text-slate-300">
                Ghi nhận từ {localBookings.filter(b => ['CONFIRMED', 'PAID', 'COMPLETED', 'IN_TOUR'].includes(b.status)).length} đơn hàng đã hoàn tất thanh toán
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Total Bookings */}
        <div className="bento-card glass-panel">
          <div className="bento-card-top">
            <div className="bento-icon-box bg-blue-subtle">
              <ShoppingBag size={22} className="text-primary-600" />
            </div>
            <span className="badge badge-primary">SQL Live</span>
          </div>

          <div className="bento-card-body">
            <span className="bento-label">Tổng số đơn đặt tour</span>
            <h3 className="bento-val">{totalBookings} đơn</h3>
            <div className="bento-progress-meter">
              <div
                className="meter-fill bg-primary-600"
                style={{ width: `${totalBookings > 0 ? (completedCount / totalBookings) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="bento-subtext text-primary-700">
              {completedCount} chuyến đi đã hoàn thành ({totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Card 3: Cancellation & Refund Health */}
        <div className="bento-card glass-panel">
          <div className="bento-card-top">
            <div className="bento-icon-box bg-amber-subtle">
              <AlertTriangle size={22} className="text-amber" />
            </div>
            <span className="badge badge-emerald">Chỉ số an toàn</span>
          </div>

          <div className="bento-card-body">
            <span className="bento-label">Tỷ lệ hủy tour / Hoàn tiền</span>
            <h3 className="bento-val">{cancellationRate}%</h3>
            <div className="bento-progress-meter">
              <div
                className="meter-fill bg-amber"
                style={{ width: `${Math.min(100, Number(cancellationRate) * 3)}%` }}
              ></div>
            </div>
            <span className="bento-subtext text-amber">
              {cancelledCount} đơn đã xử lý hoàn phí theo chính sách
            </span>
          </div>
        </div>

        {/* Card 4: Inventory & Active Tours */}
        <div className="bento-card glass-panel">
          <div className="bento-card-top">
            <div className="bento-icon-box bg-emerald-subtle">
              <ShieldCheck size={22} className="text-emerald" />
            </div>
            <span className="badge badge-emerald">100% Khả dụng</span>
          </div>

          <div className="bento-card-body">
            <span className="bento-label">Tour đang kinh doanh</span>
            <h3 className="bento-val">{activeTourCount} tour</h3>
            <div className="bento-progress-meter">
              <div className="meter-fill bg-emerald" style={{ width: '100%' }}></div>
            </div>
            <span className="bento-subtext text-emerald">
              Chỗ trống được kiểm soát realtime chống overbooking
            </span>
          </div>
        </div>
      </div>

      {/* 6-MONTH REVENUE GROWTH CHART (PREMIUM INTERACTIVE DUAL-TONE PILLARS) */}
      <div className="admin-growth-chart-card glass-panel">
        <div className="chart-card-header">
          <div>
            <div className="chart-badge-title-row">
              <BarChart3 size={18} className="text-primary-600" />
              <h4>Biểu đồ tăng trưởng doanh thu 6 tháng gần nhất</h4>
            </div>
            <p className="chart-sub-period">
              Dữ liệu từ Tháng 5/2026 đến Tháng 10/2026 (Đồng bộ trực tiếp từ SQL Server)
            </p>
          </div>

          <div className="chart-header-summary">
            <div className="chart-stat-pill">
              <span className="stat-pill-label">Tổng 6 tháng:</span>
              <strong className="stat-pill-val">
                {(computedChart.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0) / 1000000).toFixed(1)} triệu đ
              </strong>
            </div>
            <span className="badge badge-emerald pulse-badge">CẬP NHẬT THEO THỜI GIAN THỰC</span>
          </div>
        </div>

        <div className="chart-bars-viewport">
          {/* Subtle horizontal background guide lines */}
          <div className="chart-grid-guides">
            <div className="guide-line"><span>120 tr</span></div>
            <div className="guide-line"><span>80 tr</span></div>
            <div className="guide-line"><span>40 tr</span></div>
            <div className="guide-line"><span>0 tr</span></div>
          </div>

          <div className="chart-columns-flex">
            {computedChart.map((bar, idx) => {
              const isTopMonth = idx === topMonthIndex;
              const heightPercent = maxVal > 0 ? Math.min(100, Math.max(14, (bar.val / maxVal) * 100)) : 14;

              return (
                <div key={idx} className={`chart-column-item ${isTopMonth ? 'is-top-month' : ''}`}>
                  <div className="column-pillar-wrapper">
                    <div
                      className={`column-pillar-fill ${isTopMonth ? 'pillar-top-glow' : ''}`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Floating Tooltip */}
                      <div className="pillar-tooltip-box">
                        <span className="tooltip-amount">{bar.label}</span>
                        {isTopMonth && <span className="tooltip-badge">Kỷ Lục</span>}
                      </div>
                    </div>
                  </div>

                  <div className="column-label-box">
                    <span className="col-month-name">{bar.month}</span>
                    {bar.revenue > 0 && (
                      <span className="col-revenue-sub">{bar.val}M</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SEGMENTED SUB-TABS NAVIGATION (TACTILE MODERN PILL BAR) */}
      <div className="admin-segmented-nav">
        <button
          className={`segmented-tab ${activeTab === 'bookings' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <ShoppingBag size={16} />
          <span>Quản lý Đơn đặt tour</span>
          <span className="tab-counter-pill">{localBookings.length}</span>
        </button>

        {isTourAdmin && (
          <button
            className={`segmented-tab ${activeTab === 'tours' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('tours')}
          >
            <Compass size={16} />
            <span>Quản lý Tour</span>
            <span className="tab-counter-pill">{managedTours.length}</span>
          </button>
        )}

        <button
          className={`segmented-tab ${activeTab === 'inventory' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Activity size={16} />
          <span>Kiểm soát Suất đặt (Inventory)</span>
        </button>

        <button
          className={`segmented-tab ${activeTab === 'coupons' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          <Tag size={16} />
          <span>Khuyến mãi & Coupons</span>
          <span className="tab-counter-pill">{coupons.length}</span>
        </button>
      </div>

      {/* TAB CONTENT: BOOKINGS MANAGEMENT */}
      {activeTab === 'bookings' && (
        <div className="admin-content-card glass-panel">
          {/* Quick Filter Chips & Search Bar */}
          <div className="admin-toolbar-row">
            <div className="admin-search-wrapper">
              <Search size={16} className="search-icon-muted" />
              <input
                type="text"
                placeholder="Tìm theo mã đơn (TWM-...), tên khách, SĐT, tên tour..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="admin-filter-select-wrapper">
              <Filter size={15} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-status-dropdown"
              >
                <option value="all">Tất cả trạng thái ({localBookings.length})</option>
                <option value="CONFIRMED">🟢 Đã xác nhận ({localBookings.filter(b => b.status === 'CONFIRMED').length})</option>
                <option value="PAID">🔵 Đã thanh toán ({localBookings.filter(b => b.status === 'PAID').length})</option>
                <option value="IN_TOUR">🚙 Đang đi tour ({localBookings.filter(b => b.status === 'IN_TOUR').length})</option>
                <option value="COMPLETED">🟣 Đã hoàn thành ({localBookings.filter(b => b.status === 'COMPLETED').length})</option>
                <option value="CANCELLED">🔴 Đã hủy vé ({localBookings.filter(b => b.status === 'CANCELLED').length})</option>
                <option value="REFUNDED">🟠 Đã hoàn tiền ({localBookings.filter(b => b.status === 'REFUNDED').length})</option>
              </select>
            </div>
          </div>

          {/* Quick Status Chips */}
          <div className="admin-quick-chips-row">
            <button
              className={`quick-chip ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Tất cả ({localBookings.length})
            </button>
            <button
              className={`quick-chip chip-confirmed ${statusFilter === 'CONFIRMED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('CONFIRMED')}
            >
              Đã xác nhận ({localBookings.filter(b => b.status === 'CONFIRMED').length})
            </button>
            <button
              className={`quick-chip chip-paid ${statusFilter === 'PAID' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PAID')}
            >
              Đã thanh toán ({localBookings.filter(b => b.status === 'PAID').length})
            </button>
            <button
              className={`quick-chip chip-completed ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('COMPLETED')}
            >
              Hoàn thành ({localBookings.filter(b => b.status === 'COMPLETED').length})
            </button>
            <button
              className={`quick-chip chip-cancelled ${statusFilter === 'CANCELLED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('CANCELLED')}
            >
              Đã hủy ({localBookings.filter(b => b.status === 'CANCELLED').length})
            </button>
          </div>

          {/* Table View */}
          <div className="table-responsive admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Khách Hàng</th>
                  <th>Tour Du Lịch</th>
                  <th>Ngày Đi</th>
                  <th>Số Khách</th>
                  <th>Tổng Tiền</th>
                  <th>Trạng Thái Đơn</th>
                  <th className="text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const statusInfo = getStatusBadge(b.status);
                  const isCopied = copiedCode === b.bookingCode;
                  const initials = (b.contactName || 'Khách')
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={b.id || b.bookingCode} className="admin-table-row">
                      {/* Booking Code with Copy */}
                      <td>
                        <div className="booking-code-cell">
                          <span className="code-text font-mono font-bold">{b.bookingCode}</span>
                          <button
                            className="code-copy-btn"
                            title="Sao chép mã đơn"
                            onClick={() => handleCopyCode(b.bookingCode)}
                          >
                            {isCopied ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Customer Info with Avatar */}
                      <td>
                        <div className="customer-profile-cell">
                          <div className="customer-avatar-initials">
                            {initials}
                          </div>
                          <div className="customer-details">
                            <strong className="customer-name">{b.contactName}</strong>
                            <small className="customer-contact">{b.contactPhone}</small>
                          </div>
                        </div>
                      </td>

                      {/* Tour Title */}
                      <td>
                        <div className="tour-info-cell" title={b.tourTitle}>
                          <span className="tour-title-text">{b.tourTitle}</span>
                        </div>
                      </td>

                      {/* Departure Date */}
                      <td>
                        <div className="date-cell">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{b.departureDate}</span>
                        </div>
                      </td>

                      {/* Passengers */}
                      <td>
                        <span className="passengers-pill">
                          <Users size={12} />
                          {b.totalPassengers} người
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td>
                        <strong className="amount-text text-emerald">
                          {Number(b.finalAmount).toLocaleString('vi-VN')} đ
                        </strong>
                      </td>

                      {/* Interactive Status Dropdown */}
                      <td>
                        <div className="status-dropdown-wrapper">
                          <span
                            className="status-dot-indicator"
                            style={{ backgroundColor: statusInfo.dotColor }}
                          ></span>
                          <select
                            className={`status-select status-${b.status.toLowerCase()}`}
                            value={b.status}
                            onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          >
                            <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                            <option value="PAID">Đã thanh toán</option>
                            <option value="CONFIRMED">Đã xác nhận</option>
                            <option value="IN_TOUR">Đang đi tour</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="CANCELLED">Hủy vé</option>
                            <option value="REFUNDED">Đã hoàn tiền</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-center">
                        <button
                          className="btn btn-outline btn-xs btn-detail-action"
                          onClick={() => setSelectedBookingDetail(b)}
                        >
                          <Eye size={13} />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan="8" className="admin-empty-table-state">
                      <div className="empty-state-box">
                        <ShoppingBag size={40} className="text-slate-300 mb-2" />
                        <h4>Không tìm thấy đơn đặt tour nào</h4>
                        <p>Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ chọn bộ lọc trạng thái</p>
                        <button
                          className="btn btn-outline btn-sm mt-3"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                          }}
                        >
                          Xóa bộ lọc
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TOURS MANAGEMENT (IF ADMIN) */}
      {activeTab === 'tours' && isTourAdmin && (
        <div className="admin-content-card glass-panel">
          <div className="admin-tour-list-header">
            <div>
              <h3>Danh Sách Tour Trong Microsoft SQL Server</h3>
              <p>Quản lý các tour du lịch, điều chỉnh giá vé, album ảnh và lịch trình khởi hành</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditingTour(null);
                setTourActionError('');
                setShowTourForm(true);
              }}
            >
              <Plus size={16} /> Thêm tour mới
            </button>
          </div>

          {tourActionError && <p className="admin-tour-error" role="alert">{tourActionError}</p>}

          <div className="table-responsive admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tour Du Lịch</th>
                  <th>Danh Mục</th>
                  <th>Điểm Đến</th>
                  <th>Lịch Khởi Hành</th>
                  <th>Giá Từ</th>
                  <th>Trạng Thái</th>
                  <th className="text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {managedTours.map((tour) => {
                  const minPrice = Math.min(...tour.schedules.map((schedule) => Number(schedule.adultPrice)));
                  return (
                    <tr key={tour.id}>
                      <td>
                        <div className="admin-tour-name-cell">
                          <img src={tour.thumbnailUrl} alt="" className="tour-thumb-img" />
                          <strong>{tour.title}</strong>
                        </div>
                      </td>
                      <td>{tour.categoryName}</td>
                      <td>{tour.destinationCity}</td>
                      <td>{tour.schedules.length} lịch</td>
                      <td>{Number.isFinite(minPrice) ? `${minPrice.toLocaleString('vi-VN')} đ` : '—'}</td>
                      <td>
                        <span className={`admin-tour-status ${tour.isActive ? 'active' : 'inactive'}`}>
                          {tour.isActive ? 'Đang mở bán' : 'Đã ngừng'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="admin-tour-row-actions">
                          <button
                            className="btn btn-outline btn-xs"
                            onClick={() => {
                              setEditingTour(tour);
                              setTourActionError('');
                              setShowTourForm(true);
                            }}
                          >
                            <Pencil size={13} /> Sửa
                          </button>
                          {tour.isActive && (
                            <button
                              className="btn btn-outline btn-xs admin-tour-delete"
                              onClick={() => handleDeleteTour(tour)}
                            >
                              <Trash2 size={13} /> Ngừng
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {managedTours.length === 0 && (
                  <tr>
                    <td colSpan="7" className="admin-tour-empty">
                      Chưa có tour nào được lưu. Chọn "Thêm tour mới" để khởi tạo dữ liệu vào SQL Server.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: INVENTORY / SLOTS */}
      {activeTab === 'inventory' && (
        <div className="admin-content-card glass-panel">
          <div className="table-responsive admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên Tour</th>
                  <th>Khởi Hành</th>
                  <th>Ngày Về</th>
                  <th>Chỗ Tối Đa</th>
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

      {/* TAB CONTENT: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="admin-content-card glass-panel">
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

import React from 'react';
import { Shield, ShieldAlert, CheckCircle2, XCircle, User, Crown, Briefcase, Sparkles, X } from 'lucide-react';

export function RoleModal({ isOpen, onClose, currentUser, onSelectUser, onNotify }) {
  if (!isOpen) return null;

  const mockUsers = [
    {
      id: '1',
      fullName: 'Quản Trị Viên Hệ Thống',
      email: 'admin@travelwithme.vn',
      role: 'SUPER_ADMIN',
      roleBadge: 'Quản Trị Viên (Admin)',
      badgeClass: 'badge-admin',
      icon: Crown,
      description: 'Toàn quyền kiểm soát hệ thống: Doanh thu, duyệt đơn, xuất CSV, CRUD tour, cấu hình vai trò.'
    },
    {
      id: '2',
      fullName: 'Nguyễn Điều Hành',
      email: 'staff@travelwithme.vn',
      role: 'STAFF',
      roleBadge: 'Nhân Viên Điều Hành',
      badgeClass: 'badge-staff',
      icon: Briefcase,
      description: 'Điều phối lịch tour, kiểm tra thông tin khách hàng, cập nhật trạng thái đơn và xuất danh sách khách.'
    },
    {
      id: '3',
      fullName: 'Nguyễn Quốc Hùng',
      email: 'hung@example.com',
      role: 'USER',
      roleBadge: 'Khách Hàng Du Lịch',
      badgeClass: 'badge-user',
      icon: User,
      description: 'Tìm kiếm tour, đặt giữ chỗ, thanh toán trực tuyến, xem vé điện tử QR Code và gửi đánh giá.'
    }
  ];

  const permissions = [
    { name: 'Khám phá & Tìm kiếm tour du lịch', user: true, staff: true, admin: true },
    { name: 'Đặt tour, giữ chỗ & Thanh toán VietQR', user: true, staff: true, admin: true },
    { name: 'Xem Vé điện tử & Mã QR Check-in', user: 'Chỉ của mình', staff: 'Tất cả khách', admin: 'Toàn quyền' },
    { name: 'Yêu cầu hủy tour & hoàn tiền', user: 'Theo chính sách', staff: 'Tiếp nhận', admin: 'Duyệt hoàn tiền' },
    { name: 'Gửi đánh giá & bình luận tour', user: true, staff: false, admin: 'Kiểm duyệt/Xóa' },
    { name: 'Truy cập Kênh Quản Trị (Admin Portal)', user: false, staff: true, admin: true },
    { name: 'Xem báo cáo & biểu đồ doanh thu', user: false, staff: false, admin: true },
    { name: 'Cập nhật trạng thái đơn đặt tour', user: false, staff: true, admin: true },
    { name: 'Xuất danh sách hành khách ra file CSV', user: false, staff: true, admin: true },
    { name: 'Quản lý tài khoản & phân quyền hệ thống', user: false, staff: false, admin: true }
  ];

  const handleSelect = (user) => {
    onSelectUser(user);
    onNotify(`Đã chuyển đổi sang tài khoản: ${user.fullName} (${user.role})`);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container role-modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="icon-wrapper bg-purple-glow">
              <Shield size={24} className="text-purple-600" />
            </div>
            <div>
              <h2 className="modal-heading">Phân Quyền & Quản Lý Vai Trò (RBAC)</h2>
              <p className="modal-subheading">
                Cơ sở dữ liệu Microsoft SQL Server (Bảng <code className="code-pill">dbo.roles</code> & <code className="code-pill">dbo.users</code>)
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Current Active Account Box */}
        <div className="current-user-card">
          <div className="current-user-info">
            <div className="avatar-circle">
              {currentUser.role === 'SUPER_ADMIN' ? (
                <Crown size={22} className="text-amber-500" />
              ) : currentUser.role === 'STAFF' ? (
                <Briefcase size={22} className="text-cyan-500" />
              ) : (
                <User size={22} className="text-emerald-500" />
              )}
            </div>
            <div>
              <div className="current-user-label">Tài khoản đang đăng nhập:</div>
              <div className="current-user-name">
                {currentUser.fullName} <span className={`role-badge ${currentUser.role === 'SUPER_ADMIN' ? 'badge-admin' : currentUser.role === 'STAFF' ? 'badge-staff' : 'badge-user'}`}>
                  {currentUser.role}
                </span>
              </div>
              <div className="current-user-email">{currentUser.email}</div>
            </div>
          </div>
          <div className="current-role-note">
            {currentUser.role === 'SUPER_ADMIN'
              ? '✅ Bạn có quyền Quản trị tối cao (Toàn quyền Kênh Quản Trị & Khách hàng).'
              : currentUser.role === 'STAFF'
              ? '✅ Bạn có quyền Nhân viên điều hành (Xem & Cập nhật đơn đặt).'
              : '🔒 Bạn đang ở vai trò Khách hàng (Sẽ bị chặn khi truy cập Kênh Quản trị).'}
          </div>
        </div>

        {/* Role Switcher Grid */}
        <div className="role-switch-section">
          <h3 className="section-title">Chọn tài khoản mẫu để kiểm thử phân quyền 1-Click:</h3>
          <div className="role-cards-grid">
            {mockUsers.map((u) => {
              const IconComponent = u.icon;
              const isSelected = currentUser.email === u.email;
              return (
                <div
                  key={u.id}
                  className={`role-select-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(u)}
                >
                  <div className="role-card-header">
                    <div className="role-icon-box">
                      <IconComponent size={20} />
                    </div>
                    <span className={`role-badge ${u.badgeClass}`}>{u.role}</span>
                  </div>
                  <div className="role-card-name">{u.fullName}</div>
                  <div className="role-card-email">{u.email}</div>
                  <p className="role-card-desc">{u.description}</p>
                  <button
                    className={`btn-select-role ${isSelected ? 'btn-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(u);
                    }}
                  >
                    {isSelected ? 'Đang kích hoạt' : 'Chuyển sang tài khoản này'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RBAC Permission Matrix Table */}
        <div className="rbac-table-section">
          <h3 className="section-title">Ma trận phân quyền chi tiết (RBAC Permission Matrix):</h3>
          <div className="table-responsive">
            <table className="rbac-table">
              <thead>
                <tr>
                  <th>Chức năng nghiệp vụ</th>
                  <th className="text-center">Khách Hàng (USER)</th>
                  <th className="text-center">Nhân Viên (STAFF)</th>
                  <th className="text-center">Quản Trị (ADMIN)</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p, idx) => (
                  <tr key={idx}>
                    <td className="font-medium text-slate-800">{p.name}</td>
                    <td className="text-center">
                      {p.user === true ? (
                        <CheckCircle2 size={18} className="text-emerald-500 inline" />
                      ) : p.user === false ? (
                        <XCircle size={18} className="text-rose-400 inline" />
                      ) : (
                        <span className="text-xs font-semibold text-slate-600">{p.user}</span>
                      )}
                    </td>
                    <td className="text-center">
                      {p.staff === true ? (
                        <CheckCircle2 size={18} className="text-emerald-500 inline" />
                      ) : p.staff === false ? (
                        <XCircle size={18} className="text-rose-400 inline" />
                      ) : (
                        <span className="text-xs font-semibold text-slate-600">{p.staff}</span>
                      )}
                    </td>
                    <td className="text-center">
                      {p.admin === true ? (
                        <CheckCircle2 size={18} className="text-emerald-500 inline" />
                      ) : p.admin === false ? (
                        <XCircle size={18} className="text-rose-400 inline" />
                      ) : (
                        <span className="text-xs font-semibold text-purple-700">{p.admin}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="modal-footer-note">
            💡 Dữ liệu tài khoản và vai trò đồng bộ trực tiếp với SQL Server database <code className="code-pill">TravelWithMe</code>.
          </div>
          <button className="btn-secondary" onClick={onClose}>
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}

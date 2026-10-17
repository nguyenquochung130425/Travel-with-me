import React from 'react';
import { Shield, CheckCircle2, XCircle, User, Crown, Briefcase, X, Check } from 'lucide-react';

export function RoleModal({ isOpen, onClose, currentUser, onSelectUser, onNotify }) {
  if (!isOpen) return null;

  const mockUsers = [
    {
      id: '1',
      fullName: 'Quản Trị Viên Hệ Thống',
      email: 'admin@travelwithme.vn',
      role: 'SUPER_ADMIN',
      badgeClass: 'badge-admin',
      icon: Crown,
      description: 'Toàn quyền kiểm soát hệ thống: Quản lý doanh thu, duyệt đơn, xuất file CSV hành khách, cấu hình tour và phân quyền.'
    },
    {
      id: '2',
      fullName: 'Nguyễn Điều Hành',
      email: 'staff@travelwithme.vn',
      role: 'STAFF',
      badgeClass: 'badge-staff',
      icon: Briefcase,
      description: 'Điều phối lịch tour, kiểm tra thông tin hành khách, cập nhật trạng thái đơn đặt và xuất danh sách khách.'
    },
    {
      id: '3',
      fullName: 'Nguyễn Quốc Hùng',
      email: 'hung@example.com',
      role: 'USER',
      badgeClass: 'badge-user',
      icon: User,
      description: 'Khám phá tour, đặt chỗ trực tuyến, thanh toán VietQR, nhận vé điện tử E-Ticket QR Code và gửi đánh giá.'
    }
  ];

  const permissions = [
    { name: 'Khám phá & Tìm kiếm tour du lịch', user: true, staff: true, admin: true },
    { name: 'Đặt tour, giữ chỗ & Thanh toán VietQR', user: true, staff: true, admin: true },
    { name: 'Xem Vé điện tử & Mã QR Check-in', user: 'Chỉ vé của mình', staff: 'Tất cả khách', admin: 'Toàn quyền' },
    { name: 'Yêu cầu hủy tour & hoàn tiền', user: 'Theo chính sách', staff: 'Tiếp nhận đơn', admin: 'Duyệt hoàn tiền' },
    { name: 'Gửi đánh giá & bình luận tour', user: true, staff: false, admin: 'Kiểm duyệt / Xóa' },
    { name: 'Truy cập Kênh Quản Trị (Admin Portal)', user: false, staff: true, admin: true },
    { name: 'Xem báo cáo & biểu đồ doanh thu', user: false, staff: false, admin: true },
    { name: 'Cập nhật trạng thái đơn đặt tour', user: false, staff: true, admin: true },
    { name: 'Xuất danh sách hành khách ra file CSV', user: false, staff: true, admin: true },
    { name: 'Quản lý tài khoản & phân quyền hệ thống', user: false, staff: false, admin: true }
  ];

  const handleSelect = (user) => {
    onSelectUser(user);
    onNotify(`Đã chuyển sang tài khoản: ${user.fullName} (${user.role})`);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog role-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="role-modal-header">
          <div className="role-modal-title-group">
            <div className="role-modal-icon-badge">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="role-modal-title">Phân Quyền & Quản Lý Vai Trò (RBAC)</h2>
              <p className="role-modal-subtitle">
                Đồng bộ trực tiếp Microsoft SQL Server &bull; Bảng <code className="code-pill">dbo.roles</code> &amp; <code className="code-pill">dbo.users</code>
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Đóng cửa sổ">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="role-modal-body">
          {/* 1. Current Active Account Banner */}
          <div className="current-user-card">
            <div className="current-user-info">
              <div className="avatar-circle">
                {currentUser.role === 'SUPER_ADMIN' ? (
                  <Crown size={22} className="text-amber-500" />
                ) : currentUser.role === 'STAFF' ? (
                  <Briefcase size={22} className="text-sky-500" />
                ) : (
                  <User size={22} className="text-emerald-500" />
                )}
              </div>
              <div className="user-details">
                <span className="current-user-label">Tài khoản đang đăng nhập hiện tại:</span>
                <div className="current-user-name">
                  <span>{currentUser.fullName}</span>
                  <span className={`role-badge ${currentUser.role === 'SUPER_ADMIN' ? 'badge-admin' : currentUser.role === 'STAFF' ? 'badge-staff' : 'badge-user'}`}>
                    {currentUser.role}
                  </span>
                </div>
                <div className="current-user-email">{currentUser.email}</div>
              </div>
            </div>
            <div className="current-role-note">
              {currentUser.role === 'SUPER_ADMIN' ? (
                <span className="note-text-admin">👑 <strong>Toàn quyền Quản trị:</strong> Bạn có quyền truy cập toàn bộ Kênh Quản Trị, duyệt đơn, xuất file CSV và xem doanh thu.</span>
              ) : currentUser.role === 'STAFF' ? (
                <span className="note-text-staff">💼 <strong>Nhân viên Điều hành:</strong> Được phép truy cập Kênh Quản trị để cập nhật đơn hàng và xuất danh sách hành khách.</span>
              ) : (
                <span className="note-text-user">🔒 <strong>Khách hàng thông thường:</strong> Bạn chỉ trải nghiệm giao diện đặt tour du lịch và bị chặn khi vào Kênh Quản trị.</span>
              )}
            </div>
          </div>

          {/* 2. Three Role Cards Grid */}
          <div className="role-section-block">
            <h3 className="section-title">Chọn tài khoản mẫu để kiểm thử phân quyền tức thời (1-Click):</h3>
            <div className="role-cards-grid">
              {mockUsers.map((u) => {
                const IconComp = u.icon;
                const isSelected = currentUser.email === u.email;
                return (
                  <div
                    key={u.id}
                    className={`role-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(u)}
                  >
                    <div className="role-card-header">
                      <div className={`role-icon-box ${isSelected ? 'icon-active' : ''}`}>
                        <IconComp size={20} />
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
                      {isSelected ? (
                        <>
                          <Check size={16} />
                          <span>Đang kích hoạt</span>
                        </>
                      ) : (
                        <span>Chuyển sang tài khoản này</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Permission Matrix Table */}
          <div className="role-section-block">
            <h3 className="section-title">Ma trận phân quyền chi tiết giữa các cấp độ (RBAC Matrix):</h3>
            <div className="rbac-table-card">
              <table className="rbac-table">
                <thead>
                  <tr>
                    <th>Chức năng hệ thống</th>
                    <th className="text-center">Khách Hàng (USER)</th>
                    <th className="text-center">Nhân Viên (STAFF)</th>
                    <th className="text-center">Quản Trị (ADMIN)</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((p, idx) => (
                    <tr key={idx}>
                      <td className="feature-name-col">{p.name}</td>
                      <td className="text-center">
                        {p.user === true ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : p.user === false ? (
                          <XCircle size={18} className="text-rose-400" />
                        ) : (
                          <span className="pill-text-muted">{p.user}</span>
                        )}
                      </td>
                      <td className="text-center">
                        {p.staff === true ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : p.staff === false ? (
                          <XCircle size={18} className="text-rose-400" />
                        ) : (
                          <span className="pill-text-muted">{p.staff}</span>
                        )}
                      </td>
                      <td className="text-center">
                        {p.admin === true ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : p.admin === false ? (
                          <XCircle size={18} className="text-rose-400" />
                        ) : (
                          <span className="pill-text-highlight">{p.admin}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="role-modal-footer">
          <div className="role-modal-footer-note">
            💡 Dữ liệu tài khoản và phân quyền đồng bộ với SQL Server database <code className="code-pill">TravelWithMe</code>.
          </div>
          <button className="btn-modal-dismiss" onClick={onClose}>
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}

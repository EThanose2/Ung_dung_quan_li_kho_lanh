import { NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, Warehouse, Calendar, Bell, FileText, Users, User, LogOut, Apple, ClipboardList } from 'lucide-react';

export function Sidebar() {
  const navigate = useNavigate();

  // Lấy dữ liệu user trực tiếp từ localStorage
  const userStr = localStorage.getItem('current_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('current_user'); // Xóa dữ liệu user
    localStorage.removeItem('token');       // Nếu có lưu token thì xóa luôn
    navigate('/login');
  };
  

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { path: '/warehouses', icon: Warehouse, label: 'Kho lạnh' },
    { path: '/foods', icon: Apple, label: 'Thực phẩm' },
    { path: '/schedules', icon: Calendar, label: 'Lịch trình' },
    { path: '/logs', icon: ClipboardList, label: 'Nhật ký' },
    { path: '/alerts', icon: Bell, label: 'Cảnh báo' },
    { path: '/reports', icon: FileText, label: 'Báo cáo' },
    { path: '/users', icon: Users, label: 'Người dùng', adminOnly: true },
    { path: '/profile', icon: User, label: 'Tài khoản' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center">
            <span className="text-white font-bold text-lg">FG</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">FreshGuard</h1>
            <p className="text-xs text-gray-500">IoT Monitoring</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          // Kiểm tra quyền: Chỉ ẩn nếu là adminOnly và role KHÔNG PHẢI LÀ 'ADMIN'
          if (item.adminOnly && currentUser?.role !== 'ADMIN') return null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#2ECC71] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Đăng nhập với</p>
          {/* Lưu ý: Thay fullName bằng full_name tùy theo cấu trúc object lưu trong localStorage */}
          <p className="font-medium text-gray-900">{currentUser?.full_name || currentUser?.username}</p>
          <p className="text-xs text-gray-500">{currentUser?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
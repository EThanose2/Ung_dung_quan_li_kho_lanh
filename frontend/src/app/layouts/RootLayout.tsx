import { Link, Outlet } from 'react-router'; // <--- NHỚ DÒNG NÀY
import { Sidebar } from '../components/Sidebar';

const RootLayout = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <nav className="p-4 bg-gray-100 flex gap-4">
          <Link to="/dashboard">Dashboard</Link>
          
          {/* Chỉ ADMIN mới thấy menu Quản lý người dùng */}
          {isAdmin && (
            <Link to="/users">Quản lý người dùng</Link>
          )}
        </nav>
        
        <main className="p-4">
          <Outlet /> {/* Nơi hiển thị các trang con */}
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
import { Link, Outlet } from 'react-router'; // <--- NHỚ DÒNG NÀY
import { Sidebar } from '../components/Sidebar';

const RootLayout = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'ADMIN';
  const handleLogout = () => {
  // Xóa sạch localStorage để tránh xung đột dữ liệu giữa các role
  localStorage.clear(); 
  
  // Thay vì navigate('/login'), hãy dùng window.location để reset toàn bộ State của App
  window.location.href = '/login';
};

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">        
        <main className="p-4">
          <Outlet /> {/* Nơi hiển thị các trang con */}
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
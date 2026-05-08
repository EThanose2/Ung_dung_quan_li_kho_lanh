// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { login } from '../api/apiService';

export function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(formData);
      const user = res.data.data;

      // ✅ Lưu đúng key
      localStorage.setItem('current_user', JSON.stringify(user));

      // ✅ Navigate theo role
      if (user.role?.toUpperCase() === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/warehouses'); // Operator không cần dashboard
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đăng nhập thất bại!';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-100">
            <span className="text-white font-black text-2xl">F</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FreshGuard</h1>
          <p className="text-gray-500 text-sm mt-1">Hệ thống quản lý kho lạnh thông minh</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2ECC71] focus:bg-white transition-all outline-none"
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2ECC71] focus:bg-white transition-all outline-none"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white rounded-xl font-bold shadow-lg shadow-green-100 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
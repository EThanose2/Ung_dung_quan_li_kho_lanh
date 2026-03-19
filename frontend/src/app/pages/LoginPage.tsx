import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, User } from 'lucide-react';
import { store } from '../store';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = store.login(username, password);
    if (user) {
      navigate('/dashboard');
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">FG</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">FreshGuard</h1>
            <p className="text-gray-500">Hệ thống giám sát IoT</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              Đăng nhập
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Tài khoản demo:</p>
            <p className="text-xs text-gray-700">Admin: admin / admin123</p>
            <p className="text-xs text-gray-700">Operator: operator1 / operator123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

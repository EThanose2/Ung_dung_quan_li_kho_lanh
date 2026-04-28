// src/pages/ProfilePage.tsx
import { useState } from 'react';
import { User as UserIcon, Lock, Save } from 'lucide-react';
import { updateProfile, UserApi } from '../api/apiService';

export function ProfilePage() {
  const currentUser: UserApi | null = JSON.parse(localStorage.getItem('current_user') || 'null');

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [infoData, setInfoData] = useState({
    full_name: currentUser?.full_name || '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  if (!currentUser) {
    return <div className="p-8 text-gray-500">Chưa đăng nhập</div>;
  }

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(currentUser.id, { full_name: infoData.full_name });
      // Cập nhật localStorage
      const updated = { ...currentUser, full_name: infoData.full_name };
      localStorage.setItem('current_user', JSON.stringify(updated));
      setIsEditingInfo(false);
      alert('Cập nhật thông tin thành công!');
    } catch (err) {
      console.error('Lỗi cập nhật profile:', err);
      alert('Cập nhật thất bại!');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    setSaving(true);
    try {
      await updateProfile(currentUser.id, { password: passwordData.newPassword });
      setIsChangingPassword(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      alert('Đổi mật khẩu thành công!');
    } catch (err) {
      console.error('Lỗi đổi mật khẩu:', err);
      alert('Đổi mật khẩu thất bại!');
    } finally {
      setSaving(false);
    }
  };

  const initials = currentUser.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || currentUser.username[0].toUpperCase();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tài khoản của tôi</h1>
        <p className="text-gray-500">Quản lý thông tin cá nhân và bảo mật</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Thông tin cá nhân */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-gray-900">Thông tin cá nhân</h2>
              {!isEditingInfo && (
                <button onClick={() => setIsEditingInfo(true)} className="px-4 py-2 text-[#2ECC71] hover:bg-green-50 rounded-lg transition-colors">
                  Chỉnh sửa
                </button>
              )}
            </div>

            {isEditingInfo ? (
              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên</label>
                  <input
                    type="text"
                    value={infoData.full_name}
                    onChange={(e) => setInfoData({ full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditingInfo(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Hủy</button>
                  <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60] disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Họ tên</p>
                    <p className="font-medium text-gray-900">{currentUser.full_name || '(chưa cập nhật)'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <UserIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Tên đăng nhập</p>
                    <p className="font-medium text-gray-900">{currentUser.username}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Đổi mật khẩu */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-gray-900">Đổi mật khẩu</h2>
              
              {currentUser.role === 'ADMIN' && !isChangingPassword && (
                <button onClick={() => setIsChangingPassword(true)} className="px-4 py-2 text-[#2ECC71] hover:bg-green-50 rounded-lg transition-colors">
                  Đổi mật khẩu
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsChangingPassword(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Hủy</button>
                  <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60] disabled:opacity-50">
                    <Lock className="w-4 h-4" />
                    {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-gray-500 text-sm">
                {currentUser.role === 'ADMIN' 
                  ? "Bảo vệ tài khoản của bạn bằng mật khẩu mạnh." 
                  : "Liên hệ Admin nếu bạn cần thay đổi mật khẩu."}
              </p>
            )}
          </div>
        </div>

        {/* Card thông tin bên phải */}
        <div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-2xl">{initials}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{currentUser.full_name || currentUser.username}</h3>
            </div>
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Vai trò</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  currentUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tên đăng nhập</span>
                <span className="text-sm font-medium text-gray-900">{currentUser.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

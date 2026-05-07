import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, User, MessageSquare } from 'lucide-react';
// Import các hàm và interface bà đã cung cấp
import { resolveAlert, ActionLogApi, getActionLogs } from '../api/apiService'; 

export function AlertsPage() {
  const [logs, setLogs] = useState<ActionLogApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Giả định ID của bà khi đăng nhập là 5 như mẫu body bà đưa
  const getCurrentUser = () => {
    const userStr = localStorage.getItem('current_user'); // Key bà đã set ở LoginPage
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  };
  const currentUser = getCurrentUser();
  const CURRENT_USER_ID = currentUser ? currentUser.id : null;
  const fetchAlertLogs = async () => {
    try {
      setLoading(true);
      // Gọi API lấy danh sách log (đã được bà Join bảng User)
      const res = await getActionLogs(); 
      setLogs(res.data.data); // Giả định axios trả về cấu trúc này
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Lỗi khi lấy danh sách logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertLogs();
    const interval = setInterval(fetchAlertLogs, 60000); // Tự động cập nhật mỗi phút
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (logId: number) => {
  // 1. Lấy thông tin user từ localStorage
  const currentUser = getCurrentUser();

  // 2. Kiểm tra nếu chưa đăng nhập thì bắt đăng nhập lại (hoặc điều hướng)
  if (!currentUser || !currentUser.id) {
    alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
    return;
  }

  // 3. Hỏi ghi chú xử lý
  const note = prompt(`Xác nhận xử lý với tài khoản: ${currentUser.full_name}\nNhập ghi chú:`);
  if (note === null) return; 

  try {
    setLoading(true);
    // 4. Gọi API với user_id thật lấy từ máy người dùng
    await resolveAlert(logId, note, currentUser.id); 
    
    // 5. Reload lại danh sách để UI cập nhật
    await fetchAlertLogs(); 
    alert("Xác nhận cảnh báo thành công!");
  } catch (err: any) {
    console.error("Lỗi xác nhận:", err);
    const msg = err?.response?.data?.message || "Không thể xác nhận cảnh báo.";
    alert(msg);
  } finally {
    setLoading(false);
  }
};

  // Phân loại dựa trên field is_resolved từ API
  const activeAlerts = logs.filter(l => !l.is_resolved);
  const resolvedAlerts = logs.filter(l => l.is_resolved);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cảnh báo</h1>
          <p className="text-gray-500">Theo dõi và quản lý các cảnh báo hệ thống</p>
        </div>
        <button
          onClick={fetchAlertLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Cập nhật lần cuối */}
      <p className="text-xs text-gray-400">
        Cập nhật lần cuối: {lastRefresh.toLocaleTimeString('vi-VN')} • Tự động làm mới mỗi 60 giây
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Tổng cảnh báo</p>
              <p className="text-3xl font-semibold text-gray-900">{logs.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Chưa xử lý</p>
              <p className="text-3xl font-semibold text-orange-600">{activeAlerts.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Đã xử lý</p>
              <p className="text-3xl font-semibold text-green-600">{resolvedAlerts.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách chưa xử lý */}
<section>
  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
    <AlertTriangle className="w-5 h-5 text-red-500" />
    Cảnh báo chưa xác nhận
  </h2>
  <div className="space-y-3">
    {activeAlerts.length > 0 ? activeAlerts.map(log => (
      <div key={log.id} className="bg-white p-5 rounded-xl border-l-4 border-red-500 shadow-sm flex justify-between items-center transition-all hover:shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">{log.action_type}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {new Date(log.created_at).toLocaleString('vi-VN')}
            </span>
          </div>
          <p className="text-gray-600">{log.action_value}</p>
        </div>
        <button
          onClick={() => handleResolve(log.id)}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-gray-100"
        >
          Xác nhận xử lý
        </button>
      </div>
    )) : (
      <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed text-gray-400">
        Hiện tại không có cảnh báo nào.
      </div>
    )}
  </div>
</section>

{/* Lịch sử xử lý - Đã refactor giống style trên nhưng màu xanh */}
<section className="pt-6 border-t mt-6">
  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
    <CheckCircle className="w-5 h-5 text-green-500" />
    Cảnh báo đã xác nhận
  </h2>
  <div className="space-y-3">
    {resolvedAlerts.length > 0 ? resolvedAlerts.map(log => (
      <div key={log.id} className="bg-white p-5 rounded-xl border-l-4 border-green-500 shadow-sm flex justify-between items-start opacity-90 transition-all hover:opacity-100 hover:shadow-md">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">{log.action_type}</span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
              Tạo: {new Date(log.created_at).toLocaleString('vi-VN')}
            </span>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">
              Resolved
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-3">{log.action_value}</p>
          
          {/* Thông tin người xử lý + Ghi chú - UI gọn gàng hơn */}
          <div className="flex flex-wrap gap-4 items-center mt-2 pt-2 border-t border-gray-50">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                <User className="w-3 h-3 text-green-600" />
              </div>
              <span>Bởi: <strong>{log.user?.full_name}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 italic">
              <MessageSquare className="w-3 h-3 text-gray-400" />
              <span className="bg-gray-50 px-2 py-1 rounded">"{log.resolve_note || 'Không có ghi chú.'}"</span>
            </div>
          </div>
        </div>
        
        {/* Thời gian xử lý nằm bên phải cho cân xứng */}
        <div className="text-right ml-4">
          <p className="text-[10px] text-gray-400 uppercase font-bold">Xác nhận lúc</p>
          <p className="text-xs font-semibold text-gray-700">
            {log.resolved_at ? new Date(log.resolved_at).toLocaleString('vi-VN') : '---'}
          </p>
        </div>
      </div>
    )) : (
      <div className="text-center py-10 text-gray-400 text-sm italic">
        Chưa có nhật ký xử lý nào.
      </div>
    )}
  </div>
</section>
    </div>
  );
}
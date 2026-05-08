import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, User, MessageSquare, MapPin } from 'lucide-react';
import { resolveAlert, ActionLogApi, getActionLogs, getWarehouses } from '../api/apiService'; 

export function AlertsPage() {
  const [logs, setLogs] = useState<ActionLogApi[]>([]);
  const [escalated, setEscalated] = useState<ActionLogApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('current_user'); 
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const CURRENT_USER_ID = currentUser ? currentUser.id : null;
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const fetchAlertLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      const resLogs = await getActionLogs(); 
      const allLogs = resLogs.data.data;
      const escalated = allLogs.filter((log: any) => !log.is_resolved  && log.is_escalated);

      // Phân quyền hiển thị (Admin vs Nhân viên)
      if (isAdmin) {
        setLogs(allLogs);
        setEscalated(escalated);
      } 
      else if (CURRENT_USER_ID) {
        const resWh = await getWarehouses();
        const warehouses = resWh.data.data;

        // Gom các area_id mà user được phân công
        const assignedAreaIds = new Set<number>();
        warehouses.forEach((wh: any) => {
          wh.areas.forEach((area: any) => {
            const isOperator = area.operators?.some((op: any) => op.id === CURRENT_USER_ID);
            if (isOperator) {
              assignedAreaIds.add(area.id);
            }
          });
        });

        // Lọc các cảnh báo thuộc khu vực được phân công
        const filteredLogs = allLogs.filter((log: any) => {
        const logAreaId = log.area.id ;
        return assignedAreaIds.has(Number(logAreaId));

        });

        setLogs(filteredLogs);
        setEscalated(escalated);
      } else {
        setLogs([]);
        setEscalated([]);
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Lỗi khi lấy danh sách logs:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, CURRENT_USER_ID]);

  useEffect(() => {
    fetchAlertLogs();
    const interval = setInterval(fetchAlertLogs, 60000); 
    return () => clearInterval(interval);
  }, [fetchAlertLogs]);

  const handleResolve = async (logId: number) => {
    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.id) {
      alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      return;
    }

    const note = prompt(`Xác nhận xử lý với tài khoản: ${currentUser.full_name}\nNhập ghi chú:`);
    if (note === null) return; 

    try {
      setLoading(true);
      await resolveAlert(logId, note, currentUser.id); 
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

  // Lọc và SẮP XẾP active alerts: escalated lên đầu
  const activeAlerts = logs
    .filter(l => !l.is_resolved)
    .sort((a, b) => {
      if (a.is_escalated === b.is_escalated) return 0;
      return a.is_escalated ? -1 : 1;
    });

  const escalatedAlerts = logs.filter(l => !l.is_resolved && l.is_escalated);
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
          {activeAlerts.length > 0 ? activeAlerts.map((log: any) => {
            const areaObj = log.area; 
            const isEscalated = log.is_escalated; // Kiểm tra trạng thái escalated
            
            return (
              <div 
                key={log.id} 
                // Tuỳ chỉnh CSS dựa trên isEscalated
                className={`p-5 rounded-xl flex justify-between items-center transition-all hover:shadow-md
                  ${isEscalated 
                    ? 'bg-red-50 border-l-[6px] border-red-600 shadow-md animate-pulse' // Viền đậm, nền đỏ nhạt, hiệu ứng nhấp nháy
                    : 'bg-white border-l-4 border-red-500 shadow-sm' // Mặc định
                  }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {/* Thêm icon báo động mạnh nếu escalated */}
                    {isEscalated && (
                      <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />
                    )}
                    
                    <span className={`font-bold ${isEscalated ? 'text-red-700 text-lg' : 'text-gray-900'}`}>
                      {log.action_type}
                    </span>
                    
                    {/* Badge phụ cho escalated */}
                    {isEscalated && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-200 px-2 py-0.5 rounded uppercase ml-1">
                        Khẩn cấp
                      </span>
                    )}

                    <span className={`text-xs px-2 py-0.5 rounded ${isEscalated ? 'text-red-500 bg-red-100' : 'text-gray-400 bg-gray-100'}`}>
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className={`${isEscalated ? 'text-red-900 font-medium' : 'text-gray-600'}`}>
                    {log.action_value}
                  </p>
                  
                  {areaObj && (
                    <p className={`flex items-center gap-1 text-sm mt-2 ${isEscalated ? 'font-semibold text-red-700' : 'font-medium text-gray-600'}`}>
                      <MapPin className="w-4 h-4" />
                      Khu vực: {areaObj.area_name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleResolve(log.id)}
                  className={`${
                    isEscalated 
                      ? 'bg-red-600 hover:bg-red-700 animate-none' // Nút xử lý khẩn cấp màu đỏ
                      : 'bg-gray-900 hover:bg-red-600'
                    } text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-gray-100`}
                >
                  Xác nhận xử lý
                </button>
              </div>
            );
          }) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed text-gray-400">
              Hiện tại không có cảnh báo nào.
            </div>
          )}
        </div>
      </section>

      {/* Lịch sử xử lý */}
      <section className="pt-6 border-t mt-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Cảnh báo đã xác nhận
        </h2>
        <div className="space-y-3">
          {resolvedAlerts.length > 0 ? resolvedAlerts.map((log: any) => {
            const areaObj = log.area;

            return (
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
                  <p className="text-gray-600 text-sm mb-1">{log.action_value}</p>
                  
                  {areaObj && (
                    <p className="flex items-center gap-1 text-xs font-medium text-indigo-600 mb-3">
                      <MapPin className="w-3 h-3" />
                      Khu vực: {areaObj.area_name}
                    </p>
                  )}                  
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
                
                <div className="text-right ml-4">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Xác nhận lúc</p>
                  <p className="text-xs font-semibold text-gray-700">
                    {log.resolved_at ? new Date(log.resolved_at).toLocaleString('vi-VN') : '---'}
                  </p>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-10 text-gray-400 text-sm italic">
              Chưa có nhật ký xử lý nào.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
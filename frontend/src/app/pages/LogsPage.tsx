import React, { useState } from 'react';
import { 
  Search, Filter, Settings, Power, 
  Thermometer, Droplets, User as UserIcon, Calendar, ClipboardList
} from 'lucide-react';
import { store } from '../store';

export function LogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const allLogs = store.getAllDeviceLogs();
  const devices = store.getDevices();

  const filteredLogs = allLogs.filter(log => {
    const device = devices.find(d => d.id === log.deviceId);
    const searchContent = `${log.action} ${device?.name || ''} ${log.user || ''}`.toLowerCase();
    return searchContent.includes(searchTerm.toLowerCase());
  });

  const getLogIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('bật') || act.includes('tắt')) return <Power className="w-4 h-4 text-orange-500" />;
    if (act.includes('nhiệt độ')) return <Thermometer className="w-4 h-4 text-red-500" />;
    if (act.includes('độ ẩm')) return <Droplets className="w-4 h-4 text-blue-500" />;
    return <Settings className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header đồng bộ */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nhật ký hệ thống</h1>
          <p className="text-gray-500">Theo dõi toàn bộ hoạt động vận hành thiết bị</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
          <Calendar className="w-4 h-4 text-[#2ECC71]" />
          <span className="text-sm font-medium text-gray-600">{new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Search Bar - Bo góc giống Lịch trình */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm hành động, thiết bị..."
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#2ECC71] transition-all shadow-sm text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 bg-white px-4 py-2 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all shadow-sm text-sm">
          <Filter className="w-4 h-4" /> Lọc
        </button>
      </div>

      {/* Danh sách Logs - Layout giống trang Lịch trình */}
      <div className="grid gap-4">
        {filteredLogs.map((log) => {
          const device = devices.find(d => d.id === log.deviceId);
          return (
            <div key={log.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#2ECC71]/30 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Thời gian - Cột 1 */}
                  <div className="w-24 border-r border-gray-100 pr-4">
                    <p className="font-bold text-gray-900 text-base">
                      {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  {/* Thiết bị & Hành động - Cột 2 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{device?.name || 'Hệ thống'}</h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {getLogIcon(log.action)}
                        {log.action}
                      </span>
                    </div>
                    {log.value !== undefined && (
                      <p className="text-sm font-bold text-red-500 flex items-center gap-1">
                         Giá trị đo: {log.value}{device?.type === 'temperature' ? '°C' : '%'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Người thực hiện - Cột 3 */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl group-hover:bg-green-50 transition-colors">
                  <UserIcon className="w-4 h-4 text-[#2ECC71]" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">
                    {log.user || 'SYSTEM'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
            <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Không có dữ liệu nhật ký</p>
          </div>
        )}
      </div>
    </div>
  );
}
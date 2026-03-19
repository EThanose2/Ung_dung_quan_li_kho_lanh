import { useParams, useNavigate } from 'react-router';
import { Power, PowerOff, Activity, Settings, Clock, List } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { store } from '../store';
import { useState } from 'react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '../components/ui/breadcrumb';

export function DeviceDetailPage() {
  const { warehouseId, areaId, deviceId } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(store.getDevice(deviceId!));
  const [showControlModeModal, setShowControlModeModal] = useState(false);

  if (!device) {
    return <div className="p-8">Không tìm thấy thiết bị</div>;
  }

  const area = store.getArea(device.areaId);
  const warehouse = area ? store.getWarehouse(area.warehouseId) : null;
  const isSensor = device.category === 'sensor';
  const deviceLogs = store.getDeviceLogs(device.id);
  const deviceSchedules = store.getSchedules().filter(s => s.deviceId === device.id);

  const toggleDevice = () => {
    const updated = store.updateDevice(device.id, { isActive: !device.isActive });
    if (updated) {
      setDevice(updated);
      store.addDeviceLog({
        deviceId: device.id,
        timestamp: new Date(),
        action: updated.isActive ? 'Bật thiết bị (Thủ công)' : 'Tắt thiết bị (Thủ công)',
        user: store.getCurrentUser()?.fullName
      });
    }
  };

  const handleControlModeChange = (mode: 'manual' | 'automatic' | 'scheduled') => {
    const updated = store.updateDevice(device.id, { controlMode: mode });
    if (updated) {
      setDevice(updated);
      store.addDeviceLog({
        deviceId: device.id,
        timestamp: new Date(),
        action: `Chuyển chế độ điều khiển: ${mode === 'manual' ? 'Thủ công' : mode === 'automatic' ? 'Tự động' : 'Lịch trình'}`,
        user: store.getCurrentUser()?.fullName
      });
      setShowControlModeModal(false);
    }
  };

  const sensorData = device.type === 'temperature' ? [
    { time: '00:00', value: 8.0 },
    { time: '04:00', value: 8.5 },
    { time: '08:00', value: 7.5 },
    { time: '12:00', value: 8.0 },
    { time: '16:00', value: 8.2 },
    { time: '20:00', value: 7.8 },
    { time: '23:59', value: 8.0 },
  ] : device.type === 'humidity' ? [
    { time: '00:00', value: 85 },
    { time: '04:00', value: 83 },
    { time: '08:00', value: 86 },
    { time: '12:00', value: 85 },
    { time: '16:00', value: 84 },
    { time: '20:00', value: 86 },
    { time: '23:59', value: 85 },
  ] : [];

  return (
    <div className="p-8 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/dashboard')} className="cursor-pointer text-gray-600 hover:text-gray-900">
              Tổng quan
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/warehouses')} className="cursor-pointer text-gray-600 hover:text-gray-900">
              Kho lạnh
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(`/warehouses/${warehouseId}`)} className="cursor-pointer text-gray-600 hover:text-gray-900">
              {warehouse?.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(`/warehouses/${warehouseId}/areas/${areaId}`)} className="cursor-pointer text-gray-600 hover:text-gray-900">
              {area?.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-gray-900">{device.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{device.name}</h1>
            <p className="text-gray-500">
              {warehouse?.name} → {area?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              device.status === 'online' ? 'bg-green-100 text-green-700' :
              device.status === 'offline' ? 'bg-gray-100 text-gray-700' :
              'bg-red-100 text-red-700'
            }`}>
              <Activity className="w-4 h-4" />
              {device.status === 'online' ? 'Trực tuyến' : device.status === 'offline' ? 'Ngoại tuyến' : 'Lỗi'}
            </span>
            {!isSensor && (
              <button
                onClick={() => setShowControlModeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Chế độ
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Loại thiết bị</p>
            <p className="text-lg font-semibold text-gray-900">
              {device.type === 'temperature' ? 'Cảm biến nhiệt độ' :
               device.type === 'humidity' ? 'Cảm biến độ ẩm' :
               device.type === 'cooling' ? 'Hệ thống làm lạnh' :
               device.type === 'fan' ? 'Quạt thông gió' : 'Đèn chiếu sáng'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {device.category === 'sensor' ? 'Cảm biến' : 'Điều khiển'}
            </p>
          </div>

          {isSensor && device.value !== undefined && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Giá trị hiện tại</p>
              <p className="text-3xl font-bold text-gray-900">
                {device.value}{device.type === 'temperature' ? '°C' : '%'}
              </p>
            </div>
          )}

          {!isSensor && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Chế độ điều khiển</p>
              <p className="text-lg font-semibold text-gray-900">
                {device.controlMode === 'manual' ? 'Thủ công' :
                 device.controlMode === 'automatic' ? 'Tự động' : 'Lịch trình'}
              </p>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Cập nhật lần cuối</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(device.lastUpdate).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {!isSensor && (
          <div className="p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Điều khiển thiết bị</h3>
                <p className="text-sm text-gray-500">Bật hoặc tắt thiết bị thủ công</p>
              </div>
              <button
                onClick={toggleDevice}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-all ${
                  device.isActive
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {device.isActive ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                {device.isActive ? 'Đang BẬT' : 'Đang TẮT'}
              </button>
            </div>
          </div>
        )}
      </div>

      {isSensor && sensorData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">
            Biểu đồ {device.type === 'temperature' ? 'nhiệt độ' : 'độ ẩm'} (24 giờ)
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={sensorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Line
                key={`sensor-${device.id}`}
                type="monotone"
                dataKey="value"
                stroke={device.type === 'temperature' ? '#E74C3C' : '#3498DB'}
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Schedules */}
      {!isSensor && deviceSchedules.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-700" />
            <h2 className="font-semibold text-gray-900">Lịch trình tự động</h2>
          </div>
          <div className="space-y-3">
            {deviceSchedules.map(schedule => (
              <div key={schedule.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {schedule.action === 'on' ? 'Bật' : 'Tắt'} thiết bị: {schedule.startTime} - {schedule.endTime}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Các ngày: {schedule.days.map(d => ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][d - 1]).join(', ')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    schedule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {schedule.enabled ? 'Đang hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Device Logs */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-gray-700" />
          <h2 className="font-semibold text-gray-900">Nhật ký hoạt động</h2>
        </div>
        <div className="space-y-2">
          {deviceLogs.slice(0, 10).map(log => (
            <div key={log.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-gray-900">{log.action}</p>
                {log.value !== undefined && (
                  <p className="text-sm text-gray-600">Giá trị: {log.value}{device.type === 'temperature' ? '°C' : '%'}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{log.user || 'Hệ thống'}</p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                {new Date(log.timestamp).toLocaleString('vi-VN')}
              </span>
            </div>
          ))}
          {deviceLogs.length === 0 && (
            <p className="text-center text-gray-500 py-8">Chưa có hoạt động nào được ghi nhận</p>
          )}
        </div>
      </div>

      {/* Control Mode Modal */}
      {showControlModeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Chế độ điều khiển</h2>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => handleControlModeChange('manual')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  device.controlMode === 'manual'
                    ? 'border-[#2ECC71] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">Thủ công</p>
                <p className="text-sm text-gray-600">Điều khiển thiết bị bằng tay</p>
              </button>

              <button
                onClick={() => handleControlModeChange('automatic')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  device.controlMode === 'automatic'
                    ? 'border-[#2ECC71] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">Tự động</p>
                <p className="text-sm text-gray-600">Hệ thống tự động điều khiển theo ngưỡng</p>
              </button>

              <button
                onClick={() => handleControlModeChange('scheduled')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  device.controlMode === 'scheduled'
                    ? 'border-[#2ECC71] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">Lịch trình</p>
                <p className="text-sm text-gray-600">Điều khiển theo lịch đã cài đặt</p>
              </button>
            </div>
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setShowControlModeModal(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

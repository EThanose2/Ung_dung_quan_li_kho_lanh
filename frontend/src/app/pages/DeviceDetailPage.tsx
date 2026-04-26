// src/pages/DeviceDetailPage.tsx
// Đã kết nối API thật: getWarehouses, getSensorHistory, controlDevice

import { useParams, useNavigate } from 'react-router';
import { Power, PowerOff, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage
} from '../components/ui/breadcrumb';
import {
  getWarehouses, getSensorHistory, controlDevice,
  AreaApi, DeviceApi, SensorReadingApi, WarehouseApi
} from '../api/apiService';

export function DeviceDetailPage() {
  const { warehouseId, areaId, deviceId } = useParams();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<WarehouseApi | null>(null);
  const [area, setArea] = useState<AreaApi | null>(null);
  const [device, setDevice] = useState<DeviceApi | null>(null);
  const [sensorHistory, setSensorHistory] = useState<SensorReadingApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [controlling, setControlling] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await getWarehouses();
        const wh = res.data.data.find(w => String(w.id) === warehouseId);
        setWarehouse(wh || null);

        const foundArea = wh?.areas.find(a => String(a.id) === areaId);
        setArea(foundArea || null);

        const foundDevice = foundArea?.devices.find(d => String(d.id) === deviceId);
        setDevice(foundDevice || null);

        // Load lịch sử cảm biến nếu là SENSOR
        if (foundDevice?.device_type?.toUpperCase() === 'SENSOR' && foundArea) {
          // Tự detect loại cảm biến từ tên/feed key
          const feedKey = foundDevice.adafruit_feed_key?.toLowerCase() ?? '';
          const name = foundDevice.device_name?.toLowerCase() ?? '';
          let sensorType: 'TEMP' | 'HUMI' | 'LIGHT' = 'TEMP';
          if (feedKey.includes('humi') || feedKey.includes('am') || name.includes('ẩm')) {
            sensorType = 'HUMI';
          } else if (feedKey.includes('light') || name.includes('ánh sáng')) {
            sensorType = 'LIGHT';
          }

          const histRes = await getSensorHistory({ type: sensorType, area_id: foundArea.id, limit: 24 });
          setSensorHistory(histRes.data.data);
        }
      } catch (err) {
        console.error('Lỗi load DeviceDetailPage:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [warehouseId, areaId, deviceId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!device) {
    return <div className="p-8 text-gray-500">Không tìm thấy thiết bị</div>;
  }

  const isActuator = device.device_type?.toUpperCase() === 'ACTUATOR';
  const isSensor = device.device_type?.toUpperCase() === 'SENSOR';
  const isOnline = device.status?.toUpperCase() === 'ONLINE';

  // Format chart data
  const chartData = sensorHistory.map(r => ({
    time: new Date(r.recorded_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    value: r.reading_value,
    type: r.sensor_type,
  }));

  const handleControl = async (action: string) => {
    setControlling(true);
    try {
      await controlDevice({ device_id: device.adafruit_feed_key, action });
      setLastAction(action);
    } catch (err) {
      console.error('Lỗi điều khiển:', err);
      alert('Gửi lệnh thất bại!');
    } finally {
      setControlling(false);
    }
  };

  const feedKey = device.adafruit_feed_key?.toLowerCase() ?? '';
  const devName = device.device_name?.toLowerCase() ?? '';
  const isHumi = feedKey.includes('humi') || feedKey.includes('am') || devName.includes('ẩm');
  const chartColor = isHumi ? '#3498DB' : '#E74C3C';
  const chartUnit = isHumi ? '%' : '°C';

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
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
              {warehouse?.warehouse_name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate(`/warehouses/${warehouseId}/areas/${areaId}`)} className="cursor-pointer text-gray-600 hover:text-gray-900">
              {area?.area_name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-gray-900">{device.device_name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Info card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{device.device_name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {warehouse?.warehouse_name} → {area?.area_name}
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            <Activity className="w-4 h-4" />
            {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Loại thiết bị</p>
            <p className="font-semibold text-gray-900">{device.device_type}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Feed key (Adafruit)</p>
            <p className="font-semibold text-gray-900 font-mono text-sm">{device.adafruit_feed_key || '—'}</p>
          </div>
          {isSensor && device.latest_value !== undefined && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Giá trị hiện tại</p>
              <p className="text-3xl font-bold text-gray-900">
                {device.latest_value}{chartUnit}
              </p>
            </div>
          )}
        </div>

        {/* Điều khiển actuator */}
        {isActuator && (
          <div className="mt-6 p-6 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Điều khiển thiết bị</h3>
            <p className="text-sm text-gray-500 mb-4">Gửi lệnh thủ công qua Adafruit MQTT</p>
            {lastAction && (
              <p className="text-xs text-green-600 mb-3">✓ Đã gửi lệnh: <strong>{lastAction}</strong></p>
            )}
            <div className="flex flex-wrap gap-3">
              {['ON', 'OFF', 'MODE_1', 'MODE_2', 'MODE_3'].map(action => (
                <button
                  key={action}
                  onClick={() => handleControl(action)}
                  disabled={controlling || !isOnline}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    action === 'ON'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : action === 'OFF'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {action === 'ON' ? <Power className="w-4 h-4" /> : action === 'OFF' ? <PowerOff className="w-4 h-4" /> : null}
                  {controlling ? '...' : action}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Biểu đồ lịch sử cảm biến */}
      {isSensor && chartData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">
            Lịch sử {isHumi ? 'độ ẩm' : 'nhiệt độ'} ({chartData.length} điểm)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6B7280" />
              <Tooltip formatter={(v) => [`${v}${chartUnit}`, isHumi ? 'Độ ẩm' : 'Nhiệt độ']} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {isSensor && chartData.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100 text-gray-400">
          Chưa có dữ liệu lịch sử cảm biến
        </div>
      )}
    </div>
  );
}

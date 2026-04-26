// src/pages/AreaDetailPage.tsx
// Đã kết nối API thật: getWarehouses, getLatestSensors, getSensorHistory, updateAreaSettings, controlDevice, getFoodTypes

import { useParams, useNavigate } from 'react-router';
import { Thermometer, Droplets, Settings, Tag, AlertTriangle, Power, PowerOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage
} from '../components/ui/breadcrumb';
import {
  getWarehouses, getLatestSensors, getSensorHistory,
  updateAreaSettings, controlDevice, getFoodTypes,
  AreaApi, DeviceApi, SensorReadingApi, FoodTypeApi, WarehouseApi
} from '../api/apiService';

export function AreaDetailPage() {
  const { warehouseId, areaId } = useParams();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<WarehouseApi | null>(null);
  const [area, setArea] = useState<AreaApi | null>(null);
  const [latestSensors, setLatestSensors] = useState<SensorReadingApi[]>([]);
  const [tempHistory, setTempHistory] = useState<SensorReadingApi[]>([]);
  const [humiHistory, setHumiHistory] = useState<SensorReadingApi[]>([]);
  const [allFoodTypes, setAllFoodTypes] = useState<FoodTypeApi[]>([]);
  const [loading, setLoading] = useState(true);

  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [showFoodTypeModal, setShowFoodTypeModal] = useState(false);
  const [selectedFoodTypeId, setSelectedFoodTypeId] = useState<number | null>(null);
  const [savingFood, setSavingFood] = useState(false);
  const [savingMode, setSavingMode] = useState(false);

  // Load tất cả data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [whRes, foodRes] = await Promise.all([
          getWarehouses(),
          getFoodTypes(),
        ]);

        const wh = whRes.data.data.find(w => String(w.id) === warehouseId);
        setWarehouse(wh || null);

        const foundArea = wh?.areas.find(a => String(a.id) === areaId);
        setArea(foundArea || null);

        if (foundArea) {
          setSelectedFoodTypeId(foundArea.current_food_type?.id ?? null);
          // Lấy sensor data
          const [latestRes, tempRes, humiRes] = await Promise.all([
            getLatestSensors(foundArea.id),
            getSensorHistory({ type: 'TEMP', area_id: foundArea.id, limit: 20 }),
            getSensorHistory({ type: 'HUMI', area_id: foundArea.id, limit: 20 }),
          ]);
          setLatestSensors(latestRes.data.data);
          setTempHistory(tempRes.data.data);
          setHumiHistory(humiRes.data.data);
        }

        setAllFoodTypes(foodRes.data.data);
      } catch (err) {
        console.error('Lỗi load AreaDetailPage:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [warehouseId, areaId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!area) {
    return <div className="p-8 text-gray-500">Không tìm thấy khu vực</div>;
  }

  // Lấy giá trị cảm biến mới nhất từ devices
  const sensors = area.devices.filter(d => d.device_type?.toUpperCase() === 'SENSOR');
  const actuators = area.devices.filter(d => d.device_type?.toUpperCase() === 'ACTUATOR');

  const tempSensor = sensors.find(d =>
    d.device_name?.toLowerCase().includes('nhiệt') ||
    d.adafruit_feed_key?.toLowerCase().includes('temp') ||
    d.adafruit_feed_key?.toLowerCase().includes('nhiet')
  );
  const humiSensor = sensors.find(d =>
    d.device_name?.toLowerCase().includes('ẩm') ||
    d.adafruit_feed_key?.toLowerCase().includes('humi') ||
    d.adafruit_feed_key?.toLowerCase().includes('am')
  );

  const currentTemp = tempSensor?.latest_value ?? null;
  const currentHumi = humiSensor?.latest_value ?? null;
  const food = area.current_food_type;

  const tempWarning = food && currentTemp !== null
    ? currentTemp < food.min_temp || currentTemp > food.max_temp : false;
  const humiWarning = food && currentHumi !== null
    ? currentHumi < food.min_humi || currentHumi > food.max_humi : false;

  // Format chart data từ sensor history
  const tempChartData = tempHistory.map(r => ({
    time: new Date(r.recorded_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    value: r.reading_value
  }));
  const humiChartData = humiHistory.map(r => ({
    time: new Date(r.recorded_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    value: r.reading_value
  }));

  // Đổi chế độ AUTO/MANUAL
  const handleToggleMode = async () => {
    const newMode = area.operating_mode === 'AUTO' ? 'MANUAL' : 'AUTO';
    setSavingMode(true);
    try {
      const res = await updateAreaSettings(area.id, { operating_mode: newMode });
      setArea(res.data.data);
    } catch (err) {
      console.error('Lỗi đổi chế độ:', err);
      alert('Đổi chế độ thất bại!');
    } finally {
      setSavingMode(false);
    }
  };

  // Lưu loại thực phẩm
  const handleSaveFoodType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFoodTypeId) return;
    setSavingFood(true);
    try {
      const res = await updateAreaSettings(area.id, { current_food_type_id: selectedFoodTypeId });
      setArea(res.data.data);
      setShowFoodTypeModal(false);
    } catch (err) {
      console.error('Lỗi lưu food type:', err);
      alert('Cập nhật thực phẩm thất bại!');
    } finally {
      setSavingFood(false);
    }
  };

  // Điều khiển thiết bị (actuator)
  const handleControlDevice = async (device: DeviceApi, action: string) => {
    try {
      await controlDevice({ device_id: device.adafruit_feed_key, action });
      alert(`Đã gửi lệnh ${action} đến ${device.device_name}`);
    } catch (err) {
      console.error('Lỗi điều khiển thiết bị:', err);
      alert('Gửi lệnh thất bại!');
    }
  };

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
            <BreadcrumbPage className="text-gray-900">{area.area_name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{area.area_name}</h1>
            <p className="text-gray-500 text-sm mt-1">{warehouse?.warehouse_name}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Badge cảnh báo */}
            {(tempWarning || humiWarning) && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                <AlertTriangle className="w-4 h-4" /> Cảnh báo vượt ngưỡng
              </span>
            )}
            {/* Nút đổi chế độ */}
            <button
              onClick={handleToggleMode}
              disabled={savingMode}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                area.operating_mode === 'AUTO'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {savingMode ? 'Đang lưu...' : area.operating_mode === 'AUTO' ? '⚡ Tự động' : '🖐 Thủ công'}
            </button>
            {/* Nút đổi thực phẩm */}
            <button
              onClick={() => setShowFoodTypeModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Tag className="w-4 h-4" />
              {food ? food.food_name : 'Chọn thực phẩm'}
            </button>
          </div>
        </div>

        {/* Sensor cards */}
        <div className="grid grid-cols-2 gap-6">
          <div className={`p-5 rounded-xl ${tempWarning ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className={`w-5 h-5 ${tempWarning ? 'text-orange-500' : 'text-red-400'}`} />
              <span className="font-medium text-gray-700">Nhiệt độ</span>
            </div>
            <p className={`text-4xl font-bold ${tempWarning ? 'text-orange-600' : 'text-gray-900'}`}>
              {currentTemp !== null ? `${currentTemp}°C` : '—'}
            </p>
            {food && (
              <p className="text-xs text-gray-400 mt-2">Ngưỡng: {food.min_temp} ~ {food.max_temp}°C</p>
            )}
          </div>
          <div className={`p-5 rounded-xl ${humiWarning ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Droplets className={`w-5 h-5 ${humiWarning ? 'text-orange-500' : 'text-blue-400'}`} />
              <span className="font-medium text-gray-700">Độ ẩm</span>
            </div>
            <p className={`text-4xl font-bold ${humiWarning ? 'text-orange-600' : 'text-gray-900'}`}>
              {currentHumi !== null ? `${currentHumi}%` : '—'}
            </p>
            {food && (
              <p className="text-xs text-gray-400 mt-2">Ngưỡng: {food.min_humi} ~ {food.max_humi}%</p>
            )}
          </div>
        </div>
      </div>

      {/* Biểu đồ nhiệt độ */}
      {tempChartData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Lịch sử nhiệt độ</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tempChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6B7280" />
              <Tooltip formatter={(v) => [`${v}°C`, 'Nhiệt độ']} />
              <Line type="monotone" dataKey="value" stroke="#E74C3C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Biểu đồ độ ẩm */}
      {humiChartData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Lịch sử độ ẩm</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={humiChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6B7280" />
              <Tooltip formatter={(v) => [`${v}%`, 'Độ ẩm']} />
              <Line type="monotone" dataKey="value" stroke="#3498DB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Danh sách thiết bị */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">
          Thiết bị trong khu vực ({area.devices.length})
        </h2>
        {area.devices.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Chưa có thiết bị nào</p>
        ) : (
          <div className="space-y-3">
            {area.devices.map(device => {
              const isActuator = device.device_type?.toUpperCase() === 'ACTUATOR';
              const isOnline = device.status?.toUpperCase() === 'ONLINE';
              return (
                <div
                  key={device.id}
                  onClick={() => navigate(`/warehouses/${warehouseId}/areas/${areaId}/devices/${device.id}`)}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{device.device_name}</p>
                      <p className="text-xs text-gray-400">{device.device_type} • {device.adafruit_feed_key}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {device.latest_value !== undefined && (
                      <span className="text-sm font-bold text-gray-700">
                        {device.latest_value}
                      </span>
                    )}
                    {isActuator && (
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleControlDevice(device, 'ON')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 transition-colors"
                        >
                          <Power className="w-3 h-3" /> BẬT
                        </button>
                        <button
                          onClick={() => handleControlDevice(device, 'OFF')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                        >
                          <PowerOff className="w-3 h-3" /> TẮT
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal đổi thực phẩm */}
      {showFoodTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Chọn loại thực phẩm</h2>
            </div>
            <form onSubmit={handleSaveFoodType} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {allFoodTypes.map(ft => (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => setSelectedFoodTypeId(ft.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedFoodTypeId === ft.id
                        ? 'border-[#2ECC71] bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{ft.food_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      🌡 {ft.min_temp}~{ft.max_temp}°C &nbsp; 💧 {ft.min_humi}~{ft.max_humi}%
                    </p>
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFoodTypeModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedFoodTypeId || savingFood}
                  className="px-6 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60] disabled:opacity-50"
                >
                  {savingFood ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

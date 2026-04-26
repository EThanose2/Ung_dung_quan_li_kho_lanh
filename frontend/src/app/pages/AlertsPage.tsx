// src/pages/AlertsPage.tsx
// Đã kết nối API thật: tính toán cảnh báo từ getWarehouses()
// BE chưa có endpoint /alerts riêng, nên tự tính từ sensor data

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { getWarehouses, AreaApi, DeviceApi, FoodTypeApi } from '../api/apiService';

interface Alert {
  id: string;
  areaId: number;
  areaName: string;
  warehouseName: string;
  type: 'temperature' | 'humidity';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  min: number;
  max: number;
  acknowledged: boolean;
}

function buildAlerts(areas: AreaApi[], warehouseName: string): Alert[] {
  const result: Alert[] = [];

  areas.forEach(area => {
    const food: FoodTypeApi | null = area.current_food_type;
    if (!food) return;

    const sensors = area.devices.filter(d => d.device_type?.toUpperCase() === 'SENSOR');

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

    if (currentTemp !== null && (currentTemp < food.min_temp || currentTemp > food.max_temp)) {
      const diff = Math.abs(currentTemp - (currentTemp < food.min_temp ? food.min_temp : food.max_temp));
      result.push({
        id: `temp-${area.id}`,
        areaId: area.id,
        areaName: area.area_name,
        warehouseName,
        type: 'temperature',
        severity: diff > 2 ? 'critical' : 'warning',
        message: `Nhiệt độ ${currentTemp < food.min_temp ? 'thấp hơn' : 'cao hơn'} ngưỡng cho phép (${food.food_name})`,
        value: currentTemp,
        min: food.min_temp,
        max: food.max_temp,
        acknowledged: false,
      });
    }

    if (currentHumi !== null && (currentHumi < food.min_humi || currentHumi > food.max_humi)) {
      const diff = Math.abs(currentHumi - (currentHumi < food.min_humi ? food.min_humi : food.max_humi));
      result.push({
        id: `humi-${area.id}`,
        areaId: area.id,
        areaName: area.area_name,
        warehouseName,
        type: 'humidity',
        severity: diff > 5 ? 'critical' : 'warning',
        message: `Độ ẩm ${currentHumi < food.min_humi ? 'thấp hơn' : 'cao hơn'} ngưỡng cho phép (${food.food_name})`,
        value: currentHumi,
        min: food.min_humi,
        max: food.max_humi,
        acknowledged: false,
      });
    }
  });

  return result;
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAndBuildAlerts = async () => {
    try {
      setLoading(true);
      const res = await getWarehouses();
      const newAlerts: Alert[] = [];

      res.data.data.forEach(wh => {
        const built = buildAlerts(wh.areas, wh.warehouse_name);
        newAlerts.push(...built);
      });

      // Giữ lại trạng thái acknowledged từ lần trước
      setAlerts(prev => newAlerts.map(a => ({
        ...a,
        acknowledged: prev.find(p => p.id === a.id)?.acknowledged ?? false,
      })));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Lỗi lấy alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndBuildAlerts();
    // Tự refresh mỗi 60 giây
    const interval = setInterval(fetchAndBuildAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cảnh báo</h1>
          <p className="text-gray-500">Theo dõi và quản lý các cảnh báo hệ thống</p>
        </div>
        <button
          onClick={fetchAndBuildAlerts}
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
              <p className="text-3xl font-semibold text-gray-900">{alerts.length}</p>
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
              <p className="text-3xl font-semibold text-green-600">{acknowledgedAlerts.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active alerts */}
      {activeAlerts.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Cảnh báo chưa xử lý</h2>
          <div className="space-y-3">
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500' : 'border-orange-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                      }`} />
                      <h3 className="font-semibold text-gray-900">{alert.areaName}</h3>
                      <span className="text-xs text-gray-400">{alert.warehouseName}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {alert.severity === 'critical' ? 'Nghiêm trọng' : 'Cảnh báo'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        Giá trị hiện tại: <strong className="text-gray-900">
                          {alert.value}{alert.type === 'temperature' ? '°C' : '%'}
                        </strong>
                      </span>
                      <span>
                        Ngưỡng cho phép: <strong className="text-gray-900">
                          {alert.min} ~ {alert.max}{alert.type === 'temperature' ? '°C' : '%'}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm ml-4"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acknowledged alerts */}
      {acknowledgedAlerts.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Đã xác nhận</h2>
          <div className="space-y-3">
            {acknowledgedAlerts.map(alert => (
              <div key={alert.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 opacity-60">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{alert.areaName}</h3>
                      <span className="text-xs text-gray-400">{alert.warehouseName}</span>
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">Đã xử lý</span>
                    </div>
                    <p className="text-gray-700">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && alerts.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Không có cảnh báo</h3>
          <p className="text-gray-500">Tất cả các khu vực đang hoạt động trong ngưỡng cho phép</p>
        </div>
      )}
    </div>
  );
}

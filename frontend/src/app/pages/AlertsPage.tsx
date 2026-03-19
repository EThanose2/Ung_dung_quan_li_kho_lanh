import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { store } from '../store';

export function AlertsPage() {
  const [alerts, setAlerts] = useState(store.getAlerts());

  useEffect(() => {
    const areas = store.getAreas();
    areas.forEach(area => {
      if (area.currentTemp < area.minTemp || area.currentTemp > area.maxTemp) {
        const severity = Math.abs(area.currentTemp - (area.currentTemp < area.minTemp ? area.minTemp : area.maxTemp)) > 2 ? 'critical' : 'warning';
        store.addAlert({
          areaId: area.id,
          areaName: area.name,
          type: 'temperature',
          severity,
          message: `Nhiệt độ ${area.currentTemp < area.minTemp ? 'thấp hơn' : 'cao hơn'} ngưỡng cho phép`,
          value: area.currentTemp,
          threshold: area.currentTemp < area.minTemp ? area.minTemp : area.maxTemp,
          timestamp: new Date(),
          acknowledged: false
        });
      }

      if (area.currentHumidity < area.minHumidity || area.currentHumidity > area.maxHumidity) {
        const severity = Math.abs(area.currentHumidity - (area.currentHumidity < area.minHumidity ? area.minHumidity : area.maxHumidity)) > 5 ? 'critical' : 'warning';
        store.addAlert({
          areaId: area.id,
          areaName: area.name,
          type: 'humidity',
          severity,
          message: `Độ ẩm ${area.currentHumidity < area.minHumidity ? 'thấp hơn' : 'cao hơn'} ngưỡng cho phép`,
          value: area.currentHumidity,
          threshold: area.currentHumidity < area.minHumidity ? area.minHumidity : area.maxHumidity,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });

    setAlerts(store.getAlerts());
  }, []);

  const handleAcknowledge = (id: string) => {
    store.acknowledgeAlert(id);
    setAlerts(store.getAlerts());
  };

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cảnh báo</h1>
        <p className="text-gray-500">Theo dõi và quản lý các cảnh báo hệ thống</p>
      </div>

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
                        Ngưỡng: <strong className="text-gray-900">
                          {alert.threshold}{alert.type === 'temperature' ? '°C' : '%'}
                        </strong>
                      </span>
                      <span>{new Date(alert.timestamp).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {acknowledgedAlerts.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Lịch sử cảnh báo</h2>
          <div className="space-y-3">
            {acknowledgedAlerts.map(alert => (
              <div
                key={alert.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 opacity-60"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{alert.areaName}</h3>
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        Đã xử lý
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{alert.message}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Không có cảnh báo</h3>
          <p className="text-gray-500">Tất cả các khu vực đang hoạt động bình thường</p>
        </div>
      )}
    </div>
  );
}

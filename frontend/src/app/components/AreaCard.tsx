import { useNavigate } from 'react-router';
import { Thermometer, Droplets, Activity, AlertTriangle } from 'lucide-react';
import { Area } from '../types';

interface AreaCardProps {
  area: Area;
  warehouseId: string;
}

export function AreaCard({ area, warehouseId }: AreaCardProps) {
  const navigate = useNavigate();

  const statusColors = {
    normal: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
    alert: 'bg-red-100 text-red-700'
  };

  const statusLabels = {
    normal: 'Bình thường',
    warning: 'Cảnh báo',
    alert: 'Nguy hiểm'
  };

  return (
    <div
      onClick={() => navigate(`/warehouses/${warehouseId}/areas/${area.id}`)}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{area.name}</h3>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusColors[area.status]}`}>
            <Activity className="w-3 h-3" />
            {statusLabels[area.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <Thermometer className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Nhiệt độ</p>
            <p className="font-semibold text-gray-900">{area.currentTemp}°C</p>
            <p className="text-xs text-gray-400">{area.minTemp}°C ~ {area.maxTemp}°C</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Độ ẩm</p>
            <p className="font-semibold text-gray-900">{area.currentHumidity}%</p>
            <p className="text-xs text-gray-400">{area.minHumidity}% ~ {area.maxHumidity}%</p>
          </div>
        </div>
      </div>

      {area.status !== 'normal' && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-orange-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Vượt ngưỡng cho phép</span>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{area.deviceCount}</span> thiết bị đang hoạt động
        </p>
      </div>
    </div>
  );
}

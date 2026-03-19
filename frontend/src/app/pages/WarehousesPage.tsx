import { useNavigate } from 'react-router';
import { Warehouse, MapPin, Thermometer, AlertTriangle } from 'lucide-react';
import { store } from '../store';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '../components/ui/breadcrumb';

export function WarehousesPage() {
  const navigate = useNavigate();
  const warehouses = store.getWarehouses();

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
            <BreadcrumbPage className="text-gray-900">Kho lạnh</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kho lạnh</h1>
        <p className="text-gray-500">Quản lý các kho lạnh trong hệ thống</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {warehouses.map(warehouse => (
          <div
            key={warehouse.id}
            onClick={() => navigate(`/warehouses/${warehouse.id}`)}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center">
                  <Warehouse className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {warehouse.location}
                  </p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                warehouse.status === 'normal' ? 'bg-green-100 text-green-700' :
                warehouse.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {warehouse.status === 'normal' ? 'Bình thường' :
                 warehouse.status === 'warning' ? 'Cảnh báo' : 'Nguy hiểm'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{warehouse.areaCount}</p>
                <p className="text-xs text-gray-500">Khu vực</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{warehouse.deviceCount}</p>
                <p className="text-xs text-gray-500">Thiết bị</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{warehouse.activeAlerts}</p>
                <p className="text-xs text-gray-500">Cảnh báo</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <Thermometer className="w-4 h-4 text-red-500" />
                <span className="text-gray-600">Trung bình:</span>
                <span className="font-medium text-gray-900">{warehouse.averageTemp}°C</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Độ ẩm:</span>
                <span className="font-medium text-gray-900">{warehouse.averageHumidity}%</span>
              </div>
            </div>

            {warehouse.activeAlerts > 0 && (
              <div className="mt-3 flex items-center gap-2 text-orange-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{warehouse.activeAlerts} cảnh báo cần xử lý</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Thermometer, Droplets, Cpu, Bell, Plus, Pencil, Trash2 } from 'lucide-react';
import { store } from '../store';
import { AreaCard } from '../components/AreaCard';
import { useState } from 'react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '../components/ui/breadcrumb';
import { Area } from '../types';

export function WarehouseDetailPage() {
  const { warehouseId } = useParams();
  const navigate = useNavigate();
  const warehouse = store.getWarehouse(warehouseId!);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areas, setAreas] = useState(store.getAreasByWarehouse(warehouseId!));

  const users = store.getUsers().filter(u => u.role === 'Operator');
  const foodTypes = store.getFoodTypes();

  const [formData, setFormData] = useState({
    name: '',
    warehouseId: warehouseId!,
    type: 'vegetable' as 'vegetable' | 'meat',
    operatorId: '',
    foodTypeIds: [] as string[],
    currentTemp: 0,
    currentHumidity: 0,
    minTemp: 0,
    maxTemp: 0,
    minHumidity: 0,
    maxHumidity: 0,
    status: 'normal' as 'normal' | 'warning' | 'alert',
    deviceCount: 0
  });

  if (!warehouse) {
    return <div className="p-8">Không tìm thấy kho lạnh</div>;
  }

  const allDevices = areas.flatMap(area => store.getDevicesByArea(area.id));
  const activeDevices = allDevices.filter(d => d.status === 'online').length;

  const handleAddArea = () => {
    setEditingArea(null);
    setFormData({
      name: '',
      warehouseId: warehouseId!,
      type: 'vegetable',
      operatorId: '',
      foodTypeIds: [],
      currentTemp: 0,
      currentHumidity: 0,
      minTemp: 0,
      maxTemp: 0,
      minHumidity: 0,
      maxHumidity: 0,
      status: 'normal',
      deviceCount: 0
    });
    setShowAreaModal(true);
  };

  const handleEditArea = (area: Area, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingArea(area);
    setFormData({
      name: area.name,
      warehouseId: warehouseId!,
      type: area.type,
      operatorId: area.operatorId || '',
      foodTypeIds: area.foodTypeIds,
      currentTemp: area.currentTemp,
      currentHumidity: area.currentHumidity,
      minTemp: area.minTemp,
      maxTemp: area.maxTemp,
      minHumidity: area.minHumidity,
      maxHumidity: area.maxHumidity,
      status: area.status,
      deviceCount: area.deviceCount
    });
    setShowAreaModal(true);
  };

  const handleDeleteArea = (areaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa khu vực này?')) {
      store.deleteArea(areaId);
      setAreas(store.getAreasByWarehouse(warehouseId!));
    }
  };

  const toggleFoodType = (id: string) => {
    setFormData(prev => ({
      ...prev,
      foodTypeIds: prev.foodTypeIds.includes(id)
        ? prev.foodTypeIds.filter(fid => fid !== id)
        : [...prev.foodTypeIds, id]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArea) {
      store.updateArea(editingArea.id, formData);
    } else {
      store.addArea(formData);
    }
    setAreas(store.getAreasByWarehouse(warehouseId!));
    setShowAreaModal(false);
  };

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
            <BreadcrumbPage className="text-gray-900">{warehouse.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{warehouse.name}</h1>
            <p className="text-gray-500 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {warehouse.location}
            </p>
          </div>
          <span className={`inline-flex px-3 py-2 rounded-lg text-sm font-medium ${
            warehouse.status === 'normal' ? 'bg-green-100 text-green-700' :
            warehouse.status === 'warning' ? 'bg-orange-100 text-orange-700' :
            'bg-red-100 text-red-700'
          }`}>
            {warehouse.status === 'normal' ? 'Hoạt động bình thường' :
             warehouse.status === 'warning' ? 'Có cảnh báo' : 'Nguy hiểm'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700">Khu vực</span>
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{warehouse.areaCount}</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-700">Thiết bị</span>
              <Cpu className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{activeDevices}/{allDevices.length}</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-orange-700">Cảnh báo</span>
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-900">{warehouse.activeAlerts}</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-700">Nhiệt độ TB</span>
              <Thermometer className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">{warehouse.averageTemp}°C</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Thermometer className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Nhiệt độ trung bình</p>
                <p className="text-xl font-semibold text-gray-900">{warehouse.averageTemp}°C</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Độ ẩm trung bình</p>
                <p className="text-xl font-semibold text-gray-900">{warehouse.averageHumidity}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Khu vực trong kho</h2>
          <button
            onClick={handleAddArea}
            className="flex items-center gap-2 bg-[#2ECC71] text-white px-4 py-2 rounded-lg hover:bg-[#27AE60] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm khu vực
          </button>
        </div>
        {areas.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {areas.map(area => (
              <div key={area.id} className="relative group">
                <AreaCard area={area} warehouseId={warehouseId!} />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEditArea(area, e)}
                    className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteArea(area.id, e)}
                    className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">Chưa có khu vực nào trong kho này</p>
          </div>
        )}
      </div>

      {showAreaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingArea ? 'Chỉnh sửa khu vực' : 'Thêm khu vực mới'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên khu vực</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại khu vực</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                >
                  <option value="vegetable">Rau củ</option>
                  <option value="meat">Thịt cá</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại thực phẩm</label>
                <div className="grid grid-cols-2 gap-2">
                  {foodTypes.map(ft => (
                    <button
                      key={ft.id}
                      type="button"
                      onClick={() => toggleFoodType(ft.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        formData.foodTypeIds.includes(ft.id)
                          ? 'border-[#2ECC71] bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{ft.name}</p>
                      <p className="text-xs text-gray-500">{ft.minTemp}~{ft.maxTemp}°C</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Người vận hành</label>
                <select
                  value={formData.operatorId}
                  onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                >
                  <option value="">Chưa phân công</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nhiệt độ tối thiểu (°C)</label>
                  <input
                    type="number"
                    value={formData.minTemp}
                    onChange={(e) => setFormData({ ...formData, minTemp: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nhiệt độ tối đa (°C)</label>
                  <input
                    type="number"
                    value={formData.maxTemp}
                    onChange={(e) => setFormData({ ...formData, maxTemp: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nhiệt độ hiện tại (°C)</label>
                  <input
                    type="number"
                    value={formData.currentTemp}
                    onChange={(e) => setFormData({ ...formData, currentTemp: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Độ ẩm tối thiểu (%)</label>
                  <input
                    type="number"
                    value={formData.minHumidity}
                    onChange={(e) => setFormData({ ...formData, minHumidity: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Độ ẩm tối đa (%)</label>
                  <input
                    type="number"
                    value={formData.maxHumidity}
                    onChange={(e) => setFormData({ ...formData, maxHumidity: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Độ ẩm hiện tại (%)</label>
                  <input
                    type="number"
                    value={formData.currentHumidity}
                    onChange={(e) => setFormData({ ...formData, currentHumidity: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAreaModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60]"
                >
                  {editingArea ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

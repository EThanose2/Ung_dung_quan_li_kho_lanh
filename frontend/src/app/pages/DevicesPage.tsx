import { useState } from 'react';
import { Plus, Pencil, Trash2, Power, PowerOff, Search, Filter, X, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { store } from '../store';
import { Device, DeviceType } from '../types';

export function DevicesPage() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState(store.getDevices());
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const areas = store.getAreas();
  const warehouses = store.getWarehouses();
  const foodTypes = store.getFoodTypes();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedDeviceType, setSelectedDeviceType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedFoodType, setSelectedFoodType] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  const [formData, setFormData] = useState({
    name: '',
    type: 'temperature' as DeviceType,
    category: 'sensor' as 'sensor' | 'control',
    areaId: '',
    status: 'online' as 'online' | 'offline' | 'error',
    isActive: false,
    controlMode: 'automatic' as 'manual' | 'automatic' | 'scheduled',
    value: 0
  });

  const deviceTypeLabels: Record<DeviceType, string> = {
    temperature: 'Cảm biến nhiệt độ',
    humidity: 'Cảm biến độ ẩm',
    cooling: 'Hệ thống làm lạnh',
    fan: 'Quạt thông gió',
    light: 'Đèn chiếu sáng'
  };

  // Filter logic
  const filteredDevices = devices.filter(device => {
    const area = areas.find(a => a.id === device.areaId);

    // Search filter
    if (searchQuery && !device.name.toLowerCase().includes(searchQuery.toLowerCase()) && !device.id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Warehouse filter
    if (selectedWarehouse && area?.warehouseId !== selectedWarehouse) {
      return false;
    }

    // Area filter
    if (selectedArea && device.areaId !== selectedArea) {
      return false;
    }

    // Device type filter
    if (selectedDeviceType && device.type !== selectedDeviceType) {
      return false;
    }

    // Category filter
    if (selectedCategory && device.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (selectedStatus && device.status !== selectedStatus) {
      return false;
    }

    // Food type filter
    if (selectedFoodType && area && !area.foodTypeIds.includes(selectedFoodType)) {
      return false;
    }

    return true;
  });

  // Sort logic
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'newest':
        return b.lastUpdate.getTime() - a.lastUpdate.getTime();
      case 'oldest':
        return a.lastUpdate.getTime() - b.lastUpdate.getTime();
      case 'status':
        const statusOrder = { error: 0, offline: 1, online: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      default:
        return 0;
    }
  });

  const activeFilters = [
    { key: 'warehouse', value: selectedWarehouse, label: warehouses.find(w => w.id === selectedWarehouse)?.name },
    { key: 'area', value: selectedArea, label: areas.find(a => a.id === selectedArea)?.name },
    { key: 'type', value: selectedDeviceType, label: deviceTypeLabels[selectedDeviceType as DeviceType] },
    { key: 'category', value: selectedCategory, label: selectedCategory === 'sensor' ? 'Cảm biến' : 'Điều khiển' },
    { key: 'status', value: selectedStatus, label: selectedStatus === 'online' ? 'Hoạt động' : selectedStatus === 'offline' ? 'Ngoại tuyến' : 'Lỗi' },
    { key: 'foodType', value: selectedFoodType, label: foodTypes.find(ft => ft.id === selectedFoodType)?.name },
  ].filter(f => f.value);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedWarehouse('');
    setSelectedArea('');
    setSelectedDeviceType('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedFoodType('');
  };

  const removeFilter = (key: string) => {
    switch (key) {
      case 'warehouse': setSelectedWarehouse(''); break;
      case 'area': setSelectedArea(''); break;
      case 'type': setSelectedDeviceType(''); break;
      case 'category': setSelectedCategory(''); break;
      case 'status': setSelectedStatus(''); break;
      case 'foodType': setSelectedFoodType(''); break;
    }
  };

  const handleAdd = () => {
    setEditingDevice(null);
    setFormData({
      name: '',
      type: 'temperature',
      category: 'sensor',
      areaId: '',
      status: 'online',
      isActive: false,
      controlMode: 'automatic',
      value: 0
    });
    setShowModal(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      category: device.category,
      areaId: device.areaId,
      status: device.status,
      isActive: device.isActive,
      controlMode: device.controlMode,
      value: device.value || 0
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      store.deleteDevice(id);
      setDevices(store.getDevices());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDevice) {
      store.updateDevice(editingDevice.id, { ...formData, lastUpdate: new Date() });
    } else {
      store.addDevice({ ...formData, lastUpdate: new Date() });
    }
    setDevices(store.getDevices());
    setShowModal(false);
  };

  const toggleDevice = (device: Device) => {
    store.updateDevice(device.id, { isActive: !device.isActive });
    setDevices(store.getDevices());
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý thiết bị</h1>
          <p className="text-gray-500">Quản lý cảm biến và thiết bị điều khiển</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#2ECC71] text-white px-4 py-2 rounded-lg hover:bg-[#27AE60] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm thiết bị
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
            />
          </div>

          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
          >
            <option value="">Tất cả kho lạnh</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
          >
            <option value="">Tất cả khu vực</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            value={selectedDeviceType}
            onChange={(e) => setSelectedDeviceType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
          >
            <option value="">Tất cả loại thiết bị</option>
            {Object.entries(deviceTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
          >
            <option value="">Tất cả phân loại</option>
            <option value="sensor">Cảm biến</option>
            <option value="control">Điều khiển</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="online">Hoạt động</option>
            <option value="offline">Ngoại tuyến</option>
            <option value="error">Lỗi</option>
          </select>

          <select
            value={selectedFoodType}
            onChange={(e) => setSelectedFoodType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
          >
            <option value="">Tất cả loại thực phẩm</option>
            {foodTypes.map(ft => (
              <option key={ft.id} value={ft.id}>{ft.name}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
          >
            <option value="name-asc">Tên (A-Z)</option>
            <option value="name-desc">Tên (Z-A)</option>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="status">Ưu tiên trạng thái</option>
          </select>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Đang lọc:</span>
              {activeFilters.map(filter => (
                <button
                  key={filter.key}
                  onClick={() => removeFilter(filter.key)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#2ECC71] bg-opacity-10 text-[#2ECC71] rounded-full text-sm hover:bg-opacity-20 transition-colors"
                >
                  {filter.label}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-full text-sm transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Xóa tất cả
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Hiển thị <span className="font-semibold">{sortedDevices.length}</span> / {devices.length} thiết bị
        </p>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tên thiết bị</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Loại</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Khu vực</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Giá trị</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trạng thái</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Điều khiển</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedDevices.map(device => {
              const area = areas.find(a => a.id === device.areaId);
              const isSensor = device.category === 'sensor';

              return (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/devices/${device.id}`)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {device.name}
                    </button>
                    <p className="text-xs text-gray-400">{device.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{deviceTypeLabels[device.type]}</span>
                    <p className="text-xs text-gray-500">{device.category === 'sensor' ? 'Cảm biến' : 'Điều khiển'}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{area?.name}</td>
                  <td className="px-6 py-4">
                    {isSensor && device.value !== undefined ? (
                      <span className="text-gray-900">
                        {device.value}{device.type === 'temperature' ? '°C' : '%'}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      device.status === 'online' ? 'bg-green-100 text-green-700' :
                      device.status === 'offline' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {device.status === 'online' ? 'Hoạt động' : device.status === 'offline' ? 'Ngoại tuyến' : 'Lỗi'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {!isSensor ? (
                      <button
                        onClick={() => toggleDevice(device)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                          device.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {device.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                        {device.isActive ? 'Bật' : 'Tắt'}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">Tự động</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(device)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(device.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedDevices.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500">Không tìm thấy thiết bị nào phù hợp</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingDevice ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên thiết bị</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại thiết bị</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as DeviceType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  >
                    {Object.entries(deviceTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Khu vực</label>
                  <select
                    value={formData.areaId}
                    onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  >
                    <option value="">Chọn khu vực</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60]"
                >
                  {editingDevice ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

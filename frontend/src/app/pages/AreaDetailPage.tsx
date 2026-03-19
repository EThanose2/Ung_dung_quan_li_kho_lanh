import { useParams, useNavigate } from 'react-router';
import { Thermometer, Droplets, Settings, Tag, AlertTriangle, Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { store } from '../store';
import { useState } from 'react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '../components/ui/breadcrumb';
import { Device, DeviceType } from '../types';

export function AreaDetailPage() {
  const { warehouseId, areaId } = useParams();
  const navigate = useNavigate();
  const currentUser = store.getCurrentUser();
  const [area, setArea] = useState(store.getArea(areaId!));
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showFoodTypeModal, setShowFoodTypeModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [devices, setDevices] = useState(store.getDevicesByArea(areaId!));

  const [thresholdData, setThresholdData] = useState({
    minTemp: area?.minTemp || 0,
    maxTemp: area?.maxTemp || 0,
    minHumidity: area?.minHumidity || 0,
    maxHumidity: area?.maxHumidity || 0
  });

  const [deviceFormData, setDeviceFormData] = useState({
    name: '',
    type: 'temperature' as DeviceType,
    category: 'sensor' as 'sensor' | 'control',
    areaId: areaId!,
    status: 'online' as 'online' | 'offline' | 'error',
    isActive: false,
    controlMode: 'automatic' as 'manual' | 'automatic' | 'scheduled',
    value: 0
  });

  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>(area?.foodTypeIds || []);

  const deviceTypeLabels: Record<DeviceType, string> = {
    temperature: 'Cảm biến nhiệt độ',
    humidity: 'Cảm biến độ ẩm',
    cooling: 'Hệ thống làm lạnh',
    fan: 'Quạt thông gió',
    light: 'Đèn chiếu sáng'
  };

  if (!area) {
    return <div className="p-8">Không tìm thấy khu vực</div>;
  }

  const operator = area.operatorId ? store.getUsers().find(u => u.id === area.operatorId) : null;
  const foodTypes = area.foodTypeIds.map(id => store.getFoodType(id)).filter(ft => ft !== null);
  const warehouse = store.getWarehouse(area.warehouseId);
  const allFoodTypes = store.getFoodTypes();

  // Check for violations based on food type rules
  const violations = foodTypes.filter(ft =>
    area.currentTemp < ft!.minTemp || area.currentTemp > ft!.maxTemp ||
    area.currentHumidity < ft!.minHumidity || area.currentHumidity > ft!.maxHumidity
  );

  // Mock sensor data
  const temperatureData = [
    { time: '00:00', value: 8.0 },
    { time: '04:00', value: 8.5 },
    { time: '08:00', value: 7.5 },
    { time: '12:00', value: 8.0 },
    { time: '16:00', value: 8.2 },
    { time: '20:00', value: 7.8 },
    { time: '23:59', value: 8.0 },
  ];

  const humidityData = [
    { time: '00:00', value: 85 },
    { time: '04:00', value: 83 },
    { time: '08:00', value: 86 },
    { time: '12:00', value: 85 },
    { time: '16:00', value: 84 },
    { time: '20:00', value: 86 },
    { time: '23:59', value: 85 },
  ];

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = store.updateArea(area.id, thresholdData);
    if (updated) setArea(updated);
    setShowThresholdModal(false);
    alert('Cập nhật ngưỡng thành công!');
  };

  const handleAddDevice = () => {
    setEditingDevice(null);
    setDeviceFormData({
      name: '',
      type: 'temperature',
      category: 'sensor',
      areaId: areaId!,
      status: 'online',
      isActive: false,
      controlMode: 'automatic',
      value: 0
    });
    setShowDeviceModal(true);
  };

  const handleEditDevice = (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDevice(device);
    setDeviceFormData({
      name: device.name,
      type: device.type,
      category: device.category,
      areaId: areaId!,
      status: device.status,
      isActive: device.isActive,
      controlMode: device.controlMode,
      value: device.value || 0
    });
    setShowDeviceModal(true);
  };

  const handleDeleteDevice = (deviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      store.deleteDevice(deviceId);
      setDevices(store.getDevicesByArea(areaId!));
    }
  };

  const handleDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDevice) {
      store.updateDevice(editingDevice.id, { ...deviceFormData, lastUpdate: new Date() });
    } else {
      store.addDevice({ ...deviceFormData, lastUpdate: new Date() });
    }
    setDevices(store.getDevicesByArea(areaId!));
    setShowDeviceModal(false);
  };

  const toggleDevice = (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    store.updateDevice(device.id, { isActive: !device.isActive });
    setDevices(store.getDevicesByArea(areaId!));
  };

  const handleOpenFoodTypeModal = () => {
    setSelectedFoodTypes(area.foodTypeIds);
    setShowFoodTypeModal(true);
  };

  const toggleFoodType = (id: string) => {
    setSelectedFoodTypes(prev =>
      prev.includes(id)
        ? prev.filter(fid => fid !== id)
        : [...prev, id]
    );
  };

  const handleSaveFoodTypes = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedFoodTypeObjs = selectedFoodTypes.map(id => allFoodTypes.find(ft => ft.id === id)).filter(ft => ft);

    const violations = selectedFoodTypeObjs.filter(ft =>
      ft!.minTemp < area.minTemp || ft!.maxTemp > area.maxTemp ||
      ft!.minHumidity < area.minHumidity || ft!.maxHumidity > area.maxHumidity
    );

    if (violations.length > 0) {
      alert(`Không thể thêm các loại thực phẩm sau vì vượt ngưỡng khu vực:\n${violations.map(ft => ft!.name).join(', ')}\n\nVui lòng điều chỉnh ngưỡng khu vực trước.`);
      return;
    }

    const updated = store.updateArea(area.id, { foodTypeIds: selectedFoodTypes });
    if (updated) setArea(updated);
    setShowFoodTypeModal(false);
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
            <BreadcrumbLink onClick={() => navigate(`/warehouses/${warehouseId}`)} className="cursor-pointer text-gray-600 hover:text-gray-900">
              {warehouse?.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-gray-900">{area.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{area.name}</h1>
            <p className="text-gray-500 mb-3">
              <span className="font-medium">Kho:</span> {warehouse?.name} • <span className="font-medium">Người vận hành:</span> {operator?.fullName || 'Chưa phân công'}
            </p>

            {/* Food Types */}
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Loại thực phẩm:</span>
              {foodTypes.map(ft => (
                <span key={ft!.id} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {ft!.name}
                </span>
              ))}
              <button
                onClick={handleOpenFoodTypeModal}
                className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" />
                Thêm
              </button>
            </div>
          </div>
          {currentUser?.role === 'Operator' && (
            <button
              onClick={() => setShowThresholdModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60] transition-colors"
            >
              <Settings className="w-5 h-5" />
              Cấu hình ngưỡng
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                <Thermometer className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nhiệt độ hiện tại</p>
                <p className="text-3xl font-bold text-gray-900">{area.currentTemp}°C</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Ngưỡng cho phép:</span>
              <span className="font-medium text-gray-900">{area.minTemp}°C ~ {area.maxTemp}°C</span>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                <Droplets className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Độ ẩm hiện tại</p>
                <p className="text-3xl font-bold text-gray-900">{area.currentHumidity}%</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Ngưỡng cho phép:</span>
              <span className="font-medium text-gray-900">{area.minHumidity}% ~ {area.maxHumidity}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Violations Alert */}
      {violations.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Vi phạm ngưỡng loại thực phẩm</h3>
              {violations.map(ft => (
                <div key={ft!.id} className="mb-2">
                  <p className="text-sm text-red-800">
                    <strong>{ft!.name}:</strong> Yêu cầu {ft!.minTemp}~{ft!.maxTemp}°C, {ft!.minHumidity}~{ft!.maxHumidity}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sensor Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Biểu đồ nhiệt độ (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={temperatureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Line key={`temp-${area.id}`} type="monotone" dataKey="value" stroke="#E74C3C" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Biểu đồ độ ẩm (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={humidityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Line key={`humid-${area.id}`} type="monotone" dataKey="value" stroke="#3498DB" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Thiết bị trong khu vực</h2>
          <button
            onClick={handleAddDevice}
            className="flex items-center gap-2 bg-[#2ECC71] text-white px-4 py-2 rounded-lg hover:bg-[#27AE60] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm thiết bị
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {devices.map(device => {
            const isSensor = device.category === 'sensor';
            return (
              <div
                key={device.id}
                onClick={() => navigate(`/warehouses/${warehouseId}/areas/${areaId}/devices/${device.id}`)}
                className="relative group p-4 border border-gray-200 rounded-lg hover:border-[#2ECC71] hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{device.name}</h3>
                  <span className={`w-2 h-2 rounded-full ${
                    device.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
                <p className="text-sm text-gray-500">
                  {deviceTypeLabels[device.type]}
                </p>
                {isSensor && device.value !== undefined && (
                  <p className="text-lg font-semibold text-gray-900 mt-2">
                    {device.value}{device.type === 'temperature' ? '°C' : '%'}
                  </p>
                )}
                {!isSensor && (
                  <button
                    onClick={(e) => toggleDevice(device, e)}
                    className={`mt-2 flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                      device.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {device.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    {device.isActive ? 'Bật' : 'Tắt'}
                  </button>
                )}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEditDevice(device, e)}
                    className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <Pencil className="w-3 h-3 text-blue-600" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteDevice(device.id, e)}
                    className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              </div>
            );
          })}
          {devices.length === 0 && (
            <div className="col-span-2 p-12 text-center text-gray-500">
              Chưa có thiết bị nào trong khu vực này
            </div>
          )}
        </div>
      </div>

      {showDeviceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingDevice ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
              </h2>
            </div>
            <form onSubmit={handleDeviceSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên thiết bị</label>
                <input
                  type="text"
                  value={deviceFormData.name}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại thiết bị</label>
                  <select
                    value={deviceFormData.type}
                    onChange={(e) => setDeviceFormData({ ...deviceFormData, type: e.target.value as DeviceType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  >
                    {Object.entries(deviceTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phân loại</label>
                  <select
                    value={deviceFormData.category}
                    onChange={(e) => setDeviceFormData({ ...deviceFormData, category: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  >
                    <option value="sensor">Cảm biến</option>
                    <option value="control">Điều khiển</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDeviceModal(false)}
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

      {showFoodTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Quản lý loại thực phẩm</h2>
            </div>
            <form onSubmit={handleSaveFoodTypes} className="p-6 space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Chọn các loại thực phẩm phù hợp với khu vực này. Hệ thống sẽ kiểm tra ngưỡng.
              </div>
              <div className="grid grid-cols-2 gap-3">
                {allFoodTypes.map(ft => {
                  const isSelected = selectedFoodTypes.includes(ft.id);
                  const exceedsThreshold = ft.minTemp < area.minTemp || ft.maxTemp > area.maxTemp ||
                    ft.minHumidity < area.minHumidity || ft.maxHumidity > area.maxHumidity;

                  return (
                    <button
                      key={ft.id}
                      type="button"
                      onClick={() => toggleFoodType(ft.id)}
                      disabled={exceedsThreshold && !isSelected}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        isSelected
                          ? 'border-[#2ECC71] bg-green-50'
                          : exceedsThreshold
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{ft.name}</p>
                      <p className="text-xs text-gray-500">{ft.minTemp}~{ft.maxTemp}°C, {ft.minHumidity}~{ft.maxHumidity}%</p>
                      {exceedsThreshold && !isSelected && (
                        <p className="text-xs text-red-600 mt-1">Vượt ngưỡng khu vực</p>
                      )}
                    </button>
                  );
                })}
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
                  className="px-4 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60]"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showThresholdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Cấu hình ngưỡng môi trường</h2>
            </div>
            <form onSubmit={handleSaveThreshold} className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Nhiệt độ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tối thiểu (°C)</label>
                    <input
                      type="number"
                      value={thresholdData.minTemp}
                      onChange={(e) => setThresholdData({ ...thresholdData, minTemp: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tối đa (°C)</label>
                    <input
                      type="number"
                      value={thresholdData.maxTemp}
                      onChange={(e) => setThresholdData({ ...thresholdData, maxTemp: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Độ ẩm</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tối thiểu (%)</label>
                    <input
                      type="number"
                      value={thresholdData.minHumidity}
                      onChange={(e) => setThresholdData({ ...thresholdData, minHumidity: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tối đa (%)</label>
                    <input
                      type="number"
                      value={thresholdData.maxHumidity}
                      onChange={(e) => setThresholdData({ ...thresholdData, maxHumidity: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowThresholdModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60]"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

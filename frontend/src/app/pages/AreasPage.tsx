import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { store } from '../store';
import { Area } from '../types';

export function AreasPage() {
  const [areas, setAreas] = useState(store.getAreas());
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const users = store.getUsers().filter(u => u.role === 'Operator');
  const warehouses = store.getWarehouses();
  const foodTypes = store.getFoodTypes();

  const [formData, setFormData] = useState({
    name: '',
    warehouseId: '',
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

  const handleAdd = () => {
    setEditingArea(null);
    setFormData({
      name: '',
      warehouseId: '',
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
    setShowModal(true);
  };

  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      warehouseId: area.warehouseId,
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
    setShowModal(true);
  };

  const toggleFoodType = (id: string) => {
    setFormData(prev => ({
      ...prev,
      foodTypeIds: prev.foodTypeIds.includes(id)
        ? prev.foodTypeIds.filter(fid => fid !== id)
        : [...prev.foodTypeIds, id]
    }));
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khu vực này?')) {
      store.deleteArea(id);
      setAreas(store.getAreas());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArea) {
      store.updateArea(editingArea.id, formData);
    } else {
      store.addArea(formData);
    }
    setAreas(store.getAreas());
    setShowModal(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý khu vực</h1>
          <p className="text-gray-500">Quản lý các khu vực lưu trữ thực phẩm</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#2ECC71] text-white px-4 py-2 rounded-lg hover:bg-[#27AE60] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm khu vực
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tên khu vực</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kho</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Loại thực phẩm</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Người vận hành</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nhiệt độ</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Độ ẩm</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trạng thái</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {areas.map(area => {
              const operator = users.find(u => u.id === area.operatorId);
              const warehouse = warehouses.find(w => w.id === area.warehouseId);
              const areaFoodTypes = area.foodTypeIds.map(id => foodTypes.find(ft => ft.id === id)).filter(ft => ft);
              return (
                <tr key={area.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{area.name}</td>
                  <td className="px-6 py-4 text-gray-600">{warehouse?.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {areaFoodTypes.map(ft => (
                        <span key={ft!.id} className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {ft!.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{operator?.fullName || 'Chưa phân công'}</td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{area.currentTemp}°C</span>
                    <span className="text-xs text-gray-500 ml-1">({area.minTemp}~{area.maxTemp}°C)</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{area.currentHumidity}%</span>
                    <span className="text-xs text-gray-500 ml-1">({area.minHumidity}~{area.maxHumidity}%)</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                      area.status === 'normal' ? 'bg-green-100 text-green-700' :
                      area.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {area.status === 'normal' ? 'Bình thường' : area.status === 'warning' ? 'Cảnh báo' : 'Nguy hiểm'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(area)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(area.id)}
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
      </div>

      {showModal && (
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kho lạnh</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  >
                    <option value="">Chọn kho</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
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
                  onClick={() => setShowModal(false)}
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

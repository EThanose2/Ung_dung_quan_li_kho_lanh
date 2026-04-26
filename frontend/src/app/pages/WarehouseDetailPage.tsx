// src/pages/WarehouseDetailPage.tsx
import { useParams, useNavigate } from 'react-router';
import {
  Thermometer, Droplets, Cpu, Bell, Plus, Pencil, Trash2, X, ChevronRight, Home, Layers
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  getWarehouses, createArea, deleteArea, updateAreaSettings,
  getFoodTypes, getUsers, assignOperator,
  WarehouseApi, AreaApi, FoodTypeApi, UserApi
} from '../api/apiService';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage
} from '../components/ui/breadcrumb';

export function WarehouseDetailPage() {
  const { warehouseId } = useParams();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<WarehouseApi | null>(null);
  const [foodTypes, setFoodTypes] = useState<FoodTypeApi[]>([]);
  const [operators, setOperators] = useState<UserApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaApi | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    area_name: '',
    current_food_type_id: '' as number | '',
    operating_mode: 'AUTO' as 'AUTO' | 'MANUAL',
    auto_door_timeout_sec: 30,
    manual_override_mins: 30,
    operator_id: '' as number | '',
  });

  const fetchData = async () => {
    try {
      const [whRes, ftRes, usersRes] = await Promise.all([
        getWarehouses(),
        getFoodTypes(),
        getUsers(),
      ]);
      const wh = whRes.data.data.find(w => w.id === Number(warehouseId));
      setWarehouse(wh || null);
      setFoodTypes(ftRes.data.data);
      setOperators(usersRes.data.data.filter(u => u.role === 'OPERATOR'));
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [warehouseId]);

  if (loading) return <div className="p-8 text-gray-400">Đang tải...</div>;
  if (!warehouse) return <div className="p-8 text-gray-500">Không tìm thấy kho lạnh</div>;

  const areas = warehouse.areas || [];
  const allDevices = areas.flatMap(a => a.devices);

  const handleAddArea = () => {
    setEditingArea(null);
    setFormData({
      area_name: '',
      current_food_type_id: '',
      operating_mode: 'AUTO',
      auto_door_timeout_sec: 30,
      manual_override_mins: 30,
      operator_id: '',
    });
    setShowAreaModal(true);
  };

  const handleEditArea = (area: AreaApi, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingArea(area);
    setFormData({
      area_name: area.area_name,
      current_food_type_id: area.current_food_type?.id || '',
      operating_mode: area.operating_mode as 'AUTO' | 'MANUAL',
      auto_door_timeout_sec: area.auto_door_timeout_sec,
      manual_override_mins: area.manual_override_mins,
      operator_id: '',
    });
    setShowAreaModal(true);
  };

  const handleDeleteArea = async (areaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa khu vực này?')) return;
    try {
      await deleteArea(areaId);
      await fetchData();
    } catch (err) {
      console.error('Lỗi xóa khu vực:', err);
      alert('Xóa thất bại!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingArea) {
        // Cập nhật settings của khu vực
        await updateAreaSettings(editingArea.id, {
          current_food_type_id: formData.current_food_type_id as number || undefined,
          operating_mode: formData.operating_mode,
          auto_door_timeout_sec: formData.auto_door_timeout_sec,
          manual_override_mins: formData.manual_override_mins,
        });
        // Gán operator nếu có chọn
        if (formData.operator_id) {
          await assignOperator(editingArea.id, formData.operator_id as number);
        }
      } else {
        // Tạo mới khu vực
        const newArea = await createArea({
          area_name: formData.area_name,
          warehouse_id: Number(warehouseId),
        });
        // Sau khi tạo xong, cập nhật settings
        if (newArea.data.data?.id) {
          await updateAreaSettings(newArea.data.data.id, {
            current_food_type_id: formData.current_food_type_id as number || undefined,
            operating_mode: formData.operating_mode,
            auto_door_timeout_sec: formData.auto_door_timeout_sec,
            manual_override_mins: formData.manual_override_mins,
          });
          if (formData.operator_id) {
            await assignOperator(newArea.data.data.id, formData.operator_id as number);
          }
        }
      }
      await fetchData();
      setShowAreaModal(false);
    } catch (err) {
      console.error('Lỗi lưu khu vực:', err);
      alert('Lưu thất bại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 font-sans">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/dashboard')} className="flex items-center gap-1 cursor-pointer text-gray-500 hover:text-gray-900">
              <Home className="w-4 h-4" /> Tổng quan
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><ChevronRight className="w-4 h-4" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/warehouses')} className="cursor-pointer text-gray-500 hover:text-gray-900">Kho lạnh</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><ChevronRight className="w-4 h-4" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-gray-900 font-semibold">{warehouse.warehouse_name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Warehouse Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{warehouse.warehouse_name}</h1>
            <p className="text-gray-500">{areas.length} khu vực • {allDevices.length} thiết bị</p>
          </div>
          <span className="inline-flex px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700">
            Hoạt động
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl relative">
            <span className="text-sm text-blue-700 font-medium">Khu vực</span>
            <p className="text-3xl font-bold text-blue-900 mt-1">{areas.length}</p>
            <Layers className="absolute top-4 right-4 w-5 h-5 text-blue-400 opacity-50" />
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl relative">
            <span className="text-sm text-green-700 font-medium">Thiết bị</span>
            <p className="text-3xl font-bold text-green-900 mt-1">{allDevices.length}</p>
            <Cpu className="absolute top-4 right-4 w-5 h-5 text-green-400 opacity-50" />
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl relative">
            <span className="text-sm text-orange-700 font-medium">Cảm biến</span>
            <p className="text-3xl font-bold text-orange-900 mt-1">
              {allDevices.filter(d => d.device_type === 'SENSOR').length}
            </p>
            <Bell className="absolute top-4 right-4 w-5 h-5 text-orange-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Areas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Khu vực trong kho</h2>
          <button onClick={handleAddArea} className="flex items-center gap-2 bg-[#2ECC71] text-white px-4 py-2 rounded-lg hover:bg-[#27AE60] transition-colors font-bold shadow-sm">
            <Plus className="w-5 h-5" /> Thêm khu vực
          </button>
        </div>

        {areas.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {areas.map(area => (
              <div key={area.id} className="relative group bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{area.area_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                      area.operating_mode === 'AUTO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {area.operating_mode === 'AUTO' ? 'Tự động' : 'Thủ công'}
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEditArea(area, e)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDeleteArea(area.id, e)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {area.current_food_type && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Thực phẩm đang bảo quản</p>
                    <p className="font-semibold text-gray-800">{area.current_food_type.food_name}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-red-400"/> {area.current_food_type.min_temp}~{area.current_food_type.max_temp}°C</span>
                      <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-400"/> {area.current_food_type.min_humi}~{area.current_food_type.max_humi}%</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{area.devices.length} thiết bị</span>
                  <span>{area.devices.filter(d => d.device_type === 'SENSOR').length} cảm biến</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100 text-gray-500">Chưa có khu vực nào</div>
        )}
      </div>

      {/* Modal thêm/sửa khu vực */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{editingArea ? 'Chỉnh sửa' : 'Thêm'} khu vực</h2>
              <button onClick={() => setShowAreaModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {!editingArea && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Tên khu vực</label>
                  <input
                    type="text"
                    value={formData.area_name}
                    onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    placeholder="VD: Khu bảo quản rau củ"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Loại thực phẩm</label>
                <select
                  value={formData.current_food_type_id}
                  onChange={(e) => setFormData({ ...formData, current_food_type_id: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                >
                  <option value="">Chưa chọn</option>
                  {foodTypes.map(ft => (
                    <option key={ft.id} value={ft.id}>{ft.food_name} ({ft.min_temp}~{ft.max_temp}°C)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Chế độ hoạt động</label>
                <select
                  value={formData.operating_mode}
                  onChange={(e) => setFormData({ ...formData, operating_mode: e.target.value as 'AUTO' | 'MANUAL' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                >
                  <option value="AUTO">Tự động</option>
                  <option value="MANUAL">Thủ công</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Timeout cửa (giây)</label>
                  <input
                    type="number"
                    value={formData.auto_door_timeout_sec}
                    onChange={(e) => setFormData({ ...formData, auto_door_timeout_sec: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Cooldown thủ công (phút)</label>
                  <input
                    type="number"
                    value={formData.manual_override_mins}
                    onChange={(e) => setFormData({ ...formData, manual_override_mins: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Người vận hành</label>
                <select
                  value={formData.operator_id}
                  onChange={(e) => setFormData({ ...formData, operator_id: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                >
                  <option value="">Chưa phân công</option>
                  {operators.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAreaModal(false)} className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-2 bg-[#2ECC71] text-white rounded-lg font-bold hover:bg-[#27AE60] disabled:opacity-50 transition-all">
                  {submitting ? 'Đang lưu...' : editingArea ? 'Cập nhật' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// src/pages/WarehousesPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Warehouse, MapPin, Thermometer, AlertTriangle,
  Plus, X, ChevronRight, Home
} from 'lucide-react';
import { getWarehouses, createWarehouse, WarehouseApi } from '../api/apiService';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage
} from '../components/ui/breadcrumb';

export function WarehousesPage() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<WarehouseApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ warehouse_name: '' });

  const fetchWarehouses = async () => {
    try {
      const res = await getWarehouses();
      setWarehouses(res.data.data);
    } catch (err) {
      console.error('Lỗi lấy kho:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createWarehouse({ warehouse_name: formData.warehouse_name });
      await fetchWarehouses();
      setIsModalOpen(false);
      setFormData({ warehouse_name: '' });
    } catch (err) {
      console.error('Lỗi tạo kho:', err);
      alert('Tạo kho thất bại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 relative min-h-screen bg-gray-50/50">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/dashboard')} className="flex items-center gap-1 cursor-pointer text-gray-500 hover:text-[#2ECC71] transition-colors">
              <Home className="w-4 h-4" /> Tổng quan
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator><ChevronRight className="w-4 h-4" /></BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-gray-900">Kho lạnh</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Kho lạnh</h1>
          <p className="text-gray-500 text-sm">Hệ thống quản lý {warehouses.length} kho lưu trữ thực phẩm</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#2ECC71] hover:bg-[#27AE60] text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Thêm kho mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {warehouses.map(warehouse => {
            const allDevices = warehouse.areas.flatMap(a => a.devices);
            const areaCount = warehouse.areas.length;

            return (
              <div
                key={warehouse.id}
                onClick={() => navigate(`/warehouses/${warehouse.id}`)}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#2ECC71]/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center shadow-lg shadow-green-100">
                      <Warehouse className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-[#2ECC71] transition-colors">{warehouse.warehouse_name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {areaCount} khu vực
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-100">
                    Hoạt động
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="text-center py-2 bg-gray-50 rounded-xl border border-gray-50">
                    <p className="text-lg font-bold text-gray-900">{areaCount}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Khu vực</p>
                  </div>
                  <div className="text-center py-2 bg-gray-50 rounded-xl border border-gray-50">
                    <p className="text-lg font-bold text-gray-900">{allDevices.length}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Thiết bị</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center gap-2 text-gray-500 text-sm">
                  <Thermometer className="w-4 h-4 text-red-400" />
                  <span>Nhấn để xem chi tiết các khu vực</span>
                </div>
              </div>
            );
          })}

          {warehouses.length === 0 && (
            <div className="col-span-3 text-center py-20 text-gray-400">Chưa có kho nào</div>
          )}
        </div>
      )}

      {/* Modal thêm kho */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2ECC71]/5 rounded-full -mr-16 -mt-16" />
            <div className="flex justify-between items-center mb-8 relative">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tạo kho mới</h2>
                <p className="text-sm text-gray-500">Nhập tên kho lưu trữ mới</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="space-y-5 relative" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Tên kho lạnh</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2ECC71] focus:bg-white transition-all outline-none"
                  placeholder="VD: Kho đông lạnh trung tâm"
                  value={formData.warehouse_name}
                  onChange={(e) => setFormData({ warehouse_name: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-bold transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white rounded-xl hover:opacity-90 font-bold shadow-lg shadow-green-100 transition-all active:scale-95 disabled:opacity-50">
                  {submitting ? 'Đang tạo...' : 'Tạo kho ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

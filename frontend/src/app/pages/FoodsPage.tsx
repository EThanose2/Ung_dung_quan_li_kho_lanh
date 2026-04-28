// src/pages/FoodsPage.tsx
import React, { useState, useEffect } from "react";
import { Apple, Thermometer, Droplets, Plus, Pencil, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router";
import { getFoodTypes, createFoodType, updateFoodType, deleteFoodType, FoodTypeApi } from "../api/apiService";
const Field = ({
    label, field, unit, formData, setFormData
  }: {
    label: string;
    field: string;
    unit?: string;
    formData: Record<string, any>;
    setFormData: (v: any) => void;
  }) => (
    <div className="space-y-1">
      <span className="text-[10px] font-black text-gray-400 uppercase ml-1">{label}</span>
      <div className="relative">
        <input
          type="number"
          required
          value={formData[field] as number}
          onChange={(e) => setFormData({ ...formData, [field]: Number(e.target.value) })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2ECC71] outline-none"
        />
        {unit && <span className="absolute right-3 top-2.5 text-gray-400 text-sm">{unit}</span>}
      </div>
    </div>
  );
export function FoodsPage() {
  const navigate = useNavigate();
  const [foods, setFoods] = useState<FoodTypeApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodTypeApi | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = { food_name: "", min_temp: 0, max_temp: 10, min_humi: 50, max_humi: 90 };
  const [formData, setFormData] = useState(emptyForm);

  const fetchFoods = async () => {
    try {
      const res = await getFoodTypes();
      setFoods(res.data.data);
    } catch (err) {
      console.error("Lỗi lấy food types:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFoods(); }, []);

  const handleAdd = () => {
    setEditingFood(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleEdit = (food: FoodTypeApi, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFood(food);
    setFormData({
      food_name: food.food_name,
      min_temp: food.min_temp,
      max_temp: food.max_temp,
      min_humi: food.min_humi,
      max_humi: food.max_humi,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (food: FoodTypeApi, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Xóa loại thực phẩm "${food.food_name}"?`)) return;
    try {
      await deleteFoodType(food.id);
      setFoods(prev => prev.filter(f => f.id !== food.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xóa thất bại!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.min_temp >= formData.max_temp) {
      alert('Nhiệt độ tối thiểu phải nhỏ hơn tối đa!');
      return;
    }
    if (formData.min_humi >= formData.max_humi) {
      alert('Độ ẩm tối thiểu phải nhỏ hơn tối đa!');
      return;
    }
    setSubmitting(true);
    try {
      if (editingFood) {
        await updateFoodType(editingFood.id, formData);
        setFoods(prev => prev.map(f => f.id === editingFood.id ? { ...f, ...formData } : f));
      } else {
        const res = await createFoodType(formData);
        setFoods(prev => [...prev, res.data.data]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lưu thất bại!');
    } finally {
      setSubmitting(false);
    }
  };

  

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý thực phẩm</h1>
          <p className="text-gray-500">Quy chuẩn bảo quản cho các nhóm thực phẩm</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-[#2ECC71] text-white px-4 py-2 rounded-lg hover:bg-[#27AE60] transition-colors font-bold shadow-sm">
          <Plus className="w-5 h-5" /> Thêm thực phẩm
        </button>
      </div>

      <div className="grid gap-4">
        {loading && <div className="bg-white rounded-xl p-12 text-center text-gray-400">Đang tải...</div>}

        {!loading && foods.map(food => (
          <div key={food.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#2ECC71]/30 transition-all group">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-100/50 shrink-0">
                  <Apple className="w-6 h-6 text-[#2ECC71]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-gray-900">{food.food_name}</h3>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                      <Thermometer className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-bold text-red-700">{food.min_temp}°C → {food.max_temp}°C</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-bold text-blue-700">{food.min_humi}% → {food.max_humi}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => handleEdit(food, e)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100">
                  <Pencil className="w-5 h-5" />
                </button>
                <button onClick={(e) => handleDelete(food, e)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && foods.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium">Chưa có loại thực phẩm nào.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingFood ? "Chỉnh sửa thực phẩm" : "Thêm thực phẩm mới"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Tên loại thực phẩm</label>
                <input
                  type="text"
                  required
                  value={formData.food_name}
                  onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  placeholder="VD: Hải sản đông lạnh"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-red-500 mb-2 ml-1 flex items-center gap-1">
                  <Thermometer className="w-4 h-4" /> Dải nhiệt độ bảo quản (°C)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tối thiểu (Min)" field="min_temp" unit="°C" formData={formData} setFormData={setFormData}/>
                  <Field label="Tối đa (Max)" field="max_temp" unit="°C" formData={formData} setFormData={setFormData} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-500 mb-2 ml-1 flex items-center gap-1">
                  <Droplets className="w-4 h-4" /> Dải độ ẩm an toàn (%)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tối thiểu (%)" field="min_humi" unit="%" formData={formData} setFormData={setFormData} />
                  <Field label="Tối đa (%)" field="max_humi" unit="%" formData={formData} setFormData={setFormData}/>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-[#2ECC71] text-white rounded-lg font-bold hover:bg-[#27AE60] shadow-lg shadow-green-100 transition-all active:scale-95 disabled:opacity-50">
                  {submitting ? 'Đang lưu...' : editingFood ? "Lưu thay đổi" : "Xác nhận thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
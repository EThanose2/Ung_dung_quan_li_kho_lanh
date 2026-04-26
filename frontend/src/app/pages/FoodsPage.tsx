// src/pages/FoodsPage.tsx
// Đã fix: kết nối GET /api/food-types thay vì dùng data cứng
// NOTE: BE hiện chỉ có GET food-types. Thêm/Sửa/Xóa cần BE bổ sung endpoint.

import React, { useState, useEffect } from "react";
import {
  Apple, Thermometer, Droplets, Plus,
  Pencil, Trash2, X,
} from "lucide-react";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
} from "../components/ui/breadcrumb";
import { useNavigate } from "react-router";
import { getFoodTypes, FoodTypeApi } from "../api/apiService";

export function FoodsPage() {
  const navigate = useNavigate();
  const [foods, setFoods] = useState<FoodTypeApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodTypeApi | null>(null);

  const [formData, setFormData] = useState({
    food_name: "",
    min_temp: 0,
    max_temp: 0,
    min_humi: 0,
    max_humi: 0,
  });

  // Load danh sách thực phẩm từ BE
  useEffect(() => {
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
    fetchFoods();
  }, []);

  const handleAdd = () => {
    setEditingFood(null);
    setFormData({ food_name: "", min_temp: 0, max_temp: 0, min_humi: 0, max_humi: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (food: FoodTypeApi) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Gọi POST/PUT API khi BE bổ sung endpoint tạo/sửa food types
    // Hiện tại chỉ đóng modal
    alert("Chức năng thêm/sửa cần BE bổ sung endpoint. Hãy tạo POST /api/food-types.");
    setIsModalOpen(false);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => navigate("/dashboard")}
              className="cursor-pointer text-gray-500 hover:text-[#2ECC71]"
            >
              Tổng quan
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-gray-900">
              Danh mục thực phẩm
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý thực phẩm</h1>
          <p className="text-gray-500">Quy chuẩn bảo quản cho các nhóm thực phẩm</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#2ECC71] text-white px-4 py-2 rounded-lg hover:bg-[#27AE60] transition-colors font-bold shadow-sm"
        >
          <Plus className="w-5 h-5" /> Thêm thực phẩm
        </button>
      </div>

      {/* Danh sách */}
      <div className="grid gap-4">
        {loading && (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400">
            Đang tải...
          </div>
        )}

        {!loading && foods.map((food) => (
          <div
            key={food.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#2ECC71]/30 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-100/50 shrink-0">
                  <Apple className="w-6 h-6 text-[#2ECC71]" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-gray-900 tracking-tight">
                    {food.food_name}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                      <Thermometer className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-bold text-red-700">
                        {food.min_temp}°C → {food.max_temp}°C
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-bold text-blue-700">
                        {food.min_humi}% → {food.max_humi}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(food)}
                  className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100"
                  title="Chỉnh sửa"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && foods.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium">
              Chưa có loại thực phẩm nào.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingFood ? "Chỉnh sửa thực phẩm" : "Thêm thực phẩm mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 ml-1">
                  Tên loại thực phẩm
                </label>
                <input
                  type="text"
                  required
                  value={formData.food_name}
                  onChange={(e) =>
                    setFormData({ ...formData, food_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71] transition-all"
                  placeholder="VD: Hải sản đông lạnh"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-red-500 ml-1 flex items-center gap-1">
                  <Thermometer className="w-4 h-4" /> Dải nhiệt độ bảo quản (°C)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Tối thiểu (Min)
                    </span>
                    <input
                      type="number"
                      required
                      value={formData.min_temp}
                      onChange={(e) =>
                        setFormData({ ...formData, min_temp: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Tối đa (Max)
                    </span>
                    <input
                      type="number"
                      required
                      value={formData.max_temp}
                      onChange={(e) =>
                        setFormData({ ...formData, max_temp: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-blue-500 ml-1 flex items-center gap-1">
                  <Droplets className="w-4 h-4" /> Dải độ ẩm an toàn (%)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Tối thiểu (%)
                    </span>
                    <input
                      type="number"
                      required
                      value={formData.min_humi}
                      onChange={(e) =>
                        setFormData({ ...formData, min_humi: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase ml-1">
                      Tối đa (%)
                    </span>
                    <input
                      type="number"
                      required
                      value={formData.max_humi}
                      onChange={(e) =>
                        setFormData({ ...formData, max_humi: Number(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-[#2ECC71] text-white rounded-lg font-bold hover:bg-[#27AE60] shadow-lg shadow-green-100 transition-all active:scale-95"
                >
                  {editingFood ? "Lưu thay đổi" : "Xác nhận thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

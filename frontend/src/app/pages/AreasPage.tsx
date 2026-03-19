import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, AlertCircle, Thermometer, Droplets } from 'lucide-react';
import { store } from '../store';
import { Area } from '../types';

export function AreasPage() {
  const [areas, setAreas] = useState(store.getAreas());
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Logic tính toán khoảng giao an toàn (Set Intersection)
  const calculateThresholds = (selectedIds: string[]) => {
    if (selectedIds.length === 0) return { minT: 0, maxT: 0, minH: 0, maxH: 0, conflict: false };

    const selectedFoods = foodTypes.filter(ft => selectedIds.includes(ft.id));
    
    // Tìm Max của các Min và Min của các Max
    let minT = Math.max(...selectedFoods.map(f => f.minTemp));
    let maxT = Math.min(...selectedFoods.map(f => f.maxTemp));
    let minH = Math.max(...selectedFoods.map(f => f.minHumidity));
    let maxH = Math.min(...selectedFoods.map(f => f.maxHumidity));

    // Xung đột xảy ra khi dải Min lớn hơn dải Max (không có điểm chung)
    return { 
      minT, maxT, minH, maxH, 
      conflict: minT > maxT || minH > maxH 
    };
  };

  const toggleFoodType = (id: string) => {
    const nextIds = formData.foodTypeIds.includes(id)
      ? formData.foodTypeIds.filter(fid => fid !== id)
      : [...formData.foodTypeIds, id];

    const result = calculateThresholds(nextIds);
    
    // Cập nhật trạng thái lỗi ngay lập tức khi người dùng chọn
    if (result.conflict) {
      setError("Vi phạm ngưỡng: Các thực phẩm chọn không có dải nhiệt độ/độ ẩm chung!");
    } else {
      setError(null);
    }

    setFormData(prev => ({
      ...prev,
      foodTypeIds: nextIds,
      minTemp: result.minT,
      maxTemp: result.maxT,
      minHumidity: result.minH,
      maxHumidity: result.maxH,
      // Đề xuất giá trị hiện tại bằng mức tối thiểu an toàn
      currentTemp: prev.currentTemp === 0 ? result.minT : prev.currentTemp,
      currentHumidity: prev.currentHumidity === 0 ? result.minH : prev.currentHumidity
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // KIỂM TRA LẠI TRƯỚC KHI LƯU - CHẶN TUYỆT ĐỐI
    const finalCheck = calculateThresholds(formData.foodTypeIds);
    if (finalCheck.conflict) {
      setError("Vi phạm ngưỡng: Không thể tạo khu vực với các thực phẩm xung đột!");
      return; // Dừng hàm, không cho lưu
    }

    if (formData.foodTypeIds.length === 0) {
      alert("Vui lòng chọn ít nhất một loại thực phẩm.");
      return;
    }

    if (editingArea) store.updateArea(editingArea.id, formData);
    else store.addArea(formData);
    
    setAreas(store.getAreas());
    setShowModal(false);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khu vực</h1>
          <p className="text-gray-500 font-medium">Cấu hình khu vực dựa trên quy chuẩn thực phẩm</p>
        </div>
        <button 
          onClick={() => { setEditingArea(null); setShowModal(true); setError(null); }} 
          className="bg-[#2ECC71] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#27AE60] transition-all"
        >
          <Plus className="w-5 h-5"/> Thêm khu vực
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingArea ? 'Cập nhật' : 'Thành lập'} khu vực mới</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-100"><X/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              {/* Alert Lỗi - Hiển thị cả tên thực phẩm gây lỗi nếu cần */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex flex-col gap-2 animate-shake">
                  <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                    <AlertCircle className="w-4 h-4"/>
                    {error}
                  </div>
                </div>
              )}

              {/* Lựa chọn thực phẩm */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 ml-1">Loại thực phẩm trong khu vực</label>
                <div className="grid grid-cols-2 gap-3">
                  {foodTypes.map(ft => {
                    const isSelected = formData.foodTypeIds.includes(ft.id);
                    return (
                      <button
                        key={ft.id} type="button" onClick={() => toggleFoodType(ft.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                          isSelected ? 'border-[#2ECC71] bg-green-50/50' : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                      >
                        <p className={`font-bold ${isSelected ? 'text-[#2ECC71]' : 'text-gray-700'}`}>{ft.name}</p>
                        <div className="flex flex-col text-[11px] text-gray-400 mt-1 space-y-0.5">
                          <span className="flex items-center gap-1 font-semibold"><Thermometer className="w-3 h-3 text-red-400"/> {ft.minTemp}~{ft.maxTemp}°C</span>
                          <span className="flex items-center gap-1 font-semibold"><Droplets className="w-3 h-3 text-blue-400"/> {ft.minHumidity}~{ft.maxHumidity}%</span>
                        </div>
                        {isSelected && <div className="absolute top-3 right-3 w-2 h-2 bg-[#2ECC71] rounded-full"></div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ngưỡng Tự động - Chỉ xem, không cho sửa */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-400 opacity-30"></div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Min Temp</label>
                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl font-black text-red-500 shadow-sm">{formData.minTemp}°C</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Max Temp</label>
                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl font-black text-red-500 shadow-sm">{formData.maxTemp}°C</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#2ECC71] uppercase">Hiện tại (°C)</label>
                    <input 
                      type="number" 
                      value={formData.currentTemp} 
                      onChange={(e) => setFormData({...formData, currentTemp: Number(e.target.value)})} 
                      className="w-full px-4 py-2 bg-white border-2 border-[#2ECC71] rounded-xl font-black text-[#2ECC71] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 opacity-30"></div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Min Humid</label>
                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl font-black text-blue-500 shadow-sm">{formData.minHumidity}%</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Max Humid</label>
                    <div className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl font-black text-blue-500 shadow-sm">{formData.maxHumidity}%</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#2ECC71] uppercase">Hiện tại (%)</label>
                    <input 
                      type="number" 
                      value={formData.currentHumidity} 
                      onChange={(e) => setFormData({...formData, currentHumidity: Number(e.target.value)})} 
                      className="w-full px-4 py-2 bg-white border-2 border-[#2ECC71] rounded-xl font-black text-[#2ECC71] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Nút bấm điều hướng */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600">Hủy</button>
                <button 
                  type="submit" 
                  disabled={!!error || formData.foodTypeIds.length === 0}
                  className={`px-10 py-3 rounded-2xl font-bold transition-all shadow-lg ${
                    (error || formData.foodTypeIds.length === 0) 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-[#2ECC71] text-white hover:bg-[#27AE60] active:scale-95 shadow-green-100'
                  }`}
                >
                  Xác nhận thiết lập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
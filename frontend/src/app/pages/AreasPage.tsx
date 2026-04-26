// src/pages/AreasPage.tsx
// Đã kết nối API thật: getWarehouses, getFoodTypes, updateAreaSettings
// Quản lý khu vực: xem danh sách, đổi thực phẩm, đổi chế độ

import React, { useState, useEffect } from 'react';
import { Plus, Thermometer, Droplets, Apple, Warehouse, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getWarehouses, getFoodTypes, updateAreaSettings, AreaApi, WarehouseApi, FoodTypeApi } from '../api/apiService';

interface AreaWithWarehouse extends AreaApi {
  warehouseName: string;
  warehouseId: number;
}

export function AreasPage() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaWithWarehouse[]>([]);
  const [allFoodTypes, setAllFoodTypes] = useState<FoodTypeApi[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaWithWarehouse | null>(null);
  const [selectedFoodTypeId, setSelectedFoodTypeId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [whRes, foodRes] = await Promise.all([getWarehouses(), getFoodTypes()]);
        const flatAreas: AreaWithWarehouse[] = [];
        whRes.data.data.forEach(wh => {
          wh.areas.forEach(a => {
            flatAreas.push({ ...a, warehouseName: wh.warehouse_name, warehouseId: wh.id });
          });
        });
        setAreas(flatAreas);
        setAllFoodTypes(foodRes.data.data);
      } catch (err) {
        console.error('Lỗi load AreasPage:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleOpenFoodModal = (area: AreaWithWarehouse, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingArea(area);
    setSelectedFoodTypeId(area.current_food_type?.id ?? null);
    setShowFoodModal(true);
  };

  const handleSaveFoodType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea || !selectedFoodTypeId) return;
    setSaving(true);
    try {
      const res = await updateAreaSettings(editingArea.id, { current_food_type_id: selectedFoodTypeId });
      setAreas(prev => prev.map(a =>
        a.id === editingArea.id
          ? { ...a, current_food_type: res.data.data.current_food_type }
          : a
      ));
      setShowFoodModal(false);
    } catch (err) {
      alert('Cập nhật thực phẩm thất bại!');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMode = async (area: AreaWithWarehouse, e: React.MouseEvent) => {
    e.stopPropagation();
    const newMode = area.operating_mode === 'AUTO' ? 'MANUAL' : 'AUTO';
    try {
      const res = await updateAreaSettings(area.id, { operating_mode: newMode });
      setAreas(prev => prev.map(a =>
        a.id === area.id ? { ...a, operating_mode: res.data.data.operating_mode } : a
      ));
    } catch (err) {
      alert('Đổi chế độ thất bại!');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khu vực</h1>
          <p className="text-gray-500 font-medium">Tất cả khu vực trong các kho lạnh</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">Đang tải...</div>
      ) : areas.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-100 text-gray-400">
          Chưa có khu vực nào.
        </div>
      ) : (
        <div className="grid gap-4">
          {areas.map(area => {
            const food = area.current_food_type;
            const sensors = area.devices.filter(d => d.device_type?.toUpperCase() === 'SENSOR');
            const actuators = area.devices.filter(d => d.device_type?.toUpperCase() === 'ACTUATOR');
            const onlineActuators = actuators.filter(d => d.status?.toUpperCase() === 'ONLINE').length;

            const tempSensor = sensors.find(d =>
              d.device_name?.toLowerCase().includes('nhiệt') ||
              d.adafruit_feed_key?.toLowerCase().includes('temp')
            );
            const humiSensor = sensors.find(d =>
              d.device_name?.toLowerCase().includes('ẩm') ||
              d.adafruit_feed_key?.toLowerCase().includes('humi')
            );
            const currentTemp = tempSensor?.latest_value ?? null;
            const currentHumi = humiSensor?.latest_value ?? null;
            const tempWarn = food && currentTemp !== null && (currentTemp < food.min_temp || currentTemp > food.max_temp);
            const humiWarn = food && currentHumi !== null && (currentHumi < food.min_humi || currentHumi > food.max_humi);

            return (
              <div
                key={area.id}
                onClick={() => navigate(`/warehouses/${area.warehouseId}/areas/${area.id}`)}
                className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer hover:shadow-md transition-all ${
                  tempWarn || humiWarn ? 'border-orange-300' : 'border-gray-100 hover:border-[#2ECC71]/40'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{area.area_name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Warehouse className="w-3 h-3" />
                      {area.warehouseName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Badge cảnh báo */}
                    {(tempWarn || humiWarn) && (
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-600 font-medium">
                        Cảnh báo
                      </span>
                    )}
                    {/* Toggle chế độ */}
                    <button
                      onClick={(e) => handleToggleMode(area, e)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        area.operating_mode === 'AUTO'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {area.operating_mode === 'AUTO' ? '⚡ Tự động' : '🖐 Thủ công'}
                    </button>
                    {/* Đổi thực phẩm */}
                    <button
                      onClick={(e) => handleOpenFoodModal(area, e)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <Apple className="w-3 h-3" />
                      {food ? food.food_name : 'Chọn thực phẩm'}
                    </button>
                  </div>
                </div>

                {/* Sensor values */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${tempWarn ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Thermometer className={`w-4 h-4 ${tempWarn ? 'text-orange-500' : 'text-red-400'}`} />
                      <span className="text-xs text-gray-500">Nhiệt độ</span>
                    </div>
                    <p className={`text-xl font-bold ${tempWarn ? 'text-orange-600' : 'text-gray-900'}`}>
                      {currentTemp !== null ? `${currentTemp}°C` : '—'}
                    </p>
                    {food && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Ngưỡng: {food.min_temp}~{food.max_temp}°C
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${humiWarn ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Droplets className={`w-4 h-4 ${humiWarn ? 'text-orange-500' : 'text-blue-400'}`} />
                      <span className="text-xs text-gray-500">Độ ẩm</span>
                    </div>
                    <p className={`text-xl font-bold ${humiWarn ? 'text-orange-600' : 'text-gray-900'}`}>
                      {currentHumi !== null ? `${currentHumi}%` : '—'}
                    </p>
                    {food && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Ngưỡng: {food.min_humi}~{food.max_humi}%
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    <span>{onlineActuators}/{actuators.length} thiết bị bật</span>
                  </div>
                  <span>{sensors.length} cảm biến</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal chọn thực phẩm */}
      {showFoodModal && editingArea && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Đổi thực phẩm — {editingArea.area_name}
              </h2>
            </div>
            <form onSubmit={handleSaveFoodType} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {allFoodTypes.map(ft => (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => setSelectedFoodTypeId(ft.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedFoodTypeId === ft.id
                        ? 'border-[#2ECC71] bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-bold ${selectedFoodTypeId === ft.id ? 'text-[#2ECC71]' : 'text-gray-700'}`}>
                      {ft.food_name}
                    </p>
                    <div className="text-[11px] text-gray-400 mt-1 space-y-0.5">
                      <p className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-red-400" /> {ft.min_temp}~{ft.max_temp}°C
                      </p>
                      <p className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-400" /> {ft.min_humi}~{ft.max_humi}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowFoodModal(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedFoodTypeId || saving}
                  className="px-8 py-2.5 bg-[#2ECC71] text-white rounded-lg font-bold hover:bg-[#27AE60] disabled:opacity-50 transition-all"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

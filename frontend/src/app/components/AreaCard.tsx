// src/components/AreaCard.tsx
import { useNavigate } from "react-router";
import { Thermometer, Droplets, Cpu, Zap, Apple } from "lucide-react";
import { AreaApi } from "../api/apiService";

interface AreaCardProps {
  area: AreaApi;
  warehouseId: string;
}

export function AreaCard({ area, warehouseId }: AreaCardProps) {
  const navigate = useNavigate();

  // DB thực tế dùng device_type: 'TEMP', 'HUMI', 'ACTUATOR', 'DOOR_SENSOR', 'EMERGENCY_BTN', 'CO2_SENSOR'
  const actuators = area.devices.filter(
    (d) => d.device_type?.toUpperCase() === "ACTUATOR"
  );
  const sensors = area.devices.filter(
    (d) => d.device_type?.toUpperCase() !== "ACTUATOR"
  );

  const tempSensor = area.devices.find(
    (d) =>
      d.device_type?.toUpperCase() === "TEMP" ||
      d.adafruit_feed_key?.toLowerCase().includes("temp") ||
      d.adafruit_feed_key?.toLowerCase().includes("nhiet") ||
      d.device_name?.toLowerCase().includes("nhiệt")
  );
  const humiSensor = area.devices.find(
    (d) =>
      d.device_type?.toUpperCase() === "HUMI" ||
      d.adafruit_feed_key?.toLowerCase().includes("humi") ||
      d.adafruit_feed_key?.toLowerCase().includes("doam") ||
      d.device_name?.toLowerCase().includes("ẩm")
  );

  const currentTemp = tempSensor?.latest_value ?? null;
  const currentHumi = humiSensor?.latest_value ?? null;

  const food = area.current_food_type;
  const tempWarning = food && currentTemp !== null
    ? currentTemp < food.min_temp || currentTemp > food.max_temp : false;
  const humiWarning = food && currentHumi !== null
    ? currentHumi < food.min_humi || currentHumi > food.max_humi : false;
  const hasWarning = tempWarning || humiWarning;

  const activeActuators = actuators.filter(
    (d) => d.status?.toUpperCase() !== "OFFLINE" && d.status?.toUpperCase() !== "OFF"
  ).length;

  return (
    <div
      onClick={() => navigate(`/warehouses/${warehouseId}/areas/${area.id}`)}
      className={`bg-white rounded-xl p-6 shadow-sm border cursor-pointer hover:shadow-md transition-all ${
        hasWarning ? "border-orange-300" : "border-gray-100 hover:border-[#2ECC71]/40"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900">{area.area_name}</h3>
          {food && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Apple className="w-3 h-3" />
              {food.food_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasWarning && (
            <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-600 font-medium">
              Cảnh báo
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            area.operating_mode === "AUTO" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          }`}>
            {area.operating_mode === "AUTO" ? "Tự động" : "Thủ công"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`p-3 rounded-lg ${tempWarning ? "bg-orange-50 border border-orange-200" : "bg-gray-50"}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Thermometer className={`w-4 h-4 ${tempWarning ? "text-orange-500" : "text-red-400"}`} />
            <span className="text-xs text-gray-500">Nhiệt độ</span>
          </div>
          <p className={`text-xl font-bold ${tempWarning ? "text-orange-600" : "text-gray-900"}`}>
            {currentTemp !== null ? `${currentTemp}°C` : "—"}
          </p>
          {food && <p className="text-[10px] text-gray-400 mt-0.5">Ngưỡng: {food.min_temp}~{food.max_temp}°C</p>}
        </div>

        <div className={`p-3 rounded-lg ${humiWarning ? "bg-orange-50 border border-orange-200" : "bg-gray-50"}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Droplets className={`w-4 h-4 ${humiWarning ? "text-orange-500" : "text-blue-400"}`} />
            <span className="text-xs text-gray-500">Độ ẩm</span>
          </div>
          <p className={`text-xl font-bold ${humiWarning ? "text-orange-600" : "text-gray-900"}`}>
            {currentHumi !== null ? `${currentHumi}%` : "—"}
          </p>
          {food && <p className="text-[10px] text-gray-400 mt-0.5">Ngưỡng: {food.min_humi}~{food.max_humi}%</p>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Cpu className="w-4 h-4" />
          <span>{activeActuators}/{actuators.length} thiết bị hoạt động</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Zap className="w-4 h-4" />
          <span>{sensors.length} cảm biến</span>
        </div>
      </div>
    </div>
  );
}

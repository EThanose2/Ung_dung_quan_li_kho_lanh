// src/pages/DashboardPage.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Warehouse, MapPin, Cpu, Bell, Calendar } from "lucide-react";
import { getWarehouses, getSensorHistory, WarehouseApi, AreaApi, DeviceApi, SensorReadingApi } from "../api/apiService";
import { StatCard } from "../components/StatCard";
import { AreaCard } from "../components/AreaCard";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const toDateInputValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const deviceTypeNames: Record<string, string> = {
  sensor: "Cảm biến",
  cooling: "Máy lạnh",
  fan: "Quạt",
  light: "Đèn",
  actuator_other: "TB chấp hành khác",
  other: "Khác",
};

const deviceColors: Record<string, string> = {
  sensor: "#3b82f6",
  cooling: "#06b6d4",
  fan: "#14b8a6",
  light: "#f59e0b",
  actuator_other: "#a855f7",
  other: "#6b7280",
};

const normalizeDeviceGroup = (device: DeviceApi): string => {
  const type = (device.device_type || "").toUpperCase();
  if (["TEMP", "HUMI", "CO2_SENSOR", "BRIGHT", "DOOR_SENSOR", "EMERGENCY_BTN", "SENSOR"].includes(type)) {
    return "sensor";
  }
  if (type === "ACTUATOR") {
    const hint = `${device.device_name || ""} ${device.device_code || ""} ${device.adafruit_feed_key || ""}`.toLowerCase();
    if (hint.includes("fan") || hint.includes("quat")) return "fan";
    if (hint.includes("light") || hint.includes("den") || hint.includes("led")) return "light";
    if (hint.includes("cool") || hint.includes("lanh") || hint.includes("lạnh")) return "cooling";
    return "actuator_other";
  }
  return "other";
};

export function DashboardPage() {
  const today = toDateInputValue(new Date());
  const [warehouses, setWarehouses] = useState<WarehouseApi[]>([]);
  const [tempHistory, setTempHistory] = useState<SensorReadingApi[]>([]);
  const [humiHistory, setHumiHistory] = useState<SensorReadingApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [timeRangeError, setTimeRangeError] = useState<string>("");

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const whRes = await getWarehouses();
        setWarehouses(whRes.data.data);
      } catch (err) {
        console.error("Lỗi API Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const fetchHistoryByTimeRange = async () => {
      try {
        const effectiveStartDate = startDate || today;
        const effectiveEndDate = endDate || today;

        if (effectiveStartDate > effectiveEndDate) {
          setTimeRangeError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
          setTempHistory([]);
          setHumiHistory([]);
          return;
        }
        setTimeRangeError("");

        const startTime = `${effectiveStartDate} 00:00:00`;
        const endTime = `${effectiveEndDate} 23:59:59`;
        const limit = 1000;

        const [tempRes, humiRes] = await Promise.all([
          getSensorHistory({ type: "TEMP", start_time: startTime, end_time: endTime, limit }),
          getSensorHistory({ type: "HUMI", start_time: startTime, end_time: endTime, limit }),
        ]);
        setTempHistory(tempRes.data.data);
        setHumiHistory(humiRes.data.data);
      } catch (err) {
        console.error("Lỗi API lịch sử cảm biến:", err);
      }
    };

    fetchHistoryByTimeRange();
  }, [startDate, endDate]);

  const allAreas: AreaApi[] = warehouses.flatMap((w: WarehouseApi) => w.areas);
  const allDevices: DeviceApi[] = allAreas.flatMap((a: AreaApi) => a.devices);

  const filteredAreas: AreaApi[] = useMemo(() => {
    if (selectedWarehouseId === "all") return allAreas;
    return warehouses.find((w: WarehouseApi) => String(w.id) === selectedWarehouseId)?.areas ?? [];
  }, [selectedWarehouseId, warehouses]);
  const filteredDevices: DeviceApi[] = filteredAreas.flatMap((area: AreaApi) => area.devices);
  const filteredDeviceIdSet = useMemo(
    () => new Set(filteredDevices.map((device) => Number(device.id))),
    [filteredDevices]
  );
  const selectedAreaIdSet = useMemo(
    () => new Set(filteredAreas.map((area) => Number(area.id))),
    [filteredAreas]
  );

  const isReadingInSelectedWarehouse = (reading: SensorReadingApi) => {
    if (selectedWarehouseId === "all") return true;
    const deviceData = reading.device as DeviceApi & { area_id?: number; area?: { id?: number } };
    const deviceAreaId = Number(deviceData?.area_id ?? deviceData?.area?.id);
    const deviceId = Number(deviceData?.id);
    return (
      (Number.isFinite(deviceAreaId) && selectedAreaIdSet.has(deviceAreaId)) ||
      (Number.isFinite(deviceId) && filteredDeviceIdSet.has(deviceId))
    );
  };

  const filteredTempHistory = useMemo(
    () => tempHistory.filter(isReadingInSelectedWarehouse),
    [tempHistory, selectedWarehouseId, selectedAreaIdSet, filteredDeviceIdSet]
  );
  const filteredHumiHistory = useMemo(
    () => humiHistory.filter(isReadingInSelectedWarehouse),
    [humiHistory, selectedWarehouseId, selectedAreaIdSet, filteredDeviceIdSet]
  );

  const chartDevices: Array<DeviceApi & { group: string }> = filteredAreas
    .flatMap((area: AreaApi) => area.devices)
    .map((device) => ({ ...device, group: normalizeDeviceGroup(device) }));

  const onlineDevices = filteredDevices.filter(
    (d: DeviceApi) => d.status?.toUpperCase() === "ONLINE"
  ).length;
  const allOnlineDevices = allDevices.filter(
    (d: DeviceApi) => d.status?.toUpperCase() === "ONLINE"
  ).length;

  const deviceStatusData = [
    { name: "Online", value: onlineDevices, fill: "#2ECC71" },
    { name: "Offline", value: filteredDevices.length - onlineDevices, fill: "#E74C3C" },
  ];
  const deviceData = useMemo(() => {
    const types = Object.keys(deviceTypeNames);
    return types.map((t) => ({
      name: deviceTypeNames[t],
      value: chartDevices.filter((d) => d.group === t).length,
      fill: deviceColors[t],
    })).filter((item) => item.value > 0);
  }, [chartDevices]);

  const chartData = useMemo(() => {
    const map: Record<string, { time: string; timestamp: number; temperature?: number; humidity?: number }> = {};

    filteredTempHistory.forEach((r: SensorReadingApi) => {
      const date = new Date(r.recorded_at);
      const key = date.toISOString();
      if (!map[key]) {
        map[key] = {
          time:
            startDate !== endDate
              ? date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
              : date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          timestamp: date.getTime(),
        };
      }
      map[key].temperature = r.reading_value;
    });

    filteredHumiHistory.forEach((r: SensorReadingApi) => {
      const date = new Date(r.recorded_at);
      const key = date.toISOString();
      if (!map[key]) {
        map[key] = {
          time:
            startDate !== endDate
              ? date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
              : date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          timestamp: date.getTime(),
        };
      }
      map[key].humidity = r.reading_value;
    });

    return Object.values(map).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredTempHistory, filteredHumiHistory, startDate, endDate]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Đang tải dữ liệu...</div>
      </div>
    );
  }
  
  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan hệ thống</h1>
        <p className="text-gray-500">Giám sát kho lạnh & thiết bị realtime</p>
      </div>
      
      <div className="grid grid-cols-4 gap-6">
        <StatCard icon={Warehouse} label="Kho lạnh" value={warehouses.length} color="text-purple-600" bgColor="bg-purple-100" />
        <StatCard icon={MapPin} label="Khu vực" value={allAreas.length} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard icon={Cpu} label="Thiết bị online" value={`${allOnlineDevices}/${allDevices.length}`} color="text-green-600" bgColor="bg-green-100" />
        <StatCard
          icon={Bell}
          label="Chế độ tự động"
          value={allAreas.filter((a: AreaApi) => a.operating_mode === "AUTO").length}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium text-gray-600">Lọc theo kho:</span>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="all">Tất cả kho</option>
            {warehouses.map((w: WarehouseApi) => (
              <option key={w.id} value={String(w.id)}>{w.warehouse_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Khu vực ({filteredAreas.length})</h2>
        {filteredAreas.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100 text-gray-400">Không có khu vực nào</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {filteredAreas.map((area: AreaApi) => {
              const parentWarehouse = warehouses.find((w: WarehouseApi) =>
                w.areas.some((a: AreaApi) => a.id === area.id)
              );
              return (
                <AreaCard key={area.id} area={area} warehouseId={String(parentWarehouse?.id ?? "")} />
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Trạng thái thiết bị</h3>
          {filteredDevices.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">Chưa có dữ liệu thiết bị</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={deviceStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, value }: { name: string; value: number }) => value > 0 ? `${name}: ${value}` : ""}>
                  {deviceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Nhiệt độ & Độ ẩm</h3>
            <span className="text-xs text-gray-400">{chartData.length} điểm dữ liệu</span>
          </div>
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  max={toDateInputValue(new Date())}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                />
              </div>
            </div>
            {timeRangeError && <p className="text-xs text-red-600">{timeRangeError}</p>}
          </div>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">Chưa có dữ liệu cảm biến</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line dataKey="temperature" stroke="#f97316" strokeWidth={2} dot={false} name="Nhiệt độ (°C)" connectNulls />
                <Line dataKey="humidity" stroke="#06b6d4" strokeWidth={2} dot={false} name="Độ ẩm (%)" connectNulls />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Thiết bị</h3>
          {deviceData.every((d) => d.value === 0) ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              Chưa có dữ liệu thiết bị
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  nameKey="name"
                  label={({ value }: { value: number }) => (value > 0 ? value : "")}
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          {deviceData.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
              {deviceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Tóm tắt theo kho</h3>
          <div className="space-y-3">
            {warehouses.map((w: WarehouseApi) => {
              const wDevices: DeviceApi[] = w.areas.flatMap((a: AreaApi) => a.devices);
              const wOnline = wDevices.filter((d: DeviceApi) => d.status?.toUpperCase() === "ONLINE").length;
              const wAutoAreas = w.areas.filter((a: AreaApi) => a.operating_mode === "AUTO").length;
              return (
                <div key={w.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-800 text-sm break-words max-w-[50%]">{w.warehouse_name}</span>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{w.areas.length} khu vực</span>
                    <span className="text-green-600 font-medium">{wOnline}/{wDevices.length} online</span>
                    <span className="text-blue-600 font-medium">{wAutoAreas} auto</span>
                  </div>
                </div>
              );
            })}
            {warehouses.length === 0 && (
              <p className="text-gray-400 text-center py-4">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
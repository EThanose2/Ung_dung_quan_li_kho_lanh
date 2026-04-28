// src/pages/DashboardPage.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Warehouse, MapPin, Cpu, Bell } from "lucide-react";
import { getWarehouses, getSensorHistory, WarehouseApi, AreaApi, DeviceApi, SensorReadingApi } from "../api/apiService";
import { StatCard } from "../components/StatCard";
import { AreaCard } from "../components/AreaCard";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export function DashboardPage() {
  const [warehouses, setWarehouses] = useState<WarehouseApi[]>([]);
  const [tempHistory, setTempHistory] = useState<SensorReadingApi[]>([]);
  const [humiHistory, setHumiHistory] = useState<SensorReadingApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [whRes, tempRes, humiRes] = await Promise.all([
          getWarehouses(),
          getSensorHistory({ type: "TEMP", limit: 20 }),
          getSensorHistory({ type: "HUMI", limit: 20 }),
        ]);
        setWarehouses(whRes.data.data);
        setTempHistory(tempRes.data.data);
        setHumiHistory(humiRes.data.data);
      } catch (err) {
        console.error("Lỗi API Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const allAreas: AreaApi[] = warehouses.flatMap((w: WarehouseApi) => w.areas);
  const allDevices: DeviceApi[] = allAreas.flatMap((a: AreaApi) => a.devices);

  const filteredAreas: AreaApi[] = useMemo(() => {
    if (selectedWarehouseId === "all") return allAreas;
    return warehouses.find((w: WarehouseApi) => String(w.id) === selectedWarehouseId)?.areas ?? [];
  }, [selectedWarehouseId, warehouses]);

  const onlineDevices = allDevices.filter(
    (d: DeviceApi) => d.status?.toUpperCase() === "ONLINE"
  ).length;

  const deviceData = [
    { name: "Online", value: onlineDevices, fill: "#2ECC71" },
    { name: "Offline", value: allDevices.length - onlineDevices, fill: "#E74C3C" },
  ];

  const chartData = useMemo(() => {
    const map: Record<string, { time: string; temperature?: number; humidity?: number }> = {};

    tempHistory.forEach((r: SensorReadingApi) => {
      const key = new Date(r.recorded_at).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      if (!map[key]) map[key] = { time: key };
      map[key].temperature = r.reading_value;
    });

    humiHistory.forEach((r: SensorReadingApi) => {
      const key = new Date(r.recorded_at).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      if (!map[key]) map[key] = { time: key };
      map[key].humidity = r.reading_value;
    });

    return Object.values(map).sort((a, b) => a.time.localeCompare(b.time));
  }, [tempHistory, humiHistory]);

  const energyData = [
    { time: "T2", energy: 120 },
    { time: "T3", energy: 150 },
    { time: "T4", energy: 130 },
    { time: "T5", energy: 170 },
    { time: "T6", energy: 160 },
    { time: "T7", energy: 90 },
    { time: "CN", energy: 80 },
  ];

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
        <StatCard icon={Cpu} label="Thiết bị online" value={`${onlineDevices}/${allDevices.length}`} color="text-green-600" bgColor="bg-green-100" />
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
          {allDevices.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">Chưa có dữ liệu thiết bị</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, value }: { name: string; value: number }) => value > 0 ? `${name}: ${value}` : ""}>
                  {deviceData.map((entry, index) => (
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Điện năng tiêu thụ (kWh)</h3>
            <span className="text-xs text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">Dữ liệu mẫu</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={energyData}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="energy" fill="#a855f7" name="kWh" />
            </BarChart>
          </ResponsiveContainer>
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
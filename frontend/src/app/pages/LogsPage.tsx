// src/pages/LogsPage.tsx
// Đã fix: kết nối GET /api/action-logs thay vì dùng store

import React, { useState, useEffect } from "react";
import {
  Search, Filter, Settings, Power,
  Thermometer, Droplets, User as UserIcon, Calendar, ClipboardList,
} from "lucide-react";
import { getActionLogs, ActionLogApi } from "../api/apiService";

export function LogsPage() {
  const [logs, setLogs] = useState<ActionLogApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await getActionLogs();
        setLogs(res.data.data);
      } catch (err) {
        console.error("Lỗi lấy logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const content = `${log.action_type} ${log.action_value}`.toLowerCase();
    return content.includes(searchTerm.toLowerCase());
  });

  const getLogIcon = (action_type: string) => {
    const t = action_type.toUpperCase();
    if (t.includes("MANUAL_CONTROL")) return <Power className="w-4 h-4 text-orange-500" />;
    if (t.includes("MODE_CHANGE")) return <Settings className="w-4 h-4 text-blue-500" />;
    if (t.includes("TEMP")) return <Thermometer className="w-4 h-4 text-red-500" />;
    if (t.includes("HUMI")) return <Droplets className="w-4 h-4 text-blue-500" />;
    return <Settings className="w-4 h-4 text-gray-500" />;
  };

  const getActionLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case "MANUAL_CONTROL": return "Điều khiển thủ công";
      case "MODE_CHANGE": return "Đổi chế độ";
      case "AUTO_CONTROL": return "Tự động";
      case "SCHEDULE": return "Lịch trình";
      default: return type;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nhật ký hệ thống</h1>
          <p className="text-gray-500">Theo dõi toàn bộ hoạt động vận hành</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
          <Calendar className="w-4 h-4 text-[#2ECC71]" />
          <span className="text-sm font-medium text-gray-600">
            {new Date().toLocaleDateString("vi-VN")}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo loại hành động, nội dung..."
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#2ECC71] transition-all shadow-sm text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Danh sách Logs */}
      <div className="grid gap-4">
        {loading && (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400">
            Đang tải nhật ký...
          </div>
        )}

        {!loading && filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#2ECC71]/30 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Thời gian */}
                <div className="w-24 border-r border-gray-100 pr-4">
                  <p className="font-bold text-gray-900 text-base">
                    {new Date(log.created_at).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {new Date(log.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>

                {/* Nội dung */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {getLogIcon(log.action_type)}
                      {getActionLabel(log.action_type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{log.action_value}</p>
                </div>
              </div>

              {/* Nguồn kích hoạt */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl group-hover:bg-green-50 transition-colors">
                <UserIcon className="w-4 h-4 text-[#2ECC71]" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">
                  {log.action_type === "MANUAL_CONTROL"
                    ? "MANUAL"
                    : log.action_type === "AUTO_CONTROL"
                    ? "AUTO"
                    : "SYSTEM"}
                </span>
              </div>
            </div>
          </div>
        ))}

        {!loading && filteredLogs.length === 0 && (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
            <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">
              Không có dữ liệu nhật ký
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

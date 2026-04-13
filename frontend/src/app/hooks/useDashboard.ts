import { useEffect, useState } from "react";
import { getWarehouses } from "../api/dashboardApi";
import { store } from "../store";
import type { Area, Warehouse, Device } from "../types";

/* ================= NORMALIZERS ================= */

function normalizeDeviceType(deviceType: string): Device["type"] {
  switch (deviceType) {
    case "TEMP":
      return "temperature";
    case "HUMI":
      return "humidity";
    case "COOLING":
      return "cooling";
    case "FAN":
      return "fan";
    case "LIGHT":
    case "ACTUATOR":
      return "light";
    default:
      return "temperature";
  }
}

function normalizeDeviceCategory(deviceType: string): Device["category"] {
  const sensors = ["TEMP", "HUMI", "BRIGHT", "CO2_SENSOR", "DOOR_SENSOR"];
  return sensors.includes(deviceType) ? "sensor" : "control";
}

function normalizeDeviceStatus(status: string): Device["status"] {
  const s = (status || "").toUpperCase();

  if (s === "ONLINE" || s === "ON") return "online";
  if (s === "OFFLINE" || s === "OFF") return "offline";
  if (s.includes("ERROR")) return "error";

  return "offline";
}

function getLatest(devices: any[], type: string) {
  return devices.find((d) => d.device_type === type)?.latest_value ?? 0;
}
/* ================= TYPES HELPERS ================= */

type WarehouseApi = {
  id: number | string;
  warehouse_name: string;
  areas: any[];
};

type ApiResponse = {
  data?: WarehouseApi[];
};

/* ================= HOOK ================= */

export function useDashboard() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);

      try {
        // ✅ FIX: axios trả về { data: { status, data } }
        const res = await getWarehouses();
        const raw: WarehouseApi[] = res?.data?.data ?? [];

        /* ================= FLATTEN AREAS ================= */
        const mappedAreas: Area[] = raw.flatMap((w) =>
          (w.areas ?? []).map((a) => ({
            id: String(a.id),
            name: a.area_name,
            warehouseId: String(w.id),

            type: "vegetable",
            operatorId: undefined,
            foodTypeIds: [],

            currentTemp: getLatest(a.devices ?? [], "TEMP"),
            currentHumidity: getLatest(a.devices ?? [], "HUMI"),

            minTemp: a.current_food_type?.min_temp ?? 0,
            maxTemp: a.current_food_type?.max_temp ?? 100,
            minHumidity: a.current_food_type?.min_humi ?? 0,
            maxHumidity: a.current_food_type?.max_humi ?? 100,

            status: "normal",
            deviceCount: a.devices?.length ?? 0,
          }))
        );

        /* ================= FLATTEN DEVICES ================= */
        const mappedDevices: Device[] = raw.flatMap((w) =>
          (w.areas ?? []).flatMap((a) =>
            (a.devices ?? []).map((d: any) => ({
              id: String(d.id),
              name: d.device_name,

              type: normalizeDeviceType(d.device_type),
              category: normalizeDeviceCategory(d.device_type),

              areaId: String(a.id),

              status: normalizeDeviceStatus(d.status),
              isActive: !String(d.status || "").toUpperCase().includes("OFF"),

              controlMode: "automatic",
              lastUpdate: new Date(),
            }))
          )
        );

        /* ================= BUILD WAREHOUSES ================= */
        const mappedWarehouses: Warehouse[] = raw.map((w) => {
          const id = String(w.id);

          const wAreas = mappedAreas.filter((a) => a.warehouseId === id);
          const wDevices = mappedDevices.filter((d) =>
            wAreas.some((a) => a.id === d.areaId)
          );

          return {
            id,
            name: w.warehouse_name || `Kho ${id}`,
            location: "",

            areaCount: wAreas.length,
            deviceCount: wDevices.length,

            activeAlerts: 0,
            status: "normal",
            averageTemp: 0,
            averageHumidity: 0,
          };
        });

        if (!mounted) return;

        setWarehouses(mappedWarehouses);
        setAreas(mappedAreas);
        setDevices(mappedDevices);
      } catch (err) {
        console.error("Dashboard API failed, fallback to store:", err);

        if (!mounted) return;

        setWarehouses(store.getWarehouses());
        setAreas(store.getAreas());
        setDevices(store.getDevices());
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  return { warehouses, areas, devices, loading };
}
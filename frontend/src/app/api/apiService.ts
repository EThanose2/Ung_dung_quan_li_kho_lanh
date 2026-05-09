// src/api/apiService.ts
import axiosClient from "./axiosClient";

// ================================================================
// TYPES
// ================================================================

export interface UserApi {
  id: number;
  username: string;
  full_name: string;
  role: string; // 'ADMIN' | 'OPERATOR'
}

export interface DeviceApi {
  id: number;
  device_name: string;
  device_code: string;        // ✅ Thêm field này
  adafruit_feed_key: string;
  device_type: string;
  status: string;
  latest_value?: number;
}

export interface FoodTypeApi {
  id: number;
  food_name: string;
  min_temp: number;
  max_temp: number;
  min_humi: number;
  max_humi: number;
}

export interface AreaApi {
  id: number;
  area_name: string;
  operating_mode: string;
  auto_door_timeout_sec: number;
  manual_override_mins: number;
  current_food_type: FoodTypeApi | null;
  food_types: FoodTypeApi[];
  devices: DeviceApi[];
  operators: UserApi[];
}

export interface WarehouseApi {
  id: number;
  warehouse_name: string;
  areas: AreaApi[];
}

export interface SensorReadingApi {
  id: number;
  sensor_type: string;
  reading_value: number;
  recorded_at: string;
  device: DeviceApi;
}

// export interface ActionLogApi {
//   id: number;
//   action_type: string;
//   action_value: string;
//   created_at: string;
// }

// ================================================================
// AUTH
// ================================================================
export function login(body: { username: string; password: string }) {
  return axiosClient.post<{ status: string; data: UserApi }>("/auth/login", body);
}

export function logout() {
  return axiosClient.post("/auth/logout");
}

// ================================================================
// USERS
// ================================================================
export function getUsers() {
  return axiosClient.get<{ status: string; data: UserApi[] }>("/users");
}

export function createUser(body: Partial<UserApi> & { password: string }) {
  return axiosClient.post<{ status: string; data: UserApi }>("/users", body);
}

export function updateUser(id: number, body: Partial<UserApi> & { password?: string }) {
  return axiosClient.put<{ status: string }>(`/users/${id}`, body);
}

export function deleteUser(id: number) {
  return axiosClient.delete<{ status: string }>(`/users/${id}`);
}

export function updateProfile(id: number, body: { full_name?: string; password?: string }) {
  return axiosClient.put<{ status: string; message: string }>(`/users/profile/${id}`, body);
}

// ================================================================
// WAREHOUSES
// ================================================================
// Hàm helper đọc user từ localStorage
export function getCurrentUser(): UserApi | null {
  try {
    return JSON.parse(localStorage.getItem('current_user') ?? 'null');
  } catch { return null; }
}

// Sửa getWarehouses — tự động gửi user_id nếu là OPERATOR
export const getWarehouses = () => {
  const user = getCurrentUser();
  const params = user?.role?.toUpperCase() === 'OPERATOR' 
    ? { user_id: user.id } 
    : {};
  return axiosClient.get<{ status: string; data: WarehouseApi[] }>('/warehouses', { params });
};
export const getWarehouseById = (id: number) =>
  axiosClient.get<{ status: string; data: WarehouseApi }>(`/warehouses/${id}`);
 
export const createWarehouse = (body: { warehouse_name: string }) =>
  axiosClient.post<{ status: string; data: WarehouseApi }>("/warehouses", body);
 
export const updateWarehouse = (id: number, body: { warehouse_name: string }) =>
  axiosClient.put<{ status: string; data: WarehouseApi }>(`/warehouses/${id}`, body);
 
export const deleteWarehouse = (id: number) =>
  axiosClient.delete<{ status: string; message: string }>(`/warehouses/${id}`);



// ================================================================
// AREAS
// ================================================================
export function getAreas() {
  return axiosClient.get<{ status: string; data: AreaApi[] }>("/areas");
}

export function createArea(body: { area_name: string; warehouse_id: number; current_food_type_id: number; }) {
  return axiosClient.post<{ status: string; data: AreaApi }>("/areas", body);
}

export function deleteArea(id: number) {
  return axiosClient.delete<{ status: string }>(`/areas/${id}`);
}

export function updateAreaSettings(
  areaId: number,
  body: {
    food_type_ids?: number[];
    current_food_type_id?: number;
    auto_door_timeout_sec?: number;
    manual_override_mins?: number;
    operating_mode?: "AUTO" | "MANUAL";
    operator_id?: number | null;
  }
) {
  return axiosClient.put<{ status: string; message: string; data: AreaApi }>(
    `/areas/${areaId}/settings`,
    body
  );
}

export function assignOperator(areaId: number, user_id: number) {
  return axiosClient.post<{ status: string; message: string }>(
    `/areas/${areaId}/assign-operator`,
    { user_id }
  );
}

// ================================================================
// FOOD TYPES
// ================================================================
export function getFoodTypes() {
  return axiosClient.get<{ status: string; data: FoodTypeApi[] }>("/food-types");
}

export function createFoodType(body: Partial<FoodTypeApi>) {
  return axiosClient.post<{ status: string; data: FoodTypeApi }>("/food-types", body);
}

export function updateFoodType(id: number, body: Partial<FoodTypeApi>) {
  return axiosClient.put<{ status: string }>(`/food-types/${id}`, body);
}

export function deleteFoodType(id: number) {
  return axiosClient.delete<{ status: string }>(`/food-types/${id}`);
}

// ================================================================
// SENSORS
// ================================================================
export function getLatestSensors(area_id?: number) {
  return axiosClient.get<{ status: string; data: SensorReadingApi[] }>(
    "/sensors/latest",
    { params: area_id ? { area_id } : {} }
  );
}

export function getSensorHistory(params: {
  type: "TEMP" | "HUMI" | "LIGHT";
  area_id?: number;
  start_time?: string;
  end_time?: string;
  limit?: number;
}) {
  return axiosClient.get<{ status: string; data: SensorReadingApi[] }>(
    "/sensors/history",
    { params }
  );
}

// ================================================================
// DEVICES
// ================================================================
export function controlDevice(body: { device_id: string; action: string }) {
  return axiosClient.post<{ status: string; message: string }>(
    "/devices/control",
    body
  );
}

// ================================================================
// LOGS
// ================================================================
export function getActionLogs() {
  return axiosClient.get<{ status: string; data: ActionLogApi[] }>("/action-logs");
}

export function getAlertLogs() {
  return axiosClient.get<{ status: string; data: ActionLogApi[] }>("/alert-logs");
}

// ================================================================
// DEVICES (CRUD)
// ================================================================
export function getDevices() {
  return axiosClient.get<{ status: string; data: DeviceApi[] }>("/devices");
}

export function createDevice(body: Partial<DeviceApi> & { area_id?: number; area?: { id: number } }) {
  return axiosClient.post<{ status: string; data: DeviceApi }>("/devices", body);
}

export function updateDevice(id: number, body: Partial<DeviceApi>) {
  return axiosClient.put<{ status: string }>(`/devices/${id}`, body);
}

export function deleteDevice(id: number) {
  return axiosClient.delete<{ status: string }>(`/devices/${id}`);
}

// ================================================================
// SCHEDULES
// ================================================================
export interface ScheduleApi {
  id: number;
  action: string;       // 'ON' | 'OFF' | 'MODE_1' | 'MODE_2' | 'MODE_3'
  start_time: string;   // 'HH:mm'
  end_time?: string;
  is_active: boolean;
  device: DeviceApi;
}

export function getSchedules() {
  return axiosClient.get<{ status: string; data: ScheduleApi[] }>("/devices/schedules");
}

export function createSchedule(body: {
  action: string;
  start_time: string;
  end_time?: string;
  is_active?: boolean;
  device: { id: number };
}) {
  return axiosClient.post<{ status: string; data: ScheduleApi }>("/devices/schedules", body);
}

export function updateSchedule(id: number, body: Partial<{ action: string; start_time: string; end_time: string; is_active: boolean }>) {
  return axiosClient.put<{ status: string; data: ScheduleApi }>(`/devices/schedules/${id}`, body);
}
 
export function deleteSchedule(id: number) {
  return axiosClient.delete<{ status: string }>(`/devices/schedules/${id}`);
}

// ================================================================
// REPORTS
// ================================================================

export function generateExportCsv(params: {
  area_id?: number;
  start_time?: string;
  end_time?: string;
}) {
  return axiosClient.get<string>("sensors/export", {
    params,
    responseType: "text", // nhận CSV dạng string
  });
}

export interface ActionLogApi {
  id: number;
  action_type: string;
  action_value: string;
  created_at: string;
  is_resolved: boolean;
  is_escalated: boolean;
  resolved_at?: string; 
  resolve_note?: string; 
  user?: {
    id: number;
    full_name: string;
    username: string;
  };
}

export const resolveAlert = (logId: number, note: string, user_id: number) => {
  return axiosClient.put<{ status: string; message: string }>(
    `/action-logs/${logId}/resolve`,
    { note, user_id }
  );
};

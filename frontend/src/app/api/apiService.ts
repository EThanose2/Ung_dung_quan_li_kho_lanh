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
  devices: DeviceApi[];
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

export interface ActionLogApi {
  id: number;
  action_type: string;
  action_value: string;
  created_at: string;
}

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
export function getWarehouses() {
  return axiosClient.get<{ status: string; data: WarehouseApi[] }>("/warehouses");
}

export function createWarehouse(body: { warehouse_name: string }) {
  return axiosClient.post<{ status: string; data: WarehouseApi }>("/facilities/warehouses", body);
}

// ================================================================
// AREAS
// ================================================================
export function getAreas() {
  return axiosClient.get<{ status: string; data: AreaApi[] }>("/areas");
}

export function createArea(body: { area_name: string; warehouse_id: number }) {
  return axiosClient.post<{ status: string; data: AreaApi }>("/areas", body);
}

export function deleteArea(id: number) {
  return axiosClient.delete<{ status: string }>(`/areas/${id}`);
}

export function updateAreaSettings(
  areaId: number,
  body: {
    current_food_type_id?: number;
    auto_door_timeout_sec?: number;
    manual_override_mins?: number;
    operating_mode?: "AUTO" | "MANUAL";
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

// ================================================================
// DEVICES (CRUD)
// ================================================================
export function getDevices() {
  return axiosClient.get<{ status: string; data: DeviceApi[] }>("/devices");
}

export function createDevice(body: Partial<DeviceApi> & { area_id?: number }) {
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

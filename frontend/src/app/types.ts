export type UserRole = 'Admin' | 'Operator';

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface FoodType {
  id: string;
  name: string;
  minTemp: number;
  maxTemp: number;
  minHumidity: number;
  maxHumidity: number;
  description: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  areaCount: number;
  deviceCount: number;
  activeAlerts: number;
  status: 'normal' | 'warning' | 'alert';
  averageTemp: number;
  averageHumidity: number;
}

export interface Area {
  id: string;
  name: string;
  warehouseId: string;
  type: 'vegetable' | 'meat';
  operatorId?: string;
  foodTypeIds: string[];
  currentTemp: number;
  currentHumidity: number;
  minTemp: number;
  maxTemp: number;
  minHumidity: number;
  maxHumidity: number;
  status: 'normal' | 'warning' | 'alert';
  deviceCount: number;
}

export type DeviceType = 'temperature' | 'humidity' | 'cooling' | 'fan' | 'light';
export type DeviceCategory = 'sensor' | 'control';
export type ControlMode = 'manual' | 'automatic' | 'scheduled';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  category: DeviceCategory;
  areaId: string;
  status: 'online' | 'offline' | 'error';
  isActive: boolean;
  controlMode: ControlMode;
  value?: number;
  lastUpdate: Date;
}

export interface DeviceLog {
  id: string;
  deviceId: string;
  timestamp: Date;
  action: string;
  value?: number;
  user?: string;
}

export interface Alert {
  id: string;
  areaId: string;
  areaName: string;
  type: 'temperature' | 'humidity';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface Schedule {
  id: string;
  deviceId: string;
  deviceName: string;
  action: 'on' | 'off';
  startTime: string;
  endTime: string;
  days: number[];
  enabled: boolean;
}

export interface EnvironmentData {
  timestamp: Date;
  temperature: number;
  humidity: number;
}

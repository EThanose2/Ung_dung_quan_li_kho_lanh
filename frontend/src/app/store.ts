import { User, Area, Device, Alert, Schedule, Warehouse, FoodType, DeviceLog } from './types';

class AppStore {
  private currentUser: User | null = null;
  private users: User[] = [
    {
      id: '1',
      username: 'admin',
      password: 'admin123',
      fullName: 'Quản trị viên',
      email: 'admin@freshguard.com',
      role: 'Admin',
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      username: 'operator1',
      password: 'operator123',
      fullName: 'Nguyễn Văn A',
      email: 'operator1@freshguard.com',
      role: 'Operator',
      createdAt: new Date('2024-01-15')
    }
  ];

  private foodTypes: FoodType[] = [
    { id: 'ft1', name: 'Hải sản đông lạnh', minTemp: -25, maxTemp: -18, minHumidity: 85, maxHumidity: 95, description: 'Rau xà lách, cải bó xôi' },
    { id: 'ft2', name: 'Thịt bò tươi', minTemp: 0, maxTemp: 7, minHumidity: 80, maxHumidity: 90, description: 'Cà chua, dưa chuột, ớt' },
    { id: 'ft3', name: 'Rau củ quả', minTemp: 2, maxTemp: 5, minHumidity: 90, maxHumidity: 100, description: 'Khoai tây, cà rốt, củ cải' },
    ];

  private warehouses: Warehouse[] = [
    {
      id: 'w1',
      name: 'Kho lạnh trung tâm - Quận 1',
      location: 'Số 123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      areaCount: 2,
      deviceCount: 14,
      activeAlerts: 0,
      status: 'normal',
      averageTemp: 3,
      averageHumidity: 80
    },
    {
      id: 'w2',
      name: 'Kho lạnh chi nhánh - Thủ Đức',
      location: 'Khu công nghiệp Hiệp Phước, TP. Thủ Đức',
      areaCount: 0,
      deviceCount: 0,
      activeAlerts: 0,
      status: 'normal',
      averageTemp: 0,
      averageHumidity: 0
    }
  ];

  private areas: Area[] = [
    {
      id: '1',
      name: 'Khu đồ Tươi',
      warehouseId: 'w2',
      type: 'vegetable',
      operatorId: '2',
      foodTypeIds: ['ft2', 'ft3'],
      currentTemp: 8,
      currentHumidity: 85,
      minTemp: 5,
      maxTemp: 10,
      minHumidity: 80,
      maxHumidity: 90,
      status: 'normal',
      deviceCount: 6
    },
    {
      id: '2',
      name: 'Khu đồ Đông',
      warehouseId: 'w2',
      type: 'meat',
      operatorId: '2',
      foodTypeIds: ['ft4', 'ft5'],
      currentTemp: -2,
      currentHumidity: 75,
      minTemp: -5,
      maxTemp: 0,
      minHumidity: 70,
      maxHumidity: 80,
      status: 'normal',
      deviceCount: 8
    }
  ];

  private devices: Device[] = [
    { id: 'd1', name: 'Cảm biến nhiệt độ #1', type: 'temperature', category: 'sensor', areaId: '1', status: 'online', isActive: true, controlMode: 'automatic', value: 8, lastUpdate: new Date() },
    { id: 'd2', name: 'Cảm biến độ ẩm #1', type: 'humidity', category: 'sensor', areaId: '1', status: 'online', isActive: true, controlMode: 'automatic', value: 85, lastUpdate: new Date() },
    { id: 'd3', name: 'Hệ thống làm lạnh #1', type: 'cooling', category: 'control', areaId: '1', status: 'online', isActive: true, controlMode: 'automatic', lastUpdate: new Date() },
    { id: 'd4', name: 'Quạt thông gió #1', type: 'fan', category: 'control', areaId: '1', status: 'online', isActive: false, controlMode: 'manual', lastUpdate: new Date() },
    { id: 'd5', name: 'Đèn chiếu sáng #1', type: 'light', category: 'control', areaId: '1', status: 'online', isActive: true, controlMode: 'scheduled', lastUpdate: new Date() },
    { id: 'd6', name: 'Cảm biến nhiệt độ #2', type: 'temperature', category: 'sensor', areaId: '1', status: 'online', isActive: true, controlMode: 'automatic', value: 8.2, lastUpdate: new Date() },
    { id: 'd7', name: 'Cảm biến nhiệt độ #3', type: 'temperature', category: 'sensor', areaId: '2', status: 'online', isActive: true, controlMode: 'automatic', value: -2, lastUpdate: new Date() },
    { id: 'd8', name: 'Cảm biến độ ẩm #2', type: 'humidity', category: 'sensor', areaId: '2', status: 'online', isActive: true, controlMode: 'automatic', value: 75, lastUpdate: new Date() },
    { id: 'd9', name: 'Hệ thống làm lạnh #2', type: 'cooling', category: 'control', areaId: '2', status: 'online', isActive: true, controlMode: 'automatic', lastUpdate: new Date() },
    { id: 'd10', name: 'Quạt thông gió #2', type: 'fan', category: 'control', areaId: '2', status: 'online', isActive: true, controlMode: 'automatic', lastUpdate: new Date() },
    { id: 'd11', name: 'Đèn chiếu sáng #2', type: 'light', category: 'control', areaId: '2', status: 'online', isActive: false, controlMode: 'scheduled', lastUpdate: new Date() },
    { id: 'd12', name: 'Cảm biến nhiệt độ #4', type: 'temperature', category: 'sensor', areaId: '2', status: 'online', isActive: true, controlMode: 'automatic', value: -1.8, lastUpdate: new Date() },
    { id: 'd13', name: 'Hệ thống làm lạnh #3', type: 'cooling', category: 'control', areaId: '2', status: 'online', isActive: true, controlMode: 'automatic', lastUpdate: new Date() },
    { id: 'd14', name: 'Quạt thông gió #3', type: 'fan', category: 'control', areaId: '2', status: 'error', isActive: false, controlMode: 'manual', lastUpdate: new Date() },
  ];

  private deviceLogs: DeviceLog[] = [
    { id: 'log1', deviceId: 'd3', timestamp: new Date(Date.now() - 3600000), action: 'Bật thiết bị', user: 'System' },
    { id: 'log2', deviceId: 'd3', timestamp: new Date(Date.now() - 7200000), action: 'Tắt thiết bị', user: 'Nguyễn Văn A' },
    { id: 'log3', deviceId: 'd1', timestamp: new Date(Date.now() - 1800000), action: 'Đo nhiệt độ', value: 8.0, user: 'System' },
  ];

  private alerts: Alert[] = [];

  private schedules: Schedule[] = [
    {
      id: 's1',
      deviceId: 'd5',
      deviceName: 'Đèn chiếu sáng #1',
      action: 'on',
      startTime: '06:00',
      endTime: '18:00',
      days: [1, 2, 3, 4, 5],
      enabled: true
    },
    {
      id: 's2',
      deviceId: 'd11',
      deviceName: 'Đèn chiếu sáng #2',
      action: 'on',
      startTime: '06:00',
      endTime: '18:00',
      days: [1, 2, 3, 4, 5],
      enabled: true
    }
  ];

  login(username: string, password: string): User | null {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) {
      this.currentUser = user;
      return user;
    }
    return null;
  }

  logout() {
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getUsers(): User[] {
    return [...this.users];
  }

  addUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `u${Date.now()}`,
      createdAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      return this.users[index];
    }
    return null;
  }

  deleteUser(id: string): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }

  getAreas(): Area[] {
    return [...this.areas];
  }

  getArea(id: string): Area | null {
    return this.areas.find(a => a.id === id) || null;
  }

  addArea(area: Omit<Area, 'id'>): Area {
    const newArea: Area = {
      ...area,
      id: `a${Date.now()}`
    };
    this.areas.push(newArea);
    return newArea;
  }

  updateArea(id: string, updates: Partial<Area>): Area | null {
    const index = this.areas.findIndex(a => a.id === id);
    if (index !== -1) {
      this.areas[index] = { ...this.areas[index], ...updates };
      return this.areas[index];
    }
    return null;
  }

  deleteArea(id: string): boolean {
    const index = this.areas.findIndex(a => a.id === id);
    if (index !== -1) {
      this.areas.splice(index, 1);
      return true;
    }
    return false;
  }

  getDevices(): Device[] {
    return [...this.devices];
  }

  getDevicesByArea(areaId: string): Device[] {
    return this.devices.filter(d => d.areaId === areaId);
  }

  getDevice(id: string): Device | null {
    return this.devices.find(d => d.id === id) || null;
  }

  addDevice(device: Omit<Device, 'id'>): Device {
    const newDevice: Device = {
      ...device,
      id: `d${Date.now()}`
    };
    this.devices.push(newDevice);
    return newDevice;
  }

  updateDevice(id: string, updates: Partial<Device>): Device | null {
    const index = this.devices.findIndex(d => d.id === id);
    if (index !== -1) {
      this.devices[index] = { ...this.devices[index], ...updates };
      return this.devices[index];
    }
    return null;
  }

  deleteDevice(id: string): boolean {
    const index = this.devices.findIndex(d => d.id === id);
    if (index !== -1) {
      this.devices.splice(index, 1);
      return true;
    }
    return false;
  }
  getAllDeviceLogs(): DeviceLog[] {
    return [...this.deviceLogs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getAlerts(): Alert[] {
    return [...this.alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  addAlert(alert: Omit<Alert, 'id'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: `al${Date.now()}`
    };
    this.alerts.push(newAlert);
    return newAlert;
  }

  acknowledgeAlert(id: string): boolean {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  getSchedules(): Schedule[] {
    return [...this.schedules];
  }

  addSchedule(schedule: Omit<Schedule, 'id'>): Schedule {
    const newSchedule: Schedule = {
      ...schedule,
      id: `s${Date.now()}`
    };
    this.schedules.push(newSchedule);
    return newSchedule;
  }

  updateSchedule(id: string, updates: Partial<Schedule>): Schedule | null {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index !== -1) {
      this.schedules[index] = { ...this.schedules[index], ...updates };
      return this.schedules[index];
    }
    return null;
  }

  deleteSchedule(id: string): boolean {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index !== -1) {
      this.schedules.splice(index, 1);
      return true;
    }
    return false;
  }

  getWarehouses(): Warehouse[] {
    return [...this.warehouses];
  }

  getWarehouse(id: string): Warehouse | null {
    return this.warehouses.find(w => w.id === id) || null;
  }

  addWarehouse(warehouse: Omit<Warehouse, 'id'>): Warehouse {
    const newWarehouse: Warehouse = {
      ...warehouse,
      id: `w${Date.now()}`
    };
    this.warehouses.push(newWarehouse);
    return newWarehouse;
  }

  updateWarehouse(id: string, updates: Partial<Warehouse>): Warehouse | null {
    const index = this.warehouses.findIndex(w => w.id === id);
    if (index !== -1) {
      this.warehouses[index] = { ...this.warehouses[index], ...updates };
      return this.warehouses[index];
    }
    return null;
  }

  deleteWarehouse(id: string): boolean {
    const index = this.warehouses.findIndex(w => w.id === id);
    if (index !== -1) {
      this.warehouses.splice(index, 1);
      return true;
    }
    return false;
  }

  getAreasByWarehouse(warehouseId: string): Area[] {
    return this.areas.filter(a => a.warehouseId === warehouseId);
  }

  getFoodTypes(): FoodType[] {
    return [...this.foodTypes];
  }

  getFoodType(id: string): FoodType | null {
    return this.foodTypes.find(ft => ft.id === id) || null;
  }

  getDeviceLogs(deviceId: string): DeviceLog[] {
    return this.deviceLogs.filter(log => log.deviceId === deviceId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  addDeviceLog(log: Omit<DeviceLog, 'id'>): DeviceLog {
    const newLog: DeviceLog = {
      ...log,
      id: `log${Date.now()}`
    };
    this.deviceLogs.push(newLog);
    return newLog;
  }
}

export const store = new AppStore();
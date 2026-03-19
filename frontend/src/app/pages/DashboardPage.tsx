import { Warehouse, MapPin, Cpu, Bell, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatCard } from '../components/StatCard';
import { AreaCard } from '../components/AreaCard';
import { store } from '../store';

export function DashboardPage() {
  const warehouses = store.getWarehouses();
  const areas = store.getAreas();
  const devices = store.getDevices();
  const alerts = store.getAlerts().filter(a => !a.acknowledged);

  const activeDevices = devices.filter(d => d.status === 'online').length;

  const temperatureData = [
    { time: '00:00', rauCu: 8, thitCa: -2 },
    { time: '04:00', rauCu: 8.5, thitCa: -1.5 },
    { time: '08:00', rauCu: 7.5, thitCa: -2.5 },
    { time: '12:00', rauCu: 8, thitCa: -2 },
    { time: '16:00', rauCu: 8.2, thitCa: -1.8 },
    { time: '20:00', rauCu: 7.8, thitCa: -2.2 },
  ];

  const humidityData = [
    { time: '00:00', rauCu: 85, thitCa: 75 },
    { time: '04:00', rauCu: 83, thitCa: 76 },
    { time: '08:00', rauCu: 86, thitCa: 74 },
    { time: '12:00', rauCu: 85, thitCa: 75 },
    { time: '16:00', rauCu: 84, thitCa: 76 },
    { time: '20:00', rauCu: 86, thitCa: 74 },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tổng quan hệ thống</h1>
        <p className="text-gray-500">Giám sát và quản lý khu vực lưu trữ thực phẩm tươi sống</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <StatCard
          icon={Warehouse}
          label="Kho lạnh"
          value={warehouses.length}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          icon={MapPin}
          label="Khu vực"
          value={areas.length}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          icon={Cpu}
          label="Thiết bị hoạt động"
          value={`${activeDevices}/${devices.length}`}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          icon={Bell}
          label="Cảnh báo"
          value={alerts.length}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Khu vực lưu trữ</h2>
        <div className="grid grid-cols-2 gap-6">
          {areas.map(area => (
            <AreaCard key={area.id} area={area} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Biểu đồ nhiệt độ (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={temperatureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />
              <Line key="temp-raucu" type="monotone" dataKey="rauCu" stroke="#2ECC71" name="Rau củ" strokeWidth={2} />
              <Line key="temp-thitca" type="monotone" dataKey="thitCa" stroke="#3498DB" name="Thịt cá" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Biểu đồ độ ẩm (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={humidityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Legend />
              <Line key="humid-raucu" type="monotone" dataKey="rauCu" stroke="#2ECC71" name="Rau củ" strokeWidth={2} />
              <Line key="humid-thitca" type="monotone" dataKey="thitCa" stroke="#3498DB" name="Thịt cá" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

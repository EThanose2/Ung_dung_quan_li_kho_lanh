import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, X, RefreshCw } from 'lucide-react';
import { 
  getWarehouses, createDevice, deleteDevice, updateDevice, 
  WarehouseApi, AreaApi, DeviceApi 
} from '../api/apiService';

export function DevicesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseApi[]>([]);
  const [devices, setDevices] = useState<DeviceApi[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form state
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceApi | null>(null);
  const [formData, setFormData] = useState({
    device_name: '',
    device_code: '',
    adafruit_feed_key: '',
    device_type: 'SENSOR',
    areaId: ''
  });

  // Load data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getWarehouses();
      const whs = res.data.data;
      setWarehouses(whs);
      
      // Lấy danh sách flat tất cả thiết bị
      const allDevices = whs.flatMap(w => w.areas.flatMap(a => a.devices));
      setDevices(allDevices);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ FIX: TypeORM cần relation object { area: { id } }, không phải area_id flat
    const basePayload = {
      device_name: formData.device_name,
      device_code: formData.device_code,
      adafruit_feed_key: formData.adafruit_feed_key,
      device_type: formData.device_type,
    };

    const payload = formData.areaId
      ? { ...basePayload, area: { id: Number(formData.areaId) } }
      : basePayload;

    try {
      if (editingDevice) {
        await updateDevice(editingDevice.id, payload);
      } else {
        await createDevice(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      console.error("Chi tiết lỗi:", err.response?.data);
      alert(err?.response?.data?.message || "Lỗi lưu thiết bị! Kiểm tra lại thông tin.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn chắc chắn muốn xóa thiết bị này?')) {
      await deleteDevice(id);
      fetchData();
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Thiết bị</h1>
        <button 
          onClick={() => { setEditingDevice(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60]"
        >
          <Plus size={20} /> Thêm thiết bị
        </button>
      </div>

      {loading ? (
        <div className="text-center">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Tên thiết bị</th>
                <th className="p-4 text-left">Loại</th>
                <th className="p-4 text-left">Trạng thái</th>
                <th className="p-4 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{d.device_name}</td>
                  <td className="p-4">{d.device_type}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${d.status === 'ONLINE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => {
                      setEditingDevice(d);
                      // ✅ FIX: tìm area chứa device này để set areaId đúng
                      const parentArea = warehouses.flatMap(w => w.areas).find(a =>
                        a.devices.some(dev => dev.id === d.id)
                      );
                      setFormData({
                        device_name: d.device_name,
                        device_code: d.device_code ?? '',
                        adafruit_feed_key: d.adafruit_feed_key,
                        device_type: d.device_type,
                        areaId: parentArea ? String(parentArea.id) : ''
                      });
                      setShowModal(true);
                    }} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                    <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
            <h2 className="font-bold text-lg">{editingDevice ? 'Sửa thiết bị' : 'Thêm mới'}</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Mã thiết bị</label>
              <input 
                placeholder="Mã thiết bị (VD: DHT_TU_01)" 
                required 
                className="w-full border p-2 rounded" 
                value={formData.device_code} 
                onChange={e => setFormData({...formData, device_code: e.target.value})} 
              />
            </div>
            <input placeholder="Tên thiết bị" required className="w-full border p-2 rounded" value={formData.device_name} onChange={e => setFormData({...formData, device_name: e.target.value})} />
            <input placeholder="Feed Key (Adafruit)" required className="w-full border p-2 rounded" value={formData.adafruit_feed_key} onChange={e => setFormData({...formData, adafruit_feed_key: e.target.value})} />
            {/* ✅ Thêm selector loại thiết bị */}
            <select className="w-full border p-2 rounded" value={formData.device_type} onChange={e => setFormData({...formData, device_type: e.target.value})}>
              <option value="SENSOR">SENSOR (Cảm biến)</option>
              <option value="ACTUATOR">ACTUATOR (Thiết bị điều khiển)</option>
            </select>
            <select className="w-full border p-2 rounded" value={formData.areaId} onChange={e => setFormData({...formData, areaId: e.target.value})}>
              <option value="">Chọn khu vực</option>
              {warehouses.flatMap(w => w.areas).map(a => <option key={a.id} value={a.id}>{a.area_name}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Hủy</button>
              <button type="submit" className="px-4 py-2 bg-[#2ECC71] text-white rounded">Lưu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
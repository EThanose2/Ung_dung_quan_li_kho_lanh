// src/pages/SchedulesPage.tsx
import { useState, useEffect } from 'react';
import { Plus, Power, PowerOff, Clock, Pencil, Trash2, X } from 'lucide-react';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, getDevices, ScheduleApi, DeviceApi } from '../api/apiService';

const ACTION_OPTIONS = ['ON', 'OFF', 'MODE_1', 'MODE_2', 'MODE_3'];

const ACTION_LABEL: Record<string, string> = {
  ON: 'Bật', OFF: 'Tắt', MODE_1: 'Chế độ 1', MODE_2: 'Chế độ 2', MODE_3: 'Chế độ 3'
};

const emptyForm = {
  device_id: '' as number | '',
  action: 'ON',
  start_time: '',
  end_time: '',
  is_active: true,
};

export function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleApi[]>([]);
  const [devices, setDevices] = useState<DeviceApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleApi | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const [schRes, devRes] = await Promise.all([getSchedules(), getDevices()]);
      setSchedules(schRes.data.data);
      setDevices(devRes.data.data.filter((d: DeviceApi) =>
        d.device_type !== 'SENSOR' && d.device_type !== 'TEMP' &&
        d.device_type !== 'HUMI' && d.device_type !== 'CO2_SENSOR' && d.device_type !== 'DOOR_SENSOR'
      ));
    } catch (err) {
      console.error('Lỗi tải schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingSchedule(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (s: ScheduleApi) => {
    setEditingSchedule(s);
    setFormData({
      device_id: s.device?.id ?? '',
      action: s.action,
      start_time: s.start_time,
      end_time: s.end_time ?? '',
      is_active: s.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (s: ScheduleApi) => {
    if (!confirm(`Xóa lịch "${s.start_time} - ${ACTION_LABEL[s.action]}"?`)) return;
    try {
      await deleteSchedule(s.id);
      setSchedules(prev => prev.filter(x => x.id !== s.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xóa thất bại!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.device_id) return;
    setSubmitting(true);
    try {
      const body = {
        action: formData.action,
        start_time: formData.start_time,
        end_time: formData.end_time || undefined,
        is_active: formData.is_active,
        device: { id: formData.device_id as number },
      };
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, body);
      } else {
        await createSchedule(body);
      }
      await fetchData();
      setShowModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || (editingSchedule ? 'Cập nhật thất bại!' : 'Tạo lịch thất bại!'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý lịch trình</h1>
          <p className="text-gray-500">Thiết lập lịch tự động cho thiết bị</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#2ECC71] text-white px-4 py-2 rounded-lg hover:bg-[#27AE60] transition-colors">
          <Plus className="w-5 h-5" /> Thêm lịch trình
        </button>
      </div>

      <div className="grid gap-4">
        {loading && <div className="bg-white rounded-xl p-12 text-center text-gray-400">Đang tải lịch trình...</div>}

        {!loading && schedules.map(schedule => (
          <div key={schedule.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#2ECC71]/30 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-28 border-r border-gray-100 pr-4">
                  <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                    <Clock className="w-4 h-4 text-[#2ECC71]" />
                    {schedule.start_time}
                  </div>
                  {schedule.end_time && <p className="text-xs text-gray-400 mt-0.5">→ {schedule.end_time}</p>}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{schedule.device?.device_name || 'Thiết bị không xác định'}</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    schedule.action === 'ON' ? 'bg-green-100 text-green-700' :
                    schedule.action === 'OFF' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {schedule.action === 'OFF' ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                    {ACTION_LABEL[schedule.action] || schedule.action}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                  schedule.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {schedule.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(schedule)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(schedule)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && schedules.length === 0 && (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
            <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Chưa có lịch trình nào</p>
          </div>
        )}
      </div>

      {/* Modal — dùng pointer-events-none trên overlay để không block click */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay mờ — chỉ đóng modal khi click đúng overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          {/* Hộp modal — stopPropagation để không đóng khi click bên trong */}
          <div
            className="relative bg-white rounded-xl w-full max-w-lg shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSchedule ? 'Chỉnh sửa lịch trình' : 'Thêm lịch trình mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thiết bị</label>
                <select
                  value={formData.device_id}
                  onChange={(e) => setFormData({ ...formData, device_id: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  required
                >
                  <option value="">Chọn thiết bị</option>
                  {devices.map(d => <option key={d.id} value={d.id}>{d.device_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hành động</label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                >
                  {ACTION_OPTIONS.map(a => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giờ bắt đầu</label>
                  <input type="time" value={formData.start_time} required
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giờ kết thúc <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
                  <input type="time" value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_active" checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#2ECC71] rounded" />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Kích hoạt ngay</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60] disabled:opacity-50">
                  {submitting ? 'Đang lưu...' : editingSchedule ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
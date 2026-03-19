import { useState } from 'react';
import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { store } from '../store';
import { Schedule } from '../types';

export function SchedulesPage() {
  const [schedules, setSchedules] = useState(store.getSchedules());
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const devices = store.getDevices().filter(d => d.type !== 'temperature' && d.type !== 'humidity');

  const [formData, setFormData] = useState({
    deviceId: '',
    deviceName: '',
    action: 'on' as 'on' | 'off',
    startTime: '',
    endTime: '',
    days: [] as number[],
    enabled: true
  });

  const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  const handleAdd = () => {
    setEditingSchedule(null);
    setFormData({
      deviceId: '',
      deviceName: '',
      action: 'on',
      startTime: '',
      endTime: '',
      days: [],
      enabled: true
    });
    setShowModal(true);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      deviceId: schedule.deviceId,
      deviceName: schedule.deviceName,
      action: schedule.action,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      days: schedule.days,
      enabled: schedule.enabled
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) {
      store.deleteSchedule(id);
      setSchedules(store.getSchedules());
    }
  };

  const toggleSchedule = (schedule: Schedule) => {
    store.updateSchedule(schedule.id, { enabled: !schedule.enabled });
    setSchedules(store.getSchedules());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const device = devices.find(d => d.id === formData.deviceId);
    if (!device) return;

    const scheduleData = {
      ...formData,
      deviceName: device.name
    };

    if (editingSchedule) {
      store.updateSchedule(editingSchedule.id, scheduleData);
    } else {
      store.addSchedule(scheduleData);
    }
    setSchedules(store.getSchedules());
    setShowModal(false);
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort()
    }));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý lịch trình</h1>
          <p className="text-gray-500">Thiết lập lịch tự động cho thiết bị</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#2ECC71] text-white px-4 py-2 rounded-lg hover:bg-[#27AE60] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm lịch trình
        </button>
      </div>

      <div className="grid gap-4">
        {schedules.map(schedule => (
          <div key={schedule.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-semibold text-gray-900">{schedule.deviceName}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    schedule.action === 'on' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {schedule.action === 'on' ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                    {schedule.action === 'on' ? 'Bật' : 'Tắt'}
                  </span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                    schedule.enabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {schedule.enabled ? 'Đang hoạt động' : 'Tạm dừng'}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Thời gian:</span> {schedule.startTime} - {schedule.endTime}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Lặp lại:</span>
                    <div className="flex gap-2">
                      {schedule.days.map(day => (
                        <span key={day} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {dayLabels[day - 1]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSchedule(schedule)}
                  className={`p-2 rounded-lg transition-colors ${
                    schedule.enabled ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={schedule.enabled ? 'Tạm dừng' : 'Kích hoạt'}
                >
                  <Power className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleEdit(schedule)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">Chưa có lịch trình nào. Nhấn "Thêm lịch trình" để tạo mới.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSchedule ? 'Chỉnh sửa lịch trình' : 'Thêm lịch trình mới'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thiết bị</label>
                <select
                  value={formData.deviceId}
                  onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                  required
                >
                  <option value="">Chọn thiết bị</option>
                  {devices.map(device => (
                    <option key={device.id} value={device.id}>{device.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hành động</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="on"
                      checked={formData.action === 'on'}
                      onChange={(e) => setFormData({ ...formData, action: e.target.value as 'on' | 'off' })}
                      className="w-4 h-4 text-[#2ECC71]"
                    />
                    <span>Bật</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="off"
                      checked={formData.action === 'off'}
                      onChange={(e) => setFormData({ ...formData, action: e.target.value as 'on' | 'off' })}
                      className="w-4 h-4 text-[#2ECC71]"
                    />
                    <span>Tắt</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lặp lại vào các ngày</label>
                <div className="grid grid-cols-4 gap-2">
                  {dayLabels.map((label, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index + 1)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        formData.days.includes(index + 1)
                          ? 'bg-[#2ECC71] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60]"
                >
                  {editingSchedule ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

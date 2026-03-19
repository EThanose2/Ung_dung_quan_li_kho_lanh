import { useState } from 'react';
import { Download, Calendar } from 'lucide-react';

export function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [reportType, setReportType] = useState('temperature');

  const handleExport = (format: 'csv' | 'excel') => {
    const mockData = `Khu vực,Thời gian,Nhiệt độ (°C),Độ ẩm (%)
Khu vực lưu trữ Rau củ,2026-03-07 00:00,8.0,85
Khu vực lưu trữ Rau củ,2026-03-07 04:00,8.5,83
Khu vực lưu trữ Rau củ,2026-03-07 08:00,7.5,86
Khu vực lưu trữ Thịt cá,2026-03-07 00:00,-2.0,75
Khu vực lưu trữ Thịt cá,2026-03-07 04:00,-1.5,76
Khu vực lưu trữ Thịt cá,2026-03-07 08:00,-2.5,74`;

    const blob = new Blob([mockData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-freshguard-${new Date().toISOString().split('T')[0]}.${format}`;
    link.click();
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Báo cáo</h1>
        <p className="text-gray-500">Xuất báo cáo dữ liệu môi trường</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-6">Tạo báo cáo mới</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Từ ngày
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Đến ngày
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Khu vực</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
            >
              <option value="all">Tất cả khu vực</option>
              <option value="1">Khu vực lưu trữ Rau củ</option>
              <option value="2">Khu vực lưu trữ Thịt cá</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại dữ liệu</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="temperature"
                  checked={reportType === 'temperature'}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-4 h-4 text-[#2ECC71]"
                />
                <div>
                  <p className="font-medium text-gray-900">Nhiệt độ</p>
                  <p className="text-sm text-gray-500">Dữ liệu nhiệt độ theo thời gian</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="humidity"
                  checked={reportType === 'humidity'}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-4 h-4 text-[#2ECC71]"
                />
                <div>
                  <p className="font-medium text-gray-900">Độ ẩm</p>
                  <p className="text-sm text-gray-500">Dữ liệu độ ẩm theo thời gian</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="all"
                  checked={reportType === 'all'}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-4 h-4 text-[#2ECC71]"
                />
                <div>
                  <p className="font-medium text-gray-900">Tất cả</p>
                  <p className="text-sm text-gray-500">Toàn bộ dữ liệu môi trường</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="alerts"
                  checked={reportType === 'alerts'}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-4 h-4 text-[#2ECC71]"
                />
                <div>
                  <p className="font-medium text-gray-900">Cảnh báo</p>
                  <p className="text-sm text-gray-500">Lịch sử cảnh báo hệ thống</p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Định dạng xuất</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleExport('csv')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60] transition-colors"
              >
                <Download className="w-5 h-5" />
                Xuất CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#3498DB] text-white rounded-lg hover:bg-[#2980B9] transition-colors"
              >
                <Download className="w-5 h-5" />
                Xuất Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Báo cáo gần đây</h2>
        <div className="space-y-3">
          {[
            { name: 'Báo cáo nhiệt độ tháng 3', date: '2026-03-07', size: '245 KB', type: 'CSV' },
            { name: 'Báo cáo tổng hợp tuần 9', date: '2026-03-01', size: '1.2 MB', type: 'Excel' },
            { name: 'Báo cáo cảnh báo tháng 2', date: '2026-02-28', size: '128 KB', type: 'CSV' },
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{report.name}</p>
                  <p className="text-sm text-gray-500">{report.date} • {report.size} • {report.type}</p>
                </div>
              </div>
              <button className="px-4 py-2 text-[#2ECC71] hover:bg-green-50 rounded-lg transition-colors">
                Tải xuống
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

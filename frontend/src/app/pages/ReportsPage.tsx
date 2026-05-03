import React, { useState, useEffect } from 'react';
import { Download, Calendar, Trash2, AlertCircle } from 'lucide-react';
import { generateExportCsv, getWarehouses } from '../api/apiService';

interface ReportItem {
  id: string;
  name: string;
  date: string;
  blob: Blob;
}

const toDateInputValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const removeVietnameseTones = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export function ReportsPage() {
  // Lấy thông tin User hiện tại từ LocalStorage để phân quyền
  const currentUser = JSON.parse(localStorage.getItem('current_user') ?? '{}');
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [areas, setAreas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const getLast3Months = () => {
    const result = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      result.push({
        label: `Tháng ${d.getMonth() + 1}`,
        start: toDateInputValue(start),
        end: toDateInputValue(end),
      });
    }
    return result;
  };

  // GỘP CHUNG luồng tải dữ liệu để xử lý phân quyền đồng bộ
  useEffect(() => {
    const initData = async () => {
      try {
        setLoadingAreas(true);
        setLoadingReports(true);

        // 1. Fetch và lọc danh sách khu vực
        const whRes = await getWarehouses();
        const warehouses = whRes.data?.data || whRes.data || [];
        let allAreas = warehouses.flatMap((w: any) => w.areas || []);

        // Phân quyền: OPERATOR chỉ thấy area được phân công
        if (!isAdmin) {
          allAreas = allAreas.filter((a: any) =>
            a.operators?.some((op: any) => op.id === currentUser?.id)
          );
        }
        setAreas(allAreas);
        setLoadingAreas(false);

        // 2. Chặn load báo cáo nếu Operator chưa được phân công khu vực
        if (!isAdmin && allAreas.length === 0) {
          setLoadingReports(false);
          return; 
        }

        // 3. Fetch báo cáo 3 tháng gần nhất (áp dụng filter area_id nếu là Operator)
        const months = getLast3Months();
        const reports = await Promise.all(
          months.map(async (m) => {
            const payload: any = {
              start_time: `${m.start} 00:00:00`,
              end_time: `${m.end} 23:59:59`,
            };

            // Nếu là Operator, ép lấy dữ liệu theo khu vực được gán
            if (!isAdmin && allAreas.length > 0) {
              payload.area_id = allAreas[0].id;
            }

            const res = await generateExportCsv(payload);
            return {
              id: `report-${Date.now()}-${Math.random()}`, 
              name: `Báo cáo Tháng ${new Date(m.end).getMonth() + 1}`,
              date: m.end,
              blob: new Blob([res.data], { type: 'text/csv;charset=utf-8;' }),
            };
          })
        );
        setReportsList(reports);
      } catch (err) {
        console.error('Lỗi khởi tạo dữ liệu báo cáo:', err);
      } finally {
        setLoadingReports(false);
      }
    };

    initData();
  }, [isAdmin, currentUser?.id]);

  const downloadReport = (report: ReportItem) => {
    const url = window.URL.createObjectURL(report.blob);
    const link = document.createElement('a');
    link.href = url;
    
    let cleanName = removeVietnameseTones(report.name).toLowerCase();
    cleanName = cleanName.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const fileName = `${cleanName}.csv`;
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (startDate && endDate && startDate > endDate) {
      setError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const payload: any = {
        start_time: startDate ? `${startDate} 00:00:00` : undefined,
        end_time: endDate ? `${endDate} 23:59:59` : undefined,
      };

      let areaDisplayName = 'Tất cả khu vực';

      // Áp dụng area_id tùy theo Role
      if (isAdmin) {
        payload.area_id = selectedArea !== 'all' ? Number(selectedArea) : undefined;
        if (selectedArea !== 'all') {
          const foundArea = areas.find((a) => String(a.id) === String(selectedArea));
          if (foundArea) {
            areaDisplayName = foundArea.name || foundArea.area_name || `Khu vực ${selectedArea}`;
          }
        }
      } else {
        // Operator tự động lấy khu vực đầu tiên của mình
        payload.area_id = areas[0]?.id;
        areaDisplayName = areas[0]?.name || areas[0]?.area_name || 'Khu vực của tôi';
      }

      const res = await generateExportCsv(payload);

      let reportName = `Báo Cáo ${areaDisplayName}`;
      if (startDate && endDate) {
        reportName += ` từ (${startDate} đến ${endDate})`;
      } else if (startDate) {
        reportName += ` từ ${startDate}`;
      } else if (endDate) {
        reportName += ` đến ${endDate}`;
      }

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let cleanName = removeVietnameseTones(reportName).toLowerCase();
      cleanName = cleanName.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const fileName = `${cleanName}.csv`;

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Export lỗi:', err);
      setError('Không thể xuất báo cáo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = (id: string) => {
    setReportsList(prev => prev.filter(report => report.id !== id));
  };

  // MÀN HÌNH EMPTY: Nếu là Operator chưa được gán khu vực
  if (!isAdmin && areas.length === 0 && !loadingAreas) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Báo cáo</h1>
          <p className="text-gray-500">Xuất báo cáo dữ liệu môi trường</p>
        </div>

        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900">Bạn chưa được phân công khu vực nào</p>
          <p className="text-sm text-gray-500 mt-2">
            Hiện tại không có dữ liệu báo cáo. Vui lòng liên hệ Admin để được cấp quyền quản lý khu vực.
          </p>
        </div>
      </div>
    );
  }

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
                max={endDate || toDateInputValue(new Date())}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (error) setError('');
                }}
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
                min={startDate || undefined}
                max={toDateInputValue(new Date())}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-[-16px]">Để trống sẽ lấy tất cả dữ liệu hiện tại.</p>

          {/* CHỈ HIỂN THỊ CHỌN KHU VỰC NẾU LÀ ADMIN */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Khu vực</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              >
                <option value="all">Tất cả khu vực</option>
                
                {loadingAreas ? (
                  <option disabled>Đang tải dữ liệu...</option>
                ) : areas.length === 0 ? (
                  <option disabled>Không có dữ liệu khu vực</option>
                ) : (
                  areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name || area.area_name || `Khu vực ${area.id}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-center">
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2ECC71] text-white rounded-lg hover:bg-[#27AE60] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {loading ? 'Đang xuất dữ liệu...' : 'Xuất Báo Cáo CSV'}
            </button>
            {error && <p className="mt-3 text-sm text-red-600 w-full text-center">{error}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Danh sách báo cáo 3 tháng gần nhất</h2>

        <div className="space-y-3">
          {loadingReports ? (
            <p className="text-gray-500">Đang tải...</p>
          ) : reportsList.length === 0 ? (
            <p className="text-gray-500">Chưa có báo cáo nào.</p>
          ) : (
            reportsList.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="max-w-[450px]">
                    <p className="font-medium text-gray-900 truncate" title={report.name}>
                      {report.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {report.date} • CSV
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => downloadReport(report)}
                    className="px-4 py-2 text-[#2ECC71] hover:bg-green-50 rounded-lg transition-colors"
                  >
                    Tải xuống
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Xóa báo cáo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
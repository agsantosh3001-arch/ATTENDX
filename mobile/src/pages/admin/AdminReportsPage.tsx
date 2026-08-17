import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { api } from '../../utils/api';

export const AdminReportsPage: React.FC = () => {
  const [month, setMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = async () => {
    setDownloading(true);
    try {
      const [yearStr, monthStr] = month.split('-');
      const res = await api.get(`/attendance/history?limit=1000`);
      if (res.data?.success) {
        const records = res.data.data.records || [];
        if (format === 'csv') {
          const headers = ['Employee Name', 'Email', 'Department', 'Date', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Late Reason'];
          const rows = records.map((r: any) => [
            `"${r.employee?.fullName || ''}"`,
            `"${r.employee?.email || ''}"`,
            `"${r.employee?.department || ''}"`,
            `"${new Date(r.date).toLocaleDateString()}"`,
            `"${r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : ''}"`,
            `"${r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : ''}"`,
            `"${r.formattedHours || ''}"`,
            `"${r.status}"`,
            `"${(r.lateReason || '').replace(/"/g, '""')}"`,
          ]);

          const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
          const link = document.createElement('a');
          link.setAttribute('href', encodeURI(csv));
          link.setAttribute('download', `AttendX_Report_${month}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
          const link = document.createElement('a');
          link.setAttribute('href', jsonStr);
          link.setAttribute('download', `AttendX_Report_${month}.json`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to generate report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 px-4 pt-4 space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Reports & Analytics
          </h1>
          <p className="text-xs text-muted-foreground">Export organization monthly reports</p>
        </div>
      </div>

      <Card className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Select Month & Year</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full h-12 rounded-2xl border border-input bg-background px-4 text-sm font-bold outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Export Format</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`h-12 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                format === 'csv' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> CSV Report
            </button>
            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`h-12 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                format === 'json' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'
              }`}
            >
              <FileText className="w-4 h-4" /> JSON Export
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleGenerate}
          isLoading={downloading}
          className="w-full h-14 text-sm font-bold rounded-2xl shadow-md mt-2"
        >
          <Download className="w-4 h-4 mr-2" /> Download Organization Report
        </Button>
      </Card>
    </div>
  );
};

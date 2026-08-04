import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CheckCircle, Calendar, Filter, RefreshCw, FileText } from 'lucide-react';
import { api } from '../../utils/api';
import { AttendanceRecord } from '../../types';

export const AdminAttendancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Filter state
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/attendance/history?limit=100';
      if (dateFilter) url += `&startDate=${dateFilter}&endDate=${dateFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await api.get(url);
      if (res.data?.success) {
        setRecords(res.data.data.records || []);
      }
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 px-4 pt-4 space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Attendance Ledger
          </h1>
          <p className="text-xs text-muted-foreground">Organization-wide attendance logs</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAttendance}
          isLoading={loading}
          className="rounded-2xl h-10 px-3 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sync
        </Button>
      </div>

      {/* Mobile Filter Bar with Native Date Picker */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Filter Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full h-11 rounded-2xl border border-input bg-card px-3 text-xs font-bold outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Filter Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-11 rounded-2xl border border-input bg-card px-3 text-xs font-bold outline-none"
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      </div>

      {(dateFilter || statusFilter) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setDateFilter('');
              setStatusFilter('');
            }}
            className="text-xs font-bold text-primary hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Record Cards */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-10 animate-pulse font-medium">
            Loading attendance records...
          </p>
        ) : records.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            No attendance records match the selected date and status filters.
          </Card>
        ) : (
          records.map((r) => (
            <Card key={r.id} className="p-4 border-border bg-card shadow-xs rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      r.employee?.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.employee?.fullName || 'User')}`
                    }
                    alt={r.employee?.fullName || 'Employee'}
                    className="w-9 h-9 rounded-full border border-border bg-muted object-cover"
                  />
                  <div>
                    <h3 className="font-extrabold text-xs text-foreground">{r.employee?.fullName || 'Employee'}</h3>
                    <p className="text-[10px] text-muted-foreground">{r.employee?.email}</p>
                  </div>
                </div>

                <Badge variant={r.status}>{r.status}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Date</p>
                  <p className="font-bold text-foreground">{new Date(r.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Check In</p>
                  <p className="font-bold font-mono text-foreground">
                    {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Working Hours</p>
                  <p className="font-bold font-mono text-foreground">{r.formattedHours || '—'}</p>
                </div>
              </div>

              {r.lateReason && (
                <div className="pt-2 border-t border-border/60 text-[11px]">
                  <p className="font-bold text-amber-600 dark:text-amber-400">Late Reason:</p>
                  <p className="italic text-muted-foreground">"{r.lateReason}"</p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

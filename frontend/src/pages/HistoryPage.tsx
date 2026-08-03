import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { History, Filter, ChevronLeft, ChevronRight, RefreshCw, FileText } from 'lucide-react';
import { api } from '../utils/api';
import { AttendanceRecord } from '../types';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Selected Reason Modal
  const [selectedReason, setSelectedReason] = useState<{ date: string; reason: string } | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/attendance/history?page=${page}&limit=10`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await api.get(url);
      if (res.data?.success) {
        setRecords(res.data.data.records || []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
        setTotalCount(res.data.data.pagination?.totalRecords || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-3xl border border-primary/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Attendance History Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View detailed punch history, working minutes, and late check-in justifications.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHistory}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
            <div className="w-full space-y-1.5">
              <label className="text-sm font-medium leading-none text-foreground">Status Filter</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setStatusFilter('');
                setPage(1);
              }}
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Attendance Records ({totalCount})</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Prev
            </Button>
            <span className="text-xs font-semibold text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Check In</th>
                  <th className="py-3 px-2">Check Out</th>
                  <th className="py-3 px-2">Working Hours</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Late Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No attendance records found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 font-semibold text-foreground">
                        {new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-2">
                        {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-2">
                        {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-2 font-mono font-medium">{r.formattedHours || '—'}</td>
                      <td className="py-3 px-2">
                        <Badge variant={r.status}>{r.status}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        {r.lateReason ? (
                          <button
                            onClick={() => setSelectedReason({ date: r.date, reason: r.lateReason! })}
                            className="text-primary hover:underline flex items-center gap-1 font-medium"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Reason
                          </button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Reason Modal */}
      <Modal
        isOpen={!!selectedReason}
        onClose={() => setSelectedReason(null)}
        title="Submitted Late Reason"
        description={`Date: ${selectedReason ? new Date(selectedReason.date).toLocaleDateString() : ''}`}
      >
        <div className="p-4 rounded-xl bg-muted/60 border border-border text-sm text-foreground my-2">
          {selectedReason?.reason}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => setSelectedReason(null)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

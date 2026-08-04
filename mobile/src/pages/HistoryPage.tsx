import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BottomSheet } from '../components/ui/BottomSheet';
import { History, Search, Filter, Calendar, Clock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Reason Preview Sheet
  const [selectedReason, setSelectedReason] = useState<{ date: string; reason: string } | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/attendance/history?page=${page}&limit=15`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await api.get(url);
      if (res.data?.success) {
        setRecords(res.data.data.records || []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
        setTotalCount(res.data.data.pagination?.totalRecords || 0);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handlePresetFilter = (days: number | 'month' | 'all') => {
    setPage(1);
    const now = new Date();
    if (days === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (days === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else {
      const past = new Date(now);
      past.setDate(now.getDate() - days);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 px-4 pt-4 space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Attendance History
          </h1>
          <p className="text-xs text-muted-foreground">Total records logged: {totalCount}</p>
        </div>
      </div>

      {/* Quick Presets Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => handlePresetFilter('month')}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-card border border-border shrink-0 hover:bg-primary/10 active:scale-95 transition-all"
        >
          This Month
        </button>
        <button
          type="button"
          onClick={() => handlePresetFilter(30)}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-card border border-border shrink-0 hover:bg-primary/10 active:scale-95 transition-all"
        >
          30 Days
        </button>
        <button
          type="button"
          onClick={() => handlePresetFilter('all')}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-card border border-border shrink-0 hover:bg-primary/10 active:scale-95 transition-all"
        >
          All Time
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search date or reason..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-11 rounded-2xl border border-input bg-card px-3 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-2xl border border-input bg-card px-3 text-xs font-bold outline-none"
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="half_day">Half Day</option>
          <option value="absent">Absent</option>
        </select>
      </div>

      {/* Records Card List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-10 animate-pulse font-medium">
            Fetching attendance history...
          </p>
        ) : records.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            No attendance records match the selected criteria.
          </Card>
        ) : (
          records.map((r) => (
            <Card key={r.id} className="p-4 border-border bg-card shadow-xs rounded-3xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">
                  {new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <Badge variant={r.status}>{r.status}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Check In</p>
                  <p className="font-bold font-mono text-foreground">
                    {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Check Out</p>
                  <p className="font-bold font-mono text-foreground">
                    {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Duration</p>
                  <p className="font-bold font-mono text-foreground">{r.formattedHours || '—'}</p>
                </div>
              </div>

              {r.lateReason && (
                <div className="pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setSelectedReason({ date: r.date, reason: r.lateReason! })}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Submitted Late Explanation</span>
                  </button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-2xl"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
          </Button>

          <span className="text-xs font-bold text-muted-foreground">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-2xl"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Late Reason Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedReason}
        onClose={() => setSelectedReason(null)}
        title="Submitted Late Justification"
      >
        <div className="p-4 rounded-2xl bg-muted/60 text-xs font-semibold text-foreground space-y-2">
          <p className="text-[10px] text-muted-foreground font-bold uppercase">Date: {selectedReason ? new Date(selectedReason.date).toLocaleDateString() : ''}</p>
          <p className="italic">"{selectedReason?.reason}"</p>
        </div>
        <div className="pt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setSelectedReason(null)}>
            Close
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};

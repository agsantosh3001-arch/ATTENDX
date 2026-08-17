import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  History,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  Search,
  Download,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { api } from '../utils/api';
import { AttendanceRecord, User as UserType } from '../types';

interface SummaryData {
  totalRecords: number;
  presentCount: number;
  lateCount: number;
  halfDayCount: number;
  absentCount: number;
  totalWorkingMinutes: number;
  totalWorkingHoursFormatted: string;
  avgWorkingMinutes: number;
  avgWorkingHoursFormatted: string;
}

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<UserType[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<string>('25');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  // Selected Reason Modal
  const [selectedReason, setSelectedReason] = useState<{ date: string; reason: string; employeeName?: string } | null>(null);

  // Fetch Employee list if Admin
  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/admin/employees')
        .then((res) => {
          if (res.data?.success) {
            setEmployees(res.data.data.employees || []);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/attendance/history?page=${page}&limit=${limit}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (user?.role === 'admin' && selectedEmployeeId) {
        url += `&employeeId=${selectedEmployeeId}`;
      }

      const res = await api.get(url);
      if (res.data?.success) {
        setRecords(res.data.data.records || res.data.data.items || []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
        setTotalCount(res.data.data.pagination?.totalRecords || 0);
        if (res.data.data.summary) {
          setSummary(res.data.data.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, startDate, endDate, statusFilter, selectedEmployeeId, user?.role]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handlePresetDateFilter = (days: number | 'all' | 'month') => {
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

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Employee Name', 'Email', 'Department', 'Date', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Late Reason'];
    const rows = records.map((r) => [
      `"${r.employee?.fullName || 'N/A'}"`,
      `"${r.employee?.email || 'N/A'}"`,
      `"${r.employee?.department || 'N/A'}"`,
      `"${new Date(r.date).toLocaleDateString()}"`,
      `"${r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : 'N/A'}"`,
      `"${r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : 'N/A'}"`,
      `"${r.formattedHours || 'N/A'}"`,
      `"${r.status}"`,
      `"${(r.lateReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-card p-6 sm:p-8 rounded-xl border border-border">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-sans">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="uppercase tracking-widest text-[10px]">Workforce Audit Ledger</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-normal tracking-tighter text-foreground flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Attendance History Log
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-2xl">
            Complete high-fidelity attendance records across all employees. Filter by date, punctuality status, or search specific team members.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={records.length === 0}
            leftIcon={<Download className="w-4 h-4 text-emerald-500" />}
            className="rounded-xl font-bold"
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={fetchHistory}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="rounded-xl font-bold shadow-md"
          >
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* Summary Telemetry Metrics */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-6 relative overflow-hidden group hover:border-primary/50 transition-all text-center flex flex-col items-center justify-center space-y-2">
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
              <Calendar className="w-24 h-24 text-primary" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 relative z-10 mb-1">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-foreground font-mono relative z-10">{summary.totalRecords}</p>
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Total Filtered Entries</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Matching current view</p>
            </div>
          </Card>

          <Card className="p-6 relative overflow-hidden group hover:border-primary/50 transition-all text-center flex flex-col items-center justify-center space-y-2">
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
              <CheckCircle2 className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 relative z-10 mb-1">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono relative z-10">{summary.presentCount}</p>
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Present Days</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">On-time check-ins</p>
            </div>
          </Card>

          <Card className="p-6 relative overflow-hidden group hover:border-primary/50 transition-all text-center flex flex-col items-center justify-center space-y-2">
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
              <AlertTriangle className="w-24 h-24 text-amber-500" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 relative z-10 mb-1">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono relative z-10">{summary.lateCount}</p>
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Late Check-Ins</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">With late justification</p>
            </div>
          </Card>

          <Card className="p-6 relative overflow-hidden group hover:border-primary/50 transition-all text-center flex flex-col items-center justify-center space-y-2">
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 pointer-events-none">
              <Clock className="w-24 h-24 text-indigo-500" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 relative z-10 mb-1">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-foreground font-mono relative z-10">{summary.totalWorkingHoursFormatted}</p>
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Logged Working Hours</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Avg {summary.avgWorkingHoursFormatted} / day</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filter Bar & Controls */}
      <Card className="overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Filter className="w-4 h-4 text-primary" />
              <span>Query & Scope Filters</span>
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-semibold mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => handlePresetDateFilter('month')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all border border-border"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handlePresetDateFilter(30)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all border border-border"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetDateFilter(60)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all border border-border"
              >
                Last 60 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetDateFilter('all')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all border border-border"
              >
                All Time
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Search Input */}
            <div className="w-full space-y-1.5 lg:col-span-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-primary" />
                Search Keyword
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search name, email, reason..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Start Date */}
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />

            {/* End Date */}
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />

            {/* Status Filter */}
            <div className="w-full space-y-1.5">
              <label className="text-xs font-bold text-foreground">Status Filter</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="present">Present (On-Time)</option>
                <option value="late">Late Arrival</option>
                <option value="half_day">Half Day</option>
                <option value="absent">Absent</option>
              </select>
            </div>

            {/* Employee Filter (Admin view or multi-employee view) */}
            {user?.role === 'admin' ? (
              <div className="w-full space-y-1.5">
                <label className="text-xs font-bold text-foreground">Filter Employee</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedEmployeeId}
                  onChange={(e) => {
                    setSelectedEmployeeId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName || emp.email} ({emp.department || 'Employee'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="w-full space-y-1.5">
                <label className="text-xs font-bold text-foreground">Rows Per Page</label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={limit}
                  onChange={(e) => {
                    setLimit(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="10">10 Rows</option>
                  <option value="25">25 Rows</option>
                  <option value="50">50 Rows</option>
                  <option value="100">100 Rows</option>
                  <option value="all">All Records</option>
                </select>
              </div>
            )}
          </div>

          {(search || startDate || endDate || statusFilter || selectedEmployeeId !== 'all') && (
            <div className="flex justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStartDate('');
                  setEndDate('');
                  setStatusFilter('');
                  setSelectedEmployeeId('all');
                  setPage(1);
                }}
                className="text-xs text-muted-foreground hover:text-foreground font-bold"
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-border/60 gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Attendance Records ({totalCount})
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Showing page {page} of {totalPages} ({records.length} records on current page)
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs font-bold text-muted-foreground">Rows:</span>
                <select
                  className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-bold"
                  value={limit}
                  onChange={(e) => {
                    setLimit(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="all">All</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || limit === 'all'}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
                className="rounded-xl font-bold"
              >
                Prev
              </Button>
              <span className="text-xs font-bold text-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || limit === 'all'}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="rounded-xl font-bold"
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Check In</th>
                  <th className="py-3.5 px-4">Check Out</th>
                  <th className="py-3.5 px-4">Working Hours</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Late Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground animate-pulse font-medium">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground font-medium">
                      No attendance records found matching the specified filters.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/40 transition-colors group">
                      {/* Employee Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              r.employee?.avatarUrl ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                r.employee?.fullName || r.employee?.email || 'User'
                              )}`
                            }
                            alt={r.employee?.fullName || 'Employee'}
                            className="w-8 h-8 rounded-full border border-border bg-muted object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-xs truncate group-hover:text-primary transition-colors">
                              {r.employee?.fullName || user?.fullName || 'Employee'}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">{r.employee?.email || user?.email}</p>
                            {(r.employee?.department || r.employee?.designation) && (
                              <p className="text-[10px] text-muted-foreground/80 truncate">
                                {r.employee.department} • {r.employee.designation}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground text-xs">
                          {new Date(r.date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Check In */}
                      <td className="py-3.5 px-4 font-mono">
                        {r.checkInTime ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Check Out */}
                      <td className="py-3.5 px-4 font-mono">
                        {r.checkOutTime ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Working Hours */}
                      <td className="py-3.5 px-4 font-mono">
                        {r.formattedHours ? (
                          <span className="px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-foreground font-extrabold text-xs">
                            {r.formattedHours}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <Badge variant={r.status}>{r.status}</Badge>
                      </td>

                      {/* Late Reason */}
                      <td className="py-3.5 px-4">
                        {r.lateReason ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedReason({
                                date: r.date,
                                reason: r.lateReason!,
                                employeeName: r.employee?.fullName || user?.fullName || undefined,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold text-[11px] transition-all border border-amber-500/20"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>View Reason</span>
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
        title="Submitted Late Check-In Reason"
        description={
          selectedReason
            ? `${selectedReason.employeeName ? `Employee: ${selectedReason.employeeName} | ` : ''}Date: ${new Date(
                selectedReason.date
              ).toLocaleDateString()}`
            : ''
        }
      >
        <div className="p-4 rounded-2xl bg-muted/50 border border-border text-xs leading-relaxed text-foreground my-2 space-y-2">
          <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Justification Statement:</p>
          <p className="text-sm font-semibold italic">"{selectedReason?.reason}"</p>
        </div>
        <div className="flex justify-end pt-3">
          <Button variant="outline" size="sm" onClick={() => setSelectedReason(null)} className="rounded-xl font-bold">
            Close Modal
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default HistoryPage;

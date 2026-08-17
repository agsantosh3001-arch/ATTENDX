import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { UserAvatar } from '../components/ui/UserAvatar';
import {
  Users,
  CheckCircle,
  Clock,
  MapPin,
  Settings,
  Calendar,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Check,
  X,
  ShieldCheck,
  Radio,
  Building,
  Briefcase,
  Sliders,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { api } from '../utils/api';
import { User, OfficeSettings, AttendanceRecord, Holiday } from '../types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'employees' | 'attendance' | 'settings' | 'holidays'>('approvals');
  const [loading, setLoading] = useState(true);

  // Data states
  const [pendingEmployees, setPendingEmployees] = useState<User[]>([]);
  const [allEmployees, setAllEmployees] = useState<User[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<OfficeSettings | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Settings form
  const [settingsForm, setSettingsForm] = useState<OfficeSettings>({
    officeLatitude: 22.6178,
    officeLongitude: 88.4206,
    allowedRadiusMeters: 2000,
    gpsAccuracyThresholdMeters: 500,
    officeStartTime: '09:00',
    officeEndTime: '18:00',
    timezone: 'Asia/Kolkata',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Holiday Modal
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');

  const fetchPending = useCallback(async () => {
    try {
      const res = await api.get('/admin/pending-employees');
      if (res.data?.success) setPendingEmployees(res.data.data.employees || []);
    } catch (e) {
      console.error('Error fetching pending employees:', e);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get('/admin/employees');
      if (res.data?.success) setAllEmployees(res.data.data.employees || []);
    } catch (e) {
      console.error('Error fetching employee directory:', e);
    }
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const res = await api.get('/attendance/history?limit=100');
      if (res.data?.success) setTodayAttendance(res.data.data.records || []);
    } catch (e) {
      console.error('Error fetching attendance logs:', e);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data?.success) {
        setSettings(res.data.data.settings);
        setSettingsForm(res.data.data.settings);
      }
    } catch (e) {
      console.error('Error fetching office settings:', e);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const res = await api.get('/admin/holidays');
      if (res.data?.success) setHolidays(res.data.data.holidays || []);
    } catch (e) {
      console.error('Error fetching holidays:', e);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchPending(),
      fetchEmployees(),
      fetchTodayAttendance(),
      fetchSettings(),
      fetchHolidays(),
    ]);
    setLoading(false);
  }, [fetchPending, fetchEmployees, fetchTodayAttendance, fetchSettings, fetchHolidays]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Actions
  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/admin/employees/${id}/approve`);
      await fetchPending();
      await fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to approve employee.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/admin/employees/${id}/reject`);
      await fetchPending();
      await fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to reject employee.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const res = await api.put('/admin/settings', settingsForm);
      if (res.data?.success) {
        setSettings(res.data.data.settings);
        setSettingsMsg({ type: 'success', text: 'Office geofence & timing updated successfully.' });
      }
    } catch (err: any) {
      setSettingsMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to update settings.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/holidays', {
        date: holidayDate,
        name: holidayName,
        description: holidayDesc,
      });
      setShowHolidayModal(false);
      setHolidayName('');
      setHolidayDate('');
      setHolidayDesc('');
      await fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add holiday.');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await api.delete(`/admin/holidays/${id}`);
      await fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete holiday.');
    }
  };

  const presentTodayCount = todayAttendance.filter((r) => r.status === 'present').length;
  const lateTodayCount = todayAttendance.filter((r) => r.status === 'late').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden bg-card/80 backdrop-blur-md rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider text-[11px]">Administrator Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Workforce Operations
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Monitor real-time employee check-ins, manage registration approvals, and configure GPS geofence parameters.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAll}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="self-start sm:self-auto rounded-xl font-semibold shadow-sm"
          >
            Sync Data
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pending Approvals */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Registrations</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-500 font-mono">{pendingEmployees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting administrator review</p>
          </div>
        </div>

        {/* Active Employees */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Staff</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground font-mono">{allEmployees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total registered employees</p>
          </div>
        </div>

        {/* Today's Punches */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Check-Ins</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-500 font-mono">{todayAttendance.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">{presentTodayCount} on-time</span>
              {lateTodayCount > 0 && <span className="text-amber-500 font-medium ml-1">({lateTodayCount} late)</span>}
            </p>
          </div>
        </div>

        {/* Geofence Perimeter */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Geofence Radius</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-400 font-mono">
              {settings?.allowedRadiusMeters || 2000}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active verification threshold</p>
          </div>
        </div>
      </div>

      {/* Modern Navigation Pill Dock */}
      <div className="flex bg-muted/40 p-1.5 rounded-2xl border border-border/60 backdrop-blur-md overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 py-2.5 px-4 font-semibold text-xs rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === 'approvals'
              ? 'bg-card text-foreground shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          Pending Approvals
          {pendingEmployees.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
              {pendingEmployees.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`flex-1 py-2.5 px-4 font-semibold text-xs rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === 'employees'
              ? 'bg-card text-foreground shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4 text-primary" />
          Employee Directory
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2.5 px-4 font-semibold text-xs rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-card text-foreground shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          Attendance Logs
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 px-4 font-semibold text-xs rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-card text-foreground shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-4 h-4 text-purple-400" />
          Geofence Settings
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`flex-1 py-2.5 px-4 font-semibold text-xs rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === 'holidays'
              ? 'bg-card text-foreground shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="w-4 h-4 text-pink-500" />
          Office Holidays
        </button>
      </div>

      {/* Tab Panels */}
      {/* 1. Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Pending Approvals</h2>
              <p className="text-xs text-muted-foreground">New employees awaiting identity verification</p>
            </div>
            <Badge variant="pending">{pendingEmployees.length} Pending</Badge>
          </div>

          {pendingEmployees.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-foreground">No Pending Requests</h3>
              <p className="text-xs text-muted-foreground mt-1">All employee registration requests have been processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    <UserAvatar name={emp.fullName || emp.email} email={emp.email} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate">{emp.fullName || 'New Employee'}</h4>
                      <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/60 px-2.5 py-0.5 rounded-lg border border-border/60">
                          <Building className="w-3 h-3 text-primary" />
                          {emp.department || 'No Dept'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/60 px-2.5 py-0.5 rounded-lg border border-border/60">
                          <Briefcase className="w-3 h-3 text-indigo-400" />
                          {emp.designation || 'No Role'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Phone: {emp.phoneNumber || '—'}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(emp.id)}
                        leftIcon={<Check className="w-4 h-4" />}
                        className="rounded-xl font-semibold text-xs h-9 px-3"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(emp.id)}
                        leftIcon={<X className="w-4 h-4" />}
                        className="rounded-xl font-semibold text-xs h-9 px-3"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Employee Directory Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Employee Directory</h2>
              <p className="text-xs text-muted-foreground">Complete staff roster and account statuses</p>
            </div>
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {allEmployees
                    .filter(
                      (e) =>
                        e.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        e.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((emp) => (
                      <tr key={emp.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={emp.fullName || emp.email} email={emp.email} />
                            <div>
                              <p className="font-bold text-foreground text-sm">{emp.fullName || '—'}</p>
                              <p className="text-xs text-muted-foreground font-mono">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-foreground font-medium">{emp.department || '—'}</td>
                        <td className="py-3.5 px-4 text-foreground font-medium">{emp.designation || '—'}</td>
                        <td className="py-3.5 px-4 text-muted-foreground font-mono">{emp.phoneNumber || '—'}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge variant={emp.status}>{emp.status}</Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Attendance Logs Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Attendance Telemetry Feed</h2>
              <p className="text-xs text-muted-foreground">Historical shift punches and timestamps</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{todayAttendance.length} records logged</span>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Punch In</th>
                    <th className="py-3.5 px-4">Punch Out</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Dispute Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {todayAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        {new Date(rec.date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {rec.employee ? rec.employee.fullName || rec.employee.email : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-foreground">
                        {rec.checkInTime
                          ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-foreground">
                        {rec.checkOutTime
                          ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                        {rec.formattedHours || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={rec.status}>{rec.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 italic text-muted-foreground max-w-xs truncate">
                        {rec.lateReason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Geofence Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                Office Geofence & Shift Rules
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Configure GPS coordinates, verification radius, and official office timings.
              </p>
            </div>

            {settingsMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                  settingsMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/10 border border-destructive/30 text-destructive'
                }`}
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{settingsMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Office Latitude (Decimal Degrees) *"
                  type="number"
                  step="any"
                  value={settingsForm.officeLatitude}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeLatitude: parseFloat(e.target.value) })}
                  required
                />
                <Input
                  label="Office Longitude (Decimal Degrees) *"
                  type="number"
                  step="any"
                  value={settingsForm.officeLongitude}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeLongitude: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Allowed Punch Radius (Meters) *"
                  type="number"
                  value={settingsForm.allowedRadiusMeters}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, allowedRadiusMeters: parseFloat(e.target.value) })
                  }
                  required
                />
                <Input
                  label="Max GPS Accuracy Threshold (Meters) *"
                  type="number"
                  value={settingsForm.gpsAccuracyThresholdMeters}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, gpsAccuracyThresholdMeters: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Official Start Time (HH:MM) *"
                  type="text"
                  placeholder="09:00"
                  value={settingsForm.officeStartTime}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeStartTime: e.target.value })}
                  required
                />
                <Input
                  label="Official End Time (HH:MM) *"
                  type="text"
                  placeholder="18:00"
                  value={settingsForm.officeEndTime}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeEndTime: e.target.value })}
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={savingSettings}
                  className="w-full h-12 rounded-xl font-bold text-sm shadow-md"
                >
                  Save Geofence Configuration
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Holidays Tab */}
      {activeTab === 'holidays' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Official Holidays</h2>
              <p className="text-xs text-muted-foreground">Excluded dates for daily absent marking cron jobs</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowHolidayModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="rounded-xl font-semibold text-xs"
            >
              Add Holiday
            </Button>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm divide-y divide-border/60">
            {holidays.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No official holidays registered yet.
              </div>
            ) : (
              holidays.map((h) => (
                <div key={h.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center border border-pink-500/20">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{h.name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        {new Date(h.date).toLocaleDateString()} {h.description ? `• ${h.description}` : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 rounded-lg p-2"
                    onClick={() => handleDeleteHoliday(h.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Add Holiday Modal */}
          <Modal
            isOpen={showHolidayModal}
            onClose={() => setShowHolidayModal(false)}
            title="Register Official Holiday"
            description="Add a holiday to prevent employees from being marked absent on this date."
          >
            <form onSubmit={handleAddHoliday} className="space-y-4 mt-2">
              <Input
                label="Holiday Name *"
                placeholder="e.g., Independence Day, Diwali"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                required
              />
              <Input
                label="Holiday Date *"
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                required
              />
              <Input
                label="Description (Optional)"
                placeholder="Brief description"
                value={holidayDesc}
                onChange={(e) => setHolidayDesc(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowHolidayModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="rounded-xl font-bold">
                  Save Holiday
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
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
    allowedRadiusMeters: 1000,
    gpsAccuracyThresholdMeters: 100,
    officeStartTime: '09:00',
    officeEndTime: '18:00',
    timezone: 'Asia/Kolkata',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

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
      console.error(e);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get('/admin/employees');
      if (res.data?.success) setAllEmployees(res.data.data.employees || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const res = await api.get('/attendance/history?limit=100');
      if (res.data?.success) setTodayAttendance(res.data.data.records || []);
    } catch (e) {
      console.error(e);
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
      console.error(e);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const res = await api.get('/admin/holidays');
      if (res.data?.success) setHolidays(res.data.data.holidays || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPending(), fetchEmployees(), fetchTodayAttendance(), fetchSettings(), fetchHolidays()]);
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
        setSettingsMsg('Office settings updated successfully.');
      }
    } catch (err: any) {
      setSettingsMsg(err.response?.data?.error?.message || 'Failed to update settings.');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-sans">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="uppercase tracking-widest text-[10px]">Administrator Control Center</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Admin Console
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans">Manage employee approvals, office geofence settings, and attendance records.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAll}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="self-start sm:self-auto rounded-xl font-bold"
        >
          Sync Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-border bg-card rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Approvals</p>
              <p className="font-display text-3xl font-extrabold text-amber-500 tracking-tight">{pendingEmployees.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border bg-card rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Employees</p>
              <p className="font-display text-3xl font-extrabold text-foreground tracking-tight">{allEmployees.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border bg-card rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Today's Check-Ins</p>
              <p className="font-display text-3xl font-extrabold text-emerald-500 tracking-tight">{todayAttendance.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border bg-card rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Geofence Radius</p>
              <p className="font-mono text-3xl font-extrabold text-primary tracking-tight">{settings?.allowedRadiusMeters || 2000}m</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Nav */}
      <div className="flex rounded-2xl bg-muted/60 p-1.5 border border-border/60 backdrop-blur-md overflow-x-auto">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === 'approvals'
              ? 'bg-card text-foreground shadow-md border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          Pending Approvals
          {pendingEmployees.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
              {pendingEmployees.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === 'employees'
              ? 'bg-card text-foreground shadow-md border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4 text-primary" />
          Employee Directory
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-card text-foreground shadow-md border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          Attendance Feed
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-card text-foreground shadow-md border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-4 h-4 text-purple-400" />
          Geofence Settings
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
            activeTab === 'holidays'
              ? 'bg-card text-foreground shadow-md border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="w-4 h-4 text-pink-500" />
          Holidays
        </button>
      </div>

      {/* Tab Content */}

      {/* Tab Content */}
      {activeTab === 'approvals' && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Pending Employee Approvals</CardTitle>
            <CardDescription>Review and approve new employee registrations.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingEmployees.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">No pending approval requests.</div>
            ) : (
              <div className="divide-y divide-border">
                {pendingEmployees.map((emp) => (
                  <div key={emp.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-foreground text-base">{emp.fullName || emp.email}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {emp.email} • Dept: <span className="font-semibold text-foreground">{emp.department || 'N/A'}</span> • Desig:{' '}
                        <span className="font-semibold text-foreground">{emp.designation || 'N/A'}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">Phone: {emp.phoneNumber || 'N/A'} • Age: {emp.age || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => handleApprove(emp.id)}
                        leftIcon={<Check className="w-4 h-4" />}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(emp.id)}
                        leftIcon={<X className="w-4 h-4" />}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'employees' && (
        <Card className="border-border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Employee Directory</CardTitle>
              <CardDescription>All registered employees and status details.</CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Department</th>
                    <th className="py-3 px-2">Designation</th>
                    <th className="py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allEmployees
                    .filter((e) => e.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || e.email.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((emp) => (
                      <tr key={emp.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2 font-semibold text-foreground">{emp.fullName || '—'}</td>
                        <td className="py-3 px-2 font-mono text-muted-foreground">{emp.email}</td>
                        <td className="py-3 px-2">{emp.department || '—'}</td>
                        <td className="py-3 px-2">{emp.designation || '—'}</td>
                        <td className="py-3 px-2">
                          <Badge variant={emp.status}>{emp.status}</Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'attendance' && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Today's Attendance Logs</CardTitle>
            <CardDescription>Live attendance records submitted by employees today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Employee</th>
                    <th className="py-3 px-2">Check In</th>
                    <th className="py-3 px-2">Check Out</th>
                    <th className="py-3 px-2">Working Hours</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Late Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {todayAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 font-semibold text-foreground">
                        {new Date(rec.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 font-semibold text-foreground">
                        {rec.employee ? rec.employee.fullName || rec.employee.email : '—'}
                      </td>
                      <td className="py-3 px-2">
                        {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-2">
                        {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-2 font-mono">{rec.formattedHours || '—'}</td>
                      <td className="py-3 px-2">
                        <Badge variant={rec.status}>{rec.status}</Badge>
                      </td>
                      <td className="py-3 px-2 italic text-muted-foreground max-w-xs truncate">{rec.lateReason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card className="border-border max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Office Geofence & Timing Configuration</CardTitle>
            <CardDescription>Configure office coordinates, GPS accuracy threshold, and work hours.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              {settingsMsg && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                  {settingsMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Office Latitude *"
                  type="number"
                  step="any"
                  value={settingsForm.officeLatitude}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeLatitude: parseFloat(e.target.value) })}
                  required
                />
                <Input
                  label="Office Longitude *"
                  type="number"
                  step="any"
                  value={settingsForm.officeLongitude}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeLongitude: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Allowed Radius (Meters) *"
                  type="number"
                  value={settingsForm.allowedRadiusMeters}
                  onChange={(e) => setSettingsForm({ ...settingsForm, allowedRadiusMeters: parseFloat(e.target.value) })}
                  required
                />
                <Input
                  label="Max GPS Accuracy Threshold (Meters) *"
                  type="number"
                  value={settingsForm.gpsAccuracyThresholdMeters}
                  onChange={(e) => setSettingsForm({ ...settingsForm, gpsAccuracyThresholdMeters: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Office Start Time (HH:MM) *"
                  type="text"
                  placeholder="09:00"
                  value={settingsForm.officeStartTime}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeStartTime: e.target.value })}
                  required
                />
                <Input
                  label="Office End Time (HH:MM) *"
                  type="text"
                  placeholder="18:00"
                  value={settingsForm.officeEndTime}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeEndTime: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" variant="primary" isLoading={savingSettings} className="w-full">
                Save Office Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'holidays' && (
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg font-bold">Office Holidays</CardTitle>
              <CardDescription>Manage official holidays for absent cron job logic.</CardDescription>
            </div>
            <Button size="sm" variant="primary" onClick={() => setShowHolidayModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Holiday
            </Button>
          </CardHeader>
          <CardContent>
            {holidays.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs">No holidays configured yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {holidays.map((h) => (
                  <div key={h.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{h.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Date: {new Date(h.date).toLocaleDateString()} {h.description ? `• ${h.description}` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive p-2" onClick={() => handleDeleteHoliday(h.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Add Holiday Modal */}
          <Modal
            isOpen={showHolidayModal}
            onClose={() => setShowHolidayModal(false)}
            title="Add Official Holiday"
            description="Add a holiday to prevent absent status marking for employees."
          >
            <form onSubmit={handleAddHoliday} className="space-y-4 mt-2">
              <Input
                label="Holiday Name *"
                placeholder="e.g., Independence Day, Diwaali"
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
                <Button type="button" variant="outline" onClick={() => setShowHolidayModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Holiday
                </Button>
              </div>
            </form>
          </Modal>
        </Card>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { LiveTimer } from '../components/attendance/LiveTimer';
import { CheckInButton } from '../components/attendance/CheckInButton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  MapPin,
  Calendar,
  Clock,
  History,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Radio,
  Building,
  Briefcase,
  Timer,
  Compass,
  Sparkles,
} from 'lucide-react';
import { api } from '../utils/api';
import { AttendanceRecord } from '../types';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayData, setTodayData] = useState<{
    attendance: AttendanceRecord | null;
    buttonState: 'CAN_CHECK_IN' | 'CAN_CHECK_OUT' | 'CHECKED_OUT' | 'LATE_REASON_REQUIRED';
    officeSettings: any;
  } | null>(null);

  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);

  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data?.success) {
        setTodayData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching today attendance status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/attendance/history?limit=5');
      if (res.data?.success) {
        setHistoryRecords(res.data.data.records || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTodayStatus(), fetchHistory()]);
    setLoading(false);
  }, [fetchTodayStatus, fetchHistory]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRefresh = () => {
    loadAll();
  };

  const isCheckedIn = !!todayData?.attendance?.checkInTime && !todayData?.attendance?.checkOutTime;
  const isCheckedOut = !!todayData?.attendance?.checkOutTime;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden bg-card/80 backdrop-blur-md rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-primary" />
              <span className="uppercase tracking-wider text-[11px]">Employee Presence Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Welcome, {user?.fullName || user?.email?.split('@')[0]}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="inline-flex items-center gap-1.5 bg-muted/60 px-3 py-1 rounded-lg border border-border/60 text-xs font-medium text-foreground">
                <Building className="w-3.5 h-3.5 text-primary" />
                {user?.department || 'General Staff'}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-muted/60 px-3 py-1 rounded-lg border border-border/60 text-xs font-medium text-foreground">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                {user?.designation || 'Staff Member'}
              </span>
              <Badge variant={user?.status || 'approved'}>{user?.status || 'approved'}</Badge>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="self-start sm:self-auto rounded-xl font-semibold shadow-sm"
          >
            Sync Status
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Shift Status */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shift Status</span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isCheckedIn
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : isCheckedOut
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {isCheckedIn ? 'Active Shift' : isCheckedOut ? 'Shift Done' : 'Not Punched'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isCheckedIn
                ? `In at ${new Date(todayData!.attendance!.checkInTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : isCheckedOut
                ? 'Completed for today'
                : 'Ready to punch in'}
            </p>
          </div>
        </div>

        {/* 2. Today's Hours */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logged Hours</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary font-mono">
              {todayData?.attendance?.formattedHours || (isCheckedIn ? 'Recording...' : '0h 0m')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Daily shift accumulation</p>
          </div>
        </div>

        {/* 3. Punctuality */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Punctuality</span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                todayData?.attendance?.isLate
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              }`}
            >
              {todayData?.attendance?.isLate ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold font-mono ${
                todayData?.attendance?.isLate ? 'text-amber-500' : 'text-emerald-500'
              }`}
            >
              {todayData?.attendance ? (todayData.attendance.isLate ? 'Late Arrival' : 'On Schedule') : 'Pending In'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Start time: {todayData?.officeSettings?.officeStartTime || '09:00'}
            </p>
          </div>
        </div>

        {/* 4. Geofence Status */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Geofence Radius</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400 font-mono">
              {todayData?.officeSettings?.allowedRadiusMeters || 2000}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">GPS geofence radius</p>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (2-Cols on Large Screens, 1-Col on Tablets/Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Live Radar Clock & Punch Console */}
        <div className="lg:col-span-2 space-y-6">
          <LiveTimer
            checkInTime={todayData?.attendance?.checkInTime}
            checkOutTime={todayData?.attendance?.checkOutTime}
          />

          <Card className="p-6 sm:p-8">
            <CardHeader className="p-0 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Compass className="w-5 h-5 text-primary" />
                    Attendance Punch Terminal
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Verified geolocation is required to punch check-in and check-out.
                  </CardDescription>
                </div>
                {todayData?.attendance?.status && (
                  <Badge variant={todayData.attendance.status}>{todayData.attendance.status}</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {todayData ? (
                <CheckInButton
                  buttonState={todayData.buttonState}
                  attendanceRecord={todayData.attendance}
                  officeSettings={todayData.officeSettings}
                  onSuccess={handleRefresh}
                />
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                  Syncing terminal coordinates...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Punch Timestamp Breakdown */}
          {todayData?.attendance && (
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Today's Punch Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Punch In</p>
                  <p className="font-bold text-sm text-foreground font-mono">
                    {todayData.attendance.checkInTime
                      ? new Date(todayData.attendance.checkInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Punch Out</p>
                  <p className="font-bold text-sm text-foreground font-mono">
                    {todayData.attendance.checkOutTime
                      ? new Date(todayData.attendance.checkOutTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Duration</p>
                  <p className="font-bold text-sm text-primary font-mono">
                    {todayData.attendance.formattedHours || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Punctuality</p>
                  <p
                    className={`font-bold text-sm font-mono ${
                      todayData.attendance.isLate ? 'text-amber-500' : 'text-emerald-500'
                    }`}
                  >
                    {todayData.attendance.isLate ? 'Late' : 'On Time'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Office Geofence Rules & Recent Attendance History */}
        <div className="space-y-6">
          {/* Office Rules */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Office Geofence Info
            </h3>
            <div className="divide-y divide-border/60 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground font-medium">Shift Timings</span>
                <span className="font-bold font-mono text-foreground">
                  {todayData?.officeSettings?.officeStartTime || '09:00'} -{' '}
                  {todayData?.officeSettings?.officeEndTime || '18:00'}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground font-medium">Verification Radius</span>
                <span className="font-bold text-foreground">
                  Within {todayData?.officeSettings?.allowedRadiusMeters || 2000}m
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground font-medium">Max GPS Accuracy</span>
                <span className="font-bold text-foreground">
                  {todayData?.officeSettings?.gpsAccuracyThresholdMeters || 500}m threshold
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-muted-foreground font-medium">Timezone</span>
                <span className="font-bold text-foreground font-mono">
                  {todayData?.officeSettings?.timezone || 'Asia/Kolkata'}
                </span>
              </div>
            </div>
          </div>

          {/* Recent History Feed */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Recent Punches
              </h3>
              <span className="text-xs font-mono text-muted-foreground">Last 5 logs</span>
            </div>

            <div className="divide-y divide-border/60">
              {historyRecords.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">No attendance history records.</p>
              ) : (
                historyRecords.map((r) => (
                  <div
                    key={r.id}
                    className="py-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-foreground">
                        {new Date(r.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-muted-foreground text-[11px] font-mono mt-0.5">
                        {r.checkInTime
                          ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}{' '}
                        →{' '}
                        {r.checkOutTime
                          ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </p>
                    </div>
                    <Badge variant={r.status}>{r.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

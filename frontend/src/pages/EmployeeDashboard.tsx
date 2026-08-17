import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { LiveTimer } from '../components/attendance/LiveTimer';
import { CheckInButton } from '../components/attendance/CheckInButton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { MapPin, Calendar, Clock, History, RefreshCw, AlertCircle, CheckCircle, ShieldCheck, Radio, Building, Briefcase } from 'lucide-react';
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

  useEffect(() => {
    fetchTodayStatus();
    fetchHistory();
  }, [fetchTodayStatus, fetchHistory]);

  const handleRefresh = () => {
    setLoading(true);
    fetchTodayStatus();
    fetchHistory();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header Telemetry Banner */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-card p-6 sm:p-8 rounded-xl border border-border">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-sans">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="uppercase tracking-widest text-[10px]">Chrono Telemetry Terminal</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-normal tracking-tighter text-foreground">
            Welcome, {user?.fullName || user?.email}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1 rounded-xl border border-border">
              <Building className="w-3.5 h-3.5 text-primary" />
              {user?.department || 'General Department'}
            </span>
            <span className="flex items-center gap-1.5 bg-muted/60 px-3 py-1 rounded-xl border border-border">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              {user?.designation || 'Employee'}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="self-start sm:self-auto rounded-xl font-bold"
        >
          Sync Status
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Signature Live Timer & Punch Action */}
        <div className="lg:col-span-2 space-y-6">
          <LiveTimer
            checkInTime={todayData?.attendance?.checkInTime}
            checkOutTime={todayData?.attendance?.checkOutTime}
          />

          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Today's Punch Console
                </span>
                {todayData?.attendance?.status && (
                  <Badge variant={todayData.attendance.status}>{todayData.attendance.status}</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Ensure device location access is granted to punch attendance within verified office radius.
              </CardDescription>
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
                <div className="py-10 text-center text-xs text-muted-foreground font-medium animate-pulse">
                  Syncing attendance status...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Punch Summary Details */}
          {todayData?.attendance && (
            <Card className="p-6">
            <CardHeader className="p-0 pb-4">
                <CardTitle>Shift Telemetry Log</CardTitle>
              </CardHeader>
              <CardContent className="p-0 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center space-y-1 hover:border-primary/50 transition-colors shadow-sm relative overflow-hidden group">
                  <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Clock className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest relative z-10">Check In</p>
                  <p className="font-bold text-lg text-foreground font-mono relative z-10">
                    {todayData.attendance.checkInTime
                      ? new Date(todayData.attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center space-y-1 hover:border-primary/50 transition-colors shadow-sm relative overflow-hidden group">
                  <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <History className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest relative z-10">Check Out</p>
                  <p className="font-bold text-lg text-foreground font-mono relative z-10">
                    {todayData.attendance.checkOutTime
                      ? new Date(todayData.attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center space-y-1 hover:border-primary/50 transition-colors shadow-sm relative overflow-hidden group">
                  <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest relative z-10">Hours</p>
                  <p className="font-extrabold text-lg text-foreground font-mono relative z-10">
                    {todayData.attendance.formattedHours || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border flex flex-col items-center justify-center text-center space-y-1 hover:border-primary/50 transition-colors shadow-sm relative overflow-hidden group">
                  <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <AlertCircle className={`w-12 h-12 ${todayData.attendance.isLate ? 'text-amber-500' : 'text-emerald-500'}`} />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest relative z-10">Punctuality</p>
                  <p className={`font-extrabold text-lg relative z-10 ${todayData.attendance.isLate ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {todayData.attendance.isLate ? 'Late' : 'On Time'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Col: Office Settings & Recent History */}
        <div className="space-y-6">
          {/* Office Rules */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Office Geofence Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-semibold">Office Shift Hours</span>
                <span className="font-bold font-mono text-foreground">
                  {todayData?.officeSettings?.officeStartTime} - {todayData?.officeSettings?.officeEndTime}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-semibold">Geofence Radius</span>
                <span className="font-bold text-foreground">
                  Within {todayData?.officeSettings?.allowedRadiusMeters || 2000} meters
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-semibold">Max GPS Accuracy</span>
                <span className="font-bold text-foreground">
                  {todayData?.officeSettings?.gpsAccuracyThresholdMeters || 500} meters
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground font-semibold">Office Coordinates</span>
                <span className="font-mono text-[11px] font-bold text-foreground">
                  {todayData?.officeSettings?.officeLatitude?.toFixed(4)}, {todayData?.officeSettings?.officeLongitude?.toFixed(4)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Punch History */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Recent History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {historyRecords.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No attendance history records.</p>
              ) : (
                historyRecords.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30 text-xs hover:border-primary/40 transition-all"
                  >
                    <div>
                      <p className="font-bold text-foreground">
                        {new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-muted-foreground text-[11px] font-mono mt-0.5">
                        {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}{' '}
                        to{' '}
                        {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                    </div>
                    <Badge variant={r.status}>{r.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

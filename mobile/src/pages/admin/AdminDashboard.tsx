import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, Users, CheckCircle, Clock, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';
import { User, AttendanceRecord } from '../../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingEmployees, setPendingEmployees] = useState<User[]>([]);
  const [allEmployees, setAllEmployees] = useState<User[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, empRes, attRes] = await Promise.all([
        api.get('/admin/pending-employees'),
        api.get('/admin/employees'),
        api.get('/attendance/history?limit=50'),
      ]);

      if (pendingRes.data?.success) setPendingEmployees(pendingRes.data.data.employees || []);
      if (empRes.data?.success) setAllEmployees(empRes.data.data.employees || []);
      if (attRes.data?.success) setTodayRecords(attRes.data.data.records || []);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const presentCount = todayRecords.filter((r) => r.status === 'present').length;
  const lateCount = todayRecords.filter((r) => r.status === 'late').length;
  const absentCount = todayRecords.filter((r) => r.status === 'absent').length;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 px-4 pt-4 space-y-4 font-sans">
      {/* Admin Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Console</span>
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Workspace Overview</h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          isLoading={loading}
          className="rounded-2xl h-10 px-3 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sync
        </Button>
      </div>

      {/* Pending Employees Top Banner */}
      {pendingEmployees.length > 0 && (
        <Card
          onClick={() => navigate('/admin/employees')}
          className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-amber-500/30 rounded-3xl cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-foreground">
                  {pendingEmployees.length} Pending Approval{pendingEmployees.length > 1 ? 's' : ''}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">Tap to review registrations</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-500" />
          </div>
        </Card>
      )}

      {/* 2x2 Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 border-border bg-card rounded-3xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Present</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{presentCount}</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Checked in on-time</p>
        </Card>

        <Card className="p-4 border-border bg-card rounded-3xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Late</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">{lateCount}</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">With justification</p>
        </Card>

        <Card className="p-4 border-border bg-card rounded-3xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Absent</span>
            <Clock className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-3xl font-black text-destructive font-mono mt-1">{absentCount}</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Unexcused / Leave</p>
        </Card>

        <Card className="p-4 border-border bg-card rounded-3xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Roster</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-black text-foreground font-mono mt-1">{allEmployees.length}</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Total Employees</p>
        </Card>
      </div>

      {/* Today's Activity Feed List */}
      <Card className="p-4 border-border bg-card shadow-xs rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-foreground">Today's Live Attendance Feed</h3>
          <span className="text-[10px] text-muted-foreground font-medium">{todayRecords.length} records</span>
        </div>

        <div className="divide-y divide-border/60">
          {todayRecords.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No check-ins recorded today yet.</p>
          ) : (
            todayRecords.slice(0, 10).map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      r.employee?.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.employee?.fullName || 'User')}`
                    }
                    alt={r.employee?.fullName || 'Employee'}
                    className="w-8 h-8 rounded-full border border-border bg-muted object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{r.employee?.fullName || r.employee?.email}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      In: {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                </div>

                <Badge variant={r.status}>{r.status}</Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

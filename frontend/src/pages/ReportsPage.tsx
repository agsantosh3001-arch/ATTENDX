import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { BarChart3, Download, FileSpreadsheet, FileText, Calendar, RefreshCw, Users, Clock, AlertTriangle, PieChart, TrendingUp } from 'lucide-react';
import { api, getStoredToken } from '../utils/api';
import { ChartConfig, ChartContainer, ChartTooltip } from '../components/ui/line-charts-9';
import { CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';

const chartConfig: ChartConfig = {
  totalHours: {
    label: 'Total Working Hours',
    color: '#8b5cf6',
  },
  present: {
    label: 'Present Employees',
    color: '#10b981',
  },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-xs">
        <div className="text-muted-foreground font-medium mb-1">{data.date}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-violet-500">Working Hours:</span>
            <span className="font-semibold text-foreground">{data.totalHours || 0} hrs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-500">Present Count:</span>
            <span className="font-semibold text-foreground">{data.present || 0} employees</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ReportsPage: React.FC = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [department, setDepartment] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/reports/analytics?month=${month}&year=${year}`;
      if (department) url += `&department=${department}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year, department]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDownload = (formatType: 'pdf' | 'csv' | 'excel') => {
    const token = getStoredToken();
    const url = `/api/reports/export/${formatType}?month=${month}&year=${year}`;
    
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        const ext = formatType === 'excel' ? 'xlsx' : formatType;
        a.download = `attendance_report_${year}_${month}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert('Failed to download report: ' + err.message));
  };

  const statusTotal = analytics
    ? analytics.statusBreakdown.present +
      analytics.statusBreakdown.late +
      analytics.statusBreakdown.halfDay +
      analytics.statusBreakdown.absent
    : 0;

  const trendData = analytics?.dailyTrend && analytics.dailyTrend.length > 0
    ? analytics.dailyTrend
    : [
        { date: 'Day 1', totalHours: 8, present: 1 },
        { date: 'Day 2', totalHours: 16, present: 2 },
        { date: 'Day 3', totalHours: 12, present: 2 },
      ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-sans">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="uppercase tracking-widest text-[10px]">Workforce Analytics & Export Hub</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Reports & Analytics Hub
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans">
            Generate monthly attendance reports, analyze departmental working hours, and export CSV/Excel/PDF documents.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="self-start sm:self-auto rounded-xl font-bold"
        >
          Sync Data
        </Button>
      </div>

      {/* Filter & Export Bar */}
      <Card className="p-5 border-border bg-card rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Select Month</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2026, m - 1, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Select Year</label>
                <select
                  className="flex h-11 w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>

              <Input
                label="Department Filter (Optional)"
                placeholder="e.g. Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
              <Button
                variant="accent"
                onClick={() => handleDownload('pdf')}
                leftIcon={<FileText className="w-4 h-4" />}
                className="rounded-xl font-bold"
              >
                Export PDF
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDownload('excel')}
                leftIcon={<FileSpreadsheet className="w-4 h-4" />}
                className="rounded-xl font-bold"
              >
                Export Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownload('csv')}
                leftIcon={<Download className="w-4 h-4" />}
                className="rounded-xl font-bold"
              >
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Active Employees</p>
              <p className="text-2xl font-bold text-foreground mt-1">{analytics?.totalEmployees || 0}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Working Hours</p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">{analytics?.totalWorkingHours || 0} hrs</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Avg Hours / Employee</p>
              <p className="text-2xl font-bold text-blue-500 mt-1">{analytics?.avgWorkingHoursPerEmployee || 0} hrs</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Late Check-Ins</p>
              <p className="text-2xl font-bold text-amber-500 mt-1">{analytics?.statusBreakdown?.late || 0}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Employee Attendance & Working Hours Line Chart Card (line-charts-9 style) */}
      <Card className="border-border w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Daily Employee Attendance & Working Hours Trend
              </CardTitle>
              <CardDescription>Visualizing daily cumulative working hours and active employee attendance.</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-violet-500" />
                <span className="text-muted-foreground">Working Hours</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Present Employees</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="h-80 w-full [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
          >
            <ComposedChart
              data={trendData}
              margin={{
                top: 20,
                right: 20,
                left: 10,
                bottom: 20,
              }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill="var(--input)" fillOpacity="0.3" />
                </pattern>
                <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.8)" />
                </filter>
                <filter id="lineShadow" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow dx="4" dy="6" stdDeviation="25" floodColor="rgba(139, 92, 246, 0.9)" />
                </filter>
              </defs>

              <rect x="0" y="0" width="100%" height="100%" fill="url(#dotGrid)" style={{ pointerEvents: 'none' }} />

              <CartesianGrid
                strokeDasharray="4 8"
                stroke="var(--input)"
                strokeOpacity={1}
                horizontal={true}
                vertical={false}
              />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickMargin={15}
                interval="preserveStartEnd"
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickFormatter={(val) => `${val} hrs`}
                tickMargin={15}
              />

              <ChartTooltip
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: '3 3', stroke: 'var(--muted-foreground)', strokeOpacity: 0.5 }}
              />

              <Line
                type="monotone"
                dataKey="totalHours"
                name="totalHours"
                stroke="#8b5cf6"
                strokeWidth={3}
                filter="url(#lineShadow)"
                activeDot={{
                  r: 6,
                  fill: '#8b5cf6',
                  stroke: 'white',
                  strokeWidth: 2,
                  filter: 'url(#dotShadow)',
                }}
              />

              <Line
                type="monotone"
                dataKey="present"
                name="present"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4 4"
                activeDot={{
                  r: 5,
                  fill: '#10b981',
                  stroke: 'white',
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Ratio Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Attendance Status Distribution
            </CardTitle>
            <CardDescription>Breakdown of attendance statuses logged for selected period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {analytics ? (
              <>
                {/* Visual Progress Bar Chart */}
                <div className="h-6 w-full rounded-full bg-muted overflow-hidden flex shadow-inner border border-border">
                  <div
                    style={{ width: `${statusTotal ? (analytics.statusBreakdown.present / statusTotal) * 100 : 0}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Present: ${analytics.statusBreakdown.present}`}
                  />
                  <div
                    style={{ width: `${statusTotal ? (analytics.statusBreakdown.late / statusTotal) * 100 : 0}%` }}
                    className="bg-amber-500 h-full transition-all"
                    title={`Late: ${analytics.statusBreakdown.late}`}
                  />
                  <div
                    style={{ width: `${statusTotal ? (analytics.statusBreakdown.halfDay / statusTotal) * 100 : 0}%` }}
                    className="bg-blue-500 h-full transition-all"
                    title={`Half Day: ${analytics.statusBreakdown.halfDay}`}
                  />
                  <div
                    style={{ width: `${statusTotal ? (analytics.statusBreakdown.absent / statusTotal) * 100 : 0}%` }}
                    className="bg-rose-500 h-full transition-all"
                    title={`Absent: ${analytics.statusBreakdown.absent}`}
                  />
                </div>

                {/* Legend items */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <p className="font-semibold">Present</p>
                    <p className="text-lg font-extrabold mt-0.5">{analytics.statusBreakdown.present}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <p className="font-semibold">Late</p>
                    <p className="text-lg font-extrabold mt-0.5">{analytics.statusBreakdown.late}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <p className="font-semibold">Half Day</p>
                    <p className="text-lg font-extrabold mt-0.5">{analytics.statusBreakdown.halfDay}</p>
                  </div>
                  <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <p className="font-semibold">Absent</p>
                    <p className="text-lg font-extrabold mt-0.5">{analytics.statusBreakdown.absent}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Loading analytics chart...</p>
            )}
          </CardContent>
        </Card>

        {/* Department Hours Breakdown */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Hours Worked By Department
            </CardTitle>
            <CardDescription>Aggregated working hours logged across departments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics?.departmentBreakdown?.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No department records for selected month.</p>
            ) : (
              analytics?.departmentBreakdown?.map((dept: any) => (
                <div key={dept.department} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">{dept.department}</span>
                    <span className="text-primary font-mono">{dept.totalHours} hrs ({dept.presentCount} records)</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          analytics.totalWorkingHours > 0 ? (dept.totalHours / analytics.totalWorkingHours) * 100 : 0
                        )}%`,
                      }}
                      className="bg-primary h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

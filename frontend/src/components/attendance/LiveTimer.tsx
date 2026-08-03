import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Play, Timer, Radio, Compass } from 'lucide-react';

interface LiveTimerProps {
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

export const LiveTimer: React.FC<LiveTimerProps> = ({ checkInTime: propCheckInTime, checkOutTime }) => {
  const [now, setNow] = useState(new Date());

  // Use prop checkInTime or stored fallback for instant continuity across browser sessions
  const activeCheckIn = propCheckInTime || (typeof window !== 'undefined' ? localStorage.getItem('attendx_active_check_in_time') : null);

  useEffect(() => {
    if (propCheckInTime && !checkOutTime) {
      localStorage.setItem('attendx_active_check_in_time', propCheckInTime);
    } else if (checkOutTime) {
      localStorage.removeItem('attendx_active_check_in_time');
    }
  }, [propCheckInTime, checkOutTime]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedTime = () => {
    if (!activeCheckIn) return null;
    const start = new Date(activeCheckIn).getTime();
    const end = checkOutTime ? new Date(checkOutTime).getTime() : now.getTime();
    const diffSeconds = Math.max(0, Math.floor((end - start) / 1000));

    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    return {
      h: String(hours).padStart(2, '0'),
      m: String(minutes).padStart(2, '0'),
      s: String(seconds).padStart(2, '0'),
    };
  };

  const elapsed = getElapsedTime();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card chrono-radar-bg p-6 sm:p-8 text-center shadow-xl">
      {/* Ambient Radar Ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-primary/40 animate-ping" style={{ animationDuration: '6s' }} />
      </div>

      <div className="relative z-10 space-y-4">
        {/* Top Telemetry Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold font-sans tracking-wide">
          <Radio className="w-3.5 h-3.5 animate-pulse text-primary" />
          <span className="uppercase tracking-widest text-[10px]">Chrono Telemetry Radar</span>
        </div>

        {/* Live Clock Display */}
        <div className="space-y-1">
          <div className="text-4xl sm:text-6xl font-black tracking-tight text-foreground font-mono drop-shadow-sm">
            {format(now, 'hh:mm:ss')}
            <span className="text-lg sm:text-2xl font-bold text-muted-foreground ml-2 uppercase font-sans">
              {format(now, 'a')}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-muted-foreground font-sans uppercase tracking-wider">
            {format(now, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Active Shift Elapsed Timer Banner */}
        {activeCheckIn && elapsed && (
          <div className="pt-6 border-t border-border/60 w-full max-w-lg mx-auto space-y-3">
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                  <Timer className="w-5 h-5" />
                </div>
                <div className="text-left font-sans">
                  <p className="text-xs font-extrabold text-foreground">Shift Worked Today</p>
                  <p className="text-[11px] text-muted-foreground">
                    Punched in at {format(new Date(activeCheckIn), 'hh:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 font-mono text-xl sm:text-2xl font-black text-foreground">
                <span className="bg-card px-2.5 py-1 rounded-xl border border-border shadow-xs">{elapsed.h}</span>
                <span className="text-muted-foreground">:</span>
                <span className="bg-card px-2.5 py-1 rounded-xl border border-border shadow-xs">{elapsed.m}</span>
                <span className="text-muted-foreground">:</span>
                <span className="bg-card px-2.5 py-1 rounded-xl border border-border shadow-xs text-emerald-500">{elapsed.s}</span>
              </div>
            </div>

            {!checkOutTime && (
              <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-500 font-bold bg-emerald-500/10 py-1.5 px-3 rounded-full border border-emerald-500/20 font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Shift Active — Timer running continuously across devices</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

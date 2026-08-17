import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Radio, Timer, Sparkles } from 'lucide-react';

interface LiveTimerProps {
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

export const LiveTimer: React.FC<LiveTimerProps> = ({ checkInTime: propCheckInTime, checkOutTime }) => {
  const [now, setNow] = useState(new Date());

  const activeCheckIn =
    propCheckInTime ||
    (typeof window !== 'undefined' ? localStorage.getItem('attendx_active_check_in_time') : null);

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
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md p-6 sm:p-8 text-center shadow-sm">
      <div className="relative z-10 space-y-4">
        {/* Telemetry Radar Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 animate-pulse text-primary" />
          <span className="uppercase tracking-wider text-[10px]">Chrono Telemetry Terminal</span>
        </div>

        {/* Real-time Clock */}
        <div className="space-y-1">
          <div className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground font-mono">
            {format(now, 'hh:mm:ss')}
            <span className="text-base sm:text-xl font-semibold text-muted-foreground ml-2 font-sans uppercase">
              {format(now, 'a')}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            {format(now, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Active Shift Running Elapsed Counter */}
        {activeCheckIn && elapsed && (
          <div className="pt-5 border-t border-border/60 w-full max-w-md mx-auto space-y-3">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Active Shift Elapsed</p>
                  <p className="text-[11px] text-muted-foreground">
                    Punched in at {format(new Date(activeCheckIn), 'hh:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 font-mono text-lg sm:text-xl font-bold text-foreground shrink-0">
                <span className="bg-card px-2 py-0.5 rounded-lg border border-border/80">{elapsed.h}</span>
                <span className="text-muted-foreground">:</span>
                <span className="bg-card px-2 py-0.5 rounded-lg border border-border/80">{elapsed.m}</span>
                <span className="text-muted-foreground">:</span>
                <span className="bg-card px-2 py-0.5 rounded-lg border border-border/80 text-emerald-500">{elapsed.s}</span>
              </div>
            </div>

            {!checkOutTime && (
              <div className="inline-flex items-center gap-2 text-[11px] text-emerald-500 font-semibold bg-emerald-500/10 py-1 px-3 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Shift running live across all devices</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTimer;

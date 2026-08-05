import React, { useState, useEffect } from 'react';

interface LiveTimerProps {
  checkInTime: string;
  isLate?: boolean;
}

export const LiveTimer: React.FC<LiveTimerProps> = React.memo(({ checkInTime, isLate }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const checkInDate = new Date(checkInTime).getTime();
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - checkInDate) / 1000));
      setElapsedSeconds(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [checkInTime]);

  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const formatted = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="space-y-1 py-1">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Elapsed Shift Duration</p>
      <p className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-foreground">
        {formatted}
      </p>
      <p className="text-xs font-semibold text-muted-foreground pt-1">
        Checked in at {new Date(checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
});

LiveTimer.displayName = 'LiveTimer';

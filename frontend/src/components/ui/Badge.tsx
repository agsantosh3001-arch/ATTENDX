import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'present' | 'late' | 'absent' | 'half_day' | 'approved' | 'pending' | 'rejected' | 'deactivated' | 'outline' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className, ...props }) => {
  const variants = {
    default: 'bg-primary/10 text-primary border-primary/30',
    outline: 'border border-border text-foreground bg-card/60',
    present: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    late: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    half_day: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    absent: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    rejected: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    deactivated: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors uppercase tracking-wider',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

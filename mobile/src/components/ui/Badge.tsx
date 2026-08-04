import React from 'react';

interface BadgeProps {
  variant?: 'present' | 'late' | 'absent' | 'half_day' | 'pending' | 'approved' | 'rejected' | 'deactivated' | 'default';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold capitalize border';

  const variants = {
    present: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    late: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    absent: 'bg-destructive/10 text-destructive border-destructive/20',
    half_day: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    deactivated: 'bg-muted text-muted-foreground border-border',
    default: 'bg-primary/10 text-primary border-primary/20',
  };

  return <span className={`${base} ${variants[variant] || variants.default} ${className}`}>{children}</span>;
};

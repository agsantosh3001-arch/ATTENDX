import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={clsx('animate-pulse rounded-md bg-muted/80 dark:bg-muted/40', className)}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-border p-6 space-y-4 bg-card">
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-20 w-full" />
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);

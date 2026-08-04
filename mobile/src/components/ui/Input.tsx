import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="text-xs font-bold text-foreground">{label}</label>}
      <input
        className={`flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
          error ? 'border-destructive' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] font-semibold text-destructive">{error}</p>}
    </div>
  );
};

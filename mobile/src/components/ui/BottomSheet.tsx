import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  isUndismissable?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  isUndismissable = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!isUndismissable && onClose) onClose();
        }}
      />

      {/* Sheet Content */}
      <div className="relative w-full max-w-lg bg-card border-t border-border rounded-t-3xl shadow-2xl p-6 z-10 animate-in slide-in-from-bottom duration-300">
        {/* Handle Bar */}
        <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-4" />

        {title && (
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
            <h3 className="text-base font-bold text-foreground font-sans">{title}</h3>
            {!isUndismissable && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className="max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

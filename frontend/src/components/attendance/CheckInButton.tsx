import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { showToast } from '../ui/Toast';
import { MapPin, LogIn, LogOut, CheckCircle2, AlertCircle, RefreshCw, Radio, Compass } from 'lucide-react';
import { api } from '../../utils/api';

interface CheckInButtonProps {
  buttonState: 'CAN_CHECK_IN' | 'CAN_CHECK_OUT' | 'CHECKED_OUT' | 'LATE_REASON_REQUIRED';
  attendanceRecord?: any;
  officeSettings?: any;
  onSuccess: () => void;
}

export const CheckInButton: React.FC<CheckInButtonProps> = ({
  buttonState,
  attendanceRecord,
  officeSettings,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLateModal, setShowLateModal] = useState(false);
  const [lateReason, setLateReason] = useState('');
  const [pendingGps, setPendingGps] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);

  const getPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      setGpsStatus('Acquiring verified GPS coordinates...');
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => {
          let message = 'Failed to acquire GPS location.';
          if (err.code === err.PERMISSION_DENIED) message = 'GPS permission denied. Please enable location access in browser settings.';
          if (err.code === err.POSITION_UNAVAILABLE) message = 'GPS signal unavailable. Please ensure GPS/Location is enabled.';
          if (err.code === err.TIMEOUT) message = 'GPS request timed out. Please try again.';
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 15000 }
      );
    });
  };

  const handleAction = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const pos = await getPosition();
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
      };

      setGpsStatus(`GPS Verified (${coords.accuracy}m accuracy). Syncing...`);

      if (buttonState === 'CAN_CHECK_IN') {
        const res = await api.post('/attendance/check-in', coords);
        if (res.data?.success) {
          showToast('success', 'Checked In Successfully!', 'Your attendance punch-in has been logged.');
          onSuccess();
        }
      } else if (buttonState === 'CAN_CHECK_OUT') {
        const res = await api.post('/attendance/check-out', coords);
        if (res.data?.success) {
          showToast('success', 'Checked Out Successfully!', 'Your total shift working hours have been finalized.');
          onSuccess();
        }
      }
    } catch (err: any) {
      if (err.response?.data?.error?.code === 'LATE_REASON_REQUIRED') {
        setPendingGps(err.response.data.error.details || null);
        setShowLateModal(true);
      } else {
        const msg = err.response?.data?.error?.message || err.message || 'An unexpected error occurred.';
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
      setGpsStatus(null);
    }
  };

  const handleLateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lateReason.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      if (buttonState === 'LATE_REASON_REQUIRED' && attendanceRecord?.id) {
        await api.post('/attendance/late-reason', {
          attendanceId: attendanceRecord.id,
          lateReason,
        });
      } else {
        const pos = await getPosition();
        await api.post('/attendance/check-in', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          lateReason,
        });
      }
      setShowLateModal(false);
      setLateReason('');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to submit late reason.');
    } finally {
      setLoading(false);
      setGpsStatus(null);
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      {errorMsg && (
        <div className="w-full p-4 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {gpsStatus && (
        <div className="text-xs text-primary font-semibold flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/10 animate-pulse">
          <Radio className="w-4 h-4 animate-spin text-primary" />
          <span>{gpsStatus}</span>
        </div>
      )}

      {buttonState === 'CAN_CHECK_IN' && (
        <Button
          variant="primary"
          size="lg"
          onClick={handleAction}
          isLoading={loading}
          className="w-full text-base font-medium rounded-lg"
          leftIcon={<LogIn className="w-5 h-5" />}
        >
          Punch Check In
        </Button>
      )}

      {buttonState === 'CAN_CHECK_OUT' && (
        <Button
          variant="secondary"
          size="lg"
          onClick={handleAction}
          isLoading={loading}
          className="w-full text-base font-medium rounded-lg"
          leftIcon={<LogOut className="w-5 h-5" />}
        >
          Punch Check Out
        </Button>
      )}

      {buttonState === 'LATE_REASON_REQUIRED' && (
        <div className="w-full space-y-3 text-center">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Late Check-In Detected. Mandatory reason required to log attendance.</span>
          </div>
          <Button
            size="lg"
            variant="primary"
            className="w-full h-14 text-sm font-bold rounded-2xl shadow-md"
            onClick={() => setShowLateModal(true)}
            leftIcon={<AlertCircle className="w-5 h-5" />}
          >
            Submit Mandatory Late Reason
          </Button>
        </div>
      )}

      {buttonState === 'CHECKED_OUT' && (
        <div className="w-full p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2.5 text-sm font-bold shadow-sm">
          <CheckCircle2 className="w-5 h-5" />
          Shift Finalized & Logged For Today
        </div>
      )}

      {/* Late Reason Modal */}
      <Modal
        isOpen={showLateModal}
        onClose={() => setShowLateModal(false)}
        title="Mandatory Late Check-In Reason"
        description={`Office start time is ${officeSettings?.officeStartTime || '09:00'}. Please provide a brief explanation for late arrival.`}
      >
        <form onSubmit={handleLateSubmit} className="space-y-4 mt-2">
          <Input
            label="Reason for late check-in *"
            placeholder="e.g., Heavy traffic on highway, Metro transit delay"
            value={lateReason}
            onChange={(e) => setLateReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowLateModal(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading} className="rounded-xl font-bold">
              Submit & Finalize Check-In
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

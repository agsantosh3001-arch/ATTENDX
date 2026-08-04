import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Settings, MapPin, Clock, Save, Check } from 'lucide-react';
import { api } from '../../utils/api';
import { OfficeSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState<OfficeSettings>({
    officeLatitude: 22.6178,
    officeLongitude: 88.4206,
    allowedRadiusMeters: 2000,
    gpsAccuracyThresholdMeters: 500,
    officeStartTime: '09:00',
    officeEndTime: '18:00',
    timezone: 'Asia/Kolkata',
  });

  useEffect(() => {
    api.get('/admin/settings')
      .then((res) => {
        if (res.data?.success) {
          setForm(res.data.data.settings);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await api.put('/admin/settings', form);
      if (res.data?.success) {
        setForm(res.data.data.settings);
        setMsg('Geofence settings updated successfully.');
      }
    } catch (err: any) {
      setMsg(err.response?.data?.error?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 px-4 pt-4 space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-500" />
            Geofence & Timing Rules
          </h1>
          <p className="text-xs text-muted-foreground">Office location coordinates and shift thresholds</p>
        </div>
      </div>

      <Card className="border-border bg-card shadow-xs rounded-3xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Office Coordinates & Radius
            </CardTitle>
            <CardDescription className="text-xs">
              Employees must be within this GPS radius to check in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {msg && (
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                {msg}
              </div>
            )}

            <Input
              label="Office Latitude *"
              type="number"
              step="any"
              inputMode="decimal"
              value={form.officeLatitude}
              onChange={(e) => setForm({ ...form, officeLatitude: parseFloat(e.target.value) })}
              required
            />

            <Input
              label="Office Longitude *"
              type="number"
              step="any"
              inputMode="decimal"
              value={form.officeLongitude}
              onChange={(e) => setForm({ ...form, officeLongitude: parseFloat(e.target.value) })}
              required
            />

            <Input
              label="Allowed Radius (Meters) *"
              type="number"
              inputMode="numeric"
              value={form.allowedRadiusMeters}
              onChange={(e) => setForm({ ...form, allowedRadiusMeters: parseFloat(e.target.value) })}
              required
            />

            <Input
              label="Max GPS Accuracy Threshold (Meters) *"
              type="number"
              inputMode="numeric"
              value={form.gpsAccuracyThresholdMeters}
              onChange={(e) => setForm({ ...form, gpsAccuracyThresholdMeters: parseFloat(e.target.value) })}
              required
            />

            <div className="pt-2 border-t border-border/60 space-y-3">
              <p className="text-xs font-bold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Shift Timings
              </p>

              <Input
                label="Office Start Time (HH:MM) *"
                type="text"
                placeholder="09:00"
                value={form.officeStartTime}
                onChange={(e) => setForm({ ...form, officeStartTime: e.target.value })}
                required
              />

              <Input
                label="Office End Time (HH:MM) *"
                type="text"
                placeholder="18:00"
                value={form.officeEndTime}
                onChange={(e) => setForm({ ...form, officeEndTime: e.target.value })}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              className="w-full h-14 text-sm font-bold rounded-2xl shadow-md mt-2"
            >
              <Save className="w-4 h-4 mr-2" /> Save Geofence Rules
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

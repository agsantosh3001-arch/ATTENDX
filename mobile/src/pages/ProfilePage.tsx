import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { User as UserIcon, Mail, Phone, Building, Briefcase, LogOut, Check } from 'lucide-react';
import { api } from '../utils/api';

export const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/auth/me', { fullName, phoneNumber });
      await refreshUser();
      setEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 px-4 pt-6 space-y-6 font-sans">
      {/* Avatar Hero */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-1 shadow-lg">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.fullName || user?.email || 'User')}`}
            alt={user?.fullName || 'User'}
            className="w-full h-full rounded-full bg-card object-cover"
          />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground">{user?.fullName || user?.email}</h2>
          <p className="text-xs text-muted-foreground font-medium">{user?.email}</p>
        </div>
        <div className="flex justify-center gap-2">
          <Badge variant={user?.status}>{user?.status}</Badge>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Account Details Card */}
      <Card className="border-border bg-card shadow-xs rounded-3xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">Profile Information</CardTitle>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-bold text-primary hover:underline"
            >
              Edit Details
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-bold text-muted-foreground hover:underline"
            >
              Cancel
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!editing ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
                <Building className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Department</p>
                  <p className="font-bold text-foreground">{user?.department || 'Not Assigned'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
                <Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Designation</p>
                  <p className="font-bold text-foreground">{user?.designation || 'Employee'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Phone Contact</p>
                  <p className="font-bold text-foreground">{user?.phoneNumber || 'Not Provided'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                inputMode="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button type="submit" variant="primary" isLoading={saving} className="w-full h-12 rounded-2xl">
                Save Profile Changes
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Logout Action */}
      <Button
        variant="destructive"
        onClick={logout}
        className="w-full h-14 text-sm font-bold rounded-2xl shadow-md"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out of Account
      </Button>
    </div>
  );
};

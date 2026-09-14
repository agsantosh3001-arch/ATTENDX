import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { UserAvatar } from '../components/ui/UserAvatar';
import {
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../utils/api';
import { DeviceStatusResponse } from '../types';

export const LoginPage: React.FC = () => {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showAdminForm, setShowAdminForm] = useState(false);

  // Device status state
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatusResponse | null>(null);
  const [loadingDevice, setLoadingDevice] = useState(true);

  // First-time manual dev account input (for initial setup of a new device without listing other employees)
  const [showFirstTimeForm, setShowFirstTimeForm] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  // Admin form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const queryError = searchParams.get('error');
  const isRegisterMode = searchParams.get('mode') === 'register';

  useEffect(() => {
    async function checkDevice() {
      setLoadingDevice(true);
      try {
        const res = await api.get('/auth/device-status');
        if (res.data?.success) {
          setDeviceStatus(res.data.data);
        }
      } catch (err) {
        setDeviceStatus({ isRegistered: false });
      } finally {
        setLoadingDevice(false);
      }
    }
    checkDevice();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminErrorMsg(null);
    setAdminLoading(true);

    try {
      await loginAdmin({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setAdminErrorMsg(err.response?.data?.error?.message || 'Invalid email or password.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleCustomDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const namePart = customName.trim() || customEmail.split('@')[0];
    window.location.href = `/api/auth/google/dev-select?email=${encodeURIComponent(
      customEmail.trim().toLowerCase()
    )}&name=${encodeURIComponent(namePart)}`;
  };

  const getSecurityErrorMessage = () => {
    if (queryError === 'device_mismatch') {
      return 'This device is already registered to another account. Please contact your administrator if this device needs to be reassigned.';
    }
    if (queryError === 'device_revoked') {
      return 'This device registration has been revoked. Please contact your administrator for assistance.';
    }
    if (queryError === 'google_auth_failed') {
      return 'Google Workspace authentication failed. Please try again.';
    }
    return null;
  };

  const securityError = getSecurityErrorMessage();

  return (
    <div className="min-h-screen flex flex-col justify-between px-5 py-8 bg-background text-foreground relative overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-600/15 to-amber-700/20 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 pt-4 text-center space-y-2.5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-white font-black text-2xl shadow-xl shadow-primary/20">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight font-sans">
          Attend<span className="text-primary">X</span>
        </h1>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto font-medium">
          Mobile GPS Geofence & Workforce Attendance OS
        </p>
      </div>

      {/* Center Primary Action Area */}
      <div className="relative z-10 w-full space-y-4 my-auto py-4">
        {/* Security Alert */}
        {securityError && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Security Notice</p>
              <p className="text-[11px] leading-relaxed text-destructive/90">{securityError}</p>
            </div>
          </div>
        )}

        <Card className="backdrop-blur-xl border-border/80 shadow-xl rounded-3xl overflow-hidden">
          {loadingDevice ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-5 h-5 text-primary animate-spin mx-auto opacity-70" />
              <p className="text-xs text-muted-foreground font-medium">Verifying device registration...</p>
            </div>
          ) : deviceStatus?.isRegistered && deviceStatus.user ? (
            // RETURNING USER — RECOGNIZED REGISTERED DEVICE
            <div className="p-5 space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold mx-auto mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Registered Device</span>
                </div>
                <h2 className="text-base font-bold text-foreground">Welcome Back</h2>
                <p className="text-[11px] text-muted-foreground">Continue with your registered account</p>
              </div>

              {/* Single Account Card */}
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/80 flex items-center gap-3">
                <UserAvatar
                  name={deviceStatus.user.fullName}
                  email={deviceStatus.user.maskedEmail}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">
                    {deviceStatus.user.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {deviceStatus.user.maskedEmail}
                  </p>
                  {deviceStatus.user.designation && (
                    <p className="text-[10px] text-primary/80 font-semibold mt-0.5">
                      {deviceStatus.user.designation}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-13 py-3 rounded-2xl border border-border bg-card hover:bg-muted text-foreground font-bold text-sm flex items-center justify-center gap-3 shadow-md active:scale-[0.98] transition-all"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          ) : (
            // NEW / UNREGISTERED DEVICE
            <div className="p-5 space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold mx-auto mb-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Device Registration</span>
                </div>
                <h2 className="text-base font-bold text-foreground">Sign in to AttendX</h2>
                <p className="text-[11px] text-muted-foreground">Continue with your organization Google account</p>
              </div>

              {!showFirstTimeForm && !isRegisterMode ? (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-13 py-3 rounded-2xl border border-border bg-card hover:bg-muted text-foreground font-bold text-sm flex items-center justify-center gap-3 shadow-md active:scale-[0.98] transition-all"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              ) : (
                <form onSubmit={handleCustomDevSubmit} className="space-y-3 pt-1">
                  <p className="text-xs font-bold text-foreground">Register Device Account:</p>
                  <Input
                    label="Full Name *"
                    placeholder="e.g. VIVAN"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                  />
                  <Input
                    label="Work Google Email *"
                    type="email"
                    placeholder="yourname@organization.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    required
                  />
                  <div className="flex gap-2 justify-end pt-1">
                    {isRegisterMode && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFirstTimeForm(false)}
                        className="rounded-xl text-xs"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="rounded-xl font-bold text-xs h-10 px-4"
                    >
                      Authenticate & Register
                    </Button>
                  </div>
                </form>
              )}

              {!showFirstTimeForm && !isRegisterMode && (
                <button
                  type="button"
                  onClick={() => setShowFirstTimeForm(true)}
                  className="text-[11px] text-primary/80 hover:text-primary underline block text-center mx-auto pt-1 font-semibold"
                >
                  Enter specific work account email
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Admin Login Link / Expandable Form */}
        <div className="space-y-3">
          {!showAdminForm ? (
            <button
              type="button"
              onClick={() => setShowAdminForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Shield className="w-4 h-4 text-purple-500" />
              <span>Administrator Portal Access</span>
            </button>
          ) : (
            <Card className="backdrop-blur-xl animate-in slide-in-from-bottom duration-200">
              <form onSubmit={handleAdminLogin}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      Admin Login
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdminForm(false)}
                      className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                    >
                      Hide
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {adminErrorMsg && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{adminErrorMsg}</span>
                    </div>
                  )}

                  <Input
                    label="Admin Email"
                    type="email"
                    placeholder="admin@attendx.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    inputMode="email"
                  />

                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-muted-foreground hover:text-foreground p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-2 h-12 text-sm font-bold rounded-2xl"
                    isLoading={adminLoading}
                  >
                    Sign In to Console
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-2">
        <p className="text-[11px] text-muted-foreground font-medium">
          AttendX Enterprise OS • Geofenced Attendance
        </p>
      </div>
    </div>
  );
};

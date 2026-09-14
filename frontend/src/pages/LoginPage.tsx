import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { UserAvatar } from '../components/ui/UserAvatar';
import {
  Lock,
  Mail,
  Shield,
  User,
  AlertCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../utils/api';
import { DeviceStatusResponse } from '../types';

export const LoginPage: React.FC = () => {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'employee' | 'admin'>('employee');

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
  const [adminErrorMsg, setAdminErrorMsg] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Security error from URL query
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
      setAdminErrorMsg(err.response?.data?.error?.message || 'Invalid email or password');
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
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-16 overflow-hidden font-sans">
      {/* Ambient Mesh Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-600/15 to-amber-700/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-white font-black text-2xl shadow-xl shadow-primary/20 animate-in fade-in zoom-in">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">
            Welcome to <span className="gradient-text">AttendX</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Enterprise GPS Geofence & Workforce Attendance OS
          </p>
        </div>

        {/* Security Alert Banner */}
        {securityError && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-start gap-3 shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Security Notice</p>
              <p className="text-[11px] leading-relaxed text-destructive/90">{securityError}</p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-muted/60 p-1.5 border border-border/60 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setTab('employee');
              setAdminErrorMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'employee'
                ? 'bg-card text-foreground shadow-md border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4 text-primary" />
            Employee Access
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('admin');
              setAdminErrorMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'admin'
                ? 'bg-card text-foreground shadow-md border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4 text-purple-500" />
            Admin Portal
          </button>
        </div>

        <Card className="shadow-2xl border-border/80 bg-card/80 backdrop-blur-xl rounded-3xl overflow-hidden glow-card">
          {tab === 'employee' ? (
            loadingDevice ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto opacity-70" />
                <p className="text-xs text-muted-foreground font-medium">Verifying device registration...</p>
              </div>
            ) : deviceStatus?.isRegistered && deviceStatus.user ? (
              // RETURNING USER — RECOGNIZED REGISTERED DEVICE
              <>
                <CardHeader className="text-center pb-2 pt-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[11px] font-bold mx-auto mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Registered Device</span>
                  </div>
                  <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
                  <CardDescription className="text-xs">
                    Continue with your verified employee account on this device.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 px-6 pb-6 pt-2">
                  {/* Single Account Profile Card */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center gap-3.5">
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

                  {/* Single Action Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full h-14 rounded-2xl border border-border bg-gradient-to-r from-card to-muted hover:from-muted hover:to-muted/80 text-foreground font-bold text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
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
                </CardContent>

                <CardFooter className="justify-center border-t border-border/60 bg-muted/30 p-3.5">
                  <p className="text-[10px] text-muted-foreground text-center flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Protected by AttendX Account & Device Binding</span>
                  </p>
                </CardFooter>
              </>
            ) : (
              // NEW / UNREGISTERED DEVICE
              <>
                <CardHeader className="text-center pb-3 pt-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold mx-auto mb-2">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Device Registration</span>
                  </div>
                  <CardTitle className="text-lg font-bold">Sign in to AttendX</CardTitle>
                  <CardDescription className="text-xs">
                    Authenticate using your organization Google Workspace account.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-6 pb-6">
                  {!showFirstTimeForm && !isRegisterMode ? (
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full h-14 rounded-2xl border border-border bg-card hover:bg-muted/80 text-foreground font-bold text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
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
                      <span>Continue with Google Workspace</span>
                    </button>
                  ) : (
                    // Clean single-account dev email registration (Never leaks directory)
                    <form onSubmit={handleCustomDevSubmit} className="space-y-3 pt-1">
                      <p className="text-xs font-bold text-foreground">Register Device to Your Account:</p>
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
                      <div className="flex gap-2 justify-end pt-2">
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
                          Authenticate & Bind Device
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
                </CardContent>

                <CardFooter className="justify-center border-t border-border/60 bg-muted/30 p-4">
                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    First time signing in on this browser? Your device will be securely registered upon authorization.
                  </p>
                </CardFooter>
              </>
            )
          ) : (
            // ADMIN LOGIN FORM
            <form onSubmit={handleAdminLogin}>
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-purple-500" />
                  Admin Credentials
                </CardTitle>
                <CardDescription className="text-xs">Enter administrator email and password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6">
                {adminErrorMsg && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
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
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </CardContent>
              <CardFooter className="pt-4 pb-6 px-6">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-12 text-sm font-bold rounded-2xl shadow-lg"
                  isLoading={adminLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Login to Admin Console
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Lock, Mail, Shield, User, AlertCircle, ArrowRight, Sparkles, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'employee' | 'admin'>('employee');

  // Admin form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await loginAdmin({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-16 overflow-hidden">
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

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-muted/60 p-1.5 border border-border/60 backdrop-blur-md">
          <button
            type="button"
            onClick={() => { setTab('employee'); setErrorMsg(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'employee'
                ? 'bg-card text-foreground shadow-md border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4 text-primary" />
            Employee Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('admin'); setErrorMsg(null); }}
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
            <>
              <CardHeader className="text-center pb-4 pt-6">
                <CardTitle className="text-lg font-bold">Employee Access</CardTitle>
                <CardDescription className="text-xs">Authenticate using your organization Google Account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
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
                  <span>Sign in with Google Workspace</span>
                </button>
              </CardContent>
              <CardFooter className="justify-center border-t border-border/60 bg-muted/30 p-4">
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  First time signing in? You will be guided through a quick profile setup.
                </p>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={handleAdminLogin}>
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-purple-500" />
                  Admin Credentials
                </CardTitle>
                <CardDescription className="text-xs">Enter administrator email and password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
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
                  isLoading={loading}
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

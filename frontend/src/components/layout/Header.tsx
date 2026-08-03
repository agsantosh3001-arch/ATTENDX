import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, Bell, LayoutDashboard, History, BarChart3, CheckCircle, AlertTriangle, Shield, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../utils/api';
import { NotificationItem } from '../../types';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      // Ignore notification fetch errors silently
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/70 backdrop-blur-xl transition-all shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-extrabold tracking-tight text-foreground font-sans">AttendX</h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block font-medium">Enterprise Attendance OS</p>
            </div>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1 border-l border-border/60 pl-6">
              <Link
                to="/dashboard"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  location.pathname === '/dashboard'
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                to="/history"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  location.pathname === '/history'
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <History className="w-4 h-4" />
                History
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/reports"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    location.pathname === '/reports'
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Reports & Analytics
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {user && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 rounded-xl border border-transparent hover:border-border"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white ring-2 ring-background animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-border bg-card p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                    <h3 className="font-bold text-sm text-foreground">Activity Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No new notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border text-xs transition-all ${
                            n.isRead ? 'border-border/60 bg-card' : 'border-primary/30 bg-primary/5 font-medium'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {n.type === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="font-bold text-foreground">{n.title}</p>
                              <p className="text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-transparent hover:border-border"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </Button>

          {user && (
            <div className="flex items-center gap-3 border-l border-border/60 pl-3 sm:pl-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 p-0.5 shadow-sm">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.fullName || user.email)}`}
                    alt={user.fullName || 'User'}
                    className="w-full h-full rounded-full bg-card object-cover"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight text-foreground">
                    {user.fullName || user.email}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {user.role}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
                className="hidden sm:inline-flex rounded-xl"
              >
                Logout
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="sm:hidden p-2 text-destructive"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

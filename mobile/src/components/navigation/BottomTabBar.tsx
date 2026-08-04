import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  History as HistoryIcon,
  User as UserIcon,
  Users,
  CheckCircle,
  MoreHorizontal,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';

export const BottomTabBar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAdminMore, setShowAdminMore] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border/80 px-4 py-2 flex items-center justify-around shadow-lg">
        {!isAdmin ? (
          /* Employee Navigation — 3 Tabs */
          <>
            <Link
              to="/dashboard"
              className={`flex flex-col items-center gap-1 min-w-[64px] py-1 transition-all ${
                location.pathname === '/dashboard' ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">Dashboard</span>
            </Link>

            <Link
              to="/history"
              className={`flex flex-col items-center gap-1 min-w-[64px] py-1 transition-all ${
                location.pathname === '/history' ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
            >
              <HistoryIcon className="w-5 h-5" />
              <span className="text-[10px]">History</span>
            </Link>

            <Link
              to="/profile"
              className={`flex flex-col items-center gap-1 min-w-[64px] py-1 transition-all ${
                location.pathname === '/profile' ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-[10px]">Profile</span>
            </Link>
          </>
        ) : (
          /* Admin Navigation — 4 Tabs + More Sheet */
          <>
            <Link
              to="/dashboard"
              className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all ${
                location.pathname === '/dashboard' ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">Home</span>
            </Link>

            <Link
              to="/admin/employees"
              className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all ${
                location.pathname === '/admin/employees' ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px]">Employees</span>
            </Link>

            <Link
              to="/admin/attendance"
              className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all ${
                location.pathname === '/admin/attendance' ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="text-[10px]">Attendance</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowAdminMore(true)}
              className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all ${
                ['/admin/reports', '/admin/settings', '/admin/audit-logs', '/profile'].includes(location.pathname)
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px]">More</span>
            </button>
          </>
        )}
      </nav>

      {/* Admin More Sheet */}
      {isAdmin && (
        <BottomSheet
          isOpen={showAdminMore}
          onClose={() => setShowAdminMore(false)}
          title="Admin Menu & Controls"
        >
          <div className="space-y-2 py-2">
            <button
              type="button"
              onClick={() => {
                setShowAdminMore(false);
                navigate('/admin/reports');
              }}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-muted font-bold text-sm text-foreground text-left"
            >
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <span>Reports & Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAdminMore(false);
                navigate('/admin/settings');
              }}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-muted font-bold text-sm text-foreground text-left"
            >
              <Settings className="w-5 h-5 text-purple-500" />
              <span>Geofence & Shift Settings</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAdminMore(false);
                navigate('/admin/audit-logs');
              }}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-muted font-bold text-sm text-foreground text-left"
            >
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span>System Audit Logs</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAdminMore(false);
                navigate('/profile');
              }}
              className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-muted font-bold text-sm text-foreground text-left"
            >
              <UserIcon className="w-5 h-5 text-primary" />
              <span>My Admin Profile</span>
            </button>

            <div className="pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => {
                  setShowAdminMore(false);
                  logout();
                }}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-destructive/10 text-destructive font-bold text-sm text-left"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
};

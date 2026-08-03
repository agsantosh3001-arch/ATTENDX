import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { LoginPage } from './pages/LoginPage';
import { GooglePickerPage } from './pages/GooglePickerPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { HistoryPage } from './pages/HistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { ToastContainer } from './components/ui/Toast';
import { Loader2 } from 'lucide-react';

const AuthTokenHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshUser, setTokenAndUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('access_token', token);
      searchParams.delete('token');
      setSearchParams(searchParams, { replace: true });
      refreshUser();
    }
  }, [searchParams, setSearchParams, refreshUser]);

  return <>{children}</>;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    if (!user.department || !user.designation) {
      return <Navigate to="/onboarding" replace />;
    }
    if (user.status === 'pending') {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  return <EmployeeDashboard />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthTokenHandler>
            <div className="min-h-screen flex flex-col bg-background text-foreground">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/google-picker" element={<GooglePickerPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/pending-approval" element={<PendingApprovalPage />} />

                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardRouter />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <HistoryPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <ReportsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
              <ToastContainer />
            </div>
          </AuthTokenHandler>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

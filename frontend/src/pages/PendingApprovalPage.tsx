import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, RefreshCw, LogOut, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export const PendingApprovalPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.status === 'approved') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshUser]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-lg animate-bounce">
          <Clock className="w-8 h-8" />
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-2">
              <Badge variant={user?.status || 'pending'}>{user?.status || 'pending'}</Badge>
            </div>
            <CardTitle className="text-xl font-bold">Account Approval Pending</CardTitle>
            <CardDescription className="text-sm">
              Your profile has been submitted to the workspace administrator. You will gain access to attendance tracking once approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-muted/60 text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              Automatically checking status every 10 seconds...
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => refreshUser()}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Check Status Now
              </Button>
              <Button
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10"
                onClick={logout}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

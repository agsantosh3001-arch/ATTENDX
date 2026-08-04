import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
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
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background text-foreground">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-lg animate-bounce">
          <Clock className="w-8 h-8" />
        </div>

        <Card className="shadow-lg border-border bg-card rounded-3xl p-2">
          <CardHeader className="pb-3 pt-4">
            <div className="flex justify-center mb-2">
              <Badge variant={user?.status || 'pending'}>{user?.status || 'pending'}</Badge>
            </div>
            <CardTitle className="text-lg font-bold">Waiting for Approval</CardTitle>
            <CardDescription className="text-xs">
              Your registration has been submitted. Your administrator will review and grant attendance tracking access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-2xl bg-muted/60 text-xs text-muted-foreground flex items-center justify-center gap-2 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin text-primary shrink-0" />
              <span>Checking status automatically...</span>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl text-xs font-bold"
                onClick={() => refreshUser()}
              >
                Check Status Now
              </Button>
              <Button
                variant="ghost"
                className="w-full h-12 rounded-2xl text-xs font-bold text-destructive"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

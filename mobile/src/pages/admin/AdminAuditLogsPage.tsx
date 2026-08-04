import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';

export const AdminAuditLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs?limit=50');
      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 px-4 pt-4 space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            System Audit Logs
          </h1>
          <p className="text-xs text-muted-foreground">Reverse-chronological activity ledger</p>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-10 animate-pulse font-medium">
            Fetching system audit logs...
          </p>
        ) : logs.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            No audit activity logged in the system yet.
          </Card>
        ) : (
          logs.map((l) => (
            <Card key={l.id} className="p-4 border-border bg-card shadow-xs rounded-3xl space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground font-mono">{l.action}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                User: <span className="font-semibold text-foreground">{l.user?.fullName || l.user?.email || 'System'}</span>
              </p>
              {l.ipAddress && <p className="text-[10px] text-muted-foreground font-mono">IP: {l.ipAddress}</p>}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

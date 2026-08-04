import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Users, Search, Check, X, Shield, Phone, Mail, Building, Briefcase } from 'lucide-react';
import { api } from '../../utils/api';
import { User } from '../../types';

export const AdminEmployeesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<User[]>([]);
  const [pendingEmployees, setPendingEmployees] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filterChip, setFilterChip] = useState<'all' | 'pending' | 'approved' | 'deactivated'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, pendingRes] = await Promise.all([
        api.get('/admin/employees'),
        api.get('/admin/pending-employees'),
      ]);
      if (empRes.data?.success) setEmployees(empRes.data.data.employees || []);
      if (pendingRes.data?.success) setPendingEmployees(pendingRes.data.data.employees || []);
    } catch (err) {
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/admin/employees/${id}/approve`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to approve.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/admin/employees/${id}/reject`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to reject.');
    }
  };

  const allList = filterChip === 'pending' ? pendingEmployees : employees;

  const filtered = allList.filter((e) => {
    const matchesSearch =
      (e.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.department || '').toLowerCase().includes(search.toLowerCase());

    if (filterChip === 'all' || filterChip === 'pending') return matchesSearch;
    return matchesSearch && e.status === filterChip;
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 px-4 pt-4 space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Employee Roster
          </h1>
          <p className="text-xs text-muted-foreground">Manage organization users and approvals</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search name, email, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 rounded-2xl border border-input bg-card px-4 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterChip('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
            filterChip === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          All ({employees.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterChip('pending')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
            filterChip === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          Pending ({pendingEmployees.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterChip('approved')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
            filterChip === 'approved' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          Approved
        </button>

        <button
          type="button"
          onClick={() => setFilterChip('deactivated')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
            filterChip === 'deactivated' ? 'bg-muted-foreground text-white shadow-sm' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          Deactivated
        </button>
      </div>

      {/* Employee Cards List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-10 animate-pulse font-medium">
            Loading employee roster...
          </p>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            No employee records match the search filter.
          </Card>
        ) : (
          filtered.map((emp) => (
            <Card key={emp.id} className="p-4 border-border bg-card shadow-xs rounded-3xl space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      emp.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emp.fullName || emp.email)}`
                    }
                    alt={emp.fullName || 'Employee'}
                    className="w-10 h-10 rounded-full border border-border bg-muted object-cover"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">{emp.fullName || 'Employee'}</h3>
                    <p className="text-[11px] text-muted-foreground">{emp.email}</p>
                  </div>
                </div>

                <Badge variant={emp.status}>{emp.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Department</p>
                  <p className="font-bold text-foreground">{emp.department || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">Designation</p>
                  <p className="font-bold text-foreground">{emp.designation || '—'}</p>
                </div>
              </div>

              {emp.status === 'pending' && (
                <div className="flex gap-2 pt-2 border-t border-border/60">
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleApprove(emp.id)}
                    className="flex-1 h-10 text-xs rounded-xl"
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(emp.id)}
                    className="flex-1 h-10 text-xs rounded-xl"
                  >
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

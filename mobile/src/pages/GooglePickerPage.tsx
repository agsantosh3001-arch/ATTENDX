import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserAvatar } from '../components/ui/UserAvatar';
import { ArrowRight, Plus } from 'lucide-react';

const PRESET_ACCOUNTS = [
  {
    name: 'VIVAN (Approved Employee)',
    email: 'vivaninteriors@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VIVAN',
    desc: 'Approved employee account with full dashboard access',
  },
  {
    name: 'Alex Rivera (Approved Employee)',
    email: 'alex.rivera@attendx.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    desc: 'Approved employee account with full dashboard access',
  },
  {
    name: 'Sarah Connor (Pending Approval)',
    email: 'sarah.connor@attendx.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    desc: 'Onboarded employee awaiting admin approval',
  },
  {
    name: 'John Doe (New Joiner)',
    email: 'john.doe@attendx.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    desc: 'First-time Google login (triggers profile onboarding)',
  },
];

export const GooglePickerPage: React.FC = () => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectAccount = async (email: string, name: string) => {
    setLoading(true);
    window.location.href = `/api/auth/google/dev-select?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) return;
    handleSelectAccount(customEmail.trim(), customName.trim());
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-8 bg-background text-foreground">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card border border-border shadow-md">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
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
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Choose Account</h1>
          <p className="text-xs text-muted-foreground">Select a Google Workspace test profile</p>
        </div>

        <Card className="shadow-xl border-border bg-card rounded-3xl overflow-hidden divide-y divide-border/60">
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {PRESET_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectAccount(acc.email, acc.name.split(' (')[0])}
                  className="w-full p-4 flex items-center gap-3.5 text-left hover:bg-muted/60 active:bg-muted transition-all"
                >
                  <UserAvatar name={acc.name} email={acc.email} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-foreground truncate">{acc.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{acc.email}</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5">{acc.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>

          <div className="p-4 bg-muted/20">
            {!showCustomForm ? (
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="w-full flex items-center gap-3 text-xs font-bold text-primary py-1"
              >
                <div className="w-7 h-7 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                <span>Use another Google Account</span>
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1">
                <p className="text-xs font-bold text-foreground">Custom Account Details:</p>
                <Input
                  label="Full Name *"
                  placeholder="e.g. Maria Garcia"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
                <Input
                  label="Google Email *"
                  type="email"
                  placeholder="maria@attendx.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                />
                <div className="flex gap-2 justify-end pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCustomForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                    Sign In
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

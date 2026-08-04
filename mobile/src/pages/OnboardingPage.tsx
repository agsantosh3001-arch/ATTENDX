import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, onboardUser } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [age, setAge] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await onboardUser({
        fullName: fullName || user?.fullName || 'Employee',
        department,
        designation,
        phoneNumber,
        age: parseInt(age, 10),
      });
      navigate('/pending-approval');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to complete profile onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 bg-background text-foreground">
      <div className="space-y-4 max-w-md mx-auto w-full">
        <div className="text-center space-y-2 pt-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-md">
            <UserCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Complete Profile</h1>
          <p className="text-xs text-muted-foreground">
            Welcome {user?.fullName || user?.email}! Fill in your details.
          </p>
        </div>

        <Card className="shadow-lg border-border bg-card rounded-3xl">
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Employee Information</CardTitle>
              <CardDescription className="text-xs">Required for admin verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Input
                label="Full Name *"
                placeholder="e.g. Maria Garcia"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              {/* Native Mobile Select Dropdown */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-bold text-foreground">Department *</label>
                <select
                  required
                  className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">Select Department...</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Operations">Operations</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <Input
                label="Designation *"
                placeholder="e.g. Software Engineer"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
              />

              <Input
                label="Phone Number *"
                type="tel"
                inputMode="tel"
                placeholder="e.g. +91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />

              <Input
                label="Age *"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 28"
                min="18"
                max="100"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full h-14 text-sm font-bold rounded-2xl shadow-lg mt-2"
                isLoading={loading}
              >
                Complete Registration <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-md">
            <UserCheck className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            Welcome {user?.fullName || user?.email}! Please fill in your organization details to continue.
          </p>
        </div>

        <Card className="shadow-lg border-border">
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Employee Information</CardTitle>
              <CardDescription>All fields are required for admin approval.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Input
                label="Department *"
                placeholder="e.g. Engineering, Product, HR, Marketing"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />

              <Input
                label="Designation *"
                placeholder="e.g. Software Engineer, Product Manager"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number *"
                  placeholder="e.g. +91 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <Input
                  label="Age *"
                  type="number"
                  placeholder="e.g. 28"
                  min="18"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-sm font-semibold rounded-xl"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Submit Profile For Approval
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { OnboardingForm } from '@/components/client/OnboardingForm';
import { ContractSigning } from '@/components/client/ContractSigning';
import { ClientDashboard } from '@/components/client/ClientDashboard';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading, role, approvalStatus, hasSignedContract } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin - redirect to admin dashboard
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Client flow
  if (role === 'client') {
    // Pending approval - show onboarding form
    if (approvalStatus === 'pending') {
      return <OnboardingForm />;
    }

    // Rejected
    if (approvalStatus === 'rejected') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-2xl font-bold text-destructive">Application Rejected</h1>
            <p className="text-muted-foreground">Unfortunately, your application has been rejected. Please contact support for more information.</p>
          </div>
        </div>
      );
    }

    // Approved but hasn't signed contract
    if (approvalStatus === 'approved' && !hasSignedContract) {
      return <ContractSigning />;
    }

    // Fully onboarded - show dashboard
    if (approvalStatus === 'approved' && hasSignedContract) {
      return <ClientDashboard />;
    }
  }

  // Fallback loading state while role is being fetched
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/auth');
      else if (role !== 'admin') navigate('/');
    }
  }, [user, loading, role, navigate]);

  if (loading || !user || role !== 'admin') {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  return <AdminDashboard />;
}

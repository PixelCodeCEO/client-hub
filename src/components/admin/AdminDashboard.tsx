import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LogOut, Users, Folder, FileText, MessageSquare, Receipt, Check, X, Plus } from 'lucide-react';
import { ClientsTab } from './tabs/ClientsTab';
import { ProjectsTab } from './tabs/ProjectsTab';

export function AdminDashboard() {
  const { signOut } = useAuth();
  const [stats, setStats] = useState({ pendingApprovals: 0, activeProjects: 0, pendingInvoices: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [pending, projects, invoices] = await Promise.all([
        supabase.from('client_onboarding').select('id', { count: 'exact' }).eq('approval_status', 'pending'),
        supabase.from('projects').select('id', { count: 'exact' }).neq('status', 'delivered'),
        supabase.from('invoices').select('id', { count: 'exact' }).eq('status', 'pending'),
      ]);
      setStats({ pendingApprovals: pending.count || 0, activeProjects: projects.count || 0, pendingInvoices: invoices.count || 0 });
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold gradient-text">Admin Dashboard</h1>
          <Button variant="ghost" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass"><CardHeader className="pb-2"><CardDescription>Pending Approvals</CardDescription><CardTitle className="text-3xl">{stats.pendingApprovals}</CardTitle></CardHeader></Card>
          <Card className="glass"><CardHeader className="pb-2"><CardDescription>Active Projects</CardDescription><CardTitle className="text-3xl">{stats.activeProjects}</CardTitle></CardHeader></Card>
          <Card className="glass"><CardHeader className="pb-2"><CardDescription>Pending Invoices</CardDescription><CardTitle className="text-3xl">{stats.pendingInvoices}</CardTitle></CardHeader></Card>
        </div>
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="clients"><Users className="h-4 w-4 mr-2" />Clients</TabsTrigger>
            <TabsTrigger value="projects"><Folder className="h-4 w-4 mr-2" />Projects</TabsTrigger>
          </TabsList>
          <TabsContent value="clients"><ClientsTab /></TabsContent>
          <TabsContent value="projects"><ProjectsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

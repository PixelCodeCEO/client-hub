import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectTimeline } from './ProjectTimeline';
import { DeliverablesList } from './DeliverablesList';
import { MessagesPanel } from './MessagesPanel';
import { InvoicesList } from './InvoicesList';
import { MilestoneApprovals } from './MilestoneApprovals';
import { Button } from '@/components/ui/button';
import { LogOut, Folder, FileText, MessageSquare, Receipt } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  discovery: 'bg-blue-500/20 text-blue-400',
  design: 'bg-purple-500/20 text-purple-400',
  development: 'bg-yellow-500/20 text-yellow-400',
  review: 'bg-orange-500/20 text-orange-400',
  delivered: 'bg-green-500/20 text-green-400',
};

export function ClientDashboard() {
  const { user, signOut } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setProject(data);
      }
      setLoading(false);
    };

    fetchProject();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass text-center">
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              Your project is being set up. We'll notify you when everything is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Folder className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-lg text-foreground">{project.name}</h1>
                <Badge className={`${statusColors[project.status]} border-0 capitalize`}>
                  {project.status}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" onClick={signOut} className="text-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="glass">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="deliverables" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Deliverables
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Invoices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 animate-fade-in">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                  <CardDescription>Track your project's progress through each phase</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProjectTimeline projectId={project.id} currentStatus={project.status} />
                </CardContent>
              </Card>

              <MilestoneApprovals projectId={project.id} />

              {project.description && (
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Project Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{project.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="deliverables" className="animate-fade-in">
              <DeliverablesList projectId={project.id} />
            </TabsContent>

            <TabsContent value="messages" className="animate-fade-in">
              <MessagesPanel projectId={project.id} />
            </TabsContent>

            <TabsContent value="invoices" className="animate-fade-in">
              <InvoicesList projectId={project.id} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

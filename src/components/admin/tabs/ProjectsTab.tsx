import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Project { id: string; name: string; status: string; client_id: string; profiles?: { email: string; full_name: string | null } | null; }

const statusColors: Record<string, string> = { discovery: 'bg-blue-500/20 text-blue-400', design: 'bg-purple-500/20 text-purple-400', development: 'bg-yellow-500/20 text-yellow-400', review: 'bg-orange-500/20 text-orange-400', delivered: 'bg-green-500/20 text-green-400' };

export function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<{ user_id: string; email: string; full_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({ name: '', clientId: '' });
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    const [projectsRes, clientsRes] = await Promise.all([
      supabase.from('projects').select('*, profiles!projects_client_id_fkey(email, full_name)').order('created_at', { ascending: false }),
      supabase.from('client_onboarding').select('user_id, profiles!client_onboarding_user_id_fkey(email, full_name)').eq('approval_status', 'approved'),
    ]);
    if (projectsRes.data) setProjects(projectsRes.data as Project[]);
    if (clientsRes.data) setClients(clientsRes.data.map((c: any) => ({ user_id: c.user_id, email: c.profiles?.email, full_name: c.profiles?.full_name })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createProject = async () => {
    if (!newProject.name || !newProject.clientId) { toast.error('Please fill all fields'); return; }
    await supabase.from('projects').insert({ name: newProject.name, client_id: newProject.clientId });
    toast.success('Project created!');
    setNewProject({ name: '', clientId: '' });
    setDialogOpen(false);
    fetchData();
  };

  const updateStatus = async (projectId: string, status: string) => {
    await supabase.from('projects').update({ status }).eq('id', projectId);
    toast.success('Status updated');
    fetchData();
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All Projects</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Project</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Project Name</Label><Input value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} /></div>
              <div><Label>Client</Label>
                <Select value={newProject.clientId} onValueChange={(v) => setNewProject({ ...newProject, clientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.user_id} value={c.user_id}>{c.full_name || c.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={createProject} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="flex-1">
                <h4 className="font-medium">{project.name}</h4>
                <p className="text-sm text-muted-foreground">{project.profiles?.full_name || project.profiles?.email}</p>
              </div>
              <Select value={project.status} onValueChange={(v) => updateStatus(project.id, v)}>
                <SelectTrigger className="w-[140px]"><Badge className={`${statusColors[project.status]} border-0 capitalize`}>{project.status}</Badge></SelectTrigger>
                <SelectContent>
                  {['discovery', 'design', 'development', 'review', 'delivered'].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
          {projects.length === 0 && <p className="text-center py-8 text-muted-foreground">No projects yet</p>}
        </div>
      </CardContent>
    </Card>
  );
}

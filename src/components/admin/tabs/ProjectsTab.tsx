import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Eye, AlertTriangle, CheckCircle, Clock, StickyNote, Rocket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LaunchSummary } from './LaunchSummary';

type ProjectStatus = 'discovery' | 'design' | 'development' | 'review' | 'delivered';
type SupportPlan = 'none' | 'basic' | 'priority';
type HealthStatus = 'on_track' | 'needs_attention' | 'blocked';
type WaitingOn = 'client' | 'payment' | 'assets' | 'approval' | 'us' | 'none';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  client_id: string;
  internal_notes: string | null;
  support_plan: SupportPlan;
  health_status: HealthStatus;
  waiting_on: WaitingOn;
  launch_date: string | null;
  launch_notes: string | null;
  profile?: { email: string; full_name: string | null } | null;
}

const statusColors: Record<string, string> = {
  discovery: 'bg-blue-500/20 text-blue-400',
  design: 'bg-purple-500/20 text-purple-400',
  development: 'bg-yellow-500/20 text-yellow-400',
  review: 'bg-orange-500/20 text-orange-400',
  delivered: 'bg-green-500/20 text-green-400',
};

const healthColors: Record<HealthStatus, string> = {
  on_track: 'text-green-400',
  needs_attention: 'text-yellow-400',
  blocked: 'text-red-400',
};

const healthIcons: Record<HealthStatus, typeof CheckCircle> = {
  on_track: CheckCircle,
  needs_attention: AlertTriangle,
  blocked: AlertTriangle,
};

const waitingOnLabels: Record<WaitingOn, string> = {
  client: 'Client',
  payment: 'Payment',
  assets: 'Assets',
  approval: 'Approval',
  us: 'Us',
  none: 'Nothing',
};

const supportPlanLabels: Record<SupportPlan, string> = {
  none: 'No Support Plan',
  basic: 'Basic Support',
  priority: 'Priority Support',
};

export function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<{ user_id: string; email: string; full_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({ name: '', clientId: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [launchProject, setLaunchProject] = useState<Project | null>(null);
  const [launchOpen, setLaunchOpen] = useState(false);

  const fetchData = async () => {
    const [projectsRes, clientsRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, email, full_name'),
    ]);

    if (projectsRes.data && clientsRes.data) {
      const profileMap = new Map(clientsRes.data.map((p) => [p.user_id, p]));
      const projectsWithProfiles = projectsRes.data.map((project) => ({
        ...project,
        profile: profileMap.get(project.client_id) || null,
      }));
      setProjects(projectsWithProfiles as Project[]);
      setClients(clientsRes.data.map((p) => ({ user_id: p.user_id, email: p.email, full_name: p.full_name })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createProject = async () => {
    if (!newProject.name || !newProject.clientId) {
      toast.error('Please fill all fields');
      return;
    }
    await supabase.from('projects').insert({ name: newProject.name, client_id: newProject.clientId });
    toast.success('Project created!');
    setNewProject({ name: '', clientId: '' });
    setDialogOpen(false);
    fetchData();
  };

  const updateStatus = async (projectId: string, status: ProjectStatus, clientId: string) => {
    const previousProject = projects.find(p => p.id === projectId);
    await supabase.from('projects').update({ status }).eq('id', projectId);
    toast.success('Status updated');

    // Send notification based on status change
    try {
      if (status === 'delivered') {
        // Send project completed email
        await supabase.functions.invoke('send-notification', {
          body: { type: 'project_completed', clientId }
        });
      } else if (previousProject?.status !== status) {
        // Send project update email for status changes
        await supabase.functions.invoke('send-notification', {
          body: { type: 'project_updated', clientId, data: { status } }
        });
      }
    } catch (error) {
      console.error('Failed to send status notification:', error);
    }

    fetchData();
  };

  const updateHealthStatus = async (projectId: string, health_status: HealthStatus) => {
    await supabase.from('projects').update({ health_status }).eq('id', projectId);
    toast.success('Health status updated');
    fetchData();
  };

  const updateWaitingOn = async (projectId: string, waiting_on: WaitingOn) => {
    await supabase.from('projects').update({ waiting_on }).eq('id', projectId);
    toast.success('Waiting on updated');
    fetchData();
  };

  const updateSupportPlan = async (projectId: string, support_plan: SupportPlan) => {
    await supabase.from('projects').update({ support_plan }).eq('id', projectId);
    toast.success('Support plan updated');
    fetchData();
  };

  const openDetails = (project: Project) => {
    setDetailsProject(project);
    setEditNotes(project.internal_notes || '');
    setDetailsOpen(true);
  };

  const saveNotes = async () => {
    if (!detailsProject) return;
    setSavingNotes(true);
    await supabase.from('projects').update({ internal_notes: editNotes }).eq('id', detailsProject.id);
    toast.success('Notes saved');
    setSavingNotes(false);
    setDetailsOpen(false);
    fetchData();
  };

  const openLaunchSummary = (project: Project) => {
    setLaunchProject(project);
    setLaunchOpen(true);
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <>
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Projects</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Project Name</Label>
                  <Input value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
                </div>
                <div>
                  <Label>Client</Label>
                  <Select value={newProject.clientId} onValueChange={(v) => setNewProject({ ...newProject, clientId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.user_id} value={c.user_id}>
                          {c.full_name || c.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createProject} className="w-full">
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => {
              const HealthIcon = healthIcons[project.health_status];
              return (
                <div key={project.id} className="p-4 rounded-lg bg-secondary/50 space-y-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{project.name}</h4>
                        <HealthIcon className={`h-4 w-4 ${healthColors[project.health_status]}`} />
                        {project.internal_notes && <StickyNote className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{project.profile?.full_name || project.profile?.email}</p>
                    </div>

                    <div className="flex gap-2 items-center flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => openDetails(project)}>
                        <Eye className="h-4 w-4" />
                      </Button>

                      {project.status === 'delivered' && (
                        <Button size="sm" variant="outline" onClick={() => openLaunchSummary(project)}>
                          <Rocket className="h-4 w-4 mr-1" />
                          Launch
                        </Button>
                      )}

                      <Select value={project.status} onValueChange={(v) => updateStatus(project.id, v as ProjectStatus, project.client_id)}>
                        <SelectTrigger className="w-[130px]">
                          <Badge className={`${statusColors[project.status]} border-0 capitalize`}>{project.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {(['discovery', 'design', 'development', 'review', 'delivered'] as const).map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Health:</span>
                      <Select value={project.health_status} onValueChange={(v) => updateHealthStatus(project.id, v as HealthStatus)}>
                        <SelectTrigger className="h-6 text-xs w-[120px]">
                          <span className={`capitalize ${healthColors[project.health_status]}`}>{project.health_status.replace('_', ' ')}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on_track">On Track</SelectItem>
                          <SelectItem value="needs_attention">Needs Attention</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Waiting on:</span>
                      <Select value={project.waiting_on} onValueChange={(v) => updateWaitingOn(project.id, v as WaitingOn)}>
                        <SelectTrigger className="h-6 text-xs w-[100px]">
                          <span>{waitingOnLabels[project.waiting_on]}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(waitingOnLabels).map(([val, label]) => (
                            <SelectItem key={val} value={val}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Support:</span>
                      <Select value={project.support_plan} onValueChange={(v) => updateSupportPlan(project.id, v as SupportPlan)}>
                        <SelectTrigger className="h-6 text-xs w-[130px]">
                          <span>{supportPlanLabels[project.support_plan]}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Support</SelectItem>
                          <SelectItem value="basic">Basic Support</SelectItem>
                          <SelectItem value="priority">Priority Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && <p className="text-center py-8 text-muted-foreground">No projects yet</p>}
          </div>
        </CardContent>
      </Card>

      {/* Project Details & Notes Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              {detailsProject?.name} - Internal Notes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Client:</strong> {detailsProject?.profile?.full_name || detailsProject?.profile?.email}
              </div>
              <div>
                <strong>Status:</strong> <span className="capitalize">{detailsProject?.status}</span>
              </div>
              <div>
                <strong>Health:</strong> <span className="capitalize">{detailsProject?.health_status?.replace('_', ' ')}</span>
              </div>
              <div>
                <strong>Waiting On:</strong> {detailsProject?.waiting_on && waitingOnLabels[detailsProject.waiting_on]}
              </div>
              <div>
                <strong>Support Plan:</strong> {detailsProject?.support_plan && supportPlanLabels[detailsProject.support_plan]}
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Internal Notes (Admin Only)</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add private notes about this project... (pricing flexibility, red flags, negotiation history, etc.)"
                rows={8}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNotes} disabled={savingNotes}>
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Launch Summary Dialog */}
      {launchProject && (
        <LaunchSummary project={launchProject} open={launchOpen} onOpenChange={setLaunchOpen} onUpdate={fetchData} />
      )}
    </>
  );
}

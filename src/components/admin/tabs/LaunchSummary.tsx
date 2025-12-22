import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Rocket, FileDown, Link as LinkIcon, Calendar, Shield, CheckCircle } from 'lucide-react';

interface Deliverable {
  id: string;
  title: string;
  file_url: string | null;
  external_link: string | null;
  is_delivered: boolean;
}

interface MilestoneApproval {
  id: string;
  approval_type: string;
  approved_at: string;
  notes: string | null;
}

interface LaunchSummaryProps {
  project: {
    id: string;
    name: string;
    support_plan: 'none' | 'basic' | 'priority';
    launch_date: string | null;
    launch_notes: string | null;
    profile?: { email: string; full_name: string | null } | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const supportPlanDetails = {
  none: { name: 'No Support Plan', description: 'No ongoing support included.' },
  basic: { name: 'Basic Support', description: 'Bug fixes and minor updates for 30 days.' },
  priority: { name: 'Priority Support', description: 'Priority bug fixes, updates, and feature requests for 90 days.' },
};

export function LaunchSummary({ project, open, onOpenChange, onUpdate }: LaunchSummaryProps) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [approvals, setApprovals] = useState<MilestoneApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [launchDate, setLaunchDate] = useState(project.launch_date?.split('T')[0] || '');
  const [launchNotes, setLaunchNotes] = useState(project.launch_notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
      setLaunchDate(project.launch_date?.split('T')[0] || '');
      setLaunchNotes(project.launch_notes || '');
    }
  }, [open, project.id]);

  const fetchData = async () => {
    setLoading(true);
    const [delRes, appRes] = await Promise.all([
      supabase.from('deliverables').select('id, title, file_url, external_link, is_delivered').eq('project_id', project.id),
      supabase.from('milestone_approvals').select('id, approval_type, approved_at, notes').eq('project_id', project.id).order('approved_at', { ascending: true }),
    ]);
    setDeliverables(delRes.data || []);
    setApprovals(appRes.data || []);
    setLoading(false);
  };

  const saveLaunchDetails = async () => {
    setSaving(true);
    await supabase.from('projects').update({
      launch_date: launchDate ? new Date(launchDate).toISOString() : null,
      launch_notes: launchNotes,
    }).eq('id', project.id);
    toast.success('Launch details saved');
    setSaving(false);
    onUpdate();
  };

  const deliveredItems = deliverables.filter((d) => d.is_delivered);
  const supportPlan = supportPlanDetails[project.support_plan];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="h-6 w-6 text-primary" />
            Launch Summary - {project.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="p-4 rounded-lg bg-secondary/50">
                <h3 className="font-semibold mb-2">Client</h3>
                <p>{project.profile?.full_name || project.profile?.email || 'Unknown'}</p>
              </div>

              {/* Launch Date & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Launch Date
                  </Label>
                  <Input
                    type="date"
                    value={launchDate}
                    onChange={(e) => setLaunchDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Shield className="h-4 w-4" /> Support Plan
                  </Label>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-sm">{supportPlan.name}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{supportPlan.description}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Launch Notes / Next Steps</Label>
                <Textarea
                  value={launchNotes}
                  onChange={(e) => setLaunchNotes(e.target.value)}
                  placeholder="Add any launch notes, next steps, or handoff instructions..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <Separator />

              {/* Deliverables */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  Final Deliverables ({deliveredItems.length})
                </h3>
                {deliveredItems.length > 0 ? (
                  <div className="space-y-2">
                    {deliveredItems.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded bg-secondary/30">
                        <span>{d.title}</span>
                        <div className="flex gap-2">
                          {d.file_url && (
                            <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline">
                                <FileDown className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </a>
                          )}
                          {d.external_link && (
                            <a href={d.external_link} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline">
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Open Link
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No deliverables marked as delivered yet.</p>
                )}
              </div>

              <Separator />

              {/* Client Approvals */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Client Approvals ({approvals.length})
                </h3>
                {approvals.length > 0 ? (
                  <div className="space-y-2">
                    {approvals.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded bg-secondary/30">
                        <div>
                          <span className="capitalize">{a.approval_type.replace(/_/g, ' ')}</span>
                          {a.notes && <p className="text-xs text-muted-foreground">{a.notes}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.approved_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No approvals recorded yet.</p>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={saveLaunchDetails} disabled={saving}>
            {saving ? 'Saving...' : 'Save Launch Details'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

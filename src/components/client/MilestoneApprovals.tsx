import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle, Clock, FileCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

interface MilestoneApproval {
  id: string;
  approval_type: string;
  approved_at: string;
  notes: string | null;
}

interface MilestoneApprovalsProps {
  projectId: string;
}

const approvalTypes = [
  { id: 'design_approval', label: 'Design Approval', description: 'Approve the design mockups and visual direction' },
  { id: 'scope_approval', label: 'Scope Approval', description: 'Approve the project scope and requirements' },
  { id: 'development_approval', label: 'Development Approval', description: 'Approve development progress and implementation' },
  { id: 'final_approval', label: 'Final Approval', description: 'Approve the final deliverables for launch' },
];

export function MilestoneApprovals({ projectId }: MilestoneApprovalsProps) {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<MilestoneApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchApprovals = async () => {
    const { data } = await supabase
      .from('milestone_approvals')
      .select('*')
      .eq('project_id', projectId)
      .order('approved_at', { ascending: true });
    setApprovals(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchApprovals();
  }, [projectId]);

  const submitApproval = async () => {
    if (!user || !selectedType) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from('milestone_approvals').insert({
        project_id: projectId,
        approval_type: selectedType,
        approved_by: user.id,
        notes: notes || null,
      });

      if (error) throw error;
      toast.success('Approval submitted successfully!');
      setDialogOpen(false);
      setNotes('');
      setSelectedType(null);
      fetchApprovals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit approval');
    } finally {
      setSubmitting(false);
    }
  };

  const getApprovalForType = (typeId: string) => {
    return approvals.find((a) => a.approval_type === typeId);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading approvals...</div>;
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Project Approvals
        </CardTitle>
        <CardDescription>
          Provide your approval at key project milestones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {approvalTypes.map((type) => {
            const approval = getApprovalForType(type.id);
            const isApproved = !!approval;

            return (
              <div key={type.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-start gap-3">
                  {isApproved ? (
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-medium">{type.label}</h4>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                    {approval && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Approved on {new Date(approval.approved_at).toLocaleDateString()}
                        {approval.notes && ` - "${approval.notes}"`}
                      </p>
                    )}
                  </div>
                </div>
                {isApproved ? (
                  <Badge className="bg-green-500/20 text-green-400 border-0">Approved</Badge>
                ) : (
                  <Dialog open={dialogOpen && selectedType === type.id} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (open) setSelectedType(type.id);
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedType(type.id)}>
                        Approve
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm {type.label}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          By approving, you confirm that you have reviewed and accept the {type.label.toLowerCase()} stage of your project.
                        </p>
                        <div>
                          <label className="text-sm font-medium">Notes (optional)</label>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional comments..."
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={submitApproval} disabled={submitting}>
                          {submitting ? 'Submitting...' : 'Confirm Approval'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

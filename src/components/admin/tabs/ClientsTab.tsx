import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Client {
  id: string;
  user_id: string;
  approval_status: string;
  company_name: string | null;
  project_description: string | null;
  profile?: { email: string; full_name: string | null } | null;
}

export function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    const { data: onboardingData } = await supabase
      .from('client_onboarding')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (onboardingData) {
      const clientsWithProfiles = await Promise.all(
        onboardingData.map(async (client) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', client.user_id)
            .maybeSingle();
          return { ...client, profile };
        })
      );
      setClients(clientsWithProfiles);
    }
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const approveClient = async (userId: string) => {
    await supabase.from('client_onboarding').update({ approval_status: 'approved', approved_at: new Date().toISOString() }).eq('user_id', userId);
    toast.success('Client approved!');
    fetchClients();
  };

  const rejectClient = async (userId: string) => {
    await supabase.from('client_onboarding').update({ approval_status: 'rejected' }).eq('user_id', userId);
    toast.success('Client rejected');
    fetchClients();
  };

  const statusColors: Record<string, string> = { pending: 'bg-yellow-500/20 text-yellow-400', approved: 'bg-green-500/20 text-green-400', rejected: 'bg-red-500/20 text-red-400' };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <Card className="glass">
      <CardHeader><CardTitle>All Clients</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.map((client) => (
            <div key={client.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{client.profile?.full_name || client.profile?.email || 'Unknown'}</h4>
                  <Badge className={`${statusColors[client.approval_status]} border-0 capitalize`}>{client.approval_status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{client.company_name || 'No company name'}</p>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild><Button size="sm" variant="secondary"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Client Details</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><strong>Email:</strong> {client.profile?.email}</div>
                      <div><strong>Company:</strong> {client.company_name || 'N/A'}</div>
                      <div><strong>Description:</strong> {client.project_description || 'N/A'}</div>
                    </div>
                  </DialogContent>
                </Dialog>
                {client.approval_status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => approveClient(client.user_id)}><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => rejectClient(client.user_id)}><X className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {clients.length === 0 && <p className="text-center py-8 text-muted-foreground">No clients yet</p>}
        </div>
      </CardContent>
    </Card>
  );
}

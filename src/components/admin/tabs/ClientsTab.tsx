import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Eye, FileText, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Client {
  id: string;
  user_id: string;
  approval_status: string;
  company_name: string | null;
  project_description: string | null;
  additional_details: string | null;
  logo_url: string | null;
  inspiration_images: string[] | null;
  submitted_at: string | null;
  profile?: { email: string; full_name: string | null } | null;
  has_contract?: boolean;
  has_signed_contract?: boolean;
}

export function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [contractForm, setContractForm] = useState({ title: '', content: '' });
  const [sending, setSending] = useState(false);

  const fetchClients = async () => {
    const { data: onboardingData } = await supabase
      .from('client_onboarding')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (onboardingData) {
      const clientsWithProfiles = await Promise.all(
        onboardingData.map(async (client) => {
          const [profileRes, contractRes] = await Promise.all([
            supabase.from('profiles').select('email, full_name').eq('user_id', client.user_id).maybeSingle(),
            supabase.from('contracts').select('id, is_signed').eq('client_id', client.user_id),
          ]);
          
          const contracts = contractRes.data || [];
          const hasContract = contracts.length > 0;
          const hasSignedContract = contracts.some(c => c.is_signed);

          return { 
            ...client, 
            profile: profileRes.data,
            has_contract: hasContract,
            has_signed_contract: hasSignedContract,
          };
        })
      );
      setClients(clientsWithProfiles);
    }
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const approveClient = async (userId: string) => {
    await supabase.from('client_onboarding').update({ approval_status: 'approved', approved_at: new Date().toISOString() }).eq('user_id', userId);
    
    // Send email notification
    try {
      await supabase.functions.invoke('send-notification', {
        body: { type: 'client_approved', clientId: userId }
      });
    } catch (e) {
      console.log('Email notification failed');
    }
    
    toast.success('Client approved!');
    fetchClients();
  };

  const rejectClient = async (userId: string) => {
    await supabase.from('client_onboarding').update({ approval_status: 'rejected' }).eq('user_id', userId);
    toast.success('Client rejected');
    fetchClients();
  };

  const openContractDialog = (client: Client) => {
    setSelectedClient(client);
    setContractForm({ 
      title: `Project Agreement - ${client.company_name || 'Client'}`,
      content: `PROJECT AGREEMENT

This agreement is entered into between the Studio and ${client.company_name || 'the Client'}.

SCOPE OF WORK:
${client.project_description || 'To be defined'}

TERMS AND CONDITIONS:
1. The Studio agrees to provide design services as outlined above.
2. The Client agrees to provide timely feedback and approvals.
3. Payment terms will be defined in separate invoices.
4. Both parties agree to maintain confidentiality.

ACCEPTANCE:
By signing below, both parties agree to the terms outlined in this agreement.`
    });
    setContractDialogOpen(true);
  };

  const sendContract = async () => {
    if (!selectedClient || !contractForm.title || !contractForm.content) {
      toast.error('Please fill in all contract fields');
      return;
    }

    setSending(true);

    try {
      // First, check if a project exists for this client, if not create one
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', selectedClient.user_id)
        .maybeSingle();

      let projectId = existingProject?.id;

      if (!projectId) {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: selectedClient.company_name || 'New Project',
            client_id: selectedClient.user_id,
            description: selectedClient.project_description,
          })
          .select('id')
          .single();

        if (projectError) throw projectError;
        projectId = newProject.id;
      }

      // Create the contract
      const { error } = await supabase.from('contracts').insert({
        client_id: selectedClient.user_id,
        project_id: projectId,
        title: contractForm.title,
        content: contractForm.content,
      });

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke('send-notification', {
          body: { type: 'contract_sent', clientId: selectedClient.user_id }
        });
      } catch (e) {
        console.log('Email notification failed');
      }

      toast.success('Contract sent to client!');
      setContractDialogOpen(false);
      setContractForm({ title: '', content: '' });
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      console.error('Send contract error:', error);
      toast.error(error.message || 'Failed to send contract');
    } finally {
      setSending(false);
    }
  };

  const statusColors: Record<string, string> = { 
    pending: 'bg-yellow-500/20 text-yellow-400', 
    approved: 'bg-green-500/20 text-green-400', 
    rejected: 'bg-red-500/20 text-red-400' 
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <>
      <Card className="glass">
        <CardHeader><CardTitle>All Clients</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-medium">{client.profile?.full_name || client.profile?.email || 'Unknown'}</h4>
                    <Badge className={`${statusColors[client.approval_status]} border-0 capitalize`}>{client.approval_status}</Badge>
                    {client.approval_status === 'approved' && (
                      <>
                        {client.has_signed_contract && (
                          <Badge className="bg-green-500/20 text-green-400 border-0">Contract Signed</Badge>
                        )}
                        {client.has_contract && !client.has_signed_contract && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-0">Contract Pending</Badge>
                        )}
                        {!client.has_contract && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-0">No Contract</Badge>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{client.company_name || 'No company name'}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary"><Eye className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader><DialogTitle>Client Details</DialogTitle></DialogHeader>
                      <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-4">
                          <div><strong>Email:</strong> {client.profile?.email}</div>
                          <div><strong>Full Name:</strong> {client.profile?.full_name || 'N/A'}</div>
                          <div><strong>Company:</strong> {client.company_name || 'N/A'}</div>
                          <div><strong>Status:</strong> <Badge className={`${statusColors[client.approval_status]} border-0 capitalize`}>{client.approval_status}</Badge></div>
                          <div><strong>Submitted:</strong> {client.submitted_at ? new Date(client.submitted_at).toLocaleString() : 'Not submitted'}</div>
                          
                          <div>
                            <strong>Project Description:</strong>
                            <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{client.project_description || 'N/A'}</p>
                          </div>
                          
                          <div>
                            <strong>Additional Details:</strong>
                            <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{client.additional_details || 'N/A'}</p>
                          </div>

                          {client.logo_url && (
                            <div>
                              <strong>Logo:</strong>
                              <div className="mt-2">
                                <img 
                                  src={client.logo_url} 
                                  alt="Client Logo" 
                                  className="max-w-[200px] max-h-[200px] rounded-lg border border-border object-contain"
                                />
                              </div>
                            </div>
                          )}

                          {client.inspiration_images && client.inspiration_images.length > 0 && (
                            <div>
                              <strong>Inspiration Images ({client.inspiration_images.length}):</strong>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {client.inspiration_images.map((url, index) => (
                                  <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                    <img 
                                      src={url} 
                                      alt={`Inspiration ${index + 1}`} 
                                      className="w-full h-32 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  
                  {client.approval_status === 'approved' && !client.has_contract && (
                    <Button size="sm" variant="outline" onClick={() => openContractDialog(client)}>
                      <Send className="h-4 w-4 mr-1" />
                      Send Contract
                    </Button>
                  )}
                  
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

      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Send Contract to {selectedClient?.profile?.full_name || selectedClient?.company_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Contract Title</Label>
              <Input 
                value={contractForm.title}
                onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                placeholder="Project Agreement"
              />
            </div>
            <div>
              <Label>Contract Content</Label>
              <Textarea 
                value={contractForm.content}
                onChange={(e) => setContractForm({ ...contractForm, content: e.target.value })}
                placeholder="Enter the contract terms..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractDialogOpen(false)}>Cancel</Button>
            <Button onClick={sendContract} disabled={sending}>
              {sending ? 'Sending...' : 'Send Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

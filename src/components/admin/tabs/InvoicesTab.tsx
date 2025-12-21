import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Receipt, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'paid' | 'overdue';
  due_date: string | null;
  created_at: string;
  project_id: string;
  client_id: string;
  project?: { name: string } | null;
  profile?: { email: string; full_name: string | null } | null;
}

interface Project {
  id: string;
  name: string;
  client_id: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-green-500/20 text-green-400',
  overdue: 'bg-red-500/20 text-red-400',
};

export function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    projectId: '',
    amount: '',
    description: '',
    dueDate: '',
  });

  const fetchData = async () => {
    const [invoicesRes, projectsRes, profilesRes] = await Promise.all([
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, client_id'),
      supabase.from('profiles').select('user_id, email, full_name'),
    ]);

    if (invoicesRes.data && projectsRes.data && profilesRes.data) {
      const projectMap = new Map(projectsRes.data.map(p => [p.id, p]));
      const profileMap = new Map(profilesRes.data.map(p => [p.user_id, p]));
      
      const invoicesWithDetails = invoicesRes.data.map(inv => {
        const project = projectMap.get(inv.project_id);
        return {
          ...inv,
          project: project ? { name: project.name } : null,
          profile: project ? profileMap.get(project.client_id) || null : null,
        };
      });
      
      setInvoices(invoicesWithDetails);
      setProjects(projectsRes.data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createInvoice = async () => {
    if (!newInvoice.projectId || !newInvoice.amount || !newInvoice.description) {
      toast.error('Please fill all required fields');
      return;
    }

    const project = projects.find(p => p.id === newInvoice.projectId);
    if (!project) return;

    const amountInCents = Math.round(parseFloat(newInvoice.amount) * 100);

    const { error } = await supabase.from('invoices').insert({
      project_id: newInvoice.projectId,
      client_id: project.client_id,
      amount: amountInCents,
      description: newInvoice.description,
      due_date: newInvoice.dueDate || null,
    });

    if (error) {
      toast.error('Failed to create invoice');
      return;
    }

    // Send email notification
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'invoice_created',
          clientId: project.client_id,
          data: { amount: newInvoice.amount, description: newInvoice.description }
        }
      });
    } catch (e) {
      console.log('Email notification failed, but invoice was created');
    }

    toast.success('Invoice created and sent!');
    setNewInvoice({ projectId: '', amount: '', description: '', dueDate: '' });
    setDialogOpen(false);
    fetchData();
  };

  const updateStatus = async (invoiceId: string, status: 'pending' | 'paid' | 'overdue') => {
    await supabase.from('invoices').update({ 
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null
    }).eq('id', invoiceId);
    toast.success('Status updated');
    fetchData();
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoices
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Create Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Project</Label>
                <Select value={newInvoice.projectId} onValueChange={(v) => setNewInvoice({ ...newInvoice, projectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00"
                    className="pl-9"
                    value={newInvoice.amount} 
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })} 
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  placeholder="Invoice description..."
                  value={newInvoice.description} 
                  onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })} 
                />
              </div>
              <div>
                <Label>Due Date (optional)</Label>
                <Input 
                  type="date" 
                  value={newInvoice.dueDate} 
                  onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} 
                />
              </div>
              <Button onClick={createInvoice} className="w-full">Create & Send Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{invoice.description}</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {invoice.project?.name} • {invoice.profile?.full_name || invoice.profile?.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                  {invoice.due_date && ` • Due: ${format(new Date(invoice.due_date), 'MMM d, yyyy')}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-lg">{formatAmount(invoice.amount, invoice.currency)}</p>
              </div>
              <Select value={invoice.status} onValueChange={(v) => updateStatus(invoice.id, v as 'pending' | 'paid' | 'overdue')}>
                <SelectTrigger className="w-[120px]">
                  <Badge className={`${statusColors[invoice.status]} border-0 capitalize`}>{invoice.status}</Badge>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          {invoices.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No invoices yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

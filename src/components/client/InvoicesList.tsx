import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  due_date: string | null;
  created_at: string;
  stripe_checkout_session_id: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-green-500/20 text-green-400',
  overdue: 'bg-red-500/20 text-red-400',
};

export function InvoicesList({ projectId }: { projectId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data } = await supabase.from('invoices').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (data) setInvoices(data);
      setLoading(false);
    };
    fetchInvoices();
  }, [projectId]);

  const formatAmount = (amount: number, currency: string) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);

  if (loading) return <Card className="glass"><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>;

  if (invoices.length === 0) {
    return (
      <Card className="glass">
        <CardHeader><CardTitle>Invoices</CardTitle><CardDescription>Your payment history</CardDescription></CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No invoices yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader><CardTitle>Invoices</CardTitle><CardDescription>Your payment history</CardDescription></CardHeader>
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
                  <Badge className={`${statusColors[invoice.status]} border-0 capitalize`}>{invoice.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{format(new Date(invoice.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatAmount(invoice.amount, invoice.currency)}</p>
                {invoice.status === 'pending' && (
                  <Button size="sm" className="mt-2 gradient-primary"><CreditCard className="h-4 w-4 mr-1" />Pay Now</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

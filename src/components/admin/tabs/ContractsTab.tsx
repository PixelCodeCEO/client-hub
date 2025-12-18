import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, FileText, Check, Clock } from 'lucide-react';

interface Contract {
  id: string;
  title: string;
  content: string;
  is_signed: boolean;
  signed_at: string | null;
  signature_data: string | null;
  created_at: string;
  client_id: string;
  project_id: string;
  profile?: { email: string; full_name: string | null } | null;
  project?: { name: string } | null;
}

export function ContractsTab() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = async () => {
    const { data: contractsData } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (contractsData) {
      const contractsWithDetails = await Promise.all(
        contractsData.map(async (contract) => {
          const [profileRes, projectRes] = await Promise.all([
            supabase.from('profiles').select('email, full_name').eq('user_id', contract.client_id).maybeSingle(),
            supabase.from('projects').select('name').eq('id', contract.project_id).maybeSingle(),
          ]);

          return {
            ...contract,
            profile: profileRes.data,
            project: projectRes.data,
          };
        })
      );
      setContracts(contractsWithDetails);
    }
    setLoading(false);
  };

  useEffect(() => { fetchContracts(); }, []);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          All Contracts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div key={contract.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium">{contract.title}</h4>
                  {contract.is_signed ? (
                    <Badge className="bg-green-500/20 text-green-400 border-0">
                      <Check className="h-3 w-3 mr-1" />
                      Signed
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-0">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {contract.profile?.full_name || contract.profile?.email} • {contract.project?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Created: {new Date(contract.created_at).toLocaleDateString()}
                  {contract.signed_at && ` • Signed: ${new Date(contract.signed_at).toLocaleDateString()}`}
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>{contract.title}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <strong>Status:</strong>
                        {contract.is_signed ? (
                          <Badge className="bg-green-500/20 text-green-400 border-0">Signed</Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending Signature</Badge>
                        )}
                      </div>
                      <div><strong>Client:</strong> {contract.profile?.full_name || contract.profile?.email}</div>
                      <div><strong>Project:</strong> {contract.project?.name}</div>
                      
                      <div>
                        <strong>Contract Content:</strong>
                        <div className="mt-2 bg-secondary/50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                          {contract.content}
                        </div>
                      </div>

                      {contract.is_signed && contract.signature_data && (
                        <div>
                          <strong>Signature:</strong>
                          <div className="mt-2 bg-white rounded-lg p-2 inline-block">
                            <img 
                              src={contract.signature_data} 
                              alt="Client Signature" 
                              className="max-h-[100px]"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Signed on: {contract.signed_at ? new Date(contract.signed_at).toLocaleString() : 'Unknown'}
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          ))}
          {contracts.length === 0 && <p className="text-center py-8 text-muted-foreground">No contracts yet</p>}
        </div>
      </CardContent>
    </Card>
  );
}

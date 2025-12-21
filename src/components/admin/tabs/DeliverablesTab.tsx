import { useState, useEffect, useRef } from 'react';
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
import { Plus, FileText, Upload, ExternalLink, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  external_link: string | null;
  version: number;
  is_delivered: boolean;
  delivered_at: string | null;
  project_id: string;
  project?: { name: string } | null;
}

interface Project {
  id: string;
  name: string;
  client_id: string;
}

export function DeliverablesTab() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newDeliverable, setNewDeliverable] = useState({
    projectId: '',
    title: '',
    description: '',
    externalLink: '',
    fileType: 'document',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = async () => {
    const [deliverablesRes, projectsRes] = await Promise.all([
      supabase.from('deliverables').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, client_id'),
    ]);

    if (deliverablesRes.data && projectsRes.data) {
      const projectMap = new Map(projectsRes.data.map(p => [p.id, p]));
      const deliverablesWithProjects = deliverablesRes.data.map(d => ({
        ...d,
        project: projectMap.get(d.project_id) || null,
      }));
      setDeliverables(deliverablesWithProjects);
      setProjects(projectsRes.data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const createDeliverable = async () => {
    if (!newDeliverable.projectId || !newDeliverable.title) {
      toast.error('Please fill project and title');
      return;
    }

    if (!selectedFile && !newDeliverable.externalLink) {
      toast.error('Please upload a file or provide an external link');
      return;
    }

    setUploading(true);
    let fileUrl: string | null = null;

    if (selectedFile) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        setUploading(false);
        return;
      }

      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `deliverables/${newDeliverable.projectId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, selectedFile);

      if (uploadError) {
        toast.error('Failed to upload file');
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(filePath);
      fileUrl = publicUrl;
    }

    const project = projects.find(p => p.id === newDeliverable.projectId);

    const { error } = await supabase.from('deliverables').insert({
      project_id: newDeliverable.projectId,
      title: newDeliverable.title,
      description: newDeliverable.description || null,
      file_url: fileUrl,
      file_type: newDeliverable.fileType,
      external_link: newDeliverable.externalLink || null,
      is_delivered: true,
      delivered_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to create deliverable');
      setUploading(false);
      return;
    }

    // Send email notification
    if (project) {
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'deliverable_sent',
            clientId: project.client_id,
            data: { title: newDeliverable.title }
          }
        });
      } catch (e) {
        console.log('Email notification failed, but deliverable was created');
      }
    }

    toast.success('Deliverable sent!');
    setNewDeliverable({ projectId: '', title: '', description: '', externalLink: '', fileType: 'document' });
    setSelectedFile(null);
    setDialogOpen(false);
    setUploading(false);
    fetchData();
  };

  const deleteDeliverable = async (id: string) => {
    await supabase.from('deliverables').delete().eq('id', id);
    toast.success('Deliverable deleted');
    fetchData();
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Deliverables
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Send Deliverable</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Deliverable</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Project</Label>
                <Select value={newDeliverable.projectId} onValueChange={(v) => setNewDeliverable({ ...newDeliverable, projectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input 
                  placeholder="Deliverable title"
                  value={newDeliverable.title} 
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, title: e.target.value })} 
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea 
                  placeholder="Describe this deliverable..."
                  value={newDeliverable.description} 
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })} 
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newDeliverable.fileType} onValueChange={(v) => setNewDeliverable({ ...newDeliverable, fileType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="app">Application</SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Upload File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : 'Choose file'}
                </Button>
              </div>
              <div>
                <Label>Or External Link</Label>
                <Input 
                  placeholder="https://..."
                  value={newDeliverable.externalLink} 
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, externalLink: e.target.value })} 
                />
              </div>
              <Button onClick={createDeliverable} className="w-full" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Send Deliverable'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deliverables.map((deliverable) => (
            <div key={deliverable.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{deliverable.title}</h4>
                  <Badge variant="secondary">v{deliverable.version}</Badge>
                  {deliverable.is_delivered && (
                    <Badge className="bg-green-500/20 text-green-400 border-0">Delivered</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {deliverable.project?.name}
                </p>
                {deliverable.delivered_at && (
                  <p className="text-xs text-muted-foreground">
                    Delivered: {format(new Date(deliverable.delivered_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {deliverable.file_url && (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={deliverable.file_url} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {deliverable.external_link && (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={deliverable.external_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => deleteDeliverable(deliverable.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {deliverables.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No deliverables yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

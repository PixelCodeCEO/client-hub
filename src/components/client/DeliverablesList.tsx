import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, Image, Package, Globe } from 'lucide-react';
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
  created_at: string;
}

interface DeliverablesListProps {
  projectId: string;
}

const fileTypeIcons: Record<string, typeof FileText> = {
  image: Image,
  document: FileText,
  app: Package,
  link: Globe,
};

export function DeliverablesList({ projectId }: DeliverablesListProps) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliverables = async () => {
      const { data, error } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_delivered', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDeliverables(data);
      }
      setLoading(false);
    };

    fetchDeliverables();
  }, [projectId]);

  const getIcon = (fileType: string | null) => {
    const Icon = fileTypeIcons[fileType || 'document'] || FileText;
    return Icon;
  };

  if (loading) {
    return (
      <Card className="glass">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading deliverables...
        </CardContent>
      </Card>
    );
  }

  if (deliverables.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>Deliverables</CardTitle>
          <CardDescription>Files and links shared with you</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No deliverables yet</p>
          <p className="text-sm">Files will appear here as they're shared with you</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Deliverables</CardTitle>
        <CardDescription>Files and links shared with you</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deliverables.map((deliverable) => {
            const Icon = getIcon(deliverable.file_type);
            
            return (
              <div 
                key={deliverable.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{deliverable.title}</h4>
                    <Badge variant="secondary" className="shrink-0">v{deliverable.version}</Badge>
                  </div>
                  {deliverable.description && (
                    <p className="text-sm text-muted-foreground mb-2">{deliverable.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Delivered {deliverable.delivered_at 
                      ? format(new Date(deliverable.delivered_at), 'MMM d, yyyy')
                      : format(new Date(deliverable.created_at), 'MMM d, yyyy')}
                  </p>
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
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

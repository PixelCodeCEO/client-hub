import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, PenTool, RotateCcw, Check, FileText } from 'lucide-react';

interface Contract {
  id: string;
  title: string;
  content: string;
}

export function ContractSigning() {
  const { user, refreshAuth } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('contracts')
        .select('id, title, content')
        .eq('client_id', user.id)
        .eq('is_signed', false)
        .maybeSingle();
      
      setContract(data);
      setLoading(false);
    };

    fetchContract();
  }, [user]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !contract) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = 'hsl(217, 91%, 60%)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [contract]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = 'touches' in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = 'touches' in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!user || !canvasRef.current || !hasSignature || !contract) return;

    setSigning(true);

    try {
      const signatureData = canvasRef.current.toDataURL('image/png');

      const { error } = await supabase
        .from('contracts')
        .update({
          signature_data: signatureData,
          is_signed: true,
          signed_at: new Date().toISOString(),
        })
        .eq('id', contract.id)
        .eq('client_id', user.id);

      if (error) throw error;

      toast.success('Contract signed successfully!');
      await refreshAuth();
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="glass max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle>No Contract Available</CardTitle>
            <CardDescription>
              Your contract is being prepared. Please check back soon or contact us for more information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-2xl">{contract.title}</CardTitle>
            <CardDescription>Please read the contract carefully before signing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div 
                className="bg-secondary/50 rounded-lg p-6 max-h-[400px] overflow-y-auto whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: contract.content }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Draw Your Signature
            </CardTitle>
            <CardDescription>Sign in the box below using your mouse or finger</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative border-2 border-dashed border-border rounded-lg overflow-hidden bg-secondary/20">
              <canvas
                ref={canvasRef}
                className="w-full h-[200px] cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={clearSignature}
                  disabled={!hasSignature}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleSign} 
              className="w-full gradient-primary" 
              disabled={signing || !hasSignature}
            >
              {signing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Sign Contract
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

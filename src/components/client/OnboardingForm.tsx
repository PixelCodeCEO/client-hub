import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Loader2, X, Clock } from 'lucide-react';

export function OnboardingForm() {
  const { user, approvalStatus, refreshAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [formData, setFormData] = useState({
    companyName: '',
    projectDescription: '',
    additionalDetails: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [inspirationFiles, setInspirationFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Check if form was already submitted (submitted_at exists)
  useEffect(() => {
    const checkSubmitted = async () => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      const { data } = await supabase
        .from('client_onboarding')
        .select('submitted_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.submitted_at) {
        setSubmitted(true);
      }
      setCheckingStatus(false);
    };

    checkSubmitted();
  }, [user]);

  const uploadFile = async (file: File, folder: 'logos' | 'inspiration') => {
    const body = new FormData();
    body.append('file', file);
    body.append('folder', folder);

    const { data, error } = await supabase.functions.invoke<{ publicUrl: string }>(
      'upload-file',
      { body }
    );

    if (error) throw error;
    if (!data?.publicUrl) throw new Error('Upload failed');

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, 'logos');
      }

      const inspirationUrls: string[] = [];
      for (const file of inspirationFiles) {
        const url = await uploadFile(file, 'inspiration');
        inspirationUrls.push(url);
      }

      const { error } = await supabase
        .from('client_onboarding')
        .update({
          company_name: formData.companyName,
          logo_url: logoUrl,
          inspiration_images: inspirationUrls,
          project_description: formData.projectDescription,
          additional_details: formData.additionalDetails,
          submitted_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Your information has been submitted!');
      setSubmitted(true);
      await refreshAuth();
    } catch (error: any) {
      console.error('Submit error:', error);
      const message =
        error?.message === 'Failed to fetch'
          ? 'Could not reach the backend. Please try again.'
          : error?.message || 'Failed to submit';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const removeInspirationFile = (index: number) => {
    setInspirationFiles(files => files.filter((_, i) => i !== index));
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (approvalStatus === 'pending' && submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass animate-scale-in text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Application Submitted</CardTitle>
            <CardDescription className="text-base">
              Thank you for your interest! We're reviewing your application and will get back to you soon.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-2xl relative glass animate-slide-up">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-foreground">Account Pending Approval</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Tell us about your project so we can prepare the best experience for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company / Project Name</Label>
              <Input
                id="companyName"
                placeholder="Acme Inc."
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo (Optional)</Label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    {logoFile ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate">{logoFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            setLogoFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-sm">Click to upload logo</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspiration">Inspiration Images (Optional)</Label>
              <div className="space-y-2">
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <span className="text-sm">Click to upload inspiration images</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setInspirationFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                  />
                </label>
                {inspirationFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {inspirationFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5">
                        <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => removeInspirationFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription">Project Description</Label>
              <Textarea
                id="projectDescription"
                placeholder="Tell us about your project, what you're building, and your goals..."
                rows={4}
                value={formData.projectDescription}
                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalDetails">Additional Details / Questions</Label>
              <Textarea
                id="additionalDetails"
                placeholder="Any other details you'd like us to know, or questions you have..."
                rows={3}
                value={formData.additionalDetails}
                onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full gradient-primary" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Application
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

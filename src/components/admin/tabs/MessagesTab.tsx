import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  client_id: string;
  profile?: { email: string; full_name: string | null } | null;
}

export function MessagesTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      const [projectsRes, profilesRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, email, full_name'),
      ]);

      if (projectsRes.data && profilesRes.data) {
        const profileMap = new Map(profilesRes.data.map(p => [p.user_id, p]));
        const projectsWithProfiles = projectsRes.data.map(project => ({
          ...project,
          profile: profileMap.get(project.client_id) || null
        }));
        setProjects(projectsWithProfiles);
        if (projectsWithProfiles.length > 0) {
          setSelectedProject(projectsWithProfiles[0].id);
        }
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', selectedProject)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`admin-messages-${selectedProject}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${selectedProject}` },
        (payload) => setMessages(prev => [...prev, payload.new as Message]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedProject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedProject) return;
    setSending(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('messages').insert({ 
      project_id: selectedProject, 
      sender_id: user.id, 
      content: newMessage.trim() 
    });

    // Send email notification to client
    if (selectedProjectData?.client_id) {
      try {
        await supabase.functions.invoke('send-notification', {
          body: { type: 'message_received', clientId: selectedProjectData.client_id }
        });
      } catch (error) {
        console.error('Failed to send message notification:', error);
      }
    }

    setNewMessage('');
    setSending(false);
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <Card className="glass h-[700px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
          <Select value={selectedProject || ''} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name} - {project.profile?.full_name || project.profile?.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedProjectData && (
          <p className="text-sm text-muted-foreground">
            Chatting with: {selectedProjectData.profile?.full_name || selectedProjectData.profile?.email}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {projects.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No projects with clients yet
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.sender_id !== selectedProjectData?.client_id;
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg px-4 py-2 ${isAdmin ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                        <p className="text-xs opacity-70 mb-1">{isAdmin ? 'You' : 'Client'}</p>
                        <p>{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">{format(new Date(msg.created_at), 'MMM d, HH:mm')}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
                disabled={!selectedProject}
              />
              <Button type="submit" disabled={sending || !newMessage.trim() || !selectedProject}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}

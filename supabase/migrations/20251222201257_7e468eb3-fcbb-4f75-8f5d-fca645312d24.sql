-- Create enum for support plans
CREATE TYPE public.support_plan AS ENUM ('none', 'basic', 'priority');

-- Create enum for project health status
CREATE TYPE public.health_status AS ENUM ('on_track', 'needs_attention', 'blocked');

-- Create enum for waiting on indicator
CREATE TYPE public.waiting_on AS ENUM ('client', 'payment', 'assets', 'approval', 'us', 'none');

-- Add internal notes column to client_onboarding (admin-only notes about clients)
ALTER TABLE public.client_onboarding 
ADD COLUMN internal_notes TEXT;

-- Add new columns to projects table
ALTER TABLE public.projects 
ADD COLUMN internal_notes TEXT,
ADD COLUMN support_plan support_plan NOT NULL DEFAULT 'none',
ADD COLUMN health_status health_status NOT NULL DEFAULT 'on_track',
ADD COLUMN waiting_on waiting_on NOT NULL DEFAULT 'none',
ADD COLUMN launch_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN launch_notes TEXT;

-- Create milestone_approvals table for tracking client approvals with timestamps
CREATE TABLE public.milestone_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
  approval_type TEXT NOT NULL, -- e.g., 'design_approval', 'final_deliverables', 'scope_change'
  approved_by UUID NOT NULL, -- client user_id
  approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on milestone_approvals
ALTER TABLE public.milestone_approvals ENABLE ROW LEVEL SECURITY;

-- Admin can manage all milestone approvals
CREATE POLICY "Admins can manage milestone approvals"
ON public.milestone_approvals
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Clients can view their own milestone approvals
CREATE POLICY "Clients can view own milestone approvals"
ON public.milestone_approvals
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = milestone_approvals.project_id 
  AND projects.client_id = auth.uid()
));

-- Clients can insert their own approvals
CREATE POLICY "Clients can create own approvals"
ON public.milestone_approvals
FOR INSERT
WITH CHECK (
  auth.uid() = approved_by AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = milestone_approvals.project_id 
    AND projects.client_id = auth.uid()
  )
);
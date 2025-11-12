-- Migration: 001_initial_schema.sql
-- Description: Create initial schema for Protocol Extractor MVP
-- Date: 2025-11-11

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users table (extends Supabase Auth)
-- Note: Supabase Auth creates auth.users automatically
-- This table stores additional profile data
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'pi', 'coordinator')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE UNIQUE INDEX users_email_idx ON public.users(email);
CREATE INDEX users_role_idx ON public.users(role);

-- RLS policies for users
CREATE POLICY "Users can view all users"
ON public.users FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- studies table
CREATE TABLE public.studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phase text,
  indication text,
  target_enrollment integer CHECK (target_enrollment > 0),
  protocol_data jsonb NOT NULL,
  owner_id uuid NOT NULL REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on studies
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX studies_owner_idx ON public.studies(owner_id);
CREATE INDEX studies_created_at_idx ON public.studies(created_at DESC);
CREATE INDEX studies_protocol_data_gin ON public.studies USING gin(protocol_data);

-- RLS policies for studies
CREATE POLICY "Users can view accessible studies"
ON public.studies FOR SELECT
USING (
  auth.uid() = owner_id
  OR auth.uid() IN (
    SELECT user_id FROM public.study_members
    WHERE study_id = studies.id
  )
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "PIs and Admins can create studies"
ON public.studies FOR INSERT
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('pi', 'admin')
  AND auth.uid() = owner_id
);

CREATE POLICY "Owners and Admins can edit studies"
ON public.studies FOR UPDATE
USING (
  auth.uid() = owner_id
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- study_members table
CREATE TABLE public.study_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('pi', 'coordinator')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(study_id, user_id)
);

-- Enable RLS on study_members
ALTER TABLE public.study_members ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX study_members_study_idx ON public.study_members(study_id);
CREATE INDEX study_members_user_idx ON public.study_members(user_id);
CREATE UNIQUE INDEX study_members_unique_idx ON public.study_members(study_id, user_id);

-- RLS policies for study_members
CREATE POLICY "Users can view team members of accessible studies"
ON public.study_members FOR SELECT
USING (
  study_id IN (SELECT id FROM public.studies)
);

CREATE POLICY "PIs and Admins can add team members"
ON public.study_members FOR INSERT
WITH CHECK (
  (
    (SELECT owner_id FROM public.studies WHERE id = study_id) = auth.uid()
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
  AND user_id IN (SELECT id FROM public.users)
);

CREATE POLICY "PIs and Admins can remove team members"
ON public.study_members FOR DELETE
USING (
  (SELECT owner_id FROM public.studies WHERE id = study_id) = auth.uid()
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- patients table
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  name text NOT NULL,
  enrolled_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX patients_study_idx ON public.patients(study_id);
CREATE INDEX patients_enrolled_date_idx ON public.patients(enrolled_date DESC);

-- RLS policies for patients
CREATE POLICY "Study team members can view patients"
ON public.patients FOR SELECT
USING (
  study_id IN (SELECT id FROM public.studies)
);

CREATE POLICY "Study team members can add patients"
ON public.patients FOR INSERT
WITH CHECK (
  study_id IN (SELECT id FROM public.studies)
);

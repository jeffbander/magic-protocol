# Data Model: Protocol Extractor

**Date**: 2025-11-11
**Feature**: Protocol Extractor
**Phase**: 1 - Data Model Design

## Overview

This document defines the database schema, entity relationships, and validation rules for the Protocol Extractor feature. The schema is implemented in PostgreSQL via Supabase with Row Level Security (RLS) policies for access control.

## Entity Relationship Diagram

```
┌─────────────────┐          ┌─────────────────────┐          ┌──────────────────┐
│     users       │          │  study_members      │          │    studies       │
│─────────────────│          │─────────────────────│          │──────────────────│
│ id (PK, uuid)   │◄────────┤ user_id (FK)        │┌────────►│ id (PK, uuid)    │
│ email (unique)  │          │ study_id (FK)       ││         │ name             │
│ name            │          │ role                ││         │ phase            │
│ role            │          │ created_at          ││         │ indication       │
│ created_at      │          └─────────────────────┘│         │ target_enrollment│
└─────────────────┘                                 │         │ protocol_data    │
                                                    │         │ owner_id (FK)    │
                                                    │         │ created_at       │
                                                    │         └──────────────────┘
                                                    │                 │
                                                    │                 │
                                                    │                 ▼
                                                    │         ┌──────────────────┐
                                                    │         │    patients      │
                                                    │         │──────────────────│
                                                    └────────►│ id (PK, uuid)    │
                                                              │ study_id (FK)    │
                                                              │ name             │
                                                              │ enrolled_date    │
                                                              │ created_at       │
                                                              └──────────────────┘
```

## Entities

### 1. users

**Purpose**: Stores user account information and roles. Managed primarily by Supabase Auth with extended profile data.

**Source Requirements**: FR-002, FR-003, FR-004

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, references auth.users | User ID from Supabase Auth |
| email | text | UNIQUE, NOT NULL | User email address (unique identifier) |
| name | text | NOT NULL | Full name of the user |
| role | text | NOT NULL, CHECK (role IN ('admin', 'pi', 'coordinator')) | User role determining permissions |
| created_at | timestamp | DEFAULT now() | Account creation timestamp |

**Validation Rules**:
- Email must be valid format (enforced by Supabase Auth)
- Role is immutable after creation (FR-004) - enforced in application layer, no DB trigger needed
- Name must not be empty string

**Indexes**:
```sql
CREATE UNIQUE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);  -- For filtering by role in admin views
```

**Row Level Security (RLS)**:
```sql
-- Users can view all other users (needed for team member assignment by email lookup)
CREATE POLICY "Users can view all users"
ON users FOR SELECT
USING (true);

-- Users can only update their own profile (future feature, not in MVP)
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);
```

### 2. studies

**Purpose**: Stores clinical trial studies with AI-extracted protocol data.

**Source Requirements**: FR-006 through FR-015, FR-016 through FR-025

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique study identifier |
| name | text | NOT NULL | Study title/name from protocol |
| phase | text | NULL | Study phase (e.g., "Phase 2", "Phase 3") |
| indication | text | NULL | Medical condition being studied |
| target_enrollment | integer | NULL, CHECK (target_enrollment > 0) | Target number of patients |
| protocol_data | jsonb | NOT NULL | Full extracted data (inclusion/exclusion criteria, visit schedule) |
| owner_id | uuid | NOT NULL, REFERENCES users(id) | PI who created the study |
| created_at | timestamp | DEFAULT now() | Study creation timestamp |

**protocol_data JSONB Structure**:
```json
{
  "inclusion_criteria": ["criterion 1", "criterion 2", ...],
  "exclusion_criteria": ["criterion 1", "criterion 2", ...],
  "visit_schedule": ["visit 1", "visit 2", ...]
}
```

**Validation Rules**:
- name must not be empty
- target_enrollment must be positive integer if provided
- protocol_data must contain arrays for inclusion_criteria, exclusion_criteria, visit_schedule
- owner_id must reference an existing user with role 'pi' or 'admin'

**Indexes**:
```sql
CREATE INDEX studies_owner_idx ON studies(owner_id);  -- For "My Studies" queries
CREATE INDEX studies_created_at_idx ON studies(created_at DESC);  -- For sorting by date
CREATE INDEX studies_protocol_data_gin ON studies USING gin(protocol_data);  -- For searching criteria
```

**Row Level Security (RLS)**:
```sql
-- FR-015, FR-016, FR-017: Role-based read access
CREATE POLICY "Users can view accessible studies"
ON studies FOR SELECT
USING (
  -- PIs see studies they created (FR-015)
  auth.uid() = owner_id
  -- OR studies they're assigned to as team members (FR-015)
  OR auth.uid() IN (
    SELECT user_id FROM study_members
    WHERE study_id = studies.id
  )
  -- Admins see all studies (FR-017)
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Only PIs and Admins can create studies
CREATE POLICY "PIs and Admins can create studies"
ON studies FOR INSERT
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('pi', 'admin')
  AND auth.uid() = owner_id  -- Must be owner of study they're creating
);

-- FR-024, FR-025: Study editing (only owner or admin)
CREATE POLICY "Owners and Admins can edit studies"
ON studies FOR UPDATE
USING (
  auth.uid() = owner_id
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
```

### 3. study_members

**Purpose**: Many-to-many relationship between users and studies, enabling team collaboration.

**Source Requirements**: FR-023 through FR-034

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique membership record ID |
| study_id | uuid | NOT NULL, REFERENCES studies(id) ON DELETE CASCADE | Study being assigned to |
| user_id | uuid | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User being assigned |
| role | text | NOT NULL, CHECK (role IN ('pi', 'coordinator')) | Role within this specific study |
| created_at | timestamp | DEFAULT now() | Assignment timestamp |
| UNIQUE (study_id, user_id) | | | Prevents duplicate assignments (FR-027) |

**Validation Rules**:
- role must be 'pi' or 'coordinator' (study-level role, may differ from user's global role)
- Combination of study_id + user_id must be unique (FR-027)

**Indexes**:
```sql
CREATE INDEX study_members_study_idx ON study_members(study_id);  -- For team member lists
CREATE INDEX study_members_user_idx ON study_members(user_id);  -- For "studies I'm assigned to"
CREATE UNIQUE INDEX study_members_unique_idx ON study_members(study_id, user_id);
```

**Row Level Security (RLS)**:
```sql
-- Users can view team members of studies they have access to
CREATE POLICY "Users can view team members of accessible studies"
ON study_members FOR SELECT
USING (
  study_id IN (
    SELECT id FROM studies  -- Leverages studies RLS policy
  )
);

-- FR-023, FR-024: Only PIs and Admins can add team members
CREATE POLICY "PIs and Admins can add team members"
ON study_members FOR INSERT
WITH CHECK (
  (
    -- User is owner of the study
    (SELECT owner_id FROM studies WHERE id = study_id) = auth.uid()
    -- OR user is admin
    OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
  -- AND the user being added actually exists
  AND user_id IN (SELECT id FROM public.users)
);

-- FR-026: Only PIs and Admins can remove team members
CREATE POLICY "PIs and Admins can remove team members"
ON study_members FOR DELETE
USING (
  (SELECT owner_id FROM studies WHERE id = study_id) = auth.uid()
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
```

### 4. patients

**Purpose**: Tracks enrolled patients for enrollment progress monitoring.

**Source Requirements**: FR-031 through FR-040

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique patient record ID |
| study_id | uuid | NOT NULL, REFERENCES studies(id) ON DELETE CASCADE | Study patient is enrolled in |
| name | text | NOT NULL | Patient name (not PHI per assumptions) |
| enrolled_date | date | NOT NULL | Date patient was enrolled |
| created_at | timestamp | DEFAULT now() | Record creation timestamp |

**Validation Rules**:
- name must not be empty
- enrolled_date must not be in the future
- study_id must reference an existing study

**Indexes**:
```sql
CREATE INDEX patients_study_idx ON patients(study_id);  -- For patient lists per study
CREATE INDEX patients_enrolled_date_idx ON patients(enrolled_date DESC);  -- For sorting by enrollment date
```

**Row Level Security (RLS)**:
```sql
-- FR-032, FR-033: All study team members can view patients
CREATE POLICY "Study team members can view patients"
ON patients FOR SELECT
USING (
  study_id IN (
    SELECT id FROM studies  -- Leverages studies RLS policy
  )
);

-- FR-033: All study team members can add patients
CREATE POLICY "Study team members can add patients"
ON patients FOR INSERT
WITH CHECK (
  study_id IN (
    SELECT id FROM studies  -- Leverages studies RLS policy
  )
);

-- No update/delete policies (not in MVP scope)
```

## Database Migration Script

```sql
-- Migration: 001_initial_schema.sql
-- Description: Create initial schema for Protocol Extractor MVP

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
```

## Data Lifecycle & State Transitions

### User Account Lifecycle
```
[New User] --signup--> [Active User] --logout--> [Session Expired]
                             |
                             v
                       [Re-authenticated after 7 days]
```

**States**:
- New User: No account exists
- Active User: Has valid session (< 7 days old)
- Session Expired: Session > 7 days old, must re-authenticate

### Study Lifecycle
```
[PDF Upload] --extraction--> [Extraction Review] --confirm--> [Study Created]
                                     |
                                     v
                            [Extraction Failed/Timeout]

[Study Created] --edit--> [Study Updated] (FR-024, FR-025)
        |
        v
[Team Assignment] --add/remove members--> [Updated Team]
        |
        v
[Patient Enrollment] --add patients--> [Enrollment Progress]
```

**States**:
- PDF Upload: User uploads protocol file
- Extraction Review: AI has extracted data, user reviewing
- Extraction Failed: Timeout (5 min) or error occurred
- Study Created: Confirmed by user, persisted to database
- Study Updated: Fields edited after creation
- Team Assignment: Members added/removed
- Patient Enrollment: Patients added, progress tracked

### Study Member Lifecycle
```
[User Lookup by Email] --add--> [Active Member] --remove--> [Removed from Study]
```

**State Transitions**:
- User Lookup: PI/Admin searches for user by email
- Active Member: User appears in study team list, has study access
- Removed from Study: Access revoked immediately (FR-029)

### Patient Lifecycle (Simple - No States)
```
[Patient Added] --> [Appears in List] (No state changes in MVP)
```

## Validation Summary

| Entity | Constraint | Enforced By | Reference |
|--------|------------|-------------|-----------|
| users.email | Unique, valid format | Supabase Auth + DB UNIQUE | FR-001 |
| users.role | One of: admin, pi, coordinator | DB CHECK constraint | FR-002 |
| studies.target_enrollment | Positive integer | DB CHECK constraint | FR-009 |
| studies.protocol_data | Valid JSON with required arrays | Application layer | FR-009 |
| study_members (study_id, user_id) | Unique combination | DB UNIQUE constraint | FR-027 |
| patients.enrolled_date | Not in future | Application layer | FR-033 |

## Performance Considerations

**Query Patterns** (expected frequency: high/medium/low):
- **High**: Fetch user's accessible studies (dashboard page load)
- **High**: Fetch study details by ID (study detail page)
- **Medium**: Fetch team members for a study
- **Medium**: Fetch patients for a study
- **Low**: Add/remove team members
- **Low**: Create new study
- **Low**: Edit study fields

**Optimization Strategy**:
- Indexes on foreign keys (study_id, user_id, owner_id) for join performance
- GIN index on protocol_data JSONB for future search features
- RLS policies use indexed columns (owner_id, study_id)
- No N+1 queries (use JOIN or single query with RLS)

**Expected Data Volume** (MVP assumptions):
- Users: < 100 in first 2 weeks
- Studies: 5-20 in first 2 weeks (SC-003 goal: 5+)
- Team Members: ~2-5 per study average
- Patients: ~10-50 per study average

**Scalability Notes**:
- Current schema scales to 10,000+ studies, 100,000+ patients without performance issues
- PostgreSQL can handle expected read/write load with standard Supabase instance
- If needed post-MVP: Add caching layer (Redis) for dashboard queries

## TypeScript Types (Generated from Schema)

```typescript
// types/database.types.ts (auto-generated by Supabase CLI)

export type User = {
  id: string
  email: string
  name: string
  role: 'admin' | 'pi' | 'coordinator'
  created_at: string
}

export type Study = {
  id: string
  name: string
  phase: string | null
  indication: string | null
  target_enrollment: number | null
  protocol_data: {
    inclusion_criteria: string[]
    exclusion_criteria: string[]
    visit_schedule: string[]
  }
  owner_id: string
  created_at: string
}

export type StudyMember = {
  id: string
  study_id: string
  user_id: string
  role: 'pi' | 'coordinator'
  created_at: string
}

export type Patient = {
  id: string
  study_id: string
  name: string
  enrolled_date: string  // ISO date string
  created_at: string
}

// Relationships (with joined data)
export type StudyWithOwner = Study & {
  owner: User
}

export type StudyWithMembers = Study & {
  study_members: (StudyMember & { user: User })[]
}

export type StudyWithPatients = Study & {
  patients: Patient[]
}
```

## Summary

The data model supports all functional requirements (FR-001 through FR-044) with appropriate constraints, indexes, and RLS policies. The schema follows PostgreSQL/Supabase best practices and is optimized for the expected query patterns. All entities have clear relationships and validation rules that map directly to feature requirements.

Ready to proceed to API contract generation (contracts/).

# Research: Protocol Extractor

**Date**: 2025-11-11
**Feature**: Protocol Extractor
**Phase**: 0 - Technology Research & Decisions

## Overview

This document captures technology choices, architectural decisions, and implementation patterns for the Protocol Extractor feature. All decisions are based on the feature requirements, performance goals, and constraints defined in [spec.md](./spec.md).

## Core Technology Stack

### Decision: Next.js 14 with App Router
**Rationale**:
- Server Components reduce JavaScript sent to client, improving performance for dashboard/study views
- Built-in API routes eliminate need for separate backend service
- File-based routing simplifies navigation structure (auth vs dashboard routes)
- React Server Components enable server-side data fetching with Supabase
- Vercel deployment provides automatic edge caching and CDN

**Alternatives Considered**:
- **Create React App + Express**: Rejected due to need for separate backend service, more complex deployment
- **Remix**: Rejected due to less mature ecosystem, team unfamiliarity
- **Vite + React**: Rejected because lacks built-in API routes, would need separate backend

### Decision: Supabase for Backend Services
**Rationale**:
- Provides PostgreSQL database, authentication, and file storage in single service
- Magic link authentication built-in (no custom email infrastructure needed)
- Row Level Security (RLS) enforces access control at database level
- Real-time subscriptions available if needed post-MVP
- Generous free tier suitable for MVP validation

**Alternatives Considered**:
- **Firebase**: Rejected due to NoSQL data model (PostgreSQL better for relational study/team data)
- **AWS Amplify**: Rejected due to complexity, steeper learning curve
- **Custom PostgreSQL + Auth0**: Rejected due to increased infrastructure management overhead

### Decision: Anthropic Claude API for PDF Extraction
**Rationale**:
- Native PDF support (accepts base64-encoded PDFs directly)
- Strong performance on document understanding and structured data extraction
- JSON mode ensures consistent extraction format
- Handles variable protocol formats better than rule-based parsing

**Alternatives Considered**:
- **OpenAI GPT-4 Vision**: Rejected because requires PDF → image conversion (lossy for text)
- **AWS Textract + Custom NLP**: Rejected due to complexity, would need custom model training
- **Google Document AI**: Rejected due to higher cost, less flexible extraction prompts

### Decision: Tailwind CSS for Styling
**Rationale**:
- Design system already defined in design reference documents (8px grid, specific spacing values)
- Utility-first approach enables rapid UI development
- Built-in responsive design classes (mobile-first requirement)
- No runtime CSS-in-JS overhead (styles compiled at build time)
- Excellent TypeScript autocomplete support

**Alternatives Considered**:
- **Styled Components**: Rejected due to runtime overhead, doesn't align with pre-defined spacing system
- **CSS Modules**: Rejected because verbose for one-off utility styles
- **Chakra UI**: Rejected due to opinionated component library (design already specified)

## Authentication & Session Management

### Decision: Supabase Auth with Magic Links
**Rationale**:
- Meets FR-001 requirement (magic link authentication, no passwords)
- Automatic email delivery via Supabase (no SendGrid/Mailgun setup needed)
- Built-in session management with configurable expiry (7-day requirement)
- Secure token storage in httpOnly cookies

**Implementation Pattern**:
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Magic link flow:
// 1. User enters email + name + role on signup
// 2. supabase.auth.signInWithOtp({ email, options: { data: { name, role } } })
// 3. User clicks link in email → redirects to /auth/callback
// 4. Callback route exchanges token for session
// 5. Session persists for 7 days (configured in Supabase dashboard)
```

### Decision: Middleware-based Route Protection
**Rationale**:
- Centralized auth check prevents code duplication across protected routes
- Runs on Edge runtime (faster than server-side checks)
- Redirects unauthenticated users before page renders

**Implementation Pattern**:
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const supabase = createServerClient(/* ... */)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}
```

## PDF Upload & AI Extraction

### Decision: Server-Side Extraction in API Route
**Rationale**:
- Keeps Anthropic API key secret (server-only)
- Enables 5-minute timeout enforcement (FR-013)
- Allows file size validation before processing (50MB limit, FR-007)
- Server has more memory for large PDF processing

**Implementation Pattern**:
```typescript
// app/api/extract/route.ts
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('protocol') as File

  // Validate file size (FR-007: 50MB max)
  if (file.size > 50 * 1024 * 1024) {
    return Response.json({ error: 'File exceeds 50MB limit' }, { status: 400 })
  }

  // Convert to base64 for Claude API
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  // Set 5-minute timeout (FR-013)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000)

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64
            }
          },
          {
            type: 'text',
            text: EXTRACTION_PROMPT // Defined in lib/anthropic/prompts.ts
          }
        ]
      }],
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // Parse JSON response from Claude
    const extracted = JSON.parse(message.content[0].text)
    return Response.json(extracted)

  } catch (error) {
    if (error.name === 'AbortError') {
      return Response.json({ error: 'Extraction timeout (5 minutes exceeded)' }, { status: 408 })
    }
    throw error
  }
}
```

### Decision: Extraction Prompt Structure
**Rationale**:
- Explicit JSON schema ensures consistent parsing (FR-009 field requirements)
- Examples improve accuracy for medical terminology
- Instruction to extract ALL criteria reduces omissions

**Prompt Template**:
```typescript
export const EXTRACTION_PROMPT = `
Extract the following information from this clinical trial protocol:

1. Study name/title
2. Phase (e.g., Phase 1, Phase 2, Phase 3, Phase 4)
3. Medical condition or indication being studied
4. ALL inclusion criteria (as a list)
5. ALL exclusion criteria (as a list)
6. Visit schedule or study timepoints (list each visit/timepoint)
7. Target enrollment number

Return ONLY valid JSON in this exact format:
{
  "name": "string",
  "phase": "string",
  "indication": "string",
  "inclusion_criteria": ["criterion 1", "criterion 2", ...],
  "exclusion_criteria": ["criterion 1", "criterion 2", ...],
  "visit_schedule": ["visit 1", "visit 2", ...],
  "target_enrollment": number
}

Do not include any explanation, only the JSON object.
`
```

## Database Schema & Row Level Security

### Decision: PostgreSQL with Supabase RLS Policies
**Rationale**:
- RLS enforces access control at database level (defense in depth)
- Policies mirror FR-015 through FR-019 access rules
- Prevents data leaks even if application logic has bugs

**Schema Design** (see [data-model.md](./data-model.md) for full details):
```sql
-- users table managed by Supabase Auth
-- studies, study_members, patients tables with RLS policies

-- Example RLS policy for studies (FR-015, FR-016, FR-017):
CREATE POLICY "Users can view studies they own or are assigned to"
ON studies FOR SELECT
USING (
  auth.uid() = owner_id                    -- PIs see studies they created
  OR auth.uid() IN (                        -- or studies they're assigned to
    SELECT user_id FROM study_members
    WHERE study_id = studies.id
  )
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'  -- Admins see all
);
```

## UI Component Patterns

### Decision: Tailwind Utility Classes (No Component Library)
**Rationale**:
- Design system fully specified in design-reference.md (8px grid, exact spacing values)
- Component libraries (Shadcn, MUI) would require overriding defaults
- Custom components ensure exact adherence to design requirements (minimum 16px text, specific button padding)

**Design System Enforcement**:
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontSize: {
        // Enforce minimum 16px text (design requirement)
        base: '16px',     // Default body text
        lg: '18px',       // Slightly larger
        xl: '20px',       // Section headers
        '3xl': '30px',    // Page titles
      },
      spacing: {
        // Enforce 8px grid system
        // Only allow: 8, 16, 24, 32, 48, 64
        // Tailwind default: 0, 1(4px), 2(8px), 3(12px), 4(16px), etc.
        // We use: 2, 4, 6, 8, 12, 16
      },
      colors: {
        primary: {
          600: '#2563eb',  // blue-600 for CTAs
          700: '#1d4ed8',  // blue-700 for hover
        },
        // Only gray scale + blue accent (design requirement)
      }
    }
  }
}
```

## File Storage Strategy

### Decision: Supabase Storage for Protocol PDFs
**Rationale**:
- Integrated with Supabase database (same auth context)
- RLS policies protect uploaded files
- CDN delivery for fast access
- Automatic backup/replication

**Storage Bucket Configuration**:
```sql
-- Create bucket for protocol PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('protocols', 'protocols', false);  -- Private bucket

-- RLS policy: users can only access protocols for studies they can view
CREATE POLICY "Users can access their study protocols"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'protocols'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM studies
    WHERE owner_id = auth.uid() OR id IN (
      SELECT study_id FROM study_members WHERE user_id = auth.uid()
    )
  )
);
```

**File Organization**:
```
protocols/
└── {study_id}/
    └── protocol.pdf
```

## Performance Optimization

### Decision: Server Components + Streaming for Dashboard
**Rationale**:
- Dashboard loads study list server-side (no loading spinner for initial data)
- Streaming allows progressive rendering (show nav bar while fetching studies)
- Reduces Time to Interactive (TTI) for better UX

**Implementation Pattern**:
```typescript
// app/(dashboard)/page.tsx (Server Component)
import { createServerClient } from '@supabase/ssr'
import { Suspense } from 'react'

export default async function DashboardPage() {
  const supabase = createServerClient(/* ... */)

  return (
    <div>
      <h1>My Studies</h1>
      <Suspense fallback={<StudyListSkeleton />}>
        <StudyList />
      </Suspense>
    </div>
  )
}

async function StudyList() {
  const supabase = createServerClient(/* ... */)
  const { data: studies } = await supabase
    .from('studies')
    .select('*')
  // RLS policy automatically filters to accessible studies

  return <div>{studies.map(study => <StudyCard key={study.id} study={study} />)}</div>
}
```

### Decision: Optimistic UI Updates for Team/Patient Management
**Rationale**:
- Immediate feedback when adding team members or patients (better perceived performance)
- Rollback on error maintains data consistency
- Meets SC-005 goal (team member assignment within 1 minute)

**Implementation Pattern**:
```typescript
// components/AddTeamMemberForm.tsx
'use client'
import { useOptimistic } from 'react'

export function AddTeamMemberForm({ studyId, currentMembers }) {
  const [optimisticMembers, addOptimisticMember] = useOptimistic(
    currentMembers,
    (state, newMember) => [...state, newMember]
  )

  async function handleSubmit(formData) {
    const newMember = { email: formData.get('email'), role: formData.get('role') }

    // Show immediately (optimistic update)
    addOptimisticMember(newMember)

    // Persist to database
    await fetch(`/api/team-members`, {
      method: 'POST',
      body: JSON.stringify({ studyId, ...newMember })
    })

    // On error, optimistic update will revert automatically
  }

  return <form action={handleSubmit}>{ /* form fields */ }</form>
}
```

## Error Handling Strategy

### Decision: Structured Error Responses with User-Friendly Messages
**Rationale**:
- FR-015 requires "clear error messages"
- Consistent format simplifies client-side handling
- Separate technical errors (logs) from user messages

**Error Response Format**:
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public userMessage: string,
    public statusCode: number,
    public technicalDetails?: unknown
  ) {
    super(userMessage)
  }
}

// Example usage in API route:
if (!file) {
  throw new AppError(
    'Please select a protocol PDF file to upload',  // User-facing message
    400,
    { field: 'protocol', code: 'MISSING_FILE' }    // Technical details for logging
  )
}
```

**Error Display Pattern**:
```typescript
// components/ErrorMessage.tsx
export function ErrorMessage({ error }: { error: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-600 font-medium">{error}</p>
    </div>
  )
}
```

## Deployment & Environment Configuration

### Decision: Vercel for Hosting
**Rationale**:
- Zero-config Next.js deployment (created by Next.js team)
- Automatic HTTPS, CDN, edge caching
- Environment variable management built-in
- Preview deployments for each git branch

**Environment Variables**:
```bash
# .env.local.example (committed to repo as template)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### Decision: Feature Branch → Preview → Production Workflow
**Rationale**:
- Each feature branch gets preview URL (test before merging)
- Main branch auto-deploys to production
- Rollback support via Vercel dashboard

**Git Workflow**:
```
001-protocol-extractor (this branch) → preview-001-protocol-extractor.vercel.app
main branch → protocol-extractor.vercel.app (production)
```

## Testing Strategy (Optional - Not Requested in Spec)

**Note**: Per Constitution Principle III and feature spec, tests are NOT required for this MVP. The following is documented for reference if tests are added later.

### If Tests Were Added:
- **Unit Tests**: Jest + React Testing Library for components
- **Integration Tests**: Playwright for full user flows (signup → upload → extraction → study creation)
- **API Tests**: Supertest for API route testing
- **Database Tests**: Supabase local instance with migrations

**Test Organization**:
```
tests/
├── unit/              # Component tests
├── integration/       # Full user journey tests
└── api/               # API endpoint tests
```

## Open Questions & Future Research

**Resolved**: All technical unknowns from Technical Context section have been resolved through this research phase.

**Deferred to Post-MVP**:
- **Real-time updates**: Supabase Realtime for collaborative editing (not in MVP scope)
- **Audit logging**: Comprehensive change tracking (not in MVP scope per assumptions)
- **Multi-region deployment**: Performance optimization for global users (not in MVP scope)
- **Advanced caching**: Redis for frequently-accessed studies (premature optimization for MVP)

## Summary

All technology choices align with the 5-day build target specified in the PRD. The stack (Next.js + Supabase + Anthropic) minimizes infrastructure complexity while meeting all functional and non-functional requirements. No additional research required - ready to proceed to Phase 1 (data model & contracts).

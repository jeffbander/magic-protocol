# Quickstart Guide: Protocol Extractor

**Date**: 2025-11-11
**Feature**: Protocol Extractor
**Phase**: 1 - Development Setup & Running Locally

## Overview

This guide walks through setting up the Protocol Extractor development environment, running the application locally, and testing the core features. Estimated setup time: 15-20 minutes.

## Prerequisites

**Required Software**:
- Node.js 18+ and npm (verify: `node --version`, `npm --version`)
- Git
- A Supabase account (free tier: https://supabase.com/dashboard)
- An Anthropic API key (https://console.anthropic.com/)

**Optional**:
- Vercel CLI for deployment testing (`npm install -g vercel`)

## Step 1: Project Setup

### 1.1 Initialize Next.js Project

```bash
# Navigate to repository root
cd C:\Users\jeffr\curseo test\magicprotocol

# Initialize Next.js 14 with TypeScript and Tailwind
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Answer prompts:
# ✔ Would you like to use ESLint? … Yes
# ✔ Would you like to use Turbopack? … No
# ✔ Would you like to customize the default import alias? … No
```

### 1.2 Install Dependencies

```bash
# Supabase client libraries
npm install @supabase/supabase-js @supabase/ssr

# Anthropic SDK
npm install @anthropic-ai/sdk

# Additional UI utilities
npm install clsx tailwind-merge
npm install -D @types/node
```

### 1.3 Create Directory Structure

```bash
# Create app directories
mkdir -p app/\(auth\)/login app/\(auth\)/signup app/\(auth\)/auth/callback
mkdir -p app/\(dashboard\)/upload app/\(dashboard\)/studies/[id]/edit
mkdir -p app/api/extract app/api/studies app/api/team-members app/api/patients

# Create shared directories
mkdir -p components/ui
mkdir -p lib/supabase lib/anthropic
mkdir -p types
mkdir -p supabase/migrations

# Create public assets
mkdir -p public
```

## Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter:
   - Name: `protocol-extractor`
   - Database Password: (generate strong password, save it)
   - Region: (choose closest to you)
4. Click "Create new project" (takes ~2 minutes)

### 2.2 Get API Keys

1. In Supabase dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 2.3 Configure Environment Variables

```bash
# Create .env.local file in repository root
touch .env.local
```

Add the following content:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
```

**IMPORTANT**: Add `.env.local` to `.gitignore` to prevent committing secrets!

### 2.4 Run Database Migration

1. Copy migration from [data-model.md](./data-model.md) (001_initial_schema.sql section)
2. In Supabase dashboard, go to SQL Editor
3. Click "New Query"
4. Paste the migration SQL
5. Click "Run" (should see "Success" message)
6. Verify tables created: Go to Table Editor, should see `users`, `studies`, `study_members`, `patients`

### 2.5 Configure Auth Settings

1. In Supabase dashboard, go to Authentication → URL Configuration
2. Set **Site URL**: `http://localhost:3000`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-vercel-app.vercel.app/auth/callback` (for production later)
4. Go to Authentication → Email Templates
5. Confirm Email template is enabled (for magic links)

## Step 3: Core Implementation Files

### 3.1 Supabase Client Setup

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### 3.2 Middleware for Auth Protection

Create `middleware.ts` in root:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if ((request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')) && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
}
```

### 3.3 Anthropic Extraction Utility

Create `lib/anthropic/extract.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const EXTRACTION_PROMPT = `
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

export async function extractProtocolData(pdfBase64: string) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000) // 5 min timeout

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
      signal: controller.signal as any,
    })

    clearTimeout(timeoutId)

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return JSON.parse(text)
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Extraction timeout (5 minutes exceeded)')
    }
    throw error
  }
}
```

## Step 4: Run Development Server

```bash
# Start Next.js development server
npm run dev
```

Server should start at: http://localhost:3000

## Step 5: Test Core Features

### 5.1 Sign Up

1. Navigate to http://localhost:3000/signup
2. Enter:
   - Email: your-email@example.com
   - Name: Test User
   - Role: PI
3. Click "Sign Up"
4. Check your email for magic link
5. Click magic link → should redirect to dashboard

### 5.2 Upload Protocol & Extract

1. From dashboard, click "Upload Protocol" (or navigate to `/upload`)
2. Select a sample clinical trial protocol PDF
   - **Test file**: Find any clinical trial protocol PDF online (e.g., from ClinicalTrials.gov)
   - Or use a multi-page PDF with structured text
3. Click "Extract"
4. Wait for extraction (should see loading indicator: "Extracting protocol data...")
5. Review extracted data (name, phase, criteria, etc.)
6. Click "Confirm & Create Study"
7. Should redirect to study detail page

### 5.3 View Study Details

1. From dashboard, click on the created study card
2. Should see three tabs: Overview, Team, Patients
3. **Overview tab**: Displays extracted protocol data
4. **Team tab**: Shows study owner, "Add Team Member" button
5. **Patients tab**: Shows "0 / [target] enrolled" counter

### 5.4 Edit Study (Optional)

1. On study detail page (Overview tab), click "Edit Study"
2. Modify any field (e.g., change phase from "Phase 2" to "Phase 3")
3. Click "Save Changes"
4. Verify updates appear immediately

### 5.5 Add Team Member

1. Create a second user account (Coordinator role)
2. As PI, go to study → Team tab
3. Click "Add Team Member"
4. Enter coordinator email, select "Coordinator" role
5. Click "Add"
6. Verify coordinator appears in team list
7. Log out, log in as coordinator → should see study in dashboard

### 5.6 Add Patient

1. As any team member, go to study → Patients tab
2. Click "Add Patient"
3. Enter:
   - Name: Test Patient A
   - Enrollment Date: (today's date)
4. Click "Add"
5. Verify patient appears in list
6. Verify counter updates: "1 / [target] enrolled"

## Step 6: Verify Design System

Open browser DevTools and verify:

- **Text sizes**: No text smaller than 16px (use browser "Inspect" to check computed font-size)
- **Spacing**: Padding/margins use 8px increments (8, 16, 24, 32, 48, 64)
- **Colors**: Only gray scale + blue-600 accent (check color picker)
- **Buttons**: Padding is 12px vertical, 24px horizontal (`py-3 px-6`)
- **Cards**: Rounded corners 8px (`rounded-lg`), 1px gray border
- **Interactive states**: Hover effects on all buttons and clickable cards

## Step 7: Common Issues & Troubleshooting

### Issue: "Failed to fetch" when calling API

**Solution**: Check that `.env.local` has correct Supabase URL and keys. Restart dev server after env changes.

### Issue: Magic link not received

**Solution**:
1. Check spam folder
2. Verify email in Supabase dashboard → Authentication → Users
3. Check Supabase dashboard → Authentication → Rate Limits (may be throttled)

### Issue: "Extraction timeout" for small PDF

**Solution**:
1. Verify Anthropic API key is correct in `.env.local`
2. Check Anthropic dashboard for API errors
3. Try a different, more clearly formatted PDF

### Issue: RLS policy error ("new row violates row-level security policy")

**Solution**:
1. Verify migration ran successfully (check Supabase dashboard → Table Editor)
2. Check that policies were created (Supabase dashboard → Authentication → Policies)
3. Verify user has correct role in `public.users` table

### Issue: TypeScript errors about Supabase types

**Solution**:
```bash
# Generate types from Supabase schema
npx supabase gen types typescript --project-id your-project-id > types/database.types.ts
```

## Step 8: Seed Sample Data (Optional)

For testing without manual data entry, run seed script in Supabase SQL Editor:

```sql
-- Seed sample users and studies (DEVELOPMENT ONLY)
-- Insert test users
INSERT INTO public.users (id, email, name, role)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'pi@example.com', 'Dr. Jane Smith', 'pi'),
  ('550e8400-e29b-41d4-a716-446655440002', 'coord@example.com', 'Sarah Johnson', 'coordinator'),
  ('550e8400-e29b-41d4-a716-446655440003', 'admin@example.com', 'Admin User', 'admin');

-- Insert test study
INSERT INTO public.studies (id, name, phase, indication, target_enrollment, protocol_data, owner_id)
VALUES (
  '550e8400-e29b-41d4-a716-446655440010',
  'Phase 3 Study of Drug X',
  'Phase 3',
  'Hypertension',
  200,
  '{"inclusion_criteria": ["Age 18-65", "Diagnosed hypertension"], "exclusion_criteria": ["Pregnant"], "visit_schedule": ["Screening", "Week 4", "Week 8"]}',
  '550e8400-e29b-41d4-a716-446655440001'
);
```

**IMPORTANT**: Delete seed data before production deployment!

## Next Steps

**After local testing succeeds:**

1. **Phase 2: Task Generation** - Run `/speckit.tasks` to generate implementation task list
2. **Implementation** - Build features following task order (P1 stories first)
3. **Deployment** - Deploy to Vercel:
   ```bash
   vercel deploy
   # Add environment variables in Vercel dashboard
   # Update Supabase redirect URLs to include Vercel URL
   ```
4. **User Testing** - Share with 3-5 research coordinators for feedback
5. **Iteration** - Collect feedback, prioritize improvements

## Summary

You now have a fully configured development environment for the Protocol Extractor. The core workflow (signup → upload → extract → create study → manage team → track patients) should be testable locally. All data persists in Supabase PostgreSQL database with Row Level Security enforcing access control.

**Time to first working feature**: ~20 minutes (environment setup) + ~2-3 days (implementation)

**Ready for**: `/speckit.tasks` command to generate detailed task breakdown for implementation.

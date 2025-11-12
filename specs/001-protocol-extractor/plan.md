# Implementation Plan: Protocol Extractor

**Branch**: `001-protocol-extractor` | **Date**: 2025-11-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-protocol-extractor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Protocol Extractor is a web application that automates the extraction of key study data from clinical trial protocol PDFs using AI, reducing manual data entry time from 4-8 hours to under 10 minutes. The system provides role-based access for Principal Investigators, Research Coordinators, and Admins, enabling team collaboration on study management and patient enrollment tracking. Core features include PDF upload with AI extraction (Anthropic Claude API), user authentication via magic links (Supabase Auth), study dashboard with role-based access control, team member assignment, and basic patient enrollment tracking.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14+ (App Router)
**Primary Dependencies**: Next.js 14, React 18, Supabase Client, Anthropic SDK, Tailwind CSS
**Storage**: Supabase (PostgreSQL database + file storage for protocol PDFs)
**Testing**: Jest + React Testing Library (unit/integration), Playwright (E2E if requested)
**Target Platform**: Web (desktop + mobile responsive), deployed to Vercel
**Project Type**: Web application (Next.js frontend + Supabase backend)
**Performance Goals**:
- Protocol upload completes within 30 seconds for files up to 50MB
- AI extraction completes within 5 minutes (timeout if longer)
- Dashboard loads with study list in under 2 seconds
- System supports 100 concurrent users without degradation

**Constraints**:
- Magic link expiration: 15 minutes from generation
- User session duration: 7 days before re-authentication required
- PDF file size limit: 50MB maximum
- AI extraction timeout: 5 minutes maximum
- No protocol PDF editing after upload (create-only for MVP)
- Data retention: Indefinite (no deletion features in MVP)

**Scale/Scope**:
- Target: 5+ real studies created within 2 weeks of launch
- Expected: 100 concurrent users maximum
- Initial deployment: Single region (US), single-site studies only
- MVP scope: 6 user stories (2 P1, 2 P2, 2 P3)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Specification-First Development ✅ PASS
- ✅ User scenarios documented with 6 prioritized stories in spec.md
- ✅ 44 functional requirements clearly enumerated (FR-001 through FR-044)
- ✅ 10 measurable success criteria defined (SC-001 through SC-010)
- ✅ Specification approved (clarification session completed 2025-11-11)

###

 Principle II: Independent User Stories ✅ PASS
- ✅ All 6 stories assigned priorities (2×P1, 2×P2, 2×P3)
- ✅ No circular dependencies identified
- ✅ P1 stories (AI Extraction + Auth) constitute viable MVP
- ✅ Each story includes "Independent Test" description
- ✅ Implementation will follow priority order (P1 → P2 → P3)

### Principle III: Test-Driven Development (TDD) ⚠️ DEFERRED
- ⚠️ Tests not explicitly requested in feature specification
- ℹ️ Per Constitution Principle III: "Tests are OPTIONAL - only required when explicitly requested"
- ✅ TDD will NOT be enforced for this feature per constitution rules
- 📝 Note: Unit tests may be added during Polish phase if time permits

### Principle IV: Incremental Delivery ✅ PASS
- ✅ Setup and Foundational phases defined before user story work
- ✅ Each P1 story produces independently functional software
- ✅ Higher priority stories will be completed first (P1 before P2 before P3)
- ✅ Each story completion can be validated and potentially deployed
- ✅ MVP can ship after P1 stories complete (extraction + auth)

### Principle V: Simplicity & Observability ✅ PASS
- ✅ YAGNI: Only MVP features scoped (15 items explicitly out of scope)
- ✅ No complexity violations identified (standard web app architecture)
- ✅ Simpler alternatives: N/A (straightforward Next.js + Supabase stack)
- ✅ Observability: Console logging for development, Vercel logs for production
- ✅ Text-based I/O: JSON API responses, clear error messages

**GATE STATUS**: ✅ **PASSED** - All required principles satisfied. TDD deferred per constitution (tests not requested).

## Project Structure

### Documentation (this feature)

```text
specs/001-protocol-extractor/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (completed)
├── research.md          # Phase 0 output (technology decisions)
├── data-model.md        # Phase 1 output (entity schemas)
├── quickstart.md        # Phase 1 output (setup guide)
├── contracts/           # Phase 1 output (API endpoints)
│   └── openapi.yaml     # REST API contract
├── checklists/          # Quality validation
│   └── requirements.md  # Spec quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT YET CREATED)
```

### Source Code (repository root)

```text
# Web application structure (Next.js App Router + Supabase)

├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication routes (magic link)
│   │   ├── login/
│   │   ├── signup/
│   │   └── auth/callback/       # Magic link callback handler
│   ├── (dashboard)/              # Protected routes (authenticated users)
│   │   ├── layout.tsx           # Dashboard layout with nav
│   │   ├── page.tsx             # Main dashboard (study list)
│   │   ├── upload/              # Protocol upload & extraction
│   │   └── studies/
│   │       └── [id]/
│   │           ├── page.tsx     # Study detail (tabs: Overview/Team/Patients)
│   │           ├── edit/        # Edit study fields
│   │           └── components/  # Study-specific components
│   ├── api/                      # API routes
│   │   ├── extract/             # POST: AI extraction endpoint
│   │   ├── studies/             # CRUD for studies
│   │   ├── team-members/        # Add/remove team members
│   │   └── patients/            # Patient enrollment
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles (Tailwind)
│
├── components/                   # Shared React components
│   ├── ui/                      # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Tabs.tsx
│   ├── StudyCard.tsx            # Study list item
│   ├── ExtractionResults.tsx   # Display AI extraction
│   └── TeamMemberList.tsx
│
├── lib/                          # Utility libraries
│   ├── supabase/
│   │   ├── client.ts            # Supabase browser client
│   │   ├── server.ts            # Supabase server client
│   │   └── middleware.ts        # Auth middleware
│   ├── anthropic/
│   │   └── extract.ts           # PDF extraction logic
│   └── utils.ts                 # Helper functions
│
├── types/                        # TypeScript type definitions
│   ├── database.types.ts        # Generated from Supabase schema
│   ├── study.ts
│   └── user.ts
│
├── supabase/                     # Supabase configuration
│   ├── migrations/              # Database migrations
│   │   └── 001_initial_schema.sql
│   └── seed.sql                 # Sample data for development
│
├── public/                       # Static assets
│   └── logo.svg
│
├── .env.local.example           # Environment variable template
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

**Structure Decision**: Selected web application structure (Option 2 variant) because this is a full-stack web app with Next.js handling both frontend (React components) and backend (API routes). Supabase provides database, auth, and file storage, eliminating need for separate backend service. App Router structure organizes routes by authentication state `(auth)` for public routes and `(dashboard)` for protected routes, following Next.js 14 conventions.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**NO VIOLATIONS** - Standard web application architecture with established patterns. No complexity justification required.

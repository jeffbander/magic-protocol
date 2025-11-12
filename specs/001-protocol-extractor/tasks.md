# Tasks: Protocol Extractor

**Input**: Design documents from `/specs/001-protocol-extractor/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/, research.md, quickstart.md

**Tests**: Tests are NOT requested in the feature specification. Per constitution, TDD is optional. This task list focuses on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/`, `components/`, `lib/`, `types/` at repository root
- Paths shown below use Next.js App Router conventions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Next.js 14 project with TypeScript, Tailwind CSS, and App Router in repository root
- [x] T002 [P] Install Supabase dependencies: @supabase/supabase-js, @supabase/ssr
- [x] T003 [P] Install Anthropic SDK: @anthropic-ai/sdk
- [x] T004 [P] Install utility libraries: clsx, tailwind-merge
- [x] T005 Create directory structure: app/(auth), app/(dashboard), components/ui, lib/supabase, lib/anthropic, types, supabase/migrations
- [x] T006 Create environment configuration file: .env.local.example with Supabase and Anthropic placeholders
- [x] T007 Configure Tailwind CSS in tailwind.config.ts with 8px grid spacing system (8, 16, 24, 32, 48, 64px only)
- [x] T008 Configure Tailwind CSS with minimum 16px text sizes (base: 16px, lg: 18px, xl: 20px, 3xl: 30px)
- [x] T009 Configure Tailwind CSS with blue-600 accent color and gray scale palette
- [x] T010 Create globals.css in app/globals.css with base Tailwind imports and typography settings

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create Supabase database migration script in supabase/migrations/001_initial_schema.sql with users, studies, study_members, patients tables and RLS policies
- [x] T012 [P] Create Supabase browser client utility in lib/supabase/client.ts using createBrowserClient
- [x] T013 [P] Create Supabase server client utility in lib/supabase/server.ts using createServerClient with cookie handling
- [x] T014 Create authentication middleware in middleware.ts to protect dashboard routes and redirect authenticated users from auth pages
- [x] T015 [P] Create TypeScript database types in types/database.types.ts (User, Study, StudyMember, Patient)
- [x] T016 [P] Create Anthropic extraction utility in lib/anthropic/extract.ts with extractProtocolData function and 5-minute timeout
- [x] T017 [P] Create extraction prompt constant in lib/anthropic/extract.ts with JSON schema for study data
- [x] T018 [P] Create utility functions in lib/utils.ts for class name merging (cn helper with clsx and tailwind-merge)
- [x] T019 [P] Create base UI components: Button in components/ui/Button.tsx with primary/secondary variants and hover states
- [x] T020 [P] Create base UI components: Card in components/ui/Card.tsx with border, rounded corners, and optional hover shadow
- [x] T021 [P] Create base UI components: Input in components/ui/Input.tsx with focus ring and proper padding (px-4 py-3)
- [x] T022 [P] Create base UI components: Tabs in components/ui/Tabs.tsx for study detail page navigation

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - AI-Powered Protocol Extraction (Priority: P1) 🎯 MVP

**Goal**: Enable PIs to upload protocol PDFs and have AI extract study data automatically, reducing manual data entry from 4-8 hours to under 10 minutes

**Independent Test**: Upload a sample protocol PDF → View extracted data (name, phase, indication, criteria lists, visit schedule, target enrollment) → Click "Confirm & Create Study" → Verify study appears on dashboard with all extracted data correctly saved

### Implementation for User Story 1

- [x] T023 [P] [US1] Create upload page in app/(dashboard)/upload/page.tsx with file input restricted to PDF files
- [x] T024 [P] [US1] Create API route POST /api/extract in app/api/extract/route.ts with file size validation (50MB max)
- [x] T025 [US1] Implement PDF to base64 conversion in app/api/extract/route.ts
- [x] T026 [US1] Integrate Anthropic extraction in app/api/extract/route.ts with 5-minute timeout and error handling
- [x] T027 [US1] Create ExtractionResults component in components/ExtractionResults.tsx to display extracted data in reviewable format
- [x] T028 [US1] Add loading state to upload page with "Extracting protocol data..." message during AI processing
- [x] T029 [US1] Add error handling to upload page for timeout (5 min), file size errors, and extraction failures
- [x] T030 [US1] Create API route POST /api/studies in app/api/studies/route.ts to save extracted data as new study
- [x] T031 [US1] Add "Confirm & Create Study" button to ExtractionResults component that calls POST /api/studies
- [x] T032 [US1] Add redirect logic after study creation to navigate to study detail page (/studies/[id])
- [x] T033 [US1] Add validation in POST /api/studies to ensure study name is non-empty and target_enrollment is positive integer
- [x] T034 [US1] Add owner_id assignment in POST /api/studies using authenticated user ID from Supabase session

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - PIs can upload protocols, extract data, and create studies

---

## Phase 4: User Story 2 - User Authentication and Role-Based Access (Priority: P1) 🎯 MVP

**Goal**: Enable users to sign up with email/name/role, receive magic link, authenticate, and have role-based permissions enforced throughout the app

**Independent Test**: Visit signup page → Enter email, name, select "PI" role → Receive magic link email → Click link → Authenticate successfully → Land on dashboard → Verify session persists for 7 days → Log out and verify redirected to login

### Implementation for User Story 2

- [x] T035 [P] [US2] Create signup page in app/(auth)/signup/page.tsx with email, name, and role selector (Admin/PI/Coordinator radio buttons)
- [x] T036 [P] [US2] Create login page in app/(auth)/login/page.tsx with email input for returning users
- [x] T037 [P] [US2] Create auth callback handler in app/(auth)/auth/callback/route.ts to exchange magic link token for session
- [x] T038 [US2] Implement signup flow in signup page: call supabase.auth.signInWithOtp with user metadata (name, role)
- [x] T039 [US2] Implement login flow in login page: call supabase.auth.signInWithOtp for existing users
- [x] T040 [US2] Add user profile creation trigger or API endpoint to create record in public.users table after Supabase auth user created
- [x] T041 [US2] Configure Supabase Auth settings: set magic link expiration to 15 minutes, session duration to 7 days
- [x] T042 [US2] Add session check to dashboard layout in app/(dashboard)/layout.tsx to verify authentication
- [x] T043 [US2] Create top navigation bar component in components/Nav.tsx with logo, "My Studies" link, user email display, and "Sign Out" button
- [x] T044 [US2] Implement sign out functionality in Nav component that calls supabase.auth.signOut and redirects to login
- [x] T045 [US2] Test role immutability: verify no UI exists to change role after signup (per FR-004 and FR-005)

**Checkpoint**: At this point, User Stories 1 AND 2 are both functional - users can sign up, authenticate, upload protocols, and create studies with proper access control

---

## Phase 5: User Story 3 - Study Dashboard and Access Control (Priority: P2)

**Goal**: Provide a dashboard showing all studies the current user has access to based on their role, with study cards displaying key information

**Independent Test**: Log in as PI → See studies created by PI → Log in as Coordinator → See only assigned studies → Log in as Admin → See all studies → Click study card → Navigate to study detail page

### Implementation for User Story 3

- [x] T046 [P] [US3] Create dashboard page in app/(dashboard)/page.tsx as main landing page after login
- [x] T047 [P] [US3] Create API route GET /api/studies in app/api/studies/route.ts that fetches studies with RLS filtering
- [x] T048 [US3] Add aggregated counts (team_member_count, patient_count) to GET /api/studies using JOIN queries
- [x] T049 [US3] Create StudyCard component in components/StudyCard.tsx with study name, phase, target enrollment, team count, creation date
- [x] T050 [US3] Add hover state and click handler to StudyCard that navigates to study detail page
- [x] T051 [US3] Implement study list rendering in dashboard page using StudyCard components
- [x] T052 [US3] Add empty state to dashboard page when user has no accessible studies (different messages for PI/Coordinator/Admin)
- [x] T053 [US3] Add loading skeleton to dashboard page while studies are being fetched
- [x] T054 [US3] Add "Upload Protocol" button to dashboard page header that navigates to upload page (visible to PI and Admin only)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 all work independently - complete auth flow, protocol upload, and dashboard navigation

---

## Phase 6: User Story 4 - Study Detail and Overview (Priority: P2)

**Goal**: Display detailed study information including all extracted protocol data in organized tabs (Overview, Team, Patients)

**Independent Test**: Navigate to study detail page → See tabbed interface with Overview/Team/Patients → View extracted data (name, phase, indication, criteria lists, visit schedule) → Verify data matches what was extracted → Attempt to access study without permission → See access denied message

### Implementation for User Story 4

- [x] T055 [P] [US4] Create study detail page in app/(dashboard)/studies/[id]/page.tsx with dynamic id parameter
- [x] T056 [P] [US4] Create API route GET /api/studies/[id] in app/api/studies/[id]/route.ts to fetch single study with owner details
- [x] T057 [US4] Implement RLS access check in GET /api/studies/[id] to return 404 if user lacks permission
- [x] T058 [US4] Create tabbed interface in study detail page using Tabs component (Overview, Team, Patients tabs)
- [x] T059 [US4] Create Overview tab content component displaying study name, phase, indication, target enrollment
- [x] T060 [US4] Add inclusion criteria list to Overview tab with proper formatting (bulleted list, adequate spacing)
- [x] T061 [US4] Add exclusion criteria list to Overview tab with proper formatting (bulleted list, adequate spacing)
- [x] T062 [US4] Add visit schedule/timepoints list to Overview tab with proper formatting
- [x] T063 [US4] Create edit study page in app/(dashboard)/studies/[id]/edit/page.tsx with form for all study fields
- [x] T064 [US4] Create API route PATCH /api/studies/[id] in app/api/studies/[id]/route.ts for updating study data
- [x] T065 [US4] Implement authorization in PATCH /api/studies/[id] to allow only owner or admin to edit
- [x] T066 [US4] Add "Edit Study" button to Overview tab (visible only to owner or admin)
- [x] T067 [US4] Implement form submission in edit study page that calls PATCH /api/studies/[id] and redirects back to detail page
- [x] T068 [US4] Add immediate reflection of edits in study detail view after save (optimistic update or refetch)

**Checkpoint**: All P1 and P2 stories are now independently functional - complete workflow from auth → upload → dashboard → study details

---

## Phase 7: User Story 5 - Team Member Assignment (Priority: P3)

**Goal**: Enable PIs and Admins to assign Research Coordinators and other PIs to studies for team collaboration

**Independent Test**: As PI, navigate to Team tab → See current team members → Click "Add Team Member" → Enter coordinator email and select role → Verify member appears in list → Log in as coordinator → Verify study now appears on their dashboard → Remove team member → Verify access revoked

### Implementation for User Story 5

- [x] T069 [P] [US5] Create API route GET /api/studies/[id]/team in app/api/studies/[id]/team/route.ts to fetch team members with user details
- [x] T070 [P] [US5] Create API route POST /api/studies/[id]/team in app/api/studies/[id]/team/route.ts to add team members
- [x] T071 [P] [US5] Create API route DELETE /api/studies/[id]/team/[memberId] in app/api/studies/[id]/team/[memberId]/route.ts to remove members
- [x] T072 [US5] Create Team tab content component in app/(dashboard)/studies/[id]/components/TeamTab.tsx
- [x] T073 [US5] Create TeamMemberList component in components/TeamMemberList.tsx displaying name, role, email for each member
- [x] T074 [US5] Add "Add Team Member" form to Team tab with email input and role selector (PI/Coordinator options)
- [x] T075 [US5] Implement user lookup by email in POST /api/studies/[id]/team with error if user doesn't exist
- [x] T076 [US5] Add validation in POST /api/studies/[id]/team to prevent duplicate team members (handle unique constraint violation)
- [x] T077 [US5] Add authorization check in POST /api/studies/[id]/team to allow only owner or admin to add members
- [x] T078 [US5] Add "Remove" button next to each team member (visible only to owner or admin)
- [x] T079 [US5] Implement remove handler that calls DELETE /api/studies/[id]/team/[memberId] with confirmation prompt
- [x] T080 [US5] Add view-only mode for Team tab when user is Coordinator (no Add/Remove buttons, FR-030)
- [x] T081 [US5] Implement immediate access grant: verify added user can see study on dashboard within 1 minute (SC-005)
- [x] T082 [US5] Implement immediate access revocation: verify removed user loses study access immediately (FR-029)

**Checkpoint**: All user stories through P3 priority 5 are now independently functional - team collaboration features work end-to-end

---

## Phase 8: User Story 6 - Basic Patient Enrollment Tracking (Priority: P3)

**Goal**: Enable study team members to record patient enrollments and track progress toward target enrollment

**Independent Test**: Navigate to Patients tab → See "0 / [target] enrolled" counter → Click "Add Patient" → Enter name and enrollment date → Verify patient appears in list → Verify counter increments → Add patients until reaching target → Verify counter shows full enrollment

### Implementation for User Story 6

- [x] T083 [P] [US6] Create API route GET /api/studies/[id]/patients in app/api/studies/[id]/patients/route.ts to fetch patients with enrollment count
- [x] T084 [P] [US6] Create API route POST /api/studies/[id]/patients in app/api/studies/[id]/patients/route.ts to add patients
- [x] T085 [US6] Create Patients tab content component in app/(dashboard)/studies/[id]/components/PatientsTab.tsx
- [x] T086 [US6] Add enrollment counter header to Patients tab showing "X / [target_enrollment] enrolled"
- [x] T087 [US6] Create patient list table displaying patient name and enrollment date columns
- [x] T088 [US6] Add "Add Patient" form to Patients tab with name input and enrollment date picker
- [x] T089 [US6] Add validation in POST /api/studies/[id]/patients to prevent future enrollment dates
- [x] T090 [US6] Add validation in POST /api/studies/[id]/patients to ensure name is non-empty
- [x] T091 [US6] Implement patient list rendering sorted by enrollment date (most recent first)
- [x] T092 [US6] Implement automatic counter increment when patient is added (optimistic update or refetch)
- [x] T093 [US6] Add authorization check in POST /api/studies/[id]/patients to allow any study team member to add patients (FR-033)

**Checkpoint**: All user stories are now independently functional - complete end-to-end workflow including patient tracking

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality checks

- [x] T094 [P] Verify all text is minimum 16px (no text-xs or text-sm classes for body text)
- [x] T095 [P] Verify all spacing uses 8px grid values only (8, 16, 24, 32, 48, 64) - check padding and margins
- [x] T096 [P] Verify only blue-600 accent color is used (no other accent colors besides grays)
- [x] T097 [P] Verify all buttons have hover, focus, and disabled states with proper styling
- [x] T098 [P] Verify all cards use subtle borders (border-gray-200) not heavy shadows
- [x] T099 [P] Verify all interactive elements have minimum 44px touch targets (check button heights)
- [ ] T100 [P] Verify mobile responsiveness: test on viewport widths 375px, 768px, 1024px
- [ ] T101 [P] Verify all forms have proper label associations and ARIA attributes for accessibility
- [ ] T102 [P] Add consistent error message styling across all forms using components/ErrorMessage.tsx
- [ ] T103 [P] Add consistent success message styling using components/SuccessMessage.tsx
- [ ] T104 [P] Verify all API routes return consistent error format (error, code, details structure)
- [ ] T105 [P] Add loading states to all data-fetching pages with appropriate skeleton components
- [ ] T106 [P] Test magic link expiration (15 minutes) - verify user must request new link after expiration
- [ ] T107 [P] Test session expiration (7 days) - verify user must re-authenticate after 7 days
- [ ] T108 [P] Test extraction timeout (5 minutes) - verify timeout error displays correctly
- [ ] T109 [P] Test file size validation (50MB max) - verify error displays for larger files
- [ ] T110 [P] Test concurrent patient additions - verify database handles simultaneous writes correctly
- [ ] T111 [P] Test all edge cases from spec.md: file too large, malformed PDF, duplicate team member, expired magic link
- [ ] T112 Create comprehensive README.md with setup instructions from quickstart.md
- [ ] T113 Run quickstart.md validation: test complete local setup flow from clone to running app
- [ ] T114 Verify all success criteria from spec.md (SC-001 through SC-010) can be tested
- [ ] T115 Final design system audit: compare all components against DESIGN-REFERENCE.md requirements

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion
- **User Story 3 (Phase 5)**: Depends on US1 + US2 completion (needs studies to display and auth to work)
- **User Story 4 (Phase 6)**: Depends on US1 completion (needs studies to view details)
- **User Story 5 (Phase 7)**: Depends on US2 + US4 completion (needs auth and study detail page)
- **User Story 6 (Phase 8)**: Depends on US4 completion (needs study detail page with tabs)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories (can be done in parallel with US1)
- **User Story 3 (P2)**: Depends on US1 (needs studies to display) and US2 (needs authentication) - NOT independently testable without US1+US2
- **User Story 4 (P2)**: Depends on US1 (needs studies to view) - Can be done in parallel with US3 after US1+US2 complete
- **User Story 5 (P3)**: Depends on US2 (auth) and US4 (study detail page structure) - Can be done after US4 completes
- **User Story 6 (P3)**: Depends on US4 (study detail page with tabs) - Can be done in parallel with US5 after US4 completes

### Within Each User Story

- Implementation tasks are ordered by natural dependencies (models → services → endpoints → UI)
- Tasks marked [P] within a story can run in parallel (different files, no dependencies)
- Complete all tasks in a story before moving to next story to maintain independence

### Parallel Opportunities

- All Setup tasks (T002, T003, T004) can run in parallel
- All Foundational tasks marked [P] (T012, T013, T015-T022) can run in parallel within Phase 2
- Once Foundational phase completes, US1 and US2 can start in parallel (if team capacity allows)
- Within US1: T023 and T024 can run in parallel (upload page and API route)
- Within US2: T035, T036, T037 can run in parallel (signup page, login page, callback handler)
- Within US3: T046 and T047 can run in parallel (dashboard page and API route)
- Within US4: T055 and T056 can run in parallel (detail page and API route)
- Within US5: T069, T070, T071 can run in parallel (all team API routes)
- Within US6: T083 and T084 can run in parallel (patients API routes)
- All Polish tasks (T094-T111) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all parallelizable tasks for User Story 1 together:
Task: "T023 [P] [US1] Create upload page in app/(dashboard)/upload/page.tsx"
Task: "T024 [P] [US1] Create API route POST /api/extract in app/api/extract/route.ts"
Task: "T027 [US1] Create ExtractionResults component in components/ExtractionResults.tsx"

# Then complete sequential tasks:
Task: "T025 [US1] Implement PDF to base64 conversion" (depends on T024)
Task: "T026 [US1] Integrate Anthropic extraction" (depends on T025)
# ... continue with dependent tasks
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T022) - CRITICAL blocking phase
3. Complete Phase 3: User Story 1 (T023-T034) - Protocol extraction
4. Complete Phase 4: User Story 2 (T035-T045) - Authentication
5. **STOP and VALIDATE**: Test independent workflows:
   - Sign up → Receive magic link → Authenticate → Upload protocol → Extract → Create study
   - Verify extraction accuracy meets 80% threshold (SC-002)
   - Verify upload-to-study completion time under 10 minutes (SC-001)
6. Deploy/demo if ready - this is a viable MVP!

### Incremental Delivery (Add P2 Stories)

1. Complete MVP (US1 + US2) → Foundation ready
2. Add Phase 5: User Story 3 (T046-T054) - Dashboard → Test independently
3. Add Phase 6: User Story 4 (T055-T068) - Study details → Test independently
4. **VALIDATE**: Full P1+P2 workflow works end-to-end
5. Deploy/demo updated version

### Full Feature Set (Add P3 Stories)

1. Complete P1+P2 stories → Core features ready
2. Add Phase 7: User Story 5 (T069-T082) - Team collaboration → Test independently
3. Add Phase 8: User Story 6 (T083-T093) - Patient tracking → Test independently
4. Complete Phase 9: Polish (T094-T115) - Quality assurance
5. **FINAL VALIDATION**: All success criteria (SC-001 through SC-010) verified
6. Production deployment

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T022)
2. Once Foundational is done:
   - Developer A: User Story 1 (T023-T034) - Extraction
   - Developer B: User Story 2 (T035-T045) - Auth
3. Once US1+US2 complete:
   - Developer A: User Story 3 (T046-T054) - Dashboard
   - Developer B: User Story 4 (T055-T068) - Study detail
4. Once US4 completes:
   - Developer A: User Story 5 (T069-T082) - Team
   - Developer B: User Story 6 (T083-T093) - Patients
5. Both: Polish phase together (T094-T115)

---

## Notes

- [P] tasks = different files, no dependencies (can run in parallel)
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group of related tasks
- Stop at any story completion to validate independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Design system compliance is verified in Polish phase (T094-T099)
- All performance and timeout constraints are implemented in Foundational/US1 phases

---

## Task Summary

**Total Tasks**: 115
**By Phase**:
- Setup: 10 tasks
- Foundational: 12 tasks (BLOCKING - must complete first)
- User Story 1 (P1): 12 tasks
- User Story 2 (P1): 11 tasks
- User Story 3 (P2): 9 tasks
- User Story 4 (P2): 14 tasks
- User Story 5 (P3): 14 tasks
- User Story 6 (P3): 11 tasks
- Polish: 22 tasks

**Parallel Opportunities**: 47 tasks marked [P] can run in parallel within their phase
**MVP Scope**: 45 tasks (Setup + Foundational + US1 + US2)
**Full MVP**: 68 tasks (includes P1 + P2 stories)
**Complete Feature**: 115 tasks (all stories + polish)

**Estimated Timeline**:
- MVP (US1+US2): 2-3 days
- Full P1+P2: 4 days
- Complete with P3+Polish: 5 days (matches PRD target)

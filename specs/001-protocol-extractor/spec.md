# Feature Specification: Protocol Extractor

**Feature Branch**: `001-protocol-extractor`
**Created**: 2025-11-11
**Status**: Draft
**Input**: User description: "Build a Protocol Extractor - a web app for clinical research coordinators and PIs that uses AI to extract key study data from research protocol PDFs and enables basic team management for clinical trials."

## Clarifications

### Session 2025-11-11

- Q: How long should magic links remain valid before expiring? → A: 15 minutes
- Q: Should there be a maximum time limit for AI extraction attempts to prevent indefinite waiting? → A: 5 minutes timeout
- Q: How long should authenticated user sessions remain active before requiring re-authentication? → A: 7 days
- Q: How long should study data and uploaded protocol PDFs be retained in the system? → A: Indefinite retention, no deletion for MVP
- Q: Can users edit the AI-extracted data before confirming and creating the study? → A: Edit after study creation - users review extraction, confirm to create study, then can edit study details

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI-Powered Protocol Extraction (Priority: P1)

As a Principal Investigator, I need to upload a clinical trial protocol PDF and have the system automatically extract key study information so that I can review and confirm the data in minutes instead of spending 4-8 hours on manual extraction.

**Why this priority**: This is the core value proposition of the product. Without accurate AI extraction, the product has no differentiating value. This story alone delivers immediate time savings and validates the product's primary use case.

**Independent Test**: Can be fully tested by uploading a sample protocol PDF, receiving extracted data (study name, phase, indication, inclusion/exclusion criteria, visit schedule, target enrollment), reviewing the extraction results, and confirming to create the study. Delivers immediate value by automating manual extraction work.

**Acceptance Scenarios**:

1. **Given** a PI is logged in, **When** they navigate to the upload page and select a valid protocol PDF (under 50MB), **Then** the system accepts the file and begins processing
2. **Given** a protocol PDF has been uploaded, **When** AI extraction completes successfully, **Then** the system displays all extracted fields in a clean, reviewable format with sections for study name, phase, indication, inclusion criteria (bulleted list), exclusion criteria (bulleted list), visit schedule (list of timepoints), and target enrollment number
3. **Given** extraction results are displayed, **When** the PI reviews the data and clicks "Confirm & Create Study", **Then** the system creates a new study record and redirects to the study detail page
4. **Given** extraction is in progress, **When** the user is waiting, **Then** the system shows a loading indicator with the message "Extracting protocol data..."
5. **Given** a protocol PDF is corrupted or unreadable, **When** extraction fails, **Then** the system displays a clear error message explaining the failure

---

### User Story 2 - User Authentication and Role-Based Access (Priority: P1)

As a clinical research professional, I need to securely sign in to the system and have my role (Admin, PI, or Research Coordinator) determine what actions I can perform so that I can access appropriate studies and features based on my responsibilities.

**Why this priority**: Authentication and role-based access are foundational requirements that enable all other features. Without this, the system cannot support multi-user teams or enforce access controls. This must be complete before team assignment features can work.

**Independent Test**: Can be fully tested by signing up with an email address, selecting a role, receiving a magic link, signing in, and verifying that the dashboard shows appropriate studies based on role permissions. Delivers a complete authentication flow independent of other stories.

**Acceptance Scenarios**:

1. **Given** a new user visits the signup page, **When** they enter their email address, name, and select a role (Admin, PI, or Research Coordinator), **Then** the system sends a magic link to their email address
2. **Given** a user has received a magic link email, **When** they click the link, **Then** the system authenticates them and redirects to the dashboard
3. **Given** a user is a PI, **When** they view the dashboard, **Then** they see only studies they created or are assigned to as team members
4. **Given** a user is a Research Coordinator, **When** they view the dashboard, **Then** they see only studies they are assigned to as team members
5. **Given** a user is an Admin, **When** they view the dashboard, **Then** they see all studies in the system
6. **Given** a user has signed up and selected a role, **When** they attempt to change their role, **Then** the system does not provide any UI to change roles (roles are immutable after signup for MVP)

---

### User Story 3 - Study Dashboard and Access Control (Priority: P2)

As any system user, I need to see a list of my accessible studies on a dashboard so that I can quickly navigate to the studies I'm involved with and understand basic study information at a glance.

**Why this priority**: The dashboard provides the primary navigation hub for users after authentication. While critical for usability, it depends on Story 1 (study creation) and Story 2 (authentication/roles) being complete first. It can be implemented and tested independently once those foundations exist.

**Independent Test**: Can be fully tested by logging in as different user roles (PI, Coordinator, Admin), viewing the dashboard, and verifying that the correct set of studies appears with appropriate study cards showing name, phase, target enrollment, and team member count. Delivers independent navigation value.

**Acceptance Scenarios**:

1. **Given** a user is logged in, **When** they land on the dashboard, **Then** they see a list of study cards for all studies they have access to based on their role
2. **Given** study cards are displayed, **When** the user views a card, **Then** they see the study name, phase, target enrollment number, team member count, and creation date
3. **Given** a user sees study cards on the dashboard, **When** they click on a study card, **Then** they are navigated to the study detail page
4. **Given** a user has no assigned studies, **When** they view the dashboard, **Then** they see a message indicating no studies are available with a link to create a new study (for PIs/Admins) or a message to contact their PI (for Coordinators)

---

### User Story 4 - Study Detail and Overview (Priority: P2)

As a study team member, I need to view detailed information about a specific study including the extracted protocol data so that I can reference inclusion/exclusion criteria, visit schedules, and other key parameters while working on the study.

**Why this priority**: This provides essential reference information for team members working on studies. It depends on Story 1 (extraction) being complete but delivers independent value by making extracted data accessible and useful for day-to-day work.

**Independent Test**: Can be fully tested by navigating to a study detail page and verifying that all extracted protocol data is displayed in organized tabs (Overview, Team, Patients) with the Overview tab showing complete study information. Delivers independent reference value.

**Acceptance Scenarios**:

1. **Given** a user has access to a study, **When** they navigate to the study detail page, **Then** they see a tabbed interface with Overview, Team, and Patients tabs
2. **Given** the user is on the Overview tab, **When** the page loads, **Then** they see the study name, phase, indication, target enrollment, complete list of inclusion criteria (bulleted), complete list of exclusion criteria (bulleted), and visit schedule/timepoints
3. **Given** the Overview tab displays criteria lists, **When** the user views the lists, **Then** each criterion is displayed clearly with adequate spacing and readability
4. **Given** a user does not have access to a study, **When** they attempt to navigate directly to the study detail page URL, **Then** the system displays an access denied message or redirects to the dashboard

---

### User Story 5 - Team Member Assignment (Priority: P3)

As a Principal Investigator or Admin, I need to assign Research Coordinators and other PIs to my study so that team members can access the study and collaborate on patient enrollment and management.

**Why this priority**: Team collaboration is important but not essential for validating the core extraction value. A PI can use the extracted data themselves before assigning coordinators. This can be implemented after the core extraction and viewing features are proven valuable.

**Independent Test**: Can be fully tested by navigating to the Team tab on a study detail page, adding team members by email address and role, viewing the list of assigned team members, and verifying that added users can now access the study. Delivers independent collaboration value.

**Acceptance Scenarios**:

1. **Given** a PI or Admin is viewing a study they have access to, **When** they click on the Team tab, **Then** they see a list of current team members with their name, role, and email address
2. **Given** the Team tab is displayed, **When** a PI or Admin clicks "Add Team Member", **Then** they see a form with an email input field and a role selector (PI or Research Coordinator options)
3. **Given** the add team member form is displayed, **When** the PI/Admin enters an existing user's email address, selects a role, and submits, **Then** the system adds that user to the study team and displays them in the team member list
4. **Given** the PI/Admin enters an email address that does not exist in the system, **When** they submit the form, **Then** the system displays an error message indicating the user must sign up first
5. **Given** a team member is listed, **When** the PI/Admin clicks the "Remove" button next to their name, **Then** the system removes that user from the study team and they lose access to the study
6. **Given** a Research Coordinator is viewing a study, **When** they access the Team tab, **Then** they can view team members but do not see the "Add Team Member" or "Remove" buttons (view-only access)

---

### User Story 6 - Basic Patient Enrollment Tracking (Priority: P3)

As a study team member, I need to record when patients are enrolled in the study so that I can track progress toward the target enrollment number.

**Why this priority**: This provides a basic foundation for patient management but is not essential for validating the protocol extraction value. The MVP needs this placeholder to demonstrate the full workflow, but it can be minimal and implemented last.

**Independent Test**: Can be fully tested by navigating to the Patients tab, adding a patient with name and enrollment date, and verifying that the patient count increases and the patient appears in the list. Delivers independent enrollment tracking value.

**Acceptance Scenarios**:

1. **Given** a user is viewing a study detail page, **When** they click on the Patients tab, **Then** they see a header showing "X / [target enrollment] enrolled" and a list of enrolled patients
2. **Given** the Patients tab is displayed, **When** the user clicks "Add Patient", **Then** they see a form with fields for patient name (text input) and enrollment date (date picker)
3. **Given** the add patient form is displayed, **When** the user enters a patient name and enrollment date and submits, **Then** the system creates a patient record, increments the enrollment counter, and displays the patient in the list
4. **Given** patients are enrolled, **When** the user views the patient list, **Then** they see a simple table with columns for patient name and enrollment date
5. **Given** the enrollment count reaches the target enrollment number, **When** the Patients tab is displayed, **Then** the header shows "[target] / [target] enrolled" indicating full enrollment

---

### Edge Cases

- What happens when a protocol PDF exceeds 50MB size limit? System rejects the file and displays an error message before attempting upload.
- What happens when a protocol PDF is in a non-standard format or has poor scan quality? AI extraction may return incomplete or inaccurate data; user reviews and must manually verify all extracted fields.
- What happens when a PI tries to add a team member who is already on the team? System displays an error message indicating the user is already a team member.
- What happens when a user's magic link expires after 15 minutes? User must request a new magic link by re-entering their email on the login page.
- What happens when AI extraction takes longer than expected (complex/large protocol)? System shows loading indicator for up to 5 minutes. If extraction does not complete within 5 minutes, system displays a timeout error and allows user to retry.
- What happens when a user tries to access a study detail page for a study they don't have permission to view? System displays access denied message or redirects to dashboard.
- What happens when multiple users try to add patients to the same study simultaneously? System handles concurrent writes; each patient record is created independently.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & User Management**

- **FR-001**: System MUST provide magic link authentication via email (no password-based login)
- **FR-002**: System MUST expire magic links after 15 minutes from the time they are generated
- **FR-003**: System MUST support three distinct user roles: Admin, Principal Investigator (PI), and Research Coordinator
- **FR-004**: Users MUST select their role during signup via a role selector
- **FR-005**: System MUST prevent users from changing their role after initial signup
- **FR-006**: System MUST persist user sessions for 7 days across page refreshes and browser restarts, requiring re-authentication after 7 days or upon explicit logout

**Protocol Upload & AI Extraction**

- **FR-007**: System MUST provide a file upload interface that accepts PDF files only
- **FR-008**: System MUST enforce a maximum file size of 50MB for protocol uploads
- **FR-009**: System MUST send uploaded protocol PDFs to an AI service for automated data extraction
- **FR-010**: System MUST extract and return the following fields from protocol documents: study name/title, study phase, medical condition or indication, all inclusion criteria (as a list), all exclusion criteria (as a list), visit schedule or timepoints (as a list), target enrollment number
- **FR-011**: System MUST display extraction results in a reviewable format with clearly labeled sections for each extracted field
- **FR-012**: System MUST display a loading indicator with text "Extracting protocol data..." while extraction is in progress
- **FR-013**: System MUST timeout AI extraction attempts after 5 minutes and display an error message allowing the user to retry
- **FR-014**: System MUST provide a "Confirm & Create Study" action that saves the extracted data as a new study record
- **FR-015**: System MUST display clear error messages when extraction fails due to file corruption, unsupported format, processing errors, or timeout

**Study Management & Access Control**

- **FR-016**: System MUST display a dashboard showing all studies the current user has access to
- **FR-017**: PIs MUST see studies they created or are assigned to as team members
- **FR-018**: Research Coordinators MUST see only studies they are assigned to as team members
- **FR-019**: Admins MUST see all studies in the system regardless of ownership or assignment
- **FR-020**: System MUST display study cards with the following information: study name, phase, target enrollment number, team member count, creation date
- **FR-021**: System MUST provide navigation from study cards to detailed study pages
- **FR-022**: System MUST display study detail pages with tabbed navigation (Overview, Team, Patients tabs)
- **FR-023**: System MUST display complete extracted protocol data on the Overview tab including study name, phase, indication, target enrollment, inclusion criteria (bulleted list), exclusion criteria (bulleted list), visit schedule/timepoints
- **FR-024**: System MUST allow PIs and Admins to edit any extracted study field after study creation (study name, phase, indication, target enrollment, inclusion criteria, exclusion criteria, visit schedule)
- **FR-025**: System MUST save edits to study data and reflect changes immediately in the study detail view

**Team Assignment**

- **FR-026**: System MUST allow PIs and Admins to view team members assigned to their accessible studies
- **FR-027**: System MUST allow PIs and Admins to add team members by entering an existing user's email address
- **FR-028**: System MUST allow PIs and Admins to specify the role (PI or Research Coordinator) when adding team members
- **FR-029**: System MUST display team member information including name, role, and email address
- **FR-030**: System MUST allow PIs and Admins to remove team members from studies
- **FR-031**: System MUST prevent adding the same user to a study team multiple times
- **FR-032**: System MUST grant immediate access to studies when a user is added as a team member
- **FR-033**: System MUST revoke study access immediately when a user is removed from a study team
- **FR-034**: System MUST provide view-only access to the Team tab for Research Coordinators (no add/remove capabilities)

**Patient Enrollment**

- **FR-035**: System MUST display a patient enrollment counter showing "X / [target enrollment] enrolled" on the Patients tab
- **FR-036**: System MUST allow any study team member to add patients to studies they have access to
- **FR-037**: System MUST collect patient name (text) and enrollment date (date) when adding patients
- **FR-038**: System MUST display a list of enrolled patients showing name and enrollment date
- **FR-039**: System MUST increment the enrollment counter when patients are added
- **FR-040**: System MUST persist patient records and associate them with the correct study

**General System Behavior**

- **FR-041**: System MUST enforce role-based permissions for all study creation, viewing, and management actions
- **FR-042**: System MUST provide a top navigation bar with logo, "My Studies" link, user email display, and "Sign Out" action
- **FR-043**: System MUST redirect users to the dashboard after successful authentication
- **FR-044**: System MUST display appropriate empty states when users have no accessible studies

### Key Entities

- **User**: Represents a clinical research professional using the system. Attributes include email address (unique identifier), full name, role (Admin, PI, or Research Coordinator), and account creation date. Users are authenticated via magic links and have role-based access to studies.

- **Study**: Represents a clinical trial with extracted protocol data. Attributes include study name, phase (e.g., "Phase 2", "Phase 3"), medical indication/condition, target enrollment number, inclusion criteria (list), exclusion criteria (list), visit schedule/timepoints (list), owner (the PI who created the study), and creation date. Studies are created by PIs or Admins after protocol extraction.

- **Study Membership**: Represents the relationship between users and studies for team collaboration. Attributes include the associated study, the assigned user, the user's role on that study (PI or Research Coordinator), and assignment date. Enforces access control rules and enables team-based study management.

- **Patient**: Represents an enrolled participant in a clinical trial. Attributes include patient name, enrollment date, and the associated study. Patients are added by any study team member to track progress toward enrollment targets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full workflow from protocol upload to study creation in under 10 minutes (compared to 4-8 hours for manual extraction)
- **SC-002**: AI extraction accuracy is at least 80% correct, requiring minimal manual corrections by users during review
- **SC-003**: 5 or more real studies are created by actual Principal Investigators or Research Coordinators within 2 weeks of launch
- **SC-004**: 90% of users successfully complete protocol upload and extraction on their first attempt without encountering blocking errors
- **SC-005**: Users can add team members to studies and verify access is granted within 1 minute of assignment
- **SC-006**: System supports at least 100 concurrent users without performance degradation
- **SC-007**: Protocol uploads complete and begin extraction within 30 seconds of file selection
- **SC-008**: At least 2 users request additional features or invite colleagues to use the system (indicating perceived value)
- **SC-009**: Users report saving meaningful time compared to manual protocol extraction methods (qualitative feedback)
- **SC-010**: Patient enrollment tracking is intuitive enough that 80% of users can add a patient without instructions or help documentation

### Assumptions

- Clinical trial protocols follow standard formatting conventions that make AI extraction feasible
- Users have reliable internet connections for uploading large PDF files (up to 50MB)
- Magic link authentication via email is acceptable to clinical research professionals (no compliance issues with passwordless auth)
- Team members will already have accounts in the system before PIs attempt to assign them (no invitation/onboarding flow needed for MVP)
- Single-site studies only (no multi-site coordination features needed initially)
- Users are comfortable with AI-extracted data requiring manual review and verification
- Patient data will remain minimal (name and enrollment date only) and will not include PHI or sensitive medical information in MVP
- Study data and protocol PDFs will be retained indefinitely with no data deletion capabilities in MVP (deletion features can be added post-launch based on user feedback and regulatory requirements)
- Users will review AI extraction results, create the study, and then edit any incorrect fields on the study detail page

### Out of Scope for MVP

- Visit tracking or timeline management features
- Budget calculator or financial planning tools
- Patient eligibility screening or status workflows
- Document storage beyond the original protocol PDF
- Export or download functionality for study data
- Email notifications for team assignments or study updates
- Advanced search or filter capabilities for studies
- Study archiving or deletion features
- Detailed audit logs or activity tracking
- Multi-site study support or site coordination
- Integration with external clinical trial management systems
- Generating screening agent prompts or AI tools for patient assessment
- User profile editing (name, email, or role changes)
- Team member invitation system (users must sign up independently)

# API Contract: Protocol Extractor

**Date**: 2025-11-11
**Feature**: Protocol Extractor
**Phase**: 1 - API Contract Definition

## Overview

This document defines all API endpoints for the Protocol Extractor application. All endpoints are implemented as Next.js API routes under `/app/api/`. Authentication is handled via Supabase Auth middleware, and authorization is enforced through database RLS policies + application-level checks.

## Authentication

**Method**: HTTP-only cookies set by Supabase Auth

**Headers**:
- All authenticated requests automatically include session cookie
- No explicit Authorization header required (handled by middleware)

**Error Responses** (applies to all endpoints):
```json
// 401 Unauthorized
{
  "error": "Authentication required",
  "code": "UNAUTHENTICATED"
}

// 403 Forbidden
{
  "error": "You do not have permission to perform this action",
  "code": "FORBIDDEN"
}
```

## Endpoints

### 1. Extract Protocol Data

**Endpoint**: `POST /api/extract`

**Purpose**: Upload protocol PDF and extract study data using AI (Anthropic Claude API)

**Requirements**: FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015

**Authentication**: Required (PI or Admin role)

**Request**:
```http
POST /api/extract
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="protocol"; filename="protocol.pdf"
Content-Type: application/pdf

<binary PDF data>
--boundary--
```

**Request Validation**:
- File must be present and named "protocol"
- File MIME type must be "application/pdf"
- File size must be ≤ 50MB (FR-007)
- User must have role 'pi' or 'admin'

**Success Response**:
```json
// 200 OK
{
  "name": "Phase 3 Study of Drug X in Patients with Condition Y",
  "phase": "Phase 3",
  "indication": "Condition Y",
  "inclusion_criteria": [
    "Age 18-65 years",
    "Diagnosed with Condition Y",
    "Willing to provide informed consent"
  ],
  "exclusion_criteria": [
    "Pregnant or breastfeeding",
    "History of Drug X sensitivity",
    "Concurrent enrollment in another trial"
  ],
  "visit_schedule": [
    "Screening Visit (Day -14)",
    "Baseline Visit (Day 0)",
    "Week 4 Follow-up",
    "Week 8 Follow-up",
    "End of Study (Week 12)"
  ],
  "target_enrollment": 250
}
```

**Error Responses**:
```json
// 400 Bad Request - Missing file
{
  "error": "Please select a protocol PDF file to upload",
  "code": "MISSING_FILE"
}

// 400 Bad Request - File too large
{
  "error": "Protocol PDF must be 50MB or smaller",
  "code": "FILE_TOO_LARGE",
  "details": { "size_mb": 52.3, "max_mb": 50 }
}

// 400 Bad Request - Invalid file type
{
  "error": "Only PDF files are accepted",
  "code": "INVALID_FILE_TYPE",
  "details": { "received_type": "application/msword" }
}

// 408 Request Timeout - Extraction timeout
{
  "error": "AI extraction took longer than 5 minutes. Please try again with a smaller or clearer PDF.",
  "code": "EXTRACTION_TIMEOUT"
}

// 422 Unprocessable Entity - Extraction failed
{
  "error": "Unable to extract study data from this PDF. Please ensure the protocol is clearly formatted.",
  "code": "EXTRACTION_FAILED",
  "details": "Claude API returned incomplete data"
}

// 500 Internal Server Error - AI service error
{
  "error": "An error occurred while processing your protocol. Please try again.",
  "code": "EXTRACTION_ERROR"
}
```

**Performance**:
- Expected: 30-120 seconds for typical 20-page protocol
- Timeout: 5 minutes maximum (FR-013)

---

### 2. Create Study

**Endpoint**: `POST /api/studies`

**Purpose**: Create a new study from extracted protocol data

**Requirements**: FR-012, FR-014

**Authentication**: Required (PI or Admin role)

**Request**:
```json
{
  "name": "Phase 3 Study of Drug X in Patients with Condition Y",
  "phase": "Phase 3",
  "indication": "Condition Y",
  "target_enrollment": 250,
  "protocol_data": {
    "inclusion_criteria": ["...", "..."],
    "exclusion_criteria": ["...", "..."],
    "visit_schedule": ["...", "..."]
  }
}
```

**Request Validation**:
- `name` (required, non-empty string)
- `phase` (optional, string)
- `indication` (optional, string)
- `target_enrollment` (optional, positive integer)
- `protocol_data` (required, object with arrays for inclusion_criteria, exclusion_criteria, visit_schedule)

**Success Response**:
```json
// 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Phase 3 Study of Drug X in Patients with Condition Y",
  "phase": "Phase 3",
  "indication": "Condition Y",
  "target_enrollment": 250,
  "protocol_data": { /* ... */ },
  "owner_id": "user-uuid",
  "created_at": "2025-11-11T10:30:00Z"
}
```

**Error Responses**:
```json
// 400 Bad Request - Validation error
{
  "error": "Study name is required",
  "code": "VALIDATION_ERROR",
  "field": "name"
}

// 400 Bad Request - Invalid target enrollment
{
  "error": "Target enrollment must be a positive number",
  "code": "VALIDATION_ERROR",
  "field": "target_enrollment"
}
```

---

### 3. Get All Studies (Dashboard)

**Endpoint**: `GET /api/studies`

**Purpose**: Fetch all studies the current user has access to (implements role-based filtering)

**Requirements**: FR-014, FR-015, FR-016, FR-017

**Authentication**: Required

**Query Parameters**: None

**Success Response**:
```json
// 200 OK
[
  {
    "id": "study-uuid-1",
    "name": "Study A",
    "phase": "Phase 2",
    "indication": "Condition X",
    "target_enrollment": 100,
    "protocol_data": { /* ... */ },
    "owner_id": "user-uuid",
    "created_at": "2025-11-10T10:00:00Z",
    "team_member_count": 3,
    "patient_count": 12
  },
  {
    "id": "study-uuid-2",
    "name": "Study B",
    "phase": "Phase 3",
    "indication": "Condition Y",
    "target_enrollment": 250,
    "protocol_data": { /* ... */ },
    "owner_id": "user-uuid",
    "created_at": "2025-11-09T15:30:00Z",
    "team_member_count": 5,
    "patient_count": 45
  }
]
```

**Filtering Logic** (implemented via RLS):
- PIs: See studies they own OR are assigned to as team members
- Coordinators: See only studies they're assigned to
- Admins: See all studies

**Performance**:
- Expected: < 2 seconds (SC-006 requirement)
- Includes aggregated counts (team_member_count, patient_count) via JOIN

---

### 4. Get Study by ID

**Endpoint**: `GET /api/studies/[id]`

**Purpose**: Fetch detailed information for a specific study

**Requirements**: FR-020, FR-021, FR-022, FR-023

**Authentication**: Required

**Success Response**:
```json
// 200 OK
{
  "id": "study-uuid",
  "name": "Phase 3 Study of Drug X",
  "phase": "Phase 3",
  "indication": "Condition Y",
  "target_enrollment": 250,
  "protocol_data": {
    "inclusion_criteria": ["...", "..."],
    "exclusion_criteria": ["...", "..."],
    "visit_schedule": ["...", "..."]
  },
  "owner_id": "owner-uuid",
  "created_at": "2025-11-10T10:00:00Z",
  "owner": {
    "id": "owner-uuid",
    "name": "Dr. Jane Smith",
    "email": "jane.smith@example.com",
    "role": "pi"
  }
}
```

**Error Responses**:
```json
// 404 Not Found - Study doesn't exist or user lacks access
{
  "error": "Study not found",
  "code": "NOT_FOUND"
}
```

---

### 5. Update Study

**Endpoint**: `PATCH /api/studies/[id]`

**Purpose**: Edit study fields after creation (allows correcting AI extraction errors)

**Requirements**: FR-024, FR-025

**Authentication**: Required (owner or admin only)

**Request**:
```json
{
  "name": "Updated Study Name",
  "phase": "Phase 3",
  "indication": "Updated indication",
  "target_enrollment": 300,
  "protocol_data": {
    "inclusion_criteria": ["updated criterion 1", "updated criterion 2"],
    "exclusion_criteria": ["updated criterion 1"],
    "visit_schedule": ["updated visit 1", "updated visit 2"]
  }
}
```

**Request Validation**:
- All fields optional (only provided fields are updated)
- Same validation as Create Study endpoint

**Success Response**:
```json
// 200 OK
{
  "id": "study-uuid",
  "name": "Updated Study Name",
  "phase": "Phase 3",
  // ... full updated study object
}
```

**Error Responses**:
```json
// 403 Forbidden - Not owner or admin
{
  "error": "Only the study owner or admins can edit studies",
  "code": "FORBIDDEN"
}
```

---

### 6. Get Team Members

**Endpoint**: `GET /api/studies/[id]/team`

**Purpose**: Fetch list of team members for a study

**Requirements**: FR-022, FR-025, FR-027

**Authentication**: Required (must have access to study)

**Success Response**:
```json
// 200 OK
[
  {
    "id": "member-uuid-1",
    "study_id": "study-uuid",
    "user_id": "user-uuid-1",
    "role": "pi",
    "created_at": "2025-11-10T10:00:00Z",
    "user": {
      "id": "user-uuid-1",
      "name": "Dr. John Doe",
      "email": "john.doe@example.com",
      "role": "pi"
    }
  },
  {
    "id": "member-uuid-2",
    "study_id": "study-uuid",
    "user_id": "user-uuid-2",
    "role": "coordinator",
    "created_at": "2025-11-10T11:30:00Z",
    "user": {
      "id": "user-uuid-2",
      "name": "Sarah Johnson",
      "email": "sarah.j@example.com",
      "role": "coordinator"
    }
  }
]
```

---

### 7. Add Team Member

**Endpoint**: `POST /api/studies/[id]/team`

**Purpose**: Assign a user to a study team

**Requirements**: FR-023, FR-024, FR-027, FR-028

**Authentication**: Required (owner or admin only)

**Request**:
```json
{
  "email": "new.member@example.com",
  "role": "coordinator"
}
```

**Request Validation**:
- `email` (required, must match existing user)
- `role` (required, must be "pi" or "coordinator")

**Success Response**:
```json
// 201 Created
{
  "id": "member-uuid",
  "study_id": "study-uuid",
  "user_id": "user-uuid",
  "role": "coordinator",
  "created_at": "2025-11-11T12:00:00Z",
  "user": {
    "id": "user-uuid",
    "name": "New Member",
    "email": "new.member@example.com",
    "role": "coordinator"
  }
}
```

**Error Responses**:
```json
// 400 Bad Request - User not found
{
  "error": "No user found with email new.member@example.com. User must sign up first.",
  "code": "USER_NOT_FOUND"
}

// 409 Conflict - Already a member
{
  "error": "This user is already a team member on this study",
  "code": "ALREADY_MEMBER"
}
```

---

### 8. Remove Team Member

**Endpoint**: `DELETE /api/studies/[id]/team/[memberId]`

**Purpose**: Remove a user from a study team

**Requirements**: FR-026, FR-029

**Authentication**: Required (owner or admin only)

**Success Response**:
```json
// 204 No Content
(empty response body)
```

**Error Responses**:
```json
// 404 Not Found - Member doesn't exist
{
  "error": "Team member not found",
  "code": "NOT_FOUND"
}
```

---

### 9. Get Patients

**Endpoint**: `GET /api/studies/[id]/patients`

**Purpose**: Fetch list of enrolled patients for a study

**Requirements**: FR-031, FR-033, FR-034

**Authentication**: Required (must have access to study)

**Success Response**:
```json
// 200 OK
{
  "enrolled_count": 12,
  "target_enrollment": 100,
  "patients": [
    {
      "id": "patient-uuid-1",
      "study_id": "study-uuid",
      "name": "Patient A",
      "enrolled_date": "2025-11-01",
      "created_at": "2025-11-01T09:00:00Z"
    },
    {
      "id": "patient-uuid-2",
      "study_id": "study-uuid",
      "name": "Patient B",
      "enrolled_date": "2025-11-03",
      "created_at": "2025-11-03T14:30:00Z"
    }
  ]
}
```

---

### 10. Add Patient

**Endpoint**: `POST /api/studies/[id]/patients`

**Purpose**: Enroll a new patient in a study

**Requirements**: FR-032, FR-033, FR-035

**Authentication**: Required (any team member)

**Request**:
```json
{
  "name": "Patient C",
  "enrolled_date": "2025-11-11"
}
```

**Request Validation**:
- `name` (required, non-empty string)
- `enrolled_date` (required, ISO date string, not in future)

**Success Response**:
```json
// 201 Created
{
  "id": "patient-uuid",
  "study_id": "study-uuid",
  "name": "Patient C",
  "enrolled_date": "2025-11-11",
  "created_at": "2025-11-11T16:00:00Z"
}
```

**Error Responses**:
```json
// 400 Bad Request - Future date
{
  "error": "Enrollment date cannot be in the future",
  "code": "INVALID_DATE"
}
```

---

## Error Handling Conventions

All error responses follow this structure:
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": { /* optional additional context */ }
}
```

**Standard Error Codes**:
- `UNAUTHENTICATED` - No valid session (401)
- `FORBIDDEN` - Authenticated but lacks permission (403)
- `NOT_FOUND` - Resource doesn't exist or user lacks access (404)
- `VALIDATION_ERROR` - Request data invalid (400)
- `CONFLICT` - Operation conflicts with existing state (409)
- `TIMEOUT` - Operation exceeded time limit (408)
- `INTERNAL_ERROR` - Unexpected server error (500)

## Rate Limiting

**Not implemented in MVP** - Deferred to post-launch based on actual usage patterns.

If needed: Vercel Edge Config can add rate limiting (e.g., 100 requests/minute per IP).

## CORS Policy

**Configuration**: Allow only same-origin requests (Next.js default)

No CORS headers needed (frontend and API are same domain).

## Summary

All 10 endpoints map directly to functional requirements and support the 6 user stories. The API follows RESTful conventions with clear error handling and validation. Row Level Security policies in the database provide defense-in-depth authorization, complementing application-level checks.

Ready to proceed to quickstart guide generation.

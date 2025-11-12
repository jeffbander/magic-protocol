// T015: TypeScript database types

export type UserRole = 'admin' | 'pi' | 'coordinator';
export type StudyMemberRole = 'pi' | 'coordinator';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface ProtocolData {
  inclusion_criteria: string[];
  exclusion_criteria: string[];
  visit_schedule: string[];
}

export interface Study {
  id: string;
  name: string;
  phase: string | null;
  indication: string | null;
  target_enrollment: number | null;
  protocol_data: ProtocolData;
  owner_id: string;
  created_at: string;
}

export interface StudyWithOwner extends Study {
  owner: User;
}

export interface StudyMember {
  id: string;
  study_id: string;
  user_id: string;
  role: StudyMemberRole;
  created_at: string;
}

export interface StudyMemberWithUser extends StudyMember {
  user: User;
}

export interface Patient {
  id: string;
  study_id: string;
  name: string;
  enrolled_date: string;
  created_at: string;
}

// API response types
export interface ExtractedProtocolData {
  name: string;
  phase: string;
  indication: string;
  inclusion_criteria: string[];
  exclusion_criteria: string[];
  visit_schedule: string[];
  target_enrollment: number;
}

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

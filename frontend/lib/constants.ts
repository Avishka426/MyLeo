export const ROLES = {
  // Club level
  MEMBER: 'leo_member',
  EXCO: 'club_exco',
  // District level
  DISTRICT_MEMBER: 'district_member',
  DISTRICT_EXCO: 'district_exco',
  // Multiple district level
  MULTIPLE_MEMBER: 'multiple_member',
  MULTIPLE_EXCO: 'multiple_exco',
  // System
  ADMIN: 'system_admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const CLUB_ROLES: Role[]     = ['leo_member', 'club_exco'];
export const DISTRICT_ROLES: Role[] = ['district_member', 'district_exco'];
export const MULTIPLE_ROLES: Role[] = ['multiple_member', 'multiple_exco'];
export const EXCO_ROLES: Role[]     = ['club_exco', 'district_exco', 'multiple_exco', 'system_admin'];

export const ROLE_LABELS: Record<Role, string> = {
  leo_member:      'Leo Member',
  club_exco:       'Club Exco',
  district_member: 'District Member',
  district_exco:   'District Exco',
  multiple_member: 'Multiple Member',
  multiple_exco:   'Multiple Exco',
  system_admin:    'System Admin',
};

export const EXCO_POSITIONS = [
  'President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Assistant Treasurer',
] as const;

export const ALL_POSITIONS = [...EXCO_POSITIONS, 'Member'] as const;

export const PROJECT_STATUSES = ['upcoming', 'ongoing', 'completed'] as const;

export const STATUS_COLORS: Record<string, string> = {
  upcoming: '#1B4F8A',
  ongoing: '#FFD700',
  completed: '#27AE60',
  pending: '#E67E22',
  reviewed: '#3498DB',
  converted_to_project: '#27AE60',
  active: '#27AE60',
  inactive: '#E74C3C',
};

export const COLORS = {
  primary: '#1B4F8A',
  accent: '#FFD700',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  error: '#E74C3C',
  success: '#27AE60',
};

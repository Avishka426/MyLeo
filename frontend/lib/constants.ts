export const ROLES = {
  MEMBER: 'leo_member',
  EXCO: 'club_exco',
  ADMIN: 'system_admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

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

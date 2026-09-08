export function getHomeForRole(role?: string): string {
  if (role === 'ADMINISTRATOR') return '/admin/users';
  if (role === 'STAKEHOLDER') return '/stakeholder-review';
  if (role === 'DEVELOPER') return '/developer';
  if (role === 'QA_TESTER') return '/qa';
  return '/dashboard'; // PROJECT_MANAGER
}
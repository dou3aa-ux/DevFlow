export function getHomeForRole(role?: string): string {
  if (role === 'ADMINISTRATOR') return '/admin/users';
  if (role === 'STAKEHOLDER') return '/stakeholder-review';
  return '/dashboard'; // PROJECT_MANAGER, DEVELOPER, QA_TESTER
}
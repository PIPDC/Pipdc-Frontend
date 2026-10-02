export type Role = 'Admin' | 'Agent' | 'Client';

const ROLE_PRIORITY: Record<Role, number> = { Admin: 3, Agent: 2, Client: 1 };

export function primaryRole(roles: string[] | undefined): Role {
  if (!roles || roles.length === 0) return 'Client';
  return roles.reduce<Role>((highest, role) => {
    const candidate = role === 'Admin' ? 'Admin' : role === 'Agent' ? 'Agent' : 'Client';
    return ROLE_PRIORITY[candidate] > ROLE_PRIORITY[highest] ? candidate : highest;
  }, 'Client');
}

export function isAdmin(roles: string[] | undefined): boolean {
  return roles?.includes('Admin') ?? false;
}

export function isStaff(roles: string[] | undefined): boolean {
  return roles?.some((role) => role === 'Admin' || role === 'Agent') ?? false;
}

/**
 * Whether the "Become an Agent" call to action should be offered.
 *
 * Only for signed-in users with no staff role. Admins review applications rather
 * than making them, and an existing agent cannot apply again — the API rejects
 * both cases, so offering the button would be a dead end.
 */
export function canApplyAsAgent(roles: string[] | undefined): boolean {
  return !isStaff(roles);
}

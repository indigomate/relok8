/**
 * Relok8 Permissions and Access Control Module
 * Aligned with REVAMP Brief (Part 1 Hard Rule 1 & Part 3 Section 1)
 *
 * Core rule: Permissions must be enforced server-side.
 * Client role checks are for UX display only; actions must validate here.
 */

export type UserRole = 'visitor' | 'tenant' | 'landlord' | 'university_admin' | 'admin' | 'onlo';

export interface AuthContextUser {
  id: string;
  email: string;
  roles: UserRole[];
  status?: 'active' | 'suspended' | 'deleted';
}

export class PermissionDeniedError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = 'PERMISSION_DENIED', statusCode = 403) {
    super(message);
    this.name = 'PermissionDeniedError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Asserts user is authenticated and active
 */
export function requireUser(user: AuthContextUser | null | undefined): AuthContextUser {
  if (!user || !user.id) {
    throw new PermissionDeniedError('Authentication required to perform this action', 'UNAUTHENTICATED', 401);
  }
  if (user.status === 'suspended' || user.status === 'deleted') {
    throw new PermissionDeniedError('User account is not active', 'ACCOUNT_INACTIVE', 403);
  }
  return user;
}

/**
 * Asserts user has at least one of the required roles
 */
export function requireRole(user: AuthContextUser | null | undefined, allowedRoles: UserRole[]): AuthContextUser {
  const verifiedUser = requireUser(user);
  const hasRole = verifiedUser.roles.some((r) => allowedRoles.includes(r));
  if (!hasRole && !verifiedUser.roles.includes('admin')) {
    throw new PermissionDeniedError(
      `Action requires one of the following roles: ${allowedRoles.join(', ')}`,
      'ROLE_NOT_AUTHORIZED',
      403
    );
  }
  return verifiedUser;
}

/**
 * Asserts user is the owner / creator of a listing
 */
export function requireListingOwner(
  user: AuthContextUser | null | undefined,
  listingOwnerId: string
): AuthContextUser {
  const verifiedUser = requireUser(user);
  if (verifiedUser.id !== listingOwnerId && !verifiedUser.roles.includes('admin')) {
    throw new PermissionDeniedError(
      'Only the verified listing owner or an administrator can modify this listing',
      'NOT_LISTING_OWNER',
      403
    );
  }
  return verifiedUser;
}

/**
 * Asserts user is either the tenant or landlord of the specified lease
 */
export function requireLeaseMember(
  user: AuthContextUser | null | undefined,
  lease: { tenantId: string; landlordId: string }
): { user: AuthContextUser; isTenant: boolean; isLandlord: boolean } {
  const verifiedUser = requireUser(user);
  const isTenant = verifiedUser.id === lease.tenantId;
  const isLandlord = verifiedUser.id === lease.landlordId;
  const isAdmin = verifiedUser.roles.includes('admin');

  if (!isTenant && !isLandlord && !isAdmin) {
    throw new PermissionDeniedError(
      'You must be a tenant or landlord of this lease to access its dashboard',
      'NOT_LEASE_MEMBER',
      403
    );
  }

  return { user: verifiedUser, isTenant, isLandlord };
}

/**
 * Hard Rule 2: Only the lease's current tenant can start a takeover.
 */
export function requireTakeoverInitiator(
  user: AuthContextUser | null | undefined,
  lease: { tenantId: string }
): AuthContextUser {
  const verifiedUser = requireUser(user);
  if (verifiedUser.id !== lease.tenantId) {
    throw new PermissionDeniedError(
      'Only the currently registered tenant on this active lease can initiate a lease takeover (cesja)',
      'NOT_CURRENT_TENANT',
      403
    );
  }
  return verifiedUser;
}

/**
 * Hard Rule 2: Only the lease's landlord can approve or reject a takeover.
 */
export function requireTakeoverApprover(
  user: AuthContextUser | null | undefined,
  lease: { landlordId: string }
): AuthContextUser {
  const verifiedUser = requireUser(user);
  if (verifiedUser.id !== lease.landlordId && !verifiedUser.roles.includes('admin')) {
    throw new PermissionDeniedError(
      'Only the verified landlord of this lease can approve or reject a takeover agreement',
      'NOT_LEASE_LANDLORD',
      403
    );
  }
  return verifiedUser;
}

/**
 * Asserts that the actor is NOT Onlo (AI) for forbidden actions:
 * Onlo can never approve, sign, move money, change prices or delete data.
 */
export function assertHumanActor(actorType: 'human' | 'onlo' | 'system', actionDescription: string): void {
  if (actorType === 'onlo') {
    throw new PermissionDeniedError(
      `Onlo AI is forbidden from executing: ${actionDescription}. This requires explicit human authorization.`,
      'AI_ACTION_FORBIDDEN',
      403
    );
  }
}

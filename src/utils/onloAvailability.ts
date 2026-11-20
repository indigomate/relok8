const GLOBAL_ONLO_ROUTES = new Set([
  'home',
  'city',
  'saved',
  'help',
  'how-it-works',
  'list',
  'leave-your-lease',
  'savings-calculator',
  'meldunek-guide',
  'safety-guide',
  'cesja-template',
  'rewards',
  'enrollments',
]);

/**
 * Global Onlo belongs on discovery and guidance surfaces. Transactional,
 * account, legal, inbox, and listing-detail routes have their own focused UI.
 */
export function shouldShowGlobalOnlo(routeType: string): boolean {
  return GLOBAL_ONLO_ROUTES.has(routeType);
}

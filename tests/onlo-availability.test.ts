import { describe, expect, it } from 'vitest';
import { shouldShowGlobalOnlo } from '../src/utils/onloAvailability';

describe('global Onlo route availability', () => {
  it.each([
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
  ])('is available on the %s guidance surface', (route) => {
    expect(shouldShowGlobalOnlo(route)).toBe(true);
  });

  it.each([
    'listing-detail',
    'messages',
    'dashboard',
    'place',
    'account',
    'notifications',
    'sign-in',
    'sign-up',
    'terms',
    'privacy',
    'cookies',
  ])('stays out of the %s focused workflow', (route) => {
    expect(shouldShowGlobalOnlo(route)).toBe(false);
  });
});

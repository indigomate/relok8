import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.stubGlobal('window', { location: { search: '' } });
const state = vi.hoisted(() => ({ mode: 'ready', places: [] as any[] }));
vi.mock('convex/react', async () => {
  const { getFunctionName } = await import('convex/server');
  return {
    useConvexAuth: () => ({ isAuthenticated: state.mode !== 'guest', isLoading: state.mode === 'loading' }),
    useQuery: (ref: any, args: any) => {
      if (args === 'skip') return undefined;
      const name = getFunctionName(ref);
      if (name === 'workflow:activity') return state.mode === 'fetching' ? undefined : state.places;
      if (name === 'workflow:myReports') return [];
      if (args.operation === 'place') return { id: args.input.id, status: 'available_for_takeover', rentPLN: 1800, czynszPLN: 300, rules: '' };
      return undefined;
    },
    useMutation: () => vi.fn(),
  };
});
import { PlacePage } from '../src/pages/PlacePage';
import { LandlordDashboard } from '../src/components/LandlordDashboard';
const listing = (id: string, title: string, owner = true, landlord = false) => ({ id, title, city: 'Warsaw', owner, landlord, status: 'AVAILABLE', permission: false, applications: [] });
function render(mode: string, places: any[] = []) {
  state.mode = mode; state.places = places;
  return renderToStaticMarkup(createElement(PlacePage, { onBack: vi.fn() }));
}
describe('My Place layout and role controls', () => {
  it('renders one property detail instead of repeating every personal listing', () => {
    const html = render('ready', [listing('one', 'First home'), listing('two', 'Second home')]);
    expect(html).toMatch(/<h2[^>]*>First home<\/h2>/);
    expect(html).not.toMatch(/<h2[^>]*>Second home<\/h2>/);
    expect(html).toContain('<option value="two">Second home');
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('Handover progress');
  });
  it('keeps settings and applications collapsed until requested', () => {
    const p = listing('one', 'First home');
    p.applications = [{ id: 'app', name: 'Alex', status: 'requested', updatedAt: Date.now(), expiresAt: Date.now() + 86400000 }] as any;
    const html = render('ready', [p]);
    expect(html).toContain('Review application &amp; next steps');
    expect(html).not.toMatch(/<details[^>]*\sopen[\s=>]/);
    expect(html).toContain('Delete listing…');
  });
  it('does not offer applicants property management or landlord decisions', () => {
    const html = render('ready', [listing('one', 'Applied home', false, false)]);
    expect(html).not.toContain('Listing settings &amp; landlord');
    expect(html).not.toContain('Delete listing');
    expect(html).not.toContain('Edit property details');
  });
  it('offers landlords permission controls but not owner editing or deletion', () => {
    const html = render('ready', [listing('one', 'Managed home', false, true)]);
    expect(html).toContain('Confirm permission to advertise');
    expect(html).not.toContain('Edit property details');
    expect(html).not.toContain('Delete listing');
  });
  it('distinguishes sign-in, loading and empty states', () => {
    expect(render('guest')).toContain('Sign in to continue');
    expect(render('loading')).toContain('Loading…');
    expect(render('fetching')).toContain('Loading your activity…');
    expect(render('ready')).toContain('Your next move starts here');
  });
  it('uses the same single workflow for existing landlord routes', () => {
    state.mode = 'ready';state.places = [listing('one', 'Managed home', false, true)];
    const html = renderToStaticMarkup(createElement(LandlordDashboard, {}));
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('Landlord dashboard');
    expect(html).toContain('Confirm permission to advertise');
  });
});

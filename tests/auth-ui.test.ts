import { test, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.stubGlobal('window', {location: {pathname: '/pl/place',search: '?invite=recipient-token',hash: ''}});
vi.mock('@clerk/react', () => ({
  useAuth: () => ({isLoaded: true, isSignedIn: false}),
  useUser: () => ({isLoaded: true, isSignedIn: false, user: null}),
  SignIn: (props: any) => createElement('div', {'data-sign-in-return': props.forceRedirectUrl, 'data-sign-up-return': props.signUpForceRedirectUrl}),
  SignUp: (props: any) => createElement('div', {'data-sign-up-return': props.forceRedirectUrl, 'data-sign-in-return': props.signInForceRedirectUrl}),
}));
import { LoginModal } from '../src/components/LoginModal';
test('Clerk forms retain the invitation recipient destination for both auth modes', () => {
  for (const initialMode of ['signin','signup'] as const) {
    const html = renderToStaticMarkup(createElement(LoginModal,{isOpen:true,onClose:vi.fn(),onLoginSuccess:vi.fn(),locale:'pl',initialMode}));
    expect(html).toContain('data-sign-in-return="/pl/place?invite=recipient-token"');
    expect(html).toContain('data-sign-up-return="/pl/place?invite=recipient-token"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  }
});

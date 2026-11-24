import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../src/lib/backend', () => ({
  backend: () => ({ action: vi.fn() }),
}));

import { HelpPage } from '../src/pages/HelpPage';
import { FormField } from '../src/components/ui/FormField';
import { LoadingState } from '../src/components/ui/LoadingState';
import { StatusMessage } from '../src/components/ui/StatusMessage';

describe('shared UI states', () => {
  test('status messages expose appropriate live-region semantics', () => {
    const error = renderToStaticMarkup(createElement(StatusMessage, { tone: 'error', children: 'Could not save' }));
    const success = renderToStaticMarkup(createElement(StatusMessage, { tone: 'success', children: 'Saved' }));
    expect(error).toContain('role="alert"');
    expect(error).toContain('aria-live="assertive"');
    expect(success).toContain('role="status"');
    expect(success).toContain('aria-live="polite"');
  });

  test('loading state remains understandable without animation', () => {
    const html = renderToStaticMarkup(createElement(LoadingState, { label: 'Loading messages' }));
    expect(html).toContain('role="status"');
    expect(html).toContain('motion-reduce:animate-none');
    expect(html).toContain('Loading messages');
  });

  test('form fields associate errors with controls', () => {
    const html = renderToStaticMarkup(
      createElement(
        FormField,
        {
          label: 'Email',
          htmlFor: 'email',
          error: 'Enter an email',
          required: true,
          children: createElement('input', { id: 'email', type: 'email' }),
        },
      ),
    );
    expect(html).toContain('for="email"');
    expect(html).toContain('aria-describedby="email-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('role="alert"');
  });
});

describe('Help page accessibility', () => {
  test('labels search and support controls and connects accordion panels', () => {
    const html = renderToStaticMarkup(
      createElement(HelpPage, { onBack: vi.fn(), onOpenOnlo: vi.fn(), locale: 'en' }),
    );
    expect(html).toContain('for="help-search"');
    expect(html).toContain('id="support-email"');
    expect(html).toContain('for="support-email"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-controls="faq-panel-cesja-what-is"');
    expect(html).toContain('role="region"');
    expect(html).toContain('noValidate=""');
  });
});

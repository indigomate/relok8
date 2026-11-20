import { describe, expect, test } from 'vitest';
import { EMAIL_TEMPLATE_KINDS, renderRelok8Email } from '../src/emails/templates';

describe('Relok8 email templates', () => {
  test('render every English and Polish template with HTML and plain text', () => {
    for (const locale of ['en', 'pl'] as const) {
      for (const kind of EMAIL_TEMPLATE_KINDS) {
        const rendered = renderRelok8Email(kind, locale, { recipientName: 'Marta' });
        expect(rendered.subject.length).toBeGreaterThan(5);
        expect(rendered.preheader.length).toBeGreaterThan(5);
        expect(rendered.html).toContain('<!doctype html>');
        expect(rendered.html).toContain('support@relok8.online');
        expect(rendered.text).toContain('Relok8');
      }
    }
  });

  test('escapes user-controlled values and rejects unsafe action URLs', () => {
    const rendered = renderRelok8Email('takeover_request', 'en', {
      applicantName: '<script>alert(1)</script>',
      ctaUrl: 'javascript:alert(1)',
    });
    expect(rendered.html).not.toContain('<script>');
    expect(rendered.html).toContain('&lt;script&gt;');
    expect(rendered.html).not.toContain('javascript:');
    expect(rendered.html).toContain('https://relok8.online');
  });

  test('marketing email includes unsubscribe controls', () => {
    const rendered = renderRelok8Email('weekly_digest', 'en', {
      unsubscribeUrl: 'https://relok8.online/unsubscribe/example',
    });
    expect(rendered.category).toBe('marketing');
    expect(rendered.html).toContain('Unsubscribe');
    expect(rendered.text).toContain('Unsubscribe:');
  });

  test('transactional templates do not display a marketing unsubscribe link', () => {
    const rendered = renderRelok8Email('handover_complete', 'en');
    expect(rendered.category).toBe('transactional');
    expect(rendered.html).not.toContain('>Unsubscribe<');
  });
});


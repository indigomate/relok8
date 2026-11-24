import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const getArgument = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const baseUrl = (getArgument('--base-url') ?? 'https://relok8.online').replace(/\/$/, '');
const outputDirectory = getArgument('--output') ?? 'docs/product-upgrade/evidence/step-03b-accessible-states';
const systemChromium = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']
  .find((candidate) => existsSync(candidate));
const executablePath = process.env.CHROMIUM_PATH || systemChromium || undefined;

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath });
const cases = [
  { id: 'help-validation-mobile-en', path: '/help' },
  { id: 'help-validation-mobile-pl', path: '/pl/help' },
];

try {
  for (const testCase of cases) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const failures = [];

    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => failures.push(`page: ${error.message}`));
    await page.addInitScript(() => localStorage.setItem('r8_cookie_consent', 'essential_only'));
    await page.goto(`${baseUrl}${testCase.path}`, { waitUntil: 'networkidle', timeout: 45_000 });

    const form = page.locator('form').filter({ has: page.locator('#support-email') });
    await form.scrollIntoViewIfNeeded();
    await form.getByRole('button', { name: /send message|wyślij zapytanie/i }).click();

    const invalidControls = form.locator('[aria-invalid="true"]');
    const alerts = form.locator('[role="alert"]');
    if (await invalidControls.count() !== 2) failures.push('expected two invalid controls');
    if (await alerts.count() !== 2) failures.push('expected two linked validation alerts');

    await form.screenshot({ path: `${outputDirectory}/${testCase.id}.png` });

    if (failures.length > 0) {
      throw new Error(`${testCase.id}: ${failures.join('; ')}`);
    }
    console.log(`PASS ${testCase.path} (${testCase.id})`);
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`\nAll ${cases.length} Help validation-state checks passed.`);

import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const getArgument = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
};

const baseUrl = (getArgument('--base-url') ?? 'https://relok8.online').replace(/\/$/, '');
const outputDirectory = getArgument('--output');
const systemChromium = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']
  .find((candidate) => existsSync(candidate));
const executablePath = process.env.CHROMIUM_PATH || systemChromium || undefined;

const routes = [
  { id: 'home-mobile-narrow', path: '/', viewport: { width: 320, height: 700 } },
  { id: 'home-desktop', path: '/', viewport: { width: 1440, height: 1000 } },
  { id: 'home-polish-mobile', path: '/pl', viewport: { width: 390, height: 844 } },
  { id: 'home-tablet', path: '/', viewport: { width: 768, height: 1024 } },
  { id: 'home-small-desktop', path: '/', viewport: { width: 1024, height: 900 } },
  { id: 'how-it-works-desktop', path: '/how-it-works', viewport: { width: 1440, height: 1000 } },
  { id: 'list-place-mobile', path: '/list', viewport: { width: 390, height: 844 } },
  { id: 'messages-signed-out-mobile', path: '/messages', viewport: { width: 390, height: 844 } },
  { id: 'help-desktop', path: '/help', viewport: { width: 1440, height: 1000 } },
];

if (outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
}

const browser = await chromium.launch({ headless: true, executablePath });
const failures = [];

try {
  for (const route of routes) {
    const context = await browser.newContext({ viewport: route.viewport });
    const page = await context.newPage();
    const routeFailures = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        routeFailures.push(`console: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => routeFailures.push(`page: ${error.message}`));
    page.on('response', (response) => {
      if (response.status() >= 500) {
        routeFailures.push(`HTTP ${response.status()}: ${response.url()}`);
      }
    });

    const response = await page.goto(`${baseUrl}${route.path}`, {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });
    await page.waitForTimeout(1_000);

    if (!response || response.status() >= 400) {
      routeFailures.push(`navigation: ${response?.status() ?? 'no response'}`);
    }

    if (outputDirectory) {
      await page.screenshot({
        path: `${outputDirectory}/${route.id}.png`,
        fullPage: true,
      });
    }

    if (routeFailures.length === 0) {
      console.log(`PASS ${route.path} (${route.id})`);
    } else {
      failures.push({ route: route.path, failures: [...new Set(routeFailures)] });
      console.error(`FAIL ${route.path} (${route.id})`);
    }

    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`\n${failure.route}`);
    for (const detail of failure.failures) console.error(`  - ${detail}`);
  }
  process.exitCode = 1;
} else {
  console.log(`\nAll ${routes.length} public-route smoke checks passed.`);
}

import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require(
  'C:/Users/Tran Bao Ngoc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core',
);

const url = process.env.APP_URL || 'http://127.0.0.1:5173';
const viewports = [
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'mobile-430x932', width: 430, height: 932 },
  { name: 'desktop-1200x820', width: 1200, height: 820 },
];

await mkdir('screenshots', { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const results = [];

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `screenshots/${viewport.name}.png`, fullPage: true });

  const metrics = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.bottom-nav button')];
    const app = document.querySelector('.phone-stage');
    return {
      title: document.querySelector('h1')?.textContent || '',
      navButtonCount: buttons.length,
      minButtonHeight: Math.min(...buttons.map((button) => button.getBoundingClientRect().height)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      bodyOverflow: document.body.scrollWidth > window.innerWidth,
      appWidth: app?.getBoundingClientRect().width || 0,
      appHeight: app?.getBoundingClientRect().height || 0,
    };
  });

  await page.getByRole('button', { name: /Bán hàng/ }).click();
  const afterSell = await page.locator('.stat-pill').first().innerText();
  await page.getByRole('button', { name: /Sổ sử/ }).click();
  const ledgerVisible = await page.getByRole('dialog', { name: 'Sổ sử' }).isVisible();

  results.push({ viewport, metrics, afterSell, ledgerVisible, consoleErrors });
  await page.close();
}

await browser.close();

console.log(JSON.stringify(results, null, 2));

const failures = results.flatMap((result) => {
  const messages = [];
  if (result.consoleErrors.length) messages.push(`${result.viewport.name}: console errors`);
  if (result.metrics.horizontalOverflow || result.metrics.bodyOverflow) {
    messages.push(`${result.viewport.name}: horizontal overflow`);
  }
  if (result.metrics.navButtonCount !== 5) messages.push(`${result.viewport.name}: expected 5 nav buttons`);
  if (result.metrics.minButtonHeight < 44) messages.push(`${result.viewport.name}: button below 44px`);
  if (!result.ledgerVisible) messages.push(`${result.viewport.name}: ledger did not open`);
  return messages;
});

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

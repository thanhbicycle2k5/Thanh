const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const url = process.env.APP_URL || 'http://localhost:3000';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    try {
      const args = msg.args().map(a => a.jsonValue()).map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v)));
      logs.push({ type: msg.type(), text: msg.text(), args });
      console.log('[console]', msg.type(), msg.text());
    } catch (e) {
      logs.push({ type: msg.type(), text: msg.text() });
    }
  });

  page.on('pageerror', err => {
    logs.push({ type: 'pageerror', message: err.message, stack: err.stack });
    console.error('Page error:', err.message);
  });

  // retry navigation until server responds
  let ok = false;
  for (let i = 0; i < 40; i++) {
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
      if (resp && resp.ok()) { ok = true; break; }
    } catch (e) {
      // wait and retry
    }
    await new Promise(r => setTimeout(r, 500));
  }

  if (!ok) {
    console.error('Failed to load app at', url);
    await browser.close();
    process.exit(2);
  }

  // wait a bit for SPA hydration
  await page.waitForTimeout(1000);

  // open settings via test hook
  try {
    const exposed = await page.evaluate(() => !!(window && window.__openSettings));
    console.log('Test hook present:', exposed);
    if (exposed) {
      await page.evaluate(() => window.__openSettings());
    } else {
      // fallback: click last header button (heuristic)
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('header button'));
        if (buttons.length) {
          buttons[buttons.length-1].click();
        }
      });
    }
  } catch (e) {
    console.error('Failed to open settings:', e);
  }

  // wait for dialog to render
  await page.waitForTimeout(2000);

  // snapshot console logs to a file
  const out = '/tmp/app_console_logs.json';
  fs.writeFileSync(out, JSON.stringify(logs, null, 2));
  console.log('Wrote logs to', out);

  await browser.close();
  process.exit(0);
})();

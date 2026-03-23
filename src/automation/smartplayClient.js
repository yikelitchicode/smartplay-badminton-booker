import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE_URL = 'https://www.smartplay.lcsd.gov.hk';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadSelectorConfig(customPath) {
  const p = customPath || path.resolve(__dirname, '..', 'config', 'selectors.tc.json');
  const raw = await fs.readFile(p, 'utf8');
  return JSON.parse(raw);
}

export class SmartplayClient {
  constructor(opts = {}) {
    this.opts = opts;
    this.browser = null;
    this.page = null;
    this.context = null;
    this.selectors = null;
  }

  async init() {
    this.selectors = await loadSelectorConfig(this.opts.selectorConfigPath);
    this.browser = await chromium.launch({ headless: this.opts.headless ?? true });
    this.context = await this.browser.newContext({
      locale: 'zh-HK',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    });
    this.page = await this.context.newPage();
  }

  async _findFirstVisible(candidates, timeout = 1500) {
    for (const s of candidates || []) {
      const locator = this.page.locator(s);
      if (await locator.first().isVisible({ timeout }).catch(() => false)) {
        return locator.first();
      }
    }
    return null;
  }

  async _clickIfFound(candidates) {
    const loc = await this._findFirstVisible(candidates);
    if (loc) {
      await loc.click({ timeout: 2000 }).catch(() => {});
      return true;
    }
    return false;
  }

  async _snapshot(tag) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.resolve(__dirname, '..', '..', 'artifacts');
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${tag}-${stamp}.png`);
    await this.page.screenshot({ path: file, fullPage: true }).catch(() => {});
    return file;
  }

  async login() {
    if (!this.page) throw new Error('Client not initialized');

    await this.page.goto(`${BASE_URL}/home?lang=tc`, { waitUntil: 'domcontentloaded' });
    await this._clickIfFound(this.selectors.login.entryButtons);

    const username = this.opts.username ?? '';
    const password = this.opts.password ?? '';
    if (!username || !password) {
      throw new Error('Missing SMARTPLAY_USERNAME / SMARTPLAY_PASSWORD');
    }

    const userInput = await this._findFirstVisible(this.selectors.login.username, 2500);
    const passInput = await this._findFirstVisible(this.selectors.login.password, 2500);
    if (!userInput || !passInput) {
      const shot = await this._snapshot('login-form-not-found');
      throw new Error(`Login fields not found. Screenshot: ${shot}`);
    }

    await userInput.fill(username);
    await passInput.fill(password);

    const didClickSubmit = await this._clickIfFound(this.selectors.login.submitButtons);
    if (!didClickSubmit) {
      const shot = await this._snapshot('login-submit-not-found');
      throw new Error(`Login submit button not found. Screenshot: ${shot}`);
    }

    await this.page.waitForTimeout(3000);
    const hint = await this._findFirstVisible(this.selectors.login.loggedInHints, 2000);
    if (!hint) {
      const shot = await this._snapshot('login-not-confirmed');
      throw new Error(`Login may require captcha/OTP/manual confirmation. Screenshot: ${shot}`);
    }
  }

  async getBadmintonAvailability(query) {
    if (!this.page) throw new Error('Client not initialized');
    const cfg = this.selectors.availability;

    await this.page.goto(`${BASE_URL}${cfg.facilityPage}`, { waitUntil: 'domcontentloaded' });

    const activitySelect = await this._findFirstVisible(cfg.activityCombobox, 1500);
    if (activitySelect) {
      await activitySelect.click().catch(() => {});
      await this._clickIfFound(cfg.activityOptions);
    }

    const dateInput = await this._findFirstVisible(cfg.dateInput, 1500);
    if (dateInput && query.date) {
      await dateInput.fill(query.date).catch(() => {});
    }

    await this._clickIfFound(cfg.searchButtons);
    await this.page.waitForTimeout(2000);

    let rows = null;
    for (const sel of cfg.resultRows || []) {
      const loc = this.page.locator(sel);
      const count = await loc.count().catch(() => 0);
      if (count > 0) {
        rows = loc;
        break;
      }
    }

    if (!rows) {
      const shot = await this._snapshot('availability-rows-not-found');
      throw new Error(`Result rows not found. Screenshot: ${shot}`);
    }

    const count = await rows.count().catch(() => 0);
    const availableRe = new RegExp(cfg.availableRegex, 'i');
    const bookedRe = new RegExp(cfg.bookedRegex, 'i');
    const slots = [];

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const tds = row.locator('td');
      const tdCount = await tds.count().catch(() => 0);
      const cell = async (idx) => (idx < tdCount ? (await tds.nth(idx).innerText().catch(() => '')).trim() : '');
      const rowText = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();

      if (!rowText) continue;

      const status = availableRe.test(rowText)
        ? 'available'
        : bookedRe.test(rowText)
          ? 'booked'
          : 'unknown';

      slots.push({
        venue: (await cell(0)) || query.venue || '未知場地',
        court: (await cell(1)) || `場次#${i + 1}`,
        start: (await cell(2)) || query.startTime || '--:--',
        end: (await cell(3)) || query.endTime || '--:--',
        status
      });
    }

    return slots;
  }

  async bookBadminton(req) {
    if (!this.page) throw new Error('Client not initialized');
    await this.page.goto(`${BASE_URL}${this.selectors.availability.facilityPage}`, { waitUntil: 'domcontentloaded' });

    return {
      status: 'manual-confirmation-required',
      detail: 'Flow prepared. Final confirm/payment/captcha must be completed with operator approval.',
      request: req
    };
  }

  async collectDebugSnapshot(tag = 'debug') {
    if (!this.page) throw new Error('Client not initialized');
    return this._snapshot(tag);
  }

  async close() {
    await this.browser?.close();
  }
}

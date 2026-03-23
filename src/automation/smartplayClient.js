import { chromium } from 'playwright';

const BASE_URL = 'https://www.smartplay.lcsd.gov.hk';

export class SmartplayClient {
  constructor(opts = {}) {
    this.opts = opts;
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({ headless: this.opts.headless ?? true });
    const context = await this.browser.newContext({
      locale: 'zh-HK',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    });
    this.page = await context.newPage();
  }

  async login() {
    if (!this.page) throw new Error('Client not initialized');

    await this.page.goto(`${BASE_URL}/home?lang=tc`, { waitUntil: 'domcontentloaded' });

    const loginBtn = this.page.getByRole('button', { name: /登入|log\s*in/i }).first();
    if (await loginBtn.isVisible().catch(() => false)) {
      await loginBtn.click();
    }

    const username = this.opts.username ?? '';
    const password = this.opts.password ?? '';
    if (!username || !password) {
      throw new Error('Missing SMARTPLAY_USERNAME / SMARTPLAY_PASSWORD');
    }

    const userInput = this.page.locator('input[type="text"], input[name*="user" i], input[id*="user" i]').first();
    const passInput = this.page.locator('input[type="password"], input[name*="pass" i], input[id*="pass" i]').first();

    await userInput.fill(username);
    await passInput.fill(password);

    const submitBtn = this.page.getByRole('button', { name: /登入|登錄|login/i }).first();
    await submitBtn.click();

    await this.page.waitForTimeout(3000);

    const loggedInHint = this.page.getByText(/我的帳戶|my account|登出|logout/i).first();
    if (!(await loggedInHint.isVisible().catch(() => false))) {
      throw new Error('Login may require captcha/OTP/manual confirmation. Run with HEADLESS=false.');
    }
  }

  async getBadmintonAvailability(query) {
    if (!this.page) throw new Error('Client not initialized');

    await this.page.goto(`${BASE_URL}/facilities?lang=tc`, { waitUntil: 'domcontentloaded' });

    const activitySelect = this.page.locator('select, [role="combobox"]').first();
    if (await activitySelect.isVisible().catch(() => false)) {
      await activitySelect.click();
      const badmintonOption = this.page.getByText(/羽毛球|badminton/i).first();
      if (await badmintonOption.isVisible().catch(() => false)) await badmintonOption.click();
    }

    const dateInput = this.page.locator('input[type="date"], input[placeholder*="日期"], input[placeholder*="date" i]').first();
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill(query.date);
    }

    const searchBtn = this.page.getByRole('button', { name: /搜尋|查詢|search/i }).first();
    if (await searchBtn.isVisible().catch(() => false)) {
      await searchBtn.click();
      await this.page.waitForTimeout(2000);
    }

    const rows = this.page.locator('table tbody tr');
    const count = await rows.count().catch(() => 0);
    const slots = [];

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
      if (!text) continue;

      const status = /可供|空|available/i.test(text)
        ? 'available'
        : /已滿|booked|full/i.test(text)
          ? 'booked'
          : 'unknown';

      slots.push({
        venue: query.venue || '未知場地',
        court: `場次#${i + 1}`,
        start: query.startTime || '--:--',
        end: query.endTime || '--:--',
        status
      });
    }

    return slots;
  }

  async bookBadminton(req) {
    if (!this.page) throw new Error('Client not initialized');
    await this.page.goto(`${BASE_URL}/facilities?lang=tc`, { waitUntil: 'domcontentloaded' });

    return {
      status: 'queued-manual-confirmation',
      detail:
        'Booking scaffold executed. Complete selector mapping + captcha/OTP/payment confirmations before production use.',
      request: req
    };
  }

  async close() {
    await this.browser?.close();
  }
}

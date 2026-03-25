import { SmartplayClient } from '../automation/smartplayClient.js';
import { ValidationError } from '../utils/errors.js';
import { validateAvailabilityQuery } from '../utils/validation.js';

function buildClient() {
  const username = process.env.SMARTPLAY_USERNAME;
  const password = process.env.SMARTPLAY_PASSWORD;
  if (!username || !password) {
    throw new ValidationError('Smartplay credentials are missing', [
      !username ? 'SMARTPLAY_USERNAME is required' : null,
      !password ? 'SMARTPLAY_PASSWORD is required' : null
    ].filter(Boolean));
  }

  return new SmartplayClient({
    headless: process.env.HEADLESS !== 'false',
    username,
    password,
    selectorConfigPath: process.env.SELECTOR_CONFIG_PATH || undefined,
    enhancedLoginMode: process.env.LOGIN_ENHANCED_MODE !== 'false',
    sessionStatePath: process.env.SESSION_STATE_PATH || '.session/smartplay-state.json',
    manualLoginTimeoutSec: Number(process.env.MANUAL_LOGIN_TIMEOUT_SEC || 180)
  });
}

export async function fetchAvailability(query) {
  validateAvailabilityQuery(query);
  const client = buildClient();

  try {
    await client.init();
    await client.login();
    const slots = await client.getBadmintonAvailability(query);
    return slots.filter((x) => x.status === 'available' || x.status === 'unknown');
  } finally {
    await client.close();
  }
}

export async function submitBooking(requestBody) {
  if (process.env.AUTO_BOOK_ENABLED !== 'true') {
    throw new ValidationError('Booking endpoint is disabled', ['AUTO_BOOK_ENABLED must be true']);
  }

  const client = buildClient();

  try {
    await client.init();
    await client.login();
    return await client.bookBadminton(requestBody);
  } finally {
    await client.close();
  }
}

export async function debugLoginSnapshot() {
  const client = buildClient();

  try {
    await client.init();
    await client.login();
    const screenshot = await client.collectDebugSnapshot('post-login');
    return { screenshot };
  } finally {
    await client.close();
  }
}

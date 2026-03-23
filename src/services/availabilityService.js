import { SmartplayClient } from '../automation/smartplayClient.js';

export async function fetchAvailability(query) {
  const client = new SmartplayClient({
    headless: process.env.HEADLESS !== 'false',
    username: process.env.SMARTPLAY_USERNAME,
    password: process.env.SMARTPLAY_PASSWORD
  });

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
    throw new Error('AUTO_BOOK_ENABLED is false. Booking endpoint is disabled.');
  }

  const client = new SmartplayClient({
    headless: process.env.HEADLESS !== 'false',
    username: process.env.SMARTPLAY_USERNAME,
    password: process.env.SMARTPLAY_PASSWORD
  });

  try {
    await client.init();
    await client.login();
    return await client.bookBadminton(requestBody);
  } finally {
    await client.close();
  }
}

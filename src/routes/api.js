import { Router } from 'express';
import { debugLoginSnapshot, fetchAvailability, submitBooking } from '../services/availabilityService.js';
import { ValidationError, toErrorMessage } from '../utils/errors.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'smartplay-badminton-booker' });
});

apiRouter.post('/availability', async (req, res) => {
  try {
    const { date, district, venue, activity = 'badminton', startTime, endTime } = req.body || {};
    if (!date) {
      return res.status(400).json({ ok: false, error: 'date is required (YYYY-MM-DD)' });
    }

    const slots = await fetchAvailability({ date, district, venue, activity, startTime, endTime });
    return res.json({ ok: true, query: { date, district, venue, activity, startTime, endTime }, slots });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 500;
    return res.status(status).json({ ok: false, error: toErrorMessage(err), details: err.details });
  }
});

apiRouter.post('/book', async (req, res) => {
  try {
    const result = await submitBooking(req.body || {});
    return res.json({ ok: true, result });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 500;
    return res.status(status).json({ ok: false, error: toErrorMessage(err), details: err.details });
  }
});

apiRouter.post('/debug/login-snapshot', async (_req, res) => {
  if (process.env.DEBUG_TOOLS_ENABLED !== 'true') {
    return res.status(403).json({ ok: false, error: 'DEBUG_TOOLS_ENABLED is false' });
  }

  try {
    const result = await debugLoginSnapshot();
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

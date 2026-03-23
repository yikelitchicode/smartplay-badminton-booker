# SmartPLAY Badminton Booker (Research + MVP)

> ⚠️ **Important**: This project is for educational and personal productivity use. Please comply with SmartPLAY / LCSD terms, fair-use rules, and local laws. Avoid abusive traffic and unfair booking behavior.

## What this project does

- Logs into SmartPLAY using browser automation (Playwright)
- Searches badminton court availability for a target date/time range
- Exposes a backend API for availability data
- Provides a simple web page to view empty slots by time period
- Includes an assisted booking flow scaffold (`/api/book`) you can harden for real usage

## Why browser automation (not direct API only)

During reverse-engineering, SmartPLAY endpoints appear to exist under paths like:

- `/facility/api/v1/...`
- `/programme/api/v1/...`
- `/param/api/v1/...`
- `/notification/api/v1/...`

However, direct server-to-server access may be protected by anti-bot / WAF behavior and session constraints. Browser-context automation is usually the most reliable starting point because it preserves cookies, headers, JS runtime behavior, and anti-automation checks.

## Project structure

```text
src/
  automation/smartplayClient.js   # Playwright login/search/book flow
  routes/api.js                   # HTTP APIs
  services/availabilityService.js # Business logic wrapper
  types/models.js                 # JSDoc models
  server.js                       # Express server
public/
  index.html                      # Frontend for querying vacancies
```

## Quick start

1. Install dependencies

   ```bash
   npm install
   npx playwright install chromium
   ```

2. Configure environment

   ```bash
   cp .env.example .env
   # Fill SMARTPLAY_USERNAME / SMARTPLAY_PASSWORD
   ```

3. Run

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`

## API

### `POST /api/availability`

Request body:

```json
{
  "date": "2026-03-29",
  "district": "灣仔區",
  "venue": "伊利沙伯體育館",
  "activity": "badminton",
  "startTime": "18:00",
  "endTime": "22:00"
}
```

Response body (example):

```json
{
  "ok": true,
  "query": {"date": "2026-03-29"},
  "slots": [
    {
      "venue": "伊利沙伯體育館",
      "court": "羽毛球場1",
      "start": "18:00",
      "end": "19:00",
      "status": "available"
    }
  ]
}
```

### `POST /api/book`

Performs assisted booking flow. By default, booking is blocked unless `AUTO_BOOK_ENABLED=true`.

### `POST /api/debug/login-snapshot`

Creates a post-login screenshot for selector tuning/debugging. Requires `DEBUG_TOOLS_ENABLED=true`.

## v0.2 updates

- Added selector mapping file: `src/config/selectors.tc.json`
- Added screenshot artifacts on failure (`artifacts/`)
- Added debug endpoint: `POST /api/debug/login-snapshot` (guarded by `DEBUG_TOOLS_ENABLED=true`)
- Added optional selector config override: `SELECTOR_CONFIG_PATH`

## Limitations / next steps

- SmartPLAY selectors and flow can change; keep locators configurable.
- Captcha / OTP / risk checks may require manual intervention.
- Add queueing, retries, and lock-step booking safeguards.
- Add notification channel (Telegram/Discord/webhook) for newly available slots.
- Add persistent storage (SQLite/Postgres) + scheduler.

## Suggested hardening roadmap

1. Add selector map per language (`tc`/`en`) and page version.
2. Add trace/screenshot capture when flow fails.
3. Add cooldown / rate-limiting to avoid excessive traffic.
4. Add idempotency keys to booking calls.
5. Split worker process (monitor) from API process (UI).

## License

MIT

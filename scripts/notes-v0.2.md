# v0.2 selector tuning notes

1. Set `.env`:
   - `HEADLESS=false`
   - `DEBUG_TOOLS_ENABLED=true`
2. Start server and call:
   - `POST /api/debug/login-snapshot`
3. Check screenshots under `artifacts/`.
4. Update `src/config/selectors.tc.json` when SmartPLAY DOM changes.

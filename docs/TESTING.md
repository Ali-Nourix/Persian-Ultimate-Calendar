# Verification

## Automated

```bash
npm ci
npm run check
TZ=Asia/Tehran npm test
TZ=America/Los_Angeles npm test
npm run build
```

Tests cover Nowruz and leap years, Gregorian/Jalali roundtrips, localized digits, invalid dates, timestamp zero, local civil-date behavior, token replacement, all output formats, inclusive bounds, provider normalization, deduplication, retry after network failure, shared requests, forced refresh, stale-data retention, clear-versus-in-flight races and corrupt stored data.

CI runs tests in UTC, Asia/Tehran and America/Los_Angeles and produces installable build artifacts. These are automated checks, not a claim of Obsidian Community Plugin approval.

## Local verification record — 2026-10-10

- TypeScript typecheck, production bundle and formatting checks passed.
- 20 automated tests passed in UTC, Asia/Tehran and America/Los_Angeles.
- `npm audit` reported zero known vulnerabilities at verification time; this is not a security certification.
- A separate Chromium harness using a mocked Obsidian DOM host exercised the actual date-picker module: bounds, initial selection, custom format, double-click, cancel/close, month navigation and separate promises.
- The SVG cover and picker layouts at 700px / 390px were visually inspected. This local harness is not a substitute for native Obsidian testing, and is not part of the CI suite.

## Before release — real Obsidian

Use a disposable Vault and back it up before testing an upgrade. This checklist is **not marked as completed** by automated tests.

- [ ] Install the three build files and enable the plugin on Obsidian 1.5+.
- [ ] Open the calendar from ribbon and command palette; test navigation, Today and Friday placement.
- [ ] Create/reopen daily, monthly and yearly notes; existing content stays unchanged.
- [ ] Test nested note folders, invalid file names and vault write failures.
- [ ] Type static and dynamic expressions; check Reading view and Live Preview behavior.
- [ ] Call the picker from another plugin; confirm every format, range limits and cancellation.
- [ ] Open two pickers, close separately, then disable the plugin while one is open.
- [ ] Receive events, restart offline, refresh, clear, and try a full provider outage.
- [ ] Verify settings are retained from the old flat `data.json`; old localStorage cache is re-fetched.
- [ ] Inspect light/dark themes, narrow sidebars, keyboard navigation and reduced motion.
- [ ] Test on Android and iOS; no native-mobile validation has been performed here.

Holiday data correctness/coverage must be verified separately against authoritative calendars. BaseMax's recurring solar dates are not a substitute for year-specific lunar holidays.

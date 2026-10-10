<div align="center">

# Ultimate Persian Calendar

**A Jalali calendar, live date expressions, and a date-picker API for Obsidian.**

View Persian calendar dates and events, create daily/monthly/yearly notes, render live values inside notes, and let other Obsidian plugins open the local date picker through a TypeScript API.

[فارسی](README.md) · [Features](#features) · [Installation](#installation) · [Date-picker API](#date-picker-api) · [Privacy](#events-cache-and-privacy) · [Development](#development)

[![Obsidian](https://img.shields.io/badge/Obsidian-plugin-6C5CE7?style=for-the-badge&logo=obsidian&logoColor=white)](https://obsidian.md)
[![Version](https://img.shields.io/badge/version-4.2.3-2783DE?style=for-the-badge)](https://github.com/Ali-Nourix/Persian-Ultimate-Calendar)
[![License](https://img.shields.io/badge/License-GPL--3.0-46A171?style=for-the-badge)](LICENSE)
[![Mobile Support](https://img.shields.io/badge/mobile-supported-2EA44F?style=for-the-badge)](https://github.com/Ali-Nourix/Persian-Ultimate-Calendar)

</div>

---

## Overview

Ultimate Persian Calendar is an Obsidian plugin with a Jalali calendar and right-to-left support. Its date picker is a **local plugin API**, not a public HTTP endpoint or cloud service.

## Features

- Jalali calendar with month navigation, today's date and Fridays.
- Daily, monthly and yearly notes with configurable names and folders.
- Events from public data sources, with local caching.
- Offline calendar and date-picker use; previously cached events remain available.
- Live date expressions such as `{#تاریخ}`, `{#ساعت}` and `{#پیشرفت*سال}`.
- Independent controls for static/live expressions and refresh intervals.
- Date-picker API with Jalali, Gregorian, ISO, timestamp, object and custom output formats.
- Date bounds and cancellation support for API consumers.
- Right-to-left text support.

## Installation

### Build from source

Requirements: **Node.js 22** and npm.

```bash
git clone --branch refactor/clean-calendar-api https://github.com/Ali-Nourix/Persian-Ultimate-Calendar.git
cd Persian-Ultimate-Calendar
npm ci
npm run build
```

Copy `main.js`, `manifest.json` and `styles.css` into:

```text
YourVault/.obsidian/plugins/persian-ultimate-calendar/
```

Reload Obsidian, then enable the plugin under **Settings → Community plugins**. Do not assume that a Community Plugins listing or a public release exists; use the current source-build instructions if no packaged release is available.

## Usage

- Open the calendar from its ribbon icon or the Command Palette.
- Select a date to inspect its events.
- Double-click a day or use the daily-note action to open or create its note.
- Use the month and year headings to open monthly and yearly notes.
- In Reading view, live expressions display updated values without rewriting the Markdown file every second.

The exact expression syntax and rendering limitations are documented in [LIVE-EXPRESSIONS.md](docs/LIVE-EXPRESSIONS.md).

## Date-picker API

Other Obsidian plugins can call `api.pickDate()` through the local plugin registry. The API is not a public web endpoint and does not require a cloud service or API key.

```ts
const api = app.plugins?.plugins?.["persian-ultimate-calendar"]?.api;

if (api) {
  const result = await api.pickDate({
    title: "Choose a date",
    initialDate: "1404/01/01",
    minDate: "1404/01/01",
    maxDate: "1404/12/29",
    outputFormat: "iso",
  });

  if (result) console.log(result.iso, result.jalali);
  // Cancel / Escape / close returns null.
}
```

See [API.md](docs/API.md) for the complete TypeScript contract, output formats, bounds and cancellation behavior.

## Events, cache and privacy

- Event data is requested from the public sources documented in the Persian README and cached locally in the plugin's `data.json`.
- When events are enabled, requests go to `hmarzban.github.io` and `basemax.github.io`. Note contents, filenames and vault contents are not sent in those requests; providers may see request metadata such as IP address.
- Event coverage and correctness are not guaranteed. Verify official holidays or religious dates against a trusted calendar when accuracy matters.
- Clearing the cache removes local cached data; a later refresh may download it again.

## Development

```bash
npm ci
npm run dev
npm run check
npm run build
```

Run the manual test checklist in [TESTING.md](docs/TESTING.md) in a test vault before release. Simulated UI tests do not replace testing in Obsidian itself, especially on mobile and across themes.

## Troubleshooting

- **Plugin not visible:** check the plugin folder and all three required files, then reload and enable it.
- **No events shown:** check the events setting, internet connection and cache refresh. Missing data does not necessarily mean there is no event.
- **Live expression appears as code:** switch to Reading view.
- **API unavailable:** ensure the plugin is installed and enabled before checking for `api`.
- **Date picker returns `null`:** the user may have cancelled, the plugin may have been disabled, or the input range may be invalid.

## License

[GNU General Public License v3.0](LICENSE)

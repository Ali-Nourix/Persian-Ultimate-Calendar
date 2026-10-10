# Changelog

## 4.2.1 — 2026-10-10

- Split the supplied monolithic source into API, date utilities, event cache and UI modules.
- Preserve plugin ID, command IDs, note defaults and existing expressions.
- Fix Jalali hyphen input, invalid date rollover, UTC date-only parsing and Jalali formatting tokens.
- Enforce inclusive picker bounds; preselect initial date, resolve close/cancel once and close active pickers on unload.
- Use one conversion/leap-year algorithm via jalaali-js.
- Move event cache into per-Vault plugin data; share provider requests and make failed fetches retryable.
- Make manual refresh bypass cached responses; retain offline data during partial refresh.
- Register UI/API before network warming; stop writing fresh cache when plugin is unloaded.
- Remove generated implementation/fix reports, irrelevant package identity, unconfigured ESLint files and unused CSS.
- Add bilingual-facing documentation, SVG cover, unit tests, pinned dependencies and CI build artifacts.
- Raise minimum Obsidian version to 1.5.0; older 0.15.0 support is not claimed.

### Migration

Old flat settings in plugin `data.json` are retained. Old global localStorage event cache is not imported and will be fetched again when holidays are enabled. No notes are rewritten as part of this cleanup.

This is a modified version of the user-supplied 4.2.0 archive, not a claim that all earlier generated implementation reports were verified.

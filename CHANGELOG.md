# Changelog

## 4.2.3 — 2026-10-10

- Align manifest, package and lockfile versions for a new release tag instead of moving the already-published v4.2.2 tag.
- Carry the current release packaging: main.js, manifest.json, styles.css and a ZIP with exactly those three files at its root.
- No calendar or picker runtime behavior change in this maintenance release.

## 4.2.2 — 2026-10-10

- Make live expressions a primary documented feature, with a dedicated guide and visual.
- Add independent static/dynamic controls and configurable 1/5/30/60-second refresh intervals.
- Extract safe live-expression rendering and cover repeated updates with tests.
- Redesign settings into accessible tabs for live values, notes and events; add filename previews, validation, save/error states and an in-app cache-clear confirmation.
- Render documentation visuals with Vazirmatn and outline text for font-independent GitHub display.
- Add a guarded draft-release workflow template, version/tag validator and activation guide; workflows are prepared but not active under the current connection permissions.
- Expand API documentation and add a typechecked example consuming plugin.

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
- Add bilingual-facing documentation, SVG cover, unit tests, pinned dependencies and a CI template for build artifacts (not yet activated).
- Raise minimum Obsidian version to 1.5.0; older 0.15.0 support is not claimed.

### Migration

Old flat settings in plugin `data.json` are retained. Old global localStorage event cache is not imported and will be fetched again when holidays are enabled. No notes are rewritten as part of this cleanup.

This is a modified version of the user-supplied 4.2.0 archive, not a claim that all earlier generated implementation reports were verified.

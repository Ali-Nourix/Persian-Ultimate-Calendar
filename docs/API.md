# Date-picker API

Public entry point: `app.plugins.plugins["persian-ultimate-calendar"].api.pickDate(options)`.

The Obsidian plugin registry is internal, not a stable official API. Guard access and missing/disabled plugins. Import or copy the standalone contracts from `src/api.ts`; do not import the plugin's bundled `main.js` into another plugin.

## Contract

```ts
pickDate(options?: PickDateOptions): Promise<PickedDateResult | null>
```

| Option                | Default        | Behavior                                            |
| --------------------- | -------------- | --------------------------------------------------- |
| `title`               | `انتخاب تاریخ` | Modal title                                         |
| `initialDate`         | Today          | Preselected date; invalid input falls back to today |
| `outputFormat`        | `object`       | Format of `result.value`                            |
| `format`              | `YYYY-MM-DD`   | Used only for `moment-format`                       |
| `calendar`            | `jalali`       | Result metadata; grid is always Jalali              |
| `minDate` / `maxDate` | None           | Inclusive bounds, parsed like `initialDate`         |
| `enforceRange`        | `true`         | Set `false` to ignore both bounds                   |

If the initial date is outside the range, the initial selection moves to a valid bound. Invalid or reversed enforced bounds return `null` through the public method and log a warning. Disabled days cannot be selected by click, double-click or the Today action.

## Inputs

- ISO **date-only**: `2025-03-21` → Gregorian civil date, parsed in local time without a UTC day shift.
- Jalali: `1404/01/01` or `1404-01-01`; Persian/Arabic digits also supported.
- A slash-delimited string is interpreted as Jalali. For hyphen-delimited strings, years below `1700` are interpreted as Jalali, years `1700` and above as Gregorian. Use `/` to disambiguate a later Jalali year.
- `Date` or milliseconds since Unix epoch, including `0`; local calendar day is used.
- ISO datetime strings are not accepted; pass `new Date(isoDatetime)` instead.
- Invalid calendar dates do not roll over. Jalali supported years: `1` through `3177`, subject to the string disambiguation above.

## Result

Every successful result includes:

```ts
{
  value: /* depends on outputFormat */,
  iso: "2025-03-21",
  timestamp: /* local midnight in milliseconds */,
  gregorian: { year: 2025, month: 3, day: 21 },
  jalali: { year: 1404, month: 1, day: 1 },
  calendar: "jalali",
  outputFormat: "object"
}
```

| `outputFormat`  | `value`                                                    |
| --------------- | ---------------------------------------------------------- |
| `iso`           | `"2025-03-21"`; a civil date, **not** a full ISO timestamp |
| `timestamp`     | Number, local midnight in milliseconds; timezone-dependent |
| `gregorian`     | `{year, month, day}` with Gregorian values                 |
| `jalali`        | `{year, month, day}` with Jalali values                    |
| `object`        | `{iso, timestamp, gregorian, jalali}`                      |
| `moment-format` | Custom string using the supported subset below             |

The name `moment-format` is retained for compatibility; Moment.js is not used. Supported tokens only: `YYYY`, `YY`, `MM`, `M`, `DD`, `D`, `jYYYY`, `jYY`, `jMM`, `jM`, `jDD`, `jD`. Use `[literal text]` for literal characters that contain token letters.

```ts
const date = await api.pickDate({
  initialDate: "۱۴۰۴/۰۱/۰۱",
  outputFormat: "moment-format",
  format: "jYYYY/jMM/jDD [→] YYYY-MM-DD",
});
// Confirm initial selection → date.value === "1404/01/01 → 2025-03-21"
```

## Lifecycle

- Click a day, then Select; double-click confirms immediately.
- Initial date is preselected, so Select can confirm it directly.
- Cancel, Escape or closing the modal resolves `null` exactly once.
- Disabling/unloading the plugin closes its active pickers and resolves them with `null`.
- Separate calls own separate modal promises; no shared resolver.
- The public method catches configuration/UI errors and resolves `null`; it does not intentionally reject.
- Picker/date conversion works offline; it does not request holiday data.

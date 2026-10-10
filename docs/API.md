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

## Complete consuming-plugin example

A typechecked, minimal consumer is available at [`examples/picker-consumer.ts`](examples/picker-consumer.ts). It adds an Obsidian editor command, guards a missing/disabled provider, opens the picker, inserts `jYYYY/jMM/jDD`, treats cancellation as normal, and avoids inserting into a different note if the active editor changes while the modal is open.

The example's type import is relative to this repository. In a separate plugin, copy the public type declarations into a local `calendar-api.d.ts` and change the import to that file. No runtime npm dependency on this calendar plugin is required; both Obsidian plugins must be installed and the calendar provider enabled.

### Access adapter

```ts
import type { CalendarPluginApi } from "./calendar-api";

function getCalendarApi(app: unknown): CalendarPluginApi | undefined {
  const host = app as {
    plugins?: { plugins?: Record<string, { api?: CalendarPluginApi }> };
  };
  return host?.plugins?.plugins?.["persian-ultimate-calendar"]?.api;
}

const api = getCalendarApi(app);
if (!api || typeof api.pickDate !== "function") {
  // Ask the user to install/enable the provider; do not call an absent API.
  return;
}
```

### Common requests

```ts
// An ISO civil date for frontmatter or a due-date field.
const iso = await api.pickDate({ outputFormat: "iso" });
if (iso) console.log(iso.value); // e.g. "2025-03-21"

// Structured Jalali parts, plus Gregorian metadata.
const jalali = await api.pickDate({ outputFormat: "jalali" });
if (jalali) console.log(jalali.jalali, jalali.gregorian);

// Structured Gregorian parts; the interactive grid remains Jalali.
const gregorian = await api.pickDate({ outputFormat: "gregorian" });
if (gregorian) console.log(gregorian.gregorian);

// Inclusive allowed range, independent of the output format.
const deadline = await api.pickDate({
  title: "انتخاب موعد",
  initialDate: "1404/01/01",
  minDate: "1404/01/01",
  maxDate: "1404/12/29",
  outputFormat: "moment-format",
  format: "jYYYY/jMM/jDD",
});
if (deadline && typeof deadline.value === "string") {
  console.log(deadline.value);
}
```

For JavaScript callers, omit the type imports and use the same guarded access pattern.

## Standalone public type declarations

Copy the following into the consumer's `calendar-api.d.ts`:

```ts
export type CalendarSystem = "gregorian" | "jalali";
export type OutputFormat =
  | "iso"
  | "timestamp"
  | "gregorian"
  | "jalali"
  | "object"
  | "moment-format";
export type DateInput = string | number | Date;
export interface DateParts {
  year: number;
  month: number;
  day: number;
}
export interface DateDetails {
  iso: string;
  timestamp: number;
  gregorian: DateParts;
  jalali: DateParts;
}
export interface PickDateOptions {
  calendar?: CalendarSystem;
  outputFormat?: OutputFormat;
  format?: string;
  title?: string;
  initialDate?: DateInput;
  minDate?: DateInput;
  maxDate?: DateInput;
  enforceRange?: boolean;
}
export interface PickedDateResult extends DateDetails {
  value: string | number | DateParts | DateDetails;
  calendar: CalendarSystem;
  outputFormat: OutputFormat;
}
export interface CalendarPluginApi {
  pickDate(options?: PickDateOptions): Promise<PickedDateResult | null>;
}
```

## Error and compatibility checklist

- Access the provider at command execution time, not only once during the consumer's startup; the user may enable/disable it later.
- `null` does not distinguish cancellation from an invalid configuration; validate your own range/input and treat `null` as "do not change the note".
- Prefer `result.iso`, `result.jalali` or `result.gregorian` when you need one specific representation; `value` is a union based on the requested format.
- Prefer ISO civil dates for persisted all-day values. A midnight timestamp changes with timezone and is not a timezone-independent date identifier.
- This API does not create notes, write frontmatter or return a holidays REST endpoint. Consumers own those actions.
- Public type declarations are the contract; the plugin registry used to discover the provider remains an internal Obsidian detail and may require adaptation after host updates.

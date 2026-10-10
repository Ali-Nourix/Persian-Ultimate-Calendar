import { dateKey, formatDate, j2g, parseDate } from "./dates";
export type CalendarSystem = "gregorian" | "jalali";
export type OutputFormat =
  | "iso"
  | "timestamp"
  | "gregorian"
  | "jalali"
  | "object"
  | "moment-format";
export type DateInput = string | number | Date;
export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}
export interface DateParts {
  year: number;
  month: number;
  day: number;
}
export interface PickDateOptions {
  /** Result metadata only. The picker always displays a Jalali grid. */
  calendar?: CalendarSystem;
  outputFormat?: OutputFormat;
  format?: string;
  title?: string;
  initialDate?: DateInput;
  minDate?: DateInput;
  maxDate?: DateInput;
  /** Set false to ignore bounds. Defaults to true. */
  enforceRange?: boolean;
}
export interface DateDetails {
  iso: string;
  timestamp: number;
  gregorian: DateParts;
  jalali: DateParts;
}
export interface PickedDateResult extends DateDetails {
  value: string | number | DateParts | DateDetails;
  calendar: CalendarSystem;
  outputFormat: OutputFormat;
}
export interface CalendarPluginApi {
  pickDate(options?: PickDateOptions): Promise<PickedDateResult | null>;
}
export function dateBounds(options: PickDateOptions) {
  if (options.enforceRange === false) return { min: null, max: null };
  const min = parseDate(options.minDate),
    max = parseDate(options.maxDate);
  if (
    (options.minDate !== undefined && !min) ||
    (options.maxDate !== undefined && !max)
  )
    throw new Error("Invalid date bound");
  if (min && max && dateKey(min) > dateKey(max))
    throw new Error("minDate must not exceed maxDate");
  return { min, max };
}
export function isWithinBounds(
  date: JalaliDate,
  bounds: ReturnType<typeof dateBounds>,
): boolean {
  const key = dateKey(date);
  return (
    (!bounds.min || key >= dateKey(bounds.min)) &&
    (!bounds.max || key <= dateKey(bounds.max))
  );
}
export function buildResult(
  date: JalaliDate,
  options: PickDateOptions = {},
): PickedDateResult {
  const g = j2g(date.jy, date.jm, date.jd);
  const details: DateDetails = {
    iso: formatDate(g, date, "YYYY-MM-DD"),
    timestamp: g.getTime(),
    gregorian: {
      year: g.getFullYear(),
      month: g.getMonth() + 1,
      day: g.getDate(),
    },
    jalali: { year: date.jy, month: date.jm, day: date.jd },
  };
  const outputFormat = options.outputFormat ?? "object";
  const values = {
    iso: details.iso,
    timestamp: details.timestamp,
    gregorian: details.gregorian,
    jalali: details.jalali,
    object: details,
    "moment-format": formatDate(g, date, options.format ?? "YYYY-MM-DD"),
  };
  return {
    ...details,
    value: values[outputFormat],
    calendar: options.calendar ?? "jalali",
    outputFormat,
  };
}

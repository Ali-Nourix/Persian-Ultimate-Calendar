import { todayJalali } from "./dates";
export interface PersianCalendarSettings {
  noteFolder: string;
  noteNameFormat: string;
  monthNoteFormat: string;
  yearNoteFormat: string;
  showHolidays: boolean;
  staticExpressions: boolean;
  dynamicExpressions: boolean;
  dynamicUpdateInterval: number;
}
export const UPDATE_INTERVALS = [1000, 5000, 30000, 60000] as const;
export const DEFAULT_SETTINGS: PersianCalendarSettings = {
  noteFolder: "Journal",
  noteNameFormat: "YYYY-MM-DD",
  monthNoteFormat: "YYYY-MM",
  yearNoteFormat: "YYYY",
  showHolidays: true,
  staticExpressions: true,
  dynamicExpressions: true,
  dynamicUpdateInterval: 1000,
};
export function validNoteFolder(value: string): boolean {
  const path = value.trim().replace(/\\/g, "/");
  return (
    !!path &&
    !path.startsWith("/") &&
    !path
      .split("/")
      .some((part) => part === ".." || part === "." || part.startsWith(".")) &&
    !/[\x00-\x1f:*?"<>|]/.test(path)
  );
}
export function validNoteFormat(value: string): boolean {
  return (
    !!value.trim() &&
    !/[\x00-\x1f/\\:*?"<>|]/.test(value) &&
    value.trim() !== "." &&
    value.trim() !== ".."
  );
}
export function noteNamePreview(format: string, date = todayJalali()): string {
  return (
    format.replace(/YYYY|MM|DD/g, (token) =>
      token === "YYYY"
        ? String(date.jy)
        : String(token === "MM" ? date.jm : date.jd).padStart(2, "0"),
    ) + ".md"
  );
}
export function readSettings(input: unknown): PersianCalendarSettings {
  const settings = { ...DEFAULT_SETTINGS };
  if (!input || typeof input !== "object") return settings;
  const value = input as Record<string, unknown>;
  for (const key of [
    "noteFolder",
    "noteNameFormat",
    "monthNoteFormat",
    "yearNoteFormat",
  ] as const) {
    const text = value[key];
    if (
      typeof text === "string" &&
      (key === "noteFolder" ? validNoteFolder(text) : validNoteFormat(text))
    )
      settings[key] = text.trim();
  }
  for (const key of [
    "showHolidays",
    "staticExpressions",
    "dynamicExpressions",
  ] as const) {
    if (typeof value[key] === "boolean") settings[key] = value[key];
  }
  if (
    UPDATE_INTERVALS.some(
      (interval) => interval === value.dynamicUpdateInterval,
    )
  )
    settings.dynamicUpdateInterval = value.dynamicUpdateInterval as number;
  return settings;
}

export interface PersianCalendarSettings {
  noteFolder: string;
  noteNameFormat: string;
  monthNoteFormat: string;
  yearNoteFormat: string;
  showHolidays: boolean;
}

export const DEFAULT_SETTINGS: PersianCalendarSettings = {
  noteFolder: "Journal",
  noteNameFormat: "YYYY-MM-DD",
  monthNoteFormat: "YYYY-MM",
  yearNoteFormat: "YYYY",
  showHolidays: true,
};

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
    if (typeof value[key] === "string" && value[key].trim())
      settings[key] = value[key];
  }
  if (typeof value.showHolidays === "boolean")
    settings.showHolidays = value.showHolidays;
  return settings;
}

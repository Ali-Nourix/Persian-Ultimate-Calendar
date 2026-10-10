import { getDaysInJalaliMonth, normalizeDigits } from "./dates";
import { PERSIAN_MONTHS } from "./constants";
export interface CalendarEvent {
  title: string;
  isHoliday: boolean;
  isReligious: boolean;
}
export type DayEvents = Record<number, CalendarEvent[]>;
export interface CacheSnapshot {
  months: Record<string, DayEvents>;
  expires: string;
}
export const PIPE2TIME_URL = "https://hmarzban.github.io/pipe2time.ir/api";
export const BASEMAX_URL =
  "https://basemax.github.io/persian-holidays-api/holidays.json";
type FetchJson = (url: string) => Promise<unknown>;
function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function add(
  events: DayEvents,
  day: number,
  title: unknown,
  holiday: unknown,
  maxDay: number,
) {
  if (
    typeof title !== "string" ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > maxDay
  )
    return;
  const text = normalizeDigits(title)
    .replace(new RegExp(`^\\s*${day}\\s+`), "")
    .trim();
  if (!text) return;
  const entries = (events[day] ??= []);
  const existing = entries.find((e) => e.title === text);
  if (existing) existing.isHoliday ||= holiday === true;
  else
    entries.push({
      title: text,
      isHoliday: holiday === true,
      isReligious: false,
    });
}
export function normalizePipeEvents(
  data: unknown,
  year: number,
  month: number,
): DayEvents {
  if (!Array.isArray(data)) throw new Error("Invalid pipe2time response");
  const result: DayEvents = {};
  for (const raw of data) {
    const item = record(raw);
    if (!item || typeof item.jDate !== "string") continue;
    const parts = normalizeDigits(item.jDate).split(/[/-]/).map(Number);
    if (parts.length === 3 && parts[0] === year && parts[1] === month)
      add(
        result,
        parts[2],
        item.text,
        item.isHoliday,
        getDaysInJalaliMonth(year, month),
      );
  }
  return result;
}
export function normalizeBaseEvents(
  data: unknown,
  year: number,
  month: number,
): DayEvents {
  if (!Array.isArray(data)) throw new Error("Invalid BaseMax response");
  const result: DayEvents = {};
  for (const raw of data) {
    const item = record(raw),
      date = record(item?.date);
    if (!item || !date || date.type !== "shamsi" || !Array.isArray(date.date))
      continue;
    if (String(date.date[1]).trim() === PERSIAN_MONTHS[month - 1])
      add(
        result,
        Number(normalizeDigits(String(date.date[0]))),
        item.event_name,
        item.is_holiday,
        getDaysInJalaliMonth(year, month),
      );
  }
  return result;
}
export function mergeEvents(target: DayEvents, source: DayEvents): void {
  for (const [day, events] of Object.entries(source))
    for (const event of events)
      add(target, Number(day), event.title, event.isHoliday, 31);
}
export function readSnapshot(input: unknown): CacheSnapshot {
  const value = record(input),
    rawMonths = record(value?.months);
  const months: Record<string, DayEvents> = {};
  for (const [key, raw] of Object.entries(rawMonths ?? {})) {
    if (!/^\d{1,4}-(?:[1-9]|1[012])$/.test(key)) continue;
    const [year, month] = key.split("-").map(Number);
    if (year < 1 || year > 3177) continue;
    const days = record(raw);
    if (!days) continue;
    const result: DayEvents = {};
    for (const [day, events] of Object.entries(days)) {
      if (!Array.isArray(events)) continue;
      for (const rawEvent of events) {
        const e = record(rawEvent);
        if (e)
          add(
            result,
            Number(day),
            e.title,
            e.isHoliday,
            getDaysInJalaliMonth(year, month),
          );
      }
    }
    months[key] = result;
  }
  return {
    months,
    expires: typeof value?.expires === "string" ? value.expires : "",
  };
}
export class EventStore {
  snapshot: CacheSnapshot = { months: {}, expires: "" };
  private responses = new Map<string, Promise<unknown>>();
  private pending = new Map<string, Promise<boolean>>();
  private generation = 0;
  constructor(
    private fetchJson: FetchJson,
    private persist: (snapshot: CacheSnapshot) => Promise<void>,
  ) {}
  restore(input: unknown) {
    this.snapshot = readSnapshot(input);
  }
  get(year: number, month: number): DayEvents {
    return this.snapshot.months[`${year}-${month}`] ?? {};
  }
  private json(url: string): Promise<unknown> {
    const cached = this.responses.get(url);
    if (cached) return cached;
    const request = this.fetchJson(url).catch((error) => {
      this.responses.delete(url);
      throw error;
    });
    this.responses.set(url, request);
    return request;
  }
  async fetch(year: number, month: number): Promise<boolean> {
    const key = `${year}-${month}`;
    if (this.snapshot.months[key]) return true;
    const existing = this.pending.get(key);
    if (existing) return existing;
    const generation = this.generation;
    const task = (async () => {
      const merged: DayEvents = {};
      let successes = 0;
      const providers = [
        async () =>
          normalizePipeEvents(
            await this.json(`${PIPE2TIME_URL}/${year}/events.json`),
            year,
            month,
          ),
        async () =>
          normalizeBaseEvents(await this.json(BASEMAX_URL), year, month),
      ];
      await Promise.all(
        providers.map(async (provider) => {
          try {
            mergeEvents(merged, await provider());
            successes++;
          } catch {
            /* Provider failures remain retryable. */
          }
        }),
      );
      if (generation !== this.generation || successes === 0) return false;
      this.snapshot.months[key] = merged;
      await this.persist(this.snapshot);
      return true;
    })();
    this.pending.set(key, task);
    try {
      return await task;
    } finally {
      if (this.pending.get(key) === task) this.pending.delete(key);
    }
  }
  expired(): boolean {
    const expiry = Date.parse(this.snapshot.expires);
    return !Number.isFinite(expiry) || Date.now() >= expiry;
  }
  async refresh(
    year: number,
    month: number,
    shouldContinue: () => boolean = () => true,
  ): Promise<boolean> {
    const generation = ++this.generation;
    this.responses.clear();
    this.pending.clear();
    const stale = this.snapshot.months;
    this.snapshot = { months: {}, expires: "" };
    let complete = true;
    for (let offset = -12; offset <= 24; offset += 5) {
      if (!shouldContinue()) {
        complete = false;
        break;
      }
      if (generation !== this.generation) return false;
      const batch = Array.from({ length: Math.min(5, 25 - offset) }, (_, i) => {
        const index = year * 12 + month - 1 + offset + i;
        return {
          year: Math.floor(index / 12),
          month: (((index % 12) + 12) % 12) + 1,
        };
      });
      const results = await Promise.all(
        batch.map((d) => this.fetch(d.year, d.month)),
      );
      complete &&= results.every(Boolean);
    }
    if (generation !== this.generation) return false;
    // Preserve offline data, but never mark a partial refresh as fresh for a year.
    this.snapshot.months = { ...stale, ...this.snapshot.months };
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    this.snapshot.expires = complete ? expiry.toISOString() : "";
    await this.persist(this.snapshot);
    return complete;
  }
  async clear(): Promise<void> {
    this.generation++;
    this.pending.clear();
    this.responses.clear();
    this.snapshot = { months: {}, expires: "" };
    await this.persist(this.snapshot);
  }
}

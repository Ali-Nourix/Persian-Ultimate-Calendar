import {
  toJalaali,
  toGregorian,
  isValidJalaaliDate,
  isLeapJalaaliYear,
  jalaaliMonthLength,
} from "jalaali-js";
import type { DateInput, JalaliDate } from "./api";

export function g2j(gy: number, gm: number, gd: number): JalaliDate {
  return toJalaali(gy, gm, gd);
}
export function j2g(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  const date = new Date(0);
  date.setFullYear(gy, gm - 1, gd);
  date.setHours(0, 0, 0, 0);
  return date;
}
export const isJalaliLeap = isLeapJalaaliYear;
export const getDaysInJalaliMonth = jalaaliMonthLength;
export function getDayOfYear(_jy: number, jm: number, jd: number): number {
  return jm <= 6 ? (jm - 1) * 31 + jd : 186 + (jm - 7) * 30 + jd;
}
export function getDaysInJalaliYear(jy: number): number {
  return isJalaliLeap(jy) ? 366 : 365;
}
export function g2h(gy: number, gm: number, gd: number) {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(gy, gm - 1, gd));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { hy: part("year"), hm: part("month"), hd: part("day") };
}
export function normalizeDigits(text: string): string {
  return text
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
}
// ISO date-only values are civil dates, not UTC instants.
export function parseDate(input: DateInput | undefined): JalaliDate | null {
  if (input === undefined) return null;
  if (typeof input === "string") {
    const text = normalizeDigits(input.trim());
    const match = /^(\d{4})([/-])(\d{1,2})\2(\d{1,2})$/.exec(text);
    if (match) {
      const [, year, separator, month, day] = match;
      const y = Number(year),
        m = Number(month),
        d = Number(day);
      if (separator === "/" || y < 1700) {
        return y >= 1 && y <= 3177 && isValidJalaaliDate(y, m, d)
          ? { jy: y, jm: m, jd: d }
          : null;
      }
      const date = new Date(y, m - 1, d);
      if (
        date.getFullYear() !== y ||
        date.getMonth() !== m - 1 ||
        date.getDate() !== d
      )
        return null;
      try {
        return g2j(y, m, d);
      } catch {
        return null;
      }
    }
    // Only date-only ISO strings are accepted; use Date for instants.
    return null;
  }
  const date = input instanceof Date ? input : new Date(input);
  if (!Number.isFinite(date.getTime())) return null;
  try {
    const result = g2j(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return result.jy >= 1 && result.jy <= 3177 ? result : null;
  } catch {
    return null;
  }
}
export function todayJalali(): JalaliDate {
  const now = new Date();
  return g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
export function dateKey(date: JalaliDate): number {
  return date.jy * 10000 + date.jm * 100 + date.jd;
}
export function formatDate(g: Date, j: JalaliDate, format: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const tokens: Record<string, string> = {
    YYYY: String(g.getFullYear()),
    YY: String(g.getFullYear()).slice(-2),
    MM: pad(g.getMonth() + 1),
    M: String(g.getMonth() + 1),
    DD: pad(g.getDate()),
    D: String(g.getDate()),
    jYYYY: String(j.jy),
    jYY: String(j.jy).slice(-2),
    jMM: pad(j.jm),
    jM: String(j.jm),
    jDD: pad(j.jd),
    jD: String(j.jd),
  };
  return format.replace(
    /\[[^\]]*\]|jYYYY|jYY|jMM|jM|jDD|jD|YYYY|YY|MM|M|DD|D/g,
    (token) => (token.startsWith("[") ? token.slice(1, -1) : tokens[token]),
  );
}

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  g2j,
  j2g,
  parseDate,
  formatDate,
  getDaysInJalaliMonth,
  g2h,
} from "../src/dates";
import { buildResult, dateBounds, isWithinBounds } from "../src/api";
test("Nowruz and leap-year boundaries use the same algorithm", () => {
  assert.deepEqual(g2j(2025, 3, 21), { jy: 1404, jm: 1, jd: 1 });
  assert.deepEqual(g2j(2024, 3, 20), { jy: 1403, jm: 1, jd: 1 });
  assert.equal(getDaysInJalaliMonth(1403, 12), 30);
  assert.equal(getDaysInJalaliMonth(1404, 12), 29);
});
test("Gregorian/Jalali roundtrip over 2010–2040", () => {
  for (let y = 2010; y <= 2040; y++)
    for (let m = 1; m <= 12; m++)
      for (const d of [1, 15, 28]) {
        const j = g2j(y, m, d),
          g = j2g(j.jy, j.jm, j.jd);
        assert.deepEqual(
          [g.getFullYear(), g.getMonth() + 1, g.getDate()],
          [y, m, d],
        );
      }
});
test("date parser accepts Persian/Arabic digits and both Jalali separators", () => {
  for (const value of [
    "1404/01/01",
    "1404-01-01",
    "۱۴۰۴/۰۱/۰۱",
    "١٤٠٤/٠١/٠١",
    "2025-03-21",
  ])
    assert.deepEqual(parseDate(value), { jy: 1404, jm: 1, jd: 1 });
});
test("invalid input never silently rolls over", () => {
  for (const value of [
    "2025-02-30",
    "1404/12/30",
    "1404/13/1",
    "1404/0/1",
    "1404/1/0",
    "2025-03-21junk",
    "nonsense",
    new Date(NaN),
    NaN,
    Infinity,
  ])
    assert.equal(parseDate(value), null);
  assert.ok(parseDate(0));
});
test("ISO civil dates do not shift with timezone", () => {
  const j = parseDate("2025-03-21")!;
  assert.equal(buildResult(j, { outputFormat: "iso" }).value, "2025-03-21");
});
test("formatting replaces longer Jalali tokens first and supports literals", () => {
  const j = { jy: 1404, jm: 1, jd: 1 },
    g = j2g(1404, 1, 1);
  assert.equal(
    formatDate(g, j, "jYYYY/jMM/jDD [→] YYYY-MM-DD"),
    "1404/01/01 → 2025-03-21",
  );
  assert.equal(formatDate(g, j, "[YYYY] jYY-jM-jD"), "YYYY 04-1-1");
});
test("every output format is available with complete metadata", () => {
  const j = { jy: 1404, jm: 1, jd: 1 };
  for (const outputFormat of [
    "iso",
    "timestamp",
    "gregorian",
    "jalali",
    "object",
    "moment-format",
  ] as const) {
    const result = buildResult(j, { outputFormat, format: "jYYYY/jMM/jDD" });
    assert.equal(result.iso, "2025-03-21");
    assert.equal(result.jalali.year, 1404);
    assert.equal(result.timestamp, j2g(1404, 1, 1).getTime());
    assert.ok(result.value);
  }
});
test("bounds are inclusive and invalid/reversed bounds are rejected", () => {
  const options = { minDate: "1404/01/02", maxDate: "1404/01/04" },
    bounds = dateBounds(options);
  assert.equal(isWithinBounds({ jy: 1404, jm: 1, jd: 1 }, bounds), false);
  assert.equal(isWithinBounds({ jy: 1404, jm: 1, jd: 2 }, bounds), true);
  assert.equal(isWithinBounds({ jy: 1404, jm: 1, jd: 4 }, bounds), true);
  assert.equal(isWithinBounds({ jy: 1404, jm: 1, jd: 5 }, bounds), false);
  assert.throws(() => dateBounds({ minDate: "bad" }));
  assert.throws(() => dateBounds({ minDate: "1404/2/1", maxDate: "1404/1/1" }));
  assert.equal(
    isWithinBounds(
      { jy: 1404, jm: 1, jd: 1 },
      dateBounds({ ...options, enforceRange: false }),
    ),
    true,
  );
});
test("Hijri conversion uses named parts", () => {
  const h = g2h(2025, 3, 21);
  assert.ok(h.hy > 1400);
  assert.ok(h.hm >= 1 && h.hm <= 12);
  assert.ok(h.hd >= 1 && h.hd <= 30);
});

import { readSettings, DEFAULT_SETTINGS } from "../src/settings";
test("settings migration retains valid fields but ignores corrupt values", () => {
  assert.deepEqual(readSettings(null), DEFAULT_SETTINGS);
  assert.equal(
    readSettings({ noteFolder: "OldJournal", showHolidays: false }).noteFolder,
    "OldJournal",
  );
  assert.equal(
    readSettings({ noteFolder: 13, showHolidays: "false" }).showHolidays,
    true,
  );
});

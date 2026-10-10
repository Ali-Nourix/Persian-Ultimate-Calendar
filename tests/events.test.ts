import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EventStore,
  mergeEvents,
  normalizePipeEvents,
  normalizeBaseEvents,
  readSnapshot,
} from "../src/events";
test("provider normalization filters dates and malformed records", () => {
  const data = [
    { jDate: "۱۴۰۴/۰۱/۰۱", text: "1 نوروز", isHoliday: true },
    { jDate: "1404/2/1", text: "other" },
    { jDate: "1404/1/99", text: "invalid" },
    null,
  ];
  assert.deepEqual(normalizePipeEvents(data, 1404, 1)[1], [
    { title: "نوروز", isHoliday: true, isReligious: false },
  ]);
  assert.deepEqual(
    normalizeBaseEvents(
      [
        {
          date: { type: "shamsi", date: ["۱", "فروردین"] },
          event_name: "نوروز",
          is_holiday: true,
        },
      ],
      1404,
      1,
    )[1][0].title,
    "نوروز",
  );
  assert.throws(() => normalizePipeEvents({}, 1404, 1));
});
test("deduplication retains holiday flags", () => {
  const target = {
    1: [{ title: "نوروز", isHoliday: false, isReligious: false }],
  };
  mergeEvents(target, {
    1: [{ title: "نوروز", isHoliday: true, isReligious: false }],
  });
  assert.equal(target[1].length, 1);
  assert.equal(target[1][0].isHoliday, true);
});
test("failed fetch is retryable and not cached as an empty month", async () => {
  let fail = true;
  const store = new EventStore(
    async () => {
      if (fail) throw new Error("offline");
      return [];
    },
    async () => {},
  );
  assert.equal(await store.fetch(1404, 1), false);
  assert.equal(Object.keys(store.snapshot.months).length, 0);
  fail = false;
  assert.equal(await store.fetch(1404, 1), true);
});
test("concurrent months share annual provider requests", async () => {
  let requests = 0;
  const store = new EventStore(
    async () => {
      requests++;
      await new Promise((r) => setTimeout(r, 5));
      return [];
    },
    async () => {},
  );
  await Promise.all([
    store.fetch(1404, 1),
    store.fetch(1404, 1),
    store.fetch(1404, 2),
  ]);
  assert.equal(requests, 2);
});
test("manual refresh bypasses response cache and visits 37 months", async () => {
  let requests = 0;
  const store = new EventStore(
    async () => {
      requests++;
      return [];
    },
    async () => {},
  );
  assert.equal(await store.refresh(1404, 1), true);
  assert.equal(Object.keys(store.snapshot.months).length, 37);
  assert.equal(store.expired(), false);
  const previous = requests;
  await store.refresh(1404, 1);
  assert.ok(requests > previous);
});
test("partial refresh preserves offline data without year-long expiry", async () => {
  const store = new EventStore(
    async () => {
      throw new Error("offline");
    },
    async () => {},
  );
  store.restore({
    months: {
      "1404-1": {
        1: [{ title: "نوروز", isHoliday: true, isReligious: false }],
      },
    },
    expires: "bad",
  });
  assert.equal(await store.refresh(1404, 1), false);
  assert.equal(store.get(1404, 1)[1][0].title, "نوروز");
  assert.equal(store.expired(), true);
});
test("clear removes cached responses and in-flight writes", async () => {
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  const store = new EventStore(
    async () => {
      await barrier;
      return [];
    },
    async () => {},
  );
  const pending = store.fetch(1404, 1);
  await store.clear();
  release();
  assert.equal(await pending, false);
  assert.deepEqual(store.snapshot.months, {});
});
test("corrupt persisted snapshots are sanitized", () => {
  assert.deepEqual(readSnapshot(null), { months: {}, expires: "" });
  assert.deepEqual(
    readSnapshot({
      months: {
        invalid: [],
        "9999-1": {},
        "1404-1": {
          99: [{ title: "bad" }],
          1: [null, { title: "ok", isHoliday: true }],
        },
      },
    }).months,
    { "1404-1": { 1: [{ title: "ok", isHoliday: true, isReligious: false }] } },
  );
});

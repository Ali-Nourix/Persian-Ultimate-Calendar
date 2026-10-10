import assert from "node:assert/strict";
import { test } from "node:test";
import {
  expressionReplacement,
  refreshLiveExpressions,
} from "../src/live-expressions";
import {
  readSettings,
  DEFAULT_SETTINGS,
  validNoteFolder,
  validNoteFormat,
  noteNamePreview,
} from "../src/settings";
import { validateRelease } from "../scripts/validate-release.mjs";

test("dynamic expressions store a stable key while static expressions store a fixed value", () => {
  assert.equal(
    expressionReplacement("ساعت", true, "۱۲:۳۰:۰۰"),
    '<span class="persian-dynamic-tag" data-key="ساعت">۱۲:۳۰:۰۰</span>',
  );
  assert.equal(expressionReplacement("ساعت", false, "۱۲:۳۰:۰۰"), "۱۲:۳۰:۰۰");
  assert.equal(expressionReplacement("تست", true, null), null);
});
test("dynamic expression HTML escapes keys and values", () => {
  assert.equal(
    expressionReplacement('x"<>', true, '<img> & "value"'),
    '<span class="persian-dynamic-tag" data-key="x&quot;&lt;&gt;">&lt;img&gt; &amp; &quot;value&quot;</span>',
  );
});
test("rendered values change repeatedly without any file write", () => {
  const clock = { dataset: { key: "ساعت" }, textContent: "۱۲:۳۰:۰۰" };
  const unknown = { dataset: { key: "تست" }, textContent: "unchanged" };
  const root = {
    querySelectorAll: (selector: string) => {
      assert.equal(selector, "span.persian-dynamic-tag");
      return [clock, unknown];
    },
  } as unknown as ParentNode;
  let time = "۱۲:۳۰:۰۱";
  const calculate = (key: string) => (key === "ساعت" ? time : null);
  assert.equal(refreshLiveExpressions(root, calculate), 1);
  assert.equal(clock.textContent, "۱۲:۳۰:۰۱");
  assert.equal(refreshLiveExpressions(root, calculate), 0);
  time = "۱۲:۳۰:۰۲";
  assert.equal(refreshLiveExpressions(root, calculate), 1);
  assert.equal(unknown.textContent, "unchanged");
});
test("live controls migrate to defaults and validate refresh intervals", () => {
  assert.equal(readSettings({ showHolidays: false }).dynamicExpressions, true);
  assert.equal(
    readSettings({
      dynamicExpressions: false,
      staticExpressions: false,
      dynamicUpdateInterval: 5000,
    }).dynamicUpdateInterval,
    5000,
  );
  assert.equal(
    readSettings({ dynamicUpdateInterval: 12 }).dynamicUpdateInterval,
    DEFAULT_SETTINGS.dynamicUpdateInterval,
  );
});
test("note paths and previews match supported note filename tokens", () => {
  assert.equal(validNoteFolder("Notes/Journal"), true);
  for (const folder of [
    "",
    "../Secret",
    "/Absolute",
    ".obsidian",
    "Notes/../Other",
    "C:\\Vault",
  ])
    assert.equal(validNoteFolder(folder), false);
  for (const format of ["", "path/YYYY", "YYYY:MM", ".."])
    assert.equal(validNoteFormat(format), false);
  assert.equal(
    noteNamePreview("YYYY-MM-DD", { jy: 1404, jm: 1, jd: 2 }),
    "1404-01-02.md",
  );
  assert.equal(
    noteNamePreview("MyNote-YYYY", { jy: 1404, jm: 1, jd: 2 }),
    "MyNote-1404.md",
  );
});
test("release guard accepts matching versions and rejects unsafe or mismatched tags", () => {
  const manifest = {
    id: "persian-ultimate-calendar",
    version: "4.2.2",
    minAppVersion: "1.5.0",
  };
  assert.equal(
    validateRelease(
      "v4.2.2",
      manifest,
      { version: "4.2.2" },
      { "4.2.2": "1.5.0" },
    ),
    "4.2.2",
  );
  for (const tag of ["main", "v4.2.3", "v4.2.2;echo no", undefined])
    assert.throws(() =>
      validateRelease(
        tag,
        manifest,
        { version: "4.2.2" },
        { "4.2.2": "1.5.0" },
      ),
    );
  assert.throws(() =>
    validateRelease(
      "v4.2.2",
      manifest,
      { version: "4.2.2" },
      { "4.2.2": "1.4.0" },
    ),
  );
});

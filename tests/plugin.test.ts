import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSync } from "esbuild";
import Module from "node:module";
import { resolve } from "node:path";
import { DEFAULT_SETTINGS } from "../src/settings";
import type PersianCalendarPlugin from "../main";

function loadPlugin() {
  const result = buildSync({
    entryPoints: [resolve("main.ts")],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    alias: { obsidian: resolve("tests/fixtures/obsidian.cjs") },
  });
  const module = new Module(resolve("tests/plugin-bundle.cjs"));
  (
    module as unknown as { _compile: (source: string, name: string) => void }
  )._compile(result.outputFiles[0].text, "plugin-bundle.cjs");
  return module.exports.default as new () => PersianCalendarPlugin & {
    data: unknown;
    saved: unknown;
  };
}

test("plugin load migrates flat settings and persists nested data", async () => {
  const previous = (globalThis as unknown as { window: unknown }).window;
  (globalThis as unknown as { window: unknown }).window = {
    setInterval: () => 0,
    clearInterval: () => {},
  };
  try {
    const Plugin = loadPlugin(),
      plugin = new Plugin();
    plugin.data = { noteFolder: "Existing Journal", showHolidays: false };
    await plugin.onload();
    assert.equal(plugin.settings.noteFolder, "Existing Journal");
    assert.equal(plugin.settings.noteNameFormat, "YYYY-MM-DD");
    assert.equal(plugin.settings.showHolidays, false);
    assert.equal(typeof plugin.api.pickDate, "function");
    await plugin.saveSettings();
    assert.equal(
      (plugin.saved as { settings: { noteFolder: string } }).settings
        .noteFolder,
      "Existing Journal",
    );
    plugin.onunload();
    assert.equal(await plugin.pickDate(), null);
  } finally {
    (globalThis as unknown as { window: unknown }).window = previous;
  }
});

test("plugin load uses defaults for missing or malformed settings", async () => {
  const previous = (globalThis as unknown as { window: unknown }).window;
  (globalThis as unknown as { window: unknown }).window = {
    setInterval: () => 0,
    clearInterval: () => {},
  };
  try {
    const Plugin = loadPlugin(),
      plugin = new Plugin();
    plugin.data = {
      settings: { showHolidays: false, noteNameFormat: 7 },
      cache: { months: {}, expires: "" },
    };
    await plugin.onload();
    assert.deepEqual(plugin.settings, {
      ...DEFAULT_SETTINGS,
      showHolidays: false,
    });
    plugin.onunload();
  } finally {
    (globalThis as unknown as { window: unknown }).window = previous;
  }
});

test("disabled expression modes leave new text unchanged", async () => {
  const previous = (globalThis as unknown as { window: unknown }).window;
  (globalThis as unknown as { window: unknown }).window = {
    setInterval: () => 0,
    clearInterval: () => {},
  };
  try {
    const Plugin = loadPlugin(),
      plugin = new Plugin();
    plugin.data = {
      showHolidays: false,
      dynamicExpressions: false,
      staticExpressions: false,
    };
    await plugin.onload();
    let replacements = 0;
    const editor = {
      getCursor: () => ({ line: 0, ch: 7 }),
      getLine: () => "{#ساعت}",
      replaceRange: () => {
        replacements++;
      },
    };
    plugin.handleSmartText(editor as never);
    assert.equal(replacements, 0);
    plugin.onunload();
  } finally {
    (globalThis as unknown as { window: unknown }).window = previous;
  }
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
const css = readFileSync("styles.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const scope =
  ":is(.persian-cal-container, .persian-date-picker-modal) .persian-cal-grid > button.persian-cal-day";
function rule(selector: string): string {
  const found = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
    (match) => match[1].replace(/\s+/g, " ").trim() === selector,
  );
  assert.ok(found, `Missing scoped rule: ${selector}`);
  return found[2];
}
test("normal calendar day buttons override theme chrome without changing other buttons", () => {
  const body = rule(scope);
  assert.match(body, /background:\s*transparent\s*!important/);
  assert.match(body, /border:\s*2px solid transparent\s*!important/);
  assert.match(body, /box-shadow:\s*none\s*!important/);
  assert.match(body, /font-weight:\s*400\s*!important/);
});
test("selected and today states survive the reset", () => {
  assert.match(
    rule(scope + ".is-selected"),
    /border-color:\s*var\(--interactive-accent\)\s*!important/,
  );
  assert.match(rule(scope + ".is-selected"), /box-shadow:\s*0 0 0 2px/);
  assert.match(rule(scope + ".is-today"), /linear-gradient/);
  assert.match(
    rule(scope + ".is-today"),
    /color:\s*var\(--text-on-accent\)\s*!important/,
  );
  assert.match(
    rule(scope + ".is-today.is-selected"),
    /border-color:\s*white\s*!important/,
  );
});
test("disabled bounds remain visibly disabled and do not animate on hover", () => {
  const body = rule(scope + ":disabled");
  assert.match(body, /cursor:\s*not-allowed/);
  assert.match(body, /opacity:\s*0\.35/);
  assert.match(body, /transform:\s*none/);
  assert.match(
    rule(scope + ".is-friday:not(.is-today)"),
    /color:\s*var\(--text-error\)\s*!important/,
  );
});

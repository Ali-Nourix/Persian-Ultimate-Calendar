import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
test("release CLI validates the real existing tag and rejects a changed HEAD", () => {
  const folder = mkdtempSync(join(tmpdir(), "persian-calendar-release-"));
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: folder, stdio: "pipe" });
  try {
    git("init", "-q");
    git("config", "user.name", "Release Test");
    git("config", "user.email", "release-test@example.invalid");
    writeFileSync(
      join(folder, "manifest.json"),
      JSON.stringify({
        id: "persian-ultimate-calendar",
        version: "4.2.2",
        minAppVersion: "1.5.0",
      }),
    );
    writeFileSync(
      join(folder, "package.json"),
      JSON.stringify({ version: "4.2.2" }),
    );
    writeFileSync(
      join(folder, "versions.json"),
      JSON.stringify({ "4.2.2": "1.5.0" }),
    );
    git("add", ".");
    git("commit", "-qm", "fixture");
    git("tag", "v4.2.2");
    const options = {
      cwd: folder,
      env: { ...process.env, RELEASE_TAG: "v4.2.2" },
      stdio: "pipe" as const,
    };
    assert.match(
      execFileSync(
        process.execPath,
        [resolve("scripts/validate-release.mjs")],
        options,
      ).toString(),
      /Validated v4.2.2/,
    );
    writeFileSync(join(folder, "extra.txt"), "fixture changed");
    git("add", ".");
    git("commit", "-qm", "different head");
    assert.throws(() =>
      execFileSync(
        process.execPath,
        [resolve("scripts/validate-release.mjs")],
        options,
      ),
    );
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

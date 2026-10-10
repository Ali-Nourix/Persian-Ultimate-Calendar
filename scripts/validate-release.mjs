import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
export function validateRelease(tag, manifest, packageJson, versions) {
  const match = /^v(\d+\.\d+\.\d+)$/.exec(tag ?? "");
  if (!match) throw new Error("Release tag must be vMAJOR.MINOR.PATCH");
  const version = match[1];
  if (manifest.version !== version || packageJson.version !== version)
    throw new Error("Tag, manifest and package versions must match");
  if (versions[version] !== manifest.minAppVersion)
    throw new Error("versions.json must map this version to minAppVersion");
  if (manifest.id !== "persian-ultimate-calendar")
    throw new Error("Unexpected plugin ID");
  return version;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const json = (name) => JSON.parse(fs.readFileSync(name, "utf8"));
  const tag = process.env.RELEASE_TAG;
  validateRelease(
    tag,
    json("manifest.json"),
    json("package.json"),
    json("versions.json"),
  );
  const commit = execFileSync(
    "git",
    ["rev-parse", `refs/tags/${tag}^{commit}`],
    { encoding: "utf8" },
  ).trim();
  const head = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  if (commit !== head)
    throw new Error("Checked-out commit must match the existing release tag");
  console.log(`Validated ${tag} at ${head}`);
}

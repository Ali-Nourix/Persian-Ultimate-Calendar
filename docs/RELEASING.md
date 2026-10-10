# Build and draft a release

The ready workflows are stored as templates because the current GitHub connection cannot write `.github/workflows/*`. **Neither workflow is active yet.**

## 1. Activate once

Using an account/connection authorized to write workflows, copy these files without changing their contents:

```text
docs/ci.yml       → .github/workflows/ci.yml
docs/release.yml  → .github/workflows/release.yml
```

Commit them to the branch that will own releases. Merge/review the source first. GitHub Actions must be enabled for the repository; the release job uses a `GITHUB_TOKEN` with `contents: write`. No personal token secret is required by the template.

The release workflow supports:

- A pushed `vMAJOR.MINOR.PATCH` tag.
- A manual workflow dispatch with an **existing tag**. Manual dispatch is available after the workflow exists on the default branch.

## 2. Prepare a version

Keep these files in agreement:

```text
manifest.json:       version = 4.2.2
package.json:        version = 4.2.2
package-lock.json:   root version = 4.2.2
versions.json:       "4.2.2": "1.5.0"
```

Update CHANGELOG, run checks and perform the real-Obsidian checklist in `TESTING.md` before publishing. For a future version, replace all example versions consistently.

```bash
npm ci
npm run check
npm run build
```

## 3. Trigger the draft

After reviewing/merging the desired commit:

```bash
git tag -a v4.2.2 -m "Persian Ultimate Calendar 4.2.2"
git push origin v4.2.2
```

These commands are documentation only: this task has **not** created a tag or published a release.

The workflow verifies:

- Tag syntax and version agreement.
- The tag's commit equals the checked-out source commit.
- Plugin ID and `versions.json` minimum-version mapping.
- TypeScript, unit tests, formatting and timezone tests.
- The production build succeeds before packaging.

## 4. Review the draft

Assets:

```text
main.js
manifest.json
styles.css
LICENSE
THIRD_PARTY_NOTICES.md
persian-ultimate-calendar.zip
persian-ultimate-calendar-source.zip
```

The install ZIP contains the three runtime files plus license notices and a source link. Source code is attached separately as well. Users install the runtime files into `.obsidian/plugins/persian-ultimate-calendar/`.

The workflow creates a **draft**, not an immediately public release. Review its release notes, installation files and native-Obsidian test results; then publish manually in GitHub. Re-running for an existing draft updates assets, but an already-published release is not overwritten.

## Limits

Only the version/tag guard and local build checks have been exercised here. The hosted GitHub Actions job and upload step have **not** run, because workflow-write permission is unavailable. Community Plugin listing/approval is separate from building a GitHub release.

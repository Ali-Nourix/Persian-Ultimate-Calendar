# Release automatically from manifest

`docs/release.yml` is the new **Release from manifest** workflow. It has no tag/version input: manual execution derives `v<version>` from `manifest.json`, builds assets, creates the tag if necessary, and publishes the release.

## Install the new revision

An older release workflow already exists on `main`. The current agent connection still cannot edit `.github/workflows/*` (GitHub returns 403). Replace the contents of `.github/workflows/Release.yml` with `docs/release.yml` using an account/connection authorized to write workflows, and commit the replacement. Until then, the older tag-input/draft workflow remains active.

No extra personal-token secret is required: the release job requests `contents: write` for its scoped `GITHUB_TOKEN`. Repository/organization policy must allow that permission and tag/release creation. No workflow run, remote tag creation or release publication was initiated by the agent.

## Use

1. Keep `manifest.json`, `package.json` and the root version in `package-lock.json` consistent. Map that version to `minAppVersion` in `versions.json`.
2. Review the source and native-Obsidian release checklist before running; this workflow **publishes publicly** after successful uploads.
3. Open **Actions → Release from manifest → Run workflow**.
4. Select the branch, normally `main`, and click **Run workflow**. There is no version/tag field.

Example: `manifest.json` version `4.2.2` becomes tag and release `v4.2.2`. The workflow does not auto-increment the version; set the intended version in the manifest/package files first.

A pushed `vMAJOR.MINOR.PATCH` tag also triggers the workflow, but it must match the manifest. Runs are serialized per repository.

## Safety and repeat runs

- The exact event commit is checked out; a later branch update cannot silently change the selected source.
- Version agreement, minimum-version mapping and existing tag commit are validated before building.
- Tests, formatting, timezone checks and the production build must succeed before tag creation.
- A missing tag is created at the checked-out commit. A matching existing tag is reused.
- A tag pointing at another commit is never moved: the job fails and requires a new version.
- An already-published release and its assets are left unchanged.
- A new/existing draft receives the assets first, then is automatically published. A failed upload leaves a draft rather than an intentionally published partial release.

## Assets — exactly four manual uploads

```text
main.js
manifest.json
styles.css
persian-ultimate-calendar.zip
```

The ZIP contains exactly these files at its root (no folder or extra files):

```text
main.js
manifest.json
styles.css
```

License notices remain in the repository and are available with GitHub's automatic source archives. There is no additional license asset, notices asset or manually uploaded source ZIP.

GitHub automatically shows **Source code (zip)** and **Source code (tar.gz)** on releases; these are not uploaded by this workflow and cannot be removed from that standard source-download section. The four-asset rule applies to manual uploads.

This affects future successful releases. Existing published releases are left unchanged by the safety guard. After modifying the workflow on main, use a new consistent manifest/package version for a new tag, rather than moving the existing version tag.

## Verification limits

The exact version-selection step was tested locally with: manual execution without a pre-existing tag, matching existing tag, matching tag push, mismatched pushed tag, mismatched package version and an existing tag at a different commit. Workflow YAML parsed successfully. The hosted GitHub tag/release/upload steps have not run here. Community Plugin approval remains separate.

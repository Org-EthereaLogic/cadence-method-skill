# WP 1.6 — Guardrails Falsifiability Drill

> **Produced by:** `drills/wp-1.6-guardrails/run-drill.sh` — re-run to regenerate.
> **Subject:** `scripts/guardrails-check.sh`
> **Discipline:** SC-2 pattern 7 — each check is shown red for the right reason
> before its green is credited. A check nobody has seen fail is not evidence.

## Run record

| Field | Value |
|---|---|
| Run at (UTC) | 2026-08-05 07:59:55Z |
| Host OS | Darwin 25.5.0 |
| Architecture | arm64 |
| Git | 2.50.1 |
| Repository HEAD | e4bafaa |
| Working tree | changes uncommitted at run time (WP 1.6 scaffold) |

Each drill seeds exactly one defect, leaving the other sections untouched, so a red
line is attributable to the seeded defect and not to ambient state.

## Drill 1 — Vendored-source integrity (D-4)

**Seeded defect.** Append a line to `docs/reference/source/CADENCE_METHOD_OUTLINE.md`, the condition the D-4 read-only
boundary forbids. This is the case the naive `git diff --quiet HEAD` form misses once
the edit is committed.

```text
3. Vendored-source integrity (D-4)
  PASS  vendored CADENCE_METHOD.md matches its pinned hash
  FAIL  vendored CADENCE_METHOD_OUTLINE.md drifted from its pinned hash
        pinned fdf9b656961cb8e40602145e9f04e696bf20983f
        actual 0c17e179c000219a6fe2745629e40957d30c7e6c
        The snapshot is read-only (D-4). An upstream advance lands as a
        dedicated re-vendor commit updating the recorded version and the
        pinned hashes together.
  PASS  vendored CADENCE_METHOD_REVIEW.md matches its pinned hash

```

## Drill 2 — Required files

**Seeded defect.** Remove `README.md` from the required-file set.

```text
  FAIL  exists: README.md
  14 passed, 1 failed, 0 skipped
```

## Drill 3 — Forbidden markers

**Seeded defect.** An unresolved marker inside the scanned path set.

```text
2. Forbidden markers
  FAIL  no unresolved markers

```

## Drill 4 — Credential scan (NFR-4)

**Seeded defect.** A quoted assignment matching the credential pattern.

```text
4. Credential scan (NFR-4)
  FAIL  possible credential in scripts/_drill_cred.md

```

## Green run — all defects removed

```text
cadence-method-skill guardrails

1. Required files
  PASS  exists: README.md
  PASS  exists: LICENSE
  PASS  exists: SECURITY.md
  PASS  exists: CLAUDE.md
  PASS  exists: CONTRIBUTING.md
  PASS  exists: Makefile
  PASS  exists: .editorconfig
  PASS  exists: .claude-plugin/plugin.json
  PASS  exists: docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md
  PASS  exists: docs/design/CADENCE_AUTOMATION_USER_STORIES.md

2. Forbidden markers
  PASS  no unresolved markers

3. Vendored-source integrity (D-4)
  PASS  vendored CADENCE_METHOD.md matches its pinned hash
  PASS  vendored CADENCE_METHOD_OUTLINE.md matches its pinned hash
  PASS  vendored CADENCE_METHOD_REVIEW.md matches its pinned hash

4. Credential scan (NFR-4)
  PASS  no credential patterns found

=== Summary ===
  15 passed, 0 failed, 0 skipped
```

Exit status: `0`

## Findings this drill produced

**1 — Credential pattern matched prose.** The pattern originally omitted the required
quote around the value, so the bare keyword alternation matched ordinary text:
`not the same token: a document …` in
`skills/cadence-method/references/phase-definitions.md` failed the scan. The pattern
now requires a quoted value. A scan that cries wolf on the method text is a scan the
operator learns to ignore (R-6).

**2 — The drill tripped the check it was exercising.** The first run of this script
left the gate red: the literal seed string in `run-drill.sh` is itself a credential
match, and `git ls-files` puts the drill script in scan scope. Fixed by splitting the
keyword in the source so the seeded file receives the contiguous token while the
script does not contain it — the same self-reference guard the marker pattern already
used. Retained here because a check whose own test data defeats it is a defect class
worth remembering, and because it is the first thing a future seeded defect will hit.

## Stated limits

A green run here is a statement about these four sections only. Link integrity and
ID-namespace resolution are WP 5.1 deliverables and are not checked by this script;
`make check` invokes them once they exist rather than reimplementing them (R-2).

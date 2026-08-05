# Vendored method source (read-only)

These files are **read-only vendored copies** of the CADENCE agentic-engineering method,
committed here so the build's reference-extraction work (WBS 1.0 / 2.0) is **replayable and
auditable** (method principles P2 "evidence, not narrative" and P5 "auditability"). Do not
edit them in this repo — treat them as an immutable snapshot of the extraction source.

| File | Purpose |
|---|---|
| `CADENCE_METHOD.md` | The governing method specification (v4.7). The source of the invariants extracted into `skills/cadence-method/references/*.md`. |
| `CADENCE_METHOD_OUTLINE.md` | Section outline of the method. |
| `CADENCE_METHOD_REVIEW.md` | Review notes on the method. |

## Provenance

- Snapshot taken: 2026-08-04
- Origin (author's working copy, not distributed with this repo):
  `work-product/aim-it-agentic-engineering-method/` in the `attom-data` project.
- Version at snapshot: method **v4.7**.

### Pinned content hashes

These are the `git hash-object` blob hashes of the vendored files as committed at the snapshot.
`scripts/guardrails-check.sh` recomputes and compares them on every run, so a *committed* edit
to the snapshot fails the check rather than passing silently.

| File | Blob hash (`git hash-object`) |
|---|---|
| `CADENCE_METHOD.md` | `a31bd491cb8d669265989efa3e37e680382ec130` |
| `CADENCE_METHOD_OUTLINE.md` | `fdf9b656961cb8e40602145e9f04e696bf20983f` |
| `CADENCE_METHOD_REVIEW.md` | `2aa9187a8c7de93b410af78190e3cba980906a1f` |

This README is repository-authored provenance rather than vendored content, so it is not
covered by the integrity check — it is the one file in this directory a re-vendor commit
updates.

If the upstream method advances past v4.7, re-vendor these files in a dedicated commit that
records **both** the new version and the new pinned hashes here, so every "extracted from
method §X" claim in the references remains traceable to the exact source it was derived from.

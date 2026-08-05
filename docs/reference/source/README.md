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

If the upstream method advances past v4.7, re-vendor these files in a dedicated commit and
record the new version here, so every "extracted from method §X" claim in the references
remains traceable to the exact source it was derived from.

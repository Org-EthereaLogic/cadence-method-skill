# Contributing — cadence-method-skill

This repository is built by coding agents directed by a solo operator, through GitHub issues that each name exactly one WBS work package. Outside contributions are welcome as issues; open one before a pull request so the work can be tied to a package.

## Before you start

1. `docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md` — the authority document.
2. `docs/design/CADENCE_AUTOMATION_USER_STORIES.md` — the declared companion.
3. `CLAUDE.md` — the repository map and the working rules.
4. The specific work package the issue names: its Deliverable, its Depends-on, its Traces-to, and its WBS section's Exit criteria.

## Workflow

1. The issue names exactly one work package. One package per pull request.
2. Branch. Never commit to `main`.
3. Implement to the package's Deliverable. Do not exceed its scope, and do not start a package whose Depends-on is unmet.
4. Run `make check` and paste its output into the pull request.
5. Open the pull request with the template: trace the identifiers touched and name the evidence path.

## Where work-package output lands

| WBS | Output path(s) |
| --- | --- |
| 1.0 | `docs/design/`, `docs/`, `skills/cadence-method/references/` (WP 1.1, WP 1.2), and the repository root (WP 1.6) |
| 2.0 | `skills/cadence-method/` |
| 3.0 | `commands/`, `agents/` |
| 4.0 | `commands/`, `agents/` |
| 5.0 | `scripts/validators/`, `scripts/adapters/`, `fixtures/`, `hooks/` |
| 6.0 | `commands/`, `agents/`, `scripts/` |
| 7.0 | `drills/` |
| 8.0 | `.agents/`, `.codex/` |

Whether the practitioner surface ships as `commands/*.md` or as per-command skill files is a WP 1.5 determination; the verified invocation map supersedes the §4.1 layout sketch.

## What is under configuration control

The two governed design documents and their revision records; `SKILL.md` and its `references/`; `commands/`, `agents/`, and `hooks/`; every script under `scripts/`; the frozen fixture packs; the drill definitions and their retained evidence; and the plugin manifest. The vendored method snapshot is controlled read-only.

The set is chosen for adequate visibility at a manageable number of controlled items, not by controlling everything in the tree.

## Conventions

**Governed documents** (`docs/design/`). The headerless two-column metadata table follows the H1 and the bold role line — never YAML. Each document ends with `## Appendix — Revision Record`, columns `| Version | Date | Change |`, preceded by its standing preamble sentence. A correction to an earlier row is made by appending a new row, never by editing it; front-matter metadata rows are ordinary metadata and are corrected in place. Dates are ISO `YYYY-MM-DD` stamped from a UTC clock (NFR-5). Identifiers are never reused and never renumbered, and a new prefix requires its definition in the authority document in the same change (FR-10). Method-section pointers are written `method §N`, never bare `§N`, wherever the token could collide with this project's own §1–§10.

**Runtime reference files** (`skills/cadence-method/references/`). A deliberately lighter shape: H1 `# <Title> — CADENCE Method Reference`, then a blockquote block giving **Source of truth**, **Distilled from**, **Status**, and the tie-breaker sentence naming D-4. No metadata table and no revision record. The section pointer on the Source-of-truth line is optional when the Distilled-from line carries the sections — `id-namespaces.md` and `gate-checks.md` differ on this today, and WP 2.2 resolves it rather than this file pretending they already conform. Any reference file over 100 lines opens with a table of contents (WP 2.2). These files are context payload budgeted by NFR-1; do not apply documentation polish to them.

**Validators and scripts.** Every file under `scripts/validators/` is a standalone single-file CommonJS script, Node ≥ 20, zero dependencies (NFR-1, NFR-3). It opens with the `// INPUT:` and `// USAGE:` comment pair, then `'use strict';`. It exports a `manifest` and an `execute(input)`, then `module.exports`, then an `if (require.main === module)` CLI wrapper. Verdicts are the closed set `pass | warn | fail`, with `warn` recorded and never blocking (method §6.2 rule 1); each verdict carries a distinct exit code that the orchestrator relays and never overrides. Shell scripts use `#!/usr/bin/env bash` with `set -euo pipefail`, a `check()` helper, numbered echoed sections, PASS/FAIL/SKIP counters, an `=== Summary ===` footer, and `exit 1` on any failure.

**Writing and linking.** Every path, filename, command, flag, environment variable, identifier, and enum value is backticked. A backticked bare path in prose is repository-root-relative and is *not* a link; only `](path)` forms are links, and those must be relative and must resolve to a path that exists today. Fenced blocks are always language-tagged. The canonical spelling of a forward reference is `(forthcoming — WP N.N)` with a spaced em-dash, and that is the sanctioned way to name an artifact that does not exist yet. Commit subjects follow Conventional Commits. Never `git add -A` or `git add .`; never `--force`; never `--no-verify` (NFR-4).

## Honesty vocabulary

One lexicon, used identically in documents, script output, and evidence.

- A check that could not run is `skipped`, and is never counted as passed (NFR-6).
- An unverified claim is marked `unverified`, never `passed`.
- A shell check missing its tool prints `  SKIP  <reason>` and returns 0.
- A documented-but-unbuilt artifact is `(forthcoming — WP N.N)`.
- Never assert a status no evidence backs — which is why this repository carries no badges.

## Quality gates

- `make check` — the repository hygiene gate: required files, forbidden markers, vendored-source integrity, credential scan.
- `make validate` — the aggregate gate. Today it is `check`; WP 5.1 and WP 5.2 add the deterministic validators and the frozen-fixture parity runner, which it invokes rather than reimplements.
- `make plugin-validate` — an operator convenience while iterating on the manifest. It is not a gate and the `claude` CLI is not a declared NFR-3 dependency; the target prints `SKIP` when the CLI is absent.

## Change records

The issue and pull-request thread is this project's change-request record of authority. A solo maintainer needs no review board, but the accept / modify / defer / reject decision must leave a written trace.

Any change to scope, requirements, or the WBS lands as an appended row in the authority document's Revision Record, never as a silent edit. This is R-4's stated mitigation, and it is why WP 1.6 exists rather than this scaffold simply appearing.

Issue labels form the defect taxonomy: `validator-defect`, `reference-drift`, `runtime-variance`, `doc-gap`, `method-divergence`. R-2 and R-3 are measurable only if their occurrences are classified when they happen.

## A note on metrics

A measurement is added only when it supports a decision. NFR-2's gate-latency budget qualifies, because it drives R-8. A promotions-per-week counter does not.

## Reporting security issues

See [SECURITY.md](SECURITY.md). Do not open a public issue for a vulnerability.

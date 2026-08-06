# CLAUDE.md — cadence-method-skill Repository Quick Reference

This repository builds a Claude Code plugin named `cadence`. This file is a routing index: it carries no governing rules of its own, and every rule below is a pointer to the document that owns it.

Scope note: this file serves contributors working *in* this repository, and only them. A `CLAUDE.md` at a plugin root is **not** loaded as project context for anyone who installs the plugin — `claude plugin validate .` reports exactly that, verified 2026-08-05 against Claude Code v2.1.222. Consumers receive context through the skill, the agents, and the hooks. Nothing a consumer must know may live only here.

## Authority and precedence

1. `docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md` — the authority document. Canonical home of `FR-`, `NFR-`, `SC-`, `S-`, `X-`, `A-`, `R-`, `D-`, `CR-`, and `Q` identifiers, and of the `WP n.n` work packages.
2. `docs/design/CADENCE_AUTOMATION_USER_STORIES.md` — the declared companion. Canonical home of `US-` and `AC-n.m`.
3. `docs/reference/source/CADENCE_METHOD.md` v4.7 — the upstream method. Where it and the runtime references disagree, the method governs and the reference is corrected (D-4).
4. `skills/cadence-method/references/` — the runtime restatement of the method, written for execution.
5. This file — routing only.

When 1 and 2 disagree, the conflict is resolved and recorded in the authority document's §10 conflict-resolution record, and that record governs.

## Decision order

Safety and correctness → evidence traceability → security → simplicity and proportionality → reproducibility → human control and transparency → validation before commercialization.

`P6`'s operator controls — cancel, retry, resume, resolve, with every override recorded — are a floor, not a term in the tradeoff.

## Repository map

| Path | Purpose | Status |
| --- | --- | --- |
| `docs/design/` | The governed document set: authority document, user-stories companion, standards review. Governed-document conventions apply. | present |
| `docs/reference/source/` | Read-only vendored snapshot of method v4.7. Never edited here. An upstream advance lands as a dedicated re-vendor commit updating both the recorded version and the pinned hashes in that directory's README. | present |
| `skills/cadence-method/references/` | Runtime context payload loaded into an agent's context and budgeted by NFR-1 — not documentation, and not subject to documentation conventions. Polishing these files inflates the context budget NFR-1 exists to protect. | present |
| `skills/cadence-method/SKILL.md` | The orchestrator operating contract, under 500 lines. | forthcoming — WP 2.1 |
| `.claude-plugin/plugin.json` | Plugin manifest. Establishes the `/cadence:*` namespace. Only `plugin.json` belongs in this directory. | present |
| `scripts/guardrails-check.sh` | This repository's own hygiene gate. Reads only; never writes, stages, or commits. | present |
| `scripts/validators/` | Deterministic single-file Node validators, pinned by frozen fixtures. | forthcoming — WP 5.1 |
| `scripts/adapters/` | Thin adapters and version preflight for declared external gate tools. | forthcoming — WP 5.1 |
| `skills/<action>/` | Practitioner slash commands, one per-action `SKILL.md` serving `/cadence:<action>`. The surface was confirmed by WP 1.5 and decided by Q5 — per-action skills, not `commands/*.md`. | forthcoming — WP 3.1 |
| `agents/` | Phase, consensus, and steward agent definitions. | forthcoming — WP 3.3 |
| `hooks/` | Advisory hooks. Advisory-only by construction (FR-7, D-2). | forthcoming — WP 5.3 |
| `fixtures/` | Frozen per-validator fixture packs. Retained, not scratch. | forthcoming — WP 5.2 |
| `drills/` | Acceptance drill definitions and their retained append-only evidence. Retained, not scratch. | forthcoming — WP 7.1 |
| `Makefile` | The only local execution surface (X-6). | present |
| `README.md` | Public front door. | present |
| `CONTRIBUTING.md` | Workflow, conventions, and the work-package-to-path map. | present |

## Commands

| Target | Use |
| --- | --- |
| `make help` | List targets. |
| `make check` | Run the repository hygiene gate. |
| `make plugin-validate` | Operator convenience while iterating on the manifest. Not a gate. |
| `make validate` | The aggregate gate. |

## Working rules

- Never introduce an identifier without defining it in the authority document in the same change (FR-10).
- Revision rows are append-only: correct an earlier row by appending a new one, never by editing it (FR-12).
- Front-matter metadata rows are ordinary metadata and are corrected in place.
- Never edit anything under `docs/reference/source/` except that directory's own README (D-4).
- Never add blocking logic outside the promote command's gate step (D-2).
- Never report a check that could not run as passed — it is `skipped` (NFR-6).
- Mark an unsupported claim `unverified`, never `passed`.
- No new external tool without an NFR-3 entry, a pinned version, and a preflight check, in one change (NFR-1, NFR-3).
- Explicit-path staging only. Never `git add -A`, never `git add .`, never `--force`, never `--no-verify` (NFR-4).
- Never commit or push to `main`; work lands through a branch and a PR.
- Every governed-document edit appends a Revision Record row stamped from a UTC clock (NFR-5).

## Not policy

Scope, requirements, and the WBS live in the authority document. Workflow and authoring conventions live in `CONTRIBUTING.md`. If a rule appears only here, it is misplaced.

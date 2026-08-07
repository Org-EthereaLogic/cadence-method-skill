# cadence

**A Claude Code plugin that makes the CADENCE agentic-engineering method executable.**

Built by Anthony Johnson II | EthereaLogic LLC

---

The CADENCE Method is a reference specification, and it says plainly that it ships without a runtime: a project adopting it still has to supply its own Directives, validators, promotion command, and scaffold implementation. This repository builds that missing runtime. It packages the method as one orchestrating skill with its reference files, a set of phase and verification agents, practitioner slash commands, advisory drafting hooks, and deterministic fixture-pinned validators — turning the method's Agent Operating Card from prose an agent has to internalize into commands, agents, and gates it executes.

The governing idea is that hard controls engage at promotion, not while you draft. Drafting keeps its cadence; the gate is where confidence is established.

## Status

**Release:** pre-release. **M1 taken** — the design freeze was signed 2026-08-06 UTC ([docs/design-freeze.md](docs/design-freeze.md)) and WBS 1.0 is complete. WBS 2.0 (Skill Core) is complete; WBS 3.0–7.0 are in progress toward M3 (release 1). Nothing is installable yet.
**Governing method:** `CADENCE_METHOD.md` v4.7, vendored read-only under `docs/reference/source/`.
**Authority document:** [docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md](docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md) v1.17, with its declared companion [docs/design/CADENCE_AUTOMATION_USER_STORIES.md](docs/design/CADENCE_AUTOMATION_USER_STORIES.md) v1.11.
**Runtime:** Claude Code. Codex parity is release 2 (WBS 8.0).

The planned practitioner surface is ten `/cadence:*` commands — `init`, `status`, the six phase commands, `gate`, and `promote` — defined canonically as S-2 in the authority document. None are built yet. A command table appears here when the first command exists, with rows only for commands that exist.

## What this packages

- The `cadence-method` skill and its method references (S-1).
- Ten practitioner slash commands, the human-facing surface (S-2).
- Ten agent definitions: six phase agents, Critic, Advocate, Grader, Librarian (S-3).
- Advisory hooks — Draft-zone annotation and an Approved-zone write warning (S-4).
- Deterministic validators with frozen fixture packs, covering the method's Candidate gate (S-5).
- The project scaffold seeded by `/cadence:init` (S-6).
- Acceptance drills with retained, append-only run evidence (S-7).

## Install

Nothing is installable yet. When the plugin surface exists, it loads from a clone:

```bash
claude --plugin-dir .
```

Then `/reload-plugins` in-session. Marketplace distribution is out of scope for release 1 (exclusion X-6); install locally from a clone.

## Safe and unsafe use

These are the properties the runtime does and does not promise. They are design constraints, not aspirations, and each cites the requirement that binds it.

- **Drafting is never blocked.** Every Draft-zone hook is advisory: the write proceeds, the advisory is feedback only. A hook that fails degrades open in Draft and closed at the gate (FR-7).
- **Blocking exists in exactly one place.** Automated blocking logic lives only inside the promote command's deterministic gate step, at the two promotion boundaries. This is structural, not disciplinary — hooks lack a blocking path in Draft by construction (D-2).
- **No model output blocks anything.** Critic, Advocate, and Grader findings are recorded verbatim and surfaced, but they never change the deterministic verdict and never block promotion by themselves (X-3, FR-13). Only an explicitly recorded human hold blocks, and only until a human resolves it.
- **Approved is frozen by policy, not by the filesystem.** Approved artifacts carry a content hash re-verified on every status run, gate run, and promotion; a mismatch is an integrity failure. The runtime does not claim filesystem immutability or comprehensive malicious-tamper detection (FR-6).
- **A check that could not run is reported as skipped, never as passed** — in hook feedback, gate reports, and drill evidence alike (NFR-6).
- **A green gate is a statement about the checks that ran, never about the checks nobody wrote.** Every gate and status report ends with a stated-limits section enumerating what was not checked (FR-17). In particular, the gate proves a quotation is attributable and dated; whether it is verbatim is a human read.

## Requirements

The core deterministic validators require Node ≥ 20 and no network access. The complete promotion gate additionally requires version control, a pinned shell-lint tool, the project-declared render command and toolchain, and a PDF extractor where PDF fidelity is checked. `/cadence:init` and gate preflight report the resolved versions rather than assuming them; a missing required tool is reported and degrades closed at promotion (NFR-3).

## Development

```bash
make help      # list targets
make check     # repository hygiene gate
make validate  # aggregate gate
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and the authoring conventions, and [CLAUDE.md](CLAUDE.md) for the repository map and the working rules.

## Documentation

- [docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md](docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md) — the authority document: requirements, architecture, risks, WBS.
- [docs/design/CADENCE_AUTOMATION_USER_STORIES.md](docs/design/CADENCE_AUTOMATION_USER_STORIES.md) — declared companion: canonical `US-` and `AC-` definitions.
- [docs/design/CADENCE_AUTOMATION_SKILL_STANDARDS_REVIEW.md](docs/design/CADENCE_AUTOMATION_SKILL_STANDARDS_REVIEW.md) — Agent Skills conformance review, non-normative.
- [docs/reference/source/README.md](docs/reference/source/README.md) — the vendored method snapshot, read-only, with its provenance and pinned hashes.

## License

Copyright (c) 2026 EthereaLogic LLC. Licensed under the Apache License, Version 2.0 (`Apache-2.0`) — see [LICENSE](LICENSE). Security reporting: [SECURITY.md](SECURITY.md).

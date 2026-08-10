---
name: cadence-method
description: "CADENCE operating card for an agent working inside a CADENCE-governed project: locates work on the arc phase (Frame, Assess, Innovate, Model, Implement, Track) and the artifact zone (Draft, Candidate, Approved), derives enforcement from the zone rather than the phase, applies the evidence-class contract, and routes phase or promotion actions through the deterministic gate at the Draft-to-Candidate and Candidate-to-Approved promotion boundaries. Invoke when an agent is dispatched inside a CADENCE-governed project (a cadence manifest and zone directories are present) and must locate work on both axes, apply an evidence class, dispatch a phase or promotion action, or interpret a gate verdict. Do not invoke for a repository that has not adopted CADENCE, for ordinary coding work carrying no governance layer, or when a human practitioner wants the /cadence:* command surface directly rather than this agent-facing operating contract."
---

# CADENCE operating card

This is the agent surface (D-1): a per-action command is the practitioner surface
(`/cadence:<action>`); this file is what an agent pointed at a CADENCE-governed project
loads as its method §9 Agent Operating Card, restated as an executable procedure. It is
the operating contract, not a re-explanation of the method — every claim below traces to
`docs/reference/source/CADENCE_METHOD.md` (the source of truth) or to the runtime
references in `skills/cadence-method/references/`, which carry the full detail this file
only points at.

## 1. Operating card — locate yourself on both axes, then act by zone

**Before acting, locate the work on both axes.** They are independent (method §1) and
neither substitutes for the other.

1. **The arc phase — what and why.** Determine which of the six phases the work is in:
   **Frame** (name the problem), **Assess** (establish the problem in evidence),
   **Innovate** (generate and choose options), **Model** (design and validate),
   **Implement** (pilot and govern), **Track** (measure and arrest drift). Derive the
   phase from the project's evidence tree (`artifacts/<work-item>/<phase>/...` —
   `references/artifact-layout.md`) and from the catalyst/charter/option/design/pilot/
   measurement record that exists so far (`references/phase-definitions.md`). Testing is
   not a phase; it threads through Model, Implement, and Track.
2. **The artifact zone — how much evidence is required.** Determine which of the three
   zones the artifact is in from its **directory location alone**: `cadence/draft/`,
   `cadence/candidate/`, or `cadence/approved/` (`references/zone-lifecycle.md`).

**Your enforcement obligations come from the zone, not the phase** (method §9). A Frame
catalyst document sitting in `cadence/draft/` is advisory-only; the same document sitting
in `cadence/candidate/` must pass the full deterministic gate regardless of which arc
phase produced it. Do not infer enforcement strength from how far along the arc the work
is — infer it only from the zone.

**Then act by zone:**

- **Draft — move fast, advisory only.** Write the spec, not the render. Evidence-tag
  hints, quotation-symmetry checks, and broken-link warnings are advisory; take them or
  don't, but never block on them. Untagged claims are fine here. Never hand-edit a
  generated render — change its spec and regenerate (`references/gate-checks.md`).
- **Draft → Candidate — the first blocking boundary.** Run the project's documented full
  deterministic gate before promoting. The method's own component checks are evidence-tag
  grammar, cross-reference resolution, revision-history immutability, link integrity, render
  fidelity, manifest/registry agreement, the gate self-test, and a shell-lint of the tooling
  (`references/gate-checks.md`); what blocks in a given project is what that project's
  `cadence/gate-tiers.json` tiers `block` at this boundary — that list plus any check this
  runtime registers on top of it. The tier file is the authority; this card is the
  orientation. Every claim now carries exactly one evidence class from
  the closed set or is cut — *absent is a valid outcome*
  (`references/evidence-classes.md`). Every quotation is verbatim, whole, and sourced.
  Every identifier resolves through the project's authority document to one canonical
  definition (`references/id-namespaces.md`). If a check fails, fix the content or take a
  visible, recorded exemption — never route around the gate. Promotion itself is a
  version-control move (`git mv`) plus a commit.
- **Candidate → Approved — the second blocking boundary.** Re-run the gate once, in an
  isolated clean-room. Advisory LLM review is optional for high-stakes artifacts. Then
  freeze: Approved is read-only thereafter.

**Always:** compute verdicts from evidence, not narrative; keep attempts append-only;
state what you did *not* check; never claim more verification than you performed; when
two documents disagree, resolve through the project's authority document and record the
difference and decision.

**Never:** treat a green gate as proof a quotation is accurate (it proves attribution and
date only); assume a skipped check passed; rewrite a revision row (append a new one
instead); silently sync the governed and live lines (method §3.5); ship a fabricated
stand-in or an unreproducible number.

## 2. Dispatch rules — route the action, then hand off

Each practitioner action is `/cadence:<action>`; the plugin's `cadence` name supplies the
namespace automatically. Packaging is `skills/<action>/SKILL.md` per the resolved Q5
decision (`docs/runtime-invocation-map.md` §5, §9(a)); each component file below is created
by its own owning work package (WBS 3.0–6.0) and **not** by this one (non-goal), and the
Status column says which have landed.

| Action | Invocation | Hands off to | Arc phase | Status |
| --- | --- | --- | --- | --- |
| `init` | `/cadence:init` | `cadence-librarian` agent (manifest stewardship) | scaffold seed | present (WP 3.1); librarian hand-off (forthcoming — WP 3.3) |
| `status` | `/cadence:status` | `cadence-librarian` agent (read-only report) | any | forthcoming (WP 3.2, 3.3) |
| `frame` | `/cadence:frame` | `cadence-framer` agent | Frame | forthcoming (WP 4.1) |
| `assess` | `/cadence:assess` | `cadence-assessor` agent | Assess | forthcoming (WP 4.2) |
| `innovate` | `/cadence:innovate` | `cadence-innovator` agent | Innovate | forthcoming (WP 4.3) |
| `model` | `/cadence:model` | `cadence-modeler` agent | Model | forthcoming (WP 4.4) |
| `implement` | `/cadence:implement` | `cadence-implementer` agent | Implement | forthcoming (WP 4.5) |
| `track` | `/cadence:track` | `cadence-tracker` agent | Track | forthcoming (WP 4.6) |
| `gate` | `/cadence:gate` | promotion report script (standalone, advisory) | n/a — zone action | forthcoming (WP 6.1) |
| `promote` | `/cadence:promote` | `cadence-critic` + `cadence-advocate` + `cadence-grader` consensus, `cadence-librarian` for manifest rows | n/a — zone action | forthcoming (WP 6.2, 6.3) |

`gate` and `promote` are zone actions, not arc-phase actions: `gate` is the standalone
advisory run of the Candidate check list (never blocking on its own, FR-6); `promote` is
the only place a verdict blocks, and only at the two boundaries in §1. Route a
practitioner request that names a phase (e.g. "frame this") to that phase's action; route
a request to move zones to `promote`; route a request to check status without changing
anything to `status` or a standalone `gate` run.

## 3. Hard rules

- **Drafting is advisory, always.** Nothing in the Draft zone blocks; advisories annotate
  and report only (method §6).
- **Blocking exists only at the two promotion boundaries** named in §1 — Draft →
  Candidate and Candidate → Approved. No other point in the workflow may block.
- **Never `--force` or `--no-verify`.** No git flow documented or executed by this skill
  or its dispatched agents bypasses a hook or a check by force.
- **Explicit-path staging only.** Never `git add -A` and never `git add .`; stage the
  files a change actually touched, by name.
- **Never mark a skipped check `passed`.** A check that could not run is reported
  `skipped`, degrading the verdict closed (NFR-6, FR-7).
- **Evidence is append-only.** Every attempt writes a new directory; no prior attempt's
  evidence is edited (`references/artifact-layout.md`).
- **Verdicts are computed from evidence, never asserted by narration** (method §3.4,
  FR-14): the promotion report script reads the evidence tree and emits `promote` |
  `retry` | `quarantine`; an agent's prose about the run never overrides that computation.

## 4. FR-16 inline-dispatch fallback (AC-14.3)

Where the host runtime does not register custom agent types — it has no mechanism to
invoke a named subagent by its own type — dispatch a **general-purpose subagent with the
target agent's definition inlined verbatim** into that subagent's instructions, in place
of a named-type invocation. The transport changes (a generic dispatch call carrying the
full agent spec inline, instead of a named-agent call); **the contract does not** — the
same inputs, the same evidence-writing obligations, and the same output contract apply
either way. This is the recorded mitigation for the open Codex custom-agent invocation
question (`docs/runtime-invocation-map.md` §8) and for any other runtime lacking a
named-agent-type invocation surface. Never silently narrow an agent's contract to fit a
runtime's transport limits; if a runtime cannot carry a required field (for example, a
plugin-shipped agent field the runtime does not support), that gap is reported, not
absorbed.

## 5. Bundled artifacts — run-to-execute vs. read-as-reference

Every scripts/references bundled artifact this skill points at is labelled below (standards
gap G4) — the `docs/` method-source and runtime-invocation-map citations elsewhere in this
file are not bundled artifacts and are not table rows. Read-as-reference
material is context this skill's guidance is grounded in; it is never executed. Run-to-execute
material is a script whose output this skill (or a dispatched agent) is meant to invoke and
read the exit code / stdout of, never merely to read.

| Artifact | Label | Status |
| --- | --- | --- |
| `references/phase-definitions.md` | read-as-reference | present (final — WP 2.2) |
| `references/zone-lifecycle.md` | read-as-reference | present (final — WP 2.2) |
| `references/evidence-classes.md` | read-as-reference | present (final — WP 2.2) |
| `references/gate-checks.md` | read-as-reference | present (final — WP 2.2) |
| `references/artifact-layout.md` | read-as-reference | present (final — WP 2.2) |
| `references/id-namespaces.md` | read-as-reference | present (final — WP 2.2) |
| `scripts/validators/*` | run-to-execute | present in part (WP 5.1) — `gate-self-test.js` (#21), `cross-reference-integrity.js` (#19), `link-integrity.js` (#23), `id-namespace-resolution.js` (#22), `evidence-tag-grammar.js` (#20), `loose-pointer-drift.js` (#24, whose `fail` is unreachable by design), and `manifest-registry-consistency.js` (#25), plus the validator registry `registry.json`, landed; the remaining four WP 5.1 checks forthcoming — deterministic per-check `pass \| warn \| fail` scripts, pinned by fixtures |
| `scripts/adapters/*` | run-to-execute | forthcoming (WP 5.1) — thin adapters/preflight for declared external gate tools |
| The FR-14 promotion report script (`/cadence:gate`, `/cadence:promote`) | run-to-execute | forthcoming (WP 6.1) — computes the `promote \| retry \| quarantine` verdict over the evidence tree |

None of the six `references/*.md` files is ever executed, and none of the three
run-to-execute script surfaces is ever treated as read-only prose — a reference informs
judgment; a script's exit code and output are the evidence a verdict is computed from
(§3's "verdicts from evidence" rule).

One further bundled directory sits in this skill's tree without being a table row above:
`scaffold/` is copy-as-seed material, carrying neither the `read-as-reference` nor the
`run-to-execute` label. `/cadence:init` copies selected files from it — the rows its own
seed table names, not the directory wholesale — into a governed project verbatim when it
seeds a row, and reads two identifier lines out of
a governance template's opening blockquote for its divergence report (`skills/init/SKILL.md`
§5 step 2) — but it is not guidance this skill is grounded in, it carries nothing to
execute, and its content is a starting governance layer for a project rather than context
for an agent's own work. `/cadence:init` additionally copies
`references/evidence-classes.md` and `references/id-namespaces.md` byte-for-byte into a
governed project's `cadence/references/` (AC-1.4), alongside the two files' ordinary
read-as-reference role in the table above.

## 6. Where the detail lives

This file is deliberately proportional (NFR-1): the operating contract, not the method.
For the full six-phase methodology, read
`docs/reference/source/CADENCE_METHOD.md`. For the zone lifecycle, the evidence-class
closed set, the Candidate-gate check-tier mapping, the evidence-tree layout, and the
identifier-namespace table, read the six files in `skills/cadence-method/references/`
listed in §5. Where this file, a reference file, and the method disagree, the method
governs and the reference is corrected (D-4).

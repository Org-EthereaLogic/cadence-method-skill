# Capability Report — `/cadence:init` Reference

> **Source of truth:** `docs/validator-spec-sheet.md` §5 (the frozen external-tool adapter
> and version-preflight contract), plus NFR-3 and R-3 in
> `docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md`.
> **Distilled from:** spec sheet §5 (roles, adapter contract, preflight, the degrade-closed
> chain) and `docs/runtime-invocation-map.md` §4–§6 (plugin-root component directories,
> namespacing, agent/hook packaging).
> **Status:** Draft reference (WP 3.1) — seeded against the frozen spec sheet §5; carries
> no runtime behavior of its own until `scripts/adapters/` exists (forthcoming — WP 5.1).
> Where this reference and `docs/validator-spec-sheet.md` disagree, the spec sheet governs
> and this reference is corrected (design decision D-4).
> **Path anchor:** every path below is relative to the installed cadence plugin's root
> (`<PLUGIN_ROOT>`, resolved as `skills/init/SKILL.md` §1 states), never to the governed
> project. This file is loaded as context from inside the plugin; it is never copied into a
> governed project. The `docs/` paths in the lines above are provenance for this reference —
> where its content came from — and are not files `/cadence:init` reads on a run; its read
> boundary is `skills/init/SKILL.md` §1's, which admits `scripts/adapters/`, `agents/`, and
> `hooks/hooks.json` for the preflight §(b) and §(a) specify.

The format `/cadence:init` renders its runtime-capability report in, and the preflight call
contract it follows to produce one. Spec sheet §5 puts the same preflight in front of every
gate run as well, so this format is written to be reused there; that surface is forthcoming
(WP 6.1), and what this file describes today is `/cadence:init`'s report.

## (a) What is reported

Three surface classes, plus the resolved-tool roles below. Each is observed against a
confirmed `<PLUGIN_ROOT>` except the command surface, which is present by construction, and
Node, which needs no plugin path (§(d)). Where that root did not confirm, the agent and hook
surfaces and the four adapter-bound roles are reported `skipped` rather than absent, because
absence is an observation that branch could not make (`skills/init/SKILL.md` §1, NFR-6).

- **Command surface.** Present by construction: this report is being produced because a
  `/cadence:<action>` command is executing.
- **Agent surface.** `agents/*.md` (Claude Code). Resolved by observing whether `agents/`
  is present in the installed plugin: while `agents/` is absent, the agent surface is
  reported absent, with a reason naming the absent directory (forthcoming — WP 3.3); once
  it is present, the surface is reported from what that directory actually contains. The
  condition is observed at run time, never assumed from this sentence.
- **Hook surface.** `hooks/hooks.json` (Claude Code). Resolved the same way: while
  `hooks/hooks.json` is absent, the hook surface is reported absent, with a reason naming
  the absent file (forthcoming — WP 5.3); once it is present, the surface is reported from
  what that file actually declares.
- **FR-16 note.** A runtime with no named-agent-type registration surface uses the
  inline-dispatch fallback rather than losing the contract (`skills/cadence-method/SKILL.md`
  §4); the capability report names this as a runtime property, not a defect.

## (b) The preflight call

The four roles are exactly spec sheet §5's table: **Version control**, **Shell-lint**,
**Render toolchain**, **PDF extractor**. `/cadence:init` resolves them by scanning
`scripts/adapters/` and calling each discovered module's exported `resolve()`, matching a
module to a role through its exported `manifest.role` — never by hardcoding an adapter
filename, because §5 freezes the export contract and not the filenames.

For these four roles `/cadence:init` **never** runs a probe command itself. A second,
independent probing implementation inside this command is exactly the divergence R-2 names
— validator and adapter behavior drifting from the one implementation that owns it. The
rule binds every role an adapter owns. Node is bound to no adapter role and is the one tool
this command probes directly; §(d) is where that exception is stated and justified.

## (c) The record shape

Spec sheet §5's JSON record, reproduced with its six keys and no others: `role`,
`resolved`, `binary`, `version`, `probe`, `reason`.

```json
{
  "role": "shell-lint",
  "resolved": false,
  "binary": null,
  "version": null,
  "probe": null,
  "reason": "scripts/adapters/ absent (forthcoming — WP 5.1)"
}
```

Under a confirmed `<PLUGIN_ROOT>` in which `scripts/adapters/` is absent, every one of the
four roles records `resolved: false`, `binary: null`, `version: null`, `probe: null` (no
command was run, so none is recorded), and a `reason` naming the absent adapter directory.
Where the root itself did not confirm, the directory's absence is not something this run
observed, and the `reason` names that instead (§(a), §(e)'s fourth row). Only `shell-lint`
is a frozen slug in the spec sheet; the other three roles are reported by §5's own table
names (`Version control`, `Render toolchain`, `PDF extractor`) until their WP 5.1 adapters
supply their own `manifest.role`.

## (d) Node

Checked **directly** with `node --version` — the one probe `/cadence:init` runs itself, and
the stated exception to §(b)'s rule. Spec sheet §5 binds four roles to adapters and gives
Node none, because Node 20 or newer is NFR-3's core requirement, the thing the validators
themselves run on rather than a gate tool they call out to. There is therefore no adapter
`resolve()` to call for it, and no second implementation for this one to drift from (R-2).
Reported as one of: resolved with its version; resolved but outside the supported range
(`node` older than 20); or unresolved (`node` not found on `PATH`) — §(e)'s first three rows
render those three. Node needs no plugin path, so it is observable in every branch and never
reaches §(e)'s fourth row. The outcome is recorded in §(c)'s same six-key shape under the
role name `Node`, which §(b)'s four adapter-bound roles deliberately do not include: Node is
reported alongside them, never as one of them.

## (e) Rendering — state to report line

| Record state | Report line |
| --- | --- |
| `resolved: true`, version inside the supported range | `resolved <version>` |
| `resolved: true`, version outside the supported range | `resolved <version> (outside the supported range)` |
| `resolved: false`, and the role *was* observed — a probe ran, or its adapter was looked for under a confirmed `<PLUGIN_ROOT>` | `missing (skipped)` |
| `resolved: false`, and the role could not be observed at all — `<PLUGIN_ROOT>` did not confirm (`skills/init/SKILL.md` §1) | `skipped (<reason>)` |

The supported range is the adapter `manifest`'s for one of the four roles, and Node 20 or
newer for Node (§(d)). The last two rows are one distinction, not two spellings of the same
one: `missing` is an observation, so it is only ever written where the run was in a position
to make it; where it was not, the line says `skipped` and the `reason` says why (NFR-6).
Every §(c) role record — the four adapter-bound roles and Node — reaches exactly one of
these four rows. The three surfaces in §(a) are not §(c) records and are reported in §(a)'s
own terms, under the same rule: absent where absence was observed, `skipped` where it could
not be.

**Explicit prohibition.** An unresolved role is **never** rendered `present`, `passed`,
`pass`, or `ok` (NFR-6). No rendering rule maps `resolved: false` to any of those four
words, and none may be added.

## (f) Degradation direction

In Draft this degrades **open**: `/cadence:init` completes, the degradation is reported,
and nothing blocks (FR-7, AC-11.3, design decision D-2). The degrade-**closed** half — an
unresolved required role reaching FR-14's `quarantine` verdict — belongs to the promotion
boundary, not to `/cadence:init` (forthcoming — WP 6.2).

## Stated limits

- A `resolved` role with a version is not a working tool — this report checks that a probe
  succeeded and parsed a version string, not that the tool functions correctly on this
  project's content.
- The surface probe in (a) reads the packaged plugin tree (`agents/`, `hooks/hooks.json`)
  rather than interrogating the host runtime's own installed-plugin registry; a runtime
  that reports a surface differently than this tree predicts is a gap this report does not
  detect.
- On a `/cadence:init` run the §(c) records are rendered into the report and not written to
  disk. Spec sheet §5 puts a gate run's records into that attempt's manifest so a verdict
  can be replayed against the toolchain that produced it (NFR-5); `/cadence:init` opens no
  attempt directory (`skills/init/SKILL.md` §8), so its records live only in the report it
  prints, and a project that wants them kept copies them into `cadence/registrations.md`.

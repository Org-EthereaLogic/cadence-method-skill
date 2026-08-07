# Registrations

> CADENCE reference version: the CADENCE method, v4.7, §3.6.
> Template revision: cadence scaffold registrations template, v1.0 (WP 3.1).

This file records the project's agent/hook/command registrations for the runtime in use
(S-6's ninth seed item). `/cadence:init` copies this template byte-for-byte when
`cadence/registrations.md` is absent, and writes nothing at all when it is already there.
**`/cadence:init` fills none of the slots below, and compares this file against nothing on a
later run.** The rows are the project's to fill in and to keep current, from the runtime
capability report `/cadence:init` prints at the end of its run.

## Observed at

`<UTC timestamp — fill in when the rows below are observed>`

## Surfaces

"Where the runtime looks" names where cadence's own packaged material lives — **inside the
installed cadence plugin** — not something this project has to provide; nothing in this
project's own tree needs to exist there. Some runtimes also read project-level paths for
skills, agents, and hooks; those are in *Per-runtime enablement* below, and `/cadence:init`
writes to none of them either.

| Surface | What cadence provides | Where the runtime looks | Observed status |
| --- | --- | --- | --- |
| Command | `/cadence:<action>` per-action skills | the plugin's per-action skill files, namespaced by the plugin name | `<fill in>` |
| Agent | Phase, consensus, and steward agent definitions | the plugin's agent-definition directory (Claude Code) | `<fill in>` |
| Hook | Draft-zone post-write annotation; Approved-zone write warning (both advisory-only by construction, Q6) | the plugin's hook configuration file (Claude Code) | `<fill in>` |

## External-tool roles

Recorded from the capability report `/cadence:init` prints, using that report's own
vocabulary: an unresolved role is recorded as that report rendered it — `missing (skipped)`
where the run could observe the role's absence, or `skipped (<reason>)` where it could not
observe the role at all — and never `present` or `passed` (NFR-6).

| Role | Status |
| --- | --- |
| Node (>= 20) | `<fill in>` |
| Version control | `<fill in>` |
| Shell-lint | `<fill in>` |
| Render toolchain | `<fill in>` |
| PDF extractor | `<fill in>` |

## Per-runtime enablement

**Claude Code** registers `/cadence:*` automatically from the installed plugin's manifest
`name`; a project carrying this scaffold needs no project-level file for the command
surface to resolve (the cadence runtime invocation map, §4).

**Codex** resolves skills from `.agents/skills/`, agents from `.codex/agents/*.toml`, and
hooks from `.codex/hooks.json` — the last only when the project's own `.codex/` layer is
trusted (the cadence runtime invocation map, §5–§6). Those three are paths in *this*
project, and `/cadence:init` writes to none of them (see below).

## What this file does not do

`/cadence:init` writes nothing to `.claude/settings.json`, `.codex/`, or any other runtime
configuration outside the `cadence/` namespace: merging into a practitioner's own runtime
configuration is exactly the clobbering AC-1.1 and AC-1.2 forbid, and a plugin's own
registrations come from installing the plugin, not from a per-project file.

This file is also not a drift detector. `/cadence:init` compares only the project's
Constitution and Directives against their packaged templates for divergence —
`cadence/constitution.md` and `cadence/directives.md`, or a `constitution.md` /
`directives.md` at the repository root when the `cadence/` copy is absent. On a second run
it finds this file present, writes nothing, and reports it as existing — it does not
re-observe the rows above, and it does not report drift in them. Keeping them current is the
project's own step, and a re-observation surface is forthcoming (WP 3.2 `/cadence:status`).

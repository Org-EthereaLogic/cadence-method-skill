---
name: init
description: "Seeds the CADENCE project scaffold /cadence:init packages: Constitution, Directives template, byte-identical evidence-class and ID-namespace references, manifest template, the three zone directories, an artifacts/ evidence root, cadence/gate-tiers.json, and the runtime's agent/hook/command registrations. Writes each seed only when its destination is absent, so a second run is idempotent and byte-identical; reports an existing Constitution or Directives as diverged rather than replacing it; and closes with a runtime capability report naming supported agent, hook, and command surfaces and resolved external-tool versions. Invoke when a CADENCE-governed project's scaffold does not yet exist, or a practitioner wants a report on what an existing scaffold has and what diverges. Do not invoke to hand-edit an existing Constitution or Directives, to run the promotion gate, or to bind an external-tool adapter."
---

# `/cadence:init` — scaffold seeding

`/cadence:init` seeds the CADENCE method project scaffold (method §3.6, S-6): the shared
governance and structure every CADENCE-governed project inherits from its first commit,
so the practitioner does not hand-copy it (FR-1, US-1). Seeding is idempotent and never
clobbers existing governance (method §7 Phase 0 — *revise and align*, never overwrite).

## 1. Path convention — the two roots

`/cadence:init` runs with its working directory inside the **governed project**. The
plugin's packaged material is read from `<PLUGIN_ROOT>` (resolved below) and never from the
working directory, so the two are separate roots however the project is laid out. Every path
this file prints in backticks is therefore anchored to one of exactly two roots, decided by
its first segment:

| First segment | Anchored to | Meaning |
| --- | --- | --- |
| `skills/`, `.claude-plugin/`, `scripts/`, `agents/`, `hooks/` | `<PLUGIN_ROOT>` — the installed cadence plugin | Packaged material. Read only; never written. |
| `cadence/`, `artifacts/`, `./` | the governed project root — the working directory | What `/cadence:init` writes, plus the two repository-root files §5 probes for. |

There is no third root. No path in this file is relative to this file's own directory. A
path this file writes with an explicit `<PLUGIN_ROOT>/` prefix is already resolved and needs
no anchor; the table is for the first-segment form. Backticks are also used here for tokens
that are not paths — command words and command lines, JSON field names, report states — and
for two things that resemble a path without being one: a bare filename (`.gitkeep`,
`constitution.md`), which names a file inside the location its own sentence gives, and the
literal suffix `/skills/init/SKILL.md` that the resolution rule below strips off an absolute
path. Every remaining path here is governed by the table.

**The read boundary.** Inside the plugin, `/cadence:init` reads five locations and no
others: `skills/` (the §2 Source files and `skills/init/references/capability-report.md`),
`.claude-plugin/plugin.json` (the confirm step below), and — for the preflight alone
(§7) — `scripts/adapters/`, `agents/`, and `hooks/hooks.json`. Those last three are why
`scripts/`, `agents/`, and `hooks/` appear in the table above: the preflight that §3
step 2 mandates reads all three, so this boundary has to admit them. Inside the governed
project it reads three things: each §2 Destination — to decide whether it already exists,
and, for the two `governance`-class rows, to compare its content (§5); the two destination
parents §2 names (`cadence/`, `cadence/references/`), to decide whether §3 step 3 has to
create them; and the project root's own top-level listing, which is how §5 step 1 matches
`./constitution.md` / `./directives.md` case-insensitively before reading whichever it
finds. It reads nothing else, anywhere. The preflight additionally *runs*
`node --version` and each adapter module's exported `resolve()` (§7) — commands, not
further paths.

**Resolving `<PLUGIN_ROOT>`.** Resolve it once, before §3 step 2, and use that one absolute
value for every Source path in the run. Take the first of these that succeeds:

1. **From this file's own location.** This file is packaged at
   `<PLUGIN_ROOT>/skills/init/SKILL.md`, so `<PLUGIN_ROOT>` is its absolute path with the
   trailing `/skills/init/SKILL.md` removed. Use this whenever the runtime states where it
   loaded this skill from, or exposes an installed-plugin path of its own.
2. **From the practitioner.** Otherwise ask, once, for the installed cadence plugin's
   path, and record the answer in the report.

**Confirm before copying.** `<PLUGIN_ROOT>/.claude-plugin/plugin.json` must exist, parse as
JSON, and carry `"name": "cadence"`. If it does not, `<PLUGIN_ROOT>` is wrong: report all
seven `file` rows `skipped` (§7), still create the four `directory` rows (they have no
source), and stop. The report is still emitted, and its capability half reports the agent
and hook surfaces and all four adapter-bound roles `skipped`, with `<PLUGIN_ROOT>`
unconfirmed as the reason — an unobservable surface is never reported absent, because
absence is an observation this branch could not make (NFR-6). The command surface is present
by construction and Node needs no plugin path, so both still report normally (§7). Never
guess a plugin directory and copy from it, and never fall back to
the working directory — a bare `skills/...` path resolved against the governed project is
precisely the failure this section exists to prevent.

## 2. The seed set

Eleven rows, covering the full S-6 union. `kind` is `file` or `directory`. `class` is
`governance`, `reference`, `configuration`, or `structure`. Source paths resolve against
`<PLUGIN_ROOT>`; Destination paths resolve against the governed project root (§1).

| Source | Destination | Kind | Class |
| --- | --- | --- | --- |
| `skills/cadence-method/scaffold/constitution.md` | `cadence/constitution.md` | file | governance |
| `skills/cadence-method/scaffold/directives.md` | `cadence/directives.md` | file | governance |
| `skills/cadence-method/references/evidence-classes.md` | `cadence/references/evidence-classes.md` | file | reference |
| `skills/cadence-method/references/id-namespaces.md` | `cadence/references/id-namespaces.md` | file | reference |
| `skills/cadence-method/scaffold/manifest.json` | `cadence/manifest.json` | file | configuration |
| `skills/cadence-method/scaffold/gate-tiers.json` | `cadence/gate-tiers.json` | file | configuration |
| — | `cadence/draft/` (+ `.gitkeep`) | directory | structure |
| — | `cadence/candidate/` (+ `.gitkeep`) | directory | structure |
| — | `cadence/approved/` (+ `.gitkeep`) | directory | structure |
| — | `artifacts/` (+ `.gitkeep`) | directory | structure |
| `skills/cadence-method/scaffold/registrations.md` | `cadence/registrations.md` | file | configuration |

The two `reference`-class rows are copied **directly** from
`skills/cadence-method/references/` — there is no duplicate under
`skills/cadence-method/scaffold/`, so byte identity with the packaged source (AC-1.4) holds
by construction rather than by an invariant something else has to enforce. The four
`directory` rows each carry a zero-byte `.gitkeep` so version control retains an
otherwise-empty directory.

Two destination parents are **not** rows: `cadence/` and `cadence/references/` hold seeded
content rather than being seeded content, so they take no source and no `.gitkeep`. §3
step 3 creates each one that is absent, and §7 gives a `created` line to each one this run
actually created — on a second run both already exist, so neither takes a line.

## 3. The procedure

1. Resolve and confirm `<PLUGIN_ROOT>` (§1).
2. Run the preflight (§7, delegated to `skills/init/references/capability-report.md`).
3. Seed each row of §2's table, in table order. For the two `governance`-class rows, run
   the existing-governance detection (§5) **first**: when it finds the project's own file
   for that row — at the canonical destination *or* at the repository root — §5 reports the
   row and nothing is created for it. Otherwise, and for every other row: create the
   destination's parent directory if it is absent (`mkdir -p`), then apply the write
   rule (§4).
4. Emit the report (§7).

Step 3's `mkdir -p` is what makes the procedure executable in an empty directory: `cp`
does not create parents, and rows 1, 3, and 4 write beneath `cadence/` and
`cadence/references/` before any row has created them.

## 4. The write rule

For each row. The two `governance`-class rows reach this rule only when §5 found no
existing governance for them (§3 step 3); every other row reaches it unconditionally.

- **Destination does not exist** — create it and record `created <path>`. For a `file` row,
  creating it is the copy rule (§6). For a `directory` row it is `mkdir -p` on the
  destination plus its zero-byte `.gitkeep`; a `directory` row has no source and nothing to
  copy.
- **Destination exists** — write nothing and record `exists <path>`.
- **Overwrite** — happens only on an explicit, per-file practitioner confirmation, recorded
  with an actor and a reason (`P6`, FR-1). `/cadence:init` never overwrites silently.

This rule is what makes a second run idempotent by construction: nothing to create means
nothing is written, so every seeded file is byte-identical across runs.

## 5. Existing-governance detection

Applies to the two `governance`-class rows only (`cadence/constitution.md`,
`cadence/directives.md`), and runs before §4's write rule for those two rows (§3 step 3).

**Step 1 — find the project's own file for the row.** Take the first of these that exists:

1. the row's canonical destination — `cadence/constitution.md` or `cadence/directives.md`;
2. a repository-root file whose name matches `constitution.md` or `directives.md`
   case-insensitively — `./constitution.md`, `./directives.md` — at the governed project
   root's top level only, not searched recursively. That root is the working directory
   (§1); it is found by listing the working directory, not by asking version control where
   the repository begins, so this step runs the same in a directory that is not a
   repository at all (§8).

If neither exists, the row has no existing governance: hand it to §4, which creates it.
That is the only branch in which `/cadence:init` writes a `governance` row on its own
initiative; the other two ways one is ever written both require the practitioner to say so
first — §4's per-file overwrite confirmation, and step 3 below.

**Step 2 — compare, never replace.** With the file step 1 found:

1. `cmp -s` it against the packaged template
   (`skills/cadence-method/scaffold/constitution.md` or
   `skills/cadence-method/scaffold/directives.md`, resolved against `<PLUGIN_ROOT>` per §1).
2. Identical — record `exists (identical) <found path>`.
3. Different — record `exists (diverged from the CADENCE reference version <v>, packaged
   template revision <r>) <found path>`, taking both values from the packaged template's
   own opening blockquote, which carries a line for each. `<r>` is the actionable one,
   because the comparison just performed is `cmp` against that template revision, not
   against the method text; `<v>` names the method version that revision restates.
   Reconciliation is left to the practitioner (method §7 Phase 0); nothing is replaced.

**Step 3 — when the file found is the repository-root one**, the canonical destination is
not created either. A project whose Constitution or Directives sit at its repository root
already carries its own governance (AC-1.2); seeding a second copy under `cadence/` would
give it two and would pre-empt the reconciliation this section leaves to the practitioner.
The row's one report line names the file that was found — the root path — so `<found path>`
is never assumed to be the canonical destination and the practitioner can see exactly which
file the project is governed by. Seeding the packaged template at `cadence/constitution.md`
*alongside* a root file is then the practitioner's own explicit choice after reading the
report, not something this run makes on their behalf (`P6`).

Detection covers the canonical destination plus a case-insensitive repository-root
`constitution.md` / `directives.md` — step 1 probes both, in that order. **Stated limits:**
a Constitution or Directives file living anywhere else is not detected; no other directory
is searched, and the search is not recursive. When the canonical destination and a
repository-root file both exist, step 1 stops at the canonical destination — that is the
file the scaffold governs — and the root file is left uncompared and unreported.

## 6. The copy rule

Applies to the seven `file` rows, and to all seven identically — it is how §4 creates a
`file` row, so a row §4 does not create never reaches it either. The four `directory` rows
have no source and never reach this rule; §4 creates them directly.

Copy, never re-author and never customize: `cp "<PLUGIN_ROOT>/<Source>" "<Destination>"`,
then verify with `cmp` before recording `created`. All seven `file` rows are copied
byte-for-byte by this one rule — no row is templated, substituted into, or rewritten during
the run — so a copy that does not compare equal to its source is a defect, reported with
§7's `failed` state and never as `created`. Fill-in slots inside a seeded template (an empty
Directives row, a `<…>` slot in `cadence/registrations.md` or `cadence/manifest.json`) are
the project's to fill in afterwards; `/cadence:init` writes into none of them.

## 7. The preflight and the report

The preflight — which agent, hook, and command surfaces this runtime supports, and the
resolved versions of the four external-tool roles plus Node — is delegated in full to
`skills/init/references/capability-report.md`: what is reported, the call contract
(`/cadence:init` calls each adapter's `resolve()` and never probes an adapter-bound role
itself, R-2 — Node, which spec sheet §5 binds to no adapter role, is the single stated
exception and is checked directly, `capability-report.md` §(b) and §(d)), the record shape,
and the state-to-report-line rendering. §3 step 2 runs it; this section renders it.

The report, in order:

1. One line per seed-table row, in §2's table order, written as `<state> <path>` with
   `<state>` drawn from the closed vocabulary
   `created | exists | exists (identical) | exists (diverged …) | skipped | failed`.
   `<path>` is the
   file the state is about: for a `governance` row §5 resolved to a repository-root file,
   that is the root path, and the row's canonical destination was not created (§5 step 3).
   Each parent directory created on the way to a destination — `cadence/` and
   `cadence/references/` are the only two (§2) — takes its own `created <path>` line
   immediately before the row that needed it, including when a single `mkdir -p` creates
   both at once: AC-1.1 requires init to report each thing it created, and a silently
   created directory is unreported creation.
2. The capability report.
3. A stated-limits footer (FR-17).

`skipped` means the row was not attempted — for example `<PLUGIN_ROOT>` did not confirm
(§1), so no source was readable. A row that could not be attempted is reported `skipped`,
never `created` and never `exists` (NFR-6). `failed` is the other half of that rule and the
state §6 sends a bad copy to: the row *was* attempted and the copy did not compare equal to
its source, so it is reported `failed` and never `created`.

## 8. Hard rules

- **Explicit-path staging only.** `/cadence:init` never runs `git add -A` or `git add .`,
  and never `--force` or `--no-verify` (NFR-4). `/cadence:init` performs no git operation
  at all today — seeding writes files; it does not stage or commit them.
- **`/cadence:init` blocks nothing, anywhere.** This runtime puts automated blocking logic
  in exactly one place, the promote command's gate step; nothing here has a blocking path
  (D-2, FR-7).
- **No attempt directory under `artifacts/`.**
  `skills/cadence-method/references/artifact-layout.md` enumerates only two branches
  beneath `artifacts/<work-item>/` — one per phase, plus the gate's — and `<work-item>` is
  an open token (Q4). `/cadence:init` invents no path component there; it creates the
  `artifacts/` root only (§2's structure row).
- **The plugin tree is read-only to this command.** `/cadence:init` writes only under the
  governed project's `cadence/` and `artifacts/` roots (§1), never under `<PLUGIN_ROOT>`
  and never into a runtime configuration file the project already owns.

## 9. Stated limits

- The two seeded references keep their packaged `Source of truth` lines, which name paths
  inside the cadence plugin rather than the governed project. This is intentional: AC-1.4's
  byte-identity requirement is the stronger constraint, and rewriting those lines per
  project would break it. No other seeded file carries a path that resolves inside the
  plugin tree — each names its sources by title and section instead, resolvable without the
  plugin tree, and where one has to point at plugin-side material at all (the "Where the
  runtime looks" column of `cadence/registrations.md`) it describes the location in words
  rather than printing a path.
- The manifest field schema beyond the three AC-1.3 slots (`document_set.selection_rationale`,
  `document_set.documents`, `authority_document.current_version`) is WP 5.1's to fix. A
  companion-document row, once the project adds one, carries `path`, `type`,
  `upstream_dependencies`, `selection_rationale`, and `current_version` — documented here
  because JSON carries no comments, not enforced here.
- The AC-1.3 manifest validator (rejecting a zero- or two-authority-document manifest) and
  the tier-configuration validator are non-goals of this command (forthcoming — WP 5.1,
  WP 5.4). `/cadence:init` seeds the template; it checks no seeded file's content against a
  schema. The checks it does run are of other kinds — the `cmp` byte-comparisons §5 and §6
  specify, §1's `plugin.json` confirm step, and the tool-version checks the preflight
  performs on its own behalf (§7, `capability-report.md` §(d)–§(e)) — and a green run says
  nothing about whether a seeded file's *contents* satisfy any schema.
- Divergence detection (§5) covers the two `governance`-class rows only. A project that
  has edited its seeded `cadence/registrations.md`, `cadence/manifest.json`, or
  `cadence/gate-tiers.json` is reported `exists`, and nothing compares its content against
  the packaged template: §6's `cmp` runs only against a file this same run just copied, to
  prove the copy, so it never sees a file a project has since edited.

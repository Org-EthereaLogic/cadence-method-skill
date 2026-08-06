# Runtime Invocation Map — Claude Code and Codex

## 1. Provenance

> **Owner:** WP 1.5 (WBS 1.0), authorized by `docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md`.
> **Derived from:** D-1, D-2, D-5, D-6, FR-7, FR-16, NFR-1, NFR-3, NFR-6, A-2, R-3, R-5, S-8, and WBS 1.4, 2.1, 3.1–3.3, 4.1–4.6, 5.1, 5.3, 8.1 in the authority document; US-18, AC-18.1, and AC-18.3 in `docs/design/CADENCE_AUTOMATION_USER_STORIES.md`.
> **What this is not.** Not a governed document: it carries no metadata table and no revision record, and introduces no identifier (FR-10) — scope, requirements, and identifiers resolve in the authority document, not here. Not the Codex packaging: building `.agents/skills/`, `.codex/agents/*.toml`, and `.codex/hooks.json` content is WP 8.1 (forthcoming — WP 8.1); this map is the invocation-and-packaging mapping WP 8.1 builds against and re-verifies before building (D-5).
> **Evidence provenance.** Consulted 2026-08-05 UTC; the Claude Code claims below are corroborated against build v2.1.222 (darwin). The retained research transcript is `artifacts/job_20260805_0004/research_input.md` — cited here as a bare backticked path, never as a link, because `/artifacts/` is excluded by `.gitignore` and a `](path)` link to it would not resolve in a clone. The URLs in §3's citation register are therefore the citable primary source; the transcript is the retained record of when and how each was read.
> **Identifier note (FR-10).** This map introduces no identifier. Every design decision, requirement, work package, and story cited here is named exactly as the authority document or its companion names it.

## 2. Scope, status, and citation discipline

**Marking vocabulary**, used identically to every other verdict in this project:

- **VERIFIED** — the claim traces to one or more URLs in §3's citation register, read on the consultation date above.
- **UNVERIFIED** — live documentation does not settle the claim; it is recorded as an open item (§8) with what was tried, never asserted (NFR-6, D-6).
- A claim sourced only secondarily — from a page outside the consulted list — is **never asserted anywhere in this file**. Where it is recorded at all it is inside §8's explicitly labelled not-citable block; anything elsewhere that depends on it points back to that block and stays conditional rather than restating it as a finding (§8).

This map is a **dated snapshot** of runtime surfaces that move. WP 8.1 re-verifies every claim here against live documentation before building the Codex packaging (D-5, WBS 8.1), and any divergence that re-verification finds is recorded as an update to this map, not folded in silently.

**Citation-binding convention.** The research transcript binds sources to claims at three different granularities. This map reproduces the granularity it was given and never invents a finer one.

1. **A URL bound to a claim explicitly.** The 1024-versus-1,536 comparison (§10) carries a `Source` row naming one URL per column. This map reproduces that exact binding.
2. **A source *type* bound to a claim, with no URL at all.** The `claude plugin validate` doc-versus-local split (§11) prints no URL in the transcript; what it binds is a source *type* — documented behavior versus a local run against build v2.1.222 (darwin) and this repository. This map reproduces that type distinction, and where it prints a URL for the documented half it is attributing at **register level** (§3's subject-to-page assignment), not reproducing a per-claim binding the transcript makes. §11 says so at the point of use, and §12 records it as a stated limit.
3. **A source set listed for a whole part, with no per-claim binding.** For Part A the transcript lists five individual Claude Code URLs, and each claim below is attributed to the page §3's register names for that subject — register level again, not transcript level. For Part B the transcript lists the three Codex pages **only** as one brace-expansion source set, never as three individually spelled-out URLs, so every Codex-sourced claim below cites that set exactly as the transcript prints it. This map never splits, expands, or infers a narrower per-page URL the transcript does not itself spell out.

## 3. Citation register

The research transcript prints **seven** distinct `https://` strings, together naming **eight** consulted pages (five Claude Code pages individually, plus three Codex pages reached through one documented redirect pair).

| URL (as printed in the research transcript) | What it covers | Note |
| --- | --- | --- |
| `https://code.claude.com/docs/en/plugins-reference.md` | Plugin manifest, root component-directory rules, namespacing behavior, manifest-field validation | — |
| `https://code.claude.com/docs/en/skills.md` | Skill packaging, discovery-budget behavior, skill-listing description truncation | — |
| `https://code.claude.com/docs/en/sub-agents.md` | Agent-definition format, plugin-agent field restrictions | — |
| `https://code.claude.com/docs/en/hooks.md` | Hook packaging, hook types, the 33-event blocking/non-blocking classification | — |
| `https://agentskills.io/specification` | The portable Agent Skills spec's `description` field limit and its required-field list | — |
| `https://developers.openai.com/codex/{skills,subagents,config-advanced}` | The three Codex pages this map draws on: skills, agents/subagents, and advanced configuration (including hooks) | Issues a 308 permanent redirect (below) |
| `https://learn.chatgpt.com/docs/{build-skills,agent-configuration/subagents,config-file/config-advanced}` | The redirect target for the row above; this is what was actually read | 308 redirect target — see below |

**308-redirect note.** `developers.openai.com/codex/*` issues 308 permanent redirects to `learn.chatgpt.com/docs/*`; both are recorded in the transcript, and the redirect target is what was read. Because the transcript records these three Codex pages only as one brace-expansion source set rather than as three individually spelled-out URLs, every Codex-sourced claim in §§4–11 below cites this same pair of rows rather than an invented single-page URL — the citation-binding convention stated in §2.

## 4. Section 4.1 plugin layout — confirmed and corrected

One row per element, each carrying its own citation, per criterion 2's requirement.

| Element | Verdict | What the live documentation says | Citation URL | Consequence for cadence |
| --- | --- | --- | --- | --- |
| `.claude-plugin/` manifest | confirmed | Only `plugin.json` belongs in `.claude-plugin/`; "all other directories (`commands/`, `agents/`, `skills/`, `workflows/`, `output-styles/`, `themes/`, `monitors/`, `hooks/`) must be at the plugin root, not inside `.claude-plugin/`." A marketplace root reuses the same `.claude-plugin/` directory name to hold `marketplace.json`; the only-`plugin.json` rule is scoped to a *plugin* root, not a marketplace root. | `https://code.claude.com/docs/en/plugins-reference.md` | §4.1's placement of `.claude-plugin/` as the manifest-only directory is correct as written; no correction needed. |
| `skills/cadence-method/` | confirmed | `skills/` is a top-level plugin-root sibling directory, verified in docs and corroborated against shipped marketplace plugins. | `https://code.claude.com/docs/en/plugins-reference.md` | Correct as written. |
| `commands/` | corrected | Custom commands "have been merged into skills": a command file and a skill directory both produce the same command name and work the same way. The reference describes `commands/` as "Skills as flat Markdown files" and directs: "Use `skills/` for new plugins." `commands/` still works; it is the older of two supported surfaces. | `https://code.claude.com/docs/en/plugins-reference.md`, `https://code.claude.com/docs/en/skills.md` | Recorded as design divergence (a) in §9 — not decided here (non-goal). §4.1 places all ten practitioner actions under `commands/`, which remains a working target. |
| `agents/` | confirmed | `agents/` is named in the same plugin-root directory rule as `commands/`, `skills/`, and `hooks/`: it is a top-level sibling at the plugin root, never inside `.claude-plugin/`. | `https://code.claude.com/docs/en/plugins-reference.md` | Correct as written. This row is a *placement* claim, so it carries the page §3's register assigns the root component-directory rules; the *definition format* inside `agents/*.md` is a separate claim, carried in §6 and cited there to `https://code.claude.com/docs/en/sub-agents.md`. |
| `hooks/` | refined | The packaging unit is `hooks/hooks.json`, not a bare `hooks/` directory. Hooks may also be declared inline in `plugin.json`. | `https://code.claude.com/docs/en/hooks.md`, `https://code.claude.com/docs/en/plugins-reference.md` | §4.1's `hooks/` entry names the directory; WP 5.3 packages the file at `hooks/hooks.json` (or inline in `plugin.json`) rather than loose files in the bare directory. |
| Fuller documented root inventory | informational | The documented plugin-root inventory also names `workflows/`, `output-styles/`, `themes/`, `monitors/monitors.json`, `bin/`, `settings.json`, `.mcp.json`, and `.lsp.json` — a larger set than §4.1's sketch. | `https://code.claude.com/docs/en/plugins-reference.md` | None of these is used by cadence today; recorded so §4.1's sketch is read as a working subset, not the full documented surface. |
| Root-level `SKILL.md` auto-load | informational | A root-level `SKILL.md` is auto-loaded as a single skill when there is no `skills/` directory (from build v2.1.142). | `https://code.claude.com/docs/en/skills.md` | Not applicable to cadence today: the package uses `skills/cadence-method/SKILL.md`, not a root-level file. |
| `scripts/`, `fixtures/`, `drills/`, `docs/` | informational | These four §4.1 entries are repository organization paths, not component directories the documented plugin-root inventory names. | `https://code.claude.com/docs/en/plugins-reference.md` | Not a divergence — they are the repository's own layout, outside what a Claude Code plugin root specifies, and §4.1 does not claim otherwise. |

**Manifest-field findings (verified).** The manifest is **optional entirely**; if included, `name` is the **only required field** (a minimal valid manifest is `{ "name": "cadence" }`). `version` is **explicitly optional**, falling back to the git commit SHA when omitted — D-6's reasoning, now confirmed against live documentation rather than assumed. A CI caveat D-6 should carry: `claude plugin validate` warns on missing `version` and missing `author`, and `--strict` turns those warnings into `exit 1` — schema-optional and clean-under-`--strict` are different bars. **Field-error severity is split:** a type error on a *recognized* field is a hard load error, while an *unknown* top-level field is only a warning and the plugin still loads — so an unrecognized manifest key fails quietly rather than loudly, which is what WP 1.6's manifest and any WP 5.1 manifest check must expect. Component paths must be relative and start with `./`; `skills` **adds to** the default scan while `commands`/`agents`/`workflows` **replace** theirs. Cited to `https://code.claude.com/docs/en/plugins-reference.md`.

**Namespacing findings (verified automatic).** `/cadence:*` derives from the plugin `name` and is never declared. Three further behaviors: frontmatter `name` replaces only the last command segment (changed from build v2.1.216); a bare alias (e.g. `/review`) also works unless another command claims it; a marketplace entry name overrides the manifest name for namespacing. Consequence: `skills/cadence-method/SKILL.md` itself would acquire a `/cadence:cadence-method` command name under the **ordinary `skills/`-subdirectory naming rule** — a skill in a plugin `skills/` subdirectory takes its command name from its frontmatter `name`, or from its directory name as the fallback, namespaced by the plugin (`skills/review/SKILL.md` → `/cadence:review`). That is the same rule §5's ten-action table relies on, and **not** the root-`SKILL.md` auto-load behavior in the table above, which applies only when there is no `skills/` directory and is therefore not applicable to cadence. Recorded for WP 2.1 and WP 1.4, not decided here. Cited to `https://code.claude.com/docs/en/plugins-reference.md` and `https://code.claude.com/docs/en/skills.md`.

## 5. The ten practitioner actions — invocation map

The research verifies that a command file and a skill directory both produce the same command name and that the plugin name supplies the namespace automatically (§4's namespacing findings), so `/cadence:<action>` is the Claude Code invocation under **either** the `commands/` or the `skills/` packaging option named in §9(a) — only the packaged-file cell differs, and this table names both.

| Action | Claude Code invocation | Claude Code packaged file | Codex invocation | Codex packaged file | Notes |
| --- | --- | --- | --- | --- | --- |
| `init` | `/cadence:init` | `commands/init.md`; alt. `skills/init/SKILL.md` | `$cadence-init` (`@cadence-init` in ChatGPT); implicit selection; `/skills` listing | `.agents/skills/cadence-init/SKILL.md` | Packaged-file choice: §9(a) (undecided). |
| `frame` | `/cadence:frame` | `commands/frame.md`; alt. `skills/frame/SKILL.md` | `$cadence-frame`; implicit selection; `/skills` listing | `.agents/skills/cadence-frame/SKILL.md` | Packaged-file choice: §9(a). |
| `assess` | `/cadence:assess` | `commands/assess.md`; alt. `skills/assess/SKILL.md` | `$cadence-assess`; implicit selection; `/skills` listing | `.agents/skills/cadence-assess/SKILL.md` | Packaged-file choice: §9(a). |
| `innovate` | `/cadence:innovate` | `commands/innovate.md`; alt. `skills/innovate/SKILL.md` | `$cadence-innovate`; implicit selection; `/skills` listing | `.agents/skills/cadence-innovate/SKILL.md` | Packaged-file choice: §9(a). |
| `model` | `/cadence:model` | `commands/model.md`; alt. `skills/model/SKILL.md` | `$cadence-model`; implicit selection; `/skills` listing | `.agents/skills/cadence-model/SKILL.md` | Packaged-file choice: §9(a). |
| `implement` | `/cadence:implement` | `commands/implement.md`; alt. `skills/implement/SKILL.md` | `$cadence-implement`; implicit selection; `/skills` listing | `.agents/skills/cadence-implement/SKILL.md` | Packaged-file choice: §9(a). |
| `track` | `/cadence:track` | `commands/track.md`; alt. `skills/track/SKILL.md` | `$cadence-track`; implicit selection; `/skills` listing | `.agents/skills/cadence-track/SKILL.md` | Packaged-file choice: §9(a). |
| `gate` | `/cadence:gate` | `commands/gate.md`; alt. `skills/gate/SKILL.md` | `$cadence-gate`; implicit selection; `/skills` listing | `.agents/skills/cadence-gate/SKILL.md` | Standalone advisory run (FR-14, WBS 6.1); packaged-file choice: §9(a). |
| `promote` | `/cadence:promote` | `commands/promote.md`; alt. `skills/promote/SKILL.md` | `$cadence-promote`; implicit selection; `/skills` listing | `.agents/skills/cadence-promote/SKILL.md` | `--finalize` is a flag on this action (FR-6), not an eleventh action; packaged-file choice: §9(a). |
| `status` | `/cadence:status` | `commands/status.md`; alt. `skills/status/SKILL.md` | `$cadence-status`; implicit selection; `/skills` listing | `.agents/skills/cadence-status/SKILL.md` | Read-only report (FR-2); packaged-file choice: §9(a). |

**Notes carried by every row, not repeated per cell.** The three Codex invocation paths are VERIFIED (§3): explicit `$skill-name` (`@skill-name` in ChatGPT), implicit selection on the skill `description`, and the `/skills` slash-command listing in the CLI and IDE extension. The **per-action granularity and the concrete Codex skill names** (`cadence-init`, `cadence-frame`, …) are WP 8.1 packaging work following D-5's per-action deliverable, not a live-documentation claim — the map names the file-path shape only. The **bare-alias availability of any given action** (e.g. whether `/init` alone would also resolve) is unverified for cadence specifically; §4's namespacing finding only establishes that a bare alias works *unless another command claims it*, which this map cannot evaluate without the full installed command set.

**Codex skill packaging surface (verified).** The Codex packaged-file column above names the shape `.agents/skills/<name>/SKILL.md`. Three further verified facts fix what WP 8.1 actually assembles at that path and where the runtime looks for it — carried here because this map, not the gitignored research transcript, is the durable record WP 8.1 builds against.

- **Scan-path precedence, in the order the documentation gives it:** `$CWD/.agents/skills` → `$CWD/../.agents/skills` → `$REPO_ROOT/.agents/skills` → `$HOME/.agents/skills` → `/etc/codex/skills` → bundled. D-5's working model names repository skills under `.agents/skills/`, which is the third entry; the first two sit *ahead* of it, so a skill placed nearer the working directory takes precedence over the repository-root copy.
- **Skill directory structure:** `SKILL.md` is **required**; `scripts/`, `references/`, `assets/`, and `agents/openai.yaml` are **optional**. That is the documented inventory of a Codex skill directory and it is what WP 8.1 assembles per action; the optional `references/` slot is the natural landing place for the runtime references the Claude Code package already carries, if WP 8.1 maintains them from the Claude Code sources "where formats allow" as WBS 8.1 states.
- **Skill frontmatter:** `name` and `description` are **required**, and **no character limit is stated** for either. What Codex budgets instead is skill *discovery*, in aggregate rather than per field — see §10, which sets that budget beside the two Claude Code figures.

Cited to `https://developers.openai.com/codex/{skills,subagents,config-advanced}` → `https://learn.chatgpt.com/docs/{build-skills,agent-configuration/subagents,config-file/config-advanced}` (§2's convention, case 3).

## 6. Agents and hooks

| Surface | Claude Code | Codex | Citation |
| --- | --- | --- | --- |
| Agent definition | `agents/*.md`, YAML frontmatter. Only `name` and `description` are required; `tools` omitted inherits every subagent tool; `model` accepts `sonnet`/`opus`/`haiku`/`fable`, a full model ID, or `inherit` (default). `name` cannot contain `:` (reserved for plugin-scoped identifiers, enforced from build v2.1.218). Plugin agents support `name`, `description`, `model`, `effort`, `maxTurns`, `tools`, `disallowedTools`, `skills`, `memory`, `background`, `isolation` (only `worktree` is legal) — and do **not** support `hooks`, `mcpServers`, or `permissionMode`, for security reasons. | `.codex/agents/*.toml`, one agent per file, project-scoped (`.codex/agents/`) or personal (`~/.codex/agents/`). Required: `name`, `description`, `developer_instructions`. Optional: `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, `skills.config`. Built-ins `default`, `worker`, `explorer`; a custom agent whose name matches a built-in **takes precedence over it** — a live collision hazard for cadence agent naming. | `https://code.claude.com/docs/en/sub-agents.md`; `https://developers.openai.com/codex/{skills,subagents,config-advanced}` → `https://learn.chatgpt.com/docs/{build-skills,agent-configuration/subagents,config-file/config-advanced}` |
| Agent invocation by name | `plugin:agent`, from the same automatic namespacing as commands (§4). | **Undocumented** — the Codex page describes agents as "loaded as configuration layers for spawned sessions" without an invocation syntax. See open item in §8; FR-16's inline-dispatch fallback is the recorded mitigation if no named-invocation surface exists. | Same Codex source pair as above. |
| Hook packaging | `hooks/hooks.json` at the plugin root, or inline in `plugin.json`. Hook types: `command`, `http`, `mcp_tool`, `prompt`, `agent`. 33 documented events; blocking is known per event — for example `PreToolUse` can block (exit 2 takes effect) and `PostToolUse` cannot. | `.codex/hooks.json`, or inline `[hooks]` in `.codex/config.toml` (also `~/.codex/hooks.json` / `~/.codex/config.toml` for the personal layer). **Project-local hooks load only when the project's `.codex/` layer is trusted** — a precondition D-5 omits. A hook carries `command` and `timeout`; `matcher` filters tools (e.g. `matcher = "^Bash$"`). | `https://code.claude.com/docs/en/hooks.md`; same Codex source pair. |
| Hook semantics (event list, enablement, blocking-vs-advisory) | VERIFIED — carried by the hook-packaging row directly above in this table: 33 documented events, with blocking known per event (`PreToolUse` can block; `PostToolUse` cannot). | Three surfaces the official Codex page does not settle. See §8's three Codex hook open items. | `https://code.claude.com/docs/en/hooks.md`; same Codex source pair. |

## 7. Unavoidable divergences

Documented explicitly here so none is silent, per criterion 4.

| Divergence | Claude Code | Codex | Consequence |
| --- | --- | --- | --- |
| Namespaced commands (lead divergence) | The `/cadence:*` namespace derives automatically from the plugin name and is never declared (§4). | Codex has no per-skill namespaced equivalent — only explicit `$skill-name`, implicit selection on `description`, and the `/skills` listing (§3, §5). | Binds WP 8.1 and AC-18.1: the packaging maps each action to Codex's three invocation paths rather than to a namespace that does not exist there; canonical action names are preserved in evidence regardless (AC-18.3). |
| Agent definition format and field names | `agents/*.md`, YAML frontmatter, the field set in §6. | `.codex/agents/*.toml`, a disjoint required-field set (`developer_instructions` has no Claude Code equivalent). | Binds WP 8.1 and AC-18.1: agent content is authored once and packaged twice in each format, per D-3's reuse-don't-rebuild pattern where the formats allow it. |
| Hook configuration path, plus the Codex trust precondition | `hooks/hooks.json` or inline in `plugin.json`; no trust gate beyond the plugin's own installation. | `.codex/hooks.json` or inline `[hooks]`; loads only when the project's `.codex/` layer is trusted (§6) — a precondition D-5's working model omits. | Binds WP 8.1, AC-18.1, and R-3 (runtime capability variance): a Codex hook that would fire under Claude Code may silently not load under Codex until the project layer is trusted. |
| A write-triggered advisory hook may have no Codex equivalent at all | Achievable by binding to a non-blockable event such as `PostToolUse` (§6, §9(b)). | **Unknown**, conditional on §8's open item 3 (blocking-vs-advisory semantics) and the not-citable secondary-source suggestion named there. Stated conditionally because its premise is unverified, not because the divergence itself is in doubt if the premise holds. | Binds WP 5.3, WP 8.1, and AC-18.1; compounds with §8's item 3 as recorded there. |

## 8. Open items

Recorded rather than asserted, per D-6 and NFR-6.

| Item | What is unverified | What was tried | Where it resolves |
| --- | --- | --- | --- |
| Codex hook — full event list | unverified — only `PreToolUse` is enumerated concretely on the official page; the page refers to a "current event list" without reproducing it. | Consulted the Codex configuration/hooks source page (§3's Codex pair). | WP 8.1 re-verifies before building Codex hooks; compounds with §7's conditional divergence. |
| Codex hook — explicit enablement key | unverified — no enablement key is named anywhere on the official page. | Same source consulted; no enablement mechanism documented. | WP 8.1. |
| Codex hook — blocking-vs-advisory semantics | unverified — not described at all by the official page. | Same source consulted. | WP 8.1; interacts directly with D-2 and FR-7's advisory-by-construction requirement — see the closing note below. |
| Codex custom-agent invocation syntax | unverified — how a user invokes a named custom agent is not documented; the page states agents are "loaded as configuration layers for spawned sessions" without giving an invocation syntax. | Consulted the Codex subagents source page (§3's Codex pair). | WP 8.1; FR-16's inline-dispatch fallback is the recorded mitigation if no named-invocation surface exists. |

### Secondary-source material — not citable, never asserted (D-6, NFR-6)

The research transcript separately preserves secondary-source suggestions that are explicitly **not citable** under D-6 and NFR-6, kept only to make the three Codex hook open items above specific enough for WP 8.1 to close later: a suggested enablement key `codex_hooks = true` under `[features]`; a suggested event subset naming `SessionStart`, `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, and `Stop`; and a suggestion that `PreToolUse`/`PostToolUse` fire for Bash-tool calls only. **None of these three suggestions is asserted anywhere in this map — not in this paragraph, and not outside it.** That containment, not exclusivity of mention, is the property D-6 and NFR-6 require, and it is mechanically checkable by mutation: inject an assertion of any of the three outside this labelled block and the containment check turns red; the file as written is green. Two places refer back here without promoting anything — the closing note below, which names the Bash-only suggestion only to state a conditional that stays conditional, and §7's fourth divergence row, which points here without restating it. Each of the three stays open until WP 8.1 verifies it against live documentation.

**Closing note — why item 3 compounds the WP 5.3 finding.** If the Bash-only suggestion above were confirmed, a write-triggered advisory hook (§7, §9(b)) would have no Codex equivalent at all, because a file write never passes through Bash — an unavoidable divergence under criterion 4's test, not merely an open item. And if Codex hooks can in fact block, "advisory-only by construction" becomes a contract cadence must enforce on that runtime rather than inherit from the platform. Neither is assertable today; both are recorded, scoped, and named as open items rather than as findings.

## 9. Design divergences recorded for the WP 1.4 freeze

Recorded here as questions, exactly as the research surfaced them. **This map records both; it decides neither** — that is a non-goal of WP 1.5.

**(a) `commands/` versus `skills/` for the ten practitioner actions.** §4 confirms that custom commands have been merged into skills at the runtime level and that the live documentation now directs new plugins to `skills/`; §4.1 currently places all ten actions under `commands/`, which remains a working target. This bears on WP 3.1, 3.2, and 4.1 through 4.6, and — per §5 — the invocation string (`/cadence:<action>`) does not change either way; only the packaged-file path does. Options: keep `commands/*.md` (matches §4.1 as written; the older of the two supported surfaces); move to `skills/<action>/SKILL.md` (matches current live-documentation guidance for new plugins). Consequences of each are named in the rows above. WP 1.5 records this divergence; **WP 1.4 decides it.**

**(b) WP 5.3's Draft-zone pre-write annotation hook and its blocking classification.** A pre-write interception is `PreToolUse`, which §6 verifies is in the **can-block** event list. As designed, that hook would be advisory only by convention, not by construction, contradicting D-2 and FR-7's stated structural guarantee. `PostToolUse` (matcher `Write|Edit`) is non-blockable and would satisfy D-2 structurally, at the cost of annotating *after* the write rather than before. Options: keep the pre-write design and accept a convention-level (not construction-level) advisory guarantee; move to a post-write `PostToolUse` binding and satisfy D-2 structurally with after-the-fact annotation; a third option — do nothing until WP 8.1 resolves §8's Codex hook semantics, since a Codex parity decision may bear on which Claude Code design WP 5.3 should carry — is named here without being evaluated. WP 1.5 records this divergence; **WP 1.4 decides it.**

Neither divergence is registered as a new `Q` identifier: doing so would require editing §7 of the authority document, a second edit beyond the one Revision Record row this change's criterion 8 scopes it to (FR-10 also requires an identifier's definition to land in the same change that introduces it). WP 1.4 may register either under the next free `Q` numbers when it resolves them.

## 10. The 1024-versus-1,536 resolution

This closes the open verification item the authority document's v1.8 Revision Record row named for WP 1.5. **Both figures are correct; they measure different quantities in different systems.**

| | 1024 | 1,536 |
| --- | --- | --- |
| System | Agent Skills spec (portable standard) | Claude Code runtime |
| Measures | `description` field **alone** | `description` **plus** `when_to_use`, combined |
| Mechanism | Hard validation limit — packaging fails above it | Silent **truncation** in the skill listing |
| Configurable | No | Yes — `skillListingMaxDescChars` |
| Source URL | `https://agentskills.io/specification` | `https://code.claude.com/docs/en/skills.md` |

**WP 2.1's stated 1024 is correct for spec-portable packaging and needs no correction.** The 1,536 figure is correct for Claude Code's listing-truncation behavior, a different and larger measurement over a different field combination.

Two portability findings that follow: in Claude Code, `name` and `description` are **not** required ("All fields are optional. Only `description` is recommended") — contradicting the spec's "Required: Yes" for both; outside Claude Code, only spec fields are allowed, and including a field the spec does not allow makes packaging or upload fail with a hard error. A local-run finding: **no local tooling gate exists on description length** — a 1,500-character description passed `claude plugin validate` clean, with no error, no warning, and no truncation notice.

### The Codex side of the same question (verified)

Without this, the resolution above is one-sided: it settles two Claude-Code-side figures and says nothing about the second runtime cadence packages for.

**Codex states no character limit on skill frontmatter at all.** `name` and `description` are required (§5) and no figure is given for either. What Codex budgets instead is skill **discovery**: at most **2% of the model's context window, or 8,000 characters when the context window is unknown**. That budget is applied to the **initial skill listing, before selection**, and is **shared across every installed skill**; the full `SKILL.md` loads only on use. The research transcript labels this figure **direct NFR-1 input** — the one finding in the record explicitly tagged to the context budget NFR-1 governs.

| | 1024 | 1,536 | Codex skill discovery |
| --- | --- | --- | --- |
| System | Agent Skills spec | Claude Code runtime | Codex runtime |
| Measures | one skill's `description` | one skill's `description` + `when_to_use` | the initial listing across **all installed skills**, before selection |
| Stated as | hard validation limit | listing truncation, configurable | a discovery budget: 2% of the context window, or 8,000 characters when it is unknown |
| Per skill or shared | per skill | per skill | **shared** |
| Source | `https://agentskills.io/specification` | `https://code.claude.com/docs/en/skills.md` | Codex source pair (§3) |

**Consequence for WP 8.1 and NFR-1.** The Codex figure is the structural analog of the 1,536 figure — both are discovery-time budgets rather than per-field packaging limits — but it differs on the axis that binds packaging: it is **shared, not per skill**. The ten `cadence-*` Codex skill descriptions in §5's table therefore draw on one budget together, alongside every other skill the user has installed. Ten descriptions each comfortably inside the 1024-character spec limit can still add up to a large fraction of an 8,000-character listing budget, so WP 8.1 sizes the *set*, not each description alone, and NFR-1's context accounting has to carry the Codex listing as well as the Claude Code one. This map records the figure and the consequence; it does not set a per-description budget, which is WP 8.1 and WP 2.1 packaging work.

Cited to `https://developers.openai.com/codex/{skills,subagents,config-advanced}` → `https://learn.chatgpt.com/docs/{build-skills,agent-configuration/subagents,config-file/config-advanced}` (§2's convention, case 3).

## 11. What `claude plugin validate` actually checks

**Documented claim.** The docs state it checks `plugin.json`, skill/agent/command frontmatter, and `hooks/hooks.json` for syntax **and schema** errors.

**Local divergence.** For `plugin.json` and `hooks/hooks.json`, schema checking is real. For skill, agent, and command frontmatter, only **YAML parseability** plus two presence checks (a missing frontmatter block; a missing `description`) are enforced. A purpose-built agent file carrying four simultaneous schema violations in otherwise well-formed YAML — an invalid `name` containing spaces, a non-existent `model` value, an `isolation` value outside the single legal one, and an unknown field — produced **zero findings and exit 0**.

**The finding that matters.** That same test fixture also declared `permissionMode: bypassPermissions`, an unsupported field for plugin-shipped agents (§6). The field **validated clean and was silently ignored at runtime**, because plugin agents do not support it at all — the frontmatter field is data describing a validator gap, not an instruction, and nothing in this map or in the run that produced it acted on it as one.

**Consequence for cadence.** `claude plugin validate` cannot serve as the agent-frontmatter gate. If WP 5.1 needs that guarantee, cadence must supply its own validator; `make plugin-validate` is already marked "not a gate" in `CLAUDE.md`, and this confirms why.

**Opposite-direction divergence.** The validator emits a `CLAUDE.md`-at-plugin-root warning that the published docs never say it emits — independently reproduced against this repository, confirming the claim already recorded in `CLAUDE.md`. The doc source covers the general behavior; the local run is the source for the validator's own message text.

**Exit codes.** Warnings-only input: `exit 0`. The same input under `--strict`: `exit 1`. Hard errors: `exit 1`.

**Sourcing, stated precisely.** The research transcript prints **no URL** for this finding; what it binds is a source *type* — documented behavior versus a local run — so this section reproduces that type split rather than a per-claim URL binding it was not given (§2's convention, case 2). The documented claim above is attributed at **register level** to `https://code.claude.com/docs/en/plugins-reference.md`, the page §3's register assigns manifest and manifest-field validation to. Every divergence recorded in this section, the exit-code behavior, and the validator's own message text come from the **local run** against build v2.1.222 (darwin) and against this repository, not from a page.

## 12. Stated limits

What this map does **not** settle, published alongside what it does (FR-17 discipline, extended to a specification the same way `artifact-layout.md` and `docs/validator-spec-sheet.md` extend it).

- **This map is a dated snapshot.** No live-documentation access existed at authoring time; the research transcript at `artifacts/job_20260805_0004/research_input.md` is the sole source for every live-documentation claim above.
- **Codex hook semantics, enablement, and the full event list remain unresolved** (§8, items 1–3).
- **The Codex custom-agent invocation syntax remains unresolved** (§8, item 4).
- **Both design divergences in §9 remain undecided** — that is by design, not an omission; WP 1.4 decides them.
- **Page-level citation binding is register-level, not transcript-level, in two places** (§2's convention, cases 2 and 3). For the three Codex pages the transcript names only one brace-expansion source set, so every Codex-sourced claim cites that same set rather than an invented single-page URL. For Part A claims the transcript does not bind to a page — including the `claude plugin validate` findings (§11), where it binds a source *type* and prints no URL — the page attribution is this map's own subject-to-page assignment from §3's register. Both are stated where they apply and neither is presented as a per-claim binding the transcript makes.
- **`CONTRIBUTING.md` still calls the `commands/`-versus-`skills/` choice a WP 1.5 determination**, while this map records it for the WP 1.4 freeze instead (§9(a)). `CONTRIBUTING.md` lies outside this change's write scope (`policy.allowed_paths`), so the drift is recorded here rather than corrected there.
- **§4.1 is superseded on the points this map corrects, by operation of its own supersede clause** — "the verified map supersedes this sketch" — with no edit made to §4.1 itself; that is an explicit non-goal of this work package.

## 13. Mechanical self-check recipe

What a reviewer or the test phase can run with only `grep`; it needs no network access.

```bash
MAP=docs/runtime-invocation-map.md
RESEARCH=artifacts/job_20260805_0004/research_input.md

# (a) Ten action rows in §5's table.
grep -cE '^\| `(init|frame|assess|innovate|model|implement|track|gate|promote|status)`' "$MAP"

# (b) Every https:// URL printed in the map's prose (fenced blocks, including this one,
#     stripped first so this recipe's own example pattern cannot self-flag) appears
#     verbatim in the research transcript. Silence means every citation traces to the
#     primary source; any printed line is a defect.
awk '/^```/{c=!c;next} !c' "$MAP" | grep -oE 'https://[^ )`|]+' | sort -u | while read -r url; do
  grep -qF "$url" "$RESEARCH" || echo "UNCITED  $url"
done

# (c) Every open-item row in §8 carries a non-empty "what was tried" cell (fourth column).
awk -F'|' '
  /^\| Codex (hook|custom-agent)/ {
    tried = $4; gsub(/^[ \t]+|[ \t]+$/, "", tried)
    if (tried == "" || tried == "-") print "EMPTY-TRIED  " $0
  }
' "$MAP"
```

(a) returns `10`; (b) and (c) print nothing when the map is well-formed. Note this recipe reads `$RESEARCH` from the job evidence tree, which is present during this job's own run but is gitignored and not part of a bare clone — the same scope the research transcript itself carries.

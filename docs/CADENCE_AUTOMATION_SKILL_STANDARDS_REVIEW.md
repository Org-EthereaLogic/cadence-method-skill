# CADENCE Method Automation — Agent Skills Standards Conformance Review

**A benchmark of the cadence-method skill design against the industry standards for authoring agent Skills**

| | |
| --- | --- |
| **Author** | Anthony Johnson II |
| **Readers** | The practitioner directing the build, and the coding agents implementing it |
| **Status** | v1.0 — the design conforms to the core standard; three authoring disciplines (G1, G3, G4) were adopted into the Project Plan & WBS at v1.5, and two (G2, G5) are retained here as advisory |
| **Date** | 2026-08-04 UTC (see the Revision Record) |
| **Governing method** | `CADENCE_METHOD.md` v4.7 (`work-product/aim-it-agentic-engineering-method/`) |
| **Authority document** | `CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md` — this review references its identifiers and defines none |
| **Scope** | A point-in-time review of the cadence-method skill design (the Project Plan & WBS and its declared companion user stories) against the Anthropic and OpenAI Agent Skills authoring standards. Non-normative: it records findings and recommendations; the authority document governs what was adopted. |

**Nature of this document.** This is a review, not a governed planning artifact. It references `FR-`/`NFR-`/`SC-`/`WP`/`D-` identifiers that resolve through the authority document and introduces none of its own. It is deliberately unmarked, matching the rest of the planning set.

---

## 1. Sources

Three references, all retrieved 2026-08-04:

- **Anthropic — Skill authoring best practices** (`platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices`) — the authoritative SKILL.md guide.
- **OpenAI — Build skills** (`learn.chatgpt.com/docs/build-skills.md`, reached from `developers.openai.com/codex/skills`) — OpenAI's developer authoring guidance.
- **OpenAI Academy — Skills resource** (`academy.openai.com/public/clubs/work-users-ynjqu/resources/skills`) — workplace-oriented "what and why, plus how to build a SKILL.md."

A fourth link was considered and set aside: `openai.com/academy/skills/` is an educational catalog about human AI-upskilling, a different sense of "skills," not an authoring standard.

Both vendors have converged on the same construct — a skill directory with a `SKILL.md`, YAML frontmatter (`name`, `description`), and progressive disclosure into bundled files — so "industry standard" here is largely unambiguous.

## 2. Verdict

The design is strongly aligned with the core of the standard. The gaps are authoring-time disciplines the plan had not yet pinned — chiefly the `description` — plus one debatable structural question (composability). None require a redesign. Because the design is still at the planning stage, several findings are requirements to bake into authoring (WP 2.1/2.2, the 7.x drills) rather than defects to fix.

## 3. Where the design already meets the standard

| Best practice (Anthropic / OpenAI) | Design element |
| --- | --- |
| Progressive disclosure; SKILL.md under 500 lines; references one level deep | NFR-1, WP 2.1/2.2 (`SKILL.md` < 500 lines, detail pushed to `references/`) |
| Concise — add only what the model lacks | `P4` proportionality; NFR-1 (no framework dependencies) |
| Provide utility scripts; prefer scripts only where determinism or external tools are needed | `scripts/validators/` as standalone single-file scripts emitting `pass\|warn\|fail`, no LLM (FR-8, AC-12.1); instruction-style phase agents otherwise |
| Feedback loops; verifiable intermediate outputs (plan → validate → execute) | Append-only evidence tree with a report script computing the verdict (FR-14, US-15) |
| Declare dependencies; do not assume tools installed; no network for core validators | NFR-3 (Node ≥ 20, preflight, degrade closed; core validators need no network) |
| Solve, don't defer; no voodoo constants; honest error handling | NFR-6 honest degradation; reproducible NFR-2 budgets |
| Iterate with a fresh instance ("Claude B") | WP 2.0 exit: a fresh agent given only `SKILL.md` + references states the correct next action |
| Regression evaluations as source of truth | WP 5.2 frozen per-validator fixtures, byte-for-byte in local CI |
| Consistent terminology | D-5 canonical names preserved in all evidence |
| Match degrees of freedom to task fragility | Low-freedom deterministic gate vs. structured-but-flexible phase agents |
| Valid `name` (lowercase/hyphens, ≤ 64 chars, no reserved words) | `cadence-method` (noun phrase, an accepted alternative to the gerund form) |
| Plugins are the vehicle for distributing beyond one repo / bundling with connectors | Release 1 packages as the Claude Code plugin `cadence` (§4.1) |

## 4. Gaps and recommendations

### G1 — Pin the `description` discipline — **adopted (plan v1.5, WP 2.1)**

The `description` is the single lever that decides whether the skill ever activates, and all three sources stress it. WP 2.1 previously said only "trigger description." It now requires a third-person `description` that states what the skill does and both when to and when not to invoke it, front-loads the trigger terms, and stays within the 1024-character frontmatter limit.

### G2 — Keep `SKILL.md` a thin orchestrator, not a mega-procedure — **advisory**

Both OpenAI sources favor "small building blocks you can mix and match, rather than one massive end-to-end skill." The cadence-method skill is a large end-to-end construct, but it is packaged as a plugin bundling one focused skill plus commands, references, and validators — the vehicle OpenAI itself prescribes — and NFR-1 already forces phase logic into per-phase commands and references. The design therefore sits in a defensible middle. Notably, this standard cuts *against* the earlier over-engineering audit's "collapse to one orchestrator plus one agent": the standard favors decomposition, not collapse. The real watch-item is `SKILL.md` bloat — it must stay locate-and-dispatch and never restate phase procedure that belongs in `references/` or a command. Recorded as a watch-item, not a plan change.

### G3 — Add model-tier coverage to testing — **adopted (plan v1.5, WP 7.1/7.4)**

Anthropic's checklist wants a skill tested with the models it will run under (Haiku, Sonnet, Opus). The plan tested Claude Code plus Codex parity but not across model sizes. WP 7.1 now repeats the end-to-end drill across the model tiers the skill is intended to run under (the `SKILL.md` and phase-agent surfaces are model-sensitive; the deterministic validators are not), and WP 7.4 records the tiers covered.

### G4 — Reference tables of contents and execute-vs-read intent — **adopted (plan v1.5, WP 2.1/2.2)**

Two small authoring conventions from Anthropic: any reference file over 100 lines opens with a table of contents so partial reads still see full scope (WP 2.2), and `SKILL.md` marks each bundled script as run-to-execute versus read-as-reference (WP 2.1).

### G5 — Name the evaluation rubric earlier — **advisory**

Anthropic recommends defining evaluations before extensive documentation. The plan front-loads references and validators, with end-to-end drills last at 7.0 — though the frozen validator fixtures (5.2) already serve as unit-evals. Naming the acceptance-drill scenarios at design-freeze (WP 1.4) would let them steer the build; the plan's `P2` evidence-first ethos is already compatible. Recorded as advisory; not a rework.

## 5. On composability (the one genuinely debatable point)

The tension in G2 is worth stating plainly because two credible critiques point in opposite directions. The OpenAI "small building blocks, not one massive skill" principle argues for *more* decomposition; the earlier internal over-engineering audit argued for *less* (collapse the ten agents into one orchestrator plus one review agent). The design's actual shape — a plugin that bundles a thin orchestrator skill, six phase commands and agents, verification agents, advisory hooks, and deterministic validators, with progressive disclosure through `references/` — is a reasonable midpoint that neither critique clearly overrides. The standards endorse the plugin-as-distribution-vehicle and the sub-500-line orchestrator; they do not mandate exploding the method into independent skills or collapsing it into one. The one durable obligation is to keep `SKILL.md` itself lean, which NFR-1 already encodes.

---

## Appendix — Revision Record

Rows are history: they record what was true when written, are excluded from version bumps, and are never rewritten.

| Version | Date | Change |
| --- | --- | --- |
| v1.0 | 2026-08-04 | Initial review. Benchmarked the cadence-method skill design (Project Plan & WBS and companion user stories at v1.4) against the Anthropic and OpenAI Agent Skills authoring standards. Found strong alignment with the core standard and five recommendations (G1–G5). G1 (description discipline), G3 (multi-model drill coverage), and G4 (reference tables of contents; execute-vs-read script intent) were adopted into the authority document at v1.5, refining WP 2.1/2.2 and the 7.x drills; G2 (keep `SKILL.md` a thin orchestrator) and G5 (name the evaluation rubric earlier) are retained here as advisory. This review references the authority document's identifiers and defines none. |

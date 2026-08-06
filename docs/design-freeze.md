# Design Freeze — CADENCE Method Automation, M1

**The WP 1.4 freeze note for release 1 (WBS 1.0–7.0)**

> **DRAFT — NOT SIGNED.** This note is prepared for the operator's signature. It is not in force until §7 carries a
> signature, an actor, and a UTC date. One criterion is **not yet met** — see §3, which blocks signing. Everything
> else below is recorded with the evidence that establishes it.

| | |
| --- | --- |
| **Work package** | WP 1.4 — Design freeze (operator checkpoint, A-4) |
| **Milestone gate** | M1 |
| **Authority document** | `docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md` v1.14 |
| **Declared companion** | `docs/design/CADENCE_AUTOMATION_USER_STORIES.md` v1.9 |
| **Governing method** | `CADENCE_METHOD.md` v4.7 (final), vendored read-only under `docs/reference/source/` |
| **Prepared** | 2026-08-06 UTC |
| **Status** | Draft — awaiting §3 and the §7 sign-off |

**What this note does.** It records the state the design is frozen in: which references were verified against the
method and how, which runtime surfaces were verified against live documentation, how each open question was
resolved, and that no open design question remains unrecorded. Once signed it gates the build work that WBS 5.0 and
WBS 1.6 do not already carry — per the authority document's Status row, everything other than those two remains
gated on this signature.

**What this note is not.** It is not a re-statement of the plan, and it defines no identifier. Where it names a
requirement, decision, or question, the authority document holds the canonical definition (FR-10).

---

## 1. Freeze scope

| Item | Frozen at |
| --- | --- |
| Requirements (`FR-`, `NFR-`) | authority document v1.14 |
| Scope (`S-`, `X-`) | authority document v1.14, including S-4 as restated by Q6 |
| Success criteria (`SC-`) | authority document v1.14 |
| Design decisions (`D-`) | authority document v1.14, D-5 as corrected at v1.10 |
| Conflict resolutions (`CR-`) | authority document §10, CR-1 through CR-3 |
| User stories and criteria (`US-`, `AC-`) | companion v1.9, including AC-11.1 as restated by Q6 |
| Work breakdown (`WP n.n`) | authority document §8 |
| Runtime surfaces | `docs/runtime-invocation-map.md`, WP 1.5 |

Later change to any frozen item lands as an appended Revision Record row in the owning document, never as a silent
edit (R-4, FR-12).

---

## 2. Method integrity — VERIFIED

The vendored method snapshot is unmodified. `scripts/guardrails-check.sh` check 3 compares each vendored file
against the blob hash pinned in `docs/reference/source/README.md`, and all three match as of this note:

| File | Pinned `git hash-object` blob hash | Result |
| --- | --- | --- |
| `CADENCE_METHOD.md` | `a31bd491cb8d669265989efa3e37e680382ec130` | matches |
| `CADENCE_METHOD_OUTLINE.md` | `fdf9b656961cb8e40602145e9f04e696bf20983f` | matches |
| `CADENCE_METHOD_REVIEW.md` | `2aa9187a8c7de93b410af78190e3cba980906a1f` | matches |

`make check` reports 15 passed, 0 failed, 0 skipped. The method this freeze is taken against is therefore the
v4.7 text as vendored, and D-4 holds: where a runtime reference and the method disagree, the method governs.

---

## 3. References verified against method v4.7 section by section — **NOT YET PERFORMED**

**This criterion is not met, and it is the one item blocking signature.**

What exists today is *structural* verification, not section-by-section content verification. WP 1.1 (issue #2,
PR #44) checked that each reference file exists, contains the structural elements named in its acceptance
criteria — a section per phase, the three zones and two blocking boundaries, the §3.2 prefix table, each gate check
mapped to a tier — and names the method version it distills. That is a real check and it passed. It is not the
same as reading each reference against the method sections it claims to distill and confirming the distillation is
faithful, which is what this criterion asks for.

Two further facts bear on it:

- The six references carry **`Status: Draft reference (WBS 1.1)`** in their own headers, and name **WP 2.2** as the
  package that finalizes them. A freeze may legitimately be taken over draft references, but the note should not
  describe them as verified beyond what was done.
- No retained evidence records a section-by-section pass. The only retained drill is `drills/wp-1.6-guardrails/`,
  which exercises this repository's own check surface, not the references.

Each reference declares the sections it distils, so the comparison is well defined:

| Reference | Declares it distils |
| --- | --- |
| `phase-definitions.md` | method §2, §§2.1–2.6 |
| `zone-lifecycle.md` | method §6, §6.1 |
| `evidence-classes.md` | method Appendix A |
| `id-namespaces.md` | method §3.2 |
| `gate-checks.md` | method §6.1, §3.5 |
| `artifact-layout.md` | method §3.4, §3.5 (`P5`) |

**To meet this criterion**, each row must be read against its named method sections and the result recorded — pass,
or a list of discrepancies. Per NFR-6 a check that was not run is `skipped` and is never counted as passed, so this
section stays as written until that pass exists. `evidence-classes.md` is the one row already fully discharged, by
§4 below.

---

## 4. Appendix A extract confirmed byte-identical — VERIFIED (AC-1.4)

`skills/cadence-method/references/evidence-classes.md` reproduces method Appendix A byte-for-byte. Compared on
2026-08-06 UTC, from the `## Appendix A` heading through the closing two-rules paragraph, excluding the document
separator that follows the appendix in the method source:

| | SHA-256 of the compared block |
| --- | --- |
| Method Appendix A | `159c58dad8c7727f0cc033d0c67ab880a15f766ddab802db002b71df8cdd9dea` |
| Reference extract | `159c58dad8c7727f0cc033d0c67ab880a15f766ddab802db002b71df8cdd9dea` |

Identical, 21 lines each. The closed set carries exactly **eleven** classes, and all three non-date parameters —
`Speaker`, `Employer`, `key` — are present.

**Stated limit.** This verifies the extract vendored in the skill. AC-1.4 as written in the companion is about the
reference **`/cadence:init` seeds into a scaffolded project**, which WP 3.1 builds and which does not exist yet;
its automated comparison is part of that work package. What is verified here is the source that seeding will copy
from.

---

## 5. Runtime invocation map recorded from live-documentation evidence — VERIFIED

`docs/runtime-invocation-map.md`, delivered by WP 1.5 (issue #5, PR #50, commit `20c8d25`, merge `35a7520`).

- Every runtime-surface claim traces to a URL recorded in the run's research transcript, carrying that
  transcript's own VERIFIED / UNVERIFIED marking. Seven distinct URLs across five Claude Code pages, the Agent
  Skills specification, and a Codex source pair with its 308 redirect target recorded.
- All ten practitioner actions are mapped for both runtimes, naming the packaged file each is served from.
- Unavoidable divergences are documented explicitly, led by the namespaced-command divergence: Claude Code derives
  `/cadence:*` automatically from the plugin name; Codex has no per-skill namespaced equivalent.
- **Four surfaces remain open items, recorded `unverified` with what was tried**, not asserted: the Codex hook
  event list, its explicit enablement key, its blocking-versus-advisory semantics, and the undocumented Codex
  custom-agent invocation syntax. These are Codex-side and bear on WBS 8.0, which is release 2 and outside this
  freeze.
- Two verification items the v1.8 Revision Record row named are closed: the 1024-versus-1,536 `SKILL.md`
  description question (both correct, different quantities in different systems; WP 2.1's 1024 stands for
  spec-portable packaging), and what `claude plugin validate` actually checks (schema for `plugin.json` and
  `hooks/hooks.json`; parseability plus two presence checks only for skill, agent, and command frontmatter — so it
  cannot serve as the agent-frontmatter gate).

The map is a dated snapshot of moving surfaces. WP 8.1 re-verifies before building the Codex package.

---

## 6. Open questions — all resolved or their defaults explicitly recorded

Recorded in authority document §7; resolutions appended at v1.13 and v1.14.

| | Question | Resolution | Default adopted? |
| --- | --- | --- | --- |
| **Q1** | Grader default **on** at Draft → Candidate for authority documents? | Opt-in everywhere, per AC-19.2. No divergence from method §6.3 arises, so §10 gains no `CR-` row. | yes |
| **Q2** | Identifiers scoped per manifest or per repository? | Per manifest, one manifest per authority document. | yes |
| **Q4** | How are the evidence tree's `<work-item>` and `<artifact>` path components derived? | Both rules adopted verbatim, so WBS 5.0 and 6.0 build against one path scheme. | yes |
| **Q5** | Ten practitioner actions as `commands/*.md` or per-action skills? | **`skills/<action>/SKILL.md`.** Live documentation directs new plugins to `skills/`; `commands/` is the older supported surface; no action was built yet, so migration cost was zero. | **no — decided against** |
| **Q6** | WP 5.3's Draft-zone hook on `PreToolUse` or `PostToolUse`? | **`PostToolUse`** with a `Write\|Edit` matcher, so D-2 and FR-7's advisory-only guarantee holds *by construction* — a non-blockable event cannot block. Cost: annotation follows the write. | yes |

**Q3 is out of scope for this freeze by design** — the §3.4 metered run allowance (X-2) as a possible release 3 is
deferred until WBS 9.0 produces usage data. It is recorded, not unresolved.

**Two consequences this freeze confirms or reverses explicitly**, because each reaches past the question that
produced it:

1. **Q5 bears on ten actions, not eight.** Q5's first wording named WP 3.1, 3.2 and 4.1–4.6. The ten actions
   include `gate` and `promote`, so **WP 6.1 and WP 6.3 are equally in scope**; S-2 has counted both among the ten
   since v1.0. Corrected at v1.13.
2. **Q6 binds both WP 5.3 hooks, not one.** Q6 named only the Draft-zone annotation hook, but S-4 places the
   Approved-zone write warning in the same package under the same all-hooks-warn-only rule, and the same
   construction argument applies. Both bind non-blockably. Recorded at v1.14 for this freeze to confirm — signing
   confirms it.

**No unrecorded open design question remains.** Every question known to this project is registered in §7 of the
authority document with a resolution or a recorded deferral. The four Codex open items in §5 above are *unverified
runtime surfaces*, not open design questions, and they are recorded in the map with what was tried.

---

## 7. Sign-off

Signing asserts: the operator has reviewed the plan and the companion against the extracted references and the
runtime invocation map; the resolutions in §6 are the operator's decisions, including the two consequences named
there; and the design is frozen at the versions listed in §1.

**Signing is blocked until §3 is discharged.** A signature over §3 as it stands would assert a verification that
was not performed, which is the failure `P2` and NFR-6 exist to prevent.

| | |
| --- | --- |
| **Actor** | _(name of the accepting reviewer — A-4: the solo operator is also the accepting reviewer)_ |
| **Signature** | _(unsigned)_ |
| **Date (UTC)** | _(stamped from `date -u +%F` at signing)_ |
| **Freezes** | authority document v1.14, companion v1.9, method v4.7 |

---

## 8. What this freeze releases

On signature, the work gated on M1 opens: WBS 2.0, 3.0, 4.0, 6.0, and 7.0 — 19 issues. WBS 5.0 (15 issues) and
WBS 1.6 were never gated on it and are already open; 1.6 is complete.

## 9. Stated limits

- The six runtime references are **draft** (`WBS 1.1`) and are finalized by WP 2.2. This freeze fixes their
  content as the basis for build work; it does not assert they are final.
- §3's verification is outstanding, and §4 discharges only the `evidence-classes.md` row of it.
- The runtime invocation map is a dated snapshot of surfaces that move. Four Codex surfaces remain unverified and
  are recorded as open items; WP 8.1 re-verifies before building.
- AC-1.4's automated scaffold-seed comparison belongs to WP 3.1 and is not performed here (§4).
- This note records decisions; it creates no identifier and changes no requirement (FR-10).

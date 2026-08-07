# Zone Lifecycle — CADENCE Method Reference

> **Source of truth:** The CADENCE Method, v4.7 (final) — `docs/reference/source/CADENCE_METHOD.md`, §6 (with §6.1).
> **Distilled from:** method §6 (advisory by default, gate at promotion) and §6.1 (three zones instead of one gate).
> **Status:** Final reference (WP 2.2) — verified section-by-section against method v4.7.
> Where this reference and the method disagree, the method governs (design decision D-4).

The guardrail architecture rebuilds the how-axis on two principles (method §6):

- **Advisory by default.** During generation and drafting, guardrails *annotate and report* — they never block. An agent drafting a research note sees evidence-tag suggestions, cross-reference warnings, and quotation flags as inline advisories, and keeps moving.
- **Gate at promotion only.** Hard enforcement may block only at a promotion between zones, never while an artifact is being drafted. In the three-zone lifecycle (§6.1), the full deterministic gate may block Draft → Candidate, and its isolated clean-room re-run may block Candidate → Approved. Both guard a *slow, deliberate* promotion step; neither grips the *fast, creative* act of writing.

## The three zones

Replace the single always-on gate with three zones an artifact moves through — a draft → candidate → approved lifecycle fused with the evidence contract:

| Zone | Enforcement | What runs | Blocks? |
| --- | --- | --- | --- |
| **Draft** | Advisory only | Fast lints: untagged-claim *hints*, quotation-symmetry, broken-link *warnings*. Sub-second, host-only. | Never |
| **Candidate** | Full deterministic gate | The complete gate — the content checks (evidence-tag grammar, cross-reference resolution, revision-history immutability, link integrity, render fidelity, and manifest/registry) plus the self-test that proves those checks still fire and a shell-lint of the tooling. This is the promotion gate. | Yes, to promote |
| **Approved** | Frozen + clean-room | The gate re-run once in an isolated clean-room at promotion to final; advisory LLM review optional. Thereafter read-only. | Yes, to finalize |

## The two blocking boundaries and the promotion procedure

Promotion between zones is a version-control move (`git mv`) plus a commit — a free audit trail. Those two promotion boundaries are the only points at which a zone gate can block.

The boundaries, restated from the §6 principle above:

- **Draft → Candidate** — the full deterministic gate (the Candidate promotion gate) may block here.
- **Candidate → Approved** — the isolated clean-room re-run may block here, at promotion to final.

Both guard a slow, deliberate promotion step; neither grips the fast, creative act of drafting. Promotion is a version-control move (`git mv`) plus a commit — a free audit trail (method §6.1).

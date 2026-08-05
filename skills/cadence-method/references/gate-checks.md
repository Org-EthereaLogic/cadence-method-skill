# Gate Checks — CADENCE Method Reference

> **Source of truth:** The CADENCE Method, v4.7 (final) — `docs/reference/source/CADENCE_METHOD.md`.
> **Distilled from:** method §6.1 (the Candidate promotion gate's check list), §3.5 (the block / warn / guide enforcement tiers), and the tier refinements stated in §5 and §6.2.
> **Status:** Draft reference (WBS 1.1). Final polish and table-of-contents pass are WP 2.2.
> Where this reference and the method disagree, the method governs (design decision D-4).

This reference maps the **Candidate-gate** checks to their enforcement tiers. The Candidate gate is the full deterministic gate that runs at the **Draft → Candidate** promotion boundary; the method's zone table marks it *"Blocks? Yes, to promote"* (§6.1). Tiers here are synthesized **only** from what the method states — §3.5 (the tier definitions), §6.1 (the check list), §5 (the cross-reference downgrade), and §6.2 (the decouplings). No runtime-specific check is added; where the method is silent on a per-check tier, that is noted rather than invented (D-4: faithful extraction, do not invent rules not in the method).

## The enforcement tiers (§3.5)

The Directives are tagged by enforcement strength: **block** (a gate refuses), **warn** (recorded, never blocks), or **guide** (advisory).

## The Candidate-gate check list, mapped to tiers

The method names the Candidate gate's components as *the content checks (evidence-tag grammar, cross-reference resolution, revision-history immutability, link integrity, render fidelity, and manifest/registry) plus the self-test that proves those checks still fire and a shell-lint of the tooling* (§6.1). Because the gate as a whole blocks promotion, each component check refuses promotion on failure — **block** — with one method-stated exception, called out below.

| Candidate-gate check | Tier | Method basis |
| --- | --- | --- |
| Evidence-tag grammar | **block** | §6.1 (part of the complete gate that blocks to promote); §6.2 rule 3 — tags are *suggested* in Draft and *required* at the Candidate gate; §9 — every claim carries exactly one evidence class or is cut. |
| Cross-reference resolution | **block** (see exception) | §6.1 (part of the complete gate); §9 — every identifier resolves through the authority document to one canonical definition. **Exception:** a loose version-pointer that names a version and drifts is a **warn**, never a fail (§5 "downgrade a cross-reference rule from *fail* to *warn*"; §6.2 rule 1). |
| Revision-history immutability | **block** | §6.1; §6.2 rule 2 — revision rows are history, excluded from version bumps, and a find-and-replace must never rewrite one; §8 anti-pattern — append-only, never rewrite the trail. |
| Link integrity | **block** | §6.1 (part of the complete Candidate gate). In the Draft zone, broken-link runs only as an advisory *warning* (§6.1 Draft row); it binds at the Candidate gate. |
| Render fidelity | **block** | §6.1; §3.1 — spec-is-source, a hand-edited render is a defect. |
| Manifest / registry | **block** | §6.1; §9 — every artifact has a manifest row. |
| Gate self-test | **block** | §6.1 — the self-test that proves those checks still fire; §3.4 — deterministic validators pinned byte-for-byte by regression fixtures. |
| Tooling shell-lint | **block** | §6.1 — a shell-lint of the tooling, named as a component of the complete gate. |

**The one warn.** The only per-check downgrade the method states inside the gate is the loose version-pointer cross-reference: it *warns* when it drifts and never fails (§5; §6.2 rule 1). This is the fix for the cascade problem — one manifest asserts the version; everywhere else points loosely.

## Where the guide tier lives

§3.5 defines **guide** as advisory. The method applies the guide/advisory tier off the promotion gate, not to any Candidate-gate content check:

- **Draft-zone fast lints** — untagged-claim *hints*, quotation-symmetry, broken-link *warnings* — run advisory-only and *never* block (§6.1 Draft row).
- **The usage meter** (§3.4) registers as a *guide* (§3.5): it reports, never throttles.

Because none of these is a Candidate-gate content check, no Candidate-gate check is tiered *guide* by the method, and none is asserted here.

## Excluded from this map (D-4)

The WBS names runtime-specific checks this method does not state as Candidate-gate checks — e.g. ID-namespace resolution, quotation symmetry as a gate check, loose-pointer drift as its own check, and promotion-report generation. These are downstream runtime choices, not method-stated tiers, and are omitted from this reference per the faithful-extraction constraint. Quotation-symmetry appears in the method only as a Draft-zone advisory lint (§6.1 Draft row), not as a Candidate-gate check.

## Stated limits (§3.4)

A green Candidate gate is a statement about the checks that ran, never about the checks nobody wrote. In particular, a green gate is *never* evidence that a quotation is accurate — it proves only that a quotation is attributable and dated; whether it is verbatim is a human read (§3.3, §9).

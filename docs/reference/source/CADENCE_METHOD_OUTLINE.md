# The CADENCE Method — Executive Outline

**The method in three pages: what it is, how it works, and the decision it asks for**

| | |
| --- | --- |
| **Author** | Anthony Johnson II |
| **Readers** | Executive readers evaluating the method for adoption, and the practitioner maintaining this record |
| **Status** | v1.1 final — an executive condensation of *The CADENCE Method* v4.7, cited below as "method §N." Not normative: where the two differ, the method governs; the v4.7 pointer is loose per the method's §6.2. |
| **Date** | 2026-08-02 UTC (see the Revision Record) |
| **Format** | Markdown source (this file) with a rendered PDF companion |
| **Scope** | The two axes, six-phase arc, governance stack, guardrail architecture, and adoption decision; the full method is available on request |

## The one idea — two orthogonal axes

CADENCE is not an acronym. It names the property the method exists to protect — the sustained rhythm of creative work. Governance is real, but it engages at promotion, so drafting keeps its cadence: hard controls guard the slow, deliberate step (shipping), never the fast, creative step (writing).

Two independent concerns run through every piece of work (method §1). **Axis 1 — the arc — governs *what and why*:** the six-phase problem→solution arc from catalyst to measured value. **Axis 2 — governance and gates — govern *how*:** how we know the thing built is correct, traceable, and safe to ship, whatever the artifact is. The axes are orthogonal; work has a position on both at all times. Conflating them — rigid enforcement gripping work still being drafted — throttles the flow it was meant to protect (method §5, an assessment, not a measurement).

**How to read this outline.** The method carries three grades of claim and says which is which: **established practice** (mechanisms built and run — most of the method), **target design** (the §§6–7 guardrail architecture and the §3.4 run metering — a plan wherever it is not yet installed), and **anticipated practice** (Frame, method §2.1, and the mandate handling and channel discipline it hands to Assess — reasoned rather than accumulated). Grades are stated below with the sections they qualify.

## The six-phase arc

Frame, Assess, Innovate, Model, Implement, Track — established practice, except Frame and what it hands to Assess, which are anticipated practice. Testing is not a phase; it is a thread through Model, Implement, and Track (method §2).

| Phase | In one line |
| --- | --- |
| **Frame** | Establish why this work at all; output the catalyst document everything downstream resolves against |
| **Assess** | Define the problem in evidence — charter, KPI baseline, root causes — before any solution |
| **Innovate** | Generate genuine options against root causes; choose with recorded rationale and rejections |
| **Model** | Design, prototype, validate; end with an explicit continue / pivot / stop decision |
| **Implement** | Pilot, train, govern, scale — a deployed workflow with human-in-the-loop controls |
| **Track** | Measure against the Assess baseline; arrest drift; prove ROI from measured facts |

The arc runs as a loop: Track feeds the next Frame (method §2.7). Two disciplines set its tone: a received instruction is *evidence, not a finding* (§2.1), and *nothing is credited against a baseline nobody measured* (§2.6).

## The governance stack

Six pieces make an agent-produced deliverable trustworthy — established practice, except the §3.4 run metering, which is target design (method §3): **doc-as-code** — prose is source; code checks and renders it (§3.1). **The authority document** — one governing index; every identifier resolves to one canonical definition (§3.2). **The evidence contract** — every claim carries exactly one closed-set evidence tag or is cut; verbatim: *"Absent is a valid outcome"* and *"Never claim more verification than was performed"* (§3.3). **The gated build pipeline** — seven phases (plan → build → test → review → document → ship → verify) run by fresh sub-agents with independent Critic and Advocate review; a script computes PROMOTE / RETRY / QUARANTINE from append-only evidence (§3.4). **The governance layer** — Constitution, Directives tiered block / warn / guide, and frozen governed and fast working lines that never silently sync (§3.5). **The scaffold** — shared mechanics seeded from the first commit (§3.6).

**The Constitution** is seven principles, resolved in numeric order when they conflict (method §3.5):

- `P1` **Safety, Correctness & Repository Integrity** — never knowingly ship a violation; fail explicitly.
- `P2` **Evidence Traceability** — every claim maps to evidence; missing evidence blocks completion.
- `P3` **Security & Secret Hygiene** — no secrets in committed content; least privilege.
- `P4` **Simplicity & Proportionality** — match complexity to the size and risk of the problem.
- `P5` **Reproducibility & Operational Reliability** — append-only artifacts another operator can replay.
- `P6` **Human Control & Transparency** — operator controls; overrides recorded; a floor, never removed.
- `P7` **Validation Before Commercialization** — readiness proven by evidence, not anecdote.

## The guardrail architecture *(target design)*

The fix for the diagnosed failure (method §5). Two principles: **advisory by default** — while drafting, guardrails annotate, never block — and **gate at promotion only**: promotion boundaries are the only points where a gate can block (method §6.1). Three zones, so two such boundaries:

| Zone | Enforcement | Blocks? |
| --- | --- | --- |
| **Draft** | Advisory only — fast lints, hints, warnings | Never |
| **Candidate** | The full deterministic gate — tags, cross-references, immutability, render fidelity | Yes, to promote |
| **Approved** | The gate re-run once in an isolated clean-room; thereafter read-only | Yes, to finalize |

Evidence tags are *suggested* in Draft and *required* at Candidate (method §6.2).

## Maturity and the decision asked

The maturity limits are as graded above (method, Executive summary). Adoption runs six phases, 0 through 5 — extract the invariants, advisory everywhere, the promotion gate, decouple, right-size, re-measure — on rough estimates, not measured durations (method §7). Underneath sit **twelve signature patterns** (method §4), the reusable techniques recurring across both axes. The decision asked: **pilot before standardizing**, measuring drafting speed, defects caught at promotion, operator burden, and outcomes.

## Appendix — Revision Record

Rows are history: excluded from version bumps, never rewritten (method §6.2).

| Version | Date | Change |
| --- | --- | --- |
| v1.0 | 2026-08-02 | Initial executive outline condensing *The CADENCE Method* v4.6. Deliberately unmarked, matching its sole source; the v4.6 pointer is loose per the method's §6.2. |
| v1.1 | 2026-08-02 | Reconciled two blocking promotion boundaries; synchronized to method v4.7; corrected epistemic scope and Constitution pagination. |

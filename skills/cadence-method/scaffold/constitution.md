# Constitution

> CADENCE reference version: the CADENCE method, v4.7, §3.5.
> Template revision: cadence scaffold Constitution template, v1.0 (WP 3.1).
> These are the two identifiers an `/cadence:init` divergence report names when a project's
> own `cadence/constitution.md` no longer matches this template byte-for-byte — the template
> revision is what the comparison is against, and the reference version is the method text
> that revision restates.

This is the governed project's canonical, versioned Constitution: the *why*, internalized
and priority-ordered, that the project's Directives (`cadence/directives.md`) turn into
enforceable rules (method §3.5). The seven principles below are restated from the method,
not authored here — a project extends them in the section marked below; it does not edit
`P1` through `P7` in place.

## The seven principles (`P1`–`P7`)

- **`P1` Safety, Correctness & Repository Integrity** — never ship a change that knowingly
  violates acceptance criteria, policy, or operator safety; prefer explicit failure over
  silent unsafe behavior; treat protected paths and policy controls as hard boundaries.
- **`P2` Evidence Traceability** — every quality, benchmark, and operational claim maps to
  concrete evidence; reports distinguish measured facts from interpretation; missing
  evidence blocks a completion claim.
- **`P3` Security & Secret Hygiene** — no credentials or secret material in committed
  content; least-privilege; rotate exposed keys immediately.
- **`P4` Simplicity & Proportionality** — match implementation complexity to the size and
  risk of the problem; avoid speculative abstractions, framework inflation, and enterprise
  patterns without immediate need.
- **`P5` Reproducibility & Operational Reliability** — capture phase inputs, outputs,
  timestamps, and metadata; keep artifacts append-only and audit-friendly; build so
  another operator can replay the result.
- **`P6` Human Control & Transparency** — provide explicit operator controls (cancel,
  retry, resume, resolve); record overrides with actor, reason, and effect; do not hide
  recovery behind opaque automation.
- **`P7` Validation Before Commercialization** — internal validation gates are met before
  commercialization claims; readiness depends on benchmark and operations evidence, not
  anecdote.

## Decision order

When principles conflict, resolve them in this order: safety and correctness → evidence
traceability → security → simplicity and proportionality → reproducibility → human control
and transparency → validation before commercialization.

**Standing qualification.** `P6`'s operator controls (cancel, retry, resume, resolve) are a
**floor, not a term in the tradeoff**. A higher principle may change *how* they are
provided; it never licenses removing them.

## Project extensions

Add project-specific principles below this line. A project extension supplements `P1`
through `P7`; it never renumbers, replaces, or edits them, and it never assigns a project
principle a number already used above.

<!-- Project extensions begin below this line. -->

## Provenance and amendment

`P1` through `P7` and the decision order above are the method's own tokens, restated
verbatim here as the project's canonical, versioned source (method §7 Phase 0: extract the
invariants into the project scaffold as the canonical, versioned source). They are amended
only upstream, in the method itself, never edited in place in this file. A project that
already carries its own Constitution is not overwritten by `/cadence:init`: the divergence
from this reference version is reported, and reconciliation is the practitioner's (method
§7 Phase 0 — revise and align, never clobber).

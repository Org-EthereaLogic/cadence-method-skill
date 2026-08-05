# Artifact Layout — CADENCE Method Reference

> **Source of truth:** The CADENCE Method, v4.7 (final) — `docs/reference/source/CADENCE_METHOD.md`, §3.4/§3.5.
> **Distilled from:** method §3.4 (the gated build pipeline: an append-only evidence tree, a verdict computed by script, attempt discipline) and §3.5's `P5` ("capture phase inputs, outputs, timestamps, and metadata; keep artifacts append-only and audit-friendly; build so another operator can replay the result"). The method states these as principles, not a directory layout — the concrete paths below are this runtime's own specification, per NFR-5 and FR-14.
> **Status:** Draft reference (WP 1.2). Final polish and table-of-contents pass are WP 2.2.
> Where this reference and the method disagree, the method governs (design decision D-4).

This file specifies where phase-agent and promotion-gate runs write their evidence, how attempt directories are named, and how a verdict is replayed from what is written — the layout NFR-5 (auditability) and FR-14 (verdict-by-script) require. It is specification only: the report script and the validators that write into this tree are WBS 5.0/6.0 deliverables, not this file.

## Evidence root

`artifacts/` at the governed project's root, seeded by `/cadence:init` alongside the `cadence/draft/`, `cadence/candidate/`, and `cadence/approved/` zone directories (S-6, AC-1.1). The two roots hold different things: a zone directory holds an artifact's *content*, and its location is what declares the artifact's zone (AC-2.1); `artifacts/` holds the *evidence about* the runs that acted on that content. `artifacts/` is never itself a zone and is never promoted.

## Tree shape

One subtree per tracked work item: AC-2.1 derives a work item's arc phase from its evidence tree and an artifact's zone separately, from its directory location.

```text
artifacts/<work-item>/                             # <work-item>: open token — derivation not settled here (see Stated limits)
├── <phase>/<UTC-timestamp>/                       # phase-agent dispatch; <phase> enumerated (frame|assess|innovate|model|implement|track)
└── gate/<artifact>/<boundary>/<UTC-timestamp>/    # gate/promotion attempt; <boundary> enumerated (draft-to-candidate|candidate-to-approved); <artifact>: open token
    └── consensus/<UTC-timestamp>/                 # consensus round, present only when consensus was invoked (AC-14.1, AC-14.2); nested, never a standalone attempt (AC-15.2)
```

## Attempt directories and UTC timestamps

Each `<UTC-timestamp>` directory is named by an ISO-8601 basic UTC timestamp, e.g. `20260805T082546Z` — filesystem-safe and sortable in run order, which is NFR-5's UTC-timestamp requirement made concrete. A new attempt directory is written for every phase-agent dispatch, every standalone or promotion gate run, and every consensus round (AC-15.2); none is ever reused. A consensus round is dispatched only by the gate or promotion attempt that invokes it (AC-14.1, AC-14.2), so its attempt directory nests inside that attempt's own directory as `consensus/<UTC-timestamp>/`; creating it writes nothing into the files the enclosing attempt already wrote, so each level keeps the append-only rule below independently. An interrupted run resumes from the newest incomplete attempt without re-running a completed one; a cancelled run's partial evidence stays in its attempt directory, never deleted (AC-17.1, FR-15).

## Attempt manifest

Each attempt directory holds one attempt manifest, named `attempt-manifest.json` — JSON because the FR-14 report script parses it rather than a reader (AC-15.1, AC-15.2), and a distinct name because a validator must never confuse it with the project manifest. It records: the actor, the attempt's start and end UTC timestamps, each check's status from the closed set `pass | warn | fail | skipped` — a check that did not run is `skipped`, never `passed` (NFR-6) — and, for a gate or promotion attempt, the computed verdict. This *attempt* manifest is a different thing from the project's own manifest (method §3.2/Appendix B): the project manifest is singular, one per project, and declares the document set and the authority-document designation; an attempt manifest is one per attempt directory and records only what that one run observed. Neither substitutes for the other.

## Promotion reports

Every `gate/<artifact>/<boundary>/<UTC-timestamp>/` attempt directory additionally holds one promotion report, named `promotion-report.md` — Markdown because a practitioner reads it and it carries verbatim prose (AC-14.1) — written by the FR-14 report script: the check list; any Critic finding and Advocate dissent, drawn from that attempt's nested `consensus/<UTC-timestamp>/` directory and recorded verbatim (AC-14.1); any recorded exemption, with its actor and reason (AC-9.5); the computed verdict from FR-14's closed set — `promote | retry | quarantine`, lowercase, never the excluded build pipeline's uppercase `PROMOTE`/`RETRY`/`QUARANTINE` tokens (method §3.4) — with its distinct exit code; and a stated-limits footer naming what the gate did not check. The `/cadence:promote` commit message records the gate result (AC-9.3); this report, in this attempt directory, is the evidence that result is drawn from.

## Append-only rule

Nothing inside a written attempt directory is ever modified. A correction, a retry, or a resumed continuation is always a *new* attempt directory; even a cancelled or superseded attempt's evidence is retained (NFR-5; AC-17.1; method pattern 8 — every attempt is immutable, and the trail is never rewritten to hide a failure).

## Replaying a verdict

An operator who was not the original agent can reconstruct any verdict from the tree alone: find the work item's subtree under `artifacts/`; open its `<phase>/` or `gate/<artifact>/<boundary>/` branch; list its attempt directories in timestamp order and take the latest; read that attempt's manifest and, for a gate or promotion attempt, its promotion report; then recompute the same verdict and exit code from the recorded check statuses against the FR-14 closed set. The verdict is a function of that recorded evidence, not of the agent's narrative about it (method pattern 5). A verdict that cannot be reproduced this way is a defect in the tree, not a fact to take on faith — this is what NFR-5's replay requirement means in practice.

## Stated limits

Method pattern 11 states this discipline for gates — "Every gate publishes what it does *not* check" (§3.4) — and this file is a specification, not a gate, so the discipline is extended to it here rather than inherited from the method, on the same reasoning: a specification trusted for more than it settles is worse than one that names its gaps (NFR-6). What this draft does *not* settle, published alongside what it does so that an open question reads as open:

- **How `<work-item>` and `<artifact>` are derived.** Their format, character set, and source are not defined here, and `id-namespaces.md` does not supply them — it governs document-identifier *prefixes*, a different namespace. Both stay open until the authority document (`docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md`) defines them, which is where an identifier convention resolves to one canonical definition (method pattern 1; the FR-10 working rule in `CLAUDE.md`). A WBS 5.0 or 6.0 implementer who needs a value raises the gap there and brings the answer back: this is a recorded open decision, not an omission to fill in locally, and filling it in locally would give the validators and the report script two incompatible path schemes — the divergence that specifying this layout first exists to prevent.
- **The field-level schema inside each file.** The two filenames and their formats above are fixed so both sides find the same file; which keys carry the contents listed above is WBS 5.0/6.0 work, bounded by those contents and by NFR-6's status vocabulary.

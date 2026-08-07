# Directives

> CADENCE reference version: the CADENCE method, v4.7, §3.5.
> Template revision: cadence scaffold Directives template, v1.0 (WP 3.1).
> These are the two identifiers an `/cadence:init` divergence report names when a project's
> own `cadence/directives.md` no longer matches this template byte-for-byte — the template
> revision is what the comparison is against, and the reference version is the method text
> that revision restates.

Directives are the enforceable expression of the Constitution (`cadence/constitution.md`):
concrete rules a check or a human can apply, each tagged by enforcement strength (method
§3.5). Where the Constitution ships its principles complete and takes project additions
below them, this file ships mostly empty: the tier vocabulary, the frame, and a small seeded
set, with the project writing the rest of its own rules into the empty rows below.

## The three enforcement tiers

- **`block`** — a gate refuses. Valid **only** at the two promotion boundaries, and only
  through `cadence/gate-tiers.json` (see the load-bearing rule below).
- **`warn`** — recorded, never blocks.
- **`guide`** — advisory only.

## Load-bearing rule — where `block` may live

A directive tiered `block` is enforced **only** at the two promotion boundaries — Draft →
Candidate and Candidate → Approved — and **only** through `cadence/gate-tiers.json`,
because this runtime puts automated blocking logic in exactly one place, the promote
command's gate step (design decision D-2, FR-11). A project that wants a rule enforced
during drafting writes it at `warn` or `guide` here and reads the advisory; it does not
invent a second blocking path.

## Directive table

| Directive | Tier | Check or human step |
| --- | --- | --- |
| Stage changes by explicit path only; never `git add -A` or `git add .` | guide | Human review of the git commands used in a change (NFR-4) |
| Never `--force` or `--no-verify` on a git operation | guide | Human review of the git commands used in a change (NFR-4) |
| Evidence is append-only: a correction is a new attempt directory, never an edit to a prior one | guide | Human review of an attempt directory under `artifacts/` before it is treated as authoritative (`P5`; the CADENCE method, v4.7, §8) |
| Revision rows are appended, never edited in place | block | The `revision-row-immutability` check, at both promotion boundaries — Draft → Candidate and Candidate → Approved (`cadence/gate-tiers.json`) |
| | | |
| | | |
| | | |

Rows left empty above are the project's own to fill in; an empty cell is not a violation,
it is unfilled. Do not remove the four seeded rows above the blank ones. They carry this
runtime's own operating invariants into the project's table, and between them they show
both shapes a directive can take: method §3.5 defines one as a concrete rule *a check or a
human* can apply. The three `guide` rows are the human half — their "Check or human step"
column names the review that applies them, and no automated check enforces them. The fourth
is the `block` half, and it shows what a `block` row has to name: a gate check, the
promotion boundaries it applies at, and `cadence/gate-tiers.json` as the file that carries
the tier. That check — `revision-row-immutability` — is a deterministic validator that is
forthcoming (WP 5.1), so as this scaffold ships the row is configuration waiting for its
validator rather than a gate that refuses today.

**Where the rest of the enforcement is recorded.** This table is not the whole enforcement
picture. `cadence/gate-tiers.json`, seeded into this project by the same `/cadence:init`
run, is the file a promotion gate reads: it lists the runtime's gate checks, each with its
tier and the boundaries it applies at, and most of them have no row here. Read the two
together — this table for the rules the project states and a check or a human applies, the
tier file for what a promotion boundary will refuse. When the project adds a `block`
directive here, name the gate check in `cadence/gate-tiers.json` that enforces it, the way
the fourth row does; a `block` row that names no check there enforces nothing.

## Provenance and amendment

The three tiers above are the method's own (§3.5), in the method's own terms; the
load-bearing `block`-placement rule is this runtime's (D-2, FR-11). Both are restated here
as the project's canonical starting point (method §7 Phase 0), not authored for this
project. A project that already carries its own Directives file
is not overwritten by `/cadence:init`: the divergence from this reference version is
reported, and reconciliation is the practitioner's (method §7 Phase 0 — revise and align,
never clobber).

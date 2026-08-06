# CADENCE Method Automation — User Stories and Acceptance Criteria

**Companion to the CADENCE Method automation runtime ("cadence-method skill")**

| | |
| --- | --- |
| **Author** | Anthony Johnson II |
| **Readers** | The practitioner directing the automation build, and the coding agents implementing it |
| **Status** | v1.9 final — reconciled and ready for design-freeze review alongside the Project Plan & WBS |
| **Date** | 2026-08-06 UTC (see the Revision Record) |
| **Governing method** | `CADENCE_METHOD.md` v4.7 (`work-product/aim-it-agentic-engineering-method/`) |
| **Authority document** | `CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md` — this file is its declared companion holding the canonical `US-` / `AC-` definitions |
| **Scope** | User stories and acceptance criteria for automating the CADENCE Method as custom Skills, Agents, Hooks, and Commands runnable by Claude Code (primary) with Codex parity as a later release |

**How to read this file.** Stories are grouped into seven epics that map to the CADENCE Method's own structure: installation and project scaffolding (method §3.6), the six-phase arc (§2), the zone lifecycle and promotion gates (§6), the evidence contract (§3.3, Appendix A), adversarial verification and reporting (§3.4), governance surfaces (§3.5), and runtime parity. Every story that automates the method cites the section it automates; US-18 (runtime parity) is a runtime concern anchored to reference-implementation precedents rather than to a method section, and says so. Acceptance criteria are the completion conditions for these stories: per the Constitution (`P2`), a story is not done until its criteria are demonstrated with replayable evidence, and a criterion that was `NOT RUN` is never counted as passed.

**Identifier conventions.** This document follows the method §3.2 canonical namespace: `US-` user story, `AC-` acceptance criterion (numbered `AC-n.m` under story `US-n`). Requirements (`FR-`/`NFR-`), success criteria (`SC-`), assumptions (`A-`), risks (`R-`), scope (`S-`/`X-`), design decisions (`D-`), conflict resolutions (`CR-`), and open questions (`Q1`, `Q2`, …) are defined canonically in the authority document and referenced from here; they are not redefined in this file. Where a criterion below names an identifier belonging to a *governed project* rather than to this build — a project's own `SC-`, `RC-`, `O-`, or open questions — it says so explicitly.

---

## Personas

Three actors recur in the stories:

- **The Practitioner** — the human operator adopting CADENCE on a project. Invokes commands, resolves dissent, approves promotions, owns overrides.
- **The Coding Agent** — a Claude Code (later Codex) session directed to do phase work under the method. Consumes the skill as its operating contract.
- **The Reviewer / Sponsor** — the human who receives promoted artifacts and needs the traceability the method promises: evidence tags, revision records, and an audit trail.

---

## Epic E1 — Installation and project scaffolding (method §3.6)

### US-1 · Initialize a CADENCE project

**As a** practitioner, **I want** a single `/cadence:init` command that seeds a new or existing project with the CADENCE scaffold — Constitution, Directives template, evidence-class reference, ID-namespace reference, manifest template, zone directories, an `artifacts/` evidence root, and agent/hook/command registrations — **so that** every project inherits the method's shared invariants from the first commit without hand-copying them.

**Acceptance criteria.**

- **AC-1.1** — Given an empty directory, when `/cadence:init` runs, then it creates the scaffold layout (manifest, `cadence/draft/`, `cadence/candidate/`, `cadence/approved/`, `artifacts/` evidence root) and reports each file it created; re-running on the same directory is idempotent — it reports what already exists and overwrites nothing without explicit confirmation (`P6`).
- **AC-1.2** — Given an existing project with its own Constitution or Directives, when `/cadence:init` runs, then it does not replace them; it reports the divergence from the CADENCE reference versions and leaves reconciliation to the practitioner (method §7 Phase 0: *revise and align*, never clobber).
- **AC-1.3** — Given a completed init, then the manifest template contains: the document-set declaration with a selection-rationale field, exactly one authority-document designation, and the current-version assertion slot — and a project with zero or two authority documents fails the manifest validator (§3.2).
- **AC-1.4** — The scaffold's seeded evidence-class reference is byte-identical to the method's Appendix A closed set (eleven classes, with the `Speaker` / `Employer` / `key` parameters), verified by an automated comparison in the test suite.

### US-2 · Locate work on both axes

**As a** coding agent, **I want** a `/cadence:status` command that reports, for the current project, which arc phase each work item is in and which zone each governed artifact is in, **so that** I can apply the §9 Operating Card rule — enforcement obligations come from the zone, not the phase — without re-deriving state from the repository.

**Acceptance criteria.**

- **AC-2.1** — Given a scaffolded project, when `/cadence:status` runs, then it reports each work item's arc phase (Frame / Assess / Innovate / Model / Implement / Track) derived from its evidence tree, each artifact's zone (Draft / Candidate / Approved) derived from its directory location, the manifest's declared document set with current versions, and any open questions recorded in the governed project's own manifest (`Q1`, `Q2`, … in that project's namespace).
- **AC-2.2** — Given a document whose loose version pointer has drifted from the manifest's assertion (a companion names an older version), then status reports the drift as a **warning**, never an error (§6.2 decoupling rule 1).
- **AC-2.3** — Status is read-only: it makes no writes, and this is enforced by the command's tool allowlist.

---

## Epic E2 — The six-phase arc (method §2)

Each phase command drives one arc phase, dispatching the corresponding phase agent, and writes that phase's output artifact into the **Draft zone** with advisory-only checking — the arc is what-axis work and must keep its cadence (§1, §6).

### US-3 · Frame a piece of work

**As a** practitioner, **I want** a `/cadence:frame` command that takes either a directed mandate or an exploratory domain assignment and produces a catalyst document in Draft, **so that** everything downstream has one artifact to resolve against (§2.1).

**Acceptance criteria.**

- **AC-3.1** — Given a directed mandate supplied as text or a file, when the framer agent runs, then the catalyst document restates the problem in one paragraph, retains and cites the originating instruction as *(brief)*-class evidence, and names sponsor, affected function, deliverable constraints, and the decision the deliverable feeds.
- **AC-3.2** — Given a verbal mandate (no written instruction supplied), then the catalyst document captures it as *(interview record, Speaker M/DD)*, marks the restatement's unconfirmed status explicitly, and records each unresolved interpretation as an open question — never as an attributed sponsor decision (§2.1 verbal-mandate path).
- **AC-3.3** — Given an exploratory assignment naming only a domain, then the output enumerates candidate problems with rough value/feasibility and records the selection **and the rejection reasons** for each candidate not chosen.
- **AC-3.4** — Given an assignment with no measurable definition of "solved," then the framer records that as the governed project's first open question (`Q1` in that project's namespace) rather than inventing a target.

### US-4 · Assess the problem

**As a** practitioner, **I want** a `/cadence:assess` command that runs the discovery discipline of §2.2 and produces a problem charter, baseline, means inventory, and root-cause analysis in Draft, **so that** Innovate receives evidenced root-cause hypotheses, not symptoms presented as certainty.

**Acceptance criteria.**

- **AC-4.1** — The assessor's output records the three discovery channels (inside the affected function; outside the organization; the organization's own shelf) — and a channel searched and found empty is recorded as *searched*, never left silent.
- **AC-4.2** — Root causes are recorded as hypotheses until corroborated, with the distinction between observation, hypothesis, and corroborated cause visible in the artifact (`RC-` identifiers assigned on first record, stable thereafter).
- **AC-4.3** — The KPI baseline records its time window, population, and a reliability sanity check; where no trustworthy baseline exists, the artifact says so rather than estimating one (§2.6 discipline, applied early).
- **AC-4.4** — Where assessment evidence contradicts the catalyst document, the assessor records the contradiction on the record and flags a re-frame decision for the practitioner (`P6`) — it never silently replaces the assigned problem.

### US-5 · Innovate against root causes

**As a** practitioner, **I want** a `/cadence:innovate` command that generates an option space against the corroborated root causes and records a deliberate selection, **so that** the chosen solution earns its place against alternatives (§2.3).

**Acceptance criteria.**

- **AC-5.1** — Each material root-cause hypothesis receives at least one ideation technique from the §2.3 menu, with the technique named in the record and multiple alternatives generated per cause (`O-` identifiers).
- **AC-5.2** — The output includes an effort-vs-impact sort and a prioritized shortlist; the selected concept carries a defensible rationale, and every rejected option carries its rejection reason.

### US-6 · Model the solution

**As a** practitioner, **I want** a `/cadence:model` command that turns the selected concept into a design, drives the escalation ladder for tool selection, and assembles the project's SDLC document set, **so that** the build starts from a governed design with exactly one authority document (§2.4, §3.2).

**Acceptance criteria.**

- **AC-6.1** — Tool/architecture selection follows the escalation ladder starting from the Assess-phase inventory of what is already owned; an option ruled out on permission grounds is recorded as *excluded*, never as *failed*.
- **AC-6.2** — The modeler proposes a document set proportional to the §3.2 criteria, records the selection rationale in the manifest, and designates exactly one authority document; success criteria (`SC-`) are stated as measurable conditions.
- **AC-6.3** — Before the phase closes, the command requires an explicit continue / pivot / stop decision from the practitioner, recorded with actor and reason (`P6`); a run that skips the decision cannot mark Model complete.

### US-7 · Implement under governance

**As a** practitioner, **I want** a `/cadence:implement` command that structures pilot → govern → scale execution, delegating actual build tasks to the project's build pipeline, **so that** the deployment never outruns its evidence (§2.5).

**Acceptance criteria.**

- **AC-7.1** — The implement plan records pilot scope (cohort, duration, acceptance criteria) before any rollout step, and each staged rollout step is gated on recorded evidence from the preceding stage.
- **AC-7.2** — Operator controls (cancel, retry, resume, resolve) are available on every dispatched run, and every override is recorded with actor, reason, and effect (`P6`).
- **AC-7.3** — Where the project uses the ADWS build pipeline for coding tasks, the implement command hands tasks to it via its task contract rather than re-implementing a build loop (proportionality, `P4`; see the plan's `X-` exclusions).

### US-8 · Track outcomes

**As a** practitioner, **I want** a `/cadence:track` command that reports KPI movement against the Assess-phase baseline and can open the next Frame from a drift alert, **so that** the arc runs as a loop and nothing is credited against a baseline nobody measured (§2.6–2.7).

**Acceptance criteria.**

- **AC-8.1** — Track reports carry the baseline's window, population, and stated measurement limits forward intact; where the baseline is absent, the result is reported as **unproven**, never back-estimated.
- **AC-8.2** — Given a drift alert or missed KPI, `/cadence:track --reframe` opens a new catalyst document that cites the alert as its origin, with Frame's job reduced to naming what changed and what decision it now feeds (§2.7).

---

## Epic E3 — Zone lifecycle and promotion (method §6)

### US-9 · Promote Draft → Candidate through the full deterministic gate

**As a** practitioner, **I want** a `/cadence:promote` command that moves an artifact from Draft to Candidate only when the full deterministic gate passes, performing the move as a version-control operation, **so that** hard enforcement lives at the slow, deliberate promotion step and nowhere else (§6.1).

**Acceptance criteria.**

- **AC-9.1** — Given a Draft artifact with untagged claims and all other gate checks held passing, when promotion is attempted, then the **evidence-tag check** fails and the gate blocks with a per-claim listing; given the same artifact fully tagged from the closed set (other checks unchanged), the evidence-tag check passes and the gate no longer blocks on it. (Tags are required at Candidate, suggested in Draft — §6.2 rule 3.)
- **AC-9.2** — The gate runs the complete §6.1 Candidate check set, plus the ID-namespace and quotation-symmetry checks method §9 requires at this boundary: the content checks — evidence-tag grammar (including required date and `Speaker`/`Employer`/`key` parameters), ID-namespace resolution through the authority document, cross-reference integrity, revision-row immutability, link integrity, quotation symmetry, **render fidelity** (a derived render matches fresh regeneration from its spec), and manifest/registry consistency — **plus the gate self-test proving each check still fires on a known-bad input, and a shell-lint of the gate tooling itself**. The full gate completes within the NFR-2 latency budget on the NFR-2 reference corpus.
- **AC-9.3** — Promotion is executed as `git mv` plus a single commit whose message records the artifact, transition, and gate result; absent a recorded exemption, a failed gate commits nothing (atomicity). Where the practitioner takes the AC-9.5 exemption path, the commit records the transition and the exempted check, and nothing else about the transition changes (FR-5).
- **AC-9.4** — Every gate report ends with a **stated-limits** section enumerating what the gate did *not* check — including that a green gate proves a quotation's attribution and date only, never that it is verbatim (§3.3, pattern 11).
- **AC-9.5** — A gate failure offers exactly two paths: fix the content, or take a **visible, recorded exemption** with actor and reason. There is no third path; the command never edits content itself to make a check go green (§8).

### US-10 · Finalize Candidate → Approved in a clean-room

**As a** reviewer, **I want** promotion to Approved to re-run the gate once against a fresh checkout, after which the artifact is frozen by policy, **so that** what I sign off on is reproducible and any post-approval drift is detected and governed (§6.1, `P5`).

**Acceptance criteria.**

- **AC-10.1** — `/cadence:promote --finalize` re-runs the full gate against a clean checkout (fresh clone or pristine worktree); a discrepancy between working-tree and clean-room results blocks finalization and is reported as such.
- **AC-10.2** — After finalization, the artifact is **frozen by policy with integrity-drift detection**. This runtime cannot impose filesystem immutability and does not claim to detect every malicious rewrite. Specifically: (a) finalization records the artifact's content hash in the manifest; (b) the hash is re-verified on every status run, standalone gate run, and promotion, and a mismatch is reported as an **integrity failure** — advisory in `/cadence:status` and in standalone `/cadence:gate` runs, blocking only when evaluated inside `/cadence:promote` at a promotion boundary; (c) a hook warns on any write to an Approved path; and (d) the promote command modifies Approved content only through an explicit, recorded rollback (the runtime-level `--force` control, with actor and reason, never forwarded as a forced git operation) that re-baselines the hash.
- **AC-10.3** — The optional LLM review tier is opt-in — invoked per run with `--with-review`, or by a project-configuration default recorded per AC-14.2 — advisory-only, and never wired into any hook (§6.3).

### US-11 · Advisory-only drafting

**As a** coding agent drafting in the Draft zone, **I want** hooks that annotate — untagged-claim hints, quotation-symmetry flags, broken-link warnings — without ever blocking a write, **so that** governance never throttles the creative work it exists to protect (§5, §6).

**Acceptance criteria.**

- **AC-11.1** — Given any write to a Draft-zone file, the post-write hook **cannot** block it: per Q6 the hook binds to a non-blockable event, so the write has already completed when the hook runs and the allow-the-write guarantee holds by construction rather than by the hook's own behavior. Its advisories appear as feedback, and the advisory pass completes in under 1 second at p95, measured by the WBS 7.3 drill using NFR-2's reference-host record, warm-up count, sample size, and percentile method (§6.1: "sub-second, host-only").
- **AC-11.2** — Given a write to a generated render (a file the manifest marks as derived), the hook warns that the spec is the source and the render should be regenerated (§3.1) — and still does not block.
- **AC-11.3** — A configuration or hook-failure condition degrades **open** in Draft (write proceeds, degradation reported) and degrades **closed** at the promotion gate (promotion refuses when its validators cannot run) — honest degradation in both directions (pattern 12).

---

## Epic E4 — The evidence contract and deterministic validators (method §3.3, Appendix A)

### US-12 · Deterministic validators pinned by fixtures

**As a** practitioner, **I want** every gate check implemented as a standalone deterministic script emitting `pass | warn | fail`, pinned byte-for-byte against frozen regression fixtures, **so that** reproducibility is a tested property and a validator behavior change is caught the moment it happens (§3.4, pattern 9).

**Acceptance criteria.**

- **AC-12.1** — Each validator runs standalone from the command line on a documented input shape and emits a single JSON verdict; no validator calls an LLM.
- **AC-12.2** — A fixture suite covers each validator's `pass`, `warn`, and `fail` paths plus its documented edge cases; the suite runs in local CI, and any output difference from the frozen baseline fails the suite.
- **AC-12.3** — The evidence-tag grammar validator accepts exactly the Appendix A closed set — all eleven classes, with malformed or missing date / `Speaker` / `Employer` / `key` parameters rejected — and rejects any class token outside the set (the set is closed; a project extends it only by amending its own appendix, which the validator reads from the project's seeded reference, not from a hardcoded list).
- **AC-12.4** — The ID-namespace validator verifies that every identifier used in a governed artifact resolves through the authority document to exactly one canonical definition, that the reserved prefixes carry their §3.2 meanings, and that no identifier is ever renumbered or reused (stability rule).

### US-13 · Revision-record and loose-pointer discipline

**As a** reviewer, **I want** the validators to enforce that revision rows are append-only history and that version pointers outside the manifest only warn on drift, **so that** the coupling cascade the method diagnoses in §5 cannot recur (§6.2).

**Acceptance criteria.**

- **AC-13.1** — Given an edit that modifies an existing revision-record row and all other gate checks held passing, the **revision-row immutability check** fails with the row identified; given an edit that only appends a new row (other checks unchanged), the revision-row check passes.
- **AC-13.2** — Given a companion document naming a stale version of another document, the gate emits a **warn**, never a fail; only the manifest's own version assertion is hard-checked.

---

## Epic E5 — Adversarial verification and reporting (method §3.4)

### US-14 · Critic / Advocate review at promotion (opt-in, advisory)

**As a** practitioner promoting a high-stakes artifact, **I want** the option to run independent Critic and Advocate agents in parallel with fresh context — the artifact and its contract only, not the author's reasoning and not each other's output — **so that** promotion confidence can draw on adversarial perspectives without any model-generated assessment ever becoming a blocking gate (§3.4 pattern 6, subordinated to §6.3: the model review tier is opt-in and advisory; its known false-positive classes make it a poor blocking gate).

**Design rule (resolves the review-tier contradiction).** Model review is genuinely advisory under §6.3. Critic, Advocate, and Grader output is retained verbatim and surfaced in the promotion report, but it never changes the deterministic verdict or stops promotion by itself. A practitioner may convert any finding into an explicit **human hold** recorded with actor and reason; only that human decision blocks promotion, and only until a human records its resolution and effect. Dissent is never averaged away or hidden (§3.4), but neither is it silently promoted into a model-controlled gate.

**Acceptance criteria.**

- **AC-14.1** — When consensus is invoked, the Critic and the Advocate are dispatched in parallel, each with fresh context; every Critic finding and each Advocate dissent is recorded **verbatim** and surfaced in the promotion report. No finding changes the deterministic verdict or blocks promotion by itself. If a practitioner places a finding on hold, the hold records actor and reason, blocks until a human resolves it, and records the resulting effect.
- **AC-14.2** — Consensus is opt-in. Method §6.3 reserves the model review tier for Candidate → Approved; this runtime additionally exposes it at Draft → Candidate as an explicitly invoked, default-off option — a recorded divergence from §6.3's placement rule, never a default. The project configuration records the default per boundary (recommended: on, for authority documents at Candidate → Approved), so review depth is a deliberate, visible choice (§6.4 risk-based depth) and the configured default is inspectable via `/cadence:status --gates`.
- **AC-14.3** — Where the runtime does not register custom agent types, the orchestrator dispatches a general-purpose subagent with the agent's definition inlined verbatim — the transport changes, never the contract (the ADWS inline-dispatch fallback precedent, adopted here as FR-16).

### US-15 · Verdict computed by script

**As a** reviewer, **I want** every promotion and phase-completion verdict computed by a script over the append-only evidence tree, using the closed verdict set defined in FR-14, **so that** outcomes are decided by evidence, not by the agent's story about the evidence (§3.4, pattern 5).

**Acceptance criteria.**

- **AC-15.1** — A report script reads only the evidence tree and emits the verdict from the FR-14 closed set with a distinct exit code per verdict class; the orchestrating agent relays the script's verdict and never overrides it in prose.
- **AC-15.2** — Every attempt (gate run, agent dispatch, consensus round) writes to a new append-only attempt directory with timestamps; nothing in an existing attempt directory is ever modified, and the report script re-derives its verdict even when a status field was mis-set.
- **AC-15.3** — The report distinguishes measured facts from interpretation, and reports skipped or unrunnable checks as skipped — never folded into a pass (`P2`, pattern 12).

### US-19 · Grader coverage verdicts on promotion candidates

**As a** practitioner promoting an artifact that carries acceptance criteria, **I want** an opt-in Grader agent that reads the promotion candidate and its criteria as resolved through the authority document and grades each criterion — satisfied / partial / unaddressed / contradicted — **so that** criterion coverage is assessed per item rather than as a gestalt impression (§3.4: the reference pipeline's acceptance-criterion coverage Grader, adapted to document promotion).

**Acceptance criteria.**

- **AC-19.1** — The Grader's inputs are exactly the promotion candidate and the criterion set the authority document resolves for it (fresh context — no author reasoning); its output is one verdict per criterion from the closed verdict set, each with a one-line evidence pointer into the candidate.
- **AC-19.2** — The Grader follows the US-14 design rule: it is opt-in; its output never changes the deterministic verdict or blocks promotion by itself; and every `unaddressed` or `contradicted` verdict is recorded and surfaced for human review. A practitioner may place any verdict on an explicit human hold under AC-14.1. The project configuration records the default (Q1 resolves whether authority documents default it on at Draft → Candidate).
- **AC-19.3** — A Grader run that produces unparseable or incomplete output is reported as a **skipped advisory review** with the failure retained in the evidence tree — never as a pass and never silently re-narrated by the orchestrator (`P2`, pattern 12). Because the Grader is optional and advisory, the skip does not alter the deterministic verdict; the report must still make it visible. The inline-dispatch fallback (AC-14.3, FR-16) applies to the Grader identically.

---

## Epic E6 — Governance surfaces (method §3.5)

### US-16 · Tiered enforcement configuration

**As a** practitioner, **I want** every check registered in one project-visible configuration at an explicit enforcement tier — block / warn / guide — with block permitted only at the two promotion boundaries, **so that** the enforcement map is inspectable and the §5 failure (blocking checks accreting into the hot path) is structurally prevented.

**Acceptance criteria.**

- **AC-16.1** — A single configuration file lists every check with its tier; `/cadence:status --gates` renders it; and a check configured to block outside a promotion boundary is itself a configuration-validation failure.
- **AC-16.2** — Tier changes are ordinary reviewed edits to the configuration file, giving downgrades the §5-mandated path (fail → warn when a failure costs more than it catches) an audit trail via version control.

### US-17 · Operator controls on every long-running operation

**As a** practitioner, **I want** cancel, retry, resume, and resolve available on every multi-agent operation the runtime performs, **so that** recovery is never hidden behind opaque automation (`P6` — a floor, not a tradeoff).

**Acceptance criteria.**

- **AC-17.1** — A phase or promotion run interrupted mid-flight can be resumed from its evidence tree without re-running completed attempts, or cancelled cleanly with the partial evidence retained (append-only — a cancelled run's evidence is never deleted).
- **AC-17.2** — Every human override anywhere in the runtime (dissent resolution, gate exemption, forced rollback) is recorded with actor, reason, and resulting effect, and appears in the artifact's audit trail.

---

## Epic E7 — Codex parity (release 2)

### US-18 · Codex runtime parity

**As a** practitioner who runs both Claude Code and Codex, **I want** runtime-native packaging for each surface, governed by a verified invocation map and a shared runtime-independent core, with a parity harness proving equivalent behavior, **so that** the method's guarantees do not depend on which runtime executes it.

**Acceptance criteria.**

- **AC-18.1** — Every practitioner action and required agent/hook capability has a documented runtime-native mapping for Claude Code and Codex. Shared sources are used where the formats permit; unavoidable packaging or invocation differences are explicit in the WP 1.5 map and are never represented as a literal `.claude/` ↔ `.codex/` mirror.
- **AC-18.2** — A parity suite runs the shared deterministic validators and gate fixtures under both runtimes' invocation paths and diffs the verdicts; any divergence fails the suite.
- **AC-18.3** — Canonical names (tiers, verdicts, phases, zones) are preserved in all evidence regardless of runtime, so reports and validators remain runtime-agnostic (the ADWS alias precedent: aliases may route, canonical names are recorded).

---

## Traceability summary

| Story | Automates | Method anchor | Primary WBS package |
| --- | --- | --- | --- |
| US-1 | Scaffold / init | §3.6, §7 Phase 0 | 3.1 |
| US-2 | Status / axis location | §9 | 3.2 |
| US-3–US-8 | Six phase commands + agents | §2.1–§2.7 | 4.0 |
| US-9 | Draft → Candidate gate | §6.1–§6.3 | 5.0, 6.0 |
| US-10 | Candidate → Approved clean-room | §6.1, §6.3 | 6.3 |
| US-11 | Advisory drafting hooks | §5, §6 | 5.3 |
| US-12 | Deterministic validators + fixtures | §3.4, App. A | 5.1–5.2 |
| US-13 | Revision-row / loose-pointer rules | §6.2 | 5.1 |
| US-14 | Critic / Advocate review (opt-in, advisory; optional human hold) | §3.4 pattern 6, bounded by §6.3 | 6.2 |
| US-15 | Verdict by script, append-only evidence | §3.4 | 6.1 |
| US-16 | Tiered enforcement config | §3.5 | 5.4 |
| US-17 | Operator controls | §3.5 (`P6`) | 6.4 |
| US-18 | Codex parity | runtime concern — no method anchor; precedents: per-runtime packaging map, shared validators, ADWS alias rule | 8.0 |
| US-19 | Grader coverage verdicts | §3.4 (Grader), bounded by §6.3 | 6.2 |

Definitions of the WBS packages, and of every `FR-`, `NFR-`, `SC-`, `A-`, `R-`, `S-`, `X-`, `D-`, `CR-`, and open-question identifier referenced above, resolve through the authority document: `CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md`.

---

## Appendix — Revision Record

Rows are history: they record what was true when written, are excluded from version bumps, and are never rewritten.

| Version | Date | Change |
| --- | --- | --- |
| v1.0 | 2026-08-04 | Initial draft. Eighteen stories across seven epics, mapped to CADENCE Method v4.7 sections, with acceptance criteria written as promotion-gate conditions. Companion to `CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md` v1.0 (the authority document). |
| v1.1 | 2026-08-04 | Corrections from an independent review (11 findings; see the plan's v1.1 row for the full disposition). **Review-tier contradiction resolved:** US-14 restated as opt-in and human-gated — the deterministic gate is the only automatic block; Critic `fail` findings and Advocate dissents become recorded open items requiring human disposition, never auto-failures (§6.3 governs §3.4's consensus at document promotion). **Gate completed:** AC-9.2 now carries the full §6.1 Candidate set — render fidelity, the gate self-test, and the tooling shell-lint added. **Approved freeze made honest:** AC-10.2 restated as frozen-by-policy with content-hash tamper detection, not claimed filesystem immutability. **New US-19** defines the Grader (inputs, closed verdict set, human-gated semantics, skipped-check failure handling); Q1's trace now resolves to AC-19.2. **Precision fixes:** AC-9.1 and AC-13.1 scoped to the specific check under test with other checks held constant; AC-11.1 given a numeric p95 < 1 s budget tied to the NFR-2 corpus. **Traceability:** intro and table now state US-18's runtime-precedent anchoring explicitly. No existing identifier renumbered or reused. |
| v1.2 | 2026-08-04 | Final reconciliation and enterprise-readiness polish. **Advisory semantics corrected:** US-14 and US-19 now make model review genuinely advisory under §6.3; findings remain visible and verbatim but do not alter the deterministic verdict or block promotion unless a practitioner records an explicit human hold. **Runtime parity corrected:** US-18 now requires runtime-native packaging governed by the WP 1.5 invocation map, not an assumed `.claude/` ↔ `.codex/` mirror. **Measurement made reproducible:** AC-11.1 now binds to NFR-2's host record, warm-ups, sample size, and percentile method. **Accuracy polish:** acceptance criteria are described as story-completion conditions, and Approved-state hash checking is described as integrity-drift detection rather than comprehensive tamper detection. Companion corrections and conflicts CR-2/CR-3 are recorded in the Project Plan & WBS v1.2. No identifier was renumbered or reused; prior revision rows remain unchanged. |
| v1.3 | 2026-08-04 | Corrections from an independent accuracy and proofreading review, applied jointly with Project Plan & WBS v1.3 (40 findings, all accepted). **Blocking scope corrected:** AC-10.2 no longer assigns a blocking verdict to `/cadence:status` or to standalone `/cadence:gate` runs — the integrity-failure verdict is advisory there and blocking only inside `/cadence:promote`, restoring agreement with AC-2.3 and AC-16.1; the criterion is also split into four lettered conditions so WP 7.4 can walk it item by item. **Acceptance gap closed:** AC-2.1 now covers arc-phase reporting, which US-2 and FR-2 both require and no criterion previously tested. **Vocabulary resolved:** US-15 and AC-15.1 now draw on the closed verdict set defined in FR-14 rather than naming the excluded build pipeline's PROMOTE / RETRY / QUARANTINE tokens; the bare `F-11` token resolves to FR-16 at both uses (AC-14.3, AC-19.3). **Scope reconciliation:** US-1 gains the `artifacts/` evidence root, aligning with S-6 (CR-5). **Method fidelity:** AC-9.2 distinguishes method §6.1's Candidate set from the ID-namespace and quotation-symmetry checks §9 requires at that boundary; AC-14.2 records the Draft → Candidate review-tier placement as a divergence from §6.3; AC-10.3 names both opt-in mechanisms; AC-2.2 no longer inverts §6.2 rule 1. **Identifier hygiene:** the namespace lists gain `SC-`, `D-`, and `CR-`, and AC-2.1/AC-3.4 scope their `Q1` to the governed project's namespace so the token no longer carries two meanings. Editorial fixes to the epic enumeration (seven, not six), AC-14.1, AC-12.2, and the US-10 heading. No identifier was renumbered or reused; prior revision rows remain unchanged. |
| v1.4 | 2026-08-04 | Version synced with Project Plan & WBS v1.4, which corrected the §8 critical-path chain and dependency diagram in the authority document to place WP 6.2 on the critical path. No user story or acceptance criterion changed in this document. No identifier was renumbered or reused; prior revision rows remain unchanged. |
| v1.5 | 2026-08-04 | Version synced with Project Plan & WBS v1.5, an Agent Skills standards-conformance pass that refined WP 2.1/2.2 and the 7.x drills in the authority document (skill `description` discipline, execute-vs-read script intent, reference-file tables of contents, and multi-model drill coverage). No user story or acceptance criterion changed in this document. No identifier was renumbered or reused; prior revision rows remain unchanged. |
| v1.6 | 2026-08-04 | Corrections from a follow-up accuracy review of the v1.5 set, applied jointly with Project Plan & WBS v1.6 (which records the full disposition, including the corrections that fall in the authority document). **Atomicity qualified (CR-4 follow-through):** AC-9.3 stated without qualification that a failed gate commits nothing, contradicting the exemption path FR-5 carries and AC-9.5 requires in the same story — a criterion walker at WP 7.4 could have failed a recorded exemption commit against it. AC-9.3 now scopes the atomicity claim to the no-exemption case and states what the commit records when the AC-9.5 path is taken. **Editorial:** US-1 says "Directives template," matching S-6's enumeration of the same CR-5-unioned scaffold. No other user story or acceptance criterion changed; no identifier was renumbered or reused; prior revision rows remain unchanged. |
| v1.7 | 2026-08-05 | Version synced with Project Plan & WBS v1.7, a records correction to the revision-record timebase; the authority document's v1.7 row carries the full disposition. This document's rows carry the same defect and take the same fix: v1.5 and v1.6 were stamped from a local clock (America/Los_Angeles) and read 2026-08-04, while the passes that wrote them landed on 2026-08-05 UTC — `233dcff` at 00:16 UTC and `ff6bacd` at 02:44 UTC. Rows v1.0–v1.4 are correct as written. Both misdated rows stand unchanged, because rows are history and are corrected by appending rather than by rewriting. Every row from this one on is stamped from a UTC clock, matching the append-only UTC discipline NFR-5 requires of run evidence. The front-matter **Date** row is metadata rather than an append-only row, so it is corrected in place to 2026-08-05 UTC. No user story or acceptance criterion changed; no identifier was renumbered or reused. |
| v1.8 | 2026-08-05 | Version synced with Project Plan & WBS v1.8, which authorizes the repository scaffold and local check surface as WP 1.6, records D-6 (the plugin manifest omits `version` until M3), notes the relocation of the standards review into `docs/design/`, and names two runtime-surface claims as WP 1.5 verification items rather than adopting them. The authority document's v1.8 row carries the full disposition. No user story or acceptance criterion changed in this document; no identifier was renumbered or reused; prior revision rows remain unchanged. |
| v1.9 | 2026-08-06 | **AC-11.1 restated for the Q6 resolution: the Draft-zone advisory hook is non-blocking by construction, not by behavior.** The Project Plan & WBS resolved **Q6** on 2026-08-06 UTC by adopting its pending default — WP 5.3's hooks bind to `PostToolUse` with a `Write|Edit` matcher rather than to the pre-write `PreToolUse`. AC-11.1 previously read that "the pre-write hook always allows the write," which described a hook that *could* block choosing not to; `PreToolUse` is on the documented can-block list, so that guarantee was conventional and a later edit could have silently turned the hook into a gate. Under `PostToolUse` the write has already completed when the hook runs and the event cannot block at all, so the criterion now states the stronger fact. **Nothing is weakened:** the sub-second p95 budget, its NFR-2 measurement method, and the WBS 7.3 drill that verifies it are unchanged, and US-11's narrative — hooks that annotate without ever blocking a write — is satisfied more strictly than before, at the stated cost that annotation now follows the write rather than preceding it. AC-11.2 and AC-11.3 are unaffected: the derived-render warning and the open-in-Draft / closed-at-the-gate degradation semantics do not depend on which event the hook binds to. No user story, criterion, or identifier was added, renumbered, or reused; prior revision rows remain unchanged. |

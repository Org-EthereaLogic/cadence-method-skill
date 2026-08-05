# The CADENCE Method

**A method and operating contract for building governed, evidence-bearing deliverables with coding agents**

| | |
| --- | --- |
| **Author** | Anthony Johnson II |
| **Readers** | The practitioner adopting the method, and the coding agents they direct to build artifacts and projects |
| **Status** | v4.7 final — a project-agnostic reference specification of the method. Project-specific commands, validators, Directives, and scaffold files remain implementation dependencies. |
| **Date** | 2026-08-02 UTC (see the Revision Record) |
| **Format** | Markdown source (this file) with a rendered PDF companion |
| **Scope** | The full method: the problem→solution arc (*what/why*), the agentic engineering stack that executes it (*how*), the signature patterns that recur across both, and the guardrail architecture that keeps governance from throttling creative work |

**The name.** CADENCE names the property the method exists to protect — the sustained rhythm of creative work. Governance here is real, but it engages at promotion, so drafting keeps its cadence. The method is built on two orthogonal axes; the name is a reminder that the *how* axis must never be allowed to break the tempo of the *what* axis.

**How to use this file.** This is the complete reference specification for the method, not a bundled runtime. To adopt CADENCE, read §1 for its shape, §§2–3 for the two axes, §4 for the patterns, §8 for the failures to refuse, and §9 for the compact operating contract. §5 diagnoses the failure the guardrail architecture exists to solve; §§6–7 specify its target design and adoption path. Appendix A publishes the default evidence classes. A project still has to supply its own document set and authority document (declared in its manifest, §3.2), Directives, validators, promotion command, and scaffold implementation; §9 tells the agent how to use those project-local mechanisms once they exist.

## Executive summary

- **What it is.** A two-axis method: a six-phase business arc decides *what and why*; an evidence-and-governance stack controls promotion confidence.
- **Executive value.** Hard controls engage at promotion, preserving drafting speed while final artifacts retain traceability, one authority path, reproducible checks, and human control.
- **Maturity and decision.** The evidence mechanics are established practice; the §§6–7 guardrail architecture and the §3.4 run metering remain target design, and Frame remains anticipated practice. Pilot before standardizing, measuring speed, promotion defects, operator burden, and outcomes.

---

## How to read this document

This handbook has two audiences and it is written to serve both at once.

For the **practitioner**, it is a playbook: a single place where the method is named, connected, and turned into a repeatable way of working.

For a **coding agent**, it is an operating contract. The phase definitions, gate specifications, evidence classes, and the Agent Operating Card in §9 are written so an agent can be pointed at this file and know how to proceed without re-deriving the method each time. Where a rule is binding, it says so. Where something is a recommendation, it says that too — because claiming more certainty than the evidence supports is the exact failure the method exists to prevent.

A note on epistemic honesty, in the spirit of the Constitution's evidence-traceability principle (`P2`, see §3.5). This handbook carries three grades of claim, and says which is which:

- **Established practice** — mechanisms that have been built and run. Most of the handbook is this.
- **Target design** — the guardrail architecture in §§6–7, which resolves the failure analyzed in §5, and the metered run allowance in §3.4. Where either has not yet been installed in a given project it is a plan, not a finished result.
- **Anticipated practice** — §2.1 Frame, and the mandate-handling and channel discipline it hands to §2.2. This describes how assigned work is expected to arrive in a role the author has not yet worked. It is reasoned from the arc's own logic and from one worked engagement, not from accumulated intake. It is the part of this document most likely to be wrong, and it should be revised against real assignments once there are some to revise against.

Causal readings — for example, that rigid enforcement "throttled" creative flow — are stated as assessment, not as measurement.

---

## 1. The two axes

The organizing idea of CADENCE is that two independent concerns run through every piece of work, and keeping them separate is what makes the work both fast and trustworthy. This is the spine of everything below.

**Axis 1 — the arc governs *what and why*.** It is the problem→solution arc: establish why the work is being undertaken at all, understand the problem, generate and choose a solution, build it, deploy it, and keep it healthy. This axis is a transformation discipline — it answers *what should we build and why is it the right thing* — and it runs in six phases (§2).

**Axis 2 — governance and gates govern *how*.** The Constitution, the Directives, the evidence contract, the manifests, and the gates answer a different question: *how do we know the thing we built is correct, traceable, and safe to ship*. This axis is indifferent to what the artifact is — it applies the same trust discipline to a vendor-selection agent, a slide deck, and a data pipeline.

These are **orthogonal**. A piece of work has a position on both at all times: it is somewhere in the Frame→Track arc, and it is at some level of evidentiary maturity (draft, checked, promoted). Conflating the two is the central failure this method is designed against: when the *how* axis (rigid evidence enforcement) is allowed to clamp down on work that is still early on the *what* axis (creative, evolving drafting), it throttles the flow it was meant to protect. §5 diagnoses that failure; §6 is the fix; and the fix is, at root, simply *re-separating the two axes so the how-axis never grips until the what-axis is ready for it.*

Orthogonal does not mean isolated. **Model and Implement are the deliberate join points:** Model turns problem evidence into a governed design, and Implement carries that design into controlled use. The phase determines what decision is being made; the artifact zone determines how much evidence is required to trust and promote its record.

```
                 THE HOW AXIS  (governance / gates / evidence)
                 promotion-ready
                       ▲
        gated,         │   ┌──────────────────────────────┐
        approved,      │   │  where a finished, shippable │
        traceable      │   │  deliverable lives           │
                       │   └──────────────────────────────┘
                       │
        advisory,      │   ┌──────────────────────────────┐
        annotated,     │   │  where drafting happens —    │
        free to move   │   │  fast, creative, ungated     │
                       │   └──────────────────────────────┘
                       └────────────────────────────────────────────────▶
                        Frame  Assess  Innovate  Model  Implement  Track
                            THE WHAT/WHY AXIS  ·  the six-phase arc
```

The rest of this handbook walks the *what* axis (§2), then the *how* axis (§3), names the patterns that live on both (§4), and then diagnoses and rebuilds the join between them (§5–§7).

---

## 2. The what/why axis — the six-phase arc

CADENCE's what/why axis is a six-phase arc: **Frame, Assess, Innovate, Model, Implement, Track.** Testing is not a phase — it is a thread that runs through Model, Implement, and Track. Each phase below is stated as: its purpose, the concrete methods it uses, the artifact it produces, and the discipline that matters most within it.

### 2.1 Frame — establish the catalyst, and name the problem worth solving

**Purpose.** Establish, in a document, why this work is being undertaken at all — and where the assignment names a domain rather than a problem, which problem inside it is worth solving.

**Methods.** Work enters through one of two paths. A **directed mandate** names the problem: restate it in one paragraph in your own words and retain the originating written instruction as evidence *(brief)*. If the mandate was verbal, first capture the attributed instruction in a dated meeting note *(interview record, Speaker M/DD)*; once the sponsor confirms the written restatement, that confirmed restatement may serve as the *(brief)*. Until confirmation, its status remains explicit and any unresolved interpretation becomes an open question rather than an attributed sponsor decision. An **exploratory assignment** names only a domain: survey it, enumerate candidate problems with rough value and feasibility, and select one with the rejection reasons recorded — the same options-against-alternatives discipline Innovate applies to solutions, applied here to problems. Either way, name the sponsor, the affected function, and the constraints the *deliverable* carries — time, audience, format, and the decision the sponsor expects to make from it — which are not the constraints the workflow operates under. If the assignment carries no measurable definition of "solved," that is the first open question (`Q1`), not a detail to settle later.

**Output.** A **catalyst document**. It names the origin, the sponsor, the problem or the selected problem, the constraints, and the decision it feeds. Where the assignment was handed down, it incorporates and cites the received instruction, which carries *(brief)*; where the problem was selected rather than assigned, the selection and its rejections carry their own tags. The class and the artifact are deliberately not the same token: a document the practitioner wrote is not a primary source because it sits in the same slot as one. Everything downstream resolves against it, and it is the one artifact that exists before any analysis has been done.

**The discipline that matters.** A received instruction is *evidence, not a finding*. Assess may contradict it — that is Assess working — but it may never silently replace it: a re-framed problem is recorded with actor, reason, and effect (`P6`), and the original stands in the record. A practitioner who quietly solves a different problem than the one they were given has produced good work nobody asked for.

### 2.2 Assess — define the problem before touching a solution

**Purpose.** Establish, in evidence, what the problem actually is, whose it is, and what "solved" means — before any solution is entertained.

**Methods.** Begin with **context sensing**: determine whether cause and effect are clear, discoverable through expert analysis, likely to emerge only through safe-to-fail probes, or too unstable for analysis before immediate stabilization. If the context is unclear, record that uncertainty, widen discovery, and reassess as evidence changes. This posture sizes how each phase runs; it does not mechanically determine the project's importance or document set.

Run a divergent discovery pass before narrowing, across three channels. **Inside the affected function**, speak with or observe the people who live the problem where appropriate — how the workday actually runs around it, not only how the process is documented; inspect retained records, workflow data, constraints, exceptions, and prior attempts; and record when direct access is unavailable. **Outside the organization**, establish how comparable operations have framed, measured, and addressed the same problem, tagged *(published research, retrieved YYYY-MM-DD)* or *(public web, observed YYYY-MM-DD)* — this enters as evidence *about the problem*, because an imported solution is not a root cause and reaches Innovate as option material, never as a selection already made. **On the organization's own shelf**, inventory what is already owned and permitted — systems of record, approved models and tools, licensed platforms, data already collected — and the approval path for anything new, because the escalation ladder in §2.4 cannot start from the least machinery that would work without knowing what machinery is already there. Size each channel to the risk and reach of the problem (`P4`); a channel searched and found empty is recorded as searched, not left silent. Build a SMART problem statement and project charter (sponsor, core and extended team, support needed, timeline). Map the current workflow step by step, marking pain points, the step that most constrains throughput, and relevant system interactions. Use 5 Whys, fishbone, or another proportionate root-cause technique, but treat every proposed root cause as a **hypothesis until corroborated**. Capture the current KPI baseline, its time window and population, and a sanity check that the measurement is reliable enough for the decision. Then state the target that will later prove success — for example, *reduce cycle time from 8 weeks to 3 weeks by a named quarter while holding accuracy at or above 90%.*

**Output.** A problem charter, a trustworthy current-state baseline, an inventory of the means already available and permitted, and a root-cause analysis that distinguishes observations, hypotheses, and corroborated causes. Downstream phases may revise that record when new evidence arrives, but never silently: the changed conclusion and its evidence are versioned.

**The discipline that matters.** Assess ends with *evidenced root-cause hypotheses, not a list of pain points*. The Innovate phase brainstorms against those causes; if Assess hands it symptoms presented as certainty, the whole downstream effort inherits an untested premise. Where the evidence contradicts the Frame catalyst document, Assess says so on the record and re-frames with the sponsor before Innovate opens — quietly solving the assigned problem when the evidence names a different one is the assigned-work form of the same failure.

### 2.3 Innovate — generate options against root causes, then choose

**Purpose.** Produce a genuine option space and select from it deliberately, rather than defaulting to the first plausible solution.

**Methods.** Use the ideation techniques as a **menu**, chosen for the kind of stuckness to break: First Principles or TRIZ for assumed constraints; Lateral Thinking or Six Thinking Hats for reframing and perspective; SCAMPER for changing an existing form; Systems Thinking for interactions and second-order effects. Apply at least one fitting technique to each material root-cause hypothesis and generate several alternatives; add another technique only when the option space is still narrow. Then use an **effort-vs-impact matrix** to sort ideas into Quick Wins (high impact, low effort — start here), Major Projects (high impact, high effort — plan carefully), Fill-ins, and Thankless Solutions.

**Output.** A prioritized shortlist of solution concepts with a defensible rationale for why the chosen one was chosen.

**The discipline that matters.** A solution earns its place against alternatives; it is never assumed. The rejected options and the reason for rejection are part of the record.

### 2.4 Model — select tools, design architecture, prototype, validate

**Purpose.** Turn the chosen concept into a technical design and a working prototype, and prove the design against reality before committing to it.

**Methods.** Tool and architecture selection follows an ordered **escalation ladder**: start with the least machinery that could satisfy the criteria — which begins with what the organization already owns and is permitted to use, per the Assess inventory — prove where it fails, and move up only on evidence. Introducing new machinery is itself a rung and carries its own approval cost; an option ruled out because it is unapproved is recorded as *excluded*, not as *failed*, so a permission blocker is never mistaken in the record for a technical one. A common AI-work example is **deterministic workflow or conventional software → retrieval/model-assisted component → single agent → multi-agent orchestration**. The reusable pattern is the escalation rule, not those particular rungs (`P4. Simplicity and Proportionality`). Prototype, then **test and validate**, then refine. This is where test-and-validate is first named; verification continues through the phases that follow.

**Output.** An architecture, a working prototype, and validation evidence — captured in the project's **SDLC document set**: a manifest-declared set selected proportional to the criteria in §3.2 (`P4`), with exactly one **authority document** serving as the governing path to each canonical definition. A simple automation may need only a user story and a project plan/WBS; a complex system may add an SRS, architecture blueprint, and software design description. Success criteria are stated as *measurable* conditions, and every later change to them is recorded as a dated, versioned revision rather than an overwrite.

**The discipline that matters.** However many documents the project calls for, there is exactly **one** authority document and one authoritative definition of each fact. Before Implement, make an explicit **continue / pivot / stop** decision from the prototype evidence, expected value, feasibility, and risk. This is a what-axis investment decision, not an artifact-promotion gate. A project that cannot say what governs or why the validated concept should continue has not finished Model.

### 2.5 Implement — pilot, train, govern, scale

**Purpose.** Move the validated model into real use without letting it outrun its evidence or its users.

**Methods.** A time-boxed pilot with a small real cohort integrated into real cases — on the order of a 30-day pilot, a handful of users, a handful of real cases. Test the pilot against its acceptance criteria, capture failures and operator feedback, and run regression and operational-safety checks at each staged rollout. Add role-specific training and enablement with safe sandboxes, change management, a governance framework with human-in-the-loop checkpoints, and SOP documentation. Scale only on the evidence from the preceding stage.

**Output.** A deployed, governed workflow with the human-control surfaces the Constitution requires (`P6. Human Control and Transparency`: cancel, retry, resume, resolve; overrides recorded with actor and reason).

**The discipline that matters.** The agentic engineering stack of §3 *is* the Implement discipline made concrete: its operator controls, its append-only evidence trees, and its promotion boundaries are the working version of pilot → govern → scale.

### 2.6 Track — measure, evaluate, arrest drift, prove ROI

**Purpose.** Keep the deployed solution healthy and demonstrate that it is delivering the value Assess promised.

**Methods.** KPI monitoring against the Assess-phase baseline and targets, using an ongoing correctness instrument appropriate to the artifact — for AI behavior, this may include **evals**, drift signals computed over run history, and prompt or DSPy-style optimization driven by results and user feedback. For a long-horizon deployment, define short intermediate target conditions so progress can be falsified early rather than waiting for the final ROI calculation. Tie measured time saved and outcomes back to the original charter, retaining the baseline definition and measurement limits.

**Output.** A live measurement surface and an ROI narrative grounded in measured facts, not anecdote (`P7. Validation Before Commercialization`: readiness depends on benchmark and operations evidence).

**The discipline that matters.** *Nothing is credited against a baseline nobody measured.* Track reports against the Assess-phase baseline with its window, population, and stated measurement limits carried forward intact. Where the baseline is absent or was never trustworthy, the result is reported as unproven rather than estimated backwards from the outcome — the `P7` discipline applied to the method's own final phase.

### 2.7 The arc as a loop

The arc is drawn as six phases but it runs as a loop: Track feeds the next Frame. A drift alert or a missed KPI is a new problem statement — on a later turn that alert is the catalyst, standing in place of a sponsor's brief, and Frame's job shrinks to naming what changed and what decision it now feeds. The method's value compounds when each cycle's Track output becomes the evidence base for the next cycle's Assess.

---

## 3. The how axis — the agentic engineering stack

Everything in §2 answers *what to build*. This section is the machine that builds it correctly. Six pieces together make an agent-produced deliverable trustworthy: doc-as-code (§3.1), the authority document (§3.2), the evidence contract (§3.3), the gated build pipeline (§3.4), the governance layer (§3.5), and the scaffold that seeds the shared parts (§3.6). An agent executing Model and Implement work should treat this section as its build manual.

### 3.1 Doc-as-code: the deliverable is prose, the code exists only to check it

The foundational move is to treat a documents repository like a software repository. The deliverables are prose (research notes, a plan, a presentation); the code that accompanies them does not *produce meaning*, it *checks* meaning. Renders are generated from specs, never hand-edited: a spec file is the source, and its rendered outputs (HTML, PDF) are derived from it by a render script; a copy change lands in the spec first, always. The rule generalizes to a spec-as-contract discipline: *iterate on the spec, regenerate the draft, never hand-edit generated output.*

**Why it matters.** It makes prose reviewable, diffable, and reproducible — a rendered deliverable can be regenerated *reproducibly in the documented environment* (same toolchain, fonts, and engine), which is the reproducibility the Constitution asks for (`P5`).

### 3.2 The authority document and the SDLC document set — one governing path to every canonical definition

The method designates, per project, a **document set**: the SDLC documents the project actually needs, declared once in the project **manifest** and selected proportional to delivery risk, number of audiences and interfaces, external obligations, reversibility, coordination and hand-off needs, and expected lifetime (`P4`). Context sensing in Assess informs how the work proceeds, but no problem-domain label mechanically selects a document set. The manifest records the selection rationale. A simple automation may need only a user story and a project plan/WBS; a complex system may add an SRS, architecture blueprint, and software design description. Each declared document names its type and upstream dependencies. A project may define leaner or fuller document profiles, but only with recorded selection criteria and explicit required and optional sections.

Whatever the set, exactly **one** document is designated the **authority document**: the governing index and decision record through which every requirement, criterion, assumption, and risk resolves. It may contain a definition directly or point to one exact canonical definition in a declared companion; it may not allow the same fact to be defined independently in two places. The **DPPD** (Detailed Project Plan Document) is the reference format when one consolidated plan is proportionate; in a larger set the manifest names the authority document and its canonical pointers. *When documents disagree, the authority document's designation and resolution record govern, and the difference is recorded.* The set can flex; authority and definition ownership cannot.

**The default identifier set.** Every identifier resolves through the authority document to exactly one canonical definition, whether held there or at its declared companion pointer. The default below follows the reference project's order-to-cash DPPD, including its established open-question form (`Q1`, not `Q-1`). The point is collision-free meaning inside a project, not retroactive renaming of an existing authority document:

| Prefix | Means | Prefix | Means |
| --- | --- | --- | --- |
| `FR-` | functional requirement | `RC-` | root cause |
| `NFR-` | non-functional requirement | `O-` | option considered |
| `SC-` | success criterion | `Q` | open question (`Q1`, `Q2`, …) |
| `S-` | in-scope item | `X-` | exclusion (out of scope) |
| `US-` | user story | `AC-` | acceptance criterion |
| `A-` | assumption | `R-` | risk |

Identifiers are **stable**: once assigned, a number is never reused and never renumbered, so a requirement or an open question keeps its name as the document grows. A project may extend or use a different recorded namespace, but it must define that namespace once in its authority document and must not give one token two meanings.

### 3.3 The evidence contract — typed claims, and "absent is a valid outcome"

The most distinctive part of the stack is the **evidence-tag contract**. Every claim in a governed deliverable carries exactly one tag from a closed set of evidence classes, or it does not appear. The set is closed on purpose: a claim that fits none of the classes has no admissible source and is cut. **The set itself is published in Appendix A** — a contract an agent cannot enumerate is a contract it cannot enforce.

The classes are not interchangeable. Appendix A groups them by source relationship — primary project sources, external published sources, operator or engagement records, and unvalidated assumptions. That grouping is not a universal strength ranking: directness depends on the claim. A first-hand operator record is direct evidence of that operator's own experience but cannot establish a fact about the client; vendor documentation is primary for a vendor capability but not for the client's deployment of it.

Quotation hygiene is separate and strict: every quotation is verbatim, whole, and traced to a primary source, and *a green gate is never evidence that a quote is accurate* — the gate proves only that a quotation is attributable and dated; whether it is verbatim is a human read.

Two rules give this its character and are worth carrying forward verbatim:

> **Absent is a valid outcome.** A claim that fits no class is cut, not softened.

> **Never claim more verification than was performed.**

This contract is why a governed deliverable carries the traceability it does, and it supports confidence in a room with the people who own the systems being described. It is also — see §5 — the single heaviest source of friction when applied to work that is still being drafted, which is why §6 changes *when* it binds rather than *whether* it does.

### 3.4 The gated build pipeline — gated phases, adversarial verification, evidence over narrative

The *build* method runs as a pipeline: a single coding task passes through seven fixed phases — **plan → build → test → review → document → ship → verify** — each executed by a fresh sub-agent whose only inputs are the task contract, the working tree, and the previous phase's output. The reference implementation also uses an acceptance-criterion coverage **Grader**, in addition to the Critic and Advocate, for ten sub-agents in all. Its transferable ideas:

- **A verdict computed by script, not asserted by a narrator.** The pipeline emits a PROMOTE / RETRY / QUARANTINE verdict from an append-only evidence tree; a final check re-derives the verdict from the evidence even if a status was mis-set. *Job outcomes are decided by evidence, not by the agent's story about the evidence.*
- **Adversarial consensus in fresh context.** At the test and review gates, an independent **Critic** and **Advocate** run in parallel, each seeing only the contract and the change set — not the builder's reasoning, not each other. A Critic verdict of `fail` fails the gate; an Advocate dissent is recorded verbatim and blocks promotion until a human resolves it.
- **Falsifiability.** A criterion counts as verified only if its check went RED before the change *for the right reason* and passes after. `NOT RUN` is never a pass.
- **Append-only attempts.** Every retry writes a new directory; existing attempts are never mutated. The audit trail cannot be edited to hide a failure (a Constitution prohibition: *destructive artifact mutation used to hide failures*).
- **Deterministic validators pinned by regression fixtures.** The non-LLM validators emit `pass | warn | fail` and are pinned byte-for-byte against frozen fixtures, so a change in their output is caught immediately. Reproducibility is tested, not asserted.
- **Stated limits.** Every gate publishes what it does *not* check, alongside what it does, because *a gate trusted for more than it does is worse than no gate.* A green verdict is a statement about the checks that ran, never about the checks nobody wrote.
- **Honest degradation.** When a check cannot run, it is reported as skipped, not folded into the pass. The reference pipeline's **container-green** result is treated as necessary-not-sufficient until the target runtime is exercised; the proposed finalization architecture applies the same rule to a clean-room-green result. An unrun check is never counted as a passed one.
- **A metered run allowance.** *(Target design.)* As specified, nothing bounds the pipeline's append-only retry loop — a task that never satisfies its Grader can respawn without limit — and no attempt records what it consumed. So each attempt now logs its own model input and output, tool and compute units, and wall-clock on the same append-only tree that already holds its inputs and timestamps (`P5`). This **usage meter** *reports; it never throttles a spawn on the fast path.* The one automatic stop is a **run ceiling** that trips on genuine non-progress — a set number of consecutive attempts with no gain in the Grader's acceptance-criterion coverage — a liveness concern (`P1`), not a spend limit; it reaches the pipeline's existing QUARANTINE verdict rather than a new gate. A declared **run allowance** — the compute a run may draw, set in the task contract with its unit and warn threshold (`P4`) — is by contrast an operator limit: crossing it *warns*, and a hard cap *escalates to the `P6` operator controls* (cancel, raise, resolve) rather than auto-quarantining, because a resource count must never overturn a run still making progress toward a passing gate (`P1`/`P2`). The meter also states what it cannot see — out-of-band tool cost, human exploration — because *a meter trusted for more than it measures is worse than none.* A ceiling that blocks on total consumption waits until real runs calibrate one.

### 3.5 The governance layer — Constitution, Directives, and the two-line fork

Above any single project sits a governance split: a **Constitution** (the *why* — internalized principles, priority-ordered) and **Directives** (the *what/how* — enforceable rules, tiered by enforcement into block / warn / guide).

**The Constitution.** CADENCE is governed by a seven-principle Constitution, referenced throughout as `P1`–`P7`:

- **`P1` Safety, Correctness & Repository Integrity** — never ship a change that knowingly violates acceptance criteria, policy, or operator safety; prefer explicit failure over silent unsafe behavior; treat protected paths and policy controls as hard boundaries.
- **`P2` Evidence Traceability** — every quality, benchmark, and operational claim maps to concrete evidence; reports distinguish measured facts from interpretation; missing evidence blocks a completion claim.
- **`P3` Security & Secret Hygiene** — no credentials or secret material in committed content; least-privilege; rotate exposed keys immediately.
- **`P4` Simplicity & Proportionality** — match implementation complexity to the size and risk of the problem; avoid speculative abstractions, framework inflation, and enterprise patterns without immediate need.
- **`P5` Reproducibility & Operational Reliability** — capture phase inputs, outputs, timestamps, and metadata; keep artifacts append-only and audit-friendly; build so another operator can replay the result.
- **`P6` Human Control & Transparency** — provide explicit operator controls (cancel, retry, resume, resolve); record overrides with actor, reason, and effect; do not hide recovery behind opaque automation.
- **`P7` Validation Before Commercialization** — internal validation gates are met before commercialization claims; readiness depends on benchmark and operations evidence, not anecdote.

When principles conflict, resolve them in this **decision order**: safety and correctness → evidence traceability → security → simplicity and proportionality → reproducibility → human control and transparency → validation before commercialization. The order lists all seven principles at their numeric positions, and it is the tie-breaker the rest of the method leans on — most importantly in §5, where a system optimized for the top of the order at the expense of `P4` became unusable. One qualification: `P6`'s operator controls are a **floor, not a tradeoff**. A higher principle may change *how* cancel, retry, resume, and resolve are provided; it never licenses removing them.

**The Directives** are the enforceable expression of the Constitution: concrete rules a check or a human can apply, each tagged by enforcement strength — *block* (a gate refuses), *warn* (recorded, never blocks), or *guide* (advisory). The Constitution says *why*; the Directives say *what*, in terms a machine can act on. The metered run allowance (§3.4) registers at these tiers rather than as new machinery: the usage meter is a *guide*; the run ceiling is a *block* only in the sense the §3.4 pipeline already blocks — a non-progress stop that reaches the existing QUARANTINE verdict, not a new gate in the zone lifecycle; and the run allowance is a *warn* that escalates to the `P6` operator controls at a hard cap, never a promotion veto.

**The two-line fork.** The layer's most important operational pattern: keep a **governed line** (frozen, gated, submission-ready) and a **live line** (fast, working) as two lineages from a common ancestor. The governed line is a read-only reference; the live line is where work happens; a reconciliation record maps every divergence and records how each was resolved rather than silently syncing them. This pattern is, in miniature, the whole thesis of CADENCE — separate the place that must be trustworthy from the place that must be fast — and §6 generalizes it from an emergency measure into the default architecture.

### 3.6 The scaffold — seed the shared parts on day one

CADENCE can be packaged as a project scaffold (a template) so the *shared* parts of the stack are seeded into a new project from the first commit: the governance stack (Constitution, Directives, agent specifications), gate tiers, version-control hooks, build-pipeline agent definitions, and artifact and log directories. The scaffold is an implementation companion, not embedded in this handbook. It seeds shared mechanics; the authority document and any project-specific evidence classes are authored per project. Its intent is the guiding principle of the whole how-axis: *governance as infrastructure that is mechanically enforced, not advice that is politely ignored.* §5 is the caution that comes with it — a scaffold also makes it easy to seed enforcement heavier than the work can bear.

---

## 4. The signature patterns

These are the reusable techniques that make up the method's connective tissue. An agent should recognize these by name and apply them without being re-taught. They live on both axes; the parenthetical points to where each is defined.

1. **The authority document.** Per project, a proportionate manifest-declared document set has exactly one governing index and decision record (a DPPD in the consolidated reference format); every identifier resolves through it to one canonical definition, and disagreements are recorded and resolved there. (§3.2)
2. **Typed evidence with "absent is valid."** Every claim carries one evidence class or is cut; verification is never overclaimed. (§3.3)
3. **The two-line fork.** A frozen, gated reference line and a fast, working line, joined by an explicit reconciliation map — never a silent sync. (§3.5)
4. **Spec-is-source, render-is-derived.** Edit the spec, regenerate the artifact; a hand-edited render is a defect. (§3.1)
5. **Verdict by script, not by narrative.** The machine reads the evidence tree and computes PROMOTE/RETRY/QUARANTINE; the agent's prose cannot override it. (§3.4)
6. **Adversarial consensus in fresh context.** Independent Critic and Advocate, contract-only, parallel — dissent is recorded and blocks, never averaged away. (§3.4)
7. **Falsifiability before green.** A check must fail for the right reason before it is allowed to pass; `NOT RUN` is never a pass. (§3.4)
8. **Append-only evidence.** Every attempt is immutable; the trail cannot be rewritten to hide a failure. (§3.4)
9. **Determinism pinned by regression fixtures.** Reproducibility is a tested property, not a claim. (§3.4)
10. **Governance as tiered infrastructure.** Constitution (why) + Directives (what) + hooks (block/warn/guide), enforced mechanically. (§3.5–§3.6)
11. **Stated limits.** Every gate publishes what it does *not* check, because *a gate trusted for more than it does is worse than no gate.* (§3.4)
12. **Honest degradation.** Skips are labeled as skips; container- or clean-room-green is treated as necessary-not-sufficient until the target runtime is exercised; unrun checks are reported, not assumed passed. (§3.4)

---

## 5. Why guardrails become the bottleneck

This is the failure the method is designed against, and naming it precisely is what makes the redesign in §6 more than a preference.

**The shape of the failure.** A governance apparatus can be entirely correct and still become a net loss, because correctness is not the only variable — *timing and proportion* are. The discipline appropriate to a finished, about-to-be-presented deliverable is punishing when applied to prose that is still being discovered. When every iteration must satisfy the full apparatus, the friction of satisfying it outweighs the protection it offers *at that stage*, and, in the author's assessment, the enforcement throttles the creative flow it was built to protect. The checks are not wrong; they are early, and they are everywhere.

The mechanism shows up in four recurring ways:

- **Coupling makes small edits cascade.** When a version bump sweeps a "governing source" banner across every companion document, a pointer-only edit can cascade version bumps through several documents and their revision records. That is *churn that reads like diligence, and it trains the reflex the whole apparatus exists to prevent — editing text so a check goes green.* The correct response is to downgrade a cross-reference rule from *fail* to *warn* once the failure costs more than it catches.
- **Always-on evidence-tag enforcement fights iteration.** When every claim needs a tag on every pass, the discipline that makes a finished deliverable trustworthy is exactly the discipline that makes a rough draft slow to write. Under pressure the response is total — drop inline tags entirely and carry each hedge in the sentence instead — which throws away the traceability with the friction.
- **The heavy verification tiers tax the wrong step.** Container clean-rooms that rebuild and re-render a matrix of variants to check equivalence, and local-LLM review passes, add real wall-clock and setup cost. Run on every iteration, those checks cost more than they return at the drafting stage.
- **Mislocated enforcement.** Gating at the *publish* step (a pre-push hook) taxes the tight iterate-and-push loop rather than the deliberate promote-to-final step. It does not literally block drafting or local commits, but it grips the fast part of the loop instead of the slow, deliberate one.

### 5.1 The constitutional reading

In the author's assessment, the bottleneck is a violation of `P4. Simplicity and Proportionality`: *match implementation complexity to the size and risk of the problem; avoid speculative abstractions, framework inflation, and enterprise patterns without immediate need.* The apparatus was correct on the safety and evidence axes (`P1`, `P2`) but disproportionate on `P4`, and because `P4` sits below safety and evidence in the decision order, the system optimized the higher principles past the point where the lower one made the whole thing usable. The redesign is not a retreat from `P1`/`P2` — it is the reintroduction of `P4` so that the safeguards survive contact with real work.

### 5.2 What was *right* and must be preserved

The lesson is not "gates were a mistake." Gates catch real defects. Two observations from the author's own repositories, offered as instances rather than as a measured rate: a review-after-merge process produced four consecutive changes that each existed only to fix a defect an earlier one merged, and an ungated pass once shipped a spliced quotation read as an absolute. The evidence contract, the doc-as-code renders, the append-only trails, the stated limits — all of that is load-bearing and stays. What has to change is *when* and *to what* the enforcement applies.

---

## 6. The guardrail architecture — advisory by default, gate at promotion

This is the resolution of §5. It rebuilds the how-axis on two principles:

- **Advisory by default.** During generation and drafting, guardrails *annotate and report* — they never block. An agent drafting a research note sees evidence-tag suggestions, cross-reference warnings, and quotation flags as inline advisories, and keeps moving.
- **Gate at promotion only.** Hard enforcement may block only at a promotion between zones, never while an artifact is being drafted. In the three-zone lifecycle (§6.1), the full deterministic gate may block Draft → Candidate, and its isolated clean-room re-run may block Candidate → Approved. Both guard a *slow, deliberate* promotion step; neither grips the *fast, creative* act of writing.

Together these re-separate the two axes. The what-axis (drafting) runs free; the how-axis (hard gates) grips only when an artifact crosses into "shippable." The two-line fork of §3.5, born as an emergency measure, becomes the default architecture — automated and reconciled, not manual and frozen.

### 6.1 Three zones instead of one gate

Replace the single always-on gate with three zones an artifact moves through — a draft → candidate → approved lifecycle fused with the evidence contract:

| Zone | Enforcement | What runs | Blocks? |
| --- | --- | --- | --- |
| **Draft** | Advisory only | Fast lints: untagged-claim *hints*, quotation-symmetry, broken-link *warnings*. Sub-second, host-only. | Never |
| **Candidate** | Full deterministic gate | The complete gate — the content checks (evidence-tag grammar, cross-reference resolution, revision-history immutability, link integrity, render fidelity, and manifest/registry) plus the self-test that proves those checks still fire and a shell-lint of the tooling. This is the promotion gate. | Yes, to promote |
| **Approved** | Frozen + clean-room | The gate re-run once in an isolated clean-room at promotion to final; advisory LLM review optional. Thereafter read-only. | Yes, to finalize |

Promotion between zones is a version-control move (`git mv`) plus a commit — a free audit trail. Those two promotion boundaries are the only points at which a zone gate can block.

### 6.2 Decouple the checks

The cascade problem (§5) is a coupling problem. Three specific decouplings:

1. **One place asserts a version; everywhere else points loosely.** A single manifest is the one place a current version is asserted; a pointer in another document that names a version produces a *warning* when it drifts, never a failure. This kills the multi-document cascade at its source.
2. **Revision rows are history and are never swept.** A revision row records what was true when it was written and is excluded from version bumps. A find-and-replace across a file must never rewrite one.
3. **Evidence tags bind at candidate, not at draft.** Tags are *suggested* in Draft and *required* at the Candidate gate. An agent can write a whole first draft untagged and get advisory hints; the tags become mandatory only when the artifact is proposed for promotion — which is also when the author actually knows which class each claim belongs to.

### 6.3 Right-size the infrastructure

**The host gate stays fast.** Its content checks run on the host in seconds, with a minimal toolchain (a script runtime, version control, and a shell-lint tool; a PDF text-extractor where a render is checked). It is the everyday instrument, and it should keep that small footprint.<br>
**The clean-room runs once, at finalization** — not on every push. It verifies the shipped artifact against a fresh checkout, which is what it is actually good at, and stops taxing iteration.<br>
**The LLM review tier is opt-in and out of the hot path.** Reserve it for high-stakes artifacts at the candidate→approved step, invoked deliberately, never wired into a push hook. Its known false-positive classes (flagging unchanged context; over-applying a rule to text that only *describes* a proposed system) make it a poor blocking gate and a fine advisory one.<br>
**Hooks warn, they don't block.** The pre-push hook becomes advisory; blocking lives at the promotion command, where a human is already deciding.<br>
**Right-size the run allowance, too.** The same logic that keeps the heavy tiers off the hot path applies to the orchestrator's own spend: meter every run, but keep the meter advisory and let the build pipeline's own non-progress stop (§3.4) be the only automatic halt — the zone lifecycle blocks only at its two promotion boundaries. A hard consumption cap waits for measured run data rather than a hand-picked number. *(Target design.)*

### 6.4 Risk-based depth (optional refinement)

If even the Candidate gate proves too heavy for low-stakes artifacts, scope its *hard* checks to high-consequence claim classes only — verbatim quotations, sourced external facts, and figures — and leave everything else advisory. Gate hardest exactly where a wrong claim is a credibility event, and stay light everywhere else.

---

## 7. Adoption plan

A phased rollout so the architecture never repeats the failure of arriving all at once. Each phase is independently useful and reversible. The durations are rough estimates, not measured, and assume a solo operator working an existing codebase.

**Phase 0 — Extract the invariants (≈½ day).** Pull the twelve signature patterns (§4), the evidence classes (§3.3), and the Constitution and Directives (§3.5) into the project scaffold as the canonical, versioned source, so every new project inherits the *principles* without inheriting a heavy gate. If the scaffold already carries a Constitution and Directives, this is *revise and align* them and *add* an evidence-classes reference.

**Phase 1 — Advisory everywhere (≈1 day).** Convert the existing checks to emit advisories (exit 0, annotated output) and remove blocking from the pre-push hook. Nothing blocks yet. This phase is intended to address the reported bottleneck directly, and its effect should be measured before the later phases add enforcement back.

**Phase 2 — The promotion gate (≈1–2 days).** Introduce the three-zone lifecycle and a single `promote` command that runs the full gate at the `draft → candidate` boundary and blocks there. Wire the version-control move that performs promotion. Now hard enforcement exists again — but only at a promotion boundary, never during drafting. (The second blocking boundary, `candidate → approved`, is right-sized in Phase 4; see §6.1.)

**Phase 3 — Decouple (≈1 day).** Land the three decouplings (§6.2): manifest-as-single-version-authority, revision-row immunity, tags-required-at-candidate. Verify on a real edit that a pointer change no longer cascades.

**Phase 4 — Right-size the heavy tiers (≈1 day).** Move the clean-room to finalization-only and the LLM review to opt-in. Keep the append-only evidence sinks and the *stated-limits* discipline throughout.

**Phase 5 — Re-measure (ongoing).** Track the balance that actually matters: drafting speed in the Draft zone (time-to-first-draft, iterations-per-hour) *against* defects caught at promotion. The architecture succeeds if drafting is fast *and* the promotion gate still catches what the old gate caught. This is the `P7` discipline applied to the method itself — readiness proven by measured evidence, not by the elegance of the design.

---

## 8. Anti-patterns to refuse

Carried from the Constitution's prohibited list and the §5 analysis, stated so an agent can refuse them by name:

- **Placeholder-driven delivery** — no TODO/TBD/`[your-x]`/lorem-ipsum in a production file. (A draft may hold them; a promoted artifact may not.)
- **Fabricated or unreproducible metrics** — every number in a revision row or report comes from a re-runnable instrument, not an ad-hoc pipeline nobody kept. Recording an ad-hoc figure once and reusing it as fact is the recurring version of this defect.
- **Pattern inflation** — no speculative abstraction or gate without immediate, measured need. This is the §5 lesson as a standing rule.
- **Destructive artifact mutation to hide failure** — append-only always; never rewrite the trail.
- **Declaring PASS from low-integrity evidence** — missing logs, missing timestamps, or context-free screenshots are not proof.
- **Editing text so a check goes green** — the reflex the whole method exists to prevent. Fix the content or take a visible, documented exemption; never route around the gate.

---

## 9. Agent Operating Card

*A compact contract for a coding agent directed to build an artifact under this method. Read this section first; the rest of the document is its justification. One status note: the Draft / Candidate / Approved zone workflow below is the §6 target design, live only once the §7 adoption plan lands in a given project — until then, follow that project's own stated contract and apply this card's "Always" and "Never" rules, which hold everywhere.*

**Locate yourself on both axes before acting.** Which phase is this (Frame / Assess / Innovate / Model / Implement / Track)? Which zone is the artifact in (Draft / Candidate / Approved)? Your enforcement obligations come from the zone, not the phase. Before establishing what is wrong, establish what you were asked: a received instruction is evidence, not a finding, and if none was supplied, producing the catalyst document is the first task, not an optional preliminary.

**In Draft:** move fast. Write the spec, not the render. Take advisory hints; do not block on them. Untagged claims are fine here. Never hand-edit a generated render — change its spec and regenerate.

**To promote Draft → Candidate:** run the project's documented full deterministic gate; this handbook does not invent a command when the project has not supplied one. Every claim now carries exactly one evidence class or is cut — *absent is a valid outcome.* Every quotation is verbatim, whole, and sourced. Every identifier resolves through the authority document to one canonical definition — the governing document the project manifest designates (§3.2). Every artifact has a manifest row. If a check fails, fix the content or take a visible exemption — never route around it.

**To finalize Candidate → Approved:** re-run the gate in the clean-room once. Optionally invoke advisory LLM review for high-stakes artifacts. Then freeze: Approved is read-only.

**Always:** compute verdicts from evidence, not narrative. Keep attempts append-only. State what you did *not* check. Never claim more verification than you performed. When two documents disagree, resolve the conflict through the authority document and record the difference and decision.

**Never:** claim a green gate proves a quote is accurate (it proves attribution and date only); assume a skipped check passed; rewrite a revision row — they are history, excluded from version bumps and never swept by a find-and-replace (§6.2); sync the two lines silently; ship a placeholder or an unreproducible number.

---

## Appendix A — The evidence classes (the closed set)

The set §3.3 binds to. A claim in a governed deliverable carries **exactly one** of these, or it is cut. Where a class names a date, the date is required — a tag without it is malformed and fails the gate.

Three classes take a parameter that is not a date, and all three are required in the same way as a date is. **`Speaker`** is the named person the testimony is attributed to, on the record. **`Employer`** is the name of the organization the operator's direct experience was gained at, written out in the tag, so the bound on that experience is legible without consulting another document. **`key`** is the retained record's stable identifier in the project's own store — the value that lets a reader retrieve the exact transcript or deliverable being cited, not a date of retrieval.

| Band | Class | Use for |
| --- | --- | --- |
| **Primary sourced** | *(brief)* | The governing written task document or statement of work, or a sponsor-confirmed written restatement of a verbal mandate. |
| | *(interview record, Speaker M/DD)* | Attributed, dated testimony from a named speaker on the record. |
| | *(vendor documentation, verified YYYY-MM-DD)* | A system owner's or vendor's own documentation, checked on the stated date. |
| | *(vendor recording, retrieved YYYY-MM-DD)* | A vendor-published recording. Auto-generated captions are never a verbatim source. |
| | *(correspondence, screenshot-evidenced YYYY-MM-DD)* | Written exchange, with the evidencing capture retained. |
| **External published** | *(published research, retrieved YYYY-MM-DD)* | Peer-reviewed or formally published work, cited to author, venue, and year. |
| | *(public web, observed YYYY-MM-DD)* | A public page, dated at observation because it is volatile. |
| **Operator / engagement records** | *(operator-substantiated, Employer)* | The operator's own direct professional experience; establishes only that bounded experience. |
| | *(engagement record, key YYYY-MM-DD)* | A retained prior-engagement transcript or authored deliverable. Method only; never a fact about the current client. Transcript wording is paraphrased unless separately confirmed against a stable source. |
| | *(operator instruction, YYYY-MM-DD)* | A dated operator decision, authorization, ownership fact, or resolution that the repository cannot settle. Not a source for a separate claim about a client. |
| **Unvalidated** | *(assumption — to validate with the business)* | A stated premise not yet confirmed. Each one maps to an open question (`Q1`, `Q2`, …). |

Two rules govern the set: **absent is a valid outcome** — a claim that fits no class is cut, not softened — and **never claim more verification than was performed.** A project may add a class by amending this appendix; it may not silently widen an existing one.

---

## Appendix B — Glossary

- **CADENCE** — the method described here: a governed, evidence-bearing agentic engineering method built on two orthogonal axes. Named for the creative cadence it exists to protect.
- **The six-phase arc** — the *what/why* axis: Frame, Assess, Innovate, Model, Implement, Track.
- **Catalyst document** — Frame's output: the assigned problem as handed over, or, where the assignment named only a domain, the problem selected from it. Distinct from the *(brief)* evidence class, which types a received instruction, not an authored one. On a later turn of the loop a Track drift alert is the catalyst (§2.1, §2.7).
- **Authority document** — the single governing index and decision record designated in the project manifest; every identifier resolves through it to one canonical definition, and document conflicts are resolved and recorded there (§3.2).
- **Document set** — the manifest-declared set of SDLC documents a project carries, selected proportional to delivery risk and coordination needs (`P4`); contains exactly one authority document (§3.2).
- **The gated build pipeline** — the *build* method: seven fixed phases, `plan → build → test → review → document → ship → verify`, each run by a fresh sub-agent, ending in a script-computed PROMOTE / RETRY / QUARANTINE verdict.
- **DPPD** — Detailed Project Plan Document; the reference format the authority document takes when a single consolidated plan is proportionate (§3.2).
- **Manifest** — the one place a project declares its document set, selection rationale, dependencies, designated authority document, and current versions; other documents point at it loosely (§3.2, §6.2).
- **Evidence class / tag** — a typed provenance marker attached to every claim in a governed deliverable; the closed set is Appendix A.
- **Two-line fork** — a frozen, gated governed line and a fast working line, joined by a reconciliation record.
- **Draft / Candidate / Approved** — the three zones of the guardrail architecture; enforcement rises at each boundary (§6.1).
- **The three tiers** — the host gate (fast, deterministic) / the clean-room (isolated re-run at finalization) / the advisory LLM review (opt-in).
- **Critic / Advocate / Grader** — the pipeline's independent verification roles: Critic and Advocate provide fresh-context adversarial consensus; the Grader checks acceptance-criterion coverage (§3.4).
- **Constitution / Directives** — the *why* (priority-ordered principles `P1`–`P7`, §3.5) and the *what/how* (tiered enforceable rules) of the governance layer.

*Epistemic labels: most of this handbook describes established practice; §§6–7 present the target guardrail architecture and §3.4 the metered run allowance, designs to be installed and then measured, not finished results; §2.1 Frame is anticipated practice, reasoned rather than accumulated, and is to be revised against real assignments; causal readings are the author's assessment, labeled as such.*

---

## Appendix C — Revision Record

Rows are history. They record what was true when written, are excluded from version bumps, and are never rewritten (§6.2). Each row cites the section numbering current at the time it was written; rows earlier than v4.3 predate the renumbering that added Frame.

The sequence opens at v1.1 — the predecessor's final version, retained in `_superseded/` — and the CADENCE line begins at v3.0. There is no v2 series: the rename took a fresh major number rather than continuing the predecessor's count.

| Version | Date | Change |
| --- | --- | --- |
| v1.1 | 2026-07-31 | Predecessor, published as *The AIM-IT Agentic Engineering Method*. Superseded by v3.0; retained in `_superseded/`. |
| v3.0 | 2026-07-31 | Renamed to CADENCE. Rewritten as a standalone, project-agnostic specification: project- and repository-specific references removed, the guardrail architecture restated as target design, epistemic labels revised. |
| v3.1 | 2026-08-01 | Accuracy-review corrections. Published the closed evidence-class set as Appendix A (§3.3 previously asserted a closed set it did not enumerate). Replaced the §3.2 prefix list with a canonical, collision-free table (`SC-` fixed to *success criterion*; *scope change* → `SCH-`; *stakeholder* → `STK-`; `S-` fixed to *in-scope item*; `RC-`/`O-`/`Q-` added). Gave patterns 11–12 definitions in §3.4 and the §-pointers §4 promises. Corrected `container-green` → `clean-room-green`. Removed "Grader" from the glossary (never defined in the body). Replaced the undefined "per-row exemption" in §9 with the §6.2 rule. Fixed the §1 diagram's box borders and §7 Phase 2's "blocks only there." Added this record and a date field. |
| v3.2 | 2026-08-01 | Final accuracy reconciliation. Declared UTC dating; distinguished the reference specification from project-local runtime dependencies; aligned the default identifier forms to the approved order-to-cash DPPD (`Q1`, no `SCH-`/`STK-` claim); restored the complete eleven-class evidence grammar and the Employer parameter; restored the Grader and the reference pipeline's `container-green` term; clarified that source bands are not a universal strength ranking; and moved the epistemic note ahead of the revision table for clean pagination. |
| v3.3 | 2026-08-01 | Presentation-brand alignment of the rendered PDF companion. Re-themed `render_pdf.py` to the ATTOM case-study brand carried by `deck_v3` / `outline_v3` — the coral (`#eb4734`) accent in place of the prior navy, charcoal (`#1d1d1d`) ink, warm neutral surfaces, Arial, a coral title accent bar with section-divider rules, and light table headers under a coral rule. Styling only: no section, identifier, claim, figure, quotation, or hedge in the document body changed, and the footer, classification, and pagination logic are unchanged. |
| v4.0 | 2026-08-01 | Generalized the Model-phase output from a single hardcoded DPPD to a complexity-tiered, manifest-declared SDLC document set with exactly one designated authority document (`P4` applied to documentation): §2.3's Output rewritten and given a "discipline that matters" block, §3.2 retitled and its opening rewritten (the DPPD retained as the reference authority-document format; identifier table and stability rules unchanged), §4 pattern 1 restated, §9 pointed at the manifest designation, and Appendix B given *authority document*, *document set*, and *manifest* entries. Genericized the audience: named-reader references replaced with practitioner/role language (Author row unchanged); the §3.2 identifier lineage reworded to "the reference project's order-to-cash DPPD". No evidence class, gate, zone, or Constitution text changed. |
| v4.1 | 2026-08-01 | Applied the independent recommendation pass with proportionality and evidence corrections: added context sensing without using a domain label as a mechanical document selector; strengthened discovery, baseline measurement, root-cause hypothesis handling, and visible revision; converted the ideation battery to a purpose-grouped menu; generalized the architecture escalation ladder; added a Model-exit continue/pivot/stop decision, pilot acceptance and regression testing, and conditional Track target conditions; named the axes' deliberate join points; corrected the Constitution tie-breaker to `P7`; and clarified the authority document as the governing index through which each identifier reaches one canonical definition. Document-set selection now records risk and coordination criteria, project-defined document profiles replace the unsupported implication of built-in minimal/full variants, and the shared renderer paginates long tables at row boundaries with repeated headers. |
| v4.2 | 2026-08-01 | Accuracy-review corrections from an independent proofreading pass. **§3.5: the decision order omitted `P6`** — it named six terms for a Constitution described as seven-principle and priority-ordered. `P6` is inserted at its numeric position, with its operator controls stated as a floor rather than a tradeoff. **§2.5: added the missing "discipline that matters" block** — Track was the last phase without one (v4.0 resolved §2.3's; Track's was mis-recorded as already symmetric). **§3.3: removed the residual client name**, which contradicted the document's project-agnostic scope; the neutral form used elsewhere in the file is now used throughout. **Appendix A: defined the three non-date tag parameters** (`Speaker`, `Employer`, `key`), which the gate treats as required but the appendix never explained. Normalized the authorial voice to *the author* where the referent is the writer, retaining *operator* wherever it names the `P5`/`P6` role or the evidence-class sense, so no token carries two meanings (§3.2); bounded the §5.2 gate-value observations as instances rather than a measured rate; fixed a dangling participle in §5; and noted in this record why the sequence opens at v1.1 with no v2 series. Renderer: `h1` headings no longer break away from their content, and the running footer is aligned to the body text block. No evidence class, gate, zone, phase, or identifier definition changed. |
| v4.3 | 2026-08-01 | Added **Frame** as the arc's opening phase, making the arc six phases: Frame, Assess, Innovate, Model, Implement, Track. The arc previously had no documented front door on its first turn — §2.7 said where a *later* cycle's problem comes from (a drift alert), while the sponsor's brief appeared nowhere outside Appendix A's class table. Frame covers both ways work arrives: a directed mandate that names the problem, and an exploratory assignment that names only a domain and requires the candidate problems to be enumerated, triaged, and selected on the record before one is analyzed. Its output is the **catalyst document**, which everything downstream resolves against; it is deliberately not named *brief*, because *(brief)* types a received instruction and Frame's output may be one the practitioner wrote. Its discipline is that a received instruction is evidence rather than a finding: Assess may contradict it, but only on the record (`P6`). The §2 phase template is also corrected here — it promised three blocks per phase while every phase carries four. **§2.2 Assess** gains the two discovery channels the method never directed despite publishing evidence classes for them — outside prior art, and an inventory of what the organization already owns and is permitted to use — alongside the affected-function channel already present, each sized to risk (`P4`) and a channel searched and found empty recorded as searched. **§2.4 Model** binds its escalation ladder to that inventory: "least machinery" now starts from what is already owned, new machinery is itself a rung with an approval cost, and an option ruled out as unapproved is recorded as *excluded* rather than *failed*, so a permission blocker is never mistaken for a technical one. **§2.7** closes the loop symmetrically — a Track drift alert is the next turn's catalyst. Sections §2.1–§2.6 renumbered to §2.2–§2.7; §1's axis text and diagram, §9's operating card, and Appendix B updated. A third epistemic grade, **anticipated practice**, is declared and applied to Frame: it is reasoned from the arc's logic and one worked engagement rather than from accumulated intake, and is to be revised against real assignments. No evidence class, gate, zone, identifier, or Constitution text changed. |
| v4.4 | 2026-08-01 | Executive-readiness and provenance correction. Added a concise executive summary that states the value proposition, maturity limits, and measured-pilot adoption decision. Clarified Frame's verbal-mandate path: an attributed verbal instruction is first captured as an *(interview record, Speaker M/DD)*; only a sponsor-confirmed written restatement may serve as the *(brief)*. Appendix A now states that scope explicitly, removing the prior ambiguity between sponsor evidence and the separately defined *(operator instruction)* class. The shared renderer now requests tagged PDF structure and a document outline for accessibility. No phase, gate, zone, identifier, Constitution principle, or existing evidence-class token changed. |
| v4.5 | 2026-08-01 | Added a **metered run allowance** to the §3.4 build pipeline. As specified, its append-only retry loop had no bound and no per-run accounting, so a non-terminating task could respawn without limit. Each attempt now logs its own model input and output, compute, and wall-clock on the existing append-only evidence tree (`P5`); a **usage meter** reports without ever halting a spawn (a *guide*); a **run ceiling** stops a run on genuine non-progress — consecutive attempts with no gain in Grader acceptance-criterion coverage, a `P1` liveness condition — by reaching the existing **QUARANTINE** verdict, a new trigger for an existing terminal state rather than a new gate; and a declared **run allowance** is an operator resource limit (`P4`/`P6`) that warns and, at a hard cap, escalates to the operator, never auto-quarantining a run still making progress. This adds a control and a warn signal but changes no existing gate's pass/fail criteria: no phase, zone, identifier, evidence-class token, or verdict token was added or redefined, no Constitution principle changed, and no section was renumbered; the signature-pattern count is unchanged. §3.5 registers the controls at the existing block/warn/guide tiers, §6.3 gains a right-sizing bullet, and the epistemic labels mark the mechanism **target design**, with a hard consumption ceiling deferred until real runs calibrate one. The review and playbook are resynchronized to v4.5 in the same change. |
| v4.6 | 2026-08-02 | Proofreading corrections from an executive-readiness pass; no substantive content changed. **Executive summary:** the maturity bullet said Frame "remains unproven practice," a label outside the document's three declared epistemic grades — restated using the defined terms (evidence mechanics *established practice*; §§6–7 and the §3.4 run metering *target design*; Frame *anticipated practice*). **§4 pattern 4:** removed "Tags bind the source; the render is stripped clean for the reader" — the sentence cited §3.1, which does not state a tag-stripping behavior, and an unsupported claim inside the pattern list is the defect the method itself prohibits; the pattern retains its supported core. **§2.4:** the document-set example now reads "project plan/WBS," matching §3.2's wording of the same example. **Appendix C:** the introduction now notes that each row cites the section numbering current when it was written, since rows earlier than v4.3 predate the Frame renumbering. No phase, gate, zone, identifier, evidence-class token, verdict token, Constitution principle, or signature-pattern count changed; no section was renumbered. The playbook's and review's companion pointers name v4.5 and now trail by one version — a loose-pointer drift the §6.2 rule treats as a warning, to be resynchronized on their next revision. |
| v4.7 | 2026-08-02 | Accuracy correction to the §6 zone lifecycle. Reconciled "engages exactly once" with the two blocking promotion boundaries specified by §6.1 and §7: deterministic Draft → Candidate and clean-room Candidate → Approved, never during drafting. Synchronized §6.1, §6.3, the review, playbook, outline, and diagram. Reformatted §6.3's controls as compact labeled lines after visual QA caught a list-marker collision; wording is unchanged. No phase, zone, gate check, identifier, evidence-class token, verdict token, Constitution principle, signature-pattern count, or section number changed. |

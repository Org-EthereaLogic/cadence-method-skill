# Phase Definitions — CADENCE Method Reference

> **Source of truth:** The CADENCE Method, v4.7 (final) — `docs/reference/source/CADENCE_METHOD.md`, §2.
> **Distilled from:** method §2 (the what/why axis — the six-phase arc), §§2.1–2.6.
> **Status:** Draft reference (WBS 1.1). Final polish and table-of-contents pass are WP 2.2.
> Where this reference and the method disagree, the method governs (design decision D-4).

CADENCE's what/why axis is a six-phase arc: **Frame, Assess, Innovate, Model, Implement, Track.** Testing is not a phase — it is a thread that runs through Model, Implement, and Track. Each phase below is stated as: its **Purpose**, the concrete **Methods** it uses, the **Output** artifact it produces, and the **Discipline** that matters most within it. (The arc also runs as a loop — Track feeds the next Frame, method §2.7 — which is framing, not a seventh phase, and is out of scope for this reference.)

## Frame — establish the catalyst, and name the problem worth solving

**Purpose.** Establish, in a document, why this work is being undertaken at all — and where the assignment names a domain rather than a problem, which problem inside it is worth solving.

**Methods.** Work enters through one of two paths. A **directed mandate** names the problem: restate it in one paragraph in your own words and retain the originating written instruction as evidence *(brief)*. If the mandate was verbal, first capture the attributed instruction in a dated meeting note *(interview record, Speaker M/DD)*; once the sponsor confirms the written restatement, that confirmed restatement may serve as the *(brief)*. Until confirmation, its status remains explicit and any unresolved interpretation becomes an open question rather than an attributed sponsor decision. An **exploratory assignment** names only a domain: survey it, enumerate candidate problems with rough value and feasibility, and select one with the rejection reasons recorded — the same options-against-alternatives discipline Innovate applies to solutions, applied here to problems. Either way, name the sponsor, the affected function, and the constraints the *deliverable* carries — time, audience, format, and the decision the sponsor expects to make from it — which are not the constraints the workflow operates under. If the assignment carries no measurable definition of "solved," that is the first open question (`Q1`), not a detail to settle later.

**Output.** A **catalyst document**. It names the origin, the sponsor, the problem or the selected problem, the constraints, and the decision it feeds. Where the assignment was handed down, it incorporates and cites the received instruction, which carries *(brief)*; where the problem was selected rather than assigned, the selection and its rejections carry their own tags. The class and the artifact are deliberately not the same token: a document the practitioner wrote is not a primary source because it sits in the same slot as one. Everything downstream resolves against it, and it is the one artifact that exists before any analysis has been done.

**Discipline.** A received instruction is *evidence, not a finding*. Assess may contradict it — that is Assess working — but it may never silently replace it: a re-framed problem is recorded with actor, reason, and effect (`P6`), and the original stands in the record. A practitioner who quietly solves a different problem than the one they were given has produced good work nobody asked for.

## Assess — define the problem before touching a solution

**Purpose.** Establish, in evidence, what the problem actually is, whose it is, and what "solved" means — before any solution is entertained.

**Methods.** Begin with **context sensing**: determine whether cause and effect are clear, discoverable through expert analysis, likely to emerge only through safe-to-fail probes, or too unstable for analysis before immediate stabilization. If the context is unclear, record that uncertainty, widen discovery, and reassess as evidence changes. This posture sizes how each phase runs; it does not mechanically determine the project's importance or document set.

Run a divergent discovery pass before narrowing, across three channels. **Inside the affected function**, speak with or observe the people who live the problem where appropriate — how the workday actually runs around it, not only how the process is documented; inspect retained records, workflow data, constraints, exceptions, and prior attempts; and record when direct access is unavailable. **Outside the organization**, establish how comparable operations have framed, measured, and addressed the same problem, tagged *(published research, retrieved YYYY-MM-DD)* or *(public web, observed YYYY-MM-DD)* — this enters as evidence *about the problem*, because an imported solution is not a root cause and reaches Innovate as option material, never as a selection already made. **On the organization's own shelf**, inventory what is already owned and permitted — systems of record, approved models and tools, licensed platforms, data already collected — and the approval path for anything new, because the escalation ladder in §2.4 cannot start from the least machinery that would work without knowing what machinery is already there. Size each channel to the risk and reach of the problem (`P4`); a channel searched and found empty is recorded as searched, not left silent. Build a SMART problem statement and project charter (sponsor, core and extended team, support needed, timeline). Map the current workflow step by step, marking pain points, the step that most constrains throughput, and relevant system interactions. Use 5 Whys, fishbone, or another proportionate root-cause technique, but treat every proposed root cause as a **hypothesis until corroborated**. Capture the current KPI baseline, its time window and population, and a sanity check that the measurement is reliable enough for the decision. Then state the target that will later prove success — for example, *reduce cycle time from 8 weeks to 3 weeks by a named quarter while holding accuracy at or above 90%.*

**Output.** A problem charter, a trustworthy current-state baseline, an inventory of the means already available and permitted, and a root-cause analysis that distinguishes observations, hypotheses, and corroborated causes. Downstream phases may revise that record when new evidence arrives, but never silently: the changed conclusion and its evidence are versioned.

**Discipline.** Assess ends with *evidenced root-cause hypotheses, not a list of pain points*. The Innovate phase brainstorms against those causes; if Assess hands it symptoms presented as certainty, the whole downstream effort inherits an untested premise. Where the evidence contradicts the Frame catalyst document, Assess says so on the record and re-frames with the sponsor before Innovate opens — quietly solving the assigned problem when the evidence names a different one is the assigned-work form of the same failure.

## Innovate — generate options against root causes, then choose

**Purpose.** Produce a genuine option space and select from it deliberately, rather than defaulting to the first plausible solution.

**Methods.** Use the ideation techniques as a **menu**, chosen for the kind of stuckness to break: First Principles or TRIZ for assumed constraints; Lateral Thinking or Six Thinking Hats for reframing and perspective; SCAMPER for changing an existing form; Systems Thinking for interactions and second-order effects. Apply at least one fitting technique to each material root-cause hypothesis and generate several alternatives; add another technique only when the option space is still narrow. Then use an **effort-vs-impact matrix** to sort ideas into Quick Wins (high impact, low effort — start here), Major Projects (high impact, high effort — plan carefully), Fill-ins, and Thankless Solutions.

**Output.** A prioritized shortlist of solution concepts with a defensible rationale for why the chosen one was chosen.

**Discipline.** A solution earns its place against alternatives; it is never assumed. The rejected options and the reason for rejection are part of the record.

## Model — select tools, design architecture, prototype, validate

**Purpose.** Turn the chosen concept into a technical design and a working prototype, and prove the design against reality before committing to it.

**Methods.** Tool and architecture selection follows an ordered **escalation ladder**: start with the least machinery that could satisfy the criteria — which begins with what the organization already owns and is permitted to use, per the Assess inventory — prove where it fails, and move up only on evidence. Introducing new machinery is itself a rung and carries its own approval cost; an option ruled out because it is unapproved is recorded as *excluded*, not as *failed*, so a permission blocker is never mistaken in the record for a technical one. A common AI-work example is **deterministic workflow or conventional software → retrieval/model-assisted component → single agent → multi-agent orchestration**. The reusable pattern is the escalation rule, not those particular rungs (`P4. Simplicity and Proportionality`). Prototype, then **test and validate**, then refine. This is where test-and-validate is first named; verification continues through the phases that follow.

**Output.** An architecture, a working prototype, and validation evidence — captured in the project's **SDLC document set**: a manifest-declared set selected proportional to the criteria in §3.2 (`P4`), with exactly one **authority document** serving as the governing path to each canonical definition. A simple automation may need only a user story and a project plan/WBS; a complex system may add an SRS, architecture blueprint, and software design description. Success criteria are stated as *measurable* conditions, and every later change to them is recorded as a dated, versioned revision rather than an overwrite.

**Discipline.** However many documents the project calls for, there is exactly **one** authority document and one authoritative definition of each fact. Before Implement, make an explicit **continue / pivot / stop** decision from the prototype evidence, expected value, feasibility, and risk. This is a what-axis investment decision, not an artifact-promotion gate. A project that cannot say what governs or why the validated concept should continue has not finished Model.

## Implement — pilot, train, govern, scale

**Purpose.** Move the validated model into real use without letting it outrun its evidence or its users.

**Methods.** A time-boxed pilot with a small real cohort integrated into real cases — on the order of a 30-day pilot, a handful of users, a handful of real cases. Test the pilot against its acceptance criteria, capture failures and operator feedback, and run regression and operational-safety checks at each staged rollout. Add role-specific training and enablement with safe sandboxes, change management, a governance framework with human-in-the-loop checkpoints, and SOP documentation. Scale only on the evidence from the preceding stage.

**Output.** A deployed, governed workflow with the human-control surfaces the Constitution requires (`P6. Human Control and Transparency`: cancel, retry, resume, resolve; overrides recorded with actor and reason).

**Discipline.** The agentic engineering stack of §3 *is* the Implement discipline made concrete: its operator controls, its append-only evidence trees, and its promotion boundaries are the working version of pilot → govern → scale.

## Track — measure, evaluate, arrest drift, prove ROI

**Purpose.** Keep the deployed solution healthy and demonstrate that it is delivering the value Assess promised.

**Methods.** KPI monitoring against the Assess-phase baseline and targets, using an ongoing correctness instrument appropriate to the artifact — for AI behavior, this may include **evals**, drift signals computed over run history, and prompt or DSPy-style optimization driven by results and user feedback. For a long-horizon deployment, define short intermediate target conditions so progress can be falsified early rather than waiting for the final ROI calculation. Tie measured time saved and outcomes back to the original charter, retaining the baseline definition and measurement limits.

**Output.** A live measurement surface and an ROI narrative grounded in measured facts, not anecdote (`P7. Validation Before Commercialization`: readiness depends on benchmark and operations evidence).

**Discipline.** *Nothing is credited against a baseline nobody measured.* Track reports against the Assess-phase baseline with its window, population, and stated measurement limits carried forward intact. Where the baseline is absent or was never trustworthy, the result is reported as unproven rather than estimated backwards from the outcome — the `P7` discipline applied to the method's own final phase.

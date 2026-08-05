# The CADENCE Method — A Review

**An assessment of the six-phase arc, the governance and gates, and the optimization opportunities offered by established problem-solving frameworks**

| | |
| --- | --- |
| **Author** | Anthony Johnson II |
| **Readers** | The practitioner maintaining the method, and anyone evaluating whether to adopt it |
| **Status** | v1.7 — an assessment of *The CADENCE Method* through v4.7. Recommendations remain design judgments rather than measured results; §6 records which were adopted, adjusted, or deferred, and §5 records each finding's disposition. |
| **Date** | 2026-08-02 UTC (see the Revision Record) |
| **Format** | Markdown source (this file) with a rendered PDF companion |
| **Scope** | The full method as specified in `CADENCE_METHOD.md`: the techniques of the six-phase arc, the governance and gate architecture, comparison against established external frameworks, internal-logic findings, and verdict-labeled recommendations |

## Executive assessment

- **Adoption case.** CADENCE's strongest contribution is the separation of business transformation from artifact assurance: teams can explore quickly without weakening the evidence required to promote a final deliverable.
- **Material limitation.** The method has no comparative outcome data, and its Frame phase remains anticipated practice. External-framework resemblance supports design review, not a performance claim.
- **Recommended posture.** Pilot the method with explicit measures for speed, promotion defects, operator burden, and operational results; retain the evidence contract and human-control floor while right-sizing the implementation.

---

## How to read this review

This document reviews *The CADENCE Method* on three fronts: the **techniques** the six-phase arc employs, the **governance and gates** that make up the how-axis, and the question of whether the method can be **optimized** — either by incorporating proven problem-solving patterns from outside it, or by correcting its own internal logic.

**Epistemic posture.** In the method's own zone language, this review is a Draft-zone working document: it is not a governed deliverable and carries no Appendix A evidence tags. The v4.1 pass checked the recommendations' main premises against the framework maintainers and primary professional bodies listed in §8. Every evaluative or comparative conclusion remains the reviewer's **assessment**, not a measurement — no telemetry, A/B evidence, or usage data on the method exists yet, and §7 states the limits that follow from that.

**What "independent" means here.** This review shares an author with the method it reviews. *Independent* is used throughout in one narrow sense: each pass was run in fresh context, with access to the committed artifacts but not to the authoring session's reasoning, and was required to re-derive its conclusions from the files. That is a check against an author's blind spots. It is **not** third-party review, and no claim of external validation is made.

**Relationship to the method document.** The original review recommended without applying. The v4.1 pass re-tested the recommendations and applied the supported subset to `CADENCE_METHOD.md`. The v4.2 pass then proofread the whole set and found defects in both documents — including two in this one. The v4.3 pass acted on a practitioner's account of how assigned work actually arrives, which surfaced F12. The v4.4 pass corrected the provenance of verbal mandates and narrowed this review's OODA comparison. Section 6 distinguishes the original recommendation from its final disposition so adoption is not mistaken for empirical validation.

**Tense convention.** Assessments below are written against the version they examined and carry their disposition inline. A gap described in the past tense with a *closed in vN* marker is fixed in the current method; only findings marked **open** describe the method as it stands.

---

## 1. The method in brief

So this review stands alone: CADENCE is built on two orthogonal axes.

**The what/why axis** is a six-phase problem→solution arc — **Frame, Assess, Innovate, Model, Implement, Track** — a transformation discipline that answers *what should we build and why is it the right thing*. Testing is defined as a thread through Model, Implement, and Track rather than a phase of its own.

**The how axis** is the governance and gate stack — doc-as-code, a per-project authority document, a closed evidence-tag contract, a gated build pipeline with adversarial verification, and a Constitution (`P1`–`P7`) expressed through tiered Directives. Its central architecture is **advisory by default, gate at promotion**: an artifact moves through three zones (Draft → Candidate → Approved), and hard enforcement engages only at the promotion boundaries, never during drafting.

The method's stated thesis is that these two axes must be kept separate: a piece of work always has a position on both, and the historical failure the method is designed against is the how-axis gripping work that is still early on the what-axis.

---

## 2. The six-phase arc — technique-by-technique assessment

### 2.1 Frame

**Techniques employed (new in v4.3; provenance clarified in v4.4).** Two entry paths: a directed mandate, restated and confirmed with the sponsor, with a written instruction retained as *(brief)* or a verbal instruction first captured as an attributed *(interview record)* before the confirmed restatement becomes the *(brief)*; or an exploratory assignment naming only a domain, which is surveyed, its candidate problems enumerated and triaged on value and feasibility, and one selected with the rejections recorded. Either path names the sponsor, the affected function, and the deliverable's own constraints, and treats an unmeasurable "solved" as `Q1`.

**Assessment.** The phase closes a real structural hole: before v4.3 the arc documented where a *later* cycle's problem came from — §2.7's drift alert — but had no front door on the first turn, and the sponsor's instruction appeared nowhere outside Appendix A's *(brief)* class table. Applying Innovate's options-against-alternatives discipline to *problems* rather than solutions is the right move for the exploratory path, and keeping a received instruction as *evidence, not a finding* preserves the method's central epistemic commitment at the one point where a practitioner is most likely to inherit someone else's framing unexamined.

**Stated limit — this subsection is weaker than the five below it.** Frame was written from a practitioner's account of how work is expected to arrive in a role not yet worked, and the method labels it **anticipated practice** for that reason. It has not been compared against external frameworks in the way §§2.2–2.6 were, and no engagement has yet run it: the one worked example in the companion playbook had its problem supplied, so the exploratory path is unexercised. Judge it after real intake, not now (F12; R15/R16, §6).

### 2.2 Assess

**Techniques employed (v3.3, the version first reviewed).** A SMART problem statement; a project charter (sponsor, core and extended team, support, timeline); a current-state workflow map with pain points marked; root-cause analysis via 5 Whys and fishbone; effort-vs-impact framing; and KPI targets stated up front in measurable form. *(v4.1 added context sensing, a divergent discovery pass, a captured baseline, and a bottleneck question, and dropped the effort-vs-impact framing from Assess — it was duplicated here and in Innovate, and now sits only in Innovate, where it belongs.)*

**Assessment — strengths.** The phase's closing discipline — now *Assess ends with evidenced root-cause hypotheses, not a list of pain points* — is the single strongest sentence in the arc. It is the difference between a transformation method and a feature backlog, and it is stated as a rule downstream phases may revise only on the record. Stating KPI targets before any solution exists is likewise sound: it makes the Track phase falsifiable rather than retrospective.

**Assessment — weaknesses (closed in v4.1).** The root-cause toolkit was thinner than the discipline it served. 5 Whys is known to perform poorly on multi-causal, systemic problems: it produces a single causal chain, is sensitive to who is asking, and tends to stop at the first cause the team already believed. Fishbone partially compensates by forcing categories, but neither technique verifies a cause — both generate hypotheses. The phase needed an explicit instruction that a root cause is a *hypothesis until evidenced*, which is exactly the epistemic move the method's own evidence contract makes everywhere else; v4.1 added it, along with the divergent discovery posture the phase previously lacked (R3, §6). The strengthened wording is the sentence quoted above.

### 2.3 Innovate

**Techniques employed (v3.3).** A six-technique ideation battery — First Principles, TRIZ, Lateral Thinking, Six Thinking Hats, SCAMPER, Systems Thinking — applied to *each* root cause; then an effort-vs-impact matrix sorting candidates into Quick Wins, Major Projects, Fill-ins, and Thankless Solutions.

**Assessment — strengths.** Two disciplines here are genuinely good practice: options are generated *per root cause* (keeping the option space tied to the Assess output), and rejected options are recorded with reasons. The second is rarer than it should be and pays off every time a rejected option is re-proposed.

**Assessment — weaknesses (closed in v4.1).** The battery was over-specified relative to the method's own `P4` (Simplicity and Proportionality). Six formal ideation techniques applied to each root cause is a workshop-week's worth of machinery; a solo practitioner with three root causes is not going to run eighteen technique passes, which means the method as written would be honored in the breach — and a method that expects its own rules to be skipped is training the skip reflex. The techniques also overlap: TRIZ and First Principles both attack assumed constraints; SCAMPER and Lateral Thinking both perturb an existing form. The remedy was a menu grouped by *what kind of stuckness each technique breaks*, with a proportionality rule; v4.1 adopted exactly that (R4, §6).

### 2.4 Model

**Techniques employed (v3.3).** Tool and architecture selection along a deliberate complexity ladder — simple retrieval (RAG) → single agent → multi-agent orchestration — choosing the least machinery that solves the problem; prototype, then test and validate, then refine; output captured in an authority document with measurable success criteria.

**Assessment — strengths.** The complexity ladder is `P4` made operational, and "prove the design against reality before committing to it" places validation where it is cheapest.

**Assessment — weaknesses.** Two findings. First, the original complexity ladder was **AI-solution-specific** (RAG → agent → multi-agent). The original review overstated this as a contradiction: §1's artifact-agnostic claim applies to the how-axis, while Model belongs to the what/why axis. Even so, an ordered escalation rule is more reusable across the transformation work CADENCE describes, with the AI ladder retained as a worked example (R5, §6). Second, in v3.3 Model was one of two phases without a "discipline that matters" block — an asymmetry that mattered because Model is where the authority document is born (F1, resolved in v4.0). Track was the other, and stayed open a version longer (F10, resolved in v4.2).

### 2.5 Implement

**Techniques employed (v3.3).** A time-boxed pilot with a small real cohort; role-specific training with sandboxes; change management; a governance framework with human-in-the-loop checkpoints; SOP documentation; a staged pilot→production path.

**Assessment.** The phase is sound and its closing claim — that the §3 stack *is* the Implement discipline made concrete — is mostly earned: operator controls, append-only evidence, and promotion boundaries are indeed pilot-govern-scale mechanics. The gap was testing: the §2 preamble promised testing as "a thread that runs through Model, Implement, and Track," while Implement's method list named no testing activity — no acceptance testing in the pilot, no regression posture for the staged rollout. The thread was visible in Model (test-and-validate) and Track (evals) and submerged in Implement. **Closed in v4.1**, which adds pilot acceptance testing, staged-rollout regression, and operational-safety checks (F2; R6, §6).

### 2.6 Track

**Techniques employed (v3.3).** KPI monitoring against the Assess targets; evals (and DSPy-style optimization) as the ongoing correctness measure; deterministic drift detection over run history; prompt tuning from eval results and feedback; ROI assessment tied to the charter.

**Assessment.** The strongest structural property here is loop closure: §2.7 makes Track's output the next turn's catalyst, and a drift alert becomes a new problem statement — from v4.3 it enters at Frame, which is where a first-turn brief enters, so the loop closes on the same door it opens. That resembles PDCA/OODA loop logic (§4.2, §4.7), without proving equivalent practice. Three soft spots existed before v4.1: the ROI assessment inherited whatever baseline Assess happened to capture and the method never explicitly required a *baseline measurement* (**closed in v4.1**, which requires one); the evals/prompt-tuning language was narrower than necessary (**closed in v4.1**, which states the general form as an ongoing correctness instrument appropriate to the artifact and retains AI evals as an example); and Track carried no "discipline that matters" block while every other phase did (**closed in v4.2** — see F10).

---

## 3. The governance and gates — assessment

**The three-zone architecture (Draft → Candidate → Approved).** This is the method's best structural idea, and the reasoning that produced it (§5–§6 of the method: correct checks, wrong timing) is honestly argued from an observed failure. Advisory-by-default with hard blocking confined to the two promotion boundaries is the right resolution of the tension between evidence discipline and drafting speed, and locating each promotion on a version-control move gives an audit trail for free. Assessment: keep, unmodified.

**The evidence contract.** The closed set of evidence classes, "absent is a valid outcome," and "never claim more verification than was performed" are the method's signature — they generalize far beyond agentic work, and publishing the closed set in an appendix (a contract an agent cannot enumerate is one it cannot enforce) shows unusual care. The strongest subtlety is the explicit note that source bands are *not* a universal strength ranking; the weakest point is that the contract's cost profile is what drove the §5 failure, which the zone architecture now prices correctly (tags suggested at Draft, required at Candidate).

**Adversarial verification (Critic / Advocate / Grader).** Fresh-context, contract-only adversarial consensus — where a Critic fail fails the gate and an Advocate dissent blocks until a human resolves it — is a genuinely strong pattern, and "verdict computed by script, not asserted by a narrator" is the right authority relationship between agent and evidence. One assessment-level caution: ten sub-agents per task is a heavy reference implementation, and the method should be read with its own `P4` — the *pattern* (independent adversarial review in fresh context) matters more than the head-count.

**The metered run allowance (v4.5).** v4.5 adds per-run compute accounting and a non-progress stop to the §3.4 pipeline — a partial answer to the head-count caution above: it does not reduce the ten sub-agents, but it bounds a non-terminating retry loop and makes per-run cost visible. It is graded target design; whether the ceiling's non-progress signal and the allowance's calibration hold up is unproven until real runs exist. The two promotion-boundary gates assessed above are unchanged — the run ceiling reaches the pipeline's existing QUARANTINE verdict, not a new zone gate.

**The two-line fork.** Sound, and correctly generalized in §6 from an emergency measure into the default shape (Draft zone = live line, Approved = governed line). No change recommended.

**The Constitution and decision order.** Seven principles with an explicit tie-breaking order is the right governance shape. Two defects in the order itself, both now closed. First, it ended in "performance," a term naming no principle — `P7` is Validation Before Commercialization (F7; R8, §6; **closed in v4.1**). Second, and missed by this review until the v4.2 proofreading pass, the order enumerated only six terms for a seven-principle Constitution: **`P6` Human Control & Transparency had no position in it at all** (F9; R13; **closed in v4.2**). The v1.1 text of this section certified the ordering as sound without counting it — recorded here as a limit of this review, not only of the method.

**Stated limits and honest degradation.** "A gate trusted for more than it does is worse than no gate" and skips-are-not-passes are the two rules that make the rest of the gate architecture trustworthy. They are also self-applied (the method labels its own §6–§7 as target design, not established practice), which is the best evidence that the epistemic discipline is real.

---

## 4. Comparison against established frameworks

Each subsection ends with a verdict recording what CADENCE already **embodied**, the **gap identified** in the reviewed version, whether closing it would strengthen the method, and — per the tense convention above — where that gap stands now. §4.10 tabulates the same four columns.

### 4.1 DMAIC / Lean Six Sigma

DMAIC (Define, Measure, Analyze, Improve, Control) is a close structural analogue. The map is approximate: Define+Measure+Analyze ≈ Assess, Improve-select ≈ Innovate, Improve-build ≈ Model+Implement, and Control ≈ Track. The toolkit overlaps — chartering, process mapping, baseline measurement, root-cause analysis, piloting, and control all appear in the [ASQ account of DMAIC](https://asq.org/quality-resources/dmaic). This resemblance is not evidence that CADENCE descended from DMAIC, so the comparison is structural rather than a provenance claim.

The one thing DMAIC had that CADENCE lacked was **Measure as a distinct discipline**: a baseline capability measurement, with the measurement system itself validated, *before* analysis begins. v3.3 folded this into Assess's KPI targets, which named the target but never required the baseline to be captured and trusted. **Verdict: largely embodied; the baseline-measurement discipline strengthened Assess in v4.1, which now requires a captured baseline with its window, population, and a reliability check (R2).**

### 4.2 PDCA / Toyota Kata

The Plan-Do-Check-Act cycle and its Kata refinement (a defined target condition, small experiments toward it, a coaching cadence) are about loop structure. CADENCE §2.7 already is a PDCA loop at project scale, and the three-zone lifecycle is PDCA at artifact scale. What Kata added was **step-size discipline in Track**: rather than one ROI reckoning against the original charter, a sequence of intermediate target conditions, each small enough to falsify quickly. **Verdict: embodied at both scales; Kata's target-condition step-size was a mild strengthener, adopted conditionally in v4.1 for long-horizon deployments (R9).**

### 4.3 Double Diamond

The [Design Council's Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/) distinguishes Discover/Define from Develop/Deliver and explicitly grounds Discover in speaking with and spending time with affected people. CADENCE's second diamond is recognizable — Innovate diverges, then the effort-impact matrix converges. Before v4.1, the first diamond was only half-present: Assess narrowed from a workflow map to root causes without a named divergent discovery step. **Verdict: second diamond embodied; discovery divergence and affected-person evidence strengthened Assess in v4.1 (R3).**

### 4.4 Design Thinking

Empathize → Define → Ideate → Prototype → Test maps roughly onto Assess → Innovate → Model. What Design Thinking centers that v3.3 did not is the **Empathize** posture: direct observation of and testimony from the people who live the problem. v3.3's Assess mapped the workflow and marked pain points, but nothing required those pain points to come from the people who feel them rather than from the practitioner's reading of the process. The method's own evidence contract already had the machinery (interview records are a first-class evidence class); Assess simply never invoked it. **Verdict: partially embodied; v4.1 wires it in — Assess now directs the practitioner to speak with or observe affected people where appropriate, and to record when direct access is unavailable (folds into R3).**

### 4.5 Cynefin

Cynefin is a **sense-making**, not merely a categorization, framework. Its named domains distinguish ordered contexts from complex and chaotic ones, with a central confused/disordered space; the response changes with the context — analysis where cause and effect can be discovered, safe-to-fail probes where patterns emerge, and stabilization before analysis in chaos. The framework's original account explicitly warns against treating the domains as a value-ranked two-by-two classification ([Kurtz and Snowden, 2003](https://thecynefin.co/library/the-new-dynamics-of-strategy-sense-making-in-a-complex-and-complicated-world/)).

CADENCE v4.0 applied one fixed arc at one implied depth. Context sensing is therefore useful, but the original R1 overreached by making a domain label directly select the document tier: uncertainty, delivery risk, coordination load, and documentation burden are related but not interchangeable. **Verdict: context sensing strengthens Assess — adopted with adjustment in v4.1, which uses it to adapt the working posture while selecting the document set from separately recorded risk and coordination criteria (R1).**

### 4.6 Stage-Gate

Stage-Gate places business evaluation and Go/Kill decisions at gates preceding stages; the maintainer's description separates stage work from decisions about continued investment and resources ([Stage-Gate International](https://www.stage-gate.com/about/stage-gate-innovation-performance-framework/discovery-to-launch-process/)). CADENCE instead puts evidence-maturity gates on an orthogonal axis. That is a deliberate tradeoff well suited to fast drafting, not a universal improvement over Stage-Gate: the two mechanisms answer different questions. The element CADENCE lacked was a **continue / pivot / stop** decision about the solution itself. **Verdict: retain the orthogonal artifact-trust gates; v4.1 adds the separate, lightweight investment decision at Model exit, kept distinct from artifact promotion (R10).**

### 4.7 OODA

Boyd's Observe-Orient-Decide-Act loop treats decision-making as a continuous, feedback-rich process in which observation, orientation, decision, and action interact rather than forming a simple linear cycle ([U.S. Marine Corps decision-making guide](https://www.trngcmd.marines.mil/Portals/207/Docs/TBS/B2B0237XQ%20Decision%20Making.pdf?ver=2017-01-27-145646-543)). CADENCE's drift-alert→new-Frame loop shares the ideas of feedback and cadence, but the method does not separately specify OODA's four activities or its orientation model. **Verdict: useful analogy, not equivalence; nothing to import on that analogy alone.**

### 4.8 A3 problem solving

The A3 approach can summarize the current condition, analysis, countermeasures, plan, and evidence on one large-format sheet, but the [Lean Enterprise Institute](https://www.lean.org/lexicon-terms/a3-report/) emphasizes that A3 is also a dialogue, ownership, and problem-solving discipline rather than merely a compact template. It may fit a simple workflow-improvement project, but it is not automatically the right authority format for a software automation. **Verdict: useful candidate format, not a universal simple-tier default. Defer (R11).**

### 4.9 Theory of Constraints

Goldratt's ToC: system throughput is governed by a single binding constraint; find it, exploit it, subordinate everything else to it. CADENCE's effort-impact matrix approximates constraint thinking (Quick Wins ≈ cheap constraint relief) but is a static prioritization, not a bottleneck identification — and nothing in v3.3's Assess asked *which single step governs the system's throughput*. For workflow-transformation problems (CADENCE's home ground), a constraint-first lens on the workflow map frequently collapses a long pain-point list into one dominant cause. **Verdict: approximated; v4.1 adds the bottleneck question to Assess's workflow-map step, which now marks "the step that most constrains throughput" (folds into R3).**

### 4.10 Summary matrix

The **Gap identified** column records what the reviewed version (v3.3) lacked. The **Status** column records where that gap stands in the current method.

| Framework | CADENCE already embodied | Gap identified in v3.3 | Would strengthen? | Status |
| --- | --- | --- | --- | --- |
| DMAIC / Lean Six Sigma | Arc structure, most of the Assess toolkit | Baseline measurement as a required discipline | Yes — R2 | **Closed in v4.1** |
| PDCA / Toyota Kata | Loop at project and artifact scale | Target-condition step-size in Track | Mild — R9 | **Closed in v4.1** (conditional) |
| Double Diamond | Innovate's diverge→converge | Discovery divergence in Assess | Yes — into R3 | **Closed in v4.1** |
| Design Thinking | Prototype/test posture in Model | Empathize: affected-person testimony in Assess | Yes — into R3 | **Closed in v4.1** |
| Cynefin | — | Context sensing before and during the arc | Yes, adjusted — R1 | **Closed in v4.1** (adjusted) |
| Stage-Gate | Separates from it (artifact trust vs. investment decision) | Continue/pivot/stop checkpoint | Yes, adjusted — R10 | **Closed in v4.1** |
| OODA | Tempo thesis; iterative feedback loop | No explicit Observe/Orient/Decide/Act model | No — analogy only | **No method change; equivalence claim withdrawn in v1.4** |
| A3 | Compact problem-solving and decision record | Fit criteria for using it as an authority format | Deferred — R11 | **Open, by decision** |
| Theory of Constraints | Effort-impact approximation | Bottleneck-first workflow lens | Yes — into R3 | **Closed in v4.1** |

---

## 5. Internal-logic findings

Each finding cites the method section it concerns, with a severity assessment.

- **F1 (minor; resolved in v4.0; *restated in v1.2 — the original count was wrong*).** Model (§2.3 then, §2.4 from v4.3) was **one of two** phases without a "discipline that matters" block — an asymmetry, and a missed opportunity precisely where the authority document is born. The v4.0 revision adds Model's block (one authority document, however many documents the project calls for). The v1.0 and v1.1 text of this finding claimed §2.3 was the *only* such phase; §2.5 Track also lacked one, both in the reviewed version and through v4.1. That error is corrected here and carried forward as F10 rather than by rewriting the finding out of existence.
- **F2 (moderate; resolved in v4.1).** The §2 preamble claimed testing as a thread through Model, Implement, and Track, but Implement named no testing activity. V4.1 adds pilot acceptance, staged-rollout regression, and operational-safety checks. → R6.
- **F3 (moderate; resolved in v4.1).** Innovate's six-technique battery, applied to each root cause, was disproportionate under the method's own `P4`. V4.1 makes it a purpose-grouped menu with an explicit stop/escalate rule. → R4.
- **F4 (minor; resolved in v4.1).** The method called the axes orthogonal without naming their designed join points. V4.1 names Model and Implement and separates the phase decision from the artifact-zone evidence obligation. → R7.
- **F5 (moderate; resolved in v4.0).** Model (§2.3 then, §2.4 from v4.3) and §3.2 hardcoded a single document format (the DPPD) as the Model output for every project regardless of size — `P4` applied to architecture but not to documentation. The v4.0 revision replaces it with a complexity-tiered, manifest-declared document set with exactly one designated authority document, preserving the anti-drift primitive.
- **F6 (moderate; resolved with qualification in v4.1).** No context sensing existed before the arc ran. V4.1 adds it, but does not let the sensed domain mechanically select documentation; the manifest instead records delivery-risk and coordination criteria. → R1.
- **F7 (minor; resolved in v4.1).** §3.5's decision order ended in the undefined term "performance." V4.1 maps the final position to the named `P7`, Validation Before Commercialization. → R8.
- **F8 (moderate; found and resolved in v4.1).** V4.0 required every definition to live inside the authority document while also introducing a multi-document set, leaving companion documents either duplicative or non-authoritative. It also implied built-in minimal/full variants not established by the referenced spec-driven docs system. V4.1 defines the authority document as the governing index and decision record through which each identifier reaches one canonical definition, and makes document profiles project-defined with explicit selection criteria.
- **F9 (major; found and resolved in v4.2).** §3.5's decision order enumerated **six** terms for a Constitution the same section describes as seven-principle and priority-ordered: `P6` Human Control & Transparency had no position in it. Nothing elsewhere exempted or explained the omission, and §3 of this review certified the ordering as sound without counting it. The defect survived the v4.1 pass, which corrected the order's final term without noticing the list was one principle short. V4.2 inserts `P6` at its numeric position and states that its operator controls are a floor rather than a tradeoff. The same six-term order had been copied into the companion playbook, where it also still ended in "performance"; both are corrected. → R13.
- **F10 (minor; found and resolved in v4.2).** Track (§2.5 then, §2.6 from v4.3) carried no "discipline that matters" block, leaving it the last phase without one after v4.0 closed §2.3's. See the F1 restatement above. V4.2 adds Track's block: *nothing is credited against a baseline nobody measured.* → R14.
- **F11 (minor; found and resolved in v4.2).** §3.3 named a specific client twice in body text, contradicting the front matter's "project-agnostic reference specification" and the neutral phrasing the same document uses elsewhere. V4.2 replaces both with the neutral form. Distinct from the client name legitimately preserved in a revision row, which is history and stays.
- **F12 (moderate; found and resolved in v4.3).** The arc had no documented entry on its first turn. §2.7 stated where a *later* cycle's problem originates — a drift alert from Track — but nothing said where the first one comes from, and `(brief)`, the first class in Appendix A's first band, appeared exactly once in the whole method: in that table. Two further channels were published as evidence classes and never directed by any phase — *(published research, retrieved …)* and *(public web, observed …)* — so the method never told a practitioner to establish how comparable operations had addressed the same problem. And Model's escalation ladder instructed the practitioner to "start with the least machinery that could satisfy the criteria" — a superlative over a set no phase ever asked anyone to assemble, which also left an unapproved option indistinguishable in the record from a technically failed one. Same shape as §4.4: the machinery existed, the trigger did not. → R15, R16.

---

## 6. Recommendations

All verdicts are the reviewer's assessment. "Method section" names where the change would land if adopted.

| ID | Recommendation | Verdict | Rationale | Method section |
| --- | --- | --- | --- | --- |
| R1 | Add context sensing at the top of Assess and revisit it as evidence changes; use the result to adapt the work posture, not as a mechanical document-tier selector. | **Adopt, adjusted** | Fixes F6 while respecting Cynefin's sense-making posture; documentation depth comes from separately recorded risk and coordination criteria. | §2.2, §3.2 |
| R2 | Require a captured baseline measurement (and a sanity check of the measurement itself) alongside the KPI targets in Assess. | **Adopt** | DMAIC's Measure discipline; Track's ROI narrative is only as good as the baseline nobody was required to capture. | §2.2, §2.6 |
| R3 | Strengthen Assess's evidence posture: label root causes as hypotheses until corroborated; seek affected-person evidence where appropriate and record access limits; diverge before narrowing; ask which step constrains throughput. | **Adopt, adjusted** | Wires the method's evidence contract into Assess without pretending an interview record is always available or always the strongest source. | §2.2 |
| R4 | Restate Innovate's ideation battery as a menu grouped by the kind of stuckness each technique breaks, with a proportionality rule (pick per root cause; one technique may suffice). | **Adopt** | Fixes F3; brings Innovate under `P4`; prevents ritual compliance. | §2.3 |
| R5 | Restate Model's complexity ladder as the general pattern (an ordered escalation of machinery; take the lowest rung that works) with the AI ladder as a worked example. | **Adopt** | Broadens the arc's reuse; the original artifact-agnosticism argument was overstated because that claim belongs to the how-axis. | §2.4 |
| R6 | Name Implement's testing surface (pilot acceptance criteria, staged-rollout regression) or narrow the §2 testing-thread claim. | **Adopt** | Fixes F2; a claimed thread should be visible in every phase it claims to run through. | §2, §2.5 |
| R7 | Add one sentence naming Model and Implement as the deliberate join points where the two axes meet. | **Adopt** | Fixes F4 and prevents "orthogonal" from being read as "never interacts." | §1 |
| R8 | Fix the decision order's final term ("performance" → "validation," or map it explicitly). | **Adopt** | Fixes F7; a tie-breaker containing an unmapped term undermines a governance layer built on precise reference. | §3.5 |
| R9 | Add intermediate target conditions to Track for long-horizon deployments. | **Adopt, conditional** | Adds early falsifiability without burdening short deployments. | §2.6 |
| R10 | Add a named continue/pivot/stop checkpoint at Model exit, separate from artifact promotion. | **Adopt, adjusted** | Restores the investment decision after prototype evidence exists without fusing the two axes. | §2.4 |
| R11 | Consider A3 as an authority format when its dialogue and compact problem-solving discipline fit the work. | **Defer** | Useful for some workflow-improvement efforts, but not a universal software-document default. | §3.2 |
| R12 | Do not add further ideation frameworks (e.g., more technique catalogs) or additional gate tiers. | **Reject** (the additions) | The method's marginal risk is weight, not gaps: `P4` and the §5 post-mortem both argue that the next failure mode is another layer of apparatus, not a missing one. | — |
| R13 | Give `P6` a position in the decision order, and say whether it is a tradeoff axis or a floor. | **Adopt** | Fixes F9. A priority-ordered Constitution that silently omits a principle cannot resolve the conflict a compliance reviewer is most likely to raise. | §3.5 |
| R14 | Add the missing "discipline that matters" block to Track. | **Adopt** | Fixes F10; restores the structural symmetry F1 was wrong about, and gives Track the baseline discipline R2 implies. | §2.6 |
| R15 | Give the arc a documented entry: a phase that establishes the catalyst, covers both a directed mandate and an exploratory assignment, and outputs a catalyst document. Add the outside-prior-art and own-shelf discovery channels to Assess, and bind the shelf inventory to Model's escalation ladder. | **Adopt** | Fixes F12. Three published evidence classes had no phase that invoked them, and "least machinery" was unresolvable without an inventory. | §2.1, §2.2, §2.4, §2.7 |
| R16 | Do **not** place this work inside Assess as an opening paragraph, and do not treat it as a pre-arc preliminary outside the arc. | **Reject** (both alternatives) | Assess's purpose presumes a known problem; the exploratory path has to *find and select* one, which is days of work with its own failure mode (analyzing a low-value target impeccably). Placing it outside the arc would strand it: a phase that produces the artifact everything else resolves against belongs in the arc that resolves against it. Recorded so the question is not re-litigated. | §2.1 |

A note on the whole: no comparison exposed a fatal contradiction in CADENCE's central design. That is not proof that the method outperforms the surveyed frameworks. The strongest changes remain concentrated in **Assess** (R1–R3: sensing, baseline, evidence posture) and in **proportionality of the method's own prescriptions** (R4–R5) — applying the method's `P2` evidence discipline and `P4` proportionality to the phases themselves.

**v4.1 disposition.** R2 and R4–R8 were adopted; R1, R3, R9, and R10 were adopted with the qualifications recorded above; R11 was deferred; and R12 remains the standing refusal to add framework or gate weight without evidence. v4.1 also resolves F8, which the original review did not identify.

**v4.2 disposition.** R13 and R14 were adopted. Both come from F9 and F10 — defects that this review had either missed or mis-counted, and that a proofreading pass over the whole document set surfaced. The pattern is worth naming: every finding this review added after v1.0 came from re-reading the live artifacts, not from further framework comparison. That is evidence for R12's refusal and against the assumption that more external frameworks would find more.

**v4.3 disposition.** R15 was adopted and R16 records the two placements rejected. Unlike every prior finding, F12 did not come from re-reading the artifacts — it came from testing the method against a practitioner's description of how work is expected to arrive. That is a different and productive instrument, and it is also why Frame is labeled anticipated practice: the same account that revealed the gap is the only evidence for the fix.

**v4.4 disposition.** No new framework recommendation was added. The method's verbal-mandate provenance was corrected within the existing evidence classes, and this review's categorical OODA equivalence claim was withdrawn in favor of a bounded analogy.

---

## 7. Method and stated limits of this review

**What was done.** The original pass closely read `CADENCE_METHOD.md` v3.3 and the companion playbook's structure, assessed each arc phase and governance mechanism, and compared nine established frameworks. The v4.1 pass re-read the live v4.0 artifacts and commit, checked the main external premises against the sources in §8, and inspected the referenced spec-driven docs system's actual manifest, dependency, template-registry, and variant behavior before editing. The v4.2 pass proofread the whole document set — method, this review, the companion playbook, and the shared renderer — against seven independent lenses (internal logic and arithmetic, cross-document consistency, this review's currency, line-level copy editing, executive presentability, external citation accuracy, and rendered-PDF fidelity), with every candidate finding re-checked against the files before it was accepted.

**What was not done — the limits.** No telemetry, cycle-time, or defect data on the method in use exists. This is not a systematic literature review, no alternative-method baseline was run, and checking framework premises does not validate the recommendations' effect on CADENCE. No pass was third-party: see *What "independent" means here* above. Frame (§2.1) is the least-evidenced part of the method and this review does not pretend otherwise: it rests on one practitioner's anticipation of a role not yet worked, and its exploratory path has never been run. Per the method's own `P7` discipline, the v4.1–v4.4 changes should be judged through §7 Phase 5: measured drafting speed, defects caught at promotion, and operational outcomes.

**What this review got wrong.** Recorded because the method's own rule is to state what was not checked. F1's count was wrong (§2.5 also lacked a "discipline that matters" block). §3 certified a decision order as sound without counting its terms against the seven principles it orders — the F9 defect then survived a full further revision. And the v1.1 text left assessments of superseded versions in the present tense while claiming currency with v4.1, so the document contradicted its own findings table; §§2–4 now carry their version and disposition inline.

---

## 8. Sources checked in the review passes

- [ASQ — DMAIC Process](https://asq.org/quality-resources/dmaic): baseline performance, measurement-system validation, root-cause analysis, piloting, and control.
- [Design Council — The Double Diamond](https://www.designcouncil.org.uk/resources/the-double-diamond/): Discover/Define/Develop/Deliver, affected-person discovery, and small-scale testing.
- [The Cynefin Company — Kurtz and Snowden](https://thecynefin.co/library/the-new-dynamics-of-strategy-sense-making-in-a-complex-and-complicated-world/): sense-making posture, domains, and context-specific response patterns.
- [Stage-Gate International — Discovery-to-Launch](https://www.stage-gate.com/about/stage-gate-innovation-performance-framework/discovery-to-launch-process/): stages, business-evaluation gates, and Go/Kill/Hold/Recycle decisions.
- [Lean Enterprise Institute — A3 Report](https://www.lean.org/lexicon-terms/a3-report/): A3 as a compact record, problem-solving process, dialogue, ownership, and management discipline.
- [U.S. Marine Corps — Decision Making](https://www.trngcmd.marines.mil/Portals/207/Docs/TBS/B2B0237XQ%20Decision%20Making.pdf?ver=2017-01-27-145646-543): OODA as a continuous, feedback-rich decision process; used in v1.4 to bound the analogy rather than claim equivalence.

---

## Appendix — Revision Record

Rows are history. They record what was true when written and are never rewritten.

| Version | Date | Change |
| --- | --- | --- |
| v1.0 | 2026-08-01 | Initial review: technique-by-technique assessment of the five-phase arc and the governance/gates, nine-framework comparison, internal-logic findings F1–F7, recommendations R1–R12. Written alongside the method's v4.0 revision; F1 and F5 recorded as resolved there. |
| v1.1 | 2026-08-01 | Independent v4.1 disposition pass: verified the live prior-agent commit and the main framework premises against maintainer or primary professional sources; corrected the Cynefin, Stage-Gate, DMAIC-provenance, and A3 conclusions; recorded adopted, adjusted, and deferred recommendations; added F8 for the authority-document/container contradiction and unsupported minimal/full-variant implication; synchronized the review with `CADENCE_METHOD.md` v4.1; and corrected long-table pagination in the shared renderer. |
| v1.2 | 2026-08-01 | Proofreading and accuracy pass over the whole document set, synchronizing this review with `CADENCE_METHOD.md` v4.2. **Corrected this document's largest defect:** §§2–4 assessed superseded versions in the present tense while the Status line claimed currency through v4.1, so ten passages asserted gaps the same document's §5 and §6 recorded as closed. Each now names the version it examined and carries its disposition inline; §4.10 gains a Status column and its third column is retitled *Gap identified in v3.3*. **Corrected F1**, which claimed §2.3 was the only phase without a "discipline that matters" block — §2.5 Track also lacked one; carried forward as F10 rather than rewritten away. **Added F9** (the decision order omitted `P6`, a defect §3 of this review had certified as sound without counting) with R13, **F10** with R14, and **F11** (residual client name in a project-agnostic specification). Fixed the §2.1 quotation of the method's closing discipline, which reproduced pre-v4.1 wording, and the §4.2 verdict label, which used a term absent from §6's verdict set and contradicted R9's recorded disposition. Defined what *independent* claims and does not claim in this document set, added a tense convention, and added a *What this review got wrong* subsection to §7. No framework comparison, source, or external premise changed. |
| v1.3 | 2026-08-01 | Resynchronized with *The CADENCE Method* v4.3, which adds **Frame** as the arc's opening phase. Added **F12** — the arc had no documented first-turn entry, three published evidence classes (*(brief)*, *(published research…)*, *(public web…)*) were never invoked by any phase, and Model's "least machinery" ladder presupposed an inventory no phase collected — with **R15 (Adopt)** and **R16 (Reject)**, the latter recording why the work was not placed inside Assess or outside the arc, so the question is not re-litigated. Added §2.1 assessing Frame, with an explicit statement that this subsection is weaker than the five below it: Frame is anticipated practice, uncompared against external frameworks and unexercised by the one worked example, whose brief was supplied rather than authored. Renumbered §§2.1–2.5 to §§2.2–2.6; updated the six-phase strings, the loop-closure assessment, and the §-numbers in F1, F5, and F10 to name their phase alongside both numberings. Frame's output is named the *catalyst document*, deliberately not *brief*, because *(brief)* types a **received** instruction and Frame's output may be one the practitioner wrote — naming both the same token would have let an authored document inherit a primary-source class, which §3.2 forbids. No framework comparison, source, external premise, or prior verdict changed. |
| v1.4 | 2026-08-01 | Executive-readiness and accuracy pass synchronized with *The CADENCE Method* v4.4. Added a concise executive assessment. Clarified Frame's treatment of written and verbal mandates without adding an evidence-class token. Corrected §4.7's categorical claim that CADENCE's feedback loop *is* an OODA loop: the comparison now records shared feedback-and-cadence characteristics while stating that CADENCE does not specify OODA's four activities or orientation model; §4.10 and §8 are synchronized to that bounded conclusion and its U.S. Marine Corps source. Recorded the v4.4 disposition and updated the review limits. The shared renderer now requests tagged PDF structure and a document outline. No prior recommendation verdict or historical revision row changed. |
| v1.5 | 2026-08-01 | Resynchronized with *The CADENCE Method* v4.5, which adds a metered run allowance to the §3.4 pipeline — per-run compute accounting, an advisory usage meter, a non-progress run ceiling that reaches the existing QUARANTINE verdict, and an operator-escalating run allowance. Added a §3 assessment paragraph and updated the Status currency to v4.5. The §3 conclusion that the three-zone architecture keeps a single hard gate at promotion is unchanged: the run ceiling is a pipeline-internal stop, not a new zone gate. No framework comparison, source, external premise, or prior recommendation verdict changed. |
| v1.6 | 2026-08-02 | Resynchronized with *The CADENCE Method* v4.6, an executive-readiness proofreading pass that changed no substantive method content — no phase, gate, zone, identifier, evidence-class token, verdict token, Constitution principle, or signature-pattern count changed, and no section was renumbered. Updated the Status currency to v4.6; no assessment paragraph was added, since v4.6 corrected wording without altering any mechanism this review evaluates. No framework comparison, source, external premise, or prior recommendation verdict changed. |
| v1.7 | 2026-08-02 | Resynchronized with *The CADENCE Method* v4.7. Corrected the present-tense §3 assessment from a "single hard gate" to the two promotion-boundary gates the method's Draft → Candidate → Approved lifecycle specifies; retained the v1.5 revision row unchanged as history. The run ceiling remains a pipeline-internal QUARANTINE trigger rather than a third zone gate. No framework comparison, source, external premise, recommendation verdict, phase, zone, gate check, or closed-set token changed. |

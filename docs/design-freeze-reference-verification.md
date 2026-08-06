# Reference Verification Pass — the six runtime references against method v4.7

**Evidence for §3 of `docs/design-freeze.md`. For operator review: accept or reject.**

> **Performed by:** coding agent, 2026-08-06 UTC, against `docs/reference/source/CADENCE_METHOD.md` v4.7 as vendored
> (blob `a31bd491cb8d669265989efa3e37e680382ec130`, hash-verified by `scripts/guardrails-check.sh` check 3).
> **Status:** awaiting operator acceptance. A-4 makes the operator the accepting reviewer; this pass is a finding
> submitted for that review, not a self-certification.
> **Verdict:** all six references are **faithful to what each declares it distils**. Four observations recorded, none
> blocking. No discrepancy was found between any reference and the method.

## What "verified section by section" means here

Each reference declares, in its own header, the method sections it distils. The pass reads each reference against
exactly those sections and asks two questions:

1. **Fidelity** — does the reference say what the method says, without drift, omission that changes meaning, or
   addition the method does not support?
2. **Attribution** — where the reference quotes or cites the method, is the quotation actually in the method and does
   the cited section actually say it?

It does **not** ask whether the six references cover the whole method. That is a coverage question, not a fidelity
question, and it is out of this criterion's scope — but where the pass observed a coverage boundary it is recorded
below rather than left silent.

## Summary

| Reference | Declares it distils | Method basis | Verdict |
| --- | --- | --- | --- |
| `phase-definitions.md` | §2, §§2.1–2.6 | six phase bodies | **PASS** — verbatim, mechanically confirmed |
| `zone-lifecycle.md` | §6, §6.1 | two principles, zone table | **PASS** — verbatim |
| `evidence-classes.md` | Appendix A | closed evidence-class set | **PASS** — byte-identical (SHA-256 match) |
| `id-namespaces.md` | §3.2 | prefix table, stability rule | **PASS** — verbatim |
| `gate-checks.md` | §6.1, §3.5, §5, §6.2 | tier map | **PASS** — every attribution verified |
| `artifact-layout.md` | §3.4, §3.5 (`P5`) | principles → this runtime's spec | **PASS** — declares itself a specification; both method attributions verified |

---

## 1. `phase-definitions.md` — PASS

**Method basis:** §2 preamble, §§2.1–2.6.

**Method:** mechanical paragraph-by-paragraph comparison of all six phase bodies, after normalising the one
intentional label change. Reproduce with:

```bash
python3 - <<'PY'
import pathlib,re
m=pathlib.Path('docs/reference/source/CADENCE_METHOD.md').read_text().splitlines()
r=pathlib.Path('skills/cadence-method/references/phase-definitions.md').read_text().splitlines()
def body(lines,s_pat,e_pat):
    s=next(i for i,l in enumerate(lines) if re.match(s_pat,l))
    e=next(i for i,l in enumerate(lines) if i>s and re.match(e_pat,l))
    return [l for l in lines[s+1:e] if l.strip()]
for i,p in enumerate(['Frame','Assess','Innovate','Model','Implement','Track']):
    mb=[l.replace('**The discipline that matters.**','**Discipline.**')
        for l in body(m, rf'^### 2\.{i+1} {p} ', rf'^### 2\.{i+2} |^### 2\.7 ')]
    print(p, 'paragraphs:', len(mb))
PY
```

**Result:** all six bodies **identical** to the method — Frame 4 paragraphs, Assess 5, Innovate 4, Model 4,
Implement 4, Track 4. No wording differs.

**Deviations, both intentional and declared:**

- **OBS-1** — the label `**The discipline that matters.**` is rendered `**Discipline.**` throughout. Applied
  consistently to all six phases, changes no meaning, and matches the reference's own preamble, which names the four
  structural labels as **Purpose / Methods / Output / Discipline**. Recorded because it is a deviation from verbatim,
  not because it is wrong.
- Headings are `## Frame — …` rather than `### 2.1 Frame — …`; the section numbers are dropped. Structural, not
  semantic.
- §2.7 (*the arc as a loop*) is not carried. The reference states this in its preamble — "which is framing, not a
  seventh phase, and is out of scope for this reference" — so the omission is declared, not silent.

## 2. `zone-lifecycle.md` — PASS

**Method basis:** §6 preamble (two principles), §6.1 (three zones, promotion procedure).

**Result:** both §6 principles are reproduced **verbatim**. The three-zone table is reproduced **verbatim**, all
three rows, including each `Blocks?` value (Never / Yes, to promote / Yes, to finalize). The promotion sentence
("a version-control move (`git mv`) plus a commit — a free audit trail") is verbatim.

The added section *"The two blocking boundaries and the promotion procedure"* restates Draft → Candidate and
Candidate → Approved as separate bullets. It introduces nothing: both boundaries and both blocking behaviours are
stated in §6's second principle, and the reference labels the section *"restated from the §6 principle above."*

- **OBS-2** — the promotion sentence appears twice (once closing the zone table section, once closing the boundaries
  section). Cosmetic redundancy, no fidelity consequence. A candidate tidy for WP 2.2.

## 3. `evidence-classes.md` — PASS (byte-identical)

Discharged in full by §4 of `docs/design-freeze.md`. Method Appendix A and the reference extract both hash to
`sha256 159c58dad8c7727f0cc033d0c67ab880a15f766ddab802db002b71df8cdd9dea`, 21 lines each, eleven classes, all three
non-date parameters (`Speaker`, `Employer`, `key`) present.

## 4. `id-namespaces.md` — PASS

**Method basis:** §3.2.

**Result:** the twelve-prefix default table is reproduced **verbatim**, including the `Q` row's parenthetical form
(`Q1`, `Q2`, …) and the two-column layout. The identifier-stability paragraph is reproduced **verbatim** — "once
assigned, a number is never reused and never renumbered … must define that namespace once in its authority document
and must not give one token two meanings."

The reference carries the resolution rule ("every identifier resolves through the authority document to exactly one
canonical definition") accurately. It does not carry §3.2's document-set selection criteria or the
one-authority-document designation rule; its declared scope is "the default identifier prefix table and the
identifier-stability rule," so this is within declaration.

## 5. `gate-checks.md` — PASS (every attribution verified)

**Method basis:** §6.1 (check list), §3.5 (tiers), §5 (the downgrade), §6.2 (the decouplings).

This reference makes the most method attributions of the six, so each was checked individually:

| Claim in the reference | Verified against | Result |
| --- | --- | --- |
| Tiers are *block* (a gate refuses), *warn* (recorded, never blocks), *guide* (advisory) | §3.5 | **exact**, matches the method's wording |
| The Candidate gate's component list | §6.1 zone table, Candidate row | **exact**, all eight components |
| §5 says the correct response is to "downgrade a cross-reference rule from *fail* to *warn*" | §5 | **exact quotation present** in the method |
| §6.2 rule 1 — one place asserts a version, everywhere else points loosely | §6.2 | accurate |
| §6.2 rule 2 — revision rows are history, never swept | §6.2 | accurate |
| §6.2 rule 3 — tags suggested in Draft, required at Candidate | §6.2 | accurate |
| The usage meter registers as a *guide* | §3.5 | accurate — "the usage meter is a *guide*" |
| Quotation-symmetry is a Draft advisory lint, not a Candidate-gate check | §6.1 Draft row | accurate |

**Noted as a strength rather than a finding:** the reference carries an explicit *"Excluded from this map (D-4)"*
section naming the runtime-specific checks the WBS adds that the method does **not** state as Candidate-gate checks
— ID-namespace resolution, quotation symmetry as a gate check, loose-pointer drift as its own check, promotion-report
generation. It also carries a stated-limits footer. This is the distinction the freeze depends on, made explicitly by
the reference itself.

- **OBS-3** — this reference is where method §6.2's three decoupling rules reach the runtime, cited by rule number
  inside tier justifications rather than stated standalone. They are present and correctly attributed; a reader
  looking for §6.2 as a topic would not find a dedicated section. Coverage observation for WP 2.2, not a fidelity
  defect.

## 6. `artifact-layout.md` — PASS (specification, and says so)

**Method basis:** §3.4, §3.5's `P5`.

This reference differs in kind from the other five: it is **this runtime's own specification**, not a distillation of
method text, and its header states exactly that — *"The method states these as principles, not a directory layout —
the concrete paths below are this runtime's own specification, per NFR-5 and FR-14."* Fidelity therefore turns on
whether its method attributions are accurate and whether anything in it contradicts the method.

| Attribution | Verified | Result |
| --- | --- | --- |
| `P5` quoted as "capture phase inputs, outputs, timestamps, and metadata; keep artifacts append-only and audit-friendly; build so another operator can replay the result" | §3.5 | **exact quotation present** |
| "method pattern 8 — every attempt is immutable, and the trail is never rewritten to hide a failure" | §4 pattern 8 | **accurate** — "Append-only evidence. Every attempt is immutable; the trail cannot be rewritten to hide a failure. (§3.4)" |
| The build pipeline's uppercase `PROMOTE`/`RETRY`/`QUARANTINE` tokens are the method's, and this runtime's promotion verdicts are the distinct lowercase `promote`/`retry`/`quarantine` | §3.4 | accurate — §3.4 uses the uppercase tokens; the reference deliberately keeps the two vocabularies apart |

No contradiction with the method was found. The concrete paths, the `attempt-manifest.json` shape, and the promotion
report are runtime specification traced to this project's own `NFR-5`, `FR-14`, and `AC-` identifiers, not
attributed to the method.

- **OBS-4** — the reference carries two deliberately open tokens, `<work-item>` and `<artifact>`, whose derivation it
  defers to the authority document. That gap is **Q4**, resolved at the freeze by adopting its pending default. The
  reference's stated limits will need updating once WP 2.2 runs; recorded here so the connection is on the record.

---

## Observations, consolidated

| | Observation | Severity | Where it resolves |
| --- | --- | --- | --- |
| **OBS-1** | `phase-definitions.md` renders `The discipline that matters.` as `Discipline.` — consistent, non-semantic | none | none required; recorded for completeness |
| **OBS-2** | `zone-lifecycle.md` states the promotion sentence twice | cosmetic | WP 2.2 |
| **OBS-3** | §6.2's rules reach the runtime only inside `gate-checks.md` tier justifications, not as a standalone topic | coverage note | WP 2.2 to confirm |
| **OBS-4** | `artifact-layout.md`'s `<work-item>` / `<artifact>` open tokens are Q4, now resolved; its stated limits still describe them as open | stale after freeze | WP 2.2 |

**None blocks the freeze.** Each is either non-semantic, cosmetic, or a WP 2.2 finishing item — and WP 2.2 is the
package that finalizes these references, which is why they still carry `Status: Draft reference`.

## Stated limits of this pass

- It verifies **fidelity to declared scope**, not whole-method coverage. A method section no reference claims to
  distil was not checked for, because no reference asserts it.
- `artifact-layout.md` is specification, so "faithful" there means *does not contradict the method and attributes
  accurately* — a weaker claim than the verbatim comparisons in §§1–4, and a different one.
- It was performed by a coding agent reading the texts, with mechanical comparison where the content is reproduced
  and human-style reading where it is distilled. The mechanical results (§§1, 3) are reproducible from the commands
  above. The reading results (§§2, 4, 5, 6) are a finding submitted for operator review.
- It is a point-in-time pass against method v4.7 as vendored at blob `a31bd491`. Re-vendoring the method invalidates
  it.

## Operator decision

- [ ] **Accept** — §3 of the freeze note is discharged; record the result and proceed to signature.
- [ ] **Reject** — state what needs re-checking or re-doing.

# Validator Spec Sheet — the deterministic gate's check catalog

> **Owner:** WP 1.3 (WBS 1.0), authorized by `docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md`.
> **Derived from:** S-5, FR-8, FR-9, FR-10, FR-11, FR-12, FR-14, FR-17, FR-18, NFR-1, NFR-3, NFR-6, D-2, D-4 and WBS 5.1 in the authority document; AC-9.2, AC-9.4, AC-11.3, AC-12.1 through AC-12.4, AC-13.1, AC-13.2, AC-15.1 through AC-15.3, AC-16.1, AC-16.2 and AC-1.3 in `docs/design/CADENCE_AUTOMATION_USER_STORIES.md`; method §3.4, §5, §6.1, §6.2, §6.3, §9 and Appendix A in `docs/reference/source/CADENCE_METHOD.md`, which is read-only (D-4) and is cited here, never edited.
> **What this is not.** Not a governed document: it carries no metadata table and no revision record, and scope, requirements, and identifiers resolve in the authority document, not here. Not a validator: this is specification only. Building the validators and adapters is WP 5.1 (in progress — six of the eleven checks and the check registry have landed; the adapters and the remaining five checks are forthcoming) and completing the fixture packs and building the parity runner is WP 5.2 (forthcoming — WP 5.2; each of the six landed checks shipped a frozen pack alongside it, so WP 5.2 completes and pins the set rather than starting it); both are explicit non-goals of this sheet.
> **Identifier note (FR-10).** This sheet introduces no identifier. Every check is named exactly as WBS 5.1 names it. The kebab-case slugs below are **filenames and JSON field values**, not identifiers in an `FR-`-style namespace; each resolves to the WBS 5.1 name in the same row of the completeness matrix.

## 1. Scope and status

The Draft → Candidate promotion gate runs eleven checks. This sheet specifies, for each of them, the input it accepts, the conditions under which it returns each verdict, the edge cases its implementation must get right, and the frozen fixtures WP 5.2 pins it with. It then specifies the external-tool adapter and version-preflight design (NFR-3), the tier-configuration file format (FR-11), and the fixture-pack conventions (WP 5.2).

Two rules govern everything below and are not restated in each section.

- **No validator calls a model.** Every gate check is a standalone deterministic script (FR-8, AC-12.1, X-3). Every verdict is computed by the script from its input; no model output changes a verdict, and no narrative overrides one (method pattern 5).
- **A check that could not run is `skipped`, never `passed`** (NFR-6, method §9). A claim this sheet cannot support is marked `unverified`, never `passed`; see §8.

Status: specification, partially built. Six of the eleven checks have landed under `scripts/validators/`, each with a frozen fixture pack: `gate-self-test` (#21), `cross-reference-integrity` (#19), `link-integrity` (#23), `id-namespace-resolution` (#22), `evidence-tag-grammar` (#20), and `loose-pointer-drift` (#24). For those six, a statement about runtime behavior is pinned by fixtures rather than `unverified`, and a disagreement between this sheet and a landed validator is a defect in one of them to be resolved — never a silent divergence. For the remaining five checks, and for the adapter and tier-configuration designs in the sections below, the original status holds unchanged: nothing has been executed, so every statement about runtime behavior is `unverified` until WP 5.1 builds it and WP 5.2 pins it byte-for-byte.

A landed pack routinely carries more cases than its per-check fixture table below names. That is expected, not drift: those tables name the **mandatory** cases (§7) — a `pass`, a `warn`, a `fail`, plus the edge cases §4 names — and never a ceiling. Completeness is judged against the mandatory set, so a pack may add cases as defects are found without contradicting this sheet.

## 2. The common validator contract

Each check states only its deltas from this contract.

**Shape.** One standalone single-file CommonJS script per check under `scripts/validators/`, Node 20 or newer, zero dependencies, no network access (NFR-1, NFR-3). It opens with the `// INPUT:` and `// USAGE:` comment pair, then `'use strict';`; it exports a `manifest` and an `execute(input)`, then `module.exports`, then an `if (require.main === module)` command-line wrapper. Nothing else in the repository re-implements a shipped check: a second, unfixtured implementation is exactly the divergence R-2 names.

**Input envelope.** Every check accepts one JSON object on standard input or as a file argument. Unknown keys are ignored; a missing key the check requires produces a skip, never a guess.

```json
{
  "check": "evidence-tag-grammar",
  "artifact_path": "cadence/draft/discovery-record.md",
  "project_root": ".",
  "boundary": "draft-to-candidate",
  "authority_document": "docs/design/EXAMPLE_AUTHORITY.md",
  "manifest_path": "cadence/manifest.json",
  "references": {
    "evidence_classes": "cadence/references/evidence-classes.md",
    "id_namespaces": "cadence/references/id-namespaces.md"
  },
  "base_revision": "HEAD",
  "tools": {},
  "options": {}
}
```

**Output envelope.** Every check emits one JSON object on standard output (AC-12.1).

```json
{
  "check": "evidence-tag-grammar",
  "status": "ran",
  "skipped_reason": null,
  "verdict": "pass",
  "findings": [
    {
      "path": "cadence/draft/discovery-record.md",
      "line": 42,
      "code": "class-outside-closed-set",
      "severity": "fail",
      "message": "claim carries a class the seeded reference does not declare"
    }
  ],
  "stated_limits": [
    "fenced blocks and the artifact's verbatim Appendix A reproduction were excluded from claim scanning"
  ],
  "tool_versions": {}
}
```

**Verdicts and statuses are two different fields.** `verdict` is drawn from the closed set `pass | warn | fail` (FR-8). `status` is drawn from `ran | skipped` and answers a different question: whether the check ran at all (NFR-6). A skipped check emits `"verdict": null` — it does not emit `pass`, and nothing downstream may read its absence as one.

**The two skip reasons.** Collapsing them would make every gate run quarantine, so they are distinct and are used exactly as follows.

| `skipped_reason` | Means | Effect at a promotion boundary |
| --- | --- | --- |
| `not-applicable` | The check's precondition is absent from the input by design — an artifact with no revision record, no quotation, no derived render. The check is healthy; there is nothing for it to examine. | Recorded in the report, never counted as a pass, and **not blocking**. The gate verdict is computed from the checks that had something to examine. |
| `unavailable` | A required tool or input could not be resolved — a missing shell-lint binary, an unreadable seeded reference, version control absent. The check could have found something and was prevented from looking. | Recorded, never counted as a pass, and **degrades closed**: the gate verdict is FR-14's `quarantine`, never `promote` (FR-7, NFR-3, AC-11.3). In Draft the same condition degrades open — the write proceeds and the degradation is reported. |

**Exit codes.** Distinct per outcome, relayed by the orchestrator and never overridden (FR-14, AC-15.1).

| Outcome | Exit code |
| --- | --- |
| `pass` | `0` |
| `warn` | `10` |
| `fail` | `20` |
| `skipped` (either reason) | `30` |

The gate-level verdict codes for FR-14's `promote | retry | quarantine` set belong to the promotion report script and are specified with it (forthcoming — WP 6.1); they are deliberately not assigned here.

**Determinism.** Fixture pinning is only possible if output is a pure function of input (FR-8, R-2, method pattern 9). Every check therefore: sorts `findings` by `path`, then `line`, then `code`, with a fixed byte collation and no locale dependence; emits repository-root-relative paths and never an absolute one; emits no timestamp, no host name, no process identifier, and no wall-clock duration; reads no environment variable other than those a declared adapter's preflight names; and opens no network connection. Two runs over the same input produce byte-identical output, which is what WP 5.2's parity runner asserts.

**Stated limits (FR-17).** Every check populates `stated_limits` with what it did not examine — excluded regions, unfetched targets, preconditions it could not evaluate. A green verdict is a statement about what ran, never about what nobody wrote (method §3.4, pattern 11, AC-9.4).

## 3. Completeness matrix

Eleven checks, four required elements each. Cells carry counts and pointers rather than ticks, because a tick can be typed over an empty section and a count cannot. §9 is the recipe that verifies this matrix against the sections themselves.

| # | Check (WBS 5.1 name) | Slug (filename) | Input shape | Verdict semantics | Edge cases | Frozen-fixture cases (WP 5.2) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Evidence-tag grammar | `evidence-tag-grammar` | `json`, envelope + 2 options | 5 rows | 4 bullets | 4 fixtures |
| 2 | ID-namespace resolution | `id-namespace-resolution` | `json`, envelope + 2 options | 5 rows | 4 bullets | 4 fixtures |
| 3 | Cross-reference integrity | `cross-reference-integrity` | `json`, envelope + 2 options | 5 rows | 3 bullets | 3 fixtures |
| 4 | Revision-row immutability | `revision-row-immutability` | `json`, envelope + 1 option | 5 rows | 4 bullets | 4 fixtures |
| 5 | Loose-pointer drift | `loose-pointer-drift` | `json`, envelope + 1 option | 5 rows | 3 bullets | 3 fixtures (fail unreachable; falsifiability fixture) |
| 6 | Link integrity | `link-integrity` | `json`, envelope + 2 options | 5 rows | 3 bullets | 3 fixtures |
| 7 | Quotation symmetry | `quotation-symmetry` | `json`, envelope + 1 option | 4 rows | 3 bullets | 3 fixtures |
| 8 | Render fidelity | `render-fidelity` | `json`, envelope + 3 options | 5 rows | 4 bullets | 4 fixtures |
| 9 | Manifest/registry consistency | `manifest-registry-consistency` | `json`, envelope + 2 options | 5 rows | 3 bullets | 3 fixtures |
| 10 | The gate self-test | `gate-self-test` | `json`, envelope + 2 options | 5 rows | 3 bullets | 3 fixtures |
| 11 | The tooling shell-lint | `tooling-shell-lint` | `json`, envelope + 2 options | 5 rows | 3 bullets | 3 fixtures |

## 4. The eleven checks

Order follows WBS 5.1. Every section carries the same four labels in the same order; a label with no content under it does not satisfy the matrix above.

### Evidence-tag grammar

Enforces the Appendix A closed set on the claims in a governed artifact (FR-9, AC-12.3, method §3.3, §6.2 rule 3). The set is read from the project's **seeded** evidence-class reference, never from a list hardcoded in the validator: a project extends the set by amending its own appendix, and a validator that ignores that amendment is wrong about the project it is checking.

**Input shape**

```json
{
  "check": "evidence-tag-grammar",
  "artifact_path": "cadence/draft/discovery-record.md",
  "boundary": "draft-to-candidate",
  "references": { "evidence_classes": "cadence/references/evidence-classes.md" },
  "options": {
    "require_tags": true,
    "excluded_regions": ["fenced", "appendix-a-reproduction"]
  }
}
```

`options.require_tags` is `true` at a promotion boundary and `false` for a Draft-zone advisory run, which is method §6.2 rule 3 made a parameter rather than a second script. `options.excluded_regions` names the regions that are not live claim text.

**Verdict semantics**

| Verdict | Condition | Exit code |
| --- | --- | --- |
| `pass` | Every claim-bearing line carries exactly one class drawn from the seeded reference, and every class that names a date or a `Speaker` / `Employer` / `key` parameter carries it in the required form. | `0` |
| `warn` | A malformed or out-of-set class token appears **inside an excluded region** — a fenced example, or the artifact's own verbatim reproduction of Appendix A. The region is not live claim text, so it does not fail; the warn is what makes the exclusion visible instead of silent. Also emitted for every finding when `options.require_tags` is `false` (the Draft advisory run). | `10` |
| `fail` | A claim carries no class, carries more than one, carries a class token the seeded reference does not declare, or carries a class whose required date or parameter is missing or malformed. | `20` |
| `skipped: not-applicable` | The artifact carries no claim-bearing prose (an index or a pure table of contents). | `30` |
| `skipped: unavailable` | The seeded evidence-class reference is missing or unparseable. The closed set must be read; guessing it would silently widen a class, which AC-12.3 forbids. | `30` |

**Edge cases**

- The artifact reproduces Appendix A verbatim (as `evidence-classes.md` does). Every class token in that region is documentation, not a claim: expected `pass`, with the excluded region enumerated in `stated_limits`.
- A fenced block shows a deliberately malformed tag as an example: expected `warn`, never `fail`.
- One claim carries two classes: expected `fail` — Appendix A says exactly one, or the claim is cut.
- The seeded reference declares a project-added twelfth class: expected `pass` for a claim using it. The set is closed against silent widening, not against a recorded amendment.

**Frozen-fixture cases (WP 5.2)**

| Case | Fixture | Expected |
| --- | --- | --- |
| `pass` | `fixtures/evidence-tag-grammar/pass-all-eleven-classes/` | `pass` |
| `warn` | `fixtures/evidence-tag-grammar/warn-malformed-tag-inside-fence/` | `warn` |
| `fail` | `fixtures/evidence-tag-grammar/fail-untagged-claim/` | `fail` |
| `edge` | `fixtures/evidence-tag-grammar/skip-seeded-reference-absent/` | `skipped: unavailable` |

### ID-namespace resolution

Verifies that every identifier used in a governed artifact resolves through the authority document to exactly one canonical definition, that the reserved prefixes carry their method §3.2 meanings, and that no identifier was renumbered or reused (FR-10, AC-12.4).

**Input shape**

```json
{
  "check": "id-namespace-resolution",
  "artifact_path": "cadence/candidate/solution-design.md",
  "authority_document": "docs/design/EXAMPLE_AUTHORITY.md",
  "references": { "id_namespaces": "cadence/references/id-namespaces.md" },
  "options": {
    "identifier_baseline": null,
    "companion_documents": ["docs/design/EXAMPLE_COMPANION.md"]
  }
}
```

**Verdict semantics**

| Verdict | Condition | Exit code |
| --- | --- | --- |
| `pass` | Every identifier resolves to exactly one definition, reached either in the authority document or in a companion the authority document explicitly delegates to; every reserved prefix carries its method §3.2 meaning. | `0` |
| `warn` | An identifier is defined in the authority document and used nowhere — a dangling definition. Recorded as hygiene, never blocking. | `10` |
| `fail` | An identifier resolves to zero definitions, or to two; or a reserved prefix is used with a meaning other than its method §3.2 one; or the recorded baseline shows an identifier renumbered or reused. | `20` |
| `skipped: not-applicable` | **The stability half of AC-12.4** when `options.identifier_baseline` is `null`. Never-reused and never-renumbered are properties of a history, not of a snapshot, so with no recorded baseline the check reports this half skipped and says so in `stated_limits`. It is never folded into the pass (NFR-6). | `30` |
| `skipped: unavailable` | The authority document named in the envelope cannot be read. Resolution has no target; a project with no authority document is the manifest check's finding, not a silent pass here. | `30` |

**Edge cases**

- No baseline is supplied: the resolution half runs and the stability half is `skipped: not-applicable`. A whole-check `pass` in this state is a defect in the validator, not a fact about the artifact.
- `P1` through `P7` are Constitution principles, not `PREFIX-N` identifiers; they resolve against the Constitution and are not reported unresolved: expected `pass`.
- An `AC-` identifier defined in a declared companion resolves through the authority document's delegation rather than directly: expected `pass`.
- A token inside an inline code span that names a file rather than an identifier (for example a path fragment) is not an identifier: expected `pass`.

**Frozen-fixture cases (WP 5.2)**

| Case | Fixture | Expected |
| --- | --- | --- |
| `pass` | `fixtures/id-namespace-resolution/pass-resolves-through-authority/` | `pass` |
| `warn` | `fixtures/id-namespace-resolution/warn-dangling-definition/` | `warn` |
| `fail` | `fixtures/id-namespace-resolution/fail-two-definitions-one-token/` | `fail` |
| `edge` | `fixtures/id-namespace-resolution/skip-no-recorded-baseline/` | `pass` on resolution, `skipped: not-applicable` on stability |

### Cross-reference integrity

Verifies that every cross-reference resolves to a target that exists (method §9, AC-9.2). Loose **version** pointers are explicitly out of scope here and belong to loose-pointer drift; keeping them out is what stops the method §5 cascade from re-entering through this check.

**Input shape**

```json
{
  "check": "cross-reference-integrity",
  "artifact_path": "cadence/candidate/solution-design.md",
  "authority_document": "docs/design/EXAMPLE_AUTHORITY.md",
  "options": {
    "document_set": ["docs/design/EXAMPLE_AUTHORITY.md", "docs/design/EXAMPLE_COMPANION.md"],
    "method_source": "docs/reference/source/CADENCE_METHOD.md"
  }
}
```

**Verdict semantics**

| Verdict | Condition | Exit code |
| --- | --- | --- |
| `pass` | Every identifier reference, document reference, and section pointer resolves to an existing target, and every `method §N` pointer resolves in `options.method_source` while every bare `§N` resolves in the citing project's own sections. | `0` |
| `warn` | A section pointer resolves, but the title the citing text gives it differs from the target's actual heading — the pointer works and the prose has drifted. | `10` |
| `fail` | A pointer names a document absent from `options.document_set`, a section absent from the named document, or a bare `§N` that exists only in the method source. The disambiguation convention requires `method §N` there; a bare pointer would give one token two meanings. | `20` |
| `skipped: not-applicable` | The artifact contains no cross-reference. | `30` |
| `skipped: unavailable` | A document named in `options.document_set` cannot be read, so resolution against it cannot be attempted. | `30` |

**Edge cases**

- A companion names a stale **version** of another document: expected `pass` here. That finding belongs to loose-pointer drift and is a warn there (AC-13.2); reporting it in both places would rebuild the cascade.
- A bare `§6.1` in a project whose own sections stop at §5, while the method has a §6.1: expected `fail`, with the fix being `method §6.1`.
- A backticked bare path in prose is repository-root-relative and is **not** a link or a cross-reference: expected `pass`. Link integrity owns `](path)` forms.

**Frozen-fixture cases (WP 5.2)**

| Case | Fixture | Expected |
| --- | --- | --- |
| `pass` | `fixtures/cross-reference-integrity/pass-all-pointers-resolve/` | `pass` |
| `warn` | `fixtures/cross-reference-integrity/warn-section-title-drifted/` | `warn` |
| `fail` | `fixtures/cross-reference-integrity/fail-bare-section-pointer-collides/` | `fail` |

### Revision-row immutability

Compares an artifact's revision record against its base revision and fails any modification of an existing row (FR-12, AC-13.1, method §6.2 rule 2, method §8). Rows are history: they record what was true when written, are excluded from version bumps, and are never swept by a find-and-replace.

**Input shape**

```json
{
  "check": "revision-row-immutability",
  "artifact_path": "cadence/candidate/solution-design.md",
  "base_revision": "HEAD",
  "tools": { "version_control": { "resolved": true } },
  "options": { "table_heading": "Appendix — Revision Record" }
}
```

**Verdict semantics**

| Verdict | Condition | Exit code |
| --- | --- | --- |
| `pass` | The revision table's diff against `base_revision` consists only of appended rows. An artifact that did not exist at the base revision passes with the absence of a baseline recorded in `stated_limits`. | `0` |
| `warn` | A newly appended row is out of order — dated earlier than the row above it, or carrying a version that sorts below its predecessor. The trail is intact; its ordering is not. | `10` |
| `fail` | Any byte of an existing row changed. **A table-alignment reflow counts**: re-padding an existing row's cells rewrites history even when the visible text is unchanged, and a validator that normalizes whitespace before comparing would bless exactly the find-and-replace method §6.2 rule 2 prohibits. | `20` |
| `skipped: not-applicable` | The artifact has no revision record. Many governed artifacts correctly have none; that is not a defect and is never a pass. | `30` |
| `skipped: unavailable` | Version control is unresolved, or `base_revision` cannot be resolved (a shallow clone, a detached tree). Degrades closed at a boundary. | `30` |

**Edge cases**

- A change that only re-aligns the revision table's pipes: expected `fail`.
- A file with no revision record at all: expected `skipped: not-applicable`, never `pass`.
- A file added in this change, with no base-revision counterpart: expected `pass`, with "no baseline revision existed" in `stated_limits`.
- Version control absent from the host: expected `skipped: unavailable`, and the gate verdict at a promotion boundary is `quarantine`, never `promote`.

**Frozen-fixture cases (WP 5.2)**

| Case | Fixture | Expected |
| --- | --- | --- |
| `pass` | `fixtures/revision-row-immutability/pass-append-only/` | `pass` |
| `warn` | `fixtures/revision-row-immutability/warn-appended-row-out-of-order/` | `warn` |
| `fail` | `fixtures/revision-row-immutability/fail-existing-row-rewritten/` | `fail` |
| `edge` | `fixtures/revision-row-immutability/fail-table-alignment-reflow/` | `fail` |

### Loose-pointer drift

**Warn-only. A `fail` from this check is unreachable by design.** One place asserts a version — the manifest — and everywhere else points loosely; a pointer that names a version and drifts produces a warning, **never a failure** (method §6.2 rule 1; method §5's fail-to-warn downgrade; FR-2, FR-12, AC-13.2). This is the fix for the cascade problem, and a check that could fail here would reintroduce it.

**Input shape**

```json
{
  "check": "loose-pointer-drift",
  "artifact_path": "cadence/candidate/solution-design.md",
  "manifest_path": "cadence/manifest.json",
  "options": { "version_authority": "documents[].current_version" }
}
```

**Verdict semantics**

| Verdict | Condition | Exit code |
| --- | --- | --- |
| `pass` | Every loose version pointer in the artifact matches the version the manifest asserts, or the artifact carries none. | `0` |
| `warn` | A live pointer names a version other than the manifest's assertion. Every drift finding this check can produce is a `warn`. | `10` |
| `fail` | **Unreachable by design** (method §6.2 rule 1: a loose pointer "produces a *warning* when it drifts, never a failure"; method §5 downgrades this cross-reference rule from fail to warn). No input reaches this verdict; the fixture in the fail slot below is the falsifiability case that proves it. | not emitted |
| `skipped: not-applicable` | The manifest asserts no version for the pointed-at document, so there is nothing to drift from. | `30` |
| `skipped: unavailable` | The manifest cannot be read or parsed, so the one asserted version is unavailable. | `30` |

**Edge cases**

- A revision row names v1.5 while the manifest asserts v1.9: expected `pass`, with **no finding on that row**. Revision rows are history and are excluded from version bumps (method §6.2 rule 2); flagging one is the defect, not the drift.
- A companion's pointer runs one revision behind the manifest: expected `warn`, never `fail`, and promotion is not blocked by it.
- The manifest asserts a version no document points at: expected `pass`. Asserting is the manifest's job; being pointed at is not a requirement.

**Frozen-fixture cases (WP 5.2)**

| Case | Fixture | Expected |
| --- | --- | --- |
| `pass` | `fixtures/loose-pointer-drift/pass-pointer-matches-manifest/` | `pass` |
| `warn` | `fixtures/loose-pointer-drift/warn-pointer-one-revision-behind/` | `warn` |
| `fail` | `fixtures/loose-pointer-drift/falsifiability-drift-plus-historic-row/` — the fail slot holds a **falsifiability fixture** rather than a fail case, because `fail` is **unreachable by design** (method §6.2 rule 1). Its corpus carries both a drifted live pointer and a stale version inside a revision row. | `warn`, with exactly one finding, on the live pointer only. A naive implementation fails this fixture two ways: by returning `fail` on the drift, or by reporting a second finding on the historic row. |

### Link integrity

Resolves the artifact's links against the working tree (method §6.1, AC-9.2). Only `](path)` forms are links; a backticked bare path in prose is repository-root-relative text and is not resolved here.

**Input shape**

```json
{
  "check": "link-integrity",
  "artifact_path": "cadence/candidate/solution-design.md",
  "project_root": ".",
  "options": {
    "follow_anchors": true,
    "external_schemes": ["http", "https"]
  }
}
```

**Verdict semantics**

| Verdict | Condition | Exit code |
| --- | --- | --- |
| `pass` | Every relative link target exists, and every anchor names a heading present in its target file. | `0` |
| `warn` | A link resolves to a path outside `project_root`, or uses an absolute filesystem path. It works on this host and is not portable. | `10` |
| `fail` | A relative link target does not exist, or `options.follow_anchors` is `true` and an anchor names a heading absent from the target. | `20` |
| `skipped: not-applicable` | The artifact contains no `](path)` link. | `30` |
| `skipped: unavailable` | Recorded **per link** for every target whose scheme is in `options.external_schemes`: the core validators have no network access (NFR-3), so an external target is never fetched. Each is enumerated in `stated_limits`; the check's own `status` stays `ran` and its verdict is computed from local targets only. A green verdict never claims an external link resolves. | not emitted at check level — the per-link skip never becomes the check's own `status`, so the exit code follows the verdict computed from local targets |

**Edge cases**

- A backticked bare path in prose that does not exist on disk: expected `pass`. It is not a link (`CONTRIBUTING.md` convention), and treating it as one trains authors to stop backticking paths.
- An artifact whose links are all external: expected `pass` at exit `0`, with every target enumerated as skipped in `stated_limits` and never a claim that they resolve. **The check-level `status` stays `ran` and never becomes `skipped: unavailable`**, which is the one reading this row rules out: `unavailable` degrades closed (§2), so treating a wholly-external artifact that way would make it unpromotable for carrying no local link — a verdict about the artifact's *link style* rather than its integrity. The honesty NFR-6 requires is carried by `stated_limits` naming every unfetched target, not by withholding the verdict.
- A `](path)` form inside a fenced block: example text, not a live link; excluded, with the exclusion recorded.

**Frozen-fixture cases (WP 5.2)**

| Case | Fixture | Expected |
| --- | --- | --- |
| `pass` | `fixtures/link-integrity/pass-relative-targets-resolve/` | `pass` |
| `warn` | `fixtures/link-integrity/warn-absolute-path-link/` | `warn` |
| `fail` | `fixtures/link-integrity/fail-missing-anchor/` | `fail` |

### Quotation symmetry

Checks **pairing, attribution, and dating only** (method §9, §3.3, §6.1 Draft row). It is a Candidate-gate check in this runtime because method §9 requires every quotation to be whole and sourced at the promotion boundary; the method itself names quotation symmetry as a Draft-zone advisory lint, and that difference is recorded here rather than smoothed over (D-4).

**Input shape**

```json
{
  "check": "quotation-symmetry",
  "artifact_path": "cadence/candidate/discovery-record.md",
  "options": { "quote_marks": [["“", "”"], ["\"", "\""]] }
}
```

**Verdict semantics**

| Verdict | Condition | Exit code |
| --- | --- | --- |
| `pass` | Every quotation opens and closes, carries an attribution, and carries a date wherever its evidence class requires one. | `0` |
| `warn` | A nested quotation the pairing rule cannot disambiguate, or an attribution that names a source the artifact does not otherwise cite. Recorded for a human read; not blocking. | `10` |
| `fail` | An unpaired quotation mark; a quotation with no attribution; a quotation whose evidence class names a date that the tag does not carry. | `20` |
| `skipped: not-applicable` | The artifact contains no quotation. | `30` |

**Edge cases**

- An apostrophe in a contraction, or a possessive, must not be counted as a quotation mark: expected `pass`.
- A block quote used as a design note rather than as a quotation — the shape the runtime reference files open with — is not a quotation: expected `pass`, with the exclusion recorded.
- A quotation spanning two source lines pairs across the line break: expected `pass`.

**Frozen-fixture cases (WP 5.2)**

| Case | Fixture | Expected |
| --- | --- | --- |
| `pass` | `fixtures/quotation-symmetry/pass-paired-attributed-dated/` | `pass` |
| `warn` | `fixtures/quotation-symmetry/warn-nested-quotation/` | `warn` |
| `fail` | `fixtures/quotation-symmetry/fail-unattributed-quotation/` | `fail` |

**Stated limit, carried on every run:** a green verdict proves a quotation is *attributable and dated*. It is never evidence that the quotation is verbatim; that is a human read (method §9, §3.3, AC-9.4).

### Render fidelity

Regenerates a derived render from its spec and compares the two (method §3.1, pattern 4, AC-9.2). Spec is source; a hand-edited render is a defect. Because renderers embed nondeterministic metadata, the normalization rules below are part of the specification: without them the check cannot be fixture-pinned at all.

**Input shape**

```json
{
  "check": "render-fidelity",
  "artifact_path": "cadence/candidate/solution-design.md",
  "tools": { "render_toolchain": { "resolved": true }, "pdf_extractor": { "resolved": true } },
  "options": {
    "spec_path": "cadence/candidate/solution-design.md",
    "render_path": "cadence/candidate/renders/solution-design.pdf",
    "normalization": "text-extract-v1"
  }
}
```

`normalization` names a fixed rule set, applied in this order: extract text rather than compare bytes; drop producer, creator, and creation-date metadata; normalize line endings to a single newline; collapse runs of whitespace to one space; drop page-break artifacts and page numbers; rejoin words hyphenated at a line break; compare under a fixed byte collation. The **normalized text** is what the fixture pins, so a renderer patch release that changes only embedded metadata cannot flip a verdict.

**Verdict semantics**

| Verdict | Condition | Exit code |
| --- | --- | --- |
| `pass` | A fresh regeneration from `spec_path` normalizes byte-identically to the committed render at `render_path`. | `0` |
| `warn` | Normalized text matches, but the committed render's recorded producer differs from the version preflight resolved. Equivalence holds; provenance drifted. | `10` |
| `fail` | Normalized text differs — the render was hand-edited, or was generated from a different spec revision. | `20` |
| `skipped: not-applicable` | The artifact declares no derived render. | `30` |
| `skipped: unavailable` | The render toolchain or the extractor is unresolved (NFR-3). Never a pass; at a promotion boundary the gate verdict is `quarantine`. | `30` |

**Edge cases**

- Two renders differing only in an embedded creation date: expected `pass` after normalization.
- A hand-edited render differing by one word: expected `fail`.
- Extractor absent from the host: expected `skipped: unavailable`, never `pass` (NFR-6), and `quarantine` at a boundary.
- An artifact with no derived render: expected `skipped: not-applicable`, which is not blocking.

**Frozen-fixture cases (WP 5.2)**

| Case | Fixture | Expected |
| --- | --- | --- |
| `pass` | `fixtures/render-fidelity/pass-render-matches-spec/` | `pass` |
| `warn` | `fixtures/render-fidelity/warn-producer-version-drift/` | `warn` |
| `fail` | `fixtures/render-fidelity/fail-hand-edited-render/` | `fail` |
| `edge` | `fixtures/render-fidelity/skip-extractor-unresolved/` | `skipped: unavailable` |

### Manifest/registry consistency

Verifies the project manifest against the governed tree (method §3.2, Appendix B, AC-1.3, AC-9.2). The manifest is the one place a document set, its authority designation, and a current version are asserted.

**Input shape**

```json
{
  "check": "manifest-registry-consistency",
  "manifest_path": "cadence/manifest.json",
  "project_root": ".",
  "options": {
    "governed_roots": ["cadence/draft", "cadence/candidate", "cadence/approved"],
    "evidence_root": "artifacts/"
  }
}
```

**Verdict semantics**

| Verdict | Condition | Exit code |
| --- | --- | --- |
| `pass` | Every governed artifact under `options.governed_roots` has a manifest row; every manifest row names a file that exists; the manifest declares **exactly one** authority document; the document-set declaration carries its selection-rationale field and its current-version assertion slot. | `0` |
| `warn` | A manifest row's selection-rationale field is present but empty. The structure is there and the reason for it is not. | `10` |
| `fail` | Zero or two authority-document designations (AC-1.3); a governed artifact with no manifest row; a manifest row naming a file that does not exist. | `20` |
| `skipped: not-applicable` | The project declares no document set yet — an initialized scaffold before its first artifact. | `30` |
| `skipped: unavailable` | The manifest cannot be read or parsed. | `30` |

**Edge cases**

- A file under `options.evidence_root`: **never** requires a manifest row. `artifacts/` holds evidence about runs, is never itself a zone, and is never promoted; demanding a row for it would make every gate run fail on its own evidence.
- Two authority-document designations: expected `fail` (AC-1.3). Zero: expected `fail` for the same reason.
- An artifact that has been promoted between zone directories: the row tracks the artifact, not its path, so a zone move alone is expected `pass`.

**Frozen-fixture cases (WP 5.2)**

| Case | Fixture | Expected |
| --- | --- | --- |
| `pass` | `fixtures/manifest-registry-consistency/pass-one-authority-all-rows/` | `pass` |
| `warn` | `fixtures/manifest-registry-consistency/warn-empty-selection-rationale/` | `warn` |
| `fail` | `fixtures/manifest-registry-consistency/fail-two-authority-documents/` | `fail` |

### The gate self-test

Proves that each registered check still fires on a known-bad input (method §6.1, FR-18, SC-2, method pattern 7). This is the check that catches a silently disabled check, and it is the reason a green gate means something.

**The registry is this check's deliverable.** `scripts/validators/registry.json` is built with the gate self-test (forthcoming — WP 5.1), because this is the check that reads it at runtime and whose `fail` condition *is* registry agreement. It carries one entry per registered gate check giving the check's slug, its script path, its fixture root, **the non-pass verdict its known-bad fixture must produce**, and the finding code that fixture must carry. Each of the other ten checks adds its own entry in the change that adds its script and fixtures; until they do, the registry is short and this check reports `skipped: not-applicable` per the row below. Two things read the registry: this check, and WP 5.4's tier-configuration validator, which resolves §6's registry-agreement rule against it (forthcoming — WP 5.4).

**What the registry does not contain.** `scripts/validators/tier-config.js` and `fixtures/tier-config/` are WP 5.4's configuration validator (§6). It is not a Draft → Candidate gate check, carries no tier of its own, and is **not** registered — so the registry-and-fixture-root agreement rule below does not reach it, and a fixture directory belonging to a non-registered validator is not the "fixture set without a registry entry" this check fails on. The rule compares the registry against the fixture roots the registry names, not against every directory under `fixture_root`.

**Input shape**

```json
{
  "check": "gate-self-test",
  "options": {
    "registry_path": "scripts/validators/registry.json",
    "fixture_root": "fixtures/"
  }
}
```

**Verdict semantics**

| Verdict | Condition | Exit code |
| --- | --- | --- |
| `pass` | Every registered check, run against its known-bad fixture, produced its recorded non-pass verdict **with the recorded finding code**; and the registry and the fixture root agree — no check without a fixture set, no fixture set without a registry entry. | `0` |
| `warn` | A registered check's fixture set carries the mandatory trio but omits an edge fixture this sheet names for it. The self-test does not block on it; the omission is recorded so the gap is visible. | `10` |
| `fail` | A registered check did not fire on its known-bad fixture (the silently-disabled-check defect class, SC-2); or it fired with a different finding code than recorded — it went red, but not for the right reason, which method pattern 7 does not accept; or a check is present in one of the registry and the fixture root and absent from the other. | `20` |
| `skipped: not-applicable` | The registry declares no checks — an initialized scaffold before WP 5.1's validators are installed. | `30` |
| `skipped: unavailable` | The registry or the fixture root cannot be read. The self-test is the gate's own falsifiability evidence; unable to run, it degrades closed. | `30` |

**Edge cases**

- **A warn-only check is self-tested against its `warn` fixture.** Loose-pointer drift has no reachable `fail` (method §6.2 rule 1), so a self-test that demands a `fail` from every check would report a correct check as broken. The registry records, per check, which verdict its known-bad fixture must produce.
- A check commented out of the registry while its script remains on disk: expected `fail`. This is SC-2's silently-disabled-check class and is the defect this check exists for.
- A check that fires on its known-bad fixture but emits a different finding code than the registry records: expected `fail`, not `pass` — red for the wrong reason is not falsifiability evidence.

**Frozen-fixture cases (WP 5.2)**

| Case | Fixture | Expected |
| --- | --- | --- |
| `pass` | `fixtures/gate-self-test/pass-every-check-fires/` | `pass` |
| `warn` | `fixtures/gate-self-test/warn-edge-fixture-absent/` | `warn` |
| `fail` | `fixtures/gate-self-test/fail-check-silently-disabled/` | `fail` |

### The tooling shell-lint

Lints the gate's own shell tooling (method §6.1, NFR-3). Its severity-to-verdict mapping is **pinned in the adapter**, not inherited from the tool, so a tool upgrade cannot change a verdict without a recorded change (R-2).

**Input shape**

```json
{
  "check": "tooling-shell-lint",
  "tools": { "shell_lint": { "resolved": true } },
  "options": {
    "script_globs": ["scripts/**/*.sh", "hooks/**/*.sh"],
    "severity_map": { "error": "fail", "warning": "fail", "info": "warn", "style": "warn" }
  }
}
```

**Verdict semantics**

| Verdict | Condition | Exit code |
| --- | --- | --- |
| `pass` | The lint produced no diagnostic that `options.severity_map` maps to `warn` or `fail`. | `0` |
| `warn` | At least one diagnostic maps to `warn`, and none maps to `fail`. A severity the map does not recognize also lands here, with the unmapped severity named in the finding — never silently dropped. | `10` |
| `fail` | At least one diagnostic maps to `fail`. | `20` |
| `skipped: not-applicable` | The project's gate tooling contains no shell script matching `options.script_globs`. | `30` |
| `skipped: unavailable` | The shell-lint role is unresolved by preflight (NFR-3). Never a pass; `quarantine` at a promotion boundary. | `30` |

**Edge cases**

- A tool upgrade adds a new rule at a severity the map does not name: expected `warn` with the unmapped severity recorded, so the gap is visible and closes through a reviewed adapter change rather than through verdict drift.
- The shell-lint role is unresolved: expected `skipped: unavailable`, and the gate verdict at a promotion boundary is `quarantine`, never `promote`.
- A shell script outside `options.script_globs` — a project's own build script, not gate tooling: not scanned, and the boundary is stated in `stated_limits` so a green verdict is not read as a whole-repository lint.

**Frozen-fixture cases (WP 5.2)**

| Case | Fixture | Expected |
| --- | --- | --- |
| `pass` | `fixtures/tooling-shell-lint/pass-clean-tooling/` | `pass` |
| `warn` | `fixtures/tooling-shell-lint/warn-unmapped-severity/` | `warn` |
| `fail` | `fixtures/tooling-shell-lint/fail-error-severity-diagnostic/` | `fail` |

## 5. External-tool adapters and version preflight (NFR-3)

The core validators need only Node and the working tree. The complete promotion gate additionally needs four **roles**. They are specified as roles, not as named binaries with pinned versions: a named pinned tool requires an NFR-3 entry, a pinned version, and a preflight check landing in one change (the `CLAUDE.md` working rule), and this sheet's governed-document scope does not permit that amendment. **Binding a role to a concrete binary and version is a WP 5.1 change that lands together with its NFR-3 entry** (forthcoming — WP 5.1). No undeclared external dependency enters the project through this sheet.

| Role | What the gate needs it for | Checks that depend on it |
| --- | --- | --- |
| Version control | Resolving `base_revision` and diffing an artifact against it; the promotion move itself | Revision-row immutability |
| Shell-lint | Linting the gate's own shell tooling | The tooling shell-lint |
| Render toolchain | Regenerating a derived render from its spec | Render fidelity |
| PDF extractor | Extracting comparable text from a rendered PDF, where PDF fidelity is checked | Render fidelity (PDF renders only) |

**Adapter contract.** One file per role under `scripts/adapters/`, same single-file zero-dependency shape as a validator. Each exports a `manifest` naming the role, the probe command, the rule for parsing a version out of the probe's output, and the supported range; and a `resolve()` returning one preflight record.

```json
{
  "role": "shell-lint",
  "resolved": false,
  "binary": null,
  "version": null,
  "probe": "<the exact command run, recorded verbatim>",
  "reason": "role bound to a concrete binary at WP 5.1 with its NFR-3 entry"
}
```

**Preflight.** `/cadence:init` and every gate run resolve all four roles before any check executes and report the resolved versions (NFR-3). The records go into the attempt manifest, so a verdict can be replayed against the toolchain that produced it (NFR-5).

**Degrade closed, in one stated chain.** An unresolved **required** role means its dependent check reports `status: skipped` with `skipped_reason: unavailable`, and is **never** reported as `passed` (NFR-6); at a promotion boundary the gate verdict is FR-14's `quarantine`, never `promote` (NFR-3, AC-11.3). In the Draft zone the same condition degrades **open**: the write proceeds and the degradation is reported, because no hook has a blocking path there (FR-7, D-2). A role no configured check depends on is reported unresolved and is not required.

## 6. Tier-configuration file format (FR-11)

One project-visible file, `cadence/gate-tiers.json`, seeded by `/cadence:init` and rendered by `/cadence:status --gates` (AC-16.1). It lists every check against a tier drawn from the closed set `block | warn | guide` and the boundaries at which a `block` tier applies, and it records the per-boundary review-tier defaults AC-14.2 requires.

**Who builds which half.** The packaged template `/cadence:init` seeds from was authored by **WP 3.1** against the values below, which are frozen here and need no validator to exist; it is present at `skills/cadence-method/scaffold/gate-tiers.json`, carrying §6's block verbatim. The scaffold enumeration that obliges init to seed it is S-6. **WP 5.4** sets the final per-check tier values in that same template and builds the configuration validator (forthcoming — WP 5.4). Splitting it this way is why WP 3.1 does not wait on WP 5.4: the seed values are a specification output, not a validator output.

```json
{
  "schema": "cadence.gate-tiers.v1",
  "boundaries": ["draft-to-candidate", "candidate-to-approved"],
  "checks": {
    "evidence-tag-grammar":          { "tier": "block", "boundaries": ["draft-to-candidate", "candidate-to-approved"] },
    "id-namespace-resolution":       { "tier": "block", "boundaries": ["draft-to-candidate", "candidate-to-approved"] },
    "cross-reference-integrity":     { "tier": "block", "boundaries": ["draft-to-candidate", "candidate-to-approved"] },
    "revision-row-immutability":     { "tier": "block", "boundaries": ["draft-to-candidate", "candidate-to-approved"] },
    "loose-pointer-drift":           { "tier": "warn",  "boundaries": [] },
    "link-integrity":                { "tier": "block", "boundaries": ["draft-to-candidate", "candidate-to-approved"] },
    "quotation-symmetry":            { "tier": "block", "boundaries": ["draft-to-candidate", "candidate-to-approved"] },
    "render-fidelity":               { "tier": "block", "boundaries": ["draft-to-candidate", "candidate-to-approved"] },
    "manifest-registry-consistency": { "tier": "block", "boundaries": ["draft-to-candidate", "candidate-to-approved"] },
    "gate-self-test":                { "tier": "block", "boundaries": ["draft-to-candidate", "candidate-to-approved"] },
    "tooling-shell-lint":            { "tier": "block", "boundaries": ["draft-to-candidate", "candidate-to-approved"] }
  },
  "review": {
    "draft-to-candidate":    { "consensus": false, "grader": false },
    "candidate-to-approved": { "consensus": false, "grader": false }
  }
}
```

**The two boundaries are the only place a `block` tier is valid.** They are named here exactly as `skills/cadence-method/references/zone-lifecycle.md` names them: **Draft → Candidate**, where the full deterministic gate may block, and **Candidate → Approved**, where the isolated clean-room re-run may block. The two `boundaries` values above are those same two boundaries in the filename-safe spelling `artifact-layout.md` already uses for its `<boundary>` path component — `draft-to-candidate` and `candidate-to-approved` — and no third value is admissible. A check carrying `"tier": "block"` with a boundary outside that set, or with an empty boundary list, is **itself a configuration-validation failure** (FR-11, D-2, AC-16.1). This is the structural half of D-2: blocking logic exists only inside the promote command's gate step, and the configuration cannot express blocking anywhere else.

**The `review` block is where the opt-in review tier's default lives.** AC-14.2 requires the project configuration to record the consensus default per boundary and AC-19.2 requires the same of the Grader, both "inspectable via `/cadence:status --gates`" — and `--gates` renders this file, so this file is where they land. Its two keys are the same closed boundary set as everything above; each carries the two booleans `consensus` and `grader`. The seeded values are `false` at both boundaries: Q1 resolved to **opt-in everywhere** (§7 of the authority document), and AC-14.2's *recommended on for authority documents at Candidate → Approved* is a value a project sets for itself, not one the scaffold can set on its behalf — the schema has no document-class dimension and this sheet does not invent one. A `true` here is a recorded default, never a block: the review tier stays advisory under X-3 and FR-13 whatever this file says.

Five further rules the configuration validator enforces (forthcoming — WP 5.4).

- **The eleven keys are exactly the eleven checks.** A key naming no registered check, or a registered check with no key, is a failure — the same registry-agreement rule the gate self-test applies. The registered-check set is read from `scripts/validators/registry.json`, **never from the configuration under validation**: a missing check cannot be detected from the file that omits it, so the complete set has to come from somewhere the configuration does not control. This validator is not itself a registered check and does not appear in either file.
- **A method-stated warn cannot be configured to block.** `loose-pointer-drift` may not carry `"tier": "block"` at any boundary; method §6.2 rule 1 is upstream of project configuration (D-4).
- **`guide` is in the closed set and is not seeded here — and a gate check carrying it is this validator's one `warn`.** No Candidate-gate content check is tiered `guide` by the method (`skills/cadence-method/references/gate-checks.md`); the tier applies to the Draft-zone advisory lints, which are not gate checks. `guide` is therefore a legal token in an illegal position: not an unknown token, so not the `fail` the rule above gives one, but not a tier any of the eleven should carry. That is what the validator's `warn` verdict is for, and it is the only condition that produces one. Naming it is what keeps the contracted `pass | warn | fail` set from carrying an unreachable slot with no documented falsifiability fixture behind it (AC-12.2, §7).
- **The `review` block is validated, not merely tolerated.** Its two keys must be exactly the two boundaries, each carrying `consensus` and `grader` as booleans; a missing block, an unknown key, a missing boolean, or a non-boolean value is `fail`. Stating this is what stops the registry-agreement rule above from reading a legitimate `review` block as unknown content: the validator rejects unknown *check* keys, and `review` is not one.
- **Tier changes are ordinary reviewed edits** to this file (AC-16.2), which is what gives the method §5 fail-to-warn downgrade an audit trail through version control instead of a code change. The same applies to a `review` default: turning consensus on at a boundary is a reviewed configuration edit, which is what makes it visible (AC-14.2).

The seeded values above come from `gate-checks.md` for the eight checks the method states and from AC-9.2 for the three this runtime adds at the boundary; the seeded `review` values come from Q1's resolution. The **final** per-check tier values are WP 5.4's to set (forthcoming — WP 5.4).

## 7. Fixture-pack conventions (WP 5.2)

**Layout.** One directory per check, named by its slug; one directory per case inside it.

```text
fixtures/<check-slug>/<case-name>/
├── input.json      # the input envelope, exactly as the check receives it
├── corpus/         # the files input.json points at, relative to this directory
└── expected.json   # the output envelope, byte-for-byte
```

**Mandatory cases.** Every check carries a `pass`, a `warn`, and a `fail` case, plus each edge case §4 names for it. Where a verdict is unreachable by design, its slot holds the **falsifiability fixture** that pins the unreachability — an input a naive implementation would get wrong — with the expected verdict recorded as what the correct implementation returns. Loose-pointer drift is the one such case today.

**Parity rule.** The runner executes each fixture twice and diffs both outputs against `expected.json` byte-for-byte; any difference at all fails the suite (FR-8, AC-12.2, SC-4). This is why §2's determinism rules are normative rather than advisory.

**Fixture hygiene.** No absolute path, no timestamp, no host name, and no host-specific value in any fixture; the runner sets a fixed working directory and a fixed byte collation. Fixtures are retained artifacts under configuration control, not scratch (`CONTRIBUTING.md`).

**Falsifiability, once per check.** A check earns its green only after it has been shown red on its own seeded defect *for the right reason* (SC-2, method pattern 7). The `fail` fixture is that evidence, and the gate self-test re-proves it on every run.

## 8. Stated limits (FR-17)

What this sheet does **not** settle, published alongside what it does.

- **The `<work-item>` and `<artifact>` path components of the evidence tree.** Their format, character set, and source are not defined here. The gap is recorded as **Q4** in §7 of the authority document and resolves at the WP 1.4 design freeze; `skills/cadence-method/references/artifact-layout.md` is where it was first recorded. An implementer who needs a value takes it from Q4's stated default pending decision and brings any change back to WP 1.4 — choosing locally would give the validators and the report script two incompatible path schemes.
- **The final per-check tier values.** §6's values are the seed; WP 5.4 sets the final ones (forthcoming — WP 5.4).
- **The registry's own file format.** §4 fixes what `scripts/validators/registry.json` must carry per check and names the package that builds it; the JSON schema itself lands with that build (forthcoming — WP 5.1), because a schema written before the eleven entries exist would be pinning a guess.
- **The concrete tool binaries and their pinned versions.** §5 binds four roles; WP 5.1 binds each role to a binary, in the same change as its NFR-3 entry (forthcoming — WP 5.1).
- **The promotion report's own shape and its verdict exit codes.** Bounded by FR-14 and by `artifact-layout.md`, specified with the report script (forthcoming — WP 6.1).
- **Every behavioral claim here is `unverified`.** No validator exists yet, so nothing in this sheet has been executed. These are requirements on an implementation, not observations of one; WP 5.1 makes them testable and WP 5.2 makes them pinned.
- **A green gate never proves a quotation is verbatim.** It proves attribution and dating (method §9, AC-9.4). The same limit is carried on every quotation-symmetry run.

## 9. How to check this document mechanically

The completeness matrix in §3 is a claim about this file, so it is verifiable against this file. The recipe below is what a reviewer or a test phase runs; it needs only `grep` and `awk`.

````bash
SPEC=docs/validator-spec-sheet.md

# (a) The 11 x 4 matrix: each of the four fixed labels must occur exactly 11 times.
for label in "Input shape" "Verdict semantics" "Edge cases" "Frozen-fixture cases (WP 5.2)"; do
  printf '%-32s %s\n' "$label" "$(grep -c "^\*\*$label\*\*$" "$SPEC")"
done

# (b) Eleven check sections, one per WBS 5.1 check name.
grep -c '^### ' "$SPEC"

# (c) Label order, and non-empty type-correct content under every label.
#     Prints one line per problem; silence means the document is well-formed.
awk '
  function flush(   t) {
    if (lab == "") return
    t = body; gsub(/[ \t\n]/, "", t)
    if (t == "" || t == "-")                                    print "EMPTY     " sect " / " lab
    else if (lab ~ /Input shape/     && body !~ /```json/)      print "NOJSON    " sect " / " lab
    else if (lab ~ /Edge cases/      && body !~ /(^|\n)- /)     print "NOBULLET  " sect " / " lab
    else if (lab ~ /Frozen-fixture/  && rows < 3)               print "THINTABLE " sect " / " lab
    lab = ""; body = ""; rows = 0
  }
  /^### / { flush(); sect = substr($0, 5); order = ""; next }
  /^## /  { flush(); sect = ""; order = ""; next }
  /^\*\*(Input shape|Verdict semantics|Edge cases|Frozen-fixture cases \(WP 5\.2\))\*\*$/ {
    flush(); lab = substr($0, 3, length($0) - 4)
    order = order (order == "" ? "" : ",") lab
    if (lab ~ /Frozen-fixture/ && order !~ /^Input shape,Verdict semantics,Edge cases,Frozen-fixture/)
      print "ORDER     " sect " / " order
    next
  }
  { if (lab != "") { body = body $0 "\n"; if ($0 ~ /^\| `/) rows++ } }
  END { flush() }
' "$SPEC"
````

Four counts of `11` from (a), a count of `11` from (b), and silence from (c) together are the 11 by 4 matrix with no empty cell. Separately, §3's own table carries eleven data rows and four element columns, and no cell in it is empty or a bare dash.

To catch a rename, merge, or split against WBS 5.1: extract the eleven check names from WBS 5.1's row in `docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md` and diff that list against this file's eleven `###` headings. A drift shows up as a diff line.

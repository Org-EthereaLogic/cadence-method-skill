# Evidence Classes — CADENCE Method Reference (fixture-local copy, project-amended)

> **Source of truth:** The CADENCE Method, v4.7 (final) — `docs/reference/source/CADENCE_METHOD.md`, Appendix A.
> **Status:** fixture-local copy amended with two project-added classes, per the appendix's own closing rule ("A project may add a class by amending this appendix"). The eleven method classes are unchanged.

The block below is reproduced **byte-for-byte** from Appendix A of the method source (`docs/reference/source/CADENCE_METHOD.md`, method v4.7). It is the closed set of **eleven** evidence-tag classes, the three non-date tag parameters (`Speaker`, `Employer`, `key`), and the two governing rules. Do not paraphrase, reorder, or re-tag it here — a class is added only by amending the method's Appendix A, never by widening one silently in this reference.

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
| **Project-added (this project's amendment)** | *(internal memo, retrieved YYYY-MM-DD)* | An internal memorandum recording a decision, checked on the stated date. Declared by this project's own amendment, not by the method. |
| | *(court filing, Docket)* | A filed court document, identified by its `Docket` number, which the tag supplies. Declared by this project's own amendment; the parameter token is this project's, not one the method names. |

Two rules govern the set: **absent is a valid outcome** — a claim that fits no class is cut, not softened — and **never claim more verification than was performed.** A project may add a class by amending this appendix; it may not silently widen an existing one.

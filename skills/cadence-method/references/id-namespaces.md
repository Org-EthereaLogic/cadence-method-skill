# Identifier Namespaces — CADENCE Method Reference

> **Source of truth:** The CADENCE Method, v4.7 (final) — `docs/reference/source/CADENCE_METHOD.md`, §3.2.
> **Distilled from:** method §3.2 (the authority document and the SDLC document set) — the default identifier prefix table and the identifier-stability rule.
> **Status:** Draft reference (WBS 1.1). Final polish and table-of-contents pass are WP 2.2.
> Where this reference and the method disagree, the method governs (design decision D-4).

Every identifier resolves through the authority document to exactly one canonical definition (method §3.2). The prefixes below are the method's **default** set; a project may extend or use a different recorded namespace, but only by defining it once in its authority document, and it must never give one token two meanings.

## Default identifier prefixes

| Prefix | Means | Prefix | Means |
| --- | --- | --- | --- |
| `FR-` | functional requirement | `RC-` | root cause |
| `NFR-` | non-functional requirement | `O-` | option considered |
| `SC-` | success criterion | `Q` | open question (`Q1`, `Q2`, …) |
| `S-` | in-scope item | `X-` | exclusion (out of scope) |
| `US-` | user story | `AC-` | acceptance criterion |
| `A-` | assumption | `R-` | risk |

## Identifier stability

Identifiers are **stable**: once assigned, a number is never reused and never renumbered, so a requirement or an open question keeps its name as the document grows. A project may extend or use a different recorded namespace, but it must define that namespace once in its authority document and must not give one token two meanings.

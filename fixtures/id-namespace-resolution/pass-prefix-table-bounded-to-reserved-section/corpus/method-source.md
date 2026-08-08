# Example Authority Document

## 1. Glossary

This section carries its own two-column table, and it is not the reserved-prefix
declaration. It sits before section 3.2, so an implementation that lets the first matching
table anywhere in the file win would take its wording as the project's declared meaning
and report a remeaning that never happened.

| Term | Means | Term | Means |
| --- | --- | --- | --- |
| `FR-` | future request | `AC-` | annual cost |

## 3.2 Identifier Namespaces

The row format is shown by example first. An example declares nothing, so the fenced
block below must not set a meaning either.

```markdown
| Prefix | Means | Prefix | Means |
| --- | --- | --- | --- |
| `FR-` | fenced example, never a declaration | `AC-` | fenced example, never a declaration |
```

This is the declaration, and it agrees with the seeded reference:

| Prefix | Means | Prefix | Means |
| --- | --- | --- | --- |
| `FR-` | functional requirement | `AC-` | acceptance criterion |
| `SC-` | success criterion | `Q` | open question (Q1, Q2, ...) |

## Requirements

**FR-1** The system resolves every identifier to exactly one canonical definition.

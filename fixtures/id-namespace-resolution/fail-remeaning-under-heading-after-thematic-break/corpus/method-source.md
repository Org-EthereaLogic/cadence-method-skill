---

# Example Authority Document

This document opens with a thematic break, not with YAML front matter, and it uses a second
thematic break lower down as an ordinary section divider. An earlier build read ANY leading
"---" as the start of front matter and skipped every line up to the next "---", so both
headings above that divider were invisible: no candidate section survived, the document was
read as redeclaring nothing, and the remeaning below returned a clean pass. Headings are
enumerated from the whole file now, so the divider hides nothing.

## Identifier prefixes

| Prefix | Means | Prefix | Means |
| --- | --- | --- | --- |
| `FR-` | future request | `AC-` | acceptance criterion |
| `SC-` | success criterion | `Q` | open question (Q1, Q2, ...) |

---

## Requirements

**FR-1** The reserved FR- prefix is redeclared above with a meaning the seeded reference does not carry.

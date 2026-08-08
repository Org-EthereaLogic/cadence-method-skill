# Example Authority Document

## 3.2 Identifier Namespaces

| Prefix | Means | Prefix | Means |
| --- | --- | --- | --- |
| `FR-` | functional requirement | `AC-` | acceptance criterion |
| `SC-` | success criterion | `Q` | open question (Q1, Q2, ...) |

## Requirements

**FR-1** The system resolves every identifier to exactly one canonical definition.

## Success criteria

**SC-1** The gate rejects any unresolvable identifier at the Draft to Candidate boundary.

**SC-1** The gate also, contradictorily, carries a second definition under the same token.

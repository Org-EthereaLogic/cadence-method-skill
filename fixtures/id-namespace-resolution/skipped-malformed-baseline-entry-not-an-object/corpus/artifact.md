# Example Candidate Artifact

This document cites **FR-1**, which resolves cleanly and still carries exactly the wording
the baseline meant to record. The baseline entry is malformed — a bare string where an
object carrying a string "definition" belongs — so its definition text is unreadable. A
naive implementation substitutes the empty string and reports FR-1 reused against a
baseline it never actually read; nothing could be compared, so the run degrades closed.

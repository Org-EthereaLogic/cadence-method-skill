# Example Candidate Artifact

This document cites **FR-1**, which resolves cleanly. The recorded baseline is malformed —
its "identifiers" value is a string — so the stability half could not run. Reading that
string as "no entries compared" would be a green-ish claim about a check that never ran,
which is the defect NFR-6 forbids, so the whole run degrades closed instead.

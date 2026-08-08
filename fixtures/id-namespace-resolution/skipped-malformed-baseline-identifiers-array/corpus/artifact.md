# Example Candidate Artifact

This document cites **FR-1**, which resolves cleanly. The recorded baseline is malformed —
its "identifiers" value is an array — so the stability half could not run. An array read as
an object yields the index keys "0" and "1", which a naive implementation reports as two
identifiers compared; nothing was compared, so the run degrades closed instead.

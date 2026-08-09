# Fixture Artifact — An Escaped Backslash Is Not An Escaped Pipe

A pipe is escaped only when an ODD run of backslashes precedes it. Here the
run is even, so the second pipe is a live cell delimiter and the token sits
two cells away from the reference.

| `docs/design/COMPANION_ONE.md` | \\| v1.0 |

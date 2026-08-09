# Fixture Artifact — Bare Path Recognition

It references docs/design/COMPANION_ONE.md v2.0, which drifts from the manifest
assertion and must be reported even though the path is written bare rather than
backticked.

The backup docs/design/COMPANION_ONE.md.bak v9.9 is a different file: there the
dot IS followed by a word character, so it is a filename continuation and must
not be read as a reference to the governed document.

A bare path ending a sentence is still recognised as a reference —
docs/design/COMPANION_ONE.md. That file was at v1.4 once, but prose is not a
pointer form, so this line is disclosed as not compared rather than guessed.

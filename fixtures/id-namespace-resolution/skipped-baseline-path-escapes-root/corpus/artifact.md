# Example Candidate Artifact

This document cites **FR-1**, which resolves cleanly. Every input the resolution half needs
is readable and in bounds; only options.identifier_baseline escapes the repository root, and
the run degrades closed rather than reporting the resolution half as a pass.

The refused path also does not exist, so a build with the root constraint deleted would
still fail to read it. That is why this case is pinned by the dedicated stated_limits
sentence naming the refused envelope field rather than by the skipped verdict alone: only
a refusal emits that sentence, so deleting the constraint changes this expected.json.

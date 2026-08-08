# Example Candidate Artifact

This document cites **FR-1**, so the check has real work to do: the run degrades closed
because the envelope's authority_document escapes the repository root, not because there
was nothing to examine.

This artifact is the only corpus file the case needs. The envelope also names an
id_namespaces reference, but the refusal fires on the earlier authority_document read and
that reference is never opened, so no file is seeded for it: a corpus file the run cannot
reach would suggest the check consulted it. What proves the refusal fired is the dedicated
stated_limits sentence naming the refused envelope field, which a merely unreadable path
never produces.

## Work package

<!-- The one WBS package this PR implements, e.g. WP 5.2, and the issue it closes. One package per PR. -->

## Identifiers traced

<!-- The FR-, NFR-, US-, AC-, and SC- identifiers this change touches, from the package's Traces-to cell. -->

## Exit criterion

<!-- Quote the WBS section's exit criterion verbatim, then one sentence on how this PR satisfies it. -->

## Evidence

<!-- Path to the retained evidence: a drill directory, a fixture run, or the make check output below.
     P2 — missing evidence blocks a completion claim. -->

## make check

```text

```

## Checklist

- [ ] A Revision Record row was appended to every governed document this change edits, stamped from a UTC clock (FR-12, NFR-5).
- [ ] No blocking logic was added outside the promote command's gate step (D-2).
- [ ] No new external tool was added without an NFR-3 entry, a pinned version, and a preflight check.

Mark unsupported claims `unverified`, never `passed`.

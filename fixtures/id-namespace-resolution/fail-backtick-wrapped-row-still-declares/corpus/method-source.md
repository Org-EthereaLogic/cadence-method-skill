# Example Authority Document

## Identifier prefixes

An earlier build blanked any whole line that looked like one balanced run-of-two-or-more
backtick span, calling it a table row wrapped for illustration. CommonMark does not read the
line below that way: a span closes on the FIRST equal-length backtick run, not the last, so
what is really there is two code spans with a LIVE declaration cell between them. Blanking
the whole line deleted that declaration, the document was read as redeclaring nothing, and a
genuine remeaning returned a clean pass. Only fenced blocks are masked now, so the row
declares and the remeaning is reported.

``x`` | y | `FR-` | financial record | ``z``

## Requirements

**FR-1** The reserved FR- prefix is redeclared above with a meaning the seeded reference does not carry.

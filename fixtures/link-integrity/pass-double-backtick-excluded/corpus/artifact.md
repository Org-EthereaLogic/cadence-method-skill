# Pass Double Backtick Excluded

A link that lives only inside a double-backtick (``...``) inline code span
is example text and must be excluded from scanning, just like a
single-backtick span. See the [companion document](other.md) for a real,
resolving relative link.

Here is an excluded example inside a double-backtick span whose target does
not exist and must never be resolved: ``[inline example](missing-in-span.md)``.

# Pass Relative Targets Resolve

This fixture exercises a resolving relative link, an in-document anchor, and
a cross-file anchor, plus the two masking exclusions link-integrity owns.

See the [companion document](other.md) for background, jump to the
[details section](#details) below, or read the
[companion's own details](other.md#other-details) directly.

A backticked bare path like `docs/does-not-exist.md` is prose, not a link,
and must not be flagged (CONTRIBUTING.md convention).

Here is an excluded example, a link form that lives only inside a fenced
code block and must never be resolved:

```
[fenced example](missing-in-fence.md)
```

## Details

More detail lives here, reached only by the in-document anchor above.

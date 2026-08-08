# Fail Fenced Heading Not Anchor

The [buried section](#buried) link below names an anchor whose only
matching heading-shaped line exists inside a fenced code block. A fenced
heading is example text, not a real heading, so it creates no anchor and
the link must dangle.

```text
## Buried

This "## Buried" line is inside a fenced code block. It is not a heading
and must never satisfy the #buried anchor above.
```

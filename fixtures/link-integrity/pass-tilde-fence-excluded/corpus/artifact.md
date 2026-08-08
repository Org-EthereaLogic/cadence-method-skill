# Pass Tilde Fence Excluded

A link that lives only inside a tilde (~~~) fenced code block is example
text and must be excluded from scanning, exactly like a backtick fence. See
the [companion document](other.md) for a real, resolving relative link.

Here is an excluded example inside a tilde fence, pointing at a file that
does not exist; it must never be resolved:

~~~text
[fenced example](missing-in-tilde-fence.md)
~~~

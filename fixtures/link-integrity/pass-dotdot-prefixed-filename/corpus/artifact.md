# Pass Dotdot Prefixed Filename

See the [dotdot notes](..notes.md), a valid file inside project_root whose
name simply begins with two dots. It is not a parent-directory escape: the
target resolves within project_root and must produce pass, not warn. The
".."-prefixed name is inert in-root test data, never a "../" path segment.

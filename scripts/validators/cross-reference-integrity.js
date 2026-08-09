// INPUT: one JSON object on standard input or as a file argument, matching
//   the common validator input envelope (docs/validator-spec-sheet.md
//   section 2), with this check's shape (section 4, "Cross-reference
//   integrity"):
//     {
//       "check": "cross-reference-integrity",
//       "artifact_path": "cadence/candidate/solution-design.md",
//       "options": {
//         "document_set": ["docs/design/EXAMPLE_AUTHORITY.md", "docs/design/EXAMPLE_COMPANION.md"],
//         "method_source": "docs/reference/source/CADENCE_METHOD.md"
//       }
//     }
//   artifact_path, every entry of options.document_set, and
//   options.method_source are all resolved relative to the current working
//   directory (the repository root), never relative to this script or to
//   the input file itself, exactly as every other check's artifact_path is
//   (section 2), and every one of them is CONSTRAINED to the repository
//   root: a resolved path that escapes the root (an absolute path, or a
//   "../" traversal) is refused unread and degrades the run closed to
//   "skipped: unavailable", carrying its OWN stated_limits sentence naming
//   the envelope field that was refused -- a refusal and an unreadable file
//   are different facts, and an envelope that cannot tell them apart cannot
//   be used to prove the root constraint fired. A missing artifact_path, an
//   unreadable artifact_path, or an unreadable entry of options.document_set
//   or options.method_source produces "skipped: unavailable" (degrade
//   closed).
//
//   Only artifact_path is scanned for OUTGOING cross-references.
//   options.document_set and options.method_source are read solely to
//   build the resolution namespace (section headings, table/figure/
//   appendix headings, and bold-marked identifier definitions) that the
//   artifact's references resolve against; they are never themselves
//   scanned for outgoing references.
//
//   Recognized cross-reference forms in the artifact's prose:
//     - "method §N"                    -> resolved against method_source
//     - "<name>.md §N"                 -> resolved against the document_set
//                                          entry whose basename is <name>.md
//     - a bare "§N", or prose "see N" / "section N"
//                                       -> resolved against the citing
//                                          project's own sections, the
//                                          union of artifact_path's own
//                                          headings and every document_set
//                                          entry's headings
//     - "PREFIX-N" (e.g. "AC-9.5")     -> a cross-cited identifier,
//                                          resolved if "**PREFIX-N**"
//                                          (bold) appears anywhere in
//                                          artifact_path, document_set, or
//                                          method_source
//     - "Table N" / "Figure N" /
//       "Appendix N"                   -> resolved if a heading of that
//                                          same shape exists anywhere in
//                                          artifact_path, document_set, or
//                                          method_source
//   Any of the above may carry a parenthetical title immediately after the
//   section number, e.g. "§3 (Scope)"; when the resolved target's actual
//   heading title differs from the cited title, that is title drift.
//
//   EXCLUDED from cross-reference scanning entirely (never produce a
//   finding, never claim a match): a loose VERSION pointer of the shape
//   "VERSION: vN" (owned by loose-pointer-drift), a backticked inline code
//   span (a bare path in backticks is prose text, not a cross-reference),
//   and a markdown "[text](path)" link form (owned by link-integrity).
//   Heading lines themselves are never scanned as citations; they exist
//   only to build the resolution namespace.
//
// USAGE: node cross-reference-integrity.js <input.json|->
//   Reads the input envelope from the named file, or from standard input
//   when the argument is "-" or omitted. Prints the common output envelope
//   (section 2) as JSON to standard output. Exit codes: pass=0, warn=10,
//   fail=20, skipped=30 (either reason); exit 3 if the input itself could
//   not be read or parsed as JSON.
'use strict';

const fs = require('fs');
const path = require('path');

const CHECK_SLUG = 'cross-reference-integrity';

const manifest = {
  check: CHECK_SLUG,
  description:
    'Cross-reference integrity: resolves every section pointer, cross-cited ' +
    'identifier, and table/figure/appendix reference in a governed artifact ' +
    'against its declared document set and method source, and fails a ' +
    'pointer whose target does not exist (method §9, AC-9.2, SC-2).',
  verdicts: ['pass', 'warn', 'fail'],
  skip_reasons: ['not-applicable', 'unavailable'],
  exit_codes: { pass: 0, warn: 10, fail: 20, skipped: 30 },
  finding_codes: [
    'dangling-document-reference',
    'dangling-section-pointer',
    'dangling-identifier-reference',
    'dangling-table-figure-reference',
    'bare-section-pointer-collides',
    'section-title-drift'
  ]
};

const STATED_LIMITS = [
  'A loose VERSION pointer (e.g. "SOME_DOC.md (VERSION: v1.2)") is excluded ' +
    'from cross-reference scanning entirely; drift on it is loose-pointer-' +
    "drift's finding, not this check's (AC-13.2).",
  'A backticked bare path in prose is repository-root-relative text, not a ' +
    'cross-reference, and is excluded from scanning.',
  '"[text](path)" markdown link forms are excluded from scanning; ' +
    "resolving them is link-integrity's job.",
  'Heading lines are used only to build the section, identifier, and ' +
    'table/figure/appendix namespaces; they are never themselves scanned as citations.',
  'An identifier is treated as defined only where it appears bold ' +
    '("**PREFIX-N**") in the artifact, its document set, or its method ' +
    'source; a plain mention elsewhere is not treated as a definition.',
  'Only artifact_path is scanned for outgoing cross-references; ' +
    'options.document_set and options.method_source are read solely to ' +
    'build the resolution namespace, never scanned for their own outgoing references.',
  'Every path in the input envelope -- artifact_path, each entry of ' +
    'options.document_set, and options.method_source -- is resolved ' +
    'beneath the repository root and refused unread when it escapes it, so ' +
    'an absolute path or a "../" traversal degrades the run closed to ' +
    'skipped: unavailable rather than reading a file outside the checkout; ' +
    'the containment test also resolves symbolic links: fs.realpathSync ' +
    'is applied to both the target and the repository root before the ' +
    'same containment test is re-applied, so a symbolic link that lives ' +
    'inside the checkout and resolves outside it is refused too, before ' +
    'it is read; a dangling symlink -- one whose target does not exist -- ' +
    'is not a refusal and is reported as the ordinary missing-file ' +
    'outcome instead.'
];

// The one signal that tells a REFUSAL apart from an unreadable file. Both
// degrade the run closed to "skipped: unavailable" -- the spec's skip-reason
// set has no dedicated value for a refusal and this check does not invent one
// -- so without a distinguishing sentence the two states emit byte-identical
// envelopes, and a fixture aimed at the root constraint would pin nothing.
// The sentence names the ENVELOPE FIELD that was refused, never the path it
// carried: that path is untrusted input, and echoing it back would leak the
// very string the constraint exists to keep out of this envelope.
function pathRefusedSentence(field) {
  return (
    'No further file was read for this run: the path supplied in ' + field +
    ' resolves outside the repository root and was refused unread by the ' +
    'root constraint. That is a containment decision, not a missing or ' +
    'unreadable file, and this sentence is what distinguishes the two -- ' +
    'skipped_reason is "unavailable" for both because the reason set ' +
    'carries no dedicated value for a refusal. The refused path is ' +
    'untrusted input and is deliberately not echoed here.'
  );
}

function cmpStr(a, b) {
  const sa = String(a);
  const sb = String(b);
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

function normalizePath(p) {
  if (!p) return '';
  let s = String(p).split(path.sep).join('/');
  s = s.replace(/^\.\//, '');
  s = s.replace(/\/+$/, '');
  return s;
}

function basenameOf(p) {
  const s = normalizePath(p);
  const parts = s.split('/');
  return parts[parts.length - 1];
}

function normTitle(t) {
  return String(t).trim().replace(/\s+/g, ' ').toLowerCase();
}

function mkFinding(p, line, code, severity, message) {
  return { path: normalizePath(p), line: line, code: code, severity: severity, message: message };
}

function findingComparator(a, b) {
  return cmpStr(a.path, b.path) || (a.line - b.line) || cmpStr(a.code, b.code);
}

function skipped(reason, statedLimits) {
  return {
    check: CHECK_SLUG,
    status: 'skipped',
    skipped_reason: reason,
    verdict: null,
    findings: [],
    stated_limits: statedLimits || STATED_LIMITS,
    tool_versions: {}
  };
}

// Resolves a repository-root-relative path from the (untrusted) input
// envelope and REFUSES one that escapes the root. Every caller reads inside
// a try/catch whose catch degrades the run closed to "skipped: unavailable",
// so an absolute path or a "../" traversal can never produce a pass, a
// partial result, or an uncaught crash. Two passes: first a cheap LEXICAL
// test (path.relative against ".."); then, on success, a REALPATH test that
// resolves both the root and the target with fs.realpathSync and re-applies
// the same containment test to the resolved values, so a symbolic link that
// lives inside the checkout and points outside it is refused too, before any
// read or execution. The root is realpathed defensively (falling back to the
// lexical root if that throws) so a checkout reached through a symlinked
// parent -- /tmp -> /private/tmp on macOS, a symlinked worktree parent -- is
// never self-refused. realpathSync throws ENOENT on a non-existent path,
// including a dangling symlink's target: that is the ordinary missing-file
// case, not a refusal, so it returns the lexical target unresolved and lets
// the caller's existing missing-file handling degrade it exactly as before;
// every OTHER errno (ELOOP, EACCES, ENOTDIR, ...) is rethrown UNTAGGED so the
// caller degrades closed as a failed read, never as a containment refusal and
// never as a crash. Both passes throw the SAME TAGGED err.pathEscapesRoot on
// an escape, so the caller can report a refusal distinctly from a failed
// read; an untagged throw would be indistinguishable from ENOENT in the
// output envelope. Character-identical in every guarded validator by
// contract -- containment semantics must stay uniform across them.
function resolveWithinRoot(relPath) {
  const root = path.resolve(process.cwd());
  const target = path.resolve(root, String(relPath));
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    const err = new Error('path escapes repository root');
    err.pathEscapesRoot = true;
    throw err;
  }
  let realRoot = root;
  try {
    realRoot = fs.realpathSync(root);
  } catch (e) {
    realRoot = root;
  }
  let realTarget;
  try {
    realTarget = fs.realpathSync(target);
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      return target;
    }
    throw e;
  }
  const realRelative = path.relative(realRoot, realTarget);
  if (realRelative === '..' || realRelative.startsWith('..' + path.sep) || path.isAbsolute(realRelative)) {
    const err = new Error('path escapes repository root');
    err.pathEscapesRoot = true;
    throw err;
  }
  return target;
}

// Degrades a failed read closed, adding the refusal sentence only when the
// root constraint actually fired. `field` names the envelope key that
// carried the path, never the path itself.
function skippedForFailedRead(err, field) {
  if (err && err.pathEscapesRoot) {
    return skipped('unavailable', STATED_LIMITS.concat([pathRefusedSentence(field)]));
  }
  return skipped('unavailable');
}

// Parses a document's markdown headings into two namespaces: `sections`
// (numbered headings, "N" -> { title, line }) and `tabfig` (Table/Figure/
// Appendix headings, "kind:label" -> { line }).
function parseHeadings(text) {
  const lines = text.split(/\r?\n/);
  const sections = new Map();
  const tabfig = new Map();
  for (let i = 0; i < lines.length; i++) {
    const headingMatch = /^#{1,6}\s+(.*)$/.exec(lines[i]);
    if (!headingMatch) continue;
    const rest = headingMatch[1].trim();

    const numMatch = /^(\d+(?:\.\d+)*)\.?\s+(.+)$/.exec(rest);
    if (numMatch) {
      const num = numMatch[1];
      if (!sections.has(num)) {
        sections.set(num, { title: numMatch[2].trim(), line: i + 1 });
      }
      continue;
    }

    // The label class here must stay identical to TABFIG_RE's below. A looser
    // class on either side desynchronizes the two: "[A-Za-z0-9]+" stops at a
    // dot, so heading "## Table 3.2" would key as "table:3" while citation
    // "Table 3.2" keys as "table:3.2", and a genuine reference to a heading
    // that exists would be reported dangling.
    const tfMatch = /^(Table|Figure|Appendix)\s+(\d+(?:\.\d+)*|[A-Z])\b/.exec(rest);
    if (tfMatch) {
      const key = (tfMatch[1] + ':' + tfMatch[2]).toLowerCase();
      if (!tabfig.has(key)) {
        tabfig.set(key, { line: i + 1 });
      }
    }
  }
  return { sections: sections, tabfig: tabfig };
}

function collectIdentifierDefs(text, set) {
  const re = /\*\*([A-Z]{1,4}-\d+(?:\.\d+)*)\*\*/g;
  let m;
  while ((m = re.exec(text))) {
    set.add(m[1]);
  }
}

function buildOwnSections(docs) {
  const merged = new Map();
  for (const d of docs) {
    for (const [num, info] of d.sections) {
      if (!merged.has(num)) {
        merged.set(num, { title: info.title, source: d.label });
      }
    }
  }
  return merged;
}

// Replaces excluded regions with equal-length whitespace (preserving
// newlines) so line numbers of surviving matches stay accurate against the
// original artifact text, and so no excluded region can be mistaken for a
// cross-reference by the passes below.
function maskExcluded(text) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  let out = text;
  out = out.replace(/\bVERSION:\s*v?\d+(?:\.\d+)*/gi, blank);
  out = out.replace(/`[^`\n]*`/g, blank);
  out = out.replace(/\[[^\]\n]*\]\([^)\n]*\)/g, blank);
  out = out.replace(/^[ \t]*#{1,6}[ \t].*$/gm, blank);
  return out;
}

function lineAt(text, idx) {
  let line = 1;
  for (let i = 0; i < idx; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

// Scans the masked artifact text for every recognized cross-reference form
// and resolves each against ctx's namespaces, in priority order so a single
// pointer (e.g. "method §6.1") is claimed once and never double-counted by
// a lower-priority pattern scanning the same characters.
function scanCitations(maskedText, ctx) {
  const claims = [];
  const findings = [];
  let candidateCount = 0;

  function isClaimed(start, end) {
    return claims.some(([s, e]) => start < e && end > s);
  }
  function claim(start, end) {
    claims.push([start, end]);
  }

  const DOC_RE = /([A-Za-z0-9_.\-\/]+\.md)\s*,?\s*§(\d+(?:\.\d+)*)(?:\s*\(([^)\n]+)\))?/g;
  let m;
  while ((m = DOC_RE.exec(maskedText))) {
    candidateCount++;
    const start = m.index;
    const end = start + m[0].length;
    if (isClaimed(start, end)) continue;
    claim(start, end);

    const filename = m[1];
    const num = m[2];
    const title = m[3] ? m[3].trim() : null;
    const line = lineAt(maskedText, start);
    const target = ctx.documentSetByBasename.get(basenameOf(filename));

    if (!target) {
      findings.push(mkFinding(
        ctx.artifactRelPath, line, 'dangling-document-reference', 'fail',
        `reference names document '${filename}', which is absent from options.document_set`
      ));
      continue;
    }
    const sec = target.sections.get(num);
    if (!sec) {
      findings.push(mkFinding(
        ctx.artifactRelPath, line, 'dangling-section-pointer', 'fail',
        `§${num} does not exist in ${target.label}`
      ));
      continue;
    }
    if (title && normTitle(title) !== normTitle(sec.title)) {
      findings.push(mkFinding(
        ctx.artifactRelPath, line, 'section-title-drift', 'warn',
        `cited title '${title}' for §${num} differs from the target heading '${sec.title}' in ${target.label}`
      ));
    }
  }

  const METHOD_RE = /\bmethod\s+§(\d+(?:\.\d+)*)(?:\s*\(([^)\n]+)\))?/g;
  while ((m = METHOD_RE.exec(maskedText))) {
    candidateCount++;
    const start = m.index;
    const end = start + m[0].length;
    if (isClaimed(start, end)) continue;
    claim(start, end);

    const num = m[1];
    const title = m[2] ? m[2].trim() : null;
    const line = lineAt(maskedText, start);
    const sec = ctx.methodSections.get(num);

    if (!sec) {
      findings.push(mkFinding(
        ctx.artifactRelPath, line, 'dangling-section-pointer', 'fail',
        `method §${num} does not exist in ${ctx.methodLabel}`
      ));
      continue;
    }
    if (title && normTitle(title) !== normTitle(sec.title)) {
      findings.push(mkFinding(
        ctx.artifactRelPath, line, 'section-title-drift', 'warn',
        `cited title '${title}' for method §${num} differs from the target heading '${sec.title}' in ${ctx.methodLabel}`
      ));
    }
  }

  // A bare integer after "see"/"section" is ordinary English far more often
  // than it is a section pointer ("we see 6 witnesses", "the section 12
  // employees"), so an unmarked integer is not treated as a citation at all.
  // A pointer is recognized only when it carries a § marker ("§4", "see §4")
  // or a dotted number, which prose does not produce ("see 6.2").
  const BARE_RE =
    /(?:§|\b(?:see|section)\s+§|\b(?:see|section)\s+(?=\d+\.\d))(\d+(?:\.\d+)*)(?:\s*\(([^)\n]+)\))?/gi;
  while ((m = BARE_RE.exec(maskedText))) {
    candidateCount++;
    const start = m.index;
    const end = start + m[0].length;
    if (isClaimed(start, end)) continue;
    claim(start, end);

    const num = m[1];
    const title = m[2] ? m[2].trim() : null;
    const line = lineAt(maskedText, start);
    const own = ctx.ownSections.get(num);

    if (own) {
      if (title && normTitle(title) !== normTitle(own.title)) {
        findings.push(mkFinding(
          ctx.artifactRelPath, line, 'section-title-drift', 'warn',
          `cited title '${title}' for §${num} differs from the target heading '${own.title}' in ${own.source}`
        ));
      }
      continue;
    }

    if (ctx.methodSections.has(num)) {
      findings.push(mkFinding(
        ctx.artifactRelPath, line, 'bare-section-pointer-collides', 'fail',
        `bare §${num} does not resolve in the project's own sections but exists in the method source; ` +
          `disambiguate as 'method §${num}'`
      ));
      continue;
    }

    findings.push(mkFinding(
      ctx.artifactRelPath, line, 'dangling-section-pointer', 'fail',
      `§${num} does not exist in the project's own sections or in the method source`
    ));
  }

  const IDENT_RE = /\b([A-Z]{1,4}-\d+(?:\.\d+)*)\b/g;
  while ((m = IDENT_RE.exec(maskedText))) {
    const token = m[1];
    // "PREFIX-N" is also the shape of ordinary technical prose: UTF-8,
    // SHA-256, GPT-4. Only a token whose prefix family is bold-defined
    // somewhere in the corpus is treated as a cross-cited identifier at all;
    // anything else is prose and is neither counted as a candidate nor
    // flagged. A token whose prefix IS in use but whose specific number is
    // undefined (AC-9.9 where **AC-9.5** exists) is still a genuine dangling
    // reference and still fails. Deciding which prefixes are *reserved* is a
    // different question, owned by the identifier-namespace check; this check
    // only ever asks whether a definition exists.
    const dash = token.indexOf('-');
    if (dash <= 0 || !ctx.definedPrefixes.has(token.slice(0, dash))) continue;
    candidateCount++;
    const line = lineAt(maskedText, m.index);
    if (!ctx.identifierDefs.has(token)) {
      findings.push(mkFinding(
        ctx.artifactRelPath, line, 'dangling-identifier-reference', 'fail',
        `identifier '${token}' is cited but not defined ('**${token}**') anywhere in the document set or method source`
      ));
    }
  }

  // Requires a numeric/dotted label or a single uppercase letter, so ordinary
  // prose ("Figure out the Table of contents before Appendix review") is not
  // read as three citations. Must stay identical to the heading scanner's
  // label class in parseHeadings.
  const TABFIG_RE = /\b(Table|Figure|Appendix)\s+(\d+(?:\.\d+)*|[A-Z])\b/g;
  while ((m = TABFIG_RE.exec(maskedText))) {
    candidateCount++;
    const kind = m[1];
    const label = m[2];
    const key = (kind + ':' + label).toLowerCase();
    const line = lineAt(maskedText, m.index);
    if (!ctx.tabfigDefs.has(key)) {
      findings.push(mkFinding(
        ctx.artifactRelPath, line, 'dangling-table-figure-reference', 'fail',
        `${kind} ${label} is cited but no matching heading exists in the document set or method source`
      ));
    }
  }

  return { findings: findings, candidateCount: candidateCount };
}

function readFileSyncRel(relPath) {
  return fs.readFileSync(resolveWithinRoot(relPath), 'utf8');
}

function execute(input) {
  const artifactPathOpt =
    input && typeof input === 'object' && typeof input.artifact_path === 'string'
      ? input.artifact_path
      : null;
  const options =
    input && typeof input === 'object' && input.options && typeof input.options === 'object'
      ? input.options
      : {};
  const documentSetOpt = Array.isArray(options.document_set)
    ? options.document_set.filter((x) => typeof x === 'string')
    : [];
  const methodSourceOpt = typeof options.method_source === 'string' ? options.method_source : null;

  if (!artifactPathOpt) {
    return skipped('unavailable');
  }

  let artifactRaw;
  try {
    artifactRaw = readFileSyncRel(artifactPathOpt);
  } catch (e) {
    return skippedForFailedRead(e, 'artifact_path');
  }

  const documentSetDocs = [];
  for (const docPath of documentSetOpt) {
    let raw;
    try {
      raw = readFileSyncRel(docPath);
    } catch (e) {
      return skippedForFailedRead(e, 'options.document_set');
    }
    const parsed = parseHeadings(raw);
    documentSetDocs.push({
      relPath: normalizePath(docPath),
      raw: raw,
      sections: parsed.sections,
      tabfig: parsed.tabfig
    });
  }

  let methodSections = new Map();
  let methodTabfig = new Map();
  let methodRelPath = null;
  let methodRaw = '';
  if (methodSourceOpt) {
    let raw;
    try {
      raw = readFileSyncRel(methodSourceOpt);
    } catch (e) {
      return skippedForFailedRead(e, 'options.method_source');
    }
    const parsed = parseHeadings(raw);
    methodSections = parsed.sections;
    methodTabfig = parsed.tabfig;
    methodRelPath = normalizePath(methodSourceOpt);
    methodRaw = raw;
  }

  const artifactRelPath = normalizePath(artifactPathOpt);
  const artifactParsed = parseHeadings(artifactRaw);

  const documentSetByBasename = new Map();
  for (const d of documentSetDocs) {
    documentSetByBasename.set(basenameOf(d.relPath), { label: d.relPath, sections: d.sections });
  }

  const ownDocs = [{ label: artifactRelPath, sections: artifactParsed.sections }].concat(
    documentSetDocs.map((d) => ({ label: d.relPath, sections: d.sections }))
  );
  const ownSections = buildOwnSections(ownDocs);

  const identifierDefs = new Set();
  collectIdentifierDefs(artifactRaw, identifierDefs);
  for (const d of documentSetDocs) collectIdentifierDefs(d.raw, identifierDefs);
  if (methodRaw) collectIdentifierDefs(methodRaw, identifierDefs);

  // The prefix families actually in use in this corpus. A "PREFIX-N" token
  // whose prefix is absent here is prose, not a citation (see IDENT_RE).
  const definedPrefixes = new Set();
  for (const tok of identifierDefs) {
    const dash = tok.indexOf('-');
    if (dash > 0) definedPrefixes.add(tok.slice(0, dash));
  }

  const tabfigDefs = new Set();
  for (const [k] of artifactParsed.tabfig) tabfigDefs.add(k);
  for (const d of documentSetDocs) {
    for (const [k] of d.tabfig) tabfigDefs.add(k);
  }
  for (const [k] of methodTabfig) tabfigDefs.add(k);

  const maskedText = maskExcluded(artifactRaw);

  const ctx = {
    artifactRelPath: artifactRelPath,
    documentSetByBasename: documentSetByBasename,
    ownSections: ownSections,
    methodSections: methodSections,
    methodLabel: methodRelPath || 'the method source',
    identifierDefs: identifierDefs,
    definedPrefixes: definedPrefixes,
    tabfigDefs: tabfigDefs
  };

  const scanned = scanCitations(maskedText, ctx);

  if (scanned.candidateCount === 0) {
    return {
      check: CHECK_SLUG,
      status: 'skipped',
      skipped_reason: 'not-applicable',
      verdict: null,
      findings: [],
      stated_limits: STATED_LIMITS,
      tool_versions: {}
    };
  }

  const findings = scanned.findings.slice().sort(findingComparator);

  const verdict = findings.some((f) => f.severity === 'fail')
    ? 'fail'
    : findings.some((f) => f.severity === 'warn')
      ? 'warn'
      : 'pass';

  return {
    check: CHECK_SLUG,
    status: 'ran',
    skipped_reason: null,
    verdict: verdict,
    findings: findings,
    stated_limits: STATED_LIMITS,
    tool_versions: {}
  };
}

module.exports = { manifest, execute };

if (require.main === module) {
  const arg = process.argv[2];
  // Exit via process.exitCode, never process.exit(): an immediate exit can
  // discard asynchronously buffered stdout when it is a pipe, truncating the
  // one JSON envelope a harness reads. Setting exitCode lets the process end
  // naturally after the stream drains.
  let raw = null;
  try {
    raw = (!arg || arg === '-') ? fs.readFileSync(0, 'utf8') : fs.readFileSync(arg, 'utf8');
  } catch (e) {
    process.stderr.write('cross-reference-integrity: unable to read input\n');
    process.exitCode = 3;
  }

  if (raw !== null) {
    let parsedInput;
    let parsed = false;
    try {
      parsedInput = JSON.parse(raw);
      parsed = true;
    } catch (e) {
      process.stderr.write('cross-reference-integrity: malformed JSON input\n');
      process.exitCode = 3;
    }

    if (parsed) {
      const output = execute(parsedInput);
      process.stdout.write(JSON.stringify(output, null, 2) + '\n');

      const EXIT_CODES = { pass: 0, warn: 10, fail: 20 };
      let exitCode = 30;
      if (output.status !== 'skipped') {
        exitCode = Object.prototype.hasOwnProperty.call(EXIT_CODES, output.verdict) ? EXIT_CODES[output.verdict] : 20;
      }
      process.exitCode = exitCode;
    }
  }
}

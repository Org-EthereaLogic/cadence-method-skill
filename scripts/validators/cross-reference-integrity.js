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
//   (section 2). A missing artifact_path, an unreadable artifact_path, or an
//   unreadable entry of options.document_set or options.method_source
//   produces "skipped: unavailable" (degrade closed).
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
    'build the resolution namespace, never scanned for their own outgoing references.'
];

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

function skipped(reason) {
  return {
    check: CHECK_SLUG,
    status: 'skipped',
    skipped_reason: reason,
    verdict: null,
    findings: [],
    stated_limits: STATED_LIMITS,
    tool_versions: {}
  };
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

    const tfMatch = /^(Table|Figure|Appendix)\s+([A-Za-z0-9]+)\b/.exec(rest);
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

  const BARE_RE = /(?:§|\b(?:see|section)\s+§?)(\d+(?:\.\d+)*)(?:\s*\(([^)\n]+)\))?/gi;
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
    candidateCount++;
    const token = m[1];
    const line = lineAt(maskedText, m.index);
    if (!ctx.identifierDefs.has(token)) {
      findings.push(mkFinding(
        ctx.artifactRelPath, line, 'dangling-identifier-reference', 'fail',
        `identifier '${token}' is cited but not defined ('**${token}**') anywhere in the document set or method source`
      ));
    }
  }

  const TABFIG_RE = /\b(Table|Figure|Appendix)\s+([A-Za-z0-9]+)\b/g;
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
  return fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
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
    return skipped('unavailable');
  }

  const documentSetDocs = [];
  for (const docPath of documentSetOpt) {
    let raw;
    try {
      raw = readFileSyncRel(docPath);
    } catch (e) {
      return skipped('unavailable');
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
      return skipped('unavailable');
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
  let raw;
  try {
    raw = (!arg || arg === '-') ? fs.readFileSync(0, 'utf8') : fs.readFileSync(arg, 'utf8');
  } catch (e) {
    process.stderr.write('cross-reference-integrity: unable to read input\n');
    process.exit(3);
  }

  let parsedInput;
  try {
    parsedInput = JSON.parse(raw);
  } catch (e) {
    process.stderr.write('cross-reference-integrity: malformed JSON input\n');
    process.exit(3);
  }

  const output = execute(parsedInput);
  process.stdout.write(JSON.stringify(output, null, 2) + '\n');

  const EXIT_CODES = { pass: 0, warn: 10, fail: 20 };
  let exitCode = 30;
  if (output.status !== 'skipped') {
    exitCode = Object.prototype.hasOwnProperty.call(EXIT_CODES, output.verdict) ? EXIT_CODES[output.verdict] : 20;
  }
  process.exit(exitCode);
}

// INPUT: one JSON object on standard input or as a file argument, matching
//   the common validator input envelope (docs/validator-spec-sheet.md
//   section 2), with this check's shape (section 4, "Link integrity"):
//     {
//       "check": "link-integrity",
//       "artifact_path": "cadence/candidate/solution-design.md",
//       "project_root": ".",
//       "options": {
//         "follow_anchors": true,
//         "external_schemes": ["http", "https"]
//       }
//     }
//   artifact_path and project_root are resolved relative to the current
//   working directory (the repository root), never relative to this script
//   or to the input file itself, exactly as every other check's
//   artifact_path is (section 2). A missing or unreadable artifact_path
//   produces "skipped: unavailable" (degrade closed).
//
//   Only "[text](path)" markdown link forms are links (section 4). A
//   backticked bare path in prose is repository-root-relative text and is
//   never resolved. A "[text](path)" form inside a fenced code block, or
//   inside an inline backticked span, is example text and is masked out of
//   scanning before links are collected, exactly the way this check's
//   sibling cross-reference-integrity.js masks the regions it does not own.
//
//   Every surviving link is classified in this order:
//     - an external target (its scheme, e.g. "https:", is in
//       options.external_schemes, default ["http", "https"]) is NEVER
//       fetched (NFR-3); it is enumerated as an unfetched target in
//       stated_limits and contributes nothing to the verdict (NFR-6);
//     - a target beginning with "/" is an absolute filesystem path,
//       classified as non-portable by that leading-slash FORM alone (the
//       host filesystem is never probed, which keeps the classification
//       deterministic) -> "warn";
//     - otherwise the target (optionally carrying a "#anchor" suffix) is a
//       relative link: the file part is resolved against artifact_path's
//       own directory. A missing target file -> "fail". A target that
//       resolves outside project_root -> "warn" (it works on this host and
//       is not portable). When options.follow_anchors is not explicitly
//       false and the link carries a "#anchor" (in-document when the file
//       part is empty, cross-file otherwise), the anchor is resolved
//       against the target file's own headings using GitHub-style heading
//       slugging; a heading absent from the target -> "fail".
//
//   An artifact with zero surviving "[text](path)" forms (after masking)
//   produces "skipped: not-applicable" (verdict null) -- distinct from an
//   all-external artifact, which still carries live link forms and is
//   therefore never "skipped: unavailable": that reason degrades closed and
//   would quarantine a wholly-external artifact on link style rather than
//   integrity (docs/validator-spec-sheet.md section 4, section 2).
//
// USAGE: node link-integrity.js <input.json|->
//   Reads the input envelope from the named file, or from standard input
//   when the argument is "-" or omitted. Prints the common output envelope
//   (section 2) as JSON to standard output. Exit codes: pass=0, warn=10,
//   fail=20, skipped=30 (either reason); exit 3 if the input itself could
//   not be read or parsed as JSON.
'use strict';

const fs = require('fs');
const path = require('path');

const CHECK_SLUG = 'link-integrity';

const manifest = {
  check: CHECK_SLUG,
  description:
    'Link integrity: resolves every intra-repo relative-file link and ' +
    'in-document or cross-file anchor in a governed artifact against the ' +
    'working tree, and fails a link whose target file or heading does not ' +
    'exist (method §6.1, AC-9.2, SC-2). External http(s) URLs are never ' +
    'fetched (NFR-3); each is enumerated as a per-link unfetched target and ' +
    'never contributes to the verdict (NFR-6).',
  verdicts: ['pass', 'warn', 'fail'],
  skip_reasons: ['not-applicable', 'unavailable'],
  exit_codes: { pass: 0, warn: 10, fail: 20, skipped: 30 },
  finding_codes: [
    'dangling-link-target',
    'dangling-anchor',
    'absolute-path-link',
    'link-target-outside-project-root'
  ]
};

const BASE_STATED_LIMITS = [
  'Only "[text](path)" markdown link forms are resolved; a backticked bare ' +
    'path in prose is repository-root-relative text, not a link, and is ' +
    'never scanned (CONTRIBUTING.md convention).',
  'A "[text](path)" form inside a fenced code block, or inside an inline ' +
    'backticked span, is example text, not a live link, and is excluded ' +
    'from link scanning.',
  'An absolute filesystem-path link is classified as non-portable by its ' +
    'leading "/" form alone; the host filesystem is never probed, so the ' +
    'classification stays deterministic.',
  'External http(s) targets (per options.external_schemes) are never ' +
    'fetched (NFR-3); each is enumerated below as an unfetched target and ' +
    "contributes nothing to the verdict (NFR-6). A pass verdict never " +
    'claims an external link resolves.',
  "An in-document or cross-file anchor is resolved against the target " +
    "file's own headings using GitHub-style heading slugging; the target " +
    "file's content beyond its heading structure is not otherwise examined."
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
    stated_limits: BASE_STATED_LIMITS,
    tool_versions: {}
  };
}

function readFileSyncRel(relPath) {
  return fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
}

// GitHub-style heading slug: lowercase, strip punctuation other than word
// characters/hyphen/space, collapse whitespace runs to a single hyphen.
function slugifyHeading(text) {
  let s = String(text).trim().toLowerCase();
  s = s.replace(/[`*_]/g, '');
  s = s.replace(/[^\w\- ]+/g, '');
  s = s.replace(/\s+/g, '-');
  return s;
}

// Parses a document's markdown headings into a slug -> { line, title } map.
// The heading map is built from MASKED text (fenced blocks and inline code
// spans blanked first) so a heading-shaped line that lives only inside a
// fenced code block is NOT a real anchor. Duplicate headings are
// disambiguated GitHub-style: the first occurrence of a base slug owns the
// base ("details"), and each subsequent occurrence appends an incrementing
// suffix ("details-1", "details-2", ...). The base slug's first-occurrence
// ownership is preserved.
function parseHeadingSlugs(text) {
  const masked = maskInlineCode(maskFencedBlocks(text));
  const lines = masked.split(/\r?\n/);
  const slugs = new Map();
  const baseSeen = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = /^#{1,6}\s+(.*)$/.exec(lines[i]);
    if (!m) continue;
    const title = m[1].trim();
    const base = slugifyHeading(title);
    const count = baseSeen.get(base) || 0;
    const slug = count === 0 ? base : base + '-' + count;
    baseSeen.set(base, count + 1);
    if (!slugs.has(slug)) {
      slugs.set(slug, { line: i + 1, title: title });
    }
  }
  return slugs;
}

// Replaces every fenced code block with equal-length blanks (newlines
// preserved) so a "[text](path)" example inside one is never scanned as a
// live link, and so surviving matches keep accurate line numbers -- the
// same discipline cross-reference-integrity.js's maskExcluded uses for the
// regions it owns. Per CommonMark a fence opens with a run of at least three
// backticks OR at least three tildes (indented up to three spaces) and
// closes with a run of the SAME character at least as long as the opening
// run, followed only by trailing whitespace. A backtick fence's info string
// may not contain a backtick (CommonMark), so an inline code span in prose
// is never mistaken for a fence opener. An unclosed fence extends to end of
// document. Both fence characters are masked (a "~~~" tilde fence is a live
// code block exactly like a "```" fence).
function maskFencedBlocks(text) {
  const lines = text.split('\n');
  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inFence) {
      const open = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
      // A backtick fence's info string may not contain a backtick.
      if (open && !(open[1][0] === '`' && open[2].indexOf('`') !== -1)) {
        inFence = true;
        fenceChar = open[1][0];
        fenceLen = open[1].length;
        lines[i] = line.replace(/[^\n]/g, ' ');
      }
    } else {
      // Neither "`" nor "~" is a regex metacharacter, so no escaping needed.
      const closeRe = new RegExp('^ {0,3}' + fenceChar + '{' + fenceLen + ',}[ \\t]*$');
      const closes = closeRe.test(line);
      lines[i] = line.replace(/[^\n]/g, ' ');
      if (closes) {
        inFence = false;
        fenceChar = '';
        fenceLen = 0;
      }
    }
  }
  return lines.join('\n');
}

// Replaces every inline code span with equal-length blanks, after fenced
// blocks are already masked, so a backticked bare path is never mistaken for
// a live link. Per CommonMark an inline code span opens with a run of N
// backticks (N >= 1) and closes with the next run of EXACTLY N backticks, so
// a link inside a "``...``" span (or any longer run) is fully masked, not
// left exposed the way a single-backtick-only pattern would leave it. The
// opening run must not be preceded by a backtick and the closing run must
// not be followed by one, so partial runs are never mismatched; the lazy
// body finds the nearest equal-length closing run. An unclosed run is left
// literal (not a code span), matching CommonMark.
function maskInlineCode(text) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return text.replace(/(?<!`)(`+)[\s\S]*?\1(?!`)/g, blank);
}

function lineAt(text, idx) {
  let line = 1;
  for (let i = 0; i < idx; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

const LINK_RE = /\[([^\]\n]*)\]\(([^)\n]*)\)/g;

function isExternal(target, schemes) {
  if (!schemes.length) return false;
  const escaped = schemes.map((s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp('^(' + escaped.join('|') + '):', 'i');
  return re.test(target);
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
  const projectRootOpt =
    input && typeof input === 'object' && typeof input.project_root === 'string'
      ? input.project_root
      : '.';
  const followAnchors = options.follow_anchors !== false;
  const externalSchemesOpt =
    Array.isArray(options.external_schemes) && options.external_schemes.length
      ? options.external_schemes.filter((s) => typeof s === 'string')
      : ['http', 'https'];

  if (!artifactPathOpt) {
    return skipped('unavailable');
  }

  let artifactRaw;
  try {
    artifactRaw = readFileSyncRel(artifactPathOpt);
  } catch (e) {
    return skipped('unavailable');
  }

  const artifactRelPath = normalizePath(artifactPathOpt);
  const artifactDir = path.posix.dirname(artifactRelPath);
  const projectRootRel = normalizePath(projectRootOpt) || '.';

  const maskedText = maskInlineCode(maskFencedBlocks(artifactRaw));

  const headingCache = new Map();
  headingCache.set(artifactRelPath, parseHeadingSlugs(artifactRaw));

  function headingsFor(relPath) {
    if (!headingCache.has(relPath)) {
      let raw;
      try {
        raw = readFileSyncRel(relPath);
      } catch (e) {
        raw = null;
      }
      headingCache.set(relPath, raw !== null ? parseHeadingSlugs(raw) : new Map());
    }
    return headingCache.get(relPath);
  }

  const findings = [];
  const externalTargets = [];

  let matchCount = 0;
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(maskedText))) {
    matchCount++;
    const linkText = m[1];
    const rawTarget = m[2].trim();
    const line = lineAt(maskedText, m.index);

    if (rawTarget === '') {
      findings.push(mkFinding(
        artifactRelPath, line, 'dangling-link-target', 'fail',
        `link '[${linkText}]()' names no target`
      ));
      continue;
    }

    if (isExternal(rawTarget, externalSchemesOpt)) {
      externalTargets.push({ target: rawTarget, line: line });
      continue;
    }

    if (rawTarget.startsWith('/')) {
      findings.push(mkFinding(
        artifactRelPath, line, 'absolute-path-link', 'warn',
        `link '[${linkText}](${rawTarget})' uses an absolute filesystem path and is not portable`
      ));
      continue;
    }

    const hashIdx = rawTarget.indexOf('#');
    const filePart = hashIdx === -1 ? rawTarget : rawTarget.slice(0, hashIdx);
    const anchorPart = hashIdx === -1 ? null : rawTarget.slice(hashIdx + 1);

    let targetRelPath;
    if (filePart === '') {
      targetRelPath = artifactRelPath;
    } else {
      targetRelPath = normalizePath(path.posix.normalize(path.posix.join(artifactDir, filePart)));

      let exists;
      try {
        exists = fs.existsSync(path.resolve(process.cwd(), targetRelPath));
      } catch (e) {
        exists = false;
      }
      if (!exists) {
        findings.push(mkFinding(
          artifactRelPath, line, 'dangling-link-target', 'fail',
          `link '[${linkText}](${rawTarget})' points at '${targetRelPath}', which does not exist`
        ));
        continue;
      }

      // Outside-root is a parent-directory ESCAPE, tested by path segment,
      // not string prefix: an in-root file whose NAME merely begins with two
      // dots (e.g. "..notes.md") relativizes to "..notes.md", which is not an
      // escape. Only relToRoot === ".." or a "../" segment prefix escapes.
      const relToRoot = path.posix.relative(projectRootRel, targetRelPath);
      if (relToRoot === '..' || relToRoot.startsWith('../')) {
        findings.push(mkFinding(
          artifactRelPath, line, 'link-target-outside-project-root', 'warn',
          `link '[${linkText}](${rawTarget})' resolves to '${targetRelPath}', which is outside project_root '${projectRootRel}'`
        ));
        continue;
      }
    }

    if (anchorPart !== null && followAnchors) {
      const slugs = headingsFor(targetRelPath);
      const anchorSlug = slugifyHeading(anchorPart);
      if (!slugs.has(anchorSlug)) {
        findings.push(mkFinding(
          artifactRelPath, line, 'dangling-anchor', 'fail',
          `link '[${linkText}](${rawTarget})' names anchor '#${anchorPart}', which does not match any heading in '${targetRelPath}'`
        ));
      }
    }
  }

  if (matchCount === 0) {
    return {
      check: CHECK_SLUG,
      status: 'skipped',
      skipped_reason: 'not-applicable',
      verdict: null,
      findings: [],
      stated_limits: BASE_STATED_LIMITS,
      tool_versions: {}
    };
  }

  const sortedFindings = findings.slice().sort(findingComparator);

  externalTargets.sort((a, b) => (a.line - b.line) || cmpStr(a.target, b.target));
  const dynamicLimits = externalTargets.map(
    (et) =>
      `external target '${et.target}' (${artifactRelPath}:${et.line}) was not fetched (NFR-3); ` +
      'its resolution is not claimed by this verdict.'
  );

  const statedLimits = BASE_STATED_LIMITS.concat(dynamicLimits);

  const verdict = sortedFindings.some((f) => f.severity === 'fail')
    ? 'fail'
    : sortedFindings.some((f) => f.severity === 'warn')
      ? 'warn'
      : 'pass';

  return {
    check: CHECK_SLUG,
    status: 'ran',
    skipped_reason: null,
    verdict: verdict,
    findings: sortedFindings,
    stated_limits: statedLimits,
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
    process.stderr.write('link-integrity: unable to read input\n');
    process.exit(3);
  }

  let parsedInput;
  try {
    parsedInput = JSON.parse(raw);
  } catch (e) {
    process.stderr.write('link-integrity: malformed JSON input\n');
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

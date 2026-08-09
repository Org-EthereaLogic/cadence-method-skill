// INPUT: one JSON object on standard input or as a file argument, matching
//   the common validator input envelope (docs/validator-spec-sheet.md
//   section 2), with this check's shape (section 4, "Evidence-tag grammar"):
//     {
//       "check": "evidence-tag-grammar",
//       "artifact_path": "cadence/draft/discovery-record.md",
//       "boundary": "draft-to-candidate",
//       "references": { "evidence_classes": "cadence/references/evidence-classes.md" },
//       "options": {
//         "require_tags": true,
//         "excluded_regions": ["fenced", "appendix-a-reproduction"]
//       }
//     }
//   artifact_path and references.evidence_classes are resolved relative to
//   the current working directory (the repository root), never relative to
//   this script or to the input file itself, exactly as every other check's
//   artifact_path is (section 2), and BOTH are CONSTRAINED to the
//   repository root: a resolved path that escapes the root (an absolute
//   path, or a "../" traversal) is refused unread and degrades the run
//   closed to "skipped: unavailable", carrying its OWN stated_limits
//   sentence naming the field that was refused -- a refusal and an
//   unreadable file are different facts, and an envelope that cannot tell
//   them apart cannot be used to prove the root constraint fired.
//   artifact_path is resolved first; only once it reads successfully is
//   references.evidence_classes resolved.
//
// THE CLOSED SET, AND THE TAG SURFACE IT DEFINES
//   The eleven-class closed set is READ from references.evidence_classes --
//   never a hardcoded list (FR-9, AC-12.3). The reference's "## Appendix A"
//   markdown table is parsed row by row; each row's italicized `Class` cell
//   IS the tag, spelled the way a governed artifact spells it:
//
//     *(brief)*
//     *(interview record, Speaker M/DD)*
//     *(vendor documentation, verified YYYY-MM-DD)*
//     *(operator-substantiated, Employer)*
//     *(engagement record, key YYYY-MM-DD)*
//     *(operator instruction, YYYY-MM-DD)*
//
//   The text before the cell's first comma is the class HEAD; each
//   comma-separated part after it is one required PARAMETER SEGMENT, and
//   that segment's own words are the required SURFACE. No parameter label
//   grammar is invented here: a tag satisfies its class when every word of
//   the declared segment is accounted for -- and a date template counts
//   only when a REAL date of that form fills it in:
//
//     - a word the reference itself DECLARES as a parameter name -- one
//       written in backticks in the reference's own prose AND appearing in
//       a class cell's parameter segment ("Speaker", "Employer", "key" in
//       method Appendix A) -- is a VALUE SLOT: the tag supplies a value in
//       its place (or repeats the name and then the value);
//     - a word shaped like a date TEMPLATE ("YYYY-MM-DD", "M/DD") is
//       matched by a date of exactly that form;
//     - EVERY OTHER word ("verified", "retrieved", "screenshot-evidenced",
//       "observed", or any word a project-amended row introduces) is a
//       LITERAL the tag must carry. That default is what makes the
//       amendment path fail CLOSED: a project-added class whose declared
//       parameter this parse cannot otherwise interpret is still required,
//       never silently dropped (AC-12.3).
//
//   So "(vendor documentation, verified 2026-01-10)",
//   "(interview record, Jordan Alvarez 3/15)",
//   "(interview record, Speaker Jordan Alvarez 3/15)",
//   "(operator-substantiated, Acme Robotics)",
//   "(engagement record, ENG-2024-003 2024-03-01)" and
//   "(operator instruction, 2026-01-15)" all satisfy their classes. A cell
//   copied out of the reference with its template UNFILLED
//   ("verified YYYY-MM-DD" as literal text) does NOT: Appendix A requires
//   the date, and an unfilled template token is not one.
//   A missing segment or an unaccounted-for declared word is
//   "tag-parameter-missing"; a date present in the wrong form is
//   "tag-parameter-malformed". A head the reference does not declare is
//   "class-outside-closed-set". A reference that cannot be read, or whose
//   Appendix A table yields no class rows, produces "skipped: unavailable"
//   -- the closed set must be read; guessing it would silently widen a
//   class (AC-12.3).
//
// WHAT A CLAIM IS
//   The claim unit is the logical paragraph, not the physical line: a
//   maximal run of consecutive claim-bearing prose lines (headings, table
//   rows, horizontal rules, bare list markers and bare markdown-link lines
//   end a run and are never scanned; fenced code blocks and same-line
//   inline code spans are masked first). A hard-wrapped paragraph whose
//   closing line carries the tag is therefore ONE tagged claim, not one
//   tagged line and several untagged ones. Within a paragraph each tag
//   closes the claim that precedes it, so a paragraph may carry several
//   tagged claims; substantive text left after the last tag is an untagged
//   claim, and two tags with no claim text between them are one claim
//   carrying two classes (Appendix A: exactly one, or the claim is cut).
//
// EXCLUDED REGIONS
//   options.excluded_regions names region kinds this run treats as NOT live
//   claim text. "appendix-a-reproduction" is the artifact's own VERBATIM
//   reproduction of Appendix A, and it is detected as one: the region is
//   recognised only when every class row of the SUPPLIED reference appears
//   in the artifact verbatim, and it is then scoped to the reproduced block
//   itself. A heading that merely mentions Appendix A excludes nothing --
//   a heading must never be able to silence claim scanning. The excluded
//   span is enumerated in stated_limits (FR-17) and contributes no
//   findings. "fenced" additionally scans the RAW content of every fenced
//   code block for a parenthetical that PLAUSIBLY attempts an evidence tag
//   -- its head matches a declared class, or is within a small edit
//   distance of one -- and reports a malformed or out-of-set one as
//   "malformed-tag-in-excluded-region" at "warn" severity: the region is
//   documentation, not a claim, so it never fails, and the warn is what
//   makes the exclusion visible instead of a silent drop. An ordinary code
//   parenthetical (a typed signature, a markdown link's URL) is not a tag
//   and is never reported, and no raw fenced text is ever copied into the
//   output envelope. Fenced code and inline code spans are ALWAYS masked
//   out of ordinary claim scanning regardless of this option; the option
//   controls only whether their content is additionally scanned for a
//   documentation-example warn and enumerated in stated_limits.
//
//   options.require_tags is true at a promotion boundary and false for a
//   Draft-zone advisory run (method section 6.2 rule 3 as a parameter, not
//   a second script): false downgrades every claim-scan finding's severity
//   to "warn" (the excluded-region warn is already "warn" and is
//   unaffected).
//
//   An artifact with no claim-bearing prose paragraph, and nothing found in
//   an excluded region either, produces "skipped: not-applicable".
//
// USAGE: node evidence-tag-grammar.js <input.json|->
//   Reads the input envelope from the named file, or from standard input
//   when the argument is "-" or omitted. Prints the common output envelope
//   (section 2) as JSON to standard output. Exit codes: pass=0, warn=10,
//   fail=20, skipped=30 (either reason); exit 3 if the input itself could
//   not be read or parsed as JSON.
'use strict';

const fs = require('fs');
const path = require('path');

const CHECK_SLUG = 'evidence-tag-grammar';

const manifest = {
  check: CHECK_SLUG,
  description:
    'Evidence-tag grammar: enforces the Appendix A closed set of evidence-' +
    'tag classes on the claims in a governed artifact, reading the set ' +
    "from the project's seeded evidence-classes.md reference rather than " +
    'a hardcoded list (FR-9, AC-9.1, AC-9.2, AC-12.3, method section 3.3, ' +
    'section 6.2 rule 3).',
  verdicts: ['pass', 'warn', 'fail'],
  skip_reasons: ['not-applicable', 'unavailable'],
  exit_codes: { pass: 0, warn: 10, fail: 20, skipped: 30 },
  finding_codes: [
    'claim-untagged',
    'claim-carries-multiple-classes',
    'class-outside-closed-set',
    'tag-parameter-missing',
    'tag-parameter-malformed',
    'malformed-tag-in-excluded-region'
  ]
};

const BASE_STATED_LIMITS = [
  'The closed set is parsed from the "## Appendix A" table in the ' +
    'reference named by references.evidence_classes; no class list is ' +
    'hardcoded in this script, so a project-amended reference is honored ' +
    'as-is (FR-9, AC-12.3).',
  "A class's required parameter SURFACE is derived from its own row: the " +
    'text before the first comma is the head, and each comma-separated ' +
    'part after it is a required segment whose words must all be ' +
    'accounted for. A word the reference declares as a parameter name (in ' +
    'backticks in its prose and present in a class cell) stands for a ' +
    'supplied value; a word shaped like a date template is matched by a ' +
    'date of that form; every other word -- including one a project ' +
    'amendment introduces -- is required literally. That default is a ' +
    'deliberate FAIL-CLOSED: an amended row whose parameter this parse ' +
    'cannot otherwise interpret is still enforced rather than dropped, at ' +
    'the cost of rejecting a tag that paraphrases it. A date template is ' +
    'satisfied only by a real date of the declared form -- a tag carrying ' +
    'the unfilled template text ("verified YYYY-MM-DD") is malformed, ' +
    'because Appendix A requires the date and unfilled template text is not one.',
  'The claim unit is the logical paragraph: a maximal run of consecutive ' +
    'claim-bearing prose lines, so a hard-wrapped paragraph whose closing ' +
    'line carries the tag is one tagged claim. Within a paragraph each tag ' +
    'closes the claim before it. Two distinct claims written as one ' +
    'paragraph with a single trailing tag are therefore counted as one ' +
    'tagged claim and are not reported -- an under-report this check ' +
    'accepts in exchange for not failing ordinary hard-wrapped Markdown.',
  'A "(...)" group is read as a tag only where it plausibly ATTEMPTS one: ' +
    'its head matches a declared class, is within edit distance 2 of one, ' +
    'or it closes a claim with a parameter segment that carries a declared ' +
    'parameter surface -- a word some declared row spells (a literal like ' +
    '"verified" or a parameter name like "Speaker"), or a date in a ' +
    'declared date form. An ordinary parenthetical aside -- "(see Appendix ' +
    'B, page 4)" -- carries none of those and is therefore not reported as ' +
    'an out-of-set class; but a claim whose only trailing parenthetical is ' +
    'such an aside is still reported as untagged, and an aside whose text ' +
    'happens to reuse a declared parameter word or date form is still read ' +
    'as an attempted tag -- an over-report accepted so that a wholly ' +
    'out-of-set class attempt spelled with real tag parameters cannot ' +
    'evade the closed set by its head alone.',
  'Fenced code blocks and inline backticked code spans are always masked ' +
    'out of ordinary claim scanning before tags are collected. That ' +
    'inline-span masking is bounded to one line: a span is recognised only ' +
    'where it opens and closes on the SAME line, because a span pattern ' +
    'free to cross a line break lets one unpaired backtick in prose pair ' +
    'with a backtick many lines later and blank every line between them, ' +
    'silently deleting the text this check scans and reporting the ' +
    'resulting emptiness as a pass. The cost is the opposite, visible ' +
    'error: a genuinely multi-line code span is no longer masked, so a ' +
    'tag written inside it is read as a live claim tag and may be ' +
    'over-reported.',
  'options.require_tags === false downgrades every claim-scan finding to ' +
    '"warn" for a Draft-zone advisory run (method section 6.2 rule 3 as a ' +
    'parameter, not a second script); the excluded-region ' +
    'malformed-tag-in-excluded-region finding is already "warn" and is ' +
    'unaffected by this option.',
  "The artifact's own VERBATIM Appendix A reproduction, when named in " +
    'options.excluded_regions, is blanked from claim scanning and ' +
    'contributes no findings -- it is documentation, not a claim -- and ' +
    'the excluded span is enumerated below rather than silently dropped ' +
    '(FR-17). The region is recognised only when every class row of the ' +
    'supplied reference is present in the artifact verbatim, and is then ' +
    'scoped to the reproduced block; a heading that merely mentions ' +
    'Appendix A excludes nothing, because a heading must not be able to ' +
    'silence claim scanning. A partial or paraphrased reproduction is ' +
    'consequently scanned as live claim text.',
  'A fenced code block, when "fenced" is named in ' +
    'options.excluded_regions, is additionally scanned for a ' +
    'documentation-example tag -- a parenthetical whose head matches a ' +
    'declared class or is within edit distance 2 of one -- and a ' +
    'malformed or out-of-set one is reported as a "warn" rather than a ' +
    '"fail" or a silent drop, which is what makes the exclusion visible. ' +
    'Nothing else inside a fence is examined, and no raw fenced text is ' +
    'copied into this envelope: a finding names only the declared class ' +
    'it resembles, because fenced content is untrusted input and may ' +
    'contain anything.',
  'Every path in the input envelope -- artifact_path, then, once it reads ' +
    'successfully, references.evidence_classes -- is resolved beneath the ' +
    'repository root and refused unread when it escapes it, so an ' +
    'absolute path or a "../" traversal degrades the run closed to ' +
    'skipped: unavailable rather than reading a file outside the ' +
    'checkout; the containment test also resolves symbolic links: ' +
    'fs.realpathSync is applied to both the target and the repository ' +
    'root before the same containment test is re-applied, so a symbolic ' +
    'link that lives inside the checkout and resolves outside it is ' +
    'refused too, before it is read; a dangling symlink -- one whose ' +
    'target does not exist -- is not a refusal and is reported as the ' +
    'ordinary missing-file outcome instead.'
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
    stated_limits: statedLimits || BASE_STATED_LIMITS,
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

function readFileSyncRel(relPath) {
  return fs.readFileSync(resolveWithinRoot(relPath), 'utf8');
}

// Degrades a failed read closed, adding the refusal sentence only when the
// root constraint actually fired. `field` names the envelope field (or a
// description of the resolved value) that carried the path, never the path
// itself.
function skippedForFailedRead(err, field) {
  if (err && err.pathEscapesRoot) {
    return skipped('unavailable', BASE_STATED_LIMITS.concat([pathRefusedSentence(field)]));
  }
  return skipped('unavailable');
}

// Replaces every fenced code block with equal-length blanks (newlines
// preserved) so a claim tag written inside one is never scanned as a live
// tag, and so surviving matches keep accurate line numbers -- the same
// discipline link-integrity.js's maskFencedBlocks uses. Per CommonMark a
// fence opens with a run of at least three backticks OR at least three
// tildes (indented up to three spaces) and closes with a run of the SAME
// character at least as long as the opening run, followed only by trailing
// whitespace. A backtick fence's info string may not contain a backtick
// (CommonMark), so an inline code span in prose is never mistaken for a
// fence opener. An unclosed fence extends to end of document. Both fence
// characters are masked (a "~~~" tilde fence is a live code block exactly
// like a "```" fence).
function maskFencedBlocks(text) {
  const lines = text.split('\n');
  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bare = line.replace(/\r$/, '');
    if (!inFence) {
      const open = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(bare);
      if (open && !(open[1][0] === '`' && open[2].indexOf('`') !== -1)) {
        inFence = true;
        fenceChar = open[1][0];
        fenceLen = open[1].length;
        lines[i] = line.replace(/[^\n]/g, ' ');
      }
    } else {
      const closeRe = new RegExp('^ {0,3}' + fenceChar + '{' + fenceLen + ',}[ \\t]*$');
      const closes = closeRe.test(bare);
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

// The same fence-tracking scan as maskFencedBlocks, but returning the set of
// 1-indexed line numbers that lie inside a fence (delimiter lines included)
// instead of blanking them, so the "fenced" excluded-region scan can read
// their RAW content rather than the blanks the ordinary claim scan sees.
function fencedLineNumbers(text) {
  const lines = text.split('\n');
  const result = new Set();
  let inFence = false;
  let fenceChar = '';
  let fenceLen = 0;
  for (let i = 0; i < lines.length; i++) {
    const bare = lines[i].replace(/\r$/, '');
    if (!inFence) {
      const open = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(bare);
      if (open && !(open[1][0] === '`' && open[2].indexOf('`') !== -1)) {
        inFence = true;
        fenceChar = open[1][0];
        fenceLen = open[1].length;
        result.add(i + 1);
        continue;
      }
    } else {
      result.add(i + 1);
      const closeRe = new RegExp('^ {0,3}' + fenceChar + '{' + fenceLen + ',}[ \\t]*$');
      if (closeRe.test(bare)) {
        inFence = false;
        fenceChar = '';
        fenceLen = 0;
      }
    }
  }
  return result;
}

// One BALANCED inline code span that opens and closes on the SAME line. See
// maskFencedBlocks's sibling comment in link-integrity.js for the rationale:
// bounding the span to a single line trades an invisible false pass for a
// visible over-report.
const INLINE_CODE_SPAN_RE = /(?<!`)(`+)[^\n]*?\1(?!`)/g;

function maskInlineCode(text) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return text.replace(INLINE_CODE_SPAN_RE, blank);
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function normSpace(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}

function normHead(s) {
  return normSpace(String(s).replace(/^[*_]+/, '').replace(/[*_]+$/, '')).toLowerCase();
}

function tokenize(s) {
  const t = normSpace(s);
  return t ? t.split(' ') : [];
}

function stripEdgePunct(t) {
  return String(t).replace(/^[^0-9A-Za-z]+/, '').replace(/[^0-9A-Za-z]+$/, '');
}

// Levenshtein distance, bounded by `max` so a long unrelated string is
// rejected cheaply. Used only to decide whether a token inside an EXCLUDED
// region plausibly attempts a class name -- never to accept a class.
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1);
    cur[0] = i;
    let best = cur[0];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

// ---------------------------------------------------------------------------
// The closed set, read from the supplied reference
// ---------------------------------------------------------------------------

// Strips a class cell's markdown emphasis and outer parentheses, returning
// the tag LABEL exactly as the reference spells it, e.g.
// "interview record, Speaker M/DD".
function parseClassCell(cell) {
  let s = cell.trim();
  s = s.replace(/^\*+/, '').replace(/\*+$/, '').trim();
  const m = /^\(([\s\S]*)\)$/.exec(s);
  if (!m) return null;
  return m[1].trim();
}

// Compiles a declared word that is shaped like a DATE TEMPLATE ("YYYY-MM-DD",
// "M/DD") into the regular expression a real date of that form must match.
// Returns null for any word that is not such a template -- shape only, no
// vocabulary: the letter runs must be runs of Y, M or D, and at least one
// separator must be present.
function compileDateTemplate(token) {
  if (!/[\/\-.]/.test(token)) return null;
  const parts = token.split(/([\/\-.])/);
  let src = '^';
  let sawField = false;
  for (const part of parts) {
    if (part === '/' || part === '-' || part === '.') {
      src += '\\' + part;
      continue;
    }
    if (!/^(Y+|M+|D+)$/.test(part)) return null;
    sawField = true;
    src += part.length > 1
      ? '\\d{' + part.length + '}'
      : '\\d{1,' + (part[0] === 'Y' ? 4 : 2) + '}';
  }
  if (!sawField) return null;
  return new RegExp(src + '$');
}

// The parameter NAMES the supplied reference DECLARES for itself: a token
// written in backticks in its prose that also appears as a word inside some
// class cell's parameter segment (`Speaker`, `Employer`, `key` in method
// Appendix A). Such a name marks a value slot the tag fills in. Every other
// word in a segment is a literal the tag must carry -- so an amended row
// whose parameter this file has never heard of is enforced, not dropped.
function collectDeclaredParamNames(referenceText, labels) {
  const segmentWords = new Set();
  for (const label of labels) {
    const commaIdx = label.indexOf(',');
    if (commaIdx === -1) continue;
    for (const tok of tokenize(label.slice(commaIdx + 1))) {
      const w = stripEdgePunct(tok);
      if (w) segmentWords.add(w);
    }
  }
  const names = new Set();
  const re = /`([^`\n]+)`/g;
  let m;
  while ((m = re.exec(referenceText))) {
    const token = m[1].trim();
    if (segmentWords.has(token)) names.add(token);
  }
  return names;
}

function classifyDeclaredToken(token, declaredNames) {
  const bare = stripEdgePunct(token) || token;
  if (declaredNames.has(bare)) return { text: bare, role: 'slot' };
  const dateRe = compileDateTemplate(bare);
  if (dateRe) return { text: bare, role: 'date', re: dateRe };
  return { text: bare, role: 'literal' };
}

function buildClassDescriptor(label, declaredNames) {
  const commaIdx = label.indexOf(',');
  const head = (commaIdx === -1 ? label : label.slice(0, commaIdx)).trim();
  const segments = commaIdx === -1
    ? []
    : label.slice(commaIdx + 1).split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  const params = segments.map((seg) => ({
    declared: seg,
    tokens: tokenize(seg).map((t) => classifyDeclaredToken(t, declaredNames))
  }));
  return { label: label, head: head, headKey: normHead(head), params: params };
}

function parseClosedSet(referenceText) {
  const lines = referenceText.split('\n');
  let tableStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/Appendix A/i.test(lines[i])) {
      tableStart = i;
      break;
    }
  }
  if (tableStart === -1) return [];
  const labels = [];
  const rows = [];
  let sawTableRow = false;
  for (let i = tableStart; i < lines.length; i++) {
    const line = lines[i];
    if (!/^\s*\|/.test(line)) {
      if (sawTableRow) break;
      continue;
    }
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 4) continue;
    const classCell = cells[2];
    if (/^Class$/i.test(classCell) || /^:?-+:?$/.test(classCell)) {
      sawTableRow = true;
      continue;
    }
    const label = parseClassCell(classCell);
    if (label) {
      labels.push(label);
      rows.push(line.trim());
      sawTableRow = true;
    }
  }
  if (!labels.length) return [];
  const declaredNames = collectDeclaredParamNames(referenceText, labels);
  const classes = labels.map((label) => buildClassDescriptor(label, declaredNames));
  classes.declaredParamNames = declaredNames;
  classes.rows = rows;
  classes.paramSurface = buildParamSurface(classes);
  return classes;
}

// The declared parameter SURFACE of the whole closed set: every word some
// declared row spells inside a parameter segment (literals like "verified"
// and parameter names like "Speaker", lowercased) plus the compiled regular
// expression of every declared date template. Used only to decide whether an
// unmatched-head parenthetical plausibly ATTEMPTS a tag -- never to accept
// one -- so an ordinary aside ("see Appendix B, page 4") that carries none
// of this surface produces no finding at all.
function buildParamSurface(classes) {
  const words = new Set();
  const dateRes = [];
  for (const c of classes) {
    for (const p of c.params) {
      for (const t of p.tokens) {
        if (t.role === 'date') dateRes.push(t.re);
        else words.add(t.text.toLowerCase());
      }
    }
  }
  return { words: words, dateRes: dateRes };
}

// True when a parenthetical's parameter segments carry at least one token
// from the declared parameter surface -- the structural signal that its
// author was WRITING A TAG rather than an ordinary aside.
function carriesDeclaredParamSurface(inner, surface) {
  const commaIdx = inner.indexOf(',');
  if (commaIdx === -1 || !surface) return false;
  for (const tok of tokenize(inner.slice(commaIdx + 1))) {
    const bare = stripEdgePunct(tok);
    if (!bare) continue;
    if (surface.words.has(bare.toLowerCase())) return true;
    for (const re of surface.dateRes) {
      if (re.test(bare)) return true;
    }
  }
  return false;
}

// The reference's own Appendix A section, as a set of trimmed non-empty
// lines. Used to size an artifact's VERBATIM reproduction of it.
function referenceAppendixLines(referenceText) {
  const lines = referenceText.split('\n');
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+.*Appendix A/i.exec(lines[i]);
    if (m) {
      start = i;
      level = m[1].length;
      break;
    }
  }
  const set = new Set();
  if (start === -1) return set;
  for (let i = start; i < lines.length; i++) {
    if (i > start) {
      const h = /^(#{1,6})\s+/.exec(lines[i]);
      if (h && h[1].length <= level) break;
    }
    const t = lines[i].trim();
    if (t) set.add(t);
  }
  return set;
}

// ---------------------------------------------------------------------------
// Tag classification
// ---------------------------------------------------------------------------

// Splits a tag's inner text into its head and its parameter segments,
// collapsing any surplus segments into the LAST declared one so a value that
// legitimately contains a comma ("Alvarez, Jordan") is not mis-parsed into a
// spurious missing parameter.
function splitTagSegments(inner, declaredCount) {
  const parts = inner.split(',').map((s) => s.trim());
  const head = parts[0] || '';
  let rest = parts.slice(1).filter((s) => s.length > 0);
  if (declaredCount > 0 && rest.length > declaredCount) {
    rest = rest.slice(0, declaredCount - 1).concat([rest.slice(declaredCount - 1).join(', ')]);
  }
  return { head: head, segments: rest };
}

// Tests one supplied parameter segment against one DECLARED segment: every
// declared word must be accounted for. A date template is satisfied only by
// a REAL date of the declared form -- the unfilled template text itself
// ("YYYY-MM-DD") never satisfies, because Appendix A requires the date and
// an unfilled template token is not one.
function evaluateSegment(declared, actual) {
  const problems = [];
  const actualTrimmed = String(actual || '').trim();
  if (!actualTrimmed) {
    problems.push({ token: declared.declared, issue: 'missing', isDate: false });
    return problems;
  }
  const actualTokens = tokenize(actualTrimmed).map((t) => stripEdgePunct(t)).filter((t) => t.length > 0);
  const carriesDigits = actualTokens.some((t) => /\d/.test(t));
  for (const t of declared.tokens) {
    if (t.role === 'literal') {
      const hit = actualTokens.some((a) => a.toLowerCase() === t.text.toLowerCase());
      if (!hit) problems.push({ token: t.text, issue: 'missing', isDate: false });
    } else if (t.role === 'date') {
      const hit = actualTokens.some((a) => t.re.test(a));
      if (!hit) {
        problems.push({ token: t.text, issue: carriesDigits ? 'malformed' : 'missing', isDate: true });
      }
    }
  }
  if (actualTokens.length < declared.tokens.length) {
    const slots = declared.tokens.filter((t) => t.role === 'slot');
    if (slots.length) {
      for (const t of slots) problems.push({ token: t.text, issue: 'missing', isDate: false });
    } else {
      problems.push({ token: declared.declared, issue: 'missing', isDate: false });
    }
  }
  return problems;
}

// Classifies one "(...)"-group's inner text against the closed set:
// { status: 'unknown' } for a head the reference does not declare,
// { status: 'valid' } when every declared parameter is accounted for, or
// { status: 'invalid', problems } naming each missing or malformed one.
function classifyTagGroup(inner, classes) {
  const rawHead = (inner.split(',')[0] || '').trim();
  const headKey = normHead(rawHead);
  if (!headKey) return { status: 'unknown', head: rawHead };
  const cls = classes.find((c) => c.headKey === headKey);
  if (!cls) return { status: 'unknown', head: rawHead };
  const split = splitTagSegments(inner, cls.params.length);
  const problems = [];
  for (let i = 0; i < cls.params.length; i++) {
    for (const p of evaluateSegment(cls.params[i], split.segments[i])) problems.push(p);
  }
  if (!problems.length) return { status: 'valid', head: cls.head, class: cls };
  return { status: 'invalid', head: cls.head, class: cls, problems: problems };
}

// A head is TAG-SHAPED when it reads like a class name: words of letters,
// hyphens, apostrophes and dashes only. "https://status.example.com" and
// "timeout: int = 30" are not tag-shaped, which is why an ordinary code
// parenthetical is never mistaken for a tag.
function isTagShapedHead(head) {
  return /^[A-Za-z][A-Za-z‐-―' -]*$/.test(head);
}

function nearestClassDistance(headKey, classes) {
  let best = { distance: Infinity, cls: null };
  for (const c of classes) {
    const d = editDistance(headKey, c.headKey, 2);
    if (d < best.distance) best = { distance: d, cls: c };
  }
  return best;
}

// ---------------------------------------------------------------------------
// Claim scanning
// ---------------------------------------------------------------------------

function isClaimBearingLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^#{1,6}\s/.test(t)) return false;
  if (/^\|/.test(t)) return false;
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) return false;
  if (/^[-*+]\s*$/.test(t)) return false;
  if (/^\d+\.\s*$/.test(t)) return false;
  if (/^\[[^\]]*\]\([^)]*\)$/.test(t)) return false;
  if (/^[-*+]\s+\[[^\]]*\]\([^)]*\)$/.test(t)) return false;
  if (!/[A-Za-z]/.test(t)) return false;
  return true;
}

function startsNewBlock(line) {
  return /^\s*([-*+]|\d+\.)\s+/.test(line) || /^\s*>/.test(line);
}

// Groups the masked artifact into claim-bearing PARAGRAPH blocks. A block is
// a maximal run of consecutive claim-bearing lines; a blank or structural
// line ends it, and a list item or block quote marker starts a new one, so a
// list of one-line claims is still one claim each.
function collectClaimBlocks(maskedLines) {
  const blocks = [];
  let current = null;
  const flush = () => {
    if (current && current.lines.length) blocks.push(current);
    current = null;
  };
  for (let i = 0; i < maskedLines.length; i++) {
    const line = maskedLines[i];
    if (!isClaimBearingLine(line)) {
      flush();
      continue;
    }
    if (!current || startsNewBlock(line)) {
      flush();
      current = { lines: [] };
    }
    current.lines.push({ lineNo: i + 1, text: line.trim() });
  }
  flush();
  return blocks;
}

// Joins a block's lines into one logical paragraph, keeping a character
// offset -> source line map so every finding still cites a real line.
function joinBlock(block) {
  let text = '';
  const spans = [];
  for (const l of block.lines) {
    const start = text.length;
    text += (text ? ' ' : '') + l.text;
    spans.push({ start: start === 0 ? 0 : start + 1, end: text.length, lineNo: l.lineNo });
  }
  return { text: text, spans: spans };
}

function lineForOffset(joined, offset) {
  for (const s of joined.spans) {
    if (offset < s.end) return s.lineNo;
  }
  return joined.spans.length ? joined.spans[joined.spans.length - 1].lineNo : 1;
}

function isSubstantiveClaimText(s) {
  const t = String(s).replace(/[*_>`]/g, '').trim();
  if (!/[A-Za-z]/.test(t)) return false;
  return tokenize(t).filter((w) => /[A-Za-z]/.test(w)).length >= 3;
}

const PARENTHETICAL_RE = /\*{0,2}\(([^()]*)\)\*{0,2}/g;

// Collects the parentheticals in a paragraph that plausibly ATTEMPT an
// evidence tag: an exact class head always, a near-miss head (edit distance
// <= 2) always, and an unmatched-head parenthetical only where it closes a
// claim AND its parameter segment carries the declared parameter surface (a
// declared word or a date in a declared form) -- the same
// match-or-near-match standard the fenced-region scan applies, widened by
// the surface signal so a wholly out-of-set class attempt written with real
// tag parameters ("internal memo, retrieved 2026-01-15") is still rejected
// by the closed set. An ordinary aside -- "(see Appendix B, page 4)",
// mid-sentence or trailing -- carries none of that surface and is left
// alone; a claim carrying ONLY such an aside is an untagged claim.
function collectTagOccurrences(text, classes) {
  const out = [];
  PARENTHETICAL_RE.lastIndex = 0;
  let m;
  while ((m = PARENTHETICAL_RE.exec(text))) {
    const inner = m[1];
    const rawHead = (inner.split(',')[0] || '').trim();
    const headKey = normHead(rawHead);
    if (!headKey || !isTagShapedHead(normSpace(rawHead.replace(/^[*_]+/, '')))) continue;
    const exact = classes.some((c) => c.headKey === headKey);
    const near = exact ? true : nearestClassDistance(headKey, classes).distance <= 2;
    const after = text.slice(m.index + m[0].length);
    const closesClaim = /^\s*[.;!?]?\s*$/.test(after) || /^\s*[.;!?]/.test(after);
    const surfaced = carriesDeclaredParamSurface(inner, classes.paramSurface);
    if (exact || near || (surfaced && closesClaim)) {
      out.push({ start: m.index, end: m.index + m[0].length, inner: inner });
    }
  }
  return out;
}

function evaluateTagOccurrence(pathRel, lineNo, inner, classes) {
  const findings = [];
  const result = classifyTagGroup(inner, classes);
  if (result.status === 'unknown') {
    findings.push(mkFinding(
      pathRel, lineNo, 'class-outside-closed-set', 'fail',
      'claim carries a class the seeded reference does not declare'
    ));
  } else if (result.status === 'invalid') {
    for (const p of result.problems) {
      const code = p.issue === 'missing' ? 'tag-parameter-missing' : 'tag-parameter-malformed';
      const detail = p.isDate
        ? (p.issue === 'missing'
            ? "does not carry a date in the declared '" + p.token + "' form"
            : "carries a date that is not in the declared '" + p.token + "' form")
        : "does not carry the parameter its row declares as '" + p.token + "'";
      findings.push(mkFinding(
        pathRel, lineNo, code, 'fail',
        "class '" + result.head + "' " + detail
      ));
    }
  }
  return findings;
}

// One paragraph -> zero or more claims. Each tag closes the claim before it;
// substantive text after the last tag is an untagged claim; a tag with no
// claim text since the previous tag is a second class on the same claim.
function evaluateBlock(pathRel, block, classes) {
  const joined = joinBlock(block);
  const findings = [];
  let claimCount = 0;
  if (!isSubstantiveClaimText(joined.text) && !/[A-Za-z]/.test(joined.text)) {
    return { findings: findings, claimCount: 0 };
  }
  const tags = collectTagOccurrences(joined.text, classes);
  if (!tags.length) {
    if (!isSubstantiveClaimText(joined.text)) return { findings: findings, claimCount: 0 };
    claimCount++;
    findings.push(mkFinding(
      pathRel, joined.spans.length ? joined.spans[0].lineNo : 1, 'claim-untagged', 'fail',
      'claim carries no evidence-tag class from the closed set'
    ));
    return { findings: findings, claimCount: claimCount };
  }
  let cursor = 0;
  let sawTag = false;
  for (const tag of tags) {
    const between = joined.text.slice(cursor, tag.start);
    const lineNo = lineForOffset(joined, tag.start);
    if (sawTag && !isSubstantiveClaimText(between)) {
      findings.push(mkFinding(
        pathRel, lineNo, 'claim-carries-multiple-classes', 'fail',
        'claim carries more than one evidence-tag class; Appendix A requires exactly one'
      ));
    } else {
      claimCount++;
      for (const f of evaluateTagOccurrence(pathRel, lineNo, tag.inner, classes)) findings.push(f);
    }
    cursor = tag.end;
    sawTag = true;
  }
  const remainder = joined.text.slice(cursor);
  if (isSubstantiveClaimText(remainder)) {
    claimCount++;
    findings.push(mkFinding(
      pathRel, lineForOffset(joined, cursor + (remainder.length - remainder.replace(/^\s+/, '').length)),
      'claim-untagged', 'fail',
      'claim carries no evidence-tag class from the closed set'
    ));
  }
  return { findings: findings, claimCount: claimCount };
}

// Locates the artifact's VERBATIM reproduction of the supplied reference's
// Appendix A. The region exists only when EVERY class row of the reference
// appears in the artifact verbatim; it is then the block those rows sit in,
// grown outward across blank lines and other lines reproduced verbatim from
// the reference's own appendix. A heading that merely mentions Appendix A is
// not a reproduction and excludes nothing -- otherwise a heading edit could
// silence claim scanning for a whole document.
function detectAppendixReproduction(rawLines, classRows, refLines) {
  if (!classRows || !classRows.length) return null;
  const trimmed = rawLines.map((l) => l.trim());
  let min = Infinity;
  let max = -1;
  for (const row of classRows) {
    const idx = trimmed.indexOf(row);
    if (idx === -1) return null;
    if (idx < min) min = idx;
    if (idx > max) max = idx;
  }
  let start = min;
  while (start - 1 >= 0) {
    const prev = trimmed[start - 1];
    if (prev === '' || refLines.has(prev) || /^#{1,6}\s+.*Appendix A/i.test(prev)) start--;
    else break;
  }
  let end = max;
  while (end + 1 < trimmed.length) {
    const next = trimmed[end + 1];
    if (next === '' || refLines.has(next)) end++;
    else break;
  }
  while (start < min && trimmed[start] === '') start++;
  while (end > max && trimmed[end] === '') end--;
  return { startLine: start, endLine: end + 1 };
}

// A parenthetical inside a fenced code block is examined only when it
// plausibly attempts a tag: its head matches a declared class, or is within
// edit distance 2 of one. Nothing else in a fence is a finding. The message
// names only the DECLARED class involved -- fenced content is untrusted and
// is never echoed into the envelope.
function scanFencedForMalformedTags(pathRel, rawLines, fencedLines, classes) {
  const findings = [];
  const sortedLines = Array.from(fencedLines).sort((a, b) => a - b);
  for (const lineNo of sortedLines) {
    const line = rawLines[lineNo - 1] || '';
    const re = /\(([^()]*)\)/g;
    let m;
    while ((m = re.exec(line))) {
      const inner = m[1];
      const rawHead = (inner.split(',')[0] || '').trim();
      const headKey = normHead(rawHead);
      if (!headKey || !isTagShapedHead(normSpace(rawHead))) continue;
      const exact = classes.find((c) => c.headKey === headKey);
      if (exact) {
        // A fenced example reproducing a class's DECLARED spelling verbatim
        // (template tokens and all) is correct documentation of the row, not
        // a malformed example -- only live claim text must fill templates in.
        if (normSpace(inner).toLowerCase() === normSpace(exact.label).toLowerCase()) continue;
        const result = classifyTagGroup(inner, classes);
        if (result.status === 'valid') continue;
        findings.push(mkFinding(
          pathRel, lineNo, 'malformed-tag-in-excluded-region', 'warn',
          "a documentation example inside a fenced block writes the closed-set class '" +
            exact.head + "' without the parameters its row declares; the region is not " +
            'live claim text, so this warns rather than fails'
        ));
        continue;
      }
      const near = nearestClassDistance(headKey, classes);
      if (near.distance <= 2 && near.cls) {
        findings.push(mkFinding(
          pathRel, lineNo, 'malformed-tag-in-excluded-region', 'warn',
          "a documentation example inside a fenced block carries a class token resembling " +
            "the closed-set class '" + near.cls.head + "' but not declared by the seeded " +
            'reference; the region is not live claim text, so this warns rather than fails'
        ));
      }
    }
  }
  return findings;
}

function execute(input) {
  const artifactPathOpt =
    input && typeof input === 'object' && typeof input.artifact_path === 'string'
      ? input.artifact_path
      : null;
  const referencesOpt =
    input && typeof input === 'object' && input.references && typeof input.references === 'object'
      ? input.references
      : {};
  const evidenceClassesPathOpt =
    typeof referencesOpt.evidence_classes === 'string' ? referencesOpt.evidence_classes : null;
  const options =
    input && typeof input === 'object' && input.options && typeof input.options === 'object'
      ? input.options
      : {};
  const requireTags = options.require_tags !== false;
  const excludedRegionsOpt = Array.isArray(options.excluded_regions) ? options.excluded_regions : [];
  const excludeAppendix = excludedRegionsOpt.indexOf('appendix-a-reproduction') !== -1;
  const excludeFenced = excludedRegionsOpt.indexOf('fenced') !== -1;

  if (!artifactPathOpt) {
    return skipped('unavailable');
  }

  let artifactRaw;
  try {
    artifactRaw = readFileSyncRel(artifactPathOpt);
  } catch (e) {
    return skippedForFailedRead(e, 'artifact_path');
  }

  if (!evidenceClassesPathOpt) {
    return skipped('unavailable');
  }

  let referenceRaw;
  try {
    referenceRaw = readFileSyncRel(evidenceClassesPathOpt);
  } catch (e) {
    return skippedForFailedRead(e, 'references.evidence_classes');
  }

  const classes = parseClosedSet(referenceRaw);
  if (!classes.length) {
    return skipped('unavailable');
  }

  const artifactRelPath = normalizePath(artifactPathOpt);
  const rawLines = artifactRaw.split('\n');
  const fenced = fencedLineNumbers(artifactRaw);

  const maskedText = maskInlineCode(maskFencedBlocks(artifactRaw));
  const maskedLines = maskedText.split('\n');

  const dynamicLimits = [];

  if (excludeAppendix) {
    const refLines = referenceAppendixLines(referenceRaw);
    const region = detectAppendixReproduction(rawLines, classes.rows, refLines);
    if (region) {
      // Blank only the lines actually reproduced from the reference's own
      // appendix (plus blanks and the reproduction's heading). A non-reference
      // line INSERTED between reproduced rows is live artifact text and stays
      // scanned -- the exclusion covers the reproduction, not its line span.
      for (let i = region.startLine; i < region.endLine; i++) {
        const t = (rawLines[i] || '').trim();
        if (t === '' || refLines.has(t) || /^#{1,6}\s+.*Appendix A/i.test(t)) {
          maskedLines[i] = maskedLines[i].replace(/[^\n]/g, ' ');
        }
      }
      dynamicLimits.push(
        "the artifact's own verbatim Appendix A reproduction (within lines " +
          (region.startLine + 1) + '-' + region.endLine + ', every class row of the ' +
          'supplied reference matched byte-for-byte) was excluded from claim scanning; ' +
          'only lines reproduced verbatim from the reference appendix are excluded -- ' +
          'a non-reference line inserted inside the span remains scanned -- and the ' +
          'reproduction contributes no findings'
      );
    }
  }

  let excludedFindings = [];
  if (excludeFenced && fenced.size) {
    excludedFindings = scanFencedForMalformedTags(artifactRelPath, rawLines, fenced, classes);
    dynamicLimits.push(
      fenced.size + ' fenced code block line(s) were excluded from claim scanning; only a ' +
        'parenthetical whose head matches or closely resembles a declared class is examined ' +
        'inside one, and such a malformed or out-of-set token is reported as a warn rather ' +
        'than dropped silently'
    );
  }

  const claimFindings = [];
  let claimCount = 0;
  for (const block of collectClaimBlocks(maskedLines)) {
    const res = evaluateBlock(artifactRelPath, block, classes);
    claimCount += res.claimCount;
    for (const f of res.findings) claimFindings.push(f);
  }

  if (!requireTags) {
    claimFindings.forEach((f) => { f.severity = 'warn'; });
  }

  const statedLimits = BASE_STATED_LIMITS.concat(dynamicLimits);

  if (claimCount === 0 && excludedFindings.length === 0) {
    return {
      check: CHECK_SLUG,
      status: 'skipped',
      skipped_reason: 'not-applicable',
      verdict: null,
      findings: [],
      stated_limits: statedLimits,
      tool_versions: {}
    };
  }

  const findings = claimFindings.concat(excludedFindings).sort(findingComparator);

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
    stated_limits: statedLimits,
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
    process.stderr.write('evidence-tag-grammar: unable to read input\n');
    process.exitCode = 3;
  }

  if (raw !== null) {
    let parsedInput;
    let parsed = false;
    try {
      parsedInput = JSON.parse(raw);
      parsed = true;
    } catch (e) {
      process.stderr.write('evidence-tag-grammar: malformed JSON input\n');
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

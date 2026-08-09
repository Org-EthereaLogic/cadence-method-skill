// INPUT: one JSON object, on standard input or as a file argument.
//
//   {
//     "check": "loose-pointer-drift",
//     "artifact_path": "cadence/candidate/solution-design.md",
//     "manifest_path": "cadence/manifest.json",
//     "options": { "version_authority": "documents[].current_version" }
//   }
//
//   Both paths are REPOSITORY-ROOT-relative and are resolved against the
//   process working directory, never against this script's own location.
//   A path that escapes the repository root is refused UNREAD and the run
//   degrades closed to "skipped: unavailable" with a dedicated stated_limits
//   sentence that distinguishes a containment refusal from a missing file.
//
//   Skips: the manifest cannot be read or parsed ("unavailable"); the
//   manifest asserts no version for any document ("not-applicable").
//
// WARN-ONLY BY DESIGN
//
//   The verdict domain is pass | warn. "fail" is UNREACHABLE and is never
//   constructed by any code path here: method section 6.2 rule 1 makes one
//   place -- the manifest -- assert a version while everywhere else points
//   loosely, and a loose pointer that drifts warns rather than fails. A check
//   that could fail here would rebuild the method section 5 cascade this rule
//   exists to kill (FR-2, FR-12, AC-2.2, AC-13.2).
//
//   "status" is an INDEPENDENT field. A run that could not read its manifest
//   reports status "skipped" with verdict null, never a pass: warn-only means
//   never fail, it does not mean never skip (NFR-6).
//
// WHAT COUNTS AS A LOOSE VERSION POINTER
//
//   No governing document defines this. The WP 1.3 spec sheet gives this
//   check a four-key envelope and three edge cases and states no pointer
//   grammar; it pins surface syntax explicitly for sibling checks when it
//   means to ("Only ](path) forms are links", link integrity) and does not
//   here. The grammar below is therefore this script's own, and it is stated
//   in stated_limits for that reason -- a narrower scan disclosed in full is
//   what spec sheet section 2 provides for.
//
//   A line is scanned into a position-ordered sequence of two entity kinds:
//   manifest-declared DOCUMENT REFERENCES and VERSION TOKENS. A pointer is
//   then recognised only in one of two lexical forms, and only when it is
//   UNCONTESTED:
//
//     (1) FORWARD -- a reference immediately followed by a version token
//         ("`docs/design/DOC.md` v1.2"). This is the canonical form.
//
//     (2) BACKWARD -- a version token immediately followed by a reference
//         ("| v1.2 | `docs/design/DOC.md` |"), allowed ONLY when NO document
//         reference appears anywhere earlier on that line. A version token
//         written after a reference is read forward or not at all.
//
//   "Immediately" means adjacent in the entity sequence with a separator in
//   POINTER FORM -- three structural conditions:
//
//     - at most ONE unescaped "|": adjacent table cells, never two apart;
//     - no sentence punctuation: a reference belongs to its own clause;
//     - once balanced "(...)" groups are removed, no letter and no digit.
//
//   Punctuation, whitespace, one table pipe, backticks, brackets and dashes
//   qualify; prose does not. "`DOC.md` v1.2", "`DOC.md`, v1.2" and
//   "v4.7 (final) -- `DOC.md`" are pointers; "`DOC.md` was superseded at
//   v1.2" and "We use `DOC.md`. v2.0 is unrelated." are not.
//
//   A reference lying inside a parenthesised group may pair with a token
//   OUTSIDE it only when the group contains nothing but that reference. So
//   "[docs/design/DOC.md](docs/design/DOC.md) v1.2" -- a Markdown link whose
//   target IS the reference -- binds, while "`DOC_A.md` (which supersedes
//   `DOC_B.md`) v1.0" binds nothing: crediting DOC_B with v1.0 would name a
//   document whose own clause asserts no version.
//
//   Finally, any candidate that SHARES AN ENTITY with another candidate is
//   DISCARDED -- both of them. Nothing is ranked, no character gap is
//   measured, no direction is preferred as a tie-break and no manifest order
//   breaks a tie. There is no rule here that picks a winner, because a rule
//   that picks a winner is a rule that can pick the wrong document.
//
//   Two consequences hold by CONSTRUCTION rather than by testing:
//
//     - A version token can never be bound by two references. Its forward
//       binder requires the immediately preceding entity to be a reference;
//       its backward binder requires no reference to precede it at all. The
//       two conditions are mutually exclusive, so a token has at most one
//       candidate and can never be awarded twice.
//
//     - A finding can never name a document whose own reference is not
//       lexically adjacent to the version token being reported.
//
//   The residual error therefore runs ONE WAY, as a disclosed under-report: a
//   pointer written in prose the grammar does not recognise, split across a
//   line break, or left ambiguous by a contest is NOT compared, and every
//   such line is enumerated in stated_limits rather than silently dropped.
//
// DIRECTION OF ERROR
//
//   Ranked by harm: misattribution is worse than silence, and silence is
//   worse than noise. So binding is STRICT (accept silence rather than name
//   the wrong document), exclusion is NARROW (accept a warn on history rather
//   than blind the check), and every silence is disclosed so that it is
//   visible. Any future correction to this file should preserve that order.
//
// MASKING -- DELIBERATELY ASYMMETRIC
//
//   Fenced code blocks are masked: example text is not a live pointer.
//   Inline backtick spans are NOT masked -- the opposite of link-integrity.js
//   -- because this repository backticks every path in prose (CONTRIBUTING.md
//   convention) and nearly every real pointer is written exactly that way.
//   Masking inline spans would blind the check and report the manufactured
//   emptiness as a clean pass.
//
// REVISION ROWS ARE EXCLUDED
//
//   A revision row records what was true when it was written and is excluded
//   from version bumps (method section 6.2 rule 2); flagging one is the
//   defect, not the drift. Exclusion is STRUCTURAL and singular: every line
//   inside a heading section whose title NAMES a revision record, up to the
//   next heading of the same or higher level.
//
//   There is deliberately no second, shape-based test on the row itself. A
//   history row under a heading this test does not recognise is scanned as
//   live and may draw a warn on history -- noise, the accepted direction on
//   an advisory that cannot block.
//
// USAGE: node loose-pointer-drift.js <input.json|->
//
//   Reads the input envelope from the named file, or from standard input
//   when the argument is "-" or omitted. Prints the common output envelope
//   (section 2) as JSON to standard output. Exit codes: pass=0, warn=10,
//   skipped=30 (either reason); exit 3 if the input itself could not be read
//   or parsed as JSON. This check never emits 20: "fail" is unreachable.

'use strict';

const fs = require('fs');
const path = require('path');

const CHECK_SLUG = 'loose-pointer-drift';

const DEFAULT_VERSION_AUTHORITY = 'documents[].current_version';

const manifest = {
  check: CHECK_SLUG,
  description:
    'Loose-pointer drift: compares every loose version pointer in a ' +
    "companion artifact against the manifest's own version assertions and " +
    'warns on drift; never fails, because method section 6.2 rule 1 makes ' +
    'a loose pointer a warning by design (FR-2, FR-12, AC-2.2, AC-13.2).',
  verdicts: ['pass', 'warn'],
  skip_reasons: ['not-applicable', 'unavailable'],
  exit_codes: { pass: 0, warn: 10, skipped: 30 },
  finding_codes: ['loose-pointer-version-drift']
};

const BASE_STATED_LIMITS = [
  'A loose pointer is recognised only in one of two LEXICAL forms on a ' +
    'single line, between a manifest-declared document reference (a literal ' +
    "occurrence of a document entry's declared path or its basename) and a " +
    'version token: FORWARD, a reference immediately followed by a token; ' +
    'or BACKWARD, a token immediately followed by a reference, allowed only ' +
    'when NO document reference appears anywhere earlier on that line -- a ' +
    'token written after a reference is read forward or not at all. ' +
    '"Immediately" means adjacent in the line\'s entity sequence with a ' +
    'separator in POINTER FORM, which is three structural conditions: at most ' +
    'ONE unescaped "|" (adjacent table cells, never two cells apart); no ' +
    'sentence punctuation (a reference belongs to its own clause, so "We use ' +
    '`DOC.md`. v2.0 of the schema is unrelated." does not bind); and, once ' +
    'balanced "(...)" groups are removed, no letter and no digit. A reference ' +
    'lying inside a parenthesised group may pair with a token outside it ONLY ' +
    'when the group contains nothing but that reference -- so the Markdown ' +
    'link "[docs/design/DOC.md](docs/design/DOC.md) v1.2" binds, while ' +
    '"`DOC_A.md` (which supersedes `DOC_B.md`) v1.0" binds nothing, because ' +
    'crediting DOC_B with v1.0 would name a document whose own clause asserts ' +
    'no version. Any candidate that shares an entity with another ' +
    'candidate is DISCARDED, both of them. Nothing is ranked, no character ' +
    'gap is measured, no direction is preferred as a tie-break and no ' +
    'manifest order breaks a tie: a rule that picks a winner is a rule that ' +
    'can pick the wrong document. Two properties consequently hold by ' +
    'construction rather than by testing -- a version token can never be ' +
    'bound by two references (its forward binder requires a reference ' +
    'immediately before it, its backward binder requires no reference before ' +
    'it at all, and those are mutually exclusive), and a finding can never ' +
    'name a document whose own reference is not lexically adjacent to the ' +
    'token reported. The residual error therefore runs ONE WAY, as an ' +
    'under-report: a pointer written in prose this grammar does not ' +
    'recognise ("`DOC.md` was superseded at v1.2"), split across a line ' +
    'break, or left ambiguous by a contest is not compared. Every such line ' +
    'is enumerated below rather than silently dropped. This grammar is this ' +
    "script's own: the WP 1.3 spec sheet states none for this check, and " +
    'this sentence is where that is recorded.',
  'Both matchers are boundary-anchored, symmetrically: a version token must ' +
    'match /(?<![\\w./-])[vV]\\d+(?:\\.\\d+)*(?![\\w/-])(?!\\.\\w)/ -- the ' +
    'same boundary class the document-reference matcher uses, relaxed only ' +
    'for a trailing dot not followed by a word character (sentence ' +
    'punctuation) -- so a version-shaped substring embedded in an ordinary ' +
    'word (IPv4, REV2, V2X) or joined to one by a dot, slash or hyphen ' +
    '(legacy-v2.md, v2/, release-v2.3) is never read as a version token. ' +
    'The document-reference matcher carries the same trailing relaxation, so ' +
    'a bare (non-backticked) path ending a sentence is still recognised ' +
    'while a genuine filename continuation (DOC.md.bak, where the dot IS ' +
    'followed by a word character) still is not.',
  'When several manifest-declared match strings could match the SAME text, ' +
    "the LONGEST wins first, and at equal length a document's own declared " +
    "PATH outranks another document's BASENAME: a manifest declaring both " +
    '"docs/design/DOC.md" and a distinct root-level "DOC.md" attributes a ' +
    'bare "DOC.md" occurrence to the document that declares it as its path. ' +
    'Where two DIFFERENT declared documents share a basename ' +
    '("docs/design/DOC.md" and "archive/DOC.md") and the prose writes that ' +
    'basename alone, the occurrence is genuinely undecidable and is ' +
    'REFUSED: it is not attributed to either document, produces no finding, ' +
    'and the line is enumerated below. Writing the full path disambiguates ' +
    'it. Refusing rather than resolving the collision by manifest order is ' +
    'deliberate -- an order-based winner is indistinguishable from a correct ' +
    'answer in the output envelope, and naming the wrong document is the one ' +
    'error class this check is built to make unreachable.',
  'Fenced code blocks are masked (example text, not a live pointer), reusing ' +
    'the same fence masker link-integrity.js and evidence-tag-grammar.js ' +
    'apply to the regions they own. Inline backtick spans are DELIBERATELY ' +
    'NOT masked -- the opposite of link-integrity.js -- because this ' +
    'repository backticks every path in prose (CONTRIBUTING.md convention) ' +
    "and this check's own live pointers are written exactly that way; " +
    'masking inline spans would blind the check to nearly every real pointer ' +
    'and report the manufactured emptiness as a clean pass.',
  'A revision row is excluded from scanning by ONE structural test, computed ' +
    'over the same fence-masked lines the pointer scan reads -- so example ' +
    'text inside a fenced code block can neither open nor close an exclusion ' +
    'window: every line inside a heading section whose title NAMES a ' +
    'revision record, up to the next heading of the same or higher level. A ' +
    'title names one when, after edge decoration and a trailing parenthetical ' +
    'are stripped, it ENDS with "revision record" or "revision records" on a ' +
    'word boundary -- so "Appendix -- Revision Record" and "Revision Record ' +
    '(append-only)" open a window while a title that merely contains the ' +
    'phrase and continues past it ("Revision Records Overview") stays live, ' +
    'because a heading must not be able to silence live pointers beneath it. ' +
    'There is deliberately NO second, shape-based test on the row itself: a ' +
    'history row under a heading this test does not recognise is scanned as ' +
    'live and may draw a warn on genuine history. That noise is the accepted ' +
    'cost on an advisory that cannot block, and it is the safe direction -- ' +
    'a row-shape test broad enough to catch every history spelling is also ' +
    'broad enough to silence a live pointer that happens to share the shape.',
  'Version comparison is exact string equality after stripping one leading ' +
    '"v"/"V" from each side -- never semver ordering, so a pointer one ' +
    'revision behind and one revision ahead of the manifest assertion ' +
    'produce the identical finding.',
  'Version assertions are read from the node set options.version_authority ' +
    'names (default "' + DEFAULT_VERSION_AUTHORITY + '"), resolved by a ' +
    'BOUNDED <arrayKey>[].<leafField> lookup at the manifest root and one ' +
    'nested container level (so the seeded document_set.documents shape ' +
    'resolves) -- never a general JSONPath engine. The FIRST array found ' +
    "wins, in the manifest's own key order, and arrays the selector would " +
    'also name under OTHER containers are never merged in. A selector string ' +
    'that is not of that exact shape resolves to NO document entries at all, ' +
    'never a silent fall-back to the default, and the run degrades to ' +
    'skipped: not-applicable. The authority_document object is additionally ' +
    'read as a document reference and, when it independently carries both a ' +
    'path and the same leaf field, as a version assertion too; that ' +
    'inclusion is not literally named by the selector string and is ' +
    'disclosed here for that reason.',
  'A document entry present with a path but no (or an empty) value for the ' +
    'selected leaf field is still a recognised document reference -- so a ' +
    'pointer to it is not silently treated as unrecognised text -- but ' +
    'contributes no assertion to compare against; a run in which every ' +
    'recognised pointer names such a document reports ' +
    'skipped: not-applicable rather than a vacuous pass.',
  'This check\'s verdict is drawn from the closed set pass | warn: "fail" ' +
    'is unreachable by design (method section 6.2 rule 1) and is never ' +
    'constructed by any code path here, so exit code 20 is never emitted. ' +
    'status is an INDEPENDENT field: status: "skipped" with verdict: null is ' +
    'a correct, healthy outcome under either skip reason, is never a ' +
    'violation of the warn-only guarantee, and is never read as a pass.',
  'Every path in the input envelope -- manifest_path first, then, once it ' +
    'is read, parsed, and found to assert at least one version, ' +
    'artifact_path -- is resolved beneath the repository root and refused ' +
    'unread when it escapes it, so an absolute path or a "../" traversal ' +
    'degrades the run closed to skipped: unavailable rather than reading a ' +
    'file outside the checkout; the containment test also resolves symbolic ' +
    'links: fs.realpathSync is applied to both the target and the ' +
    'repository root before the same containment test is re-applied, so a ' +
    'symbolic link that lives inside the checkout and resolves outside it ' +
    'is refused too, before it is read; a dangling symlink -- one whose ' +
    'target does not exist -- is not a refusal and is reported as the ' +
    'ordinary missing-file outcome instead. This check spawns nothing (fs ' +
    'and path only), so no path here is ever executed; the "unexecuted" ' +
    'half of the containment obligation is consequently vacuous.'
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
// output envelope. Character-identical in all six guarded validators
// (link-integrity.js, cross-reference-integrity.js, gate-self-test.js,
// id-namespace-resolution.js, evidence-tag-grammar.js and this file) by
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
// preserved) so a pointer written inside one is never scanned as live, and
// so surviving matches keep accurate line numbers -- the same discipline
// link-integrity.js's and evidence-tag-grammar.js's maskFencedBlocks use.
// Per CommonMark a fence opens with a run of at least three backticks OR at
// least three tildes (indented up to three spaces) and closes with a run of
// the SAME character at least as long as the opening run, followed only by
// trailing whitespace. A backtick fence's info string may not contain a
// backtick (CommonMark), so an inline code span in prose is never mistaken
// for a fence opener. An unclosed fence extends to end of document. Both
// fence characters are masked (a "~~~" tilde fence is a live code block
// exactly like a "```" fence). Deliberately NOT paired with an inline-code
// masker here -- see the file header's "MASKING" section for why inline
// backtick spans stay live for this check.
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

// ---------------------------------------------------------------------------
// Revision-row exclusion (method section 6.2 rule 2) -- one structural test
// ---------------------------------------------------------------------------

// Does this heading title NAME a revision record, rather than merely mention
// the phrase? The distinction is load-bearing: this test opens an exclusion
// window that runs to the next heading of the same or higher level, so a
// heading that wrongly opens one SILENCES every live pointer beneath it --
// the false-negative direction this check exists to avoid. An unanchored
// /revision record/i substring test cannot tell "Appendix -- Revision Record"
// (the section) from "Revision Records Overview" or "Employee Revision Record
// Retention Schedule" (ordinary live sections that happen to contain the
// words), and silently blinded the check under all three.
//
// The rule: after edge decoration and a trailing parenthetical are stripped,
// the title must END with the phrase "revision record" (singular or plural),
// on a word boundary. A revision-record section is TITLED for its content, so
// the phrase is the tail of the title -- "Revision Record", "Appendix --
// Revision Record", "Appendix A: Revision Records", "Revision Record
// (append-only)". A title that continues past the phrase is describing
// something else and stays live. This narrows the window, which is the safe
// direction: a missed window costs at worst a warn on history (noise), while
// a window opened in error silences live drift.
function isRevisionRecordHeading(title) {
  const normalized = String(title)
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/^[\s*_~`#]+/, '')
    .replace(/[\s*_~`#:.,;\-–—]+$/, '')
    .trim();
  return /(?:^|[\s:.,;\-–—])revision records?$/i.test(normalized);
}

// Every line inside a heading section whose title NAMES a revision record
// (see isRevisionRecordHeading), up to (not including) the next heading of
// the same or higher level. The opening heading line itself is included in
// the excluded set. Receives the FENCE-MASKED lines -- the same lines the
// pointer scan reads -- so a heading-shaped line inside a fenced code block
// (masked to blanks) can neither open a window nor close one: example text
// must never alter how live text after the fence is scanned.
function revisionRecordExcludedLines(lines) {
  const excluded = new Set();
  let inSection = false;
  let sectionLevel = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.*)$/.exec(lines[i]);
    if (m) {
      const level = m[1].length;
      if (inSection && level <= sectionLevel) inSection = false;
      if (isRevisionRecordHeading(m[2])) {
        inSection = true;
        sectionLevel = level;
      }
    }
    if (inSection) excluded.add(i + 1);
  }
  return excluded;
}

// ---------------------------------------------------------------------------
// The version authority selector -- bounded, not a JSONPath engine
// ---------------------------------------------------------------------------

// Parses a bounded "<arrayKey>[].<leafField>" selector string into its two
// parts, or returns null when the string is not of that exact shape.
function parseVersionAuthoritySelector(sel) {
  const m = /^(\w+)\[\]\.(\w+)$/.exec(String(sel || ''));
  if (!m) return null;
  return { arrayKey: m[1], leafField: m[2] };
}

// Resolves the array the selector names: at the manifest root, or -- failing
// that -- at ONE nested container level (an object-valued top-level key
// whose own property named arrayKey is an array). The FIRST match, in the
// manifest's own key order, wins; this never descends further and never
// merges arrays found at multiple containers.
function resolveSelectorArray(manifestObj, arrayKey) {
  if (!manifestObj || typeof manifestObj !== 'object') return [];
  if (Array.isArray(manifestObj[arrayKey])) return manifestObj[arrayKey];
  const keys = Object.keys(manifestObj);
  for (const k of keys) {
    const v = manifestObj[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && Array.isArray(v[arrayKey])) {
      return v[arrayKey];
    }
  }
  return [];
}

// Builds the list of manifest-declared DOCUMENT ENTRIES: every array element
// the selector resolves that carries a non-empty "path", plus
// manifest.authority_document when it independently carries both a "path"
// and the same leaf field. Each entry's versionRaw is '' (falsy) when the
// leaf field is absent or empty -- present as a document-reference target
// either way, but an assertion only when versionRaw is truthy.
function buildDocumentEntries(manifestObj, selector) {
  const entries = [];
  const arr = resolveSelectorArray(manifestObj, selector.arrayKey);
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue;
    const p = typeof raw.path === 'string' ? raw.path.trim() : '';
    if (!p) continue;
    const versionRaw = typeof raw[selector.leafField] === 'string' ? raw[selector.leafField].trim() : '';
    entries.push({
      declaredPath: p,
      basename: path.posix.basename(p.split(path.sep).join('/')),
      versionRaw: versionRaw,
      source: 'document_set'
    });
  }
  const authDoc = manifestObj && typeof manifestObj === 'object' ? manifestObj.authority_document : null;
  if (authDoc && typeof authDoc === 'object') {
    const p = typeof authDoc.path === 'string' ? authDoc.path.trim() : '';
    const v = typeof authDoc[selector.leafField] === 'string' ? authDoc[selector.leafField].trim() : '';
    if (p && v) {
      entries.push({
        declaredPath: p,
        basename: path.posix.basename(p.split(path.sep).join('/')),
        versionRaw: v,
        source: 'authority_document'
      });
    }
  }
  return entries;
}

function normalizeVersion(v) {
  const s = String(v == null ? '' : v).trim();
  return /^[vV]/.test(s) ? s.slice(1) : s;
}

// ---------------------------------------------------------------------------
// Per-line entity scan and uncontested lexical binding
// ---------------------------------------------------------------------------

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A "manifest-declared document reference" occurrence: the LITERAL text of a
// document entry's path or its basename, boundary-matched so a shorter
// basename cannot fire INSIDE a longer, distinct filename (a search for
// "METHOD.md" must not match inside "OLD_METHOD.md"). Neither boundary
// character class is one that can continue a filename or path (word
// character, slash, hyphen).
//
// The trailing side carries the SAME relaxation VERSION_TOKEN_RE carries, for
// the same reason: a dot that is NOT followed by a word character is sentence
// punctuation, not a filename continuation. Without it, a bare (non-backticked)
// path at the end of a sentence -- "It references docs/design/COMPANION_ONE.md.
// That file is v2.0." -- was not recognized as a document reference AT ALL, so
// every version on that line went unbound and a real drift passed silently.
// That is the false-negative direction, and it was invisible in this repository
// only because CONTRIBUTING.md's convention backticks every path; a consumer
// project writing bare paths got no warning at all. "COMPANION_ONE.md.bak"
// still does not match: there the dot IS followed by a word character.
function docRefRegex(matchString) {
  return new RegExp(
    '(?<![\\w./-])' + escapeRegExp(matchString) + '(?![\\w/-])(?!\\.\\w)',
    'g'
  );
}

// Boundary-anchored SYMMETRICALLY with docRefRegex: the same class on the
// leading side (a token cannot begin inside a word, a dotted name, a path
// segment, or a hyphenated compound -- "IPv4", "REV2", "rev1.2",
// "legacy-v2.md", "path/v2" never yield one), and on the trailing side the
// same class relaxed only for a trailing dot NOT followed by a word
// character, so sentence punctuation after a real token ("... at v4.7.")
// does not block recognition while a filename continuation ("v2.md") and a
// word continuation ("V2X") do. The (?!\.\w) lookahead also forbids the
// partial match a bare \w test would leave reachable by backtracking:
// "v2.2X" yields NO token at all rather than a fabricated "v2".
const VERSION_TOKEN_RE = /(?<![\w./-])[vV]\d+(?:\.\d+)*(?![\w/-])(?!\.\w)/g;

// Builds the set of literal strings that count as a reference occurrence, and
// decides -- ONCE, from the manifest alone -- which document each string
// stands for. A string that two DIFFERENT documents can equally claim is
// marked ambiguous (docIdx null) and never attributed to either: see the
// third stated limit. The final sort is total, so nothing depends on
// Array.prototype.sort stability or on Map iteration subtleties.
function buildMatchCandidates(documentEntries) {
  const byString = new Map();
  documentEntries.forEach((entry, idx) => {
    const add = (s, kindRank) => {
      if (!s) return;
      if (!byString.has(s)) byString.set(s, []);
      byString.get(s).push({ docIdx: idx, kindRank: kindRank });
    };
    add(entry.declaredPath, 0);
    if (entry.basename && entry.basename !== entry.declaredPath) add(entry.basename, 1);
  });

  const candidates = [];
  byString.forEach((uses, matchString) => {
    let bestRank = 1;
    for (const u of uses) if (u.kindRank < bestRank) bestRank = u.kindRank;
    const distinct = [];
    for (const u of uses) {
      if (u.kindRank === bestRank && distinct.indexOf(u.docIdx) === -1) distinct.push(u.docIdx);
    }
    candidates.push({
      matchString: matchString,
      kindRank: bestRank,
      docIdx: distinct.length === 1 ? distinct[0] : null,
      ambiguousAmong: distinct.length === 1 ? null : distinct.slice()
    });
  });

  // Longest first, then by the literal itself. The literal is the Map key, so
  // it is unique and this order is TOTAL -- nothing depends on
  // Array.prototype.sort stability. kindRank deliberately does NOT appear
  // here: it decides which document a literal stands for, above, and adding
  // it to this sort would be dead weight that reads like a live rule.
  candidates.sort(
    (a, b) =>
      (b.matchString.length - a.matchString.length) ||
      cmpStr(a.matchString, b.matchString)
  );
  return candidates;
}

// The line's entities, in reading order. Document references are matched
// longest-first with claimed-range suppression, so a basename occurrence
// already covered by a longer full-path match is not counted a second time;
// "claimed" here means a character range already taken, nothing more.
function scanLineEntities(line, matchCandidates) {
  const claimed = [];
  const isClaimed = (start, end) => claimed.some((r) => start < r[1] && end > r[0]);

  const entities = [];
  for (const cand of matchCandidates) {
    if (!cand.matchString) continue;
    const re = docRefRegex(cand.matchString);
    let m;
    while ((m = re.exec(line))) {
      const start = m.index;
      const end = m.index + m[0].length;
      if (!isClaimed(start, end)) {
        claimed.push([start, end]);
        entities.push({
          kind: 'doc',
          start: start,
          end: end,
          docIdx: cand.docIdx,
          ambiguousAmong: cand.ambiguousAmong
        });
      }
    }
  }

  // VERSION_TOKEN_RE is a module-level /g regex shared across every line, so
  // its lastIndex must be reset before each scan.
  VERSION_TOKEN_RE.lastIndex = 0;
  let vm;
  while ((vm = VERSION_TOKEN_RE.exec(line))) {
    entities.push({ kind: 'ver', start: vm.index, end: vm.index + vm[0].length, raw: vm[0] });
  }

  entities.sort((a, b) => (a.start - b.start) || (a.end - b.end));
  return entities;
}

// How many LIVE table-cell delimiters does this text carry? A pipe is escaped
// in GFM iff it is preceded by an ODD run of backslashes, so parity is what
// decides it, not the single preceding character: "\|" is an escaped pipe,
// but "\\|" is an escaped BACKSLASH followed by a live delimiter. A
// (?<!\\)\| lookbehind gets the second case wrong and undercounts, which let
// a pair two cells apart through the bound below.
function unescapedPipeCount(text) {
  let count = 0;
  let backslashes = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\') {
      backslashes += 1;
      continue;
    }
    if (ch === '|' && backslashes % 2 === 0) count += 1;
    backslashes = 0;
  }
  return count;
}

// Is the raw text between two adjacent entities a POINTER-FORM separator?
// Three structural conditions, each bounding a quantity that means something:
//
//   (1) At most ONE unescaped "|" -- adjacent table cells, never two cells
//       apart. This replaces an earlier character-count budget, which bounded
//       the wrong quantity in both directions: at 32 it rejected a legitimate
//       WIDE ALIGNED table row (a false negative) while still admitting
//       "| `DOC.md` | | v1.0 |", a pair two cells apart (a false positive).
//
//   (2) No sentence punctuation. A reference belongs to its own clause:
//       "We use `DOC.md`. v2.0 of the schema is unrelated." must not bind,
//       and without this test its separator ("`. ") is inert and does.
//
//   (3) No letter and no digit -- prose is not a pointer form.
//
// Balanced "(...)" groups are removed before (2) and (3), so a parenthesised
// aside ("v4.7 (final) -- `DOC.md`") does not disqualify an otherwise
// adjacent pair. The removal is iterated so a nested group reduces too, and
// it terminates because every pass either shortens the string or is a
// fixpoint.
function separatorIsPointerForm(line, a, b) {
  const sep = line.slice(a.end, b.start);
  if (unescapedPipeCount(sep) > 1) return false;
  let s = sep;
  for (;;) {
    const next = s.replace(/\([^()]*\)/g, '');
    if (next === s) break;
    s = next;
  }
  if (/[.!?](\s|$)/.test(s)) return false;
  return !/[\p{L}\p{N}]/u.test(s);
}

// The line's balanced parenthesis groups as half-open [start, end) ranges.
// An unmatched "(" or ")" contributes nothing: a stray parenthesis must not
// make the rest of the line opaque.
function parenGroups(line) {
  const groups = [];
  const stack = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '(') stack.push(i);
    else if (line[i] === ')' && stack.length) groups.push({ start: stack.pop(), end: i + 1 });
  }
  return groups;
}

// The smallest balanced group strictly containing [start, end), or null.
function innermostGroup(groups, start, end) {
  let best = null;
  for (const g of groups) {
    if (g.start < start && g.end > end && (!best || (g.end - g.start) < (best.end - best.start))) {
      best = g;
    }
  }
  return best;
}

// May two entities in DIFFERENT parenthesis contexts pair? Only when the
// group an entity sits inside contains nothing but that entity:
// "[docs/design/DOC.md](docs/design/DOC.md) v1.2" is a Markdown link whose
// target IS the reference, so it reaches out to the token; but
// "`DOC_A.md` (which supersedes `DOC_B.md`) v1.0" is an aside, and letting
// DOC_B reach out to v1.0 would credit a document with a version its own
// clause never names -- the misattribution class this check exists to make
// unreachable. Edge decoration is stripped from the group's content before
// the comparison so a backticked reference in parentheses is not needlessly
// refused.
function crossesOpaqueParen(line, groups, a, b) {
  const ga = innermostGroup(groups, a.start, a.end);
  const gb = innermostGroup(groups, b.start, b.end);
  if (ga === gb) return false;
  const pairs = [[a, ga], [b, gb]];
  for (const [ent, g] of pairs) {
    if (!g) continue;
    const content = line
      .slice(g.start + 1, g.end - 1)
      .trim()
      .replace(/^[`*_~]+/, '')
      .replace(/[`*_~]+$/, '')
      .trim();
    if (content !== line.slice(ent.start, ent.end)) return true;
  }
  return false;
}

// The whole binding rule. Returns { bindings, contested }, where a binding is
// { doc, tok } and `contested` counts the candidates refused for sharing an
// entity. There is no ranking step and no tie-break: a candidate either
// stands alone or is discarded.
//
// A FORWARD candidate is a reference immediately followed by a token. A
// BACKWARD candidate is a token immediately followed by a reference, and is
// admitted only when no reference appears anywhere earlier on the line --
// which is what makes the two conditions mutually exclusive and a token's
// candidate unique. A reference can still collect two candidates (one on each
// side, in the "v1.0 `DOC.md` v2.0" shape); that contest is refused, not
// resolved.
function bindEntitiesOnLine(entities, line) {
  const groups = parenGroups(line);
  const candidates = [];
  // Why a given reference did not bind, keyed by its index in `entities`.
  // First cause recorded wins, except that `contested` is decided later and
  // overwrites: a candidate that formed and was then discarded is a more
  // specific account than any reason an earlier neighbour pairing failed.
  const cause = new Map();
  const note = (idx, c) => {
    if (!cause.has(idx)) cause.set(idx, c);
  };

  let sawDocBefore = false;
  for (let i = 0; i < entities.length; i++) {
    const a = entities[i];
    const b = entities[i + 1];
    if (b) {
      const docFirst = a.kind === 'doc' && b.kind === 'ver';
      const verFirst = a.kind === 'ver' && b.kind === 'doc';
      if (docFirst || verFirst) {
        const docPos = docFirst ? i : i + 1;
        if (verFirst && sawDocBefore) {
          note(docPos, 'backward-inadmissible');
        } else if (crossesOpaqueParen(line, groups, a, b)) {
          note(docPos, 'parenthetical-aside');
        } else if (!separatorIsPointerForm(line, a, b)) {
          note(docPos, 'separator-not-pointer-form');
        } else {
          candidates.push({ i: i, j: i + 1, docPos: docPos, doc: entities[docPos], tok: docFirst ? b : a });
        }
      }
    }
    if (a.kind === 'doc') sawDocBefore = true;
  }

  const uses = new Map();
  for (const c of candidates) {
    uses.set(c.i, (uses.get(c.i) || 0) + 1);
    uses.set(c.j, (uses.get(c.j) || 0) + 1);
  }
  const bindings = [];
  for (const c of candidates) {
    if (uses.get(c.i) === 1 && uses.get(c.j) === 1) bindings.push(c);
    else cause.set(c.docPos, 'contested');
  }
  return { bindings: bindings, cause: cause };
}

// Walks the live (non-masked, non-excluded) lines and returns:
//   pointers -- { line, entry, foundVersionRaw } per RESOLVED binding
//   silences -- one record per document reference that was NOT compared,
//               carrying the rule that silenced it, so a fixture can pin
//               WHICH rule declined and a reader can see every gap.
//
// A reference is disclosed only when that same document was not bound
// elsewhere on the same line: without that suppression a Markdown link whose
// text and target both match would disclose a document it just compared.
function collectPointers(maskedText, documentEntries) {
  const maskedLines = maskedText.split('\n');
  const excludedLines = revisionRecordExcludedLines(maskedLines);
  const matchCandidates = buildMatchCandidates(documentEntries);

  const pointers = [];
  const silences = [];

  for (let i = 0; i < maskedLines.length; i++) {
    const lineNo = i + 1;
    if (excludedLines.has(lineNo)) continue;
    const line = maskedLines[i];
    const entities = scanLineEntities(line, matchCandidates);

    const docCount = entities.filter((e) => e.kind === 'doc').length;
    if (docCount === 0 || entities.length - docCount === 0) continue;

    const result = bindEntitiesOnLine(entities, line);

    const resolvedPositions = new Set();
    const boundDocIdx = new Set();
    for (const b of result.bindings) {
      if (b.doc.docIdx === null) continue;
      resolvedPositions.add(b.docPos);
      boundDocIdx.add(b.doc.docIdx);
      pointers.push({
        line: lineNo,
        entry: documentEntries[b.doc.docIdx],
        foundVersionRaw: b.tok.raw
      });
    }

    for (let p = 0; p < entities.length; p++) {
      const e = entities[p];
      if (e.kind !== 'doc' || resolvedPositions.has(p)) continue;
      if (e.docIdx !== null && boundDocIdx.has(e.docIdx)) continue;
      silences.push({
        line: lineNo,
        column: e.start + 1,
        text: line.slice(e.start, e.end),
        reason: e.docIdx === null
          ? 'ambiguous-basename'
          : (result.cause.get(p) || 'no-adjacent-token')
      });
    }
  }

  return { pointers: pointers, silences: silences };
}

const SILENCE_REASON_TEXT = {
  'ambiguous-basename':
    'is a basename two different declared documents could equally claim, so ' +
    'it was attributed to neither',
  contested:
    'could be paired with a version token on either side of it, so both ' +
    'pairings were refused rather than one of them guessed',
  'parenthetical-aside':
    'sits inside a parenthesised aside and was therefore not allowed to ' +
    'reach a version token outside it',
  'separator-not-pointer-form':
    'is separated from the adjacent version token by text that is not a ' +
    'pointer form -- prose, sentence punctuation, or more than one ' +
    'table-cell boundary',
  'backward-inadmissible':
    'follows a version token that is itself preceded by another reference, ' +
    'so reading that token rightward onto this document was inadmissible',
  'no-adjacent-token':
    'has no version token adjacent to it'
};

function execute(input) {
  const manifestPathOpt =
    input && typeof input === 'object' && typeof input.manifest_path === 'string'
      ? input.manifest_path
      : null;
  const artifactPathOpt =
    input && typeof input === 'object' && typeof input.artifact_path === 'string'
      ? input.artifact_path
      : null;
  const options =
    input && typeof input === 'object' && input.options && typeof input.options === 'object'
      ? input.options
      : {};
  const versionAuthorityOpt =
    typeof options.version_authority === 'string' && options.version_authority.trim()
      ? options.version_authority.trim()
      : DEFAULT_VERSION_AUTHORITY;

  if (!manifestPathOpt) {
    return skipped('unavailable');
  }

  let manifestRaw;
  try {
    manifestRaw = readFileSyncRel(manifestPathOpt);
  } catch (e) {
    return skippedForFailedRead(e, 'manifest_path');
  }

  let manifestObj;
  try {
    manifestObj = JSON.parse(manifestRaw);
  } catch (e) {
    return skipped('unavailable');
  }

  // An unparseable CUSTOM selector resolves to no document entries at all --
  // never a silent fall-back to the default, which would honor a value the
  // caller never asked for. With no entries there are no assertions, and the
  // run degrades to skipped: not-applicable below.
  const selector = parseVersionAuthoritySelector(versionAuthorityOpt);
  const documentEntries = selector ? buildDocumentEntries(manifestObj, selector) : [];
  const assertedCount = documentEntries.filter((e) => e.versionRaw).length;

  if (assertedCount === 0) {
    return skipped('not-applicable');
  }

  if (!artifactPathOpt) {
    return skipped('unavailable');
  }

  let artifactRaw;
  try {
    artifactRaw = readFileSyncRel(artifactPathOpt);
  } catch (e) {
    return skippedForFailedRead(e, 'artifact_path');
  }

  const artifactRelPath = normalizePath(artifactPathOpt);
  const maskedText = maskFencedBlocks(artifactRaw);

  const scan = collectPointers(maskedText, documentEntries);
  const pointers = scan.pointers;

  const uncomparedLimits = scan.silences
    .slice()
    .sort((a, b) => (a.line - b.line) || (a.column - b.column) || cmpStr(a.reason, b.reason))
    .map((u) =>
      'Not compared -- ' + artifactRelPath + ':' + u.line + ':' + u.column +
      ": the reference to '" + u.text + "' " + SILENCE_REASON_TEXT[u.reason] +
      '. The line carries a version token, so this reference is enumerated ' +
      'here rather than silently dropped; it contributed nothing to this ' +
      'verdict.'
    );

  if (pointers.length === 0) {
    return {
      check: CHECK_SLUG,
      status: 'ran',
      skipped_reason: null,
      verdict: 'pass',
      findings: [],
      stated_limits: BASE_STATED_LIMITS.concat(uncomparedLimits),
      tool_versions: {}
    };
  }

  const comparable = pointers.filter((p) => p.entry.versionRaw);
  const uncomparable = pointers.filter((p) => !p.entry.versionRaw);

  if (comparable.length === 0) {
    return skipped('not-applicable');
  }

  const findings = [];
  for (const p of comparable) {
    if (normalizeVersion(p.entry.versionRaw) !== normalizeVersion(p.foundVersionRaw)) {
      findings.push(mkFinding(
        artifactRelPath, p.line, 'loose-pointer-version-drift', 'warn',
        `loose pointer to '${p.entry.declaredPath}' names version ` +
          `'${p.foundVersionRaw}', but the manifest asserts ` +
          `'${p.entry.versionRaw}' for that document`
      ));
    }
  }

  const sortedFindings = findings.slice().sort(findingComparator);

  const unassertedLimits = uncomparable
    .slice()
    .sort((a, b) => (a.line - b.line) || cmpStr(a.entry.declaredPath, b.entry.declaredPath))
    .map((p) =>
      `loose pointer to '${p.entry.declaredPath}' (${artifactRelPath}:${p.line}) names ` +
      `version '${p.foundVersionRaw}', but the manifest declares no version for that ` +
      'document; it is a recognized document reference and contributes nothing to this verdict'
    );

  const statedLimits = BASE_STATED_LIMITS.concat(uncomparedLimits, unassertedLimits);

  const verdict = sortedFindings.length ? 'warn' : 'pass';

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
  // Exit via process.exitCode, never process.exit(): an immediate exit can
  // discard asynchronously buffered stdout when it is a pipe, truncating the
  // one JSON envelope a harness reads. Setting exitCode lets the process end
  // naturally after the stream drains.
  let raw = null;
  try {
    raw = (!arg || arg === '-') ? fs.readFileSync(0, 'utf8') : fs.readFileSync(arg, 'utf8');
  } catch (e) {
    process.stderr.write('loose-pointer-drift: unable to read input\n');
    process.exitCode = 3;
  }

  if (raw !== null) {
    let parsedInput;
    let parsed = false;
    try {
      parsedInput = JSON.parse(raw);
      parsed = true;
    } catch (e) {
      process.stderr.write('loose-pointer-drift: malformed JSON input\n');
      process.exitCode = 3;
    }

    if (parsed) {
      const output = execute(parsedInput);
      process.stdout.write(JSON.stringify(output, null, 2) + '\n');

      // Deviation from the sibling wrapper, stated here rather than silently
      // transcribed: EXIT_CODES omits "fail" (manifest.exit_codes does too),
      // and the defensive fallback for an unrecognized verdict is warn's 10,
      // never the siblings' 20. This check's contract is that "fail" is
      // unreachable by design (method section 6.2 rule 1); falling back to
      // 20 would announce a fail exit code the orchestrator relays and never
      // overrides (FR-14, AC-15.1) for a check that must never produce one.
      // The branch is unreachable in a correct implementation either way --
      // this only decides what an impossible state looks like, and warn is
      // the honest answer for a warn-only check.
      const EXIT_CODES = { pass: 0, warn: 10 };
      let exitCode = 30;
      if (output.status !== 'skipped') {
        exitCode = Object.prototype.hasOwnProperty.call(EXIT_CODES, output.verdict) ? EXIT_CODES[output.verdict] : 10;
      }
      process.exitCode = exitCode;
    }
  }
}

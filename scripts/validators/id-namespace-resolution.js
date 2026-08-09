// INPUT: one JSON object on standard input or as a file argument, matching
//   the common validator input envelope (docs/validator-spec-sheet.md
//   section 2), with this check's shape (section 4, "ID-namespace
//   resolution"):
//     {
//       "check": "id-namespace-resolution",
//       "artifact_path": "cadence/candidate/solution-design.md",
//       "authority_document": "docs/design/EXAMPLE_AUTHORITY.md",
//       "references": { "id_namespaces": "cadence/references/id-namespaces.md" },
//       "options": {
//         "identifier_baseline": null,
//         "companion_documents": ["docs/design/EXAMPLE_COMPANION.md"]
//       }
//     }
//   artifact_path, authority_document, references.id_namespaces, every
//   entry of options.companion_documents, and options.identifier_baseline
//   (when it is a string) are all resolved relative to the current working
//   directory (the repository root), never relative to this script or to
//   the input file itself, exactly as every other check's artifact_path is
//   (section 2), and every one of them is CONSTRAINED to the repository
//   root: a resolved path that escapes the root (an absolute path, or a
//   "../" traversal) is refused unread and degrades the run closed to
//   "skipped: unavailable", carrying its OWN stated_limits sentence naming
//   the envelope field that was refused -- a refusal and an unreadable file
//   are different facts, and an envelope that cannot tell them apart cannot
//   be used to prove the root constraint fired. The input envelope is
//   untrusted data, and this check echoes definition text it read into its
//   finding messages, so a path that escapes the checkout is an
//   information-disclosure path and is never followed (and the offending
//   path is never echoed back). A missing artifact_path, authority_document, or
//   references.id_namespaces, or any of those being unreadable, produces
//   "skipped: unavailable" (degrade closed) -- resolution has no target
//   without them. A references.id_namespaces file carrying no parseable
//   reserved-prefix table is likewise "skipped: unavailable": with no
//   declared namespace there is nothing for a token to resolve into, and
//   reporting that state as a pass would be a defect (NFR-6).
//
//   Only artifact_path is scanned for identifier USE, and only for tokens
//   IN SCOPE. A token is in scope when its shape is "PREFIX-N(.M)*" (one to
//   four uppercase letters, a dash, a dotted number, e.g. "FR-10",
//   "AC-9.5") or the dashless "QN" form (e.g. "Q2") AND its prefix is one
//   the reserved section 3.2 prefix table in references.id_namespaces
//   actually declares. A standards reference in prose whose prefix that
//   table never reserves ("RFC-2119", "ISO-8601", "SHA-256", "UTF-8") is
//   not an identifier of this namespace: it is neither resolved nor
//   reported. "P1" through "P7" are Constitution principles, not
//   identifiers, and never match the token grammar at all. A token inside a
//   fenced code block, or inside an inline backticked span that opens and
//   closes on the SAME line, is masked out before scanning, so a backticked
//   file path is never read as an identifier. An inline span is bounded to
//   one line deliberately: a span pattern free to cross a line break lets a
//   single UNPAIRED backtick in prose pair with a backtick many lines later
//   and blank everything between them, which deletes the text this check
//   reads and reports the resulting emptiness as a pass -- a one-character
//   formatting quirk disabling a fail-severity safeguard, which is exactly
//   the NFR-6 defect this check exists to catch.
//
//   That masking is CommonMark-faithful, and it errs in BOTH directions.
//   Neither direction is contained, and the stated limits say so rather than
//   promising a containment the code does not deliver:
//     * OVER-report. A code span that really does wrap across a line break
//       is not masked here, so a token or a table row inside it is read as
//       live text and may be reported.
//     * UNDER-report. An unpaired backtick pairs with the NEXT backtick on
//       its own line, so whatever sits between them -- an identifier use, a
//       BOLD DEFINITION, a table cell -- is masked and never scanned. A
//       definition that is never scanned is never counted, so a token
//       defined twice with one of the two masked away is not reported
//       ambiguous -- and ambiguous-identifier-definition is the finding
//       code the registry records as this check's own known-bad case. A
//       Markdown renderer does the same thing with the same input; a
//       document carrying an unpaired backtick is malformed Markdown, not a
//       document this check reads differently from the way it renders.
//   The one-line bound does not remove the under-report; it CAPS it at the
//   line the stray backtick sits on instead of letting it run to the end of
//   the file.
//
//   A DEFINITION is a bold occurrence of an in-scope token, "**TOKEN**",
//   found in authority_document or in a companion from
//   options.companion_documents that authority_document's own effective
//   (masked) text admits by naming that companion's basename as a whole
//   filename -- resolution runs through the authority document, never
//   through a hardcoded companion list (FR-10). "notcompanion.md" does not
//   admit "companion.md", and a mention that survives only inside a fenced
//   code block or an inline code span admits nothing. An undeclared
//   companion is never read. Every occurrence is recorded, not
//   deduplicated into a set, so a token defined twice is detectable --
//   and the single-definition rule is applied to the DEFINITIONS
//   themselves, so a token defined twice fails whether or not the artifact
//   happens to cite it (AC-12.4).
//
//   Reserved section 3.2 prefixes and their declared meanings are read
//   from references.id_namespaces (never hardcoded); a reserved prefix
//   actually cited in the artifact is checked against any redeclaration of
//   that same prefix's meaning inside authority_document. In BOTH documents
//   that read is bounded to the document's own RESERVED-PREFIX SECTION,
//   chosen mechanically from the fence-masked text so that the bound is a
//   property of the document rather than of the order its headings happen to
//   appear in:
//     1. Every ATX heading ("## Title") is enumerated with its level. ATX
//        ONLY: a setext heading (a title underlined with "=" or "-") is not
//        recognised, so a reserved section headed the setext way is not
//        found. That is a deliberate simplification, and it degrades toward
//        NOT CLAIMING in both places it can bite: references.id_namespaces
//        with no surviving candidate becomes "skipped: unavailable", and an
//        authority_document with none redeclares nothing. Recognising setext
//        requires deciding which paragraph lines may carry an underline,
//        which is CommonMark block parsing; the attempt at it produced a
//        confirmed silent pass (a document opening with a thematic break had
//        every heading under it swallowed as front matter) and six guards no
//        fixture could pin. Which heading forms may carry a definition is
//        the open definition-grammar question tracked as issue #78, and it
//        is answered there rather than emulated here.
//     2. A heading is a CANDIDATE when its title BEGINS with the section
//        number 3.2 -- optionally after ONE leading section word from the
//        closed list "§", "section", "sec", "sec.", "clause", "part", which
//        is how a numbered heading is commonly written -- or when its title
//        names the identifier-prefix / identifier-namespace table itself.
//        The number test is ANCHORED, so "13.2", "3.2.1", "3.21", and
//        "Migration notes from 3.2 to 4.0" are not section 3.2.
//     3. Each candidate's range runs to the next heading of the same or
//        higher level.
//     4. A candidate whose range holds no parseable prefix-table row is
//        DISCARDED. This is what keeps a heading such as "3.2 Non-functional
//        requirements" -- a real section 3.2 in a document that numbers its
//        sections differently -- from binding the parse to a section that
//        declares no prefixes and so hiding the real table.
//     5. Among survivors a number match beats a title match; otherwise the
//        MOST SPECIFIC (smallest) range wins, ties broken by the earlier
//        heading. Preferring the smallest range is what makes a document
//        whose H1 names the namespace bind to the inner "## Default
//        identifier prefixes" heading that actually carries the table,
//        rather than to the whole file -- an outer bound that excluded
//        nothing would be a bound in name only.
//   A prefix table sitting outside the chosen section, or inside a fenced
//   code EXAMPLE, therefore declares nothing: without that bound the first
//   matching table anywhere in the file would silently set the namespace
//   scope. references.id_namespaces with no surviving candidate is
//   "skipped: unavailable" (degrade closed, never a fallback to
//   whole-document parsing); an authority_document with no surviving
//   candidate simply redeclares nothing, which is a stated limit, not a
//   check that could not run.
//
//   The text that parse reads is masked for FENCED code blocks and nothing
//   else. An example table is written as a fenced block, which is masked; a
//   table row wrapped in INLINE backticks as an illustration is read as a
//   live declaration and may declare a prefix its author meant only to show.
//   That is an OVER-report -- the visible direction, an arguable finding
//   rather than a silent pass -- and it is the deliberate residual of not
//   emulating CommonMark inline-code semantics inside this parse. Indented
//   (four-space) code blocks are not masked anywhere in this check either.
//
//   The stability half (identifier reuse / renumbering) runs only when
//   options.identifier_baseline is a non-null string naming a JSON file
//   (repository-root-relative) of the shape
//   { "identifiers": { "<token>": { "definition": "<the canonical MEANING
//   text authority_document or a companion bound to that number -- the
//   defining line with its own bold token stripped out, so the same
//   meaning under a different token can be detected as a renumber>" } } }.
//   Its stated_limits sentence is written from the baseline input actually
//   received and never overstates it: an absent field, a null baseline, a
//   baseline field that is neither null nor a string, and a readable
//   baseline recording no identifier entries each produce their own
//   distinct sentence, and only a run that really compared at least one
//   recorded identifier says so. A baseline file whose "identifiers" value
//   is MALFORMED -- a string, an array, or an object with an entry that is
//   not an object carrying a string "definition" -- is not silently read as
//   an empty comparison: it degrades the run closed to "skipped:
//   unavailable", because reporting a check that could not run as compared,
//   empty, or passed is exactly the defect NFR-6 forbids. An ABSENT or
//   validly EMPTY "identifiers" object is a different state: the stability
//   half ran and compared nothing, and says so. Never-reused
//   and never-renumbered are properties of a history, not of a snapshot,
//   so this half is never folded into the pass (NFR-6). Reuse and renumber
//   are scanned INDEPENDENTLY: one edit can both rebind a baseline token to
//   a new definition and move that token's recorded definition onto another
//   token, and reporting only the first half would report half the truth.
//
//   An artifact carrying no in-scope identifier token at all (after
//   masking) produces "skipped: not-applicable" (verdict null); the whole
//   check is inapplicable, not merely its resolution half.
//
// USAGE: node id-namespace-resolution.js <input.json|->
//   Reads the input envelope from the named file, or from standard input
//   when the argument is "-" or omitted. Prints the common output envelope
//   (section 2) as JSON to standard output. Exit codes: pass=0, warn=10,
//   fail=20, skipped=30 (either reason); exit 3 if the input itself could
//   not be read or parsed as JSON.
'use strict';

const fs = require('fs');
const path = require('path');

const CHECK_SLUG = 'id-namespace-resolution';

const manifest = {
  check: CHECK_SLUG,
  description:
    'ID-namespace resolution: verifies that every identifier used in a ' +
    'governed artifact resolves through the authority document (or a ' +
    'companion it names) to exactly one canonical definition, that ' +
    'reserved section 3.2 prefixes carry their declared meanings, and ' +
    'that no identifier is reused or renumbered relative to a recorded ' +
    'baseline (FR-10, AC-9.2, AC-12.4).',
  verdicts: ['pass', 'warn', 'fail'],
  skip_reasons: ['not-applicable', 'unavailable'],
  exit_codes: { pass: 0, warn: 10, fail: 20, skipped: 30 },
  finding_codes: [
    'unresolvable-identifier',
    'ambiguous-identifier-definition',
    'reserved-prefix-remeaning',
    'identifier-reused',
    'identifier-renumbered',
    'dangling-definition'
  ]
};

const BASE_STATED_LIMITS = [
  'Only a token whose prefix the reserved section 3.2 table in ' +
    'references.id_namespaces actually declares is treated as an ' +
    'identifier of this namespace; a prose token with an undeclared ' +
    'prefix (a standards reference such as an RFC or ISO number) is ' +
    'neither resolved nor reported.',
  'An identifier is treated as defined only where it appears bold ' +
    '("**PREFIX-N**" or "**QN**") in the authority document or in a ' +
    "companion the authority document's own text names by basename; a " +
    'plain mention elsewhere is not treated as a definition.',
  'A companion document is admitted to the resolution namespace only when ' +
    "the authority document's own effective text names that companion's " +
    'basename as a whole filename; a longer name that merely ends with it, ' +
    'and a mention surviving only inside a code block or code span, admit ' +
    'nothing, and an undeclared companion is never consulted (FR-10).',
  'P1 through P7 are Constitution principles, not PREFIX-N identifiers, ' +
    'and never match the identifier token grammar; a token inside a ' +
    'fenced code block, or inside an inline code span recognised by the ' +
    'one-line rule the next limit states, is masked before scanning and ' +
    'is not read as an identifier.',
  'That masking is bounded to one line: an inline code span is recognised ' +
    'only where it opens and closes on the SAME line, because a span ' +
    'pattern free to cross a line break lets one unpaired backtick in ' +
    'prose pair with a backtick many lines later and blank every line ' +
    'between them, silently deleting the text this check reads and ' +
    'reporting the emptiness as a pass.',
  'Masking errs in BOTH directions and neither direction is contained. ' +
    'Content can be OVER-reported: a code span that really does wrap across ' +
    'a line break is not masked, so an identifier token or a table row ' +
    'inside it is read as live text. Content can equally be UNDER-reported: ' +
    'an unpaired backtick pairs with the next backtick on its own line, so ' +
    'an identifier use, a bold DEFINITION, or a table cell between the two ' +
    'is masked and never scanned. A use that is never scanned is never ' +
    'reported; a definition that is never scanned is never counted, so a ' +
    'token defined twice with one of the two masked away is not reported ' +
    'ambiguous, and ambiguous-identifier-definition is the very finding ' +
    "code the registry records as this check's known-bad case. A document " +
    'carrying an unpaired backtick is malformed Markdown and a Markdown ' +
    'renderer reads it the same way; the one-line bound does not remove ' +
    'that under-report, it caps it at the line the stray backtick sits on ' +
    'instead of letting it run to the end of the file.',
  'The dashless QN half of the token grammar cannot tell an open-question ' +
    'identifier from calendar or fiscal prose: where the reserved table ' +
    'declares the bare "Q" prefix, a phrase such as "Q4 2026" or "Q3" in ' +
    'the artifact is scanned as an identifier use and, resolving to no ' +
    'definition, is reported unresolvable; backtick such a phrase to ' +
    'exclude it.',
  'A reserved section 3.2 prefix is compared against a redeclaration of ' +
    'that same prefix inside the authority document only when the ' +
    "artifact actually cites an identifier of that prefix, and only the " +
    "prefix table inside a document's own reserved-prefix section is read. " +
    'That section is chosen mechanically from ATX headings ("## 3.2 ...") ' +
    'and from nothing else: a heading whose title BEGINS with the section ' +
    'number 3.2, optionally after ONE leading section word from the closed ' +
    'list "§", "section", "sec", "sec.", "clause", "part" (so "Section ' +
    '3.2", "Sec. 3.2", "Clause 3.2", "Part 3.2" and "§ 3.2" bind and no ' +
    'other leading word does), and every heading whose title names the ' +
    'identifier-prefix or identifier-namespace table, is a candidate ' +
    'running to the next heading of the same or higher level; a candidate ' +
    'whose range holds no parseable prefix-table row is discarded; a number ' +
    'match is preferred over a title match, and otherwise the smallest ' +
    'range wins, ties broken by the earlier heading. "13.2", "3.2.1", ' +
    '"3.21", and a heading that merely mentions 3.2 later in its title such ' +
    'as "Migration notes from 3.2 to 4.0" are not section 3.2 and bind ' +
    'nothing, and a numbered heading such as "3.2 Non-functional ' +
    'requirements" that declares no prefix table is discarded. A table ' +
    'outside the chosen section, and a table inside a fenced code example, ' +
    'declare nothing, and an authority document with no surviving candidate ' +
    'redeclares nothing and is not flagged.',
  'Only ATX headings are recognised. A setext heading -- a title underlined ' +
    'with "=" or "-" -- is not read as a heading at all, so a reserved ' +
    'section headed the setext way is not found: references.id_namespaces ' +
    'with no surviving candidate degrades the run closed to skipped: ' +
    'unavailable, and an authority document with none redeclares nothing. ' +
    'Both directions fail toward NOT CLAIMING rather than toward a silent ' +
    'pass over a live table, and which heading forms may carry a definition ' +
    'is the open definition-grammar question tracked as issue #78.',
  'The text the reserved-prefix table is parsed from is masked for FENCED ' +
    'code blocks and for nothing else. A table row wrapped in INLINE ' +
    'backticks as an illustration is therefore read as a live declaration ' +
    'and may declare a prefix its author meant only to show. That is an ' +
    'OVER-report -- an arguable finding rather than a silent pass -- and it ' +
    'is the accepted residual of not emulating CommonMark inline-code ' +
    'semantics inside this parse; an example table written the ordinary ' +
    'way, as a fenced block, is masked and declares nothing.',
  'Indented (four-space) code blocks are never masked anywhere in this ' +
    'check: a prefix-shaped table indented four spaces is read as a live ' +
    'declaration, and an identifier-shaped token inside an indented code ' +
    'block is read as a live use.',
  'Only artifact_path is scanned for identifier use; the authority ' +
    'document, its declared companions, and the id_namespaces reference ' +
    'are read solely to build the resolution namespace and are never ' +
    'themselves scanned for outgoing identifier use.',
  'Every path in the input envelope is resolved beneath the repository ' +
    'root and refused unread when it escapes it, so an absolute path or a ' +
    '"../" traversal in the envelope degrades the run closed to skipped: ' +
    'unavailable rather than reading a file outside the checkout; the ' +
    'containment test also resolves symbolic links: fs.realpathSync is ' +
    'applied to both the target and the repository root before the same ' +
    'containment test is re-applied, so a symbolic link that lives inside ' +
    'the checkout and resolves outside it is refused too, before it is ' +
    'read; a dangling symlink -- one whose target does not exist -- is ' +
    'not a refusal and is reported as the ordinary missing-file outcome ' +
    'instead.'
];

// The one signal that tells a REFUSAL apart from an unreadable file. Both
// degrade the run closed to "skipped: unavailable" -- the spec's skip-reason
// set has no dedicated value for a refusal and this check does not invent one
// -- so without a distinguishing sentence the two states emit byte-identical
// envelopes, and a fixture aimed at the root constraint would pin nothing: it
// would pass just as well against a build with the constraint deleted, since
// a path outside the checkout is usually unreadable anyway. The sentence
// names the ENVELOPE FIELD that was refused, never the path it carried: that
// path is untrusted input, and echoing it back into the output would leak the
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

const STABILITY_SKIP_NULL_SENTENCE =
  'The stability half (never-reused, never-renumbered) is skipped: ' +
  'not-applicable because options.identifier_baseline is null; never-' +
  'reused and never-renumbered are properties of a history, not of a ' +
  'snapshot, so this half is never folded into the pass (NFR-6).';

const STABILITY_SKIP_ABSENT_SENTENCE =
  'The stability half (never-reused, never-renumbered) is skipped: ' +
  'not-applicable because options.identifier_baseline is absent from the ' +
  'input; no baseline was read and no identifier was compared, so this ' +
  'half is never folded into the pass (NFR-6).';

function stabilitySkipUnusableSentence(typeName) {
  return (
    'The stability half (never-reused, never-renumbered) is skipped: ' +
    'not-applicable because options.identifier_baseline is not a string ' +
    'naming a baseline file (a value of type ' + typeName + ' was ' +
    'supplied); no baseline was read and no identifier was compared, so ' +
    'this half is never folded into the pass (NFR-6).'
  );
}

const STABILITY_BASELINE_MALFORMED_SENTENCE =
  'The stability half is skipped: unavailable because the file named by ' +
  'options.identifier_baseline carries no usable "identifiers" object (it ' +
  'must be absent, or an object -- never an array -- whose every entry is ' +
  'an object carrying a string "definition"); no identifier was compared, ' +
  'and because a check that could not run is never reported as compared, ' +
  'empty, or passed (NFR-6), the whole run degrades closed.';

const STABILITY_NOTHING_COMPARED_SENTENCE =
  'The stability half read the baseline file named by options.identifier_' +
  'baseline, but that file records no identifier entries (its ' +
  '"identifiers" object is absent or empty); no identifier was compared, ' +
  'so this run establishes nothing about reuse or renumbering and that ' +
  'half is never folded into the pass (NFR-6).';

function stabilityRanSentence(comparedCount) {
  return (
    'The stability half ran against the supplied options.identifier_' +
    'baseline, comparing the canonical definition text of every identifier ' +
    'that baseline records (' + comparedCount + ' entr' +
    (comparedCount === 1 ? 'y' : 'ies') + ') against its current binding ' +
    'for reuse and renumbering.'
  );
}

const IDENTIFIER_RE = /\b([A-Z]{1,4}-\d+(?:\.\d+)*|Q\d+)\b/g;
const DEF_RE = /\*\*([A-Z]{1,4}-\d+(?:\.\d+)*|Q\d+)\*\*/g;

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

function normText(t) {
  return String(t).trim().replace(/\s+/g, ' ').toLowerCase();
}

function mkFinding(p, line, code, severity, message) {
  return { path: normalizePath(p), line: line, code: code, severity: severity, message: message };
}

// A TOTAL order over findings. Path, line, and code are not enough to
// separate every pair this check can emit: two baseline tokens recorded with
// the same definition text both lose their binding when that text moves onto
// one new token, and each emits its own identifier-renumbered finding at that
// token's single location. Both are true and neither is dropped -- suppressing
// one would silently discard the fact about one of the two baseline tokens,
// and which one it discarded would be arbitrary. Sorting on the message as
// the last key makes their order a property of the findings rather than of
// the sort's stability guarantee, which is what FR-8 asks for.
//
// That last key is a TOTALITY GUARANTEE, not an observable rule, and no
// fixture in this pack pins it -- deliberately, because none can. Every
// emission loop in execute() already walks its keys in ascending cmpStr order
// (used tokens, defined tokens, cited prefixes, baseline tokens), and every
// message template leads with the very key that loop is walking, quoted. The
// quote character (0x27) sorts below every character a key can continue with
// (0x2D "-", 0x2E ".", 0x30-0x39 digits, 0x41+ letters), so a key that is a
// strict prefix of another still sorts first inside the message. Message order
// therefore equals emission order for every pair of findings this check can
// produce that shares a path, a line, and a code -- which makes the key
// unobservable by construction and unpinnable by a fixture. It is kept anyway:
// it costs one comparison and it removes the dependence on Array#sort's
// stability, so a future finding whose message does NOT lead with its sort key
// is ordered by the findings rather than by the engine.
function findingComparator(a, b) {
  return cmpStr(a.path, b.path) || (a.line - b.line) || cmpStr(a.code, b.code) ||
    cmpStr(a.message, b.message);
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
// partial result, or an uncaught crash. This matters beyond file access:
// finding messages echo definition text read from these files, so an
// unconstrained resolve is an information-disclosure path out of the
// checkout, not merely a read of the wrong file. Two passes: first a cheap
// LEXICAL test (path.relative against ".."); then, on success, a REALPATH
// test that resolves both the root and the target with fs.realpathSync and
// re-applies the same containment test to the resolved values, so a
// symbolic link that lives inside the checkout and points outside it is
// refused too, before any read or execution. The root is realpathed
// defensively (falling back to the lexical root if that throws) so a
// checkout reached through a symlinked parent -- /tmp -> /private/tmp on
// macOS, a symlinked worktree parent -- is never self-refused. realpathSync
// throws ENOENT on a non-existent path, including a dangling symlink's
// target: that is the ordinary missing-file case, not a refusal, so it
// returns the lexical target unresolved and lets the caller's existing
// missing-file handling degrade it exactly as before; every OTHER errno
// (ELOOP, EACCES, ENOTDIR, ...) is rethrown UNTAGGED so the caller degrades
// closed as a failed read, never as a containment refusal and never as a
// crash. Both passes throw the SAME TAGGED err.pathEscapesRoot on an escape,
// so the caller can report a refusal distinctly from a failed read; an
// untagged throw would be indistinguishable from ENOENT in the output
// envelope, which is what made the earlier path-escape fixtures unable to
// pin the constraint they were named for. Character-identical in all four
// guarded validators (link-integrity.js, cross-reference-integrity.js,
// gate-self-test.js, id-namespace-resolution.js) by contract -- containment
// semantics must stay uniform across them.
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
// root constraint actually fired. `field` names the envelope key that carried
// the path, never the path itself.
function skippedForFailedRead(err, field) {
  if (err && err.pathEscapesRoot) {
    return skipped('unavailable', BASE_STATED_LIMITS.concat([pathRefusedSentence(field)]));
  }
  return skipped('unavailable');
}

// Replaces every fenced code block with equal-length blanks (newlines
// preserved), matching link-integrity.js's maskFencedBlocks discipline, so
// an identifier-shaped token inside a code example is never scanned as a
// live use, and surviving matches keep accurate line numbers.
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

// One BALANCED inline code span that opens and closes on the SAME line. The
// body is [^\n]*?, never [\s\S]*?, and that is the whole point: a span
// pattern free to cross a line break lets a single UNPAIRED backtick in prose
// pair with a backtick many lines later, blanking every line between them.
// Whatever those lines held -- an identifier use, a reserved-prefix table
// row -- silently disappears from the scan, and the check reports the
// emptiness it manufactured as a pass. Refusing to cross a line break bounds
// that damage to the line the stray backtick sits on. The cost is the
// opposite error, and it is deliberately the visible one: a CommonMark code
// span that really does wrap across a line break is not masked here, so a
// token inside it is read as live text and may be over-reported. A false
// finding is arguable and gets fixed; a false pass is invisible (NFR-6).
const INLINE_CODE_SPAN_RE = /(?<!`)(`+)[^\n]*?\1(?!`)/g;

// Replaces every same-line inline code span with equal-length blanks, after
// fenced blocks are already masked, so a backticked file path is never
// mistaken for an identifier token. Line structure is untouched, so reported
// line numbers stay whole-file accurate.
function maskInlineCode(text) {
  return text.replace(INLINE_CODE_SPAN_RE, (m) => m.replace(/[^\n]/g, ' '));
}

function maskExcluded(text) {
  return maskInlineCode(maskFencedBlocks(text));
}

function lineAt(text, idx) {
  let line = 1;
  for (let i = 0; i < idx; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

function prefixOf(token) {
  if (/^Q\d+$/.test(token)) return 'Q';
  const dash = token.indexOf('-');
  return dash > 0 ? token.slice(0, dash + 1) : token;
}

// A heading whose title BEGINS with method section number 3.2. Anchored at
// the start of the title, and that anchor is load-bearing: an unanchored
// "contains 3.2 somewhere" test matches "Migration notes from 3.2 to 4.0"
// and, worse, "3.2 Non-functional requirements" in a document that numbers
// its own sections -- binding the parse to a section that declares no
// prefixes, which excludes the real table and turns a genuine remeaning into
// a silent pass. The lookaheads keep "3.21" and "3.2.1" out while allowing
// the "3.2." numbering style.
//
// The anchor is at the start of the NUMBER, not at the start of the title: a
// leading section word is allowed to precede it, because "## Section 3.2
// Reserved prefixes" and "## § 3.2 Reserved prefixes" are ordinary ways to
// write a numbered heading and a rule that only accepted a bare leading
// number would bind nothing in such a document -- silently narrowing the
// parse back to "this document redeclares nothing", which is the same
// silent-pass failure the anchor exists to prevent. The word list is CLOSED
// and is exactly "§", "section", "sec", "sec.", "clause", "part", matched
// case-insensitively -- printed here rather than described, so a reader can
// tell which leading words bind without reading the pattern. Each alternative
// is followed by the number itself, so "Sections 3.2 and 3.3" (a
// cross-reference, not a section title) and "Section 13.2" still do not match.
const RESERVED_SECTION_NUMBER_RE =
  /^(?:(?:§|section|sec\.?|clause|part)\s*)?3\.2(?!\d)(?!\.\d)/i;
// A heading whose title names the reserved prefix table itself. This admits a
// document that restates method section 3.2 under its own title and never
// prints the number -- the shipped seeded reference
// (skills/cadence-method/references/id-namespaces.md) is exactly that
// document, and a rule that bound only on the literal "3.2" would make this
// check unavailable against its own seeded reference in every project. Note
// that BOTH that file's H1 ("Identifier Namespaces -- CADENCE Method
// Reference") and its "## Default identifier prefixes" heading match this
// pattern; which of the two wins is decided by chooseReservedSection, not
// here.
const RESERVED_SECTION_TITLE_RE = /identifier[\s-]+(prefix|namespace)|prefix[\s-]+table|namespace[\s-]+table/i;

// Every ATX heading ("## Title") in already-masked text, with its level and
// its own line index. Because the text is already fence-masked, a "#" inside
// a fenced code example is not read as a heading.
//
// ATX ONLY, deliberately. Setext headings are not recognised, and this
// function is where an earlier attempt to recognise them lived. Deciding
// which paragraph lines may carry a "=" or "-" underline is CommonMark block
// parsing -- the underline has to be told apart from a thematic break, a
// table delimiter row, a list bullet, a front-matter terminator, and an
// indented code line -- and the attempt at it shipped a confirmed silent
// pass: a document opening with a thematic break had every heading below it
// swallowed as "front matter", so a live remeaning returned a clean pass.
// Not recognising setext at all cannot do that. It fails toward NOT CLAIMING
// in both places it can bite -- references.id_namespaces with no surviving
// candidate degrades closed to "skipped: unavailable", and an authority
// document with none redeclares nothing -- and the heading-form question
// belongs to the definition-grammar decision tracked as issue #78.
function documentHeadings(maskedLines) {
  const out = [];
  for (let i = 0; i < maskedLines.length; i++) {
    const bare = maskedLines[i].replace(/\r$/, '');
    const atx = /^ {0,3}(#{1,6})[ \t]+(.*)$/.exec(bare);
    if (!atx) continue;
    out.push({ index: i, level: atx[1].length, title: atx[2].trim() });
  }
  return out;
}

// Parses the prefix -> meaning pairs declared by the table rows inside the
// half-open line range [start, end) of already-masked text. The table carries
// two "prefix, meaning" column pairs per row, each prefix cell backticked
// (e.g. "`FR-`" or "`Q`"); a header row's plain-text cells never match the
// backtick pattern and are skipped naturally. Within the range the FIRST
// occurrence of a prefix owns its recorded meaning. Line numbers are
// whole-file, not range-relative, so a finding still points at the real line.
// This is the SINGLE definition of "a parseable prefix-table row": both the
// candidate-discard test and the final parse call it, so a range can never be
// chosen on evidence the parse then disagrees with.
function parsePrefixRowsIn(lines, start, end) {
  const map = new Map();
  for (let i = start; i < end; i++) {
    const line = lines[i];
    if (line.indexOf('|') === -1) continue;
    const cells = line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
    for (let j = 0; j < cells.length - 1; j++) {
      const m = /^`([A-Za-z]{1,4}-|Q)`$/.exec(cells[j]);
      if (!m) continue;
      const prefix = m[1];
      const meaning = cells[j + 1];
      if (meaning && !/^-+$/.test(meaning) && !map.has(prefix)) {
        map.set(prefix, { meaning: meaning, line: i + 1 });
      }
    }
  }
  return map;
}

// Chooses the document's reserved-prefix section, returning { start, end,
// byNumber, meanings } or null when the document declares no such section.
//
// Every heading that could name the section is treated as a CANDIDATE and
// then tested against the document's actual content, rather than the first
// syntactic match winning outright. Two failures make that necessary, and
// both are silent-pass failures:
//
//   * A heading can name section 3.2 and declare no prefixes at all. A
//     document that numbers its own sections has "3.2 Non-functional
//     requirements"; binding there EXCLUDES the real prefix table, so a
//     genuine remeaning goes unreported. Requiring a candidate's range to
//     contain a parseable prefix row discards it.
//   * A heading can name the namespace and bind nothing. The shipped seeded
//     reference's H1 is "Identifier Namespaces -- CADENCE Method Reference"
//     and is the only level-1 heading in the file, so its range is
//     [start-of-file, EOF): a bound that excludes nothing, under which a
//     decoy table in a later appendix still injects its prefix into the
//     namespace scope. Preferring the SMALLEST surviving range binds that
//     file to its "## Default identifier prefixes" H2 instead, which is the
//     heading that actually carries the table.
//
// A number match still beats a title match, so a document carrying both a
// legacy "identifier namespaces" section and a real numbered section 3.2 --
// each with a table -- binds to the numbered one. Ordering is total and
// content-independent (number-before-title, then smaller range, then earlier
// heading), so the choice is deterministic (FR-8).
//
// Neither preference is protective in itself, and neither should be read as
// though it were. Both are CONTENT-BLIND tie-breaks over candidates that have
// already proved they declare SOMETHING; which of them declares the truth is
// not a question this function can answer:
//   * Smallest-range-wins prefers the tightest declaration, which is right for
//     the shipped reference (H1 over the whole file vs the H2 that carries the
//     table) and wrong for a document that puts a narrow decoy table under a
//     namespace-titled subheading and its real declaration under a wider one.
//     A tighter decoy beats a wider real declaration.
//   * Number-beats-title prefers a heading that names section 3.2, which is
//     wrong whenever the numbered section carries a prefix-SHAPED table that
//     is not the declaration -- it will beat the title-named section that
//     really is.
// What actually keeps the bind honest is step 4, the discard of a candidate
// whose range declares nothing, plus the refusal to widen back to the whole
// document. These two keys only decide which surviving declaration is read,
// deterministically. A document with two competing real declarations is
// ambiguous, and this check reports the one these keys select rather than
// detecting the ambiguity.
function chooseReservedSection(maskedLines) {
  const headings = documentHeadings(maskedLines);
  const candidates = [];
  for (let k = 0; k < headings.length; k++) {
    const h = headings[k];
    const byNumber = RESERVED_SECTION_NUMBER_RE.test(h.title);
    const byTitle = RESERVED_SECTION_TITLE_RE.test(h.title);
    if (!byNumber && !byTitle) continue;
    let end = maskedLines.length;
    for (let j = k + 1; j < headings.length; j++) {
      if (headings[j].level <= h.level) { end = headings[j].index; break; }
    }
    const meanings = parsePrefixRowsIn(maskedLines, h.index, end);
    if (meanings.size === 0) continue;
    candidates.push({ start: h.index, end: end, byNumber: byNumber, meanings: meanings });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) =>
    (a.byNumber === b.byNumber ? 0 : (a.byNumber ? -1 : 1)) ||
    ((a.end - a.start) - (b.end - b.start)) ||
    (a.start - b.start)
  );
  return candidates[0];
}

// The reserved-prefix table's prefix -> meaning pairs, bounded to the
// document's chosen reserved-prefix section and read from FENCE-masked text.
// Returns null when no candidate section survived -- distinct from an empty
// map, and the caller decides what that means. No caller widens the parse
// back to the whole document. Because a candidate with no parseable row is
// discarded, a non-null result always carries at least one prefix.
//
// Fenced masking is ALL the masking this parse gets, and that is the whole
// answer to "mask code before parsing that range". An example table is
// written as a fenced block; fences are already masked, and that masking has
// never been the source of a defect here. Inline spans are deliberately not
// masked: the reserved-table grammar is DEFINED in terms of the backticks
// around a prefix cell ("`FR-`"), so blanking inline spans would erase the
// very cells this parse reads, and every attempt to blank only the
// illustrative ones -- to decide which line is "a row wrapped in backticks"
// without implementing CommonMark -- produced a new silent pass. The residual
// is that a table row wrapped in inline backticks DECLARES its prefixes. That
// is an OVER-report, the visible direction, which is the safe way for a gate
// check to be wrong, and it is disclosed in stated_limits as such.
function parseMeaningsByPrefix(text) {
  const lines = maskFencedBlocks(text).split(/\r?\n/);
  const section = chooseReservedSection(lines);
  return section ? section.meanings : null;
}

// Validates the shape of a recorded baseline before any comparison is drawn
// from it. Returns the identifiers object, or null when the file is
// malformed. An ABSENT "identifiers" key is valid and means "records
// nothing"; a string, an array, or an entry that is not an object carrying a
// string "definition" is malformed, and the caller degrades closed rather
// than reporting a comparison that never happened (NFR-6).
function baselineIdentifiersOf(baseline) {
  if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline)) return null;
  const ids = baseline.identifiers;
  if (typeof ids === 'undefined') return {};
  if (!ids || typeof ids !== 'object' || Array.isArray(ids)) return null;
  for (const key of Object.keys(ids)) {
    const entry = ids[key];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
    if (typeof entry.definition !== 'string') return null;
  }
  return ids;
}

// True when `text` names `base` as a WHOLE filename: the character before it
// may not continue a filename (so "notcompanion.md" never admits
// "companion.md", while "docs/design/companion.md" does), and the character
// after it may not continue the extension (so "companion.mdx" does not admit
// "companion.md"). A trailing sentence period is allowed. The caller passes
// masked text, so a mention surviving only inside a code block or code span
// admits nothing.
function namesFileWhole(text, base) {
  const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(^|[^A-Za-z0-9._\\-])' + esc + '(?![A-Za-z0-9_\\-])');
  return re.test(text);
}

// Scans masked text for every bold "**TOKEN**" definition of an IN-SCOPE
// token, recording EVERY occurrence (never deduplicated) keyed by token, so
// a token defined twice is detectable rather than silently collapsed into a
// set. Records both the full line ("text", used in finding messages) and the
// line with its own bold token stripped out once ("body", the canonical
// MEANING bound to that number, used for the stability comparison) --
// comparing "text" instead would always differ between two distinct tokens
// by construction, which would make a renumber undetectable.
function collectDefinitions(rawText, relPath, defsByToken, inScope) {
  const masked = maskExcluded(rawText);
  const lines = rawText.split(/\r?\n/);
  let m;
  DEF_RE.lastIndex = 0;
  while ((m = DEF_RE.exec(masked))) {
    const token = m[1];
    if (!inScope(token)) continue;
    const line = lineAt(masked, m.index);
    const text = (lines[line - 1] || '').trim();
    const body = text.replace('**' + token + '**', '').trim();
    if (!defsByToken.has(token)) defsByToken.set(token, []);
    defsByToken.get(token).push({ path: relPath, line: line, text: text, body: body });
  }
}

function execute(input) {
  const artifactPathOpt =
    input && typeof input === 'object' && typeof input.artifact_path === 'string'
      ? input.artifact_path
      : null;
  const authorityDocOpt =
    input && typeof input === 'object' && typeof input.authority_document === 'string'
      ? input.authority_document
      : null;
  const references =
    input && typeof input === 'object' && input.references && typeof input.references === 'object'
      ? input.references
      : {};
  const idNamespacesOpt = typeof references.id_namespaces === 'string' ? references.id_namespaces : null;
  const options =
    input && typeof input === 'object' && input.options && typeof input.options === 'object'
      ? input.options
      : {};
  const companionDocsOpt = Array.isArray(options.companion_documents)
    ? options.companion_documents.filter((x) => typeof x === 'string')
    : [];
  const baselineDeclared = Object.prototype.hasOwnProperty.call(options, 'identifier_baseline');
  const baselineField = baselineDeclared ? options.identifier_baseline : undefined;

  if (!artifactPathOpt || !authorityDocOpt || !idNamespacesOpt) {
    return skipped('unavailable');
  }

  let artifactRaw;
  let authorityRaw;
  let idNamespacesRaw;
  try {
    artifactRaw = readFileSyncRel(artifactPathOpt);
  } catch (e) {
    return skippedForFailedRead(e, 'artifact_path');
  }
  try {
    authorityRaw = readFileSyncRel(authorityDocOpt);
  } catch (e) {
    return skippedForFailedRead(e, 'authority_document');
  }
  try {
    idNamespacesRaw = readFileSyncRel(idNamespacesOpt);
  } catch (e) {
    return skippedForFailedRead(e, 'references.id_namespaces');
  }

  const artifactRelPath = normalizePath(artifactPathOpt);
  const authorityRelPath = normalizePath(authorityDocOpt);

  // The reserved section 3.2 prefix table is the namespace scope: it decides
  // which tokens are identifiers at all. With no reserved-prefix section, or
  // no parseable table inside it, there is no namespace to resolve into --
  // degrade closed rather than report a pass, and never widen the parse back
  // to the whole document to find one. The empty-map arm is belt-and-braces:
  // chooseReservedSection already discards a candidate that declares nothing,
  // so a non-null map carries at least one prefix. The test is kept because
  // the invariant belongs at the point that depends on it.
  const referenceMeanings = parseMeaningsByPrefix(idNamespacesRaw);
  if (!referenceMeanings || referenceMeanings.size === 0) {
    return skipped('unavailable');
  }
  const inScope = (token) => referenceMeanings.has(prefixOf(token));

  // Identifier USE scan: artifact_path only, masked for fenced/inline code,
  // and restricted to tokens whose prefix the reserved table declares.
  const maskedArtifact = maskExcluded(artifactRaw);
  const usedTokens = new Map(); // token -> first-use { path, line }
  let useCount = 0;
  let m;
  IDENTIFIER_RE.lastIndex = 0;
  while ((m = IDENTIFIER_RE.exec(maskedArtifact))) {
    const token = m[1];
    if (!inScope(token)) continue;
    useCount++;
    const line = lineAt(maskedArtifact, m.index);
    if (!usedTokens.has(token)) {
      usedTokens.set(token, { path: artifactRelPath, line: line });
    }
  }

  if (useCount === 0) {
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

  // Companion admission: a companion enters the resolution namespace only
  // when the authority document's own effective (masked) text names its
  // basename as a whole filename.
  const maskedAuthority = maskExcluded(authorityRaw);
  const admittedCompanions = [];
  for (const docPath of companionDocsOpt) {
    const base = path.posix.basename(normalizePath(docPath));
    if (!base || !namesFileWhole(maskedAuthority, base)) continue;
    let raw;
    try {
      raw = readFileSyncRel(docPath);
    } catch (e) {
      return skippedForFailedRead(e, 'options.companion_documents');
    }
    admittedCompanions.push({ relPath: normalizePath(docPath), raw: raw });
  }

  const defsByToken = new Map();
  collectDefinitions(authorityRaw, authorityRelPath, defsByToken, inScope);
  for (const c of admittedCompanions) {
    collectDefinitions(c.raw, c.relPath, defsByToken, inScope);
  }

  const findings = [];

  // (1a) RESOLUTION -- every used token must resolve to at least one
  // definition.
  const sortedUsedTokens = Array.from(usedTokens.keys()).sort(cmpStr);
  for (const token of sortedUsedTokens) {
    const loc = usedTokens.get(token);
    const defs = defsByToken.get(token) || [];
    if (defs.length === 0) {
      findings.push(mkFinding(
        loc.path, loc.line, 'unresolvable-identifier', 'fail',
        `identifier '${token}' is used but resolves to zero definitions in the authority document or its declared companions`
      ));
    }
  }

  // (1b) SINGLE-DEFINITION RULE -- applied to the definitions themselves, so
  // a token defined two or more times fails whether or not the artifact
  // cites it; the SC-2 defect lives in the definitions. A token defined
  // exactly once and cited nowhere is the (non-blocking) dangling warn.
  const sortedDefTokens = Array.from(defsByToken.keys()).sort(cmpStr);
  for (const token of sortedDefTokens) {
    const defs = defsByToken.get(token);
    if (defs.length > 1) {
      const locations = defs.map((d) => `${d.path}:${d.line}`).join(', ');
      const first = defs[0];
      findings.push(mkFinding(
        first.path, first.line, 'ambiguous-identifier-definition', 'fail',
        `identifier '${token}' resolves to ${defs.length} definitions (single-definition rule): ${locations}`
      ));
      continue;
    }
    if (usedTokens.has(token)) continue;
    const d = defs[0];
    findings.push(mkFinding(
      d.path, d.line, 'dangling-definition', 'warn',
      `identifier '${token}' is defined at ${d.path}:${d.line} and used nowhere in ${artifactRelPath}`
    ));
  }

  // (2) PREFIX MEANING -- a reserved prefix actually cited in the artifact,
  // whose authority document redeclares a different meaning than the
  // seeded reference.
  // An authority document with no reserved-prefix section redeclares
  // nothing: there is no table to conflict with the reference, which is the
  // already-stated limit "a prefix the authority document never redeclares
  // is not flagged", not a check that could not run.
  const authorityMeanings = parseMeaningsByPrefix(authorityRaw) || new Map();
  const citedPrefixes = new Set();
  for (const token of sortedUsedTokens) citedPrefixes.add(prefixOf(token));
  const sortedPrefixes = Array.from(citedPrefixes).sort(cmpStr);
  for (const prefix of sortedPrefixes) {
    if (!referenceMeanings.has(prefix) || !authorityMeanings.has(prefix)) continue;
    const refMeaning = referenceMeanings.get(prefix).meaning;
    const authEntry = authorityMeanings.get(prefix);
    if (normText(refMeaning) !== normText(authEntry.meaning)) {
      findings.push(mkFinding(
        authorityRelPath, authEntry.line, 'reserved-prefix-remeaning', 'fail',
        `reserved prefix '${prefix}' is declared '${authEntry.meaning}' in ${authorityRelPath}, ` +
          `which conflicts with its declared meaning '${refMeaning}' in ${normalizePath(idNamespacesOpt)}`
      ));
    }
  }

  // (3) STABILITY -- only when options.identifier_baseline names a
  // readable baseline file. Each reachable state gets its own stated_limits
  // sentence, written from what actually happened (NFR-6).
  let statedLimits;
  if (!baselineDeclared || typeof baselineField === 'undefined') {
    statedLimits = BASE_STATED_LIMITS.concat([STABILITY_SKIP_ABSENT_SENTENCE]);
  } else if (baselineField === null) {
    statedLimits = BASE_STATED_LIMITS.concat([STABILITY_SKIP_NULL_SENTENCE]);
  } else if (typeof baselineField !== 'string') {
    statedLimits = BASE_STATED_LIMITS.concat([
      stabilitySkipUnusableSentence(Array.isArray(baselineField) ? 'array' : typeof baselineField)
    ]);
  } else {
    let baseline;
    try {
      baseline = JSON.parse(readFileSyncRel(baselineField));
    } catch (e) {
      return skippedForFailedRead(e, 'options.identifier_baseline');
    }
    // A malformed baseline is not an empty one. Reading a string or an array
    // as "no entries" (or as entries) would report a comparison that never
    // happened, which is the defect this check exists to catch (NFR-6).
    const baselineIdentifiers = baselineIdentifiersOf(baseline);
    if (baselineIdentifiers === null) {
      return skipped('unavailable', BASE_STATED_LIMITS.concat([STABILITY_BASELINE_MALFORMED_SENTENCE]));
    }
    const baselineTokens = Object.keys(baselineIdentifiers).sort(cmpStr);

    for (const token of baselineTokens) {
      const baseText = baselineIdentifiers[token].definition;
      const baseKey = normText(baseText);
      const currentDefs = defsByToken.get(token) || [];

      // (3a) REUSE -- the baseline's own number now carries a different
      // definition. Scanned INDEPENDENTLY of (3b): one edit can rebind a
      // token AND move that token's recorded definition onto another number,
      // and stopping at the first finding would report half the truth.
      if (currentDefs.length === 1 && normText(currentDefs[0].body) !== baseKey) {
        findings.push(mkFinding(
          currentDefs[0].path, currentDefs[0].line, 'identifier-reused', 'fail',
          `identifier '${token}' now carries a different definition than the recorded baseline ` +
            `('${currentDefs[0].body}' vs baseline '${baseText}')`
        ));
      }

      // (3b) RENUMBER -- the definition the baseline bound to this number now
      // lives under a different one. Runs whenever the baseline number no
      // longer carries that text, whether it vanished (defined nowhere) or
      // was overwritten (the reuse case above). An empty recorded definition
      // is not searched for: it would match every bodiless bold heading.
      const stillBound = currentDefs.some((d) => normText(d.body) === baseKey);
      if (stillBound || baseKey === '') continue;
      const sortedCurrentTokens = Array.from(defsByToken.keys()).sort(cmpStr);
      for (const curToken of sortedCurrentTokens) {
        if (curToken === token) continue;
        const curDefs = defsByToken.get(curToken);
        if (curDefs.length === 1 && normText(curDefs[0].body) === baseKey) {
          findings.push(mkFinding(
            curDefs[0].path, curDefs[0].line, 'identifier-renumbered', 'fail',
            `the definition the baseline recorded under '${token}' now appears under '${curToken}' ` +
              `at ${curDefs[0].path}:${curDefs[0].line}`
          ));
          break;
        }
      }
    }

    statedLimits = BASE_STATED_LIMITS.concat([
      baselineTokens.length === 0
        ? STABILITY_NOTHING_COMPARED_SENTENCE
        : stabilityRanSentence(baselineTokens.length)
    ]);
  }

  const sortedFindings = findings.slice().sort(findingComparator);

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
  // Exit via process.exitCode, never process.exit(): an immediate exit can
  // discard asynchronously buffered stdout when it is a pipe, truncating the
  // one JSON envelope a harness reads. Setting exitCode lets the process end
  // naturally after the stream drains.
  let raw = null;
  try {
    raw = (!arg || arg === '-') ? fs.readFileSync(0, 'utf8') : fs.readFileSync(arg, 'utf8');
  } catch (e) {
    process.stderr.write('id-namespace-resolution: unable to read input\n');
    process.exitCode = 3;
  }

  if (raw !== null) {
    let parsedInput;
    let parsed = false;
    try {
      parsedInput = JSON.parse(raw);
      parsed = true;
    } catch (e) {
      process.stderr.write('id-namespace-resolution: malformed JSON input\n');
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

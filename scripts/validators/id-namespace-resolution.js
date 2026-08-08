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
//   (section 2). A missing artifact_path, authority_document, or
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
//   fenced code block or an inline backticked span is masked out before
//   scanning, exactly the discipline this check's siblings
//   link-integrity.js and cross-reference-integrity.js use, so a backticked
//   file path is never read as an identifier.
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
//   that same prefix's meaning inside authority_document.
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
//   recorded identifier says so. Never-reused
//   and never-renumbered are properties of a history, not of a snapshot,
//   so this half is never folded into the pass (NFR-6).
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
    'fenced code block or an inline code span is masked before scanning ' +
    'and is never read as an identifier.',
  'A reserved section 3.2 prefix is compared against a redeclaration of ' +
    'that same prefix inside the authority document only when the ' +
    "artifact actually cites an identifier of that prefix; a prefix the " +
    'authority document never redeclares is not flagged.',
  'Only artifact_path is scanned for identifier use; the authority ' +
    'document, its declared companions, and the id_namespaces reference ' +
    'are read solely to build the resolution namespace and are never ' +
    'themselves scanned for outgoing identifier use.'
];

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

function readFileSyncRel(relPath) {
  return fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
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

// Replaces every inline code span with equal-length blanks, after fenced
// blocks are already masked, matching link-integrity.js's maskInlineCode,
// so a backticked file path is never mistaken for an identifier token.
function maskInlineCode(text) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return text.replace(/(?<!`)(`+)[\s\S]*?\1(?!`)/g, blank);
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

// Parses a markdown table's prefix -> meaning pairs. The section 3.2 table
// this reads carries two "prefix, meaning" column pairs per row, each
// prefix cell backticked (e.g. "`FR-`" or "`Q`"); a header row's plain-text
// cells never match the backtick pattern and are skipped naturally. The
// FIRST occurrence of a prefix owns its recorded meaning.
function parseMeaningsByPrefix(text) {
  const map = new Map();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
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
    return skipped('unavailable');
  }
  try {
    authorityRaw = readFileSyncRel(authorityDocOpt);
  } catch (e) {
    return skipped('unavailable');
  }
  try {
    idNamespacesRaw = readFileSyncRel(idNamespacesOpt);
  } catch (e) {
    return skipped('unavailable');
  }

  const artifactRelPath = normalizePath(artifactPathOpt);
  const authorityRelPath = normalizePath(authorityDocOpt);

  // The reserved section 3.2 prefix table is the namespace scope: it decides
  // which tokens are identifiers at all. With no parseable table there is no
  // namespace to resolve into -- degrade closed rather than report a pass.
  const referenceMeanings = parseMeaningsByPrefix(idNamespacesRaw);
  if (referenceMeanings.size === 0) {
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
      return skipped('unavailable');
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
  const authorityMeanings = parseMeaningsByPrefix(authorityRaw);
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
      return skipped('unavailable');
    }
    const baselineIdentifiers =
      baseline && typeof baseline === 'object' && baseline.identifiers && typeof baseline.identifiers === 'object'
        ? baseline.identifiers
        : {};
    const baselineTokens = Object.keys(baselineIdentifiers).sort(cmpStr);

    for (const token of baselineTokens) {
      const baseEntry = baselineIdentifiers[token];
      const baseText = baseEntry && typeof baseEntry.definition === 'string' ? baseEntry.definition : '';
      const currentDefs = defsByToken.get(token) || [];

      if (currentDefs.length === 1) {
        if (normText(currentDefs[0].body) !== normText(baseText)) {
          findings.push(mkFinding(
            currentDefs[0].path, currentDefs[0].line, 'identifier-reused', 'fail',
            `identifier '${token}' now carries a different definition than the recorded baseline ` +
              `('${currentDefs[0].body}' vs baseline '${baseText}')`
          ));
        }
        continue;
      }

      if (currentDefs.length === 0) {
        // Vanished from its baseline number: is its definition text now
        // carried under a different token (a renumber)?
        const sortedCurrentTokens = Array.from(defsByToken.keys()).sort(cmpStr);
        for (const curToken of sortedCurrentTokens) {
          if (curToken === token) continue;
          const curDefs = defsByToken.get(curToken);
          if (curDefs.length === 1 && normText(curDefs[0].body) === normText(baseText)) {
            findings.push(mkFinding(
              curDefs[0].path, curDefs[0].line, 'identifier-renumbered', 'fail',
              `the definition the baseline recorded under '${token}' now appears under '${curToken}' ` +
                `at ${curDefs[0].path}:${curDefs[0].line}`
            ));
            break;
          }
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
  let raw;
  try {
    raw = (!arg || arg === '-') ? fs.readFileSync(0, 'utf8') : fs.readFileSync(arg, 'utf8');
  } catch (e) {
    process.stderr.write('id-namespace-resolution: unable to read input\n');
    process.exit(3);
  }

  let parsedInput;
  try {
    parsedInput = JSON.parse(raw);
  } catch (e) {
    process.stderr.write('id-namespace-resolution: malformed JSON input\n');
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

// INPUT: one JSON object on standard input or as a file argument, matching
//   the common validator input envelope (docs/validator-spec-sheet.md
//   section 2), with this check's shape (section 4, "Manifest/registry
//   consistency"):
//     {
//       "check": "manifest-registry-consistency",
//       "manifest_path": "cadence/manifest.json",
//       "project_root": ".",
//       "options": {
//         "governed_roots": ["cadence/draft", "cadence/candidate", "cadence/approved"],
//         "evidence_root": "artifacts/"
//       }
//     }
//   manifest_path and every options.governed_roots entry are resolved
//   relative to the current working directory (the repository root), never
//   relative to this script or to the input file itself, exactly as every
//   other check's paths are (section 2), and each is CONSTRAINED to the
//   repository root: a resolved path that escapes the root (an absolute path,
//   or a "../" traversal, or an in-checkout symlink pointing outside) is
//   refused unread and degrades the run closed to "skipped: unavailable",
//   carrying its OWN stated_limits sentence naming the field that was refused
//   -- a refusal and an unreadable file are different facts, and an envelope
//   that cannot tell them apart cannot be used to prove the root constraint
//   fired. A manifest that cannot be read or parsed produces
//   "skipped: unavailable" (degrade closed).
//
//   The check verifies the manifest against the governed tree (method §3.2,
//   Appendix B, AC-1.3, AC-9.2) by PATH, not by content:
//     - Every governed artifact under options.governed_roots -- a regular
//       file under a named root by a directory-boundary prefix test, that
//       does not lie under options.evidence_root and is not the target of any
//       row's derived_render.path -- must have a manifest row. The has-a-row
//       join resolves first by exact repository-root-relative path, then by
//       the BASENAME of a row's path; a basename shared ambiguously (two rows,
//       or two governed artifacts with no exact match) is REFUSED rather than
//       resolved by manifest order, and the artifact is reported unregistered.
//     - Every manifest row (each document_set.documents[] entry, plus the
//       top-level authority_document when it names one) must name a file that
//       exists, by that same exact-then-basename join, so a pure zone move
//       (same basename, different zone directory) is a pass.
//     - The manifest must declare EXACTLY ONE authority document (AC-1.3): a
//       designation is the top-level authority_document carrying a non-empty
//       path, plus any document_set.documents[] row typed "authority"; zero or
//       two or more designations fail.
//     - document_set.selection_rationale (method §3.2's recorded rationale)
//       must be present and non-empty while document_set.documents is
//       non-empty: absent entirely is a fail, present-but-empty is a warn (the
//       structure is there and the reason for it is not); a row's own optional
//       selection_rationale present-but-empty is likewise a warn.
//
//   A project that declares no document set yet (document_set.documents empty
//   -- an initialized scaffold before its first artifact) produces
//   "skipped: not-applicable" (verdict null), distinct from an unreadable
//   manifest's "skipped: unavailable".
//
// USAGE: node manifest-registry-consistency.js <input.json|->
//   Reads the input envelope from the named file, or from standard input when
//   the argument is "-" or omitted. Prints the common output envelope
//   (section 2) as JSON to standard output. Exit codes: pass=0, warn=10,
//   fail=20, skipped=30 (either reason); exit 3 if the input itself could not
//   be read or parsed as JSON.
'use strict';

const fs = require('fs');
const path = require('path');

const CHECK_SLUG = 'manifest-registry-consistency';

const manifest = {
  check: CHECK_SLUG,
  description:
    'Manifest/registry consistency: verifies the project manifest against ' +
    'the governed tree (method §3.2, Appendix B, AC-1.3, AC-9.2, SC-2). ' +
    'Every governed artifact under options.governed_roots has a manifest ' +
    'row and every manifest row names a file that exists (exact path, then ' +
    'basename join); the manifest declares exactly one authority document; ' +
    'document_set.selection_rationale is present and non-empty. Verifies by ' +
    'path only -- it never opens the content of a governed artifact (FR-17).',
  verdicts: ['pass', 'warn', 'fail'],
  skip_reasons: ['not-applicable', 'unavailable'],
  exit_codes: { pass: 0, warn: 10, fail: 20, skipped: 30 },
  finding_codes: [
    'authority-document-count-invalid',
    'governed-artifact-unregistered',
    'manifest-row-file-missing',
    'selection-rationale-absent',
    'selection-rationale-empty'
  ]
};

const BASE_STATED_LIMITS = [
  'This check verifies manifest/registry consistency by PATH only: it ' +
    'confirms that every governed artifact under options.governed_roots is ' +
    'registered and that every manifest row names a file that exists, but it ' +
    'never opens, parses, or validates the CONTENT of any governed artifact ' +
    'or of the documents the manifest names (FR-17).',
  'A manifest row is joined to a governed artifact first by an exact ' +
    'repository-root-relative path match and, failing that, by the basename ' +
    "of the row's path (the filename component, invariant across zone " +
    'directories). A basename shared by two distinct rows, or by two ' +
    'governed artifacts with no exact match, is REFUSED rather than resolved ' +
    'by manifest order -- a refused join counts as no row and the artifact is ' +
    'reported unregistered. A pure zone move (same basename, different zone ' +
    'directory) therefore stays a pass.',
  'An authority-document designation is counted from the top-level ' +
    'authority_document (an object with a non-empty path, or each element of ' +
    'an array with one) and from every document_set.documents[] row typed ' +
    '"authority"; exactly one designation is required (AC-1.3, method §3.2), ' +
    'and zero or two or more fail.',
  'A file under options.evidence_root (default "artifacts/") never requires ' +
    'a manifest row: it holds evidence about runs, is never itself a governed ' +
    'zone, and is never promoted; demanding a row for it would make every ' +
    'gate run fail on its own evidence.',
  'A file named by some row\'s derived_render.path never requires its own ' +
    'manifest row: it is a derived render, the output of render-fidelity, not ' +
    'an independent source artifact.',
  'Every path in the input envelope -- manifest_path and each ' +
    'options.governed_roots entry -- is resolved beneath the repository root ' +
    'and refused unread when it escapes it, so an absolute path or a "../" ' +
    'traversal degrades the run closed to skipped: unavailable rather than ' +
    'reading a file outside the checkout; the containment test also resolves ' +
    'symbolic links: fs.realpathSync is applied to both the target and the ' +
    'repository root before the same containment test is re-applied, so a ' +
    'symbolic link that lives inside the checkout and resolves outside it is ' +
    'refused too, before it is read; a dangling symlink -- one whose target ' +
    'does not exist -- is not a refusal and is reported as the ordinary ' +
    'missing-file outcome instead. This check spawns nothing (fs and path ' +
    'only), so no path here is ever executed.'
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

// True when `child` is the directory `dir` itself or lies beneath it, tested
// by whole path SEGMENTS (a directory-boundary prefix test), so "cadence/draft"
// contains "cadence/draft/x.md" but not "cadence/draft-old/x.md".
function isUnderDir(child, dir) {
  const c = normalizePath(child);
  const d = normalizePath(dir);
  if (!d) return false;
  return c === d || c.startsWith(d + '/');
}

// Enumerates every regular file beneath a governed root as a normalized
// repository-root-relative path. Each descent and each entry is resolved
// through resolveWithinRoot, so a symlink under the root that escapes the
// checkout is refused (the tagged throw propagates to the caller, which
// degrades the run closed); a dangling symlink or an unreadable entry is
// skipped as the ordinary missing outcome. realpath-based cycle detection
// prevents a symlinked directory loop from spinning. A missing or unreadable
// root contributes nothing rather than failing the run: a zone directory that
// has not been created yet is not an inconsistency.
function collectGovernedFiles(rootRel, out) {
  const seen = new Set();
  const stack = [normalizePath(rootRel)];
  while (stack.length) {
    const dirRel = stack.pop();
    let dirAbs;
    try {
      dirAbs = resolveWithinRoot(dirRel);
    } catch (e) {
      if (e && e.pathEscapesRoot) throw e;
      continue;
    }
    let realDir;
    try {
      realDir = fs.realpathSync(dirAbs);
    } catch (e) {
      continue;
    }
    if (seen.has(realDir)) continue;
    seen.add(realDir);
    let entries;
    try {
      entries = fs.readdirSync(dirAbs, { withFileTypes: true });
    } catch (e) {
      continue;
    }
    const names = entries.map((d) => d.name).sort(cmpStr);
    for (const name of names) {
      const childRel = normalizePath(dirRel + '/' + name);
      let stat;
      try {
        const childAbs = resolveWithinRoot(childRel);
        stat = fs.statSync(childAbs);
      } catch (e) {
        if (e && e.pathEscapesRoot) throw e;
        continue;
      }
      if (stat.isDirectory()) {
        stack.push(childRel);
      } else if (stat.isFile()) {
        out.push(childRel);
      }
    }
  }
}

// Counts authority-document designations. The top-level authority_document is
// the manifest's one binary designation act (AC-1.3): an object with a
// non-empty path counts as one; an array (a malformed second shape) counts
// each element with a non-empty path. A document_set.documents[] row typed
// "authority" is an additional designation. Exactly one is required.
function countAuthorityDesignations(manifestObj, documents) {
  let count = 0;
  const auth = manifestObj.authority_document;
  if (Array.isArray(auth)) {
    for (const a of auth) {
      if (a && typeof a === 'object' && typeof a.path === 'string' && a.path.trim() !== '') count += 1;
    }
  } else if (auth && typeof auth === 'object' && typeof auth.path === 'string' && auth.path.trim() !== '') {
    count += 1;
  }
  for (const row of documents) {
    if (row && typeof row === 'object' && row.type === 'authority') count += 1;
  }
  return count;
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

function execute(input) {
  const obj = input && typeof input === 'object' ? input : {};
  const manifestPathOpt = typeof obj.manifest_path === 'string' ? obj.manifest_path : null;
  const options = obj.options && typeof obj.options === 'object' ? obj.options : {};
  const governedRoots = Array.isArray(options.governed_roots)
    ? options.governed_roots.filter((r) => typeof r === 'string' && r.length)
    : [];
  const evidenceRoot = typeof options.evidence_root === 'string' ? normalizePath(options.evidence_root) : 'artifacts';

  // --- Read and parse the manifest (degrade closed on refusal / failure). ---
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
  if (!manifestObj || typeof manifestObj !== 'object' || Array.isArray(manifestObj)) {
    return skipped('unavailable');
  }

  const documentSet =
    manifestObj.document_set && typeof manifestObj.document_set === 'object' ? manifestObj.document_set : {};
  const documents = Array.isArray(documentSet.documents) ? documentSet.documents : [];

  // --- No document set yet: an initialized scaffold before its first artifact. ---
  if (documents.length === 0) {
    return skipped('not-applicable');
  }

  // --- governed_roots is a required input for the bidirectional join: a manifest
  // declaring documents but no governed tree to reconcile them against cannot be
  // judged, so the check degrades closed (a missing required key skips, never
  // guesses -- spec §2). This is placed AFTER the manifest read and the empty
  // document-set skip: an unreadable manifest is still "unavailable" with its own
  // refusal disclosure, and an empty document set is still "not-applicable",
  // regardless of governed_roots. ---
  if (governedRoots.length === 0) {
    return skipped('unavailable');
  }

  const manifestRelPath = normalizePath(manifestPathOpt);
  const findings = [];

  // --- Manifest rows for the join: documents[] rows + the authority document. ---
  const manifestEntries = [];
  const derivedRenderTargets = new Set();
  for (const row of documents) {
    if (!row || typeof row !== 'object') continue;
    if (isNonEmptyString(row.path)) {
      const rp = normalizePath(row.path);
      manifestEntries.push({ path: rp, basename: path.posix.basename(rp) });
    }
    if (
      row.derived_render &&
      typeof row.derived_render === 'object' &&
      isNonEmptyString(row.derived_render.path)
    ) {
      derivedRenderTargets.add(normalizePath(row.derived_render.path));
    }
  }
  const auth = manifestObj.authority_document;
  if (Array.isArray(auth)) {
    for (const a of auth) {
      if (a && typeof a === 'object' && isNonEmptyString(a.path)) {
        const ap = normalizePath(a.path);
        manifestEntries.push({ path: ap, basename: path.posix.basename(ap) });
      }
    }
  } else if (auth && typeof auth === 'object' && isNonEmptyString(auth.path)) {
    const ap = normalizePath(auth.path);
    manifestEntries.push({ path: ap, basename: path.posix.basename(ap) });
  }

  // --- AC-1.3: exactly one authority-document designation. ---
  const authorityCount = countAuthorityDesignations(manifestObj, documents);
  if (authorityCount !== 1) {
    findings.push(mkFinding(
      manifestRelPath, 0, 'authority-document-count-invalid', 'fail',
      `manifest declares ${authorityCount} authority-document designation(s); exactly one is required (AC-1.3)`
    ));
  }

  // --- Document-set selection_rationale: absent => fail, present-but-empty => warn. ---
  if (!Object.prototype.hasOwnProperty.call(documentSet, 'selection_rationale')) {
    findings.push(mkFinding(
      manifestRelPath, 0, 'selection-rationale-absent', 'fail',
      'manifest document_set.selection_rationale is absent while document_set.documents is non-empty; method §3.2 requires it to be recorded'
    ));
  } else if (!isNonEmptyString(documentSet.selection_rationale)) {
    findings.push(mkFinding(
      manifestRelPath, 0, 'selection-rationale-empty', 'warn',
      'manifest document_set.selection_rationale is present but empty; the structure is there and the reason for it is not'
    ));
  }

  // --- A row's own optional selection_rationale, present-but-empty => warn. ---
  for (const row of documents) {
    if (!row || typeof row !== 'object') continue;
    if (Object.prototype.hasOwnProperty.call(row, 'selection_rationale') && !isNonEmptyString(row.selection_rationale)) {
      const rp = isNonEmptyString(row.path) ? normalizePath(row.path) : manifestRelPath;
      findings.push(mkFinding(
        rp, 0, 'selection-rationale-empty', 'warn',
        `manifest row '${rp}' carries a selection_rationale that is present but empty`
      ));
    }
  }

  // --- Enumerate governed artifacts (degrade closed on a governed-root escape). ---
  const collected = [];
  try {
    for (const rootRel of governedRoots) {
      collectGovernedFiles(rootRel, collected);
    }
  } catch (e) {
    if (e && e.pathEscapesRoot) {
      return skippedForFailedRead(e, 'an options.governed_roots entry');
    }
    throw e;
  }
  const governedArtifacts = Array.from(new Set(collected))
    .filter((p) => !isUnderDir(p, evidenceRoot))
    .filter((p) => !derivedRenderTargets.has(p))
    .sort(cmpStr);

  // --- The shared exact-then-basename join, applied SYMMETRICALLY in both
  // directions so they can never disagree. An artifact or a row is "claimed"
  // when its exact repository-root-relative path matches on the other side.
  // Among the UNCLAIMED remainder on each side, a basename joins only when
  // EXACTLY ONE unclaimed artifact AND EXACTLY ONE unclaimed row carry it; a
  // basename shared by two rows, or by two artifacts, is refused rather than
  // resolved by manifest order (a refused join counts as no row). An
  // exact-matched artifact is never a basename-rescue candidate, so a missing
  // row whose basename merely coincides with an already-registered file is not
  // silently accepted. ---
  const rowPathSet = new Set(manifestEntries.map((e) => e.path));
  const artifactPathSet = new Set(governedArtifacts);
  const unclaimedArtifacts = governedArtifacts.filter((a) => !rowPathSet.has(a));
  const unclaimedRows = manifestEntries.filter((e) => !artifactPathSet.has(e.path));
  const unclaimedArtifactByBasename = new Map();
  for (const a of unclaimedArtifacts) {
    const bn = path.posix.basename(a);
    unclaimedArtifactByBasename.set(bn, (unclaimedArtifactByBasename.get(bn) || 0) + 1);
  }
  const unclaimedRowByBasename = new Map();
  for (const e of unclaimedRows) {
    unclaimedRowByBasename.set(e.basename, (unclaimedRowByBasename.get(e.basename) || 0) + 1);
  }
  function basenameJoinsUniquely(bn) {
    return unclaimedArtifactByBasename.get(bn) === 1 && unclaimedRowByBasename.get(bn) === 1;
  }

  // --- Direction 1: every governed artifact has a manifest row (same join). ---
  for (const a of unclaimedArtifacts) {
    const bn = path.posix.basename(a);
    if (basenameJoinsUniquely(bn)) {
      continue; // unique basename join (e.g. a zone move)
    }
    if ((unclaimedRowByBasename.get(bn) || 0) === 0) {
      findings.push(mkFinding(
        a, 0, 'governed-artifact-unregistered', 'fail',
        `governed artifact '${a}' has no manifest row (no exact-path or basename match in document_set.documents[] or authority_document)`
      ));
    } else {
      findings.push(mkFinding(
        a, 0, 'governed-artifact-unregistered', 'fail',
        `governed artifact '${a}' has no unambiguous manifest row: its basename '${bn}' matches more than one row or more than one governed artifact, and the ambiguous join is refused rather than resolved by manifest order`
      ));
    }
  }

  // --- Direction 2: every manifest row names a FILE that exists (same join). A
  // row whose exact path resolves to a directory names no document and fails
  // like a missing file; a zone move is rescued only by a unique basename join. ---
  let rowExistenceRefused = null;
  const seenRowPaths = new Set();
  for (const e of manifestEntries) {
    if (seenRowPaths.has(e.path)) continue;
    seenRowPaths.add(e.path);
    let existsAsFile = false;
    try {
      existsAsFile = fs.statSync(resolveWithinRoot(e.path)).isFile();
    } catch (err) {
      if (err && err.pathEscapesRoot) {
        rowExistenceRefused = err;
        break;
      }
      existsAsFile = false;
    }
    if (existsAsFile) {
      continue; // the row's own path is a regular file
    }
    if (basenameJoinsUniquely(e.basename)) {
      continue; // a zone move: the file exists under a different zone directory
    }
    findings.push(mkFinding(
      e.path, 0, 'manifest-row-file-missing', 'fail',
      `manifest row names '${e.path}', which names no existing file (no exact-path regular file on disk and no unambiguous basename match among governed artifacts)`
    ));
  }
  if (rowExistenceRefused) {
    return skippedForFailedRead(rowExistenceRefused, 'a manifest document row path');
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
    stated_limits: BASE_STATED_LIMITS,
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
    process.stderr.write('manifest-registry-consistency: unable to read input\n');
    process.exitCode = 3;
  }

  if (raw !== null) {
    let parsedInput;
    let parsed = false;
    try {
      parsedInput = JSON.parse(raw);
      parsed = true;
    } catch (e) {
      process.stderr.write('manifest-registry-consistency: malformed JSON input\n');
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

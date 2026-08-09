// INPUT: one JSON object on standard input or as a file argument, matching
//   the common validator input envelope (docs/validator-spec-sheet.md
//   section 2), with this check's two required options:
//     {
//       "check": "gate-self-test",
//       "options": {
//         "registry_path": "scripts/validators/registry.json",
//         "fixture_root": "fixtures/"
//       }
//     }
//   Both option paths are resolved relative to the current working
//   directory (the repository root), never relative to this script or to
//   the input file itself, exactly as every other check's `artifact_path`
//   and `manifest_path` are (section 2), and both, plus every path drawn
//   from the registry the options name (a registry entry's fixture_root and
//   script_path), are CONSTRAINED to the repository root: a resolved path
//   that escapes the root (an absolute path, or a "../" traversal) is
//   refused unread/unexecuted and degrades closed, carrying its OWN
//   stated_limits sentence naming the field that was refused -- a refusal
//   and an unreadable file are different facts, and an envelope that cannot
//   tell them apart cannot be used to prove the root constraint fired. A
//   missing or unreadable registry_path or fixture_root, or a registry that
//   cannot be parsed, produces "skipped: unavailable" (degrade closed). A
//   registry that names no sibling checks (this check excludes its own slug
//   from the count, to avoid invoking itself) produces "skipped:
//   not-applicable".
//
//   Registry schema (scripts/validators/registry.json), one entry per
//   registered gate check:
//     {
//       "slug": "<check slug>",
//       "script_path": "<repo-root-relative path to the check's script>",
//       "fixture_root": "<repo-root-relative path to the check's fixture
//                          root, per the fixture-pack layout in section 7>",
//       "known_bad_case": "<case directory name, under fixture_root, whose
//                           input.json is this check's known-bad fixture>",
//       "verdict": "<the non-pass verdict ('warn' or 'fail') the check must
//                    return on that known-bad fixture>",
//       "finding_code": "<the finding code that verdict must carry>",
//       "edge_fixtures": ["<case directory name>", ...]   // optional,
//         additional named fixture cases (beyond known_bad_case) whose
//         mere presence under fixture_root is checked for hygiene; a
//         missing one is a warn, never a fail (section 4, edge cases).
//     }
//   The reverse agreement scan (a fixture set with no registry entry) is
//   scoped to the immediate subdirectories of fixture_root, excluding any
//   directory belonging to a non-gate-check validator (currently only
//   "tier-config", WP 5.4's configuration validator, which is never a
//   registered gate check and never appears in the registry).
//
// USAGE: node gate-self-test.js <input.json|->
//   Reads the input envelope from the named file, or from standard input
//   when the argument is "-" or omitted. Prints the common output envelope
//   (section 2) as JSON to standard output. Exit codes: pass=0, warn=10,
//   fail=20, skipped=30 (either reason); exit 3 if the input itself could
//   not be read or parsed as JSON.
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CHECK_SLUG = 'gate-self-test';

// Fixture-root subdirectory names that are never treated as an
// unregistered gate-check fixture set, because they belong to a validator
// that is deliberately not a registered Draft->Candidate gate check
// (docs/validator-spec-sheet.md section 4, "What the registry does not
// contain").
const EXCLUDED_FIXTURE_DIR_NAMES = new Set(['tier-config']);

const manifest = {
  check: CHECK_SLUG,
  description:
    'Gate self-test: proves each registered Draft->Candidate gate check ' +
    'still fires, for the right reason, on its recorded known-bad fixture ' +
    '(FR-18, SC-2, method pattern 7).',
  verdicts: ['pass', 'warn', 'fail'],
  skip_reasons: ['not-applicable', 'unavailable'],
  exit_codes: { pass: 0, warn: 10, fail: 20, skipped: 30 },
  finding_codes: [
    'check-did-not-fire',
    'finding-code-mismatch',
    'registry-entry-without-fixture',
    'fixture-without-registry-entry',
    'edge-fixture-absent'
  ]
};

const STATED_LIMITS = [
  "Each registered check is exercised only against the single known-bad " +
    "fixture its registry entry names; the check's other fixture cases " +
    'are not re-run here.',
  'Edge-fixture hygiene is checked by directory presence only; the ' +
    'content of a present edge fixture is not validated.',
  'Every path in the input envelope, and every path drawn from the ' +
    'registry it names, is resolved beneath the repository root and ' +
    'refused unread when it escapes it. An absolute path or a "../" ' +
    'traversal in options.registry_path degrades the whole run closed to ' +
    'skipped: unavailable; the same is true of options.fixture_root, but ' +
    'only once the registry is known to name at least one sibling entry ' +
    '-- with none, the run already returned skipped: not-applicable ' +
    'before options.fixture_root is ever resolved. A registry entry\'s ' +
    "fixture_root or script_path escaping the root degrades that entry " +
    "closed to its existing fail-severity finding without ever running " +
    "the entry's script; one of its edge_fixtures entries escaping the " +
    'root degrades that one edge fixture closed to the existing ' +
    'edge-fixture-absent warn finding without ever reading it. The ' +
    'containment test also resolves symbolic links: fs.realpathSync is ' +
    'applied to both the target and the repository root before the same ' +
    'containment test is re-applied, so a symbolic link that lives ' +
    'inside the checkout and resolves outside it is refused too, before ' +
    'it is read or executed; a dangling symlink -- one whose target does ' +
    'not exist -- is not a refusal and is reported as the ordinary ' +
    'missing-file outcome instead.'
];

// The one signal that tells a REFUSAL apart from an unreadable/missing file.
// Both degrade closed -- the spec's skip-reason set has no dedicated value
// for a refusal and this check does not invent one -- so without a
// distinguishing sentence the two states would emit byte-identical
// envelopes, and a fixture aimed at the root constraint would pin nothing.
// The sentence names the FIELD that was refused, never the path it carried:
// that path is untrusted input, and echoing it back would leak the very
// string the constraint exists to keep out of this envelope.
function pathRefusedSentence(field) {
  return (
    'No further file was read or executed for this run: the path ' +
    'supplied in ' + field + ' resolves outside the repository root and ' +
    'was refused unread/unexecuted by the root constraint. That is a ' +
    'containment decision, not a missing or unreadable file, and this ' +
    'sentence is what distinguishes the two -- skipped_reason is ' +
    '"unavailable" for a whole-run refusal because the reason set carries ' +
    'no dedicated value for a refusal. The refused path is untrusted ' +
    'input and is deliberately not echoed here.'
  );
}

// A per-entry variant of pathRefusedSentence, above. The whole-run sentence
// claims "No further file was read or executed for this run" -- true for
// options.registry_path and options.fixture_root, both of which return
// immediately, but FALSE for a refusal inside the per-entry loop: sibling
// registry entries keep executing after this one degrades closed. This
// variant makes the scope claim that IS true instead. Every member of
// refusedFields is per-entry by construction (the two whole-run refusals
// never reach it), so the stated_limits mapping below uses this variant
// exclusively.
function entryPathRefusedSentence(field) {
  return (
    'This is a per-entry refusal, not a whole-run one: the path supplied ' +
    'in ' + field + ' resolves outside the repository root and was ' +
    'refused unread/unexecuted by the root constraint, but the run did ' +
    'NOT stop -- any sibling registry entries were still evaluated, and this ' +
    'entry alone degraded closed to its existing finding for that gap. ' +
    'That is a containment decision, not a missing or unreadable file, ' +
    'and this sentence is what distinguishes the two -- skipped_reason ' +
    'has no dedicated value for a refusal, which is why this sentence ' +
    'exists. The refused path is untrusted input and is deliberately not ' +
    'echoed here.'
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
    stated_limits: statedLimits || STATED_LIMITS,
    tool_versions: {}
  };
}

// Resolves a repository-root-relative path from the (untrusted) input
// envelope or the (untrusted) registry it names, and REFUSES one that
// escapes the root. Every caller reads inside a try/catch, so an absolute
// path or a "../" traversal can never produce a pass, a partial result, or
// an uncaught crash -- and for the registry's own script_path, never an
// execution. Two passes: first a cheap LEXICAL test (path.relative against
// ".."); then, on success, a REALPATH test that resolves both the root and
// the target with fs.realpathSync and re-applies the same containment test
// to the resolved values, so a symbolic link that lives inside the checkout
// and points outside it is refused too, before any read or execution. The
// root is realpathed defensively (falling back to the lexical root if that
// throws) so a checkout reached through a symlinked parent -- /tmp ->
// /private/tmp on macOS, a symlinked worktree parent -- is never
// self-refused. realpathSync throws ENOENT on a non-existent path, including
// a dangling symlink's target: that is the ordinary missing-file case, not a
// refusal, so it returns the lexical target unresolved and lets the
// caller's existing missing-file handling degrade it exactly as before;
// every OTHER errno (ELOOP, EACCES, ENOTDIR, ...) is rethrown UNTAGGED so
// the caller degrades closed as a failed read, never as a containment
// refusal and never as a crash. Both passes throw the SAME TAGGED
// err.pathEscapesRoot on an escape, so the caller can report a refusal
// distinctly from a failed read; an untagged throw would be
// indistinguishable from ENOENT in the output envelope. Character-identical
// in all four guarded validators (link-integrity.js,
// cross-reference-integrity.js, gate-self-test.js,
// id-namespace-resolution.js) by contract -- containment semantics must
// stay uniform across them.
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

function readJsonFileSync(absPath) {
  const raw = fs.readFileSync(absPath, 'utf8');
  return JSON.parse(raw);
}

// Runs a registered sibling check the way the gate does: spawn node on its
// script_path, feeding it the recorded known-bad input.json, and reading
// back the common output envelope from stdout.
function runKnownBadFixture(scriptAbsPath, inputAbsPath) {
  const result = spawnSync(process.execPath, [scriptAbsPath, inputAbsPath], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  try {
    const parsed = JSON.parse(result.stdout);
    return {
      verdict: parsed && typeof parsed === 'object' ? parsed.verdict : null,
      codes: parsed && Array.isArray(parsed.findings)
        ? parsed.findings.map((f) => (f && typeof f === 'object' ? f.code : null))
        : []
    };
  } catch (e) {
    return { verdict: null, codes: [] };
  }
}

function execute(input) {
  const options = (input && typeof input === 'object' && input.options && typeof input.options === 'object')
    ? input.options
    : {};

  const registryPathOpt = typeof options.registry_path === 'string' ? options.registry_path : null;
  const fixtureRootOpt = typeof options.fixture_root === 'string' ? options.fixture_root : null;

  if (!registryPathOpt) {
    return skipped('unavailable');
  }

  let registry;
  try {
    registry = readJsonFileSync(resolveWithinRoot(registryPathOpt));
  } catch (e) {
    if (e && e.pathEscapesRoot) {
      return skipped('unavailable', STATED_LIMITS.concat([pathRefusedSentence('options.registry_path')]));
    }
    return skipped('unavailable');
  }

  const allEntries = registry && Array.isArray(registry.checks) ? registry.checks : [];
  // Every well-formed registry entry (an object carrying a slug), the
  // self-entry (slug gate-self-test) included. The self-slug is excluded from
  // INVOCATION ONLY (below); it is NOT excluded from the forward structural
  // existence check, the edge-fixture check, or the reverse agreement scan.
  // See CHK007: over-excluding it silently ignores a broken self-entry.
  const validEntries = allEntries.filter((e) => e && typeof e === 'object' && e.slug);
  // Sibling entries drive only the not-applicable count and INVOCATION: a
  // registry naming no check other than gate-self-test has nothing to exercise.
  const siblingEntries = validEntries.filter((e) => e.slug !== CHECK_SLUG);

  // An empty (or self-only) registry is the pre-WP-5.1 scaffold state: there
  // is nothing to exercise, so nothing about fixture_root matters either.
  if (siblingEntries.length === 0) {
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

  if (!fixtureRootOpt) {
    return skipped('unavailable');
  }

  let fixtureRootAbs;
  try {
    fixtureRootAbs = resolveWithinRoot(fixtureRootOpt);
  } catch (e) {
    if (e && e.pathEscapesRoot) {
      return skipped('unavailable', STATED_LIMITS.concat([pathRefusedSentence('options.fixture_root')]));
    }
    return skipped('unavailable');
  }
  let fixtureRootDirents;
  try {
    fixtureRootDirents = fs.readdirSync(fixtureRootAbs, { withFileTypes: true });
  } catch (e) {
    return skipped('unavailable');
  }

  const findings = [];
  const refusedFields = new Set();

  // The reverse registry<->fixture-root agreement scan (below) must recognize
  // EVERY registry entry's fixture_root as registered -- INCLUDING this
  // check's own self-entry (slug gate-self-test). The self-slug exclusion
  // applies ONLY to INVOCATION: the forward loop never runs the self-test
  // against itself, but the self-entry's fixture directory is still a
  // registered fixture root. Building this set from siblingEntries alone would
  // shrink it, so the moment a sibling entry exists the self-entry's own
  // on-disk fixture directory (e.g. fixtures/gate-self-test) would be falsely
  // flagged 'fixture-without-registry-entry'. Populate it from allEntries.
  const registeredFixtureRoots = new Set();
  for (const entry of allEntries) {
    if (entry && typeof entry === 'object' && typeof entry.fixture_root === 'string' && entry.fixture_root) {
      registeredFixtureRoots.add(normalizePath(entry.fixture_root));
    }
  }

  // The forward loop iterates EVERY entry (self included). The structural
  // existence check and the edge-fixture check apply to all; only INVOCATION
  // is gated on the self-slug (inside the loop). Building this from
  // siblingEntries would over-exclude the self-entry from the existence and
  // edge checks -- the CHK007 defect this closes (the converse of the reverse
  // scan already corrected in attempt 2).
  const sortedEntries = validEntries.slice().sort((a, b) => cmpStr(a.slug, b.slug));

  for (const entry of sortedEntries) {
    const entryFixtureRoot = typeof entry.fixture_root === 'string' ? entry.fixture_root : '';

    // A registry entry's fixture_root is REGISTRY DATA, not the input
    // envelope -- but it is exactly as untrusted, since the registry itself
    // is an envelope-supplied file. A "../" escape here is refused before the
    // directory is even stat'd, and the entry is treated identically to a
    // fixture root that is not present on disk (same finding code, same
    // 'fail' severity) except that the refused path is never echoed: the
    // finding's path field carries the '(refused)' sentinel instead of the
    // escaping path (precedent: the existing '(unset)' sentinel below).
    let frAbs = null;
    let fixtureRootRefused = false;
    if (entryFixtureRoot) {
      try {
        frAbs = resolveWithinRoot(entryFixtureRoot);
      } catch (e) {
        if (e && e.pathEscapesRoot) {
          fixtureRootRefused = true;
          refusedFields.add("a registry entry's fixture_root");
        }
      }
    }
    let usable = Boolean(frAbs) && fs.existsSync(frAbs) && fs.statSync(frAbs).isDirectory();

    let knownBadInputAbs = null;
    if (usable) {
      if (!entry.known_bad_case) {
        usable = false;
      } else {
        // entry.known_bad_case is likewise registry data and can carry a
        // "../" segment; a refusal here is treated as not-present, the same
        // degrade-closed outcome as a missing input.json (no separate
        // stated_limits sentence: this join is not one of the four guarded
        // sites and no existing fixture output depends on it).
        try {
          knownBadInputAbs = resolveWithinRoot(path.join(entryFixtureRoot, entry.known_bad_case, 'input.json'));
          usable = fs.existsSync(knownBadInputAbs);
        } catch (e) {
          usable = false;
          knownBadInputAbs = null;
        }
      }
    }

    if (!usable) {
      findings.push(mkFinding(
        fixtureRootRefused ? '(refused)' : (entryFixtureRoot || '(unset)'),
        0,
        'registry-entry-without-fixture',
        'fail',
        `registry entry '${entry.slug}' names a fixture root that is not present on disk`
      ));
      continue;
    }

    // INVOCATION is the ONLY step excluded for the self-entry: spawning the
    // self-test against its own known-bad fixture and asserting its recorded
    // verdict + finding code would be circular. The structural existence check
    // (above) and the edge-fixture check (below) already run for this entry,
    // self included -- CHK007.
    if (entry.slug !== CHECK_SLUG) {
      const scriptPath = typeof entry.script_path === 'string' ? entry.script_path : '';
      let scriptAbs = null;
      let scriptRefused = false;
      try {
        scriptAbs = resolveWithinRoot(scriptPath);
      } catch (e) {
        if (e && e.pathEscapesRoot) {
          scriptRefused = true;
          refusedFields.add("a registry entry's script_path");
        }
      }

      if (scriptRefused) {
        // Refused BEFORE spawnSync: the out-of-root script is never executed.
        findings.push(mkFinding(
          '(refused)',
          0,
          'check-did-not-fire',
          'fail',
          `check '${entry.slug}' names a script_path that resolves outside the repository root; it was refused and never executed`
        ));
      } else {
        const observed = runKnownBadFixture(scriptAbs, knownBadInputAbs);

        if (observed.verdict !== entry.verdict) {
          findings.push(mkFinding(
            scriptPath,
            0,
            'check-did-not-fire',
            'fail',
            `check '${entry.slug}' produced verdict '${observed.verdict}' on its known-bad fixture, expected '${entry.verdict}'`
          ));
        } else if (!observed.codes.includes(entry.finding_code)) {
          findings.push(mkFinding(
            scriptPath,
            0,
            'finding-code-mismatch',
            'fail',
            `check '${entry.slug}' fired with the recorded verdict '${entry.verdict}' but did not carry the recorded finding code '${entry.finding_code}'`
          ));
        }
      }
    }

    const edgeFixtures = Array.isArray(entry.edge_fixtures) ? entry.edge_fixtures.slice().sort(cmpStr) : [];
    for (const edgeCase of edgeFixtures) {
      // entry.edge_fixtures entries are registry data too. A refusal here is
      // DISCLOSED (unlike the join above at knownBadInputAbs, which is not
      // one of the four guarded sites): the finding's path field carries the
      // '(refused)' sentinel instead of the joined path, and the message
      // never interpolates the escaping edgeCase string, matching the
      // no-echo policy this file states and honors elsewhere (script_path,
      // above). A refused edge fixture is otherwise treated the same as an
      // absent one -- same finding code, same 'warn' severity -- so its
      // absence from disk after the refusal is never separately reported.
      let edgeAbs = null;
      let edgeRefused = false;
      try {
        edgeAbs = resolveWithinRoot(path.join(entryFixtureRoot, edgeCase));
      } catch (e) {
        if (e && e.pathEscapesRoot) {
          edgeRefused = true;
          refusedFields.add("a registry entry's edge_fixtures entry");
        }
        edgeAbs = null;
      }
      if (edgeRefused) {
        findings.push(mkFinding(
          '(refused)',
          0,
          'edge-fixture-absent',
          'warn',
          `check '${entry.slug}' names an edge fixture that resolves outside the repository root; it was refused and never read`
        ));
        continue;
      }
      if (!edgeAbs || !fs.existsSync(edgeAbs)) {
        findings.push(mkFinding(
          path.join(entryFixtureRoot, edgeCase),
          0,
          'edge-fixture-absent',
          'warn',
          `check '${entry.slug}' names edge fixture '${edgeCase}' which is not present under its fixture root`
        ));
      }
    }
  }

  const dirNames = fixtureRootDirents
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !EXCLUDED_FIXTURE_DIR_NAMES.has(d.name))
    .map((d) => d.name)
    .sort(cmpStr);

  for (const dirName of dirNames) {
    const candidate = normalizePath(path.join(fixtureRootOpt, dirName));
    if (!registeredFixtureRoots.has(candidate)) {
      findings.push(mkFinding(
        candidate,
        0,
        'fixture-without-registry-entry',
        'fail',
        `fixture set '${candidate}' has no corresponding registry entry`
      ));
    }
  }

  findings.sort(findingComparator);

  const verdict = findings.some((f) => f.severity === 'fail')
    ? 'fail'
    : findings.some((f) => f.severity === 'warn')
      ? 'warn'
      : 'pass';

  // Refusal sentences are collected in a Set keyed by field name and
  // appended in a fixed sorted order after the base limits, so a run's
  // stated_limits stays a pure function of the input regardless of entry
  // iteration order (FR-8). Both whole-run refusals (options.registry_path,
  // options.fixture_root) return early, above, before refusedFields is ever
  // populated -- so every member reaching this point is per-entry by
  // construction, and the per-entry sentence variant applies wholesale.
  const statedLimits = refusedFields.size
    ? STATED_LIMITS.concat(Array.from(refusedFields).sort(cmpStr).map(entryPathRefusedSentence))
    : STATED_LIMITS;

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
    process.stderr.write('gate-self-test: unable to read input\n');
    process.exitCode = 3;
  }

  if (raw !== null) {
    let parsedInput;
    let parsed = false;
    try {
      parsedInput = JSON.parse(raw);
      parsed = true;
    } catch (e) {
      process.stderr.write('gate-self-test: malformed JSON input\n');
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

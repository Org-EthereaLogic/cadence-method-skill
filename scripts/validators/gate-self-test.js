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
//   and `manifest_path` are (section 2). A missing or unreadable
//   registry_path or fixture_root, or a registry that cannot be parsed,
//   produces "skipped: unavailable" (degrade closed). A registry that
//   names no sibling checks (this check excludes its own slug from the
//   count, to avoid invoking itself) produces "skipped: not-applicable".
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
    'content of a present edge fixture is not validated.'
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
    stated_limits: STATED_LIMITS,
    tool_versions: {}
  };
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
    registry = readJsonFileSync(path.resolve(process.cwd(), registryPathOpt));
  } catch (e) {
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

  const fixtureRootAbs = path.resolve(process.cwd(), fixtureRootOpt);
  let fixtureRootDirents;
  try {
    fixtureRootDirents = fs.readdirSync(fixtureRootAbs, { withFileTypes: true });
  } catch (e) {
    return skipped('unavailable');
  }

  const findings = [];

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

    const frAbs = entryFixtureRoot ? path.resolve(process.cwd(), entryFixtureRoot) : null;
    let usable = Boolean(frAbs) && fs.existsSync(frAbs) && fs.statSync(frAbs).isDirectory();

    let knownBadInputAbs = null;
    if (usable) {
      if (!entry.known_bad_case) {
        usable = false;
      } else {
        knownBadInputAbs = path.resolve(frAbs, entry.known_bad_case, 'input.json');
        usable = fs.existsSync(knownBadInputAbs);
      }
    }

    if (!usable) {
      findings.push(mkFinding(
        entryFixtureRoot || '(unset)',
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
      const scriptAbs = path.resolve(process.cwd(), scriptPath);
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

    const edgeFixtures = Array.isArray(entry.edge_fixtures) ? entry.edge_fixtures.slice().sort(cmpStr) : [];
    for (const edgeCase of edgeFixtures) {
      const edgeAbs = path.resolve(frAbs, edgeCase);
      if (!fs.existsSync(edgeAbs)) {
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
    process.stderr.write('gate-self-test: unable to read input\n');
    process.exit(3);
  }

  let parsedInput;
  try {
    parsedInput = JSON.parse(raw);
  } catch (e) {
    process.stderr.write('gate-self-test: malformed JSON input\n');
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

// A standalone, zero-dependency, checked-in test carrying a HAND-DERIVED
// expectation for every case in the manifest-registry-consistency fixture
// pack.
//
// WHY THIS FILE EXISTS
//
//   A validator's `expected.json` is captured from the validator's own
//   stdout. That makes byte-for-byte fixture parity a test of DETERMINISM,
//   not of correctness: a defect the validator has is frozen identically into
//   its own expectation, and the whole pack stays green while the defect
//   ships. The table below is a SECOND, INDEPENDENT statement of what each
//   case must produce, written from the acceptance criteria of issue #25 and
//   the spec-sheet §4 verdict semantics rather than from stdout. It is
//   asserted against BOTH `expected.json` AND a live subprocess run, so
//   re-freezing the pack can never restore green on its own: a behavioural
//   change has to be reproduced here too, by a human editing a literal.
//
//   `source` on each row records where its expectation comes from:
//     "spec" -- a case the spec sheet §4 names by exact path
//     "AC"   -- stated directly in issue #25's acceptance criteria
//     "rule" -- derived from the verdict semantics the spec §4 states
//
// WHAT IT ASSERTS
//
//   Per case: status, skipped_reason, verdict, the sorted set of finding
//   codes, whether the containment-refusal sentence is present, and the
//   process exit code -- against the frozen expectation and a live run.
//   Globally: the pack and the table cover exactly the same set of cases, so
//   a new fixture cannot be added without a hand-derived expectation.
//
// USAGE: node scripts/validators/tests/manifest-registry-consistency.expectations.test.js
//   Run from the repository root. Exit 0 when every assertion holds, 1
//   otherwise.

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = 'fixtures/manifest-registry-consistency';
const SCRIPT = 'scripts/validators/manifest-registry-consistency.js';

function ran(verdict, codes, source) {
  return { status: 'ran', reason: null, verdict: verdict, codes: codes.slice().sort(), refused: false, source: source };
}
function skip(reason, refused, source) {
  return { status: 'skipped', reason: reason, verdict: null, codes: [], refused: refused, source: source };
}

// The hand-derived expectation for every case. Verdicts and finding codes are
// read off the spec §4 verdict table and issue #25's acceptance criteria, not
// off the validator.
const EXPECT = {
  'pass-one-authority-all-rows': ran('pass', [], 'spec'),
  'warn-empty-selection-rationale': ran('warn', ['selection-rationale-empty'], 'spec'),
  'fail-two-authority-documents': ran('fail', ['authority-document-count-invalid'], 'spec'),
  'fail-zero-authority-documents': ran('fail', ['authority-document-count-invalid'], 'AC'),
  'fail-governed-artifact-orphaned': ran('fail', ['governed-artifact-unregistered'], 'AC'),
  'pass-orphan-row-added': ran('pass', [], 'AC'),
  'pass-zone-move-basename-join': ran('pass', [], 'AC'),
  'fail-ambiguous-shared-basename': ran('fail', ['governed-artifact-unregistered', 'governed-artifact-unregistered'], 'AC'),
  'pass-evidence-root-file-needs-no-row': ran('pass', [], 'AC'),
  'pass-derived-render-needs-no-row': ran('pass', [], 'AC'),
  'fail-manifest-row-file-missing': ran('fail', ['manifest-row-file-missing'], 'rule'),
  'fail-selection-rationale-absent': ran('fail', ['selection-rationale-absent'], 'AC'),
  'skip-no-document-set': skip('not-applicable', false, 'AC'),
  'skipped-manifest-unparseable': skip('unavailable', false, 'AC'),
  'skipped-manifest-path-escapes-root': skip('unavailable', true, 'AC'),
  'skipped-symlink-manifest-escapes-root': skip('unavailable', true, 'AC')
};

const EXIT = { pass: 0, warn: 10, fail: 20 };

let passed = 0;
let failed = 0;
function check(ok, name, detail) {
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    console.log('  FAIL  ' + name + (detail ? '\n        ' + detail : ''));
  }
}

function refusalPresent(envelope) {
  const sl = Array.isArray(envelope.stated_limits) ? envelope.stated_limits : [];
  return sl.some((s) => /resolves outside the repository root and was refused unread by the/.test(s));
}

function assertEnvelope(where, name, env, exp) {
  check(env.status === exp.status, name + ' [' + where + '] status', `got ${env.status}, want ${exp.status}`);
  check(env.skipped_reason === exp.reason, name + ' [' + where + '] skipped_reason', `got ${env.skipped_reason}, want ${exp.reason}`);
  check(env.verdict === exp.verdict, name + ' [' + where + '] verdict', `got ${env.verdict}, want ${exp.verdict}`);
  const codes = (Array.isArray(env.findings) ? env.findings : []).map((f) => f.code).sort();
  check(JSON.stringify(codes) === JSON.stringify(exp.codes), name + ' [' + where + '] finding codes', `got ${JSON.stringify(codes)}, want ${JSON.stringify(exp.codes)}`);
  check(refusalPresent(env) === exp.refused, name + ' [' + where + '] refusal sentence', `got ${refusalPresent(env)}, want ${exp.refused}`);
}

const cases = fs.readdirSync(ROOT).filter((d) => fs.statSync(path.join(ROOT, d)).isDirectory()).sort();

// Global: the table and the pack describe exactly the same cases.
const tableCases = Object.keys(EXPECT).sort();
check(
  JSON.stringify(tableCases) === JSON.stringify(cases),
  'the hand-derived table and the fixture pack cover the same cases',
  'only in pack: ' + cases.filter((c) => !EXPECT[c]).join(', ') + ' | only in table: ' + tableCases.filter((c) => cases.indexOf(c) === -1).join(', ')
);

for (const c of cases) {
  const exp = EXPECT[c];
  if (!exp) continue;

  // (a) the frozen expectation
  const frozen = JSON.parse(fs.readFileSync(path.join(ROOT, c, 'expected.json'), 'utf8'));
  assertEnvelope('frozen', c, frozen, exp);

  // (b) a live subprocess run, plus its exit code
  const r = spawnSync(process.execPath, [SCRIPT, path.join(ROOT, c, 'input.json')], { cwd: process.cwd(), encoding: 'utf8' });
  let live;
  try {
    live = JSON.parse(r.stdout);
  } catch (e) {
    check(false, c + ' [live] parses', 'stdout was not JSON: ' + r.stderr);
    continue;
  }
  assertEnvelope('live', c, live, exp);
  const wantExit = exp.status === 'skipped' ? 30 : EXIT[exp.verdict];
  check(r.status === wantExit, c + ' [live] exit code', `got ${r.status}, want ${wantExit}`);

  // (c) live stdout is byte-identical to the frozen expectation (determinism)
  check(r.stdout === fs.readFileSync(path.join(ROOT, c, 'expected.json'), 'utf8'), c + ' live stdout == expected.json (byte-identical)');
}

console.log('');
console.log('=== Summary ===');
console.log('  ' + passed + ' passed, ' + failed + ' failed, ' + (passed + failed) + ' assertion(s) total');
console.log('  ' + cases.length + ' frozen case(s)');
if (failed) process.exitCode = 1;

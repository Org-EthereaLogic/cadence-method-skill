// A standalone, zero-dependency, checked-in test for the loose-pointer-drift
// validator's warn-only guarantee (method section 6.2 rule 1, FR-12, task
// acceptance criterion 10). It is not itself a gate check: it carries no
// `// INPUT:`/`// USAGE:` pair and exports nothing, so it is placed under
// `scripts/validators/tests/`, a subdirectory, rather than directly in
// `scripts/validators/` -- keeping that flat directory exactly the set of
// shipped validator scripts the registry and the gate self-test read
// (CONTRIBUTING.md: every file directly under `scripts/validators/` opens
// with the INPUT/USAGE pair and exports `manifest` + `execute(input)`; this
// file does neither). Verified safe against the two things that scan these
// trees: `gate-self-test.js`'s reverse fixture/registry agreement scan reads
// `fixtures/`, never `scripts/`, and `scripts/guardrails-check.sh` touches
// `scripts/` only for its forbidden-marker grep. This placement decision has
// no other repository-controlled home to be recorded in: the task contract
// admits no documentation path for this change, so it is recorded here, in
// this file's own header, instead.
//
// WHAT THIS ASSERTS, AND WHAT IT DELIBERATELY DOES NOT
//   For every case directory under fixtures/loose-pointer-drift/, this
//   enumerates input.json, runs the validator against it as a real
//   subprocess (the way the gate itself would), and asserts:
//     - output.verdict is never the string "fail";
//     - no element of output.findings carries severity "fail";
//     - the process exit code is never 20 (the sibling checks' fail code).
//   It asserts NOTHING about output.status. A "skipped" run with
//   verdict: null is a CORRECT, healthy outcome under this check's contract
//   (NFR-6, docs/validator-spec-sheet.md section 2) -- status and verdict
//   answer different questions, and a test that read a skip as a warn-only
//   violation would be the exact defect this task calls out.
//
// USAGE: node scripts/validators/tests/loose-pointer-drift.warn-only.test.js
//   Run from anywhere; the repository root is located from this file's own
//   path so the validator's cwd-relative path resolution still applies.
//   Exits 0 when every case passed, 1 when any case failed.
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const VALIDATOR = path.join(REPO_ROOT, 'scripts', 'validators', 'loose-pointer-drift.js');
const FIXTURE_ROOT = path.join(REPO_ROOT, 'fixtures', 'loose-pointer-drift');

function listCaseDirs() {
  return fs
    .readdirSync(FIXTURE_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function runCase(caseName) {
  const inputAbs = path.join(FIXTURE_ROOT, caseName, 'input.json');
  const result = spawnSync(process.execPath, [VALIDATOR, inputAbs], {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  });
  let output = null;
  let parseError = null;
  try {
    output = JSON.parse(result.stdout);
  } catch (e) {
    parseError = e;
  }
  return { caseName: caseName, exitCode: result.status, output: output, parseError: parseError };
}

function evaluateCase(run) {
  const problems = [];
  if (run.parseError || !run.output) {
    problems.push('stdout did not parse as JSON: ' + (run.parseError ? run.parseError.message : 'empty output'));
    return problems;
  }
  if (run.output.verdict === 'fail') {
    problems.push('verdict was "fail" -- unreachable by design (method section 6.2 rule 1)');
  }
  const findings = Array.isArray(run.output.findings) ? run.output.findings : [];
  const failFindings = findings.filter((f) => f && f.severity === 'fail');
  if (failFindings.length) {
    problems.push(failFindings.length + ' finding(s) carried severity "fail"');
  }
  if (run.exitCode === 20) {
    problems.push('exit code was 20 (the sibling checks\' fail code); this check never emits it');
  }
  // Deliberately NO assertion on run.output.status: skipped is a correct,
  // independent outcome and is never read here as a warn-only violation.
  return problems;
}

function main() {
  const cases = listCaseDirs();
  let passCount = 0;
  let failCount = 0;

  console.log('loose-pointer-drift warn-only guarantee (' + cases.length + ' case(s))');
  console.log();

  for (const caseName of cases) {
    const run = runCase(caseName);
    const problems = evaluateCase(run);
    if (problems.length === 0) {
      console.log('  PASS  ' + caseName);
      passCount++;
    } else {
      console.log('  FAIL  ' + caseName);
      for (const p of problems) console.log('        - ' + p);
      failCount++;
    }
  }

  console.log();
  console.log('=== Summary ===');
  console.log('  ' + passCount + ' passed, ' + failCount + ' failed, ' + cases.length + ' case(s) total');
  process.exitCode = failCount > 0 ? 1 : 0;
}

main();

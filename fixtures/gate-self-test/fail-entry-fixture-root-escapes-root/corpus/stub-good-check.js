// INPUT: any JSON file (content ignored) -- fixed-behavior test double used
//   only by fixtures/gate-self-test/fail-entry-fixture-root-escapes-root/.
//   It fires its recorded known-bad verdict and finding code correctly,
//   proving the corpus's failure comes from the sibling registry entry
//   (stub-escaping-root) whose fixture_root escapes the repository root,
//   not from a blanket failure of every registered check.
// USAGE: node stub-good-check.js <input.json|->
'use strict';
const output = {
  check: 'stub-good-check',
  status: 'ran',
  skipped_reason: null,
  verdict: 'fail',
  findings: [
    { path: 'stub-good-check/known-bad', line: 1, code: 'stub-good-finding', severity: 'fail', message: 'seeded known-bad defect fires as expected' }
  ],
  stated_limits: [],
  tool_versions: {}
};
process.stdout.write(JSON.stringify(output));
process.exit(20);

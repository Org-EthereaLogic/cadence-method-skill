// INPUT: any JSON file (content ignored) -- fixed-behavior test double used
//   only by fixtures/gate-self-test/warn-edge-fixture-absent/. It fires its
//   recorded known-bad verdict and finding code correctly; the corpus's
//   registry names an edge fixture ("extra-check") that is deliberately
//   absent from disk, so the self-test must record that gap as a warn
//   rather than block on it.
// USAGE: node stub-fail-check.js <input.json|->
'use strict';
const output = {
  check: 'stub-fail-check',
  status: 'ran',
  skipped_reason: null,
  verdict: 'fail',
  findings: [
    { path: 'stub-fail-check/known-bad', line: 1, code: 'stub-fail-finding', severity: 'fail', message: 'seeded known-bad defect fires as expected' }
  ],
  stated_limits: [],
  tool_versions: {}
};
process.stdout.write(JSON.stringify(output));
process.exit(20);

// INPUT: any JSON file (content ignored) -- fixed-behavior test double used
//   only by fixtures/gate-self-test/pass-every-check-fires/. It always
//   fires its recorded known-bad verdict and finding code, proving the
//   self-test accepts a check that still fires correctly. This is the
//   restored (green) member of the fail-check-silently-disabled pattern-7
//   pair: same shape as that corpus's stub-neutered-check.js, un-neutered.
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

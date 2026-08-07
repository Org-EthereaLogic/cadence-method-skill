// INPUT: any JSON file (content ignored) -- fixed-behavior test double used
//   only by fixtures/gate-self-test/pass-self-entry-with-sibling-agrees/. It
//   always fires its recorded known-bad verdict and finding code, standing in
//   for a valid sibling gate check registered alongside the gate-self-test
//   self-entry, so the self-test has a real sibling to invoke while the
//   reverse registry<->fixture-root scan must also recognize the self-entry's
//   own fixture directory as registered.
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

// INPUT: any JSON file (content ignored) -- fixed-behavior test double used
//   only by fixtures/gate-self-test/fail-self-entry-missing-fixture/. It fires
//   its recorded known-bad verdict and finding code correctly, standing in for
//   a valid sibling gate check registered alongside a BROKEN gate-self-test
//   self-entry (whose fixture_root points at a directory absent on disk). Its
//   correct firing proves the corpus's failure comes from the self-entry's
//   missing fixture set -- caught by the forward structural existence check now
//   applied to the self-entry -- not from a blanket failure of every check.
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

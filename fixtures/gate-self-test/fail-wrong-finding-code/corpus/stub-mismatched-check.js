// INPUT: any JSON file (content ignored) -- fixed-behavior test double used
//   only by fixtures/gate-self-test/fail-wrong-finding-code/. It returns
//   the recorded non-pass verdict ("fail") but carries a DIFFERENT finding
//   code than the registry records: red, but not for the right reason
//   (method pattern 7). The self-test must reject this as
//   finding-code-mismatch, not accept it as a pass.
// USAGE: node stub-mismatched-check.js <input.json|->
'use strict';
const output = {
  check: 'stub-mismatched-check',
  status: 'ran',
  skipped_reason: null,
  verdict: 'fail',
  findings: [
    { path: 'stub-mismatched-check/known-bad', line: 1, code: 'a-different-finding-code', severity: 'fail', message: 'fires, but not for the recorded reason' }
  ],
  stated_limits: [],
  tool_versions: {}
};
process.stdout.write(JSON.stringify(output));
process.exit(20);

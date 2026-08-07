// INPUT: any JSON file (content ignored) -- fixed-behavior test double used
//   only by fixtures/gate-self-test/fail-check-silently-disabled/. This is
//   the seeded SC-2 defect: the registry records that this check must
//   return "fail" with finding code "stub-neutered-finding" on its
//   known-bad fixture, but the script has been silently neutered and
//   always returns "pass" with no findings -- it no longer fires. The
//   self-test must catch this and name the check (check-did-not-fire).
// USAGE: node stub-neutered-check.js <input.json|->
'use strict';
const output = {
  check: 'stub-neutered-check',
  status: 'ran',
  skipped_reason: null,
  verdict: 'pass',
  findings: [],
  stated_limits: [],
  tool_versions: {}
};
process.stdout.write(JSON.stringify(output));
process.exit(0);

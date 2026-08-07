// INPUT: any JSON file (content ignored) -- fixed-behavior test double used
//   only by fixtures/gate-self-test/pass-every-check-fires/. It is the
//   loose-pointer-drift analog: its registry entry records the non-pass
//   verdict "warn" (never "fail"), and it always returns warn with the
//   recorded finding code, proving a warn-only check is accepted as
//   correctly fired rather than reported broken (method 6.2 rule 1).
// USAGE: node stub-warn-check.js <input.json|->
'use strict';
const output = {
  check: 'stub-warn-check',
  status: 'ran',
  skipped_reason: null,
  verdict: 'warn',
  findings: [
    { path: 'stub-warn-check/known-bad', line: 1, code: 'stub-warn-finding', severity: 'warn', message: 'seeded known-bad drift fires as expected' }
  ],
  stated_limits: [],
  tool_versions: {}
};
process.stdout.write(JSON.stringify(output));
process.exit(10);

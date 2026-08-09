// A standalone, zero-dependency, checked-in test carrying a HAND-DERIVED
// expectation for every case in the loose-pointer-drift fixture pack.
//
// WHY THIS FILE EXISTS
//
//   A validator's `expected.json` is captured from the validator's own
//   stdout. That makes byte-for-byte fixture parity a test of DETERMINISM,
//   not of correctness: a defect the validator has is frozen identically into
//   its own expectation, and the whole pack stays green while the defect
//   ships. That is not hypothetical -- it is exactly how eleven reproducible
//   defects survived a 28-case pack, two full pipeline runs and five
//   independent adversarial rounds on this very check.
//
//   The table below is a SECOND, INDEPENDENT statement of what each case
//   must produce, written from the acceptance criteria and the pointer
//   grammar rather than from stdout. It is asserted against BOTH
//   `expected.json` AND a live run. Re-freezing the pack can therefore never
//   restore green on its own: a behavioural change has to be reproduced here
//   too, by a human editing a literal, which is the point at which somebody
//   has to decide the new behaviour is correct.
//
//   `source` on each row records where its expectation comes from:
//     "AC"    -- stated directly in issue #24's acceptance criteria
//     "spec"  -- stated in docs/validator-spec-sheet.md section 4 or 7
//     "rule"  -- derived from the pointer grammar this script states in its
//                own header and stated_limits, before the case was ever run
//
// WHAT IT ASSERTS
//
//   Per case: status, skipped_reason, verdict, the LINE of every finding in
//   order, the number of "Not compared" disclosure sentences, whether the
//   containment-refusal sentence is present, and the process exit code --
//   against the frozen expectation and against a live subprocess run.
//
//   Globally: the pack and the table cover exactly the same set of cases (so
//   a new fixture cannot be added without a hand-derived expectation), and no
//   case anywhere yields verdict "fail", a finding of severity "fail", or
//   exit code 20 -- the warn-only guarantee, re-checked here independently of
//   its own dedicated test.
//
// USAGE: node scripts/validators/tests/loose-pointer-drift.expectations.test.js
//   Run from the repository root. Exit 0 when every assertion holds, 1
//   otherwise.

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = 'fixtures/loose-pointer-drift';
const SCRIPT = 'scripts/validators/loose-pointer-drift.js';

// status, reason, verdict, findingLines, disclosures, exit, [refused]
function ran(verdict, findingLines, disclosures, source) {
  return {
    status: 'ran',
    reason: null,
    verdict: verdict,
    findingLines: findingLines,
    disclosures: disclosures,
    exit: verdict === 'warn' ? 10 : 0,
    refused: false,
    source: source
  };
}

function skip(reason, source, refused) {
  return {
    status: 'skipped',
    reason: reason,
    verdict: null,
    findingLines: [],
    disclosures: 0,
    exit: 30,
    refused: !!refused,
    source: source
  };
}

const EXPECT = {
  // -- The three fixtures the spec sheet names, at the verdicts it fixes ----
  'pass-pointer-matches-manifest': ran('pass', [], 0, 'AC/spec: every pointer matches the assertion'),
  'warn-pointer-one-revision-behind': ran('warn', [3], 0, 'AC/spec: one revision behind is a warn, never a fail'),
  'falsifiability-drift-plus-historic-row':
    ran('warn', [3], 0, 'AC/spec: warn with EXACTLY ONE finding, on the live pointer only'),

  // -- The three edge cases the spec sheet states -------------------------
  'pass-revision-row-names-older-version': ran('pass', [], 0, 'spec edge 1: no finding on a revision row'),
  'pass-manifest-asserts-unpointed-document': ran('pass', [], 0, 'spec edge 3: an unpointed assertion is fine'),
  'pass-artifact-carries-no-pointer': ran('pass', [], 0, 'spec: an artifact carrying no pointer passes'),

  // -- Skips: status is independent of verdict (AC3, AC4, NFR-6) ----------
  'skipped-manifest-absent': skip('unavailable', 'AC3: an unreadable manifest is not a pass'),
  'skipped-manifest-unparseable': skip('unavailable', 'AC3: an unparseable manifest is not a pass'),
  'skipped-manifest-asserts-no-version': skip('not-applicable', 'AC4: nothing to drift from'),
  'skipped-pointed-at-document-unasserted': skip('not-applicable', 'AC4: the pointed-at document is unasserted'),
  'skipped-version-authority-selector-unparseable':
    skip('not-applicable', 'rule: an unparseable selector resolves no entries, never the default'),

  // -- Root containment: refused UNREAD and distinguishable from ENOENT ----
  'skipped-manifest-path-escapes-root': skip('unavailable', 'AC13: refused unread, disclosed', true),
  'skipped-artifact-path-escapes-root': skip('unavailable', 'AC13: refused unread, disclosed', true),
  'skipped-symlink-artifact-escapes-root': skip('unavailable', 'AC13: symlink escape refused, disclosed', true),

  // -- Regression cases for the defects that ended the two pipeline runs ---
  'warn-token-between-references-binds-the-preceding-one':
    ran('warn', [3], 1, 'rule: DEFECT 9 -- a token binds the reference before it, and ONLY that one'),
  'pass-prose-between-reference-and-token-not-a-pointer':
    ran('pass', [], 2, 'rule: DEFECT 11 -- prose is not a pointer form; compare nothing, disclose both'),
  'pass-exact-path-outranks-other-document-basename':
    ran('pass', [], 1, "rule: DEFECT 10 -- a document's own path outranks another's basename"),
  'warn-two-references-two-tokens-both-reported':
    ran('warn', [3, 3], 0, 'rule: the over-correction guard -- two references, two tokens, TWO findings'),

  // -- The pointer grammar, rule by rule ----------------------------------
  'warn-token-after-reference-binds-that-reference-only':
    ran('warn', [3], 1, 'rule: a connective word blocks the second candidate'),
  'pass-token-between-two-references-refused':
    ran('pass', [], 1, 'rule: a reference claimed by two tokens is contested; both refused'),
  'pass-shared-basename-reference-refused':
    ran('pass', [], 1, 'rule: a basename two documents share is attributed to neither'),
  'pass-duplicate-declared-path-conflicting-versions-refused':
    ran('pass', [], 1, 'rule: one path declared twice with conflicting versions is refused'),
  'pass-token-in-next-sentence-not-a-pointer':
    ran('pass', [], 1, 'rule: sentence punctuation ends the clause a reference belongs to'),
  'pass-reference-inside-parenthetical-aside-refused':
    ran('pass', [], 2, 'rule: a reference inside an aside may not reach a token outside it'),
  'warn-markdown-link-target-binds':
    ran('warn', [3], 0, 'rule: a group whose whole content IS the reference stays transparent'),
  'pass-token-two-cells-away-not-a-pointer':
    ran('pass', [], 1, 'rule: at most one unescaped table-cell boundary'),
  'pass-escaped-backslash-does-not-escape-the-pipe':
    ran('pass', [], 1, 'rule: a pipe is escaped only after an ODD run of backslashes'),
  'warn-wide-aligned-table-row-binds':
    ran('warn', [5], 0, 'rule: a wide ALIGNED row still binds -- no character budget'),
  'warn-parenthesised-aside-in-separator-is-a-pointer':
    ran('warn', [3], 0, 'rule: a balanced aside is removed before the separator test'),
  'warn-one-reference-binds-while-another-is-disclosed':
    ran('warn', [3], 1, 'rule: per-reference disclosure -- one binds, the other is named'),
  'warn-bare-path-recognized-without-backticks':
    ran('warn', [3], 1, 'rule: a bare path is a reference; ".bak" is a filename continuation'),
  'pass-version-substring-inside-word-not-a-pointer':
    ran('pass', [], 0, 'rule: IPv4/REV2/V2X are not version tokens'),
  'warn-live-version-first-table-drift-reported':
    ran('warn', [7], 0, 'rule: a version-first row binds backward; history under a named section does not'),

  // -- Masking and revision-record exclusion ------------------------------
  'pass-pointer-inside-fenced-block-excluded': ran('pass', [], 0, 'rule: fenced example text is not live'),
  'pass-tilde-fenced-block-excluded': ran('pass', [], 0, 'rule: a "~~~" fence masks exactly like "```"'),
  'warn-fenced-heading-opens-no-exclusion':
    ran('warn', [11], 0, 'rule: masking precedes exclusion, so a fenced heading opens no window'),
  'warn-heading-mentioning-revision-record-stays-live':
    ran('warn', [6], 0, 'rule: a heading must END with the phrase to open a window'),
  'warn-history-row-under-unrecognised-heading-stays-live':
    ran('warn', [7], 0, 'rule: the ACCEPTED NOISE of having no shape-based row test'),
  'warn-pointer-in-backticked-span-still-live':
    ran('warn', [5], 0, 'rule: inline backtick spans are deliberately not masked'),

  // -- The manifest side --------------------------------------------------
  'warn-authority-document-supplies-assertion':
    ran('warn', [3], 0, 'rule: authority_document is read as reference and assertion'),
  'warn-custom-version-authority-honored':
    ran('warn', [3], 0, 'rule: a non-default selector resolving a root-level array is honored')
};

let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    console.log('  FAIL  ' + name + (detail ? '\n        ' + detail : ''));
  }
}

function shapeOf(env, exitCode) {
  return {
    status: env.status,
    reason: env.skipped_reason,
    verdict: env.verdict,
    findingLines: env.findings.map((f) => f.line),
    disclosures: env.stated_limits.filter((s) => s.indexOf('Not compared -- ') === 0).length,
    refused: env.stated_limits.some((s) => s.indexOf('No further file was read') === 0),
    exit: exitCode
  };
}

function diff(want, got) {
  const parts = [];
  for (const k of ['status', 'reason', 'verdict', 'disclosures', 'refused', 'exit']) {
    if (String(want[k]) !== String(got[k])) parts.push(k + ': want ' + want[k] + ', got ' + got[k]);
  }
  if (JSON.stringify(want.findingLines) !== JSON.stringify(got.findingLines)) {
    parts.push('finding lines: want [' + want.findingLines + '], got [' + got.findingLines + ']');
  }
  return parts.join('; ');
}

const onDisk = fs.readdirSync(ROOT).filter((d) => fs.statSync(path.join(ROOT, d)).isDirectory()).sort();
const declared = Object.keys(EXPECT).sort();

const undeclared = onDisk.filter((c) => declared.indexOf(c) === -1);
const missing = declared.filter((c) => onDisk.indexOf(c) === -1);

check(
  'every fixture case carries a hand-derived expectation',
  undeclared.length === 0,
  undeclared.length ? 'no expectation declared for: ' + undeclared.join(', ') : ''
);
check(
  'every declared expectation has a fixture case',
  missing.length === 0,
  missing.length ? 'declared but absent on disk: ' + missing.join(', ') : ''
);

for (const name of onDisk) {
  const want = EXPECT[name];
  if (!want) continue;

  const frozen = JSON.parse(fs.readFileSync(path.join(ROOT, name, 'expected.json'), 'utf8'));
  // The frozen file records no exit code; take the contract's mapping so the
  // one comparison covers both artefacts.
  const frozenExit = frozen.status === 'skipped' ? 30 : (frozen.verdict === 'warn' ? 10 : 0);
  const frozenShape = shapeOf(frozen, frozenExit);
  check('frozen matches hand-derived: ' + name, diff(want, frozenShape) === '', diff(want, frozenShape));

  const r = spawnSync(process.execPath, [SCRIPT, path.join(ROOT, name, 'input.json')], { encoding: 'utf8' });
  let live;
  try {
    live = JSON.parse(r.stdout);
  } catch (e) {
    check('live run parses: ' + name, false, 'stdout was not JSON');
    continue;
  }
  const liveShape = shapeOf(live, r.status);
  check('live matches hand-derived: ' + name, diff(want, liveShape) === '', diff(want, liveShape));

  check(
    'warn-only holds: ' + name,
    live.verdict !== 'fail' && !live.findings.some((f) => f.severity === 'fail') && r.status !== 20,
    'a warn-only check must never emit fail, a fail-severity finding, or exit 20'
  );
}

console.log('');
console.log('=== Summary ===');
console.log('  ' + passed + ' passed, ' + failed + ' failed, ' + (passed + failed) + ' assertion(s) total');
if (failed) process.exitCode = 1;

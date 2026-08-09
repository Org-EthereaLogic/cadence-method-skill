// A standalone, zero-dependency, checked-in test for the loose-pointer-drift
// validator's falsifiability pair (task acceptance criterion 11, SC-2,
// method pattern 7), adapted to a warn-only check: rather than a
// fail-vs-pass pair, this proves a seeded-drift input yields "warn" citing
// that drift while an aligned input yields "pass". Placed under
// `scripts/validators/tests/`, alongside its warn-only-guarantee sibling,
// for the same reason recorded in that file's header: this is not itself a
// gate check (no `// INPUT:`/`// USAGE:` pair, no `manifest`/`execute`
// export), so it does not belong directly in the flat `scripts/validators/`
// directory the registry and the gate self-test read as the shipped-check
// set, and the task contract admits no documentation path in which to
// record that placement decision elsewhere.
//
// THE THREE ASSERTIONS
//   1. The SEEDED-DRIFT input (fixtures/loose-pointer-drift/
//      warn-pointer-one-revision-behind/input.json) yields verdict "warn"
//      with EXACTLY ONE finding of code "loose-pointer-version-drift", on
//      the line the two corpora actually differ on, naming both the
//      asserted and the found version in its message.
//   2. The ALIGNED input (fixtures/loose-pointer-drift/
//      pass-pointer-matches-manifest/input.json) yields verdict "pass"
//      with zero findings.
//   3. The pair is GENUINELY MINIMAL, which is what makes it falsifiability
//      evidence rather than two unrelated fixtures: the two cases'
//      corpus/artifact.md files differ by exactly one whitespace-delimited
//      token, on exactly one line, and their corpus/manifest.json files are
//      byte-identical. The verdict difference is therefore attributable to
//      the seeded drift and to nothing else.
//   A fourth assertion runs the fail-slot falsifiability fixture
//   (falsifiability-drift-plus-historic-row) and confirms verdict "warn"
//   with EXACTLY ONE finding, on the live pointer's line only -- proving
//   both naive failure modes absent: returning "fail" on the drift, and
//   reporting a second finding on the historic revision row.
//
// USAGE: node scripts/validators/tests/loose-pointer-drift.falsifiability.test.js
//   Run from anywhere; the repository root is located from this file's own
//   path. Exits 0 when every assertion held, 1 when any failed.
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const VALIDATOR = path.join(REPO_ROOT, 'scripts', 'validators', 'loose-pointer-drift.js');
const FIXTURE_ROOT = path.join(REPO_ROOT, 'fixtures', 'loose-pointer-drift');

const WARN_CASE = 'warn-pointer-one-revision-behind';
const PASS_CASE = 'pass-pointer-matches-manifest';
const FAIL_SLOT_CASE = 'falsifiability-drift-plus-historic-row';

const VERSION_TOKEN_RE = /[vV]\d+(?:\.\d+)*/;

function runCase(caseName) {
  const inputAbs = path.join(FIXTURE_ROOT, caseName, 'input.json');
  const result = spawnSync(process.execPath, [VALIDATOR, inputAbs], {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  });
  return { exitCode: result.status, output: JSON.parse(result.stdout) };
}

function readCorpusFile(caseName, relName) {
  return fs.readFileSync(path.join(FIXTURE_ROOT, caseName, 'corpus', relName), 'utf8');
}

function tokenize(text) {
  return text.split(/\s+/).filter((t) => t.length > 0);
}

// Returns the count of differing whitespace-delimited tokens between two
// texts of otherwise identical shape, or null when their token counts
// differ (a structural difference this test cannot characterise as "one
// token").
function countDifferingTokens(textA, textB) {
  const a = tokenize(textA);
  const b = tokenize(textB);
  if (a.length !== b.length) return null;
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
}

// Returns the 1-indexed line numbers on which two equal-length-in-lines
// texts differ.
function differingLines(textA, textB) {
  const a = textA.split('\n');
  const b = textB.split('\n');
  if (a.length !== b.length) return null;
  const out = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) out.push(i + 1);
  return out;
}

function main() {
  const results = [];
  const record = (label, ok, detail) => results.push({ label: label, ok: ok, detail: detail });

  // --- 1 & 2: the pair's corpora are genuinely minimal -----------------------
  const warnArtifact = readCorpusFile(WARN_CASE, 'artifact.md');
  const passArtifact = readCorpusFile(PASS_CASE, 'artifact.md');
  const warnManifest = readCorpusFile(WARN_CASE, 'manifest.json');
  const passManifest = readCorpusFile(PASS_CASE, 'manifest.json');

  const tokenDiff = countDifferingTokens(passArtifact, warnArtifact);
  record(
    'pair minimality: exactly one differing token between the two artifact.md files',
    tokenDiff === 1,
    'differing token count = ' + tokenDiff
  );

  const lineDiff = differingLines(passArtifact, warnArtifact);
  record(
    'pair minimality: the differing token sits on exactly one line',
    Array.isArray(lineDiff) && lineDiff.length === 1,
    'differing line(s) = ' + JSON.stringify(lineDiff)
  );

  record(
    'pair minimality: the two corpus/manifest.json files are byte-identical',
    passManifest === warnManifest,
    passManifest === warnManifest ? 'identical' : 'differ'
  );

  const seededLine = Array.isArray(lineDiff) && lineDiff.length === 1 ? lineDiff[0] : null;
  const foundVersionMatch = seededLine ? VERSION_TOKEN_RE.exec(warnArtifact.split('\n')[seededLine - 1]) : null;
  const foundVersion = foundVersionMatch ? foundVersionMatch[0] : null;
  const manifestObj = JSON.parse(warnManifest);
  const assertedVersion = manifestObj.document_set.documents[0].current_version;

  // --- 3: the seeded-drift input yields warn, citing the drift ---------------
  const warnRun = runCase(WARN_CASE);
  const warnFindings = (warnRun.output && Array.isArray(warnRun.output.findings)) ? warnRun.output.findings : [];
  record(
    'seeded-drift input: verdict is "warn"',
    warnRun.output && warnRun.output.verdict === 'warn',
    'verdict = ' + (warnRun.output && warnRun.output.verdict)
  );
  record(
    'seeded-drift input: exactly one finding, code loose-pointer-version-drift',
    warnFindings.length === 1 && warnFindings[0] && warnFindings[0].code === 'loose-pointer-version-drift',
    'findings = ' + JSON.stringify(warnFindings)
  );
  record(
    'seeded-drift input: the finding sits on the seeded (differing) line',
    seededLine !== null && warnFindings[0] && warnFindings[0].line === seededLine,
    'finding.line = ' + (warnFindings[0] && warnFindings[0].line) + ', seeded line = ' + seededLine
  );
  const message = (warnFindings[0] && warnFindings[0].message) || '';
  record(
    'seeded-drift input: the finding names both the asserted and the found version',
    Boolean(assertedVersion) && Boolean(foundVersion) &&
      message.indexOf(assertedVersion) !== -1 && message.indexOf(foundVersion) !== -1,
    'message = ' + JSON.stringify(message) + ', asserted = ' + assertedVersion + ', found = ' + foundVersion
  );

  // --- 4: the aligned input yields pass, with zero findings -------------------
  const passRun = runCase(PASS_CASE);
  record(
    'aligned input: verdict is "pass" with zero findings',
    passRun.output && passRun.output.verdict === 'pass' &&
      Array.isArray(passRun.output.findings) && passRun.output.findings.length === 0,
    'verdict = ' + (passRun.output && passRun.output.verdict) + ', findings = ' + JSON.stringify(passRun.output && passRun.output.findings)
  );

  // --- 5: the fail-slot falsifiability fixture: warn, one finding, live line only
  const failSlotRun = runCase(FAIL_SLOT_CASE);
  const failSlotFindings = (failSlotRun.output && Array.isArray(failSlotRun.output.findings)) ? failSlotRun.output.findings : [];
  const failSlotArtifact = readCorpusFile(FAIL_SLOT_CASE, 'artifact.md');
  const failSlotLines = failSlotArtifact.split('\n');
  const historicRowLineNo = failSlotLines.findIndex((l) => /\|\s*v1\.0\s*\|/.test(l)) + 1;
  record(
    'fail-slot falsifiability fixture: verdict is "warn"',
    failSlotRun.output && failSlotRun.output.verdict === 'warn',
    'verdict = ' + (failSlotRun.output && failSlotRun.output.verdict)
  );
  record(
    'fail-slot falsifiability fixture: exactly one finding',
    failSlotFindings.length === 1,
    'findings.length = ' + failSlotFindings.length
  );
  record(
    'fail-slot falsifiability fixture: the finding is NOT on the historic revision row',
    historicRowLineNo > 0 && failSlotFindings[0] && failSlotFindings[0].line !== historicRowLineNo,
    'finding.line = ' + (failSlotFindings[0] && failSlotFindings[0].line) + ', historic row line = ' + historicRowLineNo
  );

  console.log('loose-pointer-drift falsifiability pair (' + results.length + ' assertion(s))');
  console.log();
  let passCount = 0;
  let failCount = 0;
  for (const r of results) {
    if (r.ok) {
      console.log('  PASS  ' + r.label);
      passCount++;
    } else {
      console.log('  FAIL  ' + r.label);
      console.log('        - ' + r.detail);
      failCount++;
    }
  }
  console.log();
  console.log('=== Summary ===');
  console.log('  ' + passCount + ' passed, ' + failCount + ' failed, ' + results.length + ' assertion(s) total');
  process.exitCode = failCount > 0 ? 1 : 0;
}

main();

// A standalone, zero-dependency, checked-in FALSIFIABILITY test for the
// manifest-registry-consistency validator: the SC-2 pattern-7 pair.
//
// WHY THIS FILE EXISTS
//
//   Issue #25 requires a falsifiability pair for the SC-2 defect class (a
//   governed artifact with no manifest/registry row): a fixture that is RED
//   for the right reason -- fail, naming the orphaned artifact -- and a paired
//   fixture, differing only by the addition of that one manifest row, that is
//   GREEN. A validator that returned "fail" unconditionally would satisfy the
//   red half while being useless; a validator that returned "pass"
//   unconditionally would satisfy the green half. Only a check that flips on
//   exactly the added row is doing its job, and only a pair that differs by
//   exactly that row proves the flip is attributable to it.
//
// USAGE: node scripts/validators/tests/manifest-registry-consistency.falsifiability.test.js
//   Run from the repository root. Exit 0 when the pair holds, 1 otherwise.

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = 'fixtures/manifest-registry-consistency';
const SCRIPT = 'scripts/validators/manifest-registry-consistency.js';
const RED = 'fail-governed-artifact-orphaned';
const GREEN = 'pass-orphan-row-added';
const ORPHAN = 'rogue.md';

let passed = 0;
let failed = 0;
function check(ok, name, detail) {
  if (ok) {
    passed += 1;
    console.log('  PASS  ' + name);
  } else {
    failed += 1;
    console.log('  FAIL  ' + name + (detail ? '\n        ' + detail : ''));
  }
}

function run(caseName) {
  const r = spawnSync(process.execPath, [SCRIPT, path.join(ROOT, caseName, 'input.json')], { cwd: process.cwd(), encoding: 'utf8' });
  return { env: JSON.parse(r.stdout), exit: r.status };
}

// Enumerate the governed corpus files (everything under corpus/ except manifest.json).
function corpusFiles(caseName) {
  const base = path.join(ROOT, caseName, 'corpus');
  const out = [];
  (function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(abs);
      else if (ent.name !== 'manifest.json') out.push(path.relative(base, abs).split(path.sep).join('/'));
    }
  })(base);
  return out.sort();
}
function documentRowPaths(caseName) {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, caseName, 'corpus', 'manifest.json'), 'utf8'));
  return (m.document_set.documents || []).map((d) => d.path.split('/').pop()).sort();
}

// --- Red half: fail, for the right reason, naming the orphan. ---
const red = run(RED);
check(red.env.verdict === 'fail', 'red half is fail', 'verdict=' + red.env.verdict);
check(red.exit === 20, 'red half exits 20', 'exit=' + red.exit);
const orphanFindings = (red.env.findings || []).filter((f) => f.code === 'governed-artifact-unregistered');
check(orphanFindings.length === 1, 'red half has exactly one governed-artifact-unregistered finding', 'count=' + orphanFindings.length);
check(
  orphanFindings.length === 1 && orphanFindings[0].path.split('/').pop() === ORPHAN,
  'red half names the orphaned artifact (' + ORPHAN + ')',
  orphanFindings.length ? 'path=' + orphanFindings[0].path : 'no finding'
);

// --- Green half: pass, clean. ---
const green = run(GREEN);
check(green.env.verdict === 'pass', 'green half is pass', 'verdict=' + green.env.verdict);
check(green.exit === 0, 'green half exits 0', 'exit=' + green.exit);
check((green.env.findings || []).length === 0, 'green half has no findings', 'count=' + (green.env.findings || []).length);

// --- The pair differs by exactly the one added row. ---
const redFiles = corpusFiles(RED);
const greenFiles = corpusFiles(GREEN);
check(
  JSON.stringify(redFiles) === JSON.stringify(greenFiles),
  'the governed corpus trees are identical (the flip is not a corpus edit)',
  'red: ' + redFiles.join(',') + ' | green: ' + greenFiles.join(',')
);
const redRows = documentRowPaths(RED);
const greenRows = documentRowPaths(GREEN);
const added = greenRows.filter((p) => redRows.indexOf(p) === -1);
check(
  added.length === 1 && added[0] === ORPHAN && greenRows.length === redRows.length + 1,
  'the green manifest adds exactly the ' + ORPHAN + ' row and nothing else',
  'added: ' + added.join(',')
);
check(
  redFiles.some((f) => f.split('/').pop() === ORPHAN),
  'the orphaned file is present in BOTH corpora (red is red for a missing ROW, not a missing file)',
  'red corpus: ' + redFiles.join(',')
);

console.log('');
console.log('=== Summary ===');
console.log('  ' + passed + ' passed, ' + failed + ' failed, ' + (passed + failed) + ' assertion(s) total');
if (failed) process.exitCode = 1;

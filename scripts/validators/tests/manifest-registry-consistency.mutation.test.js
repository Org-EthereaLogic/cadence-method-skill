// A standalone, zero-dependency, checked-in MUTATION test for the
// manifest-registry-consistency validator: every rule the script states must
// be pinned by at least one frozen fixture.
//
// WHY THIS FILE EXISTS
//
//   A fixture pack whose expected.json files are captured from the validator's
//   own stdout proves determinism, not correctness. The companion expectations
//   test attacks that from one side, by carrying a second, hand-derived
//   statement of what each case must produce. This file attacks it from the
//   other side: it DELETES each rule in turn and requires the pack to notice.
//   A mutation that reddens NOTHING identifies a rule that no fixture pins -- a
//   rule whose removal would ship silently. The two containment-pass mutations
//   are the mutation-tested escape guard issue #25 requires: removing the
//   lexical pass must redden the "../"-traversal fixture, and removing the
//   realpath pass must redden the committed-symlink fixture.
//
//   It also refuses to accept a CRASH as evidence: a mutant that emits no
//   output for any case is reported as a harness error, not as a pass.
//
// HOW IT WORKS
//
//   Each entry names an exact source anchor and a replacement. The anchor is
//   required to be present exactly once -- an anchor that no longer matches is
//   a FAILURE, not a skip, because a refactor that silently disarms a mutation
//   is how this kind of harness rots. Mutants are written to a temporary
//   directory outside the repository and executed with the repository root as
//   the working directory, so path containment resolves as it does in a real
//   run and nothing is written into the checkout.
//
// USAGE: node scripts/validators/tests/manifest-registry-consistency.mutation.test.js
//   Run from the repository root. Exit 0 when every rule is pinned, 1
//   otherwise.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = 'fixtures/manifest-registry-consistency';
const SRC = 'scripts/validators/manifest-registry-consistency.js';

const MUTATIONS = [
  {
    id: 'authority-document count rule removed',
    rule: 'the manifest must declare exactly one authority document (AC-1.3)',
    find: '  if (authorityCount !== 1) {',
    repl: '  if (false) {'
  },
  {
    id: 'selection-rationale absent rule removed',
    rule: 'an absent document_set.selection_rationale is a fail',
    find: "  if (!Object.prototype.hasOwnProperty.call(documentSet, 'selection_rationale')) {",
    repl: '  if (false) {'
  },
  {
    id: 'selection-rationale empty rule removed',
    rule: 'a present-but-empty document_set.selection_rationale is a warn',
    find: '  } else if (!isNonEmptyString(documentSet.selection_rationale)) {',
    repl: '  } else if (false) {'
  },
  {
    id: 'has-a-row join disabled (nothing is unregistered)',
    rule: 'every governed artifact must have a manifest row',
    find: '    if (basenameJoinsUniquely(bn)) {\n      continue; // unique basename join (e.g. a zone move)\n    }',
    repl: '    if (true) {\n      continue; // unique basename join (e.g. a zone move)\n    }'
  },
  {
    id: 'ambiguous basename join resolved instead of refused',
    rule: 'a basename shared by two rows or two artifacts is refused, not resolved',
    find: '    return unclaimedArtifactByBasename.get(bn) === 1 && unclaimedRowByBasename.get(bn) === 1;',
    repl: '    return unclaimedArtifactByBasename.get(bn) >= 1 && unclaimedRowByBasename.get(bn) >= 1;'
  },
  {
    id: 'claimed artifact allowed as a basename-rescue candidate',
    rule: 'an exact-matched artifact is never a basename-rescue candidate for another row',
    find: '  const unclaimedArtifacts = governedArtifacts.filter((a) => !rowPathSet.has(a));',
    repl: '  const unclaimedArtifacts = governedArtifacts.filter((a) => true);'
  },
  {
    id: 'row-file-existence rule removed',
    rule: 'every manifest row must name a file that exists',
    find: '    if (existsAsFile) {\n      continue; // the row\'s own path is a regular file\n    }',
    repl: '    if (true) {\n      continue; // the row\'s own path is a regular file\n    }'
  },
  {
    id: 'row-names-a-directory accepted (existsSync instead of isFile)',
    rule: 'a row whose path is a directory names no document and fails',
    find: '      existsAsFile = fs.statSync(resolveWithinRoot(e.path)).isFile();',
    repl: '      existsAsFile = fs.existsSync(resolveWithinRoot(e.path));'
  },
  {
    id: 'zone-move basename rescue removed',
    rule: 'a row whose exact path moved keeps existing via its unique basename (a zone move)',
    find: '    if (basenameJoinsUniquely(e.basename)) {\n      continue; // a zone move: the file exists under a different zone directory\n    }',
    repl: '    if (false) {\n      continue; // a zone move: the file exists under a different zone directory\n    }'
  },
  {
    id: 'governed_roots-required skip removed',
    rule: 'a manifest with documents but no governed_roots degrades closed, never passes',
    find: "  if (governedRoots.length === 0) {\n    return skipped('unavailable');\n  }",
    repl: "  if (false) {\n    return skipped('unavailable');\n  }"
  },
  {
    id: 'evidence-root carve-out removed',
    rule: 'a file under options.evidence_root never requires a manifest row',
    find: '    .filter((p) => !isUnderDir(p, evidenceRoot))',
    repl: '    .filter((p) => true)'
  },
  {
    id: 'derived-render carve-out removed',
    rule: "a file named by a row's derived_render.path never requires its own row",
    find: '    .filter((p) => !derivedRenderTargets.has(p))',
    repl: '    .filter((p) => true)'
  },
  {
    id: 'no-document-set not-applicable skip removed',
    rule: 'an empty document set is skipped: not-applicable, never judged',
    find: '  if (documents.length === 0) {\n    return skipped(\'not-applicable\');\n  }',
    repl: '  if (false) {\n    return skipped(\'not-applicable\');\n  }'
  },
  {
    id: 'containment lexical pass removed',
    rule: 'a "../" traversal is refused unread',
    find: "  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {\n    const err = new Error('path escapes repository root');\n    err.pathEscapesRoot = true;\n    throw err;\n  }\n  let realRoot = root;",
    repl: '  let realRoot = root;'
  },
  {
    id: 'containment realpath pass removed',
    rule: 'an in-checkout symlink resolving outside the root is refused',
    find: "  const realRelative = path.relative(realRoot, realTarget);\n  if (realRelative === '..' || realRelative.startsWith('..' + path.sep) || path.isAbsolute(realRelative)) {\n    const err = new Error('path escapes repository root');\n    err.pathEscapesRoot = true;\n    throw err;\n  }\n  return target;",
    repl: '  return target;'
  },
  {
    id: 'refusal disclosure sentence removed',
    rule: 'a containment refusal is distinguishable from a missing file',
    find: "    return skipped('unavailable', BASE_STATED_LIMITS.concat([pathRefusedSentence(field)]));",
    repl: "    return skipped('unavailable');"
  }
];

const original = fs.readFileSync(SRC, 'utf8');
const cases = fs.readdirSync(ROOT).filter((d) => fs.statSync(path.join(ROOT, d)).isDirectory()).sort();

let passed = 0;
let failed = 0;
function report(ok, name, detail) {
  if (ok) {
    passed += 1;
    console.log('  PASS  ' + name);
  } else {
    failed += 1;
    console.log('  FAIL  ' + name + (detail ? '\n        ' + detail : ''));
  }
}

function runPack(scriptPath) {
  const red = [];
  let emitted = 0;
  for (const c of cases) {
    const r = spawnSync(process.execPath, [scriptPath, path.join(ROOT, c, 'input.json')], { cwd: process.cwd(), encoding: 'utf8' });
    if (r.stdout && r.stdout.length) emitted += 1;
    if (r.stdout !== fs.readFileSync(path.join(ROOT, c, 'expected.json'), 'utf8')) red.push(c);
  }
  if (emitted === 0) throw new Error('mutant produced no output for any case -- it does not parse or run');
  return red;
}

// The baseline itself can throw (the unmutated script fails to parse or emits
// nothing). Treat that as a reported failure with a summary, never an
// unhandled stack trace -- the same posture this file requires of every mutant.
let baseline = null;
try {
  baseline = runPack(SRC);
} catch (e) {
  report(false, 'baseline runs: the unmutated script executes and emits output', e.message);
}
if (baseline !== null) {
  report(
    baseline.length === 0,
    'baseline: the unmutated script matches every frozen expectation',
    baseline.length ? 'differing: ' + baseline.join(', ') : ''
  );
}

const tmp = baseline === null ? null : fs.mkdtempSync(path.join(os.tmpdir(), 'mrc-mutation-'));
if (tmp !== null) try {
  for (const m of MUTATIONS) {
    const occurrences = original.split(m.find).length - 1;
    if (occurrences !== 1) {
      report(
        false,
        'anchor is live: ' + m.id,
        'expected exactly one occurrence of the anchor, found ' + occurrences +
          ' -- the mutation was not applied, so the rule "' + m.rule + '" is UNTESTED'
      );
      continue;
    }

    const mutantPath = path.join(tmp, 'mutant.js');
    fs.writeFileSync(mutantPath, original.replace(m.find, m.repl));

    let red;
    try {
      red = runPack(mutantPath);
    } catch (e) {
      report(false, 'mutant runs: ' + m.id, e.message);
      continue;
    }

    report(
      red.length > 0,
      'rule is pinned: ' + m.id,
      red.length ? '' : 'NOTHING went red -- no fixture pins "' + m.rule + '"'
    );
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('');
console.log('=== Summary ===');
console.log('  ' + passed + ' passed, ' + failed + ' failed, ' + (passed + failed) + ' assertion(s) total');
console.log('  ' + MUTATIONS.length + ' mutation(s) over ' + cases.length + ' frozen case(s)');
if (failed) process.exitCode = 1;

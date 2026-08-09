// A standalone, zero-dependency, checked-in MUTATION test for the
// loose-pointer-drift validator: every rule the script states must be pinned
// by at least one frozen fixture.
//
// WHY THIS FILE EXISTS
//
//   A fixture pack whose expected.json files are captured from the
//   validator's own stdout proves determinism, not correctness. The
//   companion expectations test attacks that from one side, by carrying a
//   second, hand-derived statement of what each case must produce. This file
//   attacks it from the other side: it DELETES each rule in turn and requires
//   the pack to notice.
//
//   A mutation that reddens NOTHING identifies a rule that no fixture pins --
//   a rule whose removal would ship silently. That is not hypothetical: this
//   harness found two such holes while it was being written. One fixture that
//   appeared to pin the path-before-basename rank pinned nothing (its corpus
//   separator carried prose, so no candidate formed at all and the case
//   passed regardless of which document won), and one sort term was dead
//   code that read like a live rule.
//
//   It also refuses to accept a CRASH as evidence. A mutation that makes the
//   script fail to parse reddens every case for the wrong reason, which looks
//   like the strongest possible result and means nothing. A mutant that emits
//   no output for any case is reported as a harness error, not as a pass.
//
// HOW IT WORKS
//
//   Each entry names an exact source anchor and a replacement. The anchor is
//   required to be present -- an anchor that no longer matches is a FAILURE,
//   not a skip, because a refactor that silently disarms a mutation is
//   exactly how this kind of harness rots. Mutants are written to a temporary
//   directory outside the repository and executed with the repository root as
//   the working directory, so path containment resolves as it does in a real
//   run and nothing is written into the checkout.
//
// USAGE: node scripts/validators/tests/loose-pointer-drift.mutation.test.js
//   Run from the repository root. Exit 0 when every rule is pinned and no
//   exemption regressed, 1 otherwise.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = 'fixtures/loose-pointer-drift';
const SRC = 'scripts/validators/loose-pointer-drift.js';

const MUTATIONS = [
  {
    id: 'contest filter removed',
    rule: 'a candidate sharing an entity with another is discarded, both of them',
    find: '    if (uses.get(c.i) === 1 && uses.get(c.j) === 1) bindings.push(c);\n    else cause.set(c.docPos, \'contested\');',
    repl: '    bindings.push(c);'
  },
  {
    id: 'backward-admissibility guard removed',
    rule: 'DEFECT 11 -- a token after a reference is read forward or not at all',
    find: '        if (verFirst && sawDocBefore) {',
    repl: '        if (false) {'
  },
  {
    id: 'separator prose test removed',
    rule: 'a pointer-form separator carries no letter and no digit',
    find: '  return !/[\\p{L}\\p{N}]/u.test(s);',
    repl: '  return true;'
  },
  {
    id: 'parenthetical stripping removed',
    rule: 'a balanced "(...)" aside is removed before the separator test',
    find: "    const next = s.replace(/\\([^()]*\\)/g, '');",
    repl: '    const next = s;'
  },
  {
    id: 'table-cell bound removed',
    rule: 'a separator carries at most one live cell delimiter',
    find: '  if (unescapedPipeCount(sep) > 1) return false;',
    repl: ''
  },
  {
    id: 'backslash parity ignored',
    rule: 'a pipe is escaped only after an ODD run of backslashes',
    find: "    if (ch === '|' && backslashes % 2 === 0) count += 1;",
    repl: "    if (ch === '|' && backslashes === 0) count += 1;"
  },
  {
    id: 'sentence barrier removed',
    rule: 'sentence punctuation ends the clause a reference belongs to',
    find: '  if (/[.!?](\\s|$)/.test(s)) return false;',
    repl: ''
  },
  {
    id: 'parenthesis opacity removed',
    rule: 'a reference inside an aside may not reach a token outside it',
    find: '        } else if (crossesOpaqueParen(line, groups, a, b)) {\n          note(docPos, \'parenthetical-aside\');',
    repl: "        } else if (false) {\n          note(docPos, 'parenthetical-aside');",
    mustStayGreen: ['warn-markdown-link-target-binds']
  },
  {
    id: 'link-target exemption removed',
    rule: 'a group whose whole content IS the reference stays transparent',
    find: '    if (content !== line.slice(ent.start, ent.end)) return true;',
    repl: '    if (content !== null) return true;'
  },
  {
    id: 'disclosure suppression removed',
    rule: 'a document bound elsewhere on the line is not also disclosed',
    find: '      if (e.docIdx !== null && boundDocIdx.has(e.docIdx)) continue;',
    repl: ''
  },
  {
    id: 'silence disclosure removed',
    rule: 'every reference this grammar declines to compare is enumerated',
    find: '      silences.push({',
    repl: '      if (false) silences.push({'
  },
  {
    id: 'ambiguity refusal replaced by manifest order',
    rule: 'a basename two documents could claim is attributed to NEITHER',
    find: '      docIdx: distinct.length === 1 ? distinct[0] : null,',
    repl: '      docIdx: distinct[0],'
  },
  {
    id: 'path-before-basename rank removed',
    rule: "DEFECT 10 -- a document's own path outranks another's basename",
    find: '      if (u.kindRank === bestRank && distinct.indexOf(u.docIdx) === -1) distinct.push(u.docIdx);',
    repl: '      if (distinct.indexOf(u.docIdx) === -1) distinct.push(u.docIdx);'
  },
  {
    id: 'revision-record section exclusion removed',
    rule: 'revision rows are history (method section 6.2 rule 2)',
    find: '    if (excludedLines.has(lineNo)) continue;',
    repl: '    if (false) continue;'
  },
  {
    id: 'revision heading test unanchored',
    rule: 'a heading must END with the phrase, not merely contain it',
    find: '  return /(?:^|[\\s:.,;\\-–—])revision records?$/i.test(normalized);',
    repl: '  return /revision record/i.test(normalized);'
  },
  {
    id: 'fenced-block masking removed',
    rule: 'example text inside a fence is not a live pointer',
    find: '  const maskedText = maskFencedBlocks(artifactRaw);',
    repl: '  const maskedText = artifactRaw;'
  },
  {
    id: 'version boundary anchoring relaxed',
    rule: 'a version-shaped substring inside a word is not a token',
    find: 'const VERSION_TOKEN_RE = /(?<![\\w./-])[vV]\\d+(?:\\.\\d+)*(?![\\w/-])(?!\\.\\w)/g;',
    repl: 'const VERSION_TOKEN_RE = /[vV]\\d+(?:\\.\\d+)*/g;'
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

// Returns the case names whose live output no longer matches expected.json.
// Throws when the mutant produced no output at all -- a mutant that does not
// parse reddens everything for the wrong reason and is not evidence.
function runPack(scriptPath) {
  const red = [];
  let emitted = 0;
  for (const c of cases) {
    const r = spawnSync(process.execPath, [scriptPath, path.join(ROOT, c, 'input.json')], { encoding: 'utf8' });
    if (r.stdout && r.stdout.length) emitted += 1;
    if (r.stdout !== fs.readFileSync(path.join(ROOT, c, 'expected.json'), 'utf8')) red.push(c);
  }
  if (emitted === 0) throw new Error('mutant produced no output for any case -- it does not parse or run');
  return red;
}

const baseline = runPack(SRC);
report(
  baseline.length === 0,
  'baseline: the unmutated script matches every frozen expectation',
  baseline.length ? 'differing: ' + baseline.join(', ') : ''
);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lpd-mutation-'));
try {
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

    for (const g of m.mustStayGreen || []) {
      report(
        red.indexOf(g) === -1,
        'exemption holds under "' + m.id + '": ' + g,
        'this case must stay green under that mutation but went red'
      );
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('');
console.log('=== Summary ===');
console.log('  ' + passed + ' passed, ' + failed + ' failed, ' + (passed + failed) + ' assertion(s) total');
console.log('  ' + MUTATIONS.length + ' mutation(s) over ' + cases.length + ' frozen case(s)');
if (failed) process.exitCode = 1;

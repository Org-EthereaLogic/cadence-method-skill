#!/usr/bin/env bash
#
# WP 1.6 falsifiability drill for scripts/guardrails-check.sh.
#
# Seeds one defect per guardrail section, records that the section goes red for the right
# reason, removes the defect, and records that the suite returns green. This is the SC-2
# pattern-7 discipline — a check is not trusted until it has been seen to fail — applied to
# the repository's own gate rather than to the product gate.
#
# USAGE: ./drills/wp-1.6-guardrails/run-drill.sh   → rewrites evidence.md in this directory
#
# The drill mutates the working tree and restores it. It refuses to run on a dirty vendored
# tree so a real edit is never mistaken for a seeded one, and it restores on any exit path.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

DRILL_DIR="drills/wp-1.6-guardrails"
EVIDENCE="$DRILL_DIR/evidence.md"
VENDOR_FILE="docs/reference/source/CADENCE_METHOD_OUTLINE.md"
MARKER_FILE="scripts/_drill_marker.md"
CRED_FILE="scripts/_drill_cred.md"
README_STASH="$(mktemp -d)/README.md"

if ! git diff --quiet -- "$VENDOR_FILE"; then
  echo "refusing to run: $VENDOR_FILE has uncommitted changes" >&2
  exit 1
fi

restore() {
  git checkout -- "$VENDOR_FILE" 2>/dev/null || true
  rm -f "$MARKER_FILE" "$CRED_FILE"
  [[ -f "$README_STASH" ]] && mv "$README_STASH" README.md
  return 0
}
trap restore EXIT

# Run the gate and emit only the named section, or the whole summary for section 0.
section() {
  local n="$1"
  ./scripts/guardrails-check.sh 2>&1 | sed -n "/^${n}\./,/^$/p" || true
}

{
  echo "# WP 1.6 — Guardrails Falsifiability Drill"
  echo
  echo "> **Produced by:** \`drills/wp-1.6-guardrails/run-drill.sh\` — re-run to regenerate."
  echo "> **Subject:** \`scripts/guardrails-check.sh\`"
  echo "> **Discipline:** SC-2 pattern 7 — each check is shown red for the right reason"
  echo "> before its green is credited. A check nobody has seen fail is not evidence."
  echo
  echo "## Run record"
  echo
  echo "| Field | Value |"
  echo "|---|---|"
  echo "| Run at (UTC) | $(date -u '+%Y-%m-%d %H:%M:%SZ') |"
  echo "| Host OS | $(uname -sr) |"
  echo "| Architecture | $(uname -m) |"
  echo "| Git | $(git --version | awk '{print $3}') |"
  echo "| Repository HEAD | $(git rev-parse --short HEAD) |"
  echo "| Working tree | changes uncommitted at run time (WP 1.6 scaffold) |"
  echo
  echo "Each drill seeds exactly one defect, leaving the other sections untouched, so a red"
  echo "line is attributable to the seeded defect and not to ambient state."
  echo
} > "$EVIDENCE"

# --- Drill 1: vendored-source integrity -----------------------------------------------
printf '\nseeded drill edit\n' >> "$VENDOR_FILE"
{
  echo "## Drill 1 — Vendored-source integrity (D-4)"
  echo
  echo "**Seeded defect.** Append a line to \`$VENDOR_FILE\`, the condition the D-4 read-only"
  echo "boundary forbids. This is the case the naive \`git diff --quiet HEAD\` form misses once"
  echo "the edit is committed."
  echo
  echo '```text'
  section 3
  echo '```'
  echo
} >> "$EVIDENCE"
git checkout -- "$VENDOR_FILE"

# --- Drill 2: required files ------------------------------------------------------------
mv README.md "$README_STASH"
{
  echo "## Drill 2 — Required files"
  echo
  echo "**Seeded defect.** Remove \`README.md\` from the required-file set."
  echo
  echo '```text'
  ./scripts/guardrails-check.sh 2>&1 | grep -E 'README\.md|^  [0-9]+ passed' || true
  echo '```'
  echo
} >> "$EVIDENCE"
mv "$README_STASH" README.md

# --- Drill 3: forbidden markers ----------------------------------------------------------
printf '# drill\n\nTO''DO: an unresolved marker\n' > "$MARKER_FILE"
{
  echo "## Drill 3 — Forbidden markers"
  echo
  echo "**Seeded defect.** An unresolved marker inside the scanned path set."
  echo
  echo '```text'
  section 2
  echo '```'
  echo
} >> "$EVIDENCE"
rm -f "$MARKER_FILE"

# --- Drill 4: credential scan --------------------------------------------------------------
# The keyword is split so this script does not trip the very scan it is exercising — the
# same self-reference guard the marker pattern uses in scripts/guardrails-check.sh. Bash
# concatenates the adjacent quoted parts, so the seeded FILE contains the contiguous keyword
# while this SOURCE line does not.
printf '# drill\n\n    api''_key = "AbCd1234EfGh5678"\n' > "$CRED_FILE"
{
  echo "## Drill 4 — Credential scan (NFR-4)"
  echo
  echo "**Seeded defect.** A quoted assignment matching the credential pattern."
  echo
  echo '```text'
  section 4
  echo '```'
  echo
} >> "$EVIDENCE"
rm -f "$CRED_FILE"

# --- Green run ------------------------------------------------------------------------------
{
  echo "## Green run — all defects removed"
  echo
  echo '```text'
  ./scripts/guardrails-check.sh 2>&1 || true
  echo '```'
  echo
  echo "Exit status: \`$( ./scripts/guardrails-check.sh >/dev/null 2>&1; echo $? )\`"
  echo
  echo "## Findings this drill produced"
  echo
  echo "**1 — Credential pattern matched prose.** The pattern originally omitted the required"
  echo "quote around the value, so the bare keyword alternation matched ordinary text:"
  echo "\`not the same token: a document …\` in"
  echo "\`skills/cadence-method/references/phase-definitions.md\` failed the scan. The pattern"
  echo "now requires a quoted value. A scan that cries wolf on the method text is a scan the"
  echo "operator learns to ignore (R-6)."
  echo
  echo "**2 — The drill tripped the check it was exercising.** The first run of this script"
  echo "left the gate red: the literal seed string in \`run-drill.sh\` is itself a credential"
  echo "match, and \`git ls-files\` puts the drill script in scan scope. Fixed by splitting the"
  echo "keyword in the source so the seeded file receives the contiguous token while the"
  echo "script does not contain it — the same self-reference guard the marker pattern already"
  echo "used. Retained here because a check whose own test data defeats it is a defect class"
  echo "worth remembering, and because it is the first thing a future seeded defect will hit."
  echo
  echo "## Stated limits"
  echo
  echo "A green run here is a statement about these four sections only. Link integrity and"
  echo "ID-namespace resolution are WP 5.1 deliverables and are not checked by this script;"
  echo "\`make check\` invokes them once they exist rather than reimplementing them (R-2)."
} >> "$EVIDENCE"

echo "wrote $EVIDENCE"

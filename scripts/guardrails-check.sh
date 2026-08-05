#!/usr/bin/env bash
#
# The repository's own hygiene gate — the executable half of the rules the governance
# documents state, so an agent-authored change cannot silently violate them.
#
# Enforces: the required-file set; the no-unresolved-marker rule; the D-4 read-only boundary
# on the vendored method snapshot; and NFR-4's no-credentials rule. Reports a check it could
# not run as SKIP, never as a pass (NFR-6).
#
# Exit contract: 0 when nothing failed, 1 when anything failed. Skips do not fail the run.
#
# Boundary: link-integrity and ID-namespace resolution are WP 5.1 deliverables, specified by
# WP 1.3. This script will invoke the shipped Node validators against this repository once
# they exist; it does not reimplement them in bash. A second, unfixtured implementation of a
# shipped validator is exactly the divergence R-2 names.
#
# This script reads only. It never writes, stages, or commits.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PASS=0
FAIL=0
SKIPPED=0

check() {
  local label="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo "  PASS  $label"; PASS=$((PASS + 1))
  else
    echo "  FAIL  $label"; FAIL=$((FAIL + 1))
  fi
}

skip() {
  echo "  SKIP  $1"; SKIPPED=$((SKIPPED + 1))
}

echo "cadence-method-skill guardrails"
echo

# --- 1: Required files -------------------------------------------------------------------
# The WP 1.6 deliverable set plus the two governed documents. A file is listed here only
# once it has a job; forthcoming artifacts are named in CLAUDE.md's map, not asserted here.
echo "1. Required files"
for f in \
  README.md \
  LICENSE \
  SECURITY.md \
  CLAUDE.md \
  CONTRIBUTING.md \
  Makefile \
  .editorconfig \
  .claude-plugin/plugin.json \
  docs/design/CADENCE_AUTOMATION_PROJECT_PLAN_WBS.md \
  docs/design/CADENCE_AUTOMATION_USER_STORIES.md
do
  check "exists: $f" test -f "$f"
done
echo

# --- 2: Forbidden markers ----------------------------------------------------------------
# An unresolved marker in a governed document or a shipped script is an unbacked claim.
# The pattern is split so this script does not trip its own scan.
echo "2. Forbidden markers"
MARKER_PATTERN='TO''DO|FIX''ME|TB''D|PLACE''HOLDER'
MARKER_PATHS=(docs/design skills scripts README.md CLAUDE.md CONTRIBUTING.md SECURITY.md)
if command -v rg >/dev/null 2>&1; then
  check "no unresolved markers" bash -c \
    "! rg --no-messages -n -i -e '$MARKER_PATTERN' ${MARKER_PATHS[*]}"
elif command -v grep >/dev/null 2>&1; then
  check "no unresolved markers" bash -c \
    "! grep -r -n -i -E -e '$MARKER_PATTERN' ${MARKER_PATHS[*]}"
else
  skip "forbidden markers — neither rg nor grep on PATH"
fi
echo

# --- 3: Vendored-source integrity --------------------------------------------------------
# The naive form of this check, `git diff --quiet HEAD -- docs/reference/source/`, detects
# only an uncommitted change: an agent that edits a vendored file and commits it passes it
# forever. Instead, recompute each file's blob hash and compare it against the hash pinned
# in that directory's README, which is repo-authored provenance and is therefore excluded
# from the protected set so a re-vendor commit can update it.
echo "3. Vendored-source integrity (D-4)"
VENDOR_README="docs/reference/source/README.md"
if ! command -v git >/dev/null 2>&1; then
  skip "vendored-source integrity — git not on PATH"
elif [[ ! -f "$VENDOR_README" ]]; then
  skip "vendored-source integrity — $VENDOR_README missing"
else
  for f in CADENCE_METHOD.md CADENCE_METHOD_OUTLINE.md CADENCE_METHOD_REVIEW.md; do
    pinned="$(awk -F'|' -v n="$f" '
      $0 ~ /^\|/ {
        gsub(/[ `]/, "", $2); gsub(/[ `]/, "", $3)
        if ($2 == n && $3 ~ /^[0-9a-f]{40}$/) print $3
      }' "$VENDOR_README" | head -1)"
    if [[ -z "$pinned" ]]; then
      skip "vendored $f — no pinned hash recorded in $VENDOR_README"
    else
      actual="$(git hash-object "docs/reference/source/$f" 2>/dev/null || echo unreadable)"
      if [[ "$actual" == "$pinned" ]]; then
        echo "  PASS  vendored $f matches its pinned hash"; PASS=$((PASS + 1))
      else
        echo "  FAIL  vendored $f drifted from its pinned hash"
        echo "        pinned $pinned"
        echo "        actual $actual"
        echo "        The snapshot is read-only (D-4). An upstream advance lands as a"
        echo "        dedicated re-vendor commit updating the recorded version and the"
        echo "        pinned hashes together."
        FAIL=$((FAIL + 1))
      fi
    fi
  done
fi
echo

# --- 4: Credential scan ------------------------------------------------------------------
# The cheap half of NFR-4. Scans tracked and untracked-but-not-ignored files only.
echo "4. Credential scan (NFR-4)"
if command -v git >/dev/null 2>&1 && command -v grep >/dev/null 2>&1; then
  # The assignment form requires a QUOTED value. Without that anchor the bare keyword
  # alternation matches ordinary prose — "not the same token: a document ..." in
  # skills/cadence-method/references/phase-definitions.md is the case that proved it, and a
  # scan that cries wolf on the method text is a scan the operator learns to ignore (R-6).
  CRED_PATTERN='AKIA[0-9A-Z]{16}|BEGIN [A-Z ]*PRIVATE KEY|ghp_[0-9A-Za-z]{36}|sk-[A-Za-z0-9_-]{20,}|(api_key|apikey|secret|token|password|passwd)[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']{8,}'
  # LICENSE is excluded: the Apache-2.0 text is canonical and must not be edited to satisfy
  # a heuristic. The vendored snapshot is excluded for the same read-only reason as check 3.
  found=0
  while IFS= read -r f; do
    case "$f" in
      LICENSE|docs/reference/source/*) continue ;;
    esac
    [[ -f "$f" ]] || continue
    if grep -n -E -e "$CRED_PATTERN" "$f" >/dev/null 2>&1; then
      echo "  FAIL  possible credential in $f"; found=$((found + 1))
    fi
  done < <(git ls-files -co --exclude-standard)
  if [[ "$found" -eq 0 ]]; then
    echo "  PASS  no credential patterns found"; PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + found))
  fi
else
  skip "credential scan — git or grep not on PATH"
fi
echo

echo "=== Summary ==="
echo "  $PASS passed, $FAIL failed, $SKIPPED skipped"
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi

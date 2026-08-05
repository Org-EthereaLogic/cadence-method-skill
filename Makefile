# The repository's own local check surface.
# Exclusion X-6 rules out CI/CD hosting and GitHub Actions distribution: local make-style
# checks only. Every gate this project has is reachable from a target in this file.

SHELL := /bin/bash
CLAUDE ?= claude

.PHONY: help check plugin-validate validate
.DEFAULT_GOAL := help

help:
	@echo "cadence-method-skill — local checks"
	@echo "  make check            Repository hygiene gate: required files, forbidden markers,"
	@echo "                        vendored-source integrity, credential scan."
	@echo "  make plugin-validate  Validate the plugin manifest. Operator convenience, not a gate."
	@echo "  make validate         The aggregate gate."

check:
	@./scripts/guardrails-check.sh

# An operator convenience for iterating on the manifest, not a gate: the claude CLI is not a
# declared NFR-3 dependency, so this target is deliberately not a prerequisite of validate and
# degrades to SKIP when the CLI is absent (NFR-6).
#
# Deliberately without --strict. At v2.1.222 --strict promotes warnings to errors, and two of
# the warnings this manifest raises are recorded decisions rather than defects: the absent
# version field is D-6, and the absent author field is deferred to WP 1.5 with every other
# unverified field. Reconsider --strict at M3, when both are filled.
plugin-validate:
	@if command -v $(CLAUDE) >/dev/null 2>&1; then \
		$(CLAUDE) plugin validate .; \
	else \
		echo "  SKIP  claude CLI not on PATH"; \
	fi

# forthcoming — WP 5.1 adds the deterministic validators and WP 5.2 the frozen-fixture parity
# runner. Both are invoked from here; neither is reimplemented here.
validate: check
	@echo "validate: all gates passed"

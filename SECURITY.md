# Security Policy — cadence-method-skill

## Supported versions

This project is pre-release. Nothing has shipped, so there is no supported-version matrix yet; security fixes land on `main`. A supported-version table appears at M3, when release 1 is demonstrated.

## Reporting a vulnerability

Report privately through GitHub's private vulnerability reporting on this repository — the **Security** tab, then **Report a vulnerability**. Do not open a public issue for a vulnerability.

Expect an acknowledgement within seven days. This project is maintained by one person; a fix timeline is agreed after triage rather than promised in advance. Please allow a coordinated disclosure window before publishing.

## Scope

The plugin ships hooks and Node validators that execute in a user's shell, and a skill whose agents read repository content. In-scope reports include:

- **Command execution.** Any path by which a hook, validator, adapter, or command definition executes attacker-influenced input as a shell command, or escapes the paths it is scoped to.
- **Prompt injection and instruction hijack.** Repository content — a governed document, a fixture, an evidence file — that causes a phase agent, the Critic, the Advocate, or the Grader to act outside its contract. The runtime treats repository content as data; a case where it does not is a vulnerability, not a quirk.
- **Gate bypass.** Any way to obtain a `promote` verdict without the deterministic gate passing, or to make a check that did not run report as passed rather than `skipped` (NFR-6). This includes tampering with an append-only evidence tree such that the report script computes a verdict the evidence does not support.
- **Approved-zone integrity.** Any way to modify an Approved artifact without the content-hash mismatch being reported. Note the stated limit below.
- **Credential exposure.** Any credential written into an artifact, a fixture, a log, or run evidence (NFR-4).

## Stated limits — not vulnerabilities

Reported honestly, in the same spirit as the runtime's own stated-limits reporting:

- **Approved is frozen by policy, not by the filesystem.** Integrity-drift detection compares a recorded content hash. The runtime does not claim filesystem immutability, and it does not claim comprehensive detection of a determined local attacker who can rewrite both the artifact and the manifest (FR-6).
- **Draft-zone hooks are advisory by design.** That a hook does not block a write is the specified behavior, not a bypass (FR-7, D-2).
- **Model findings are advisory by design.** That a Critic, Advocate, or Grader finding does not block promotion is the specified behavior (X-3, FR-13).
- **A green gate is a statement about the checks that ran.** That the gate does not catch a defect no check was written for is a coverage gap — file it as an issue, not as a vulnerability (FR-17).

## Handling

An accepted report is fixed with a regression fixture that fails before the fix and passes after it, following the falsifiability discipline the project applies to its own gate checks (SC-2). The fixture is retained; the report is credited unless the reporter asks otherwise.

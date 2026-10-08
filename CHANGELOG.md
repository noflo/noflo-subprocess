# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Changed

- Migrated to NoFlo 2.x: components now depend on `@noflo/noflo` ^2.0.0 instead of the unscoped `noflo` 1.x package
- Package is now plain ESM (`"type": "module"`) with no build step; supported runtime is Node.js >= 22
- Replaced callback-style `child_process.exec` with the promise API; errors route to the error outport as before
- Fixed the `command` and `out` port datatypes from `object` to `string`, matching the data actually carried
- Test suite now runs with `@noflo/fbp-spec-runner` and `node:test` instead of Mocha/Chai; added coverage for the timeout path and bracket forwarding semantics

### Added

- Optional `timeout` control port (default `60000`, preserving the previous hard-coded behavior) to configure the maximum command duration

### Removed

- Stale "Changes" section from the README (moved into this changelog)

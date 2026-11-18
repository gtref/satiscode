# Changelog

All notable changes to Satiscode are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.3](https://github.com/gtref/satiscode/releases/tag/v2.1.3) - 2026-10-10
*Codename: Curious Kea*

### Added
- Interactive help bot on the documentation website.
- Official release codename: Curious Kea.

### Changed
- Updated interface styling and CSS variables for a cleaner editor look.
- Upgraded ESLint and `globals` development dependencies.

### Fixed
- Fixed typographical errors across project documentation.

---

## [1.8.0](https://github.com/gtref/satiscode/releases/tag/v1.8.0) - 2026-10-04

### Added
- Integrated Git sidebar supporting staging, commits, push, pull, and repository initialization.
- Pyright language server integration for Python diagnostics and autocomplete.
- Configurable Pyright binary path resolution.

### Removed
- Deprecated patch generation API.

---

## [1.4.0](https://github.com/gtref/satiscode/releases/tag/v1.4.0) - 2026-09-15

### Added
- Tab management system with multi-file buffer support and dirty indicators.
- Python syntax highlighting and language definition.
- Monaco ghost text support for inline suggestions.
- Prototype codebase indexing API.
- Expanded icon pack in `icons/style1/`.
- Embedded project-local `clangd` support for packaged builds.
- Status indicator element in the bottom status bar.

### Changed
- Refined UI CSS for a softer, modern appearance.

---

## [1.1.0](https://github.com/gtref/satiscode/releases/tag/v1.1.0) - 2026-09-10

### Added
- Dedicated `styles/` directory for modular stylesheet management.
- Automatic file language detection with manual selector override in toolbar.
- Icon pack directory with per-style metadata (`icons/style1/icons.json`).
- Open Folder (`Ctrl+K`) workspace navigation.
- Full syntax support for HTML, CSS, JavaScript, and JSON.

---

## [1.0.0](https://github.com/gtref/satiscode/releases/tag/v1.0.0) - 2026-09-08

### Added
- Initial public release of Satiscode.
- Monaco-based editor engine optimized for C/C++.
- Full `clangd` LSP integration: diagnostics, code completion, hover tooltips, and go-to-definition.
- C/C++ file extension detection and workspace root discovery.
- Resizable Explorer file tree and VS Code-style Problems panel.
- Graceful `clangd` process lifecycle and shutdown handling.
- Toolbar for rapid file operations (`New`, `Open`, `Save`, `Save As`).
- Comprehensive keyboard shortcuts for common editing tasks.
- Bilingual interface support (English and Spanish).
- Windows NSIS installer build configuration with `electron-builder`.

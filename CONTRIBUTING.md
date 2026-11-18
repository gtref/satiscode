# Contributing to Satiscode

Thank you for your interest in improving Satiscode! Whether you are fixing bugs, implementing language server features, refining the UI, or improving documentation, your contributions are welcome.

---

## Getting Started

1. **Check Existing Issues & PRs:** Look through active [Issues](https://github.com/gtref/satiscode/issues) and [Pull Requests](https://github.com/gtref/satiscode/pulls) to avoid duplicate work.
2. **Propose Major Architectural Changes:** For large architectural updates or new subsystem integrations, please open an issue first to discuss the design.
3. **Preserve Architecture:** Respect the Electron main/preload/renderer security boundaries and language server lifecycle.
4. **License Compatibility:** All contributions must be original or compatible with Satiscode's MIT license.

---

## Local Development Setup

### Prerequisites
- **Operating System:** Windows 10/11 (for desktop app execution), or Linux/macOS for core package builds and CI testing.
- **Node.js:** Version 20 or newer.
- **C/C++ Language Services (Optional for dev):** `clangd` (LLVM) installed and accessible if working on C/C++ language features.
- **Python Language Services (Optional for dev):** Python 3.8+ installed if working on Python language features.

### Installation & Launch

```powershell
# Clone your fork
git clone https://github.com/<your-username>/satiscode.git
cd satiscode

# Install all dependencies and build subpackages
npm install
npm run build

# Start the Electron application
npm start
```

---

## Pre-Commit Hooks

We use `pre-commit` to maintain formatting and code quality consistency.

```bash
# Install pre-commit
pip install pre-commit

# Register the Git hooks
pre-commit install

# Run checks against all files manually
pre-commit run --all-files
```

### Configured Checks:
- Removes trailing whitespace
- Enforces trailing newlines
- Flags accidental merge conflict markers
- Validates JSON and YAML syntax
- Runs ESLint validation

---

## Quality Checks & Validation

Before submitting a pull request, run the local quality suite to ensure CI will pass cleanly:

```bash
# 1. Run ESLint across codebase
npm run lint

# 2. Run TypeScript compiler checks on LSP packages
npm run typecheck

# 3. Run full test suite
npm test

# 4. Compile LSP packages and verify distribution assets
npm run build
npm run verify-assets

# 5. Audit dependency health
npm run depcheck
```

For installer or packaging modifications, also test packaging:

```powershell
npm run dist:win
```

---

## Code Guidelines & Security Boundaries

- **Process Isolation:** The renderer process must never import Node.js core modules directly (`fs`, `child_process`, etc.).
- **Preload Channel:** All filesystem and background process calls must pass through typed IPC methods defined in `preload.js` and handled in `main.js`.
- **Error Recovery:** Keep user-facing filesystem and language-server errors recoverable with graceful fallback messages.
- **Build Artifacts:** Do not commit compiled outputs (`dist/`, `packages/*/dist/`), coverage directories, or `node_modules/`.

---

## Licensing, Signoffs & AI-Assisted Code Policy

### Developer Certificate of Origin (DCO)

All commits must include a `Signed-off-by:` trailer to certify that you have the right to contribute the code under the project's MIT license.

Git can append this flag automatically using the `-s` switch:

```bash
git commit -s -m "Fix Explorer file tree selection state"
```

### Code Provenance & AI-Assisted Code Policy

- Code must be original or properly licensed under an MIT-compatible license (GPL or copyleft code is strictly prohibited).
- Respect third-party notice obligations documented in [NOTICES.md](NOTICES.md).
- Any AI-generated code must be thoroughly reviewed, tested, and validated by a human developer. Raw AI output without review is not accepted.
- If code is generated or substantially influenced by AI, acknowledge it in the commit footer using the standard trailer:

```text
Co-authored-by: AI Assistant <ai@example.com>
```

---

## Pull Request Guidelines

When submitting a pull request:
1. Provide a clear summary of what was changed and why.
2. Outline verification steps showing how you tested the change.
3. Attach screenshots or GIFs for visual and UI modifications.
4. Ensure all CI quality checks (`lint`, `typecheck`, `test`, `build`) pass locally.

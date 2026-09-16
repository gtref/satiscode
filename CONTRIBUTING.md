# Contributing to Satiscode

Thank you for helping improve Satiscode.

## Before you start

1. Check existing issues and pull requests.
2. For large or architectural changes, open an issue describing the proposed approach.
3. Keep changes focused and preserve the existing Electron, Monaco, and clangd/Pyright architecture.
4. Ensure all contributions are original or properly licensed.

## Local setup

```powershell
npm install
npm start
```

Install LLVM if you are working on C/C++ language services. The expected executable is `clangd.exe`.

## Making changes

- Keep renderer code isolated from Node.js APIs.
- Route filesystem and child-process operations through `preload.js` and `main.js`.
- Preserve support for both C and C++ file extensions.
- Keep user-facing failures recoverable where possible.
- Avoid committing generated `dist` output or `node_modules`.

## Code provenance and licensing

To maintain a clean and legally safe codebase:

- Only submit code you wrote yourself or have the right to contribute.
- Only use third-party code under licenses compatible with the project's MIT license; incompatible licenses, including GPL, are not permitted.
- Satisfy all applicable third-party attribution and notice obligations documented in `NOTICES.md`.
- AI-generated code **must be reviewed, rewritten, and validated** before submission.  
  Raw AI output is not acceptable without human verification.
- Every commit must include a Developer Certificate of Origin (DCO) signoff.

### Developer Certificate of Origin (DCO)

By adding a `Signed-off-by:` line, you certify that:

> You wrote the code or have the right to submit it under the project’s license.

Git can add this automatically:

```powershell
git commit -s
```

All pull requests must contain commits with valid signoffs.

## Validation

Run these checks before opening a pull request:

```powershell
node --check main.js
node --check preload.js
npm start
```

For installer changes, also run:

```powershell
npm run dist:win
```

## Pull requests

Include:

- A concise description of the problem and solution
- User-visible behavior changes
- Validation steps and results
- Screenshots for visual changes when useful
- Confirmation that all commits include `Signed-off-by:` lines

## Commit messages

Use short, imperative messages such as:

- `Add header diagnostics`
- `Fix Explorer refresh`
- `Improve Pyright initialization`
- `Refactor LSP routing`

Commit messages should describe *what* and *why*, not *how*.

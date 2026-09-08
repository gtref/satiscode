# Contributing to Satiscode

Thank you for helping improve Satiscode.

## Before you start

1. Check existing issues and pull requests.
2. For a large change, open an issue describing the proposed approach.
3. Keep changes focused and preserve the existing Electron, Monaco, and clangd architecture.

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

## Commit messages

Use short, imperative messages such as `Add header diagnostics` or `Fix Explorer refresh`.

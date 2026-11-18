# @ronna/fixson-lsp

A lightweight, high-performance Language Server Protocol (LSP) server for JSON documents, built for Monaco Editor and standalone LSP client integrations.

[![npm version](https://img.shields.io/npm/v/%40ronna%2Ffixson-lsp?style=flat-square&color=blue)](https://www.npmjs.com/package/@ronna/fixson-lsp)
[![npm downloads](https://img.shields.io/npm/dm/%40ronna%2Ffixson-lsp?style=flat-square&color=emerald)](https://www.npmjs.com/package/@ronna/fixson-lsp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)
[![Socket Badge](https://badge.socket.dev/npm/package/@ronna/fixson-lsp/latest)](https://badge.socket.dev/npm/package/@ronna/fixson-lsp/latest)

---

## Features

- **Syntax & Schema Diagnostics:** Real-time detection of malformed syntax, dangling commas, and structural issues.
- **Property Completions:** Context-aware completion suggestions for object keys and values.
- **Hover Documentation:** Quick-info hover tooltips for parsed JSON nodes.
- **Standard Protocol Support:** Standard JSON-RPC communication over standard I/O (`--stdio`).

---

## Requirements

- **Node.js:** Version 20.0 or higher.

---

## Installation

### Global CLI Tool
```bash
npm install --global @ronna/fixson-lsp
```

### Project Dependency
```bash
npm install @ronna/fixson-lsp
```

---

## Usage

Launch `fixson-lsp` over standard I/O:

```bash
fixson-lsp --stdio
```

### Configuring in LSP Clients

Pass `fixson-lsp` as the command and `--stdio` as the launch argument. When installed as a project dependency, the binary resolves via `node_modules/.bin/fixson-lsp`.

---

## Development & Testing

```bash
# Install dependencies
npm install

# Compile TypeScript and bundle into dist/server.js
npm run build

# Run TypeScript checks
npm run typecheck

# Run test suite
npm test
```

---

## License

Distributed under the [MIT License](LICENSE).

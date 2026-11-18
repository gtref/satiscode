# @ronna/fixml-lsp

A fast, lightweight Language Server Protocol (LSP) server for XML documents, providing schema diagnostics, element completions, and hover documentation.

[![npm version](https://img.shields.io/npm/v/%40ronna%2Ffixml-lsp?style=flat-square&color=blue)](https://www.npmjs.com/package/@ronna/fixml-lsp)
[![npm downloads](https://img.shields.io/npm/dm/%40ronna%2Ffixml-lsp?style=flat-square&color=emerald)](https://www.npmjs.com/package/@ronna/fixml-lsp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)
[![Socket Badge](https://badge.socket.dev/npm/package/@ronna/fixml-lsp/latest)](https://badge.socket.dev/npm/package/@ronna/fixml-lsp/latest)

---

## Features

- **Well-Formedness Diagnostics:** Instant error reporting for unmatched tags, improper nesting, and illegal characters.
- **Element & Attribute Autocompletion:** Smart tag closure and element name completion.
- **Hover Information:** Tooltips displaying element context and hierarchy.
- **Broad File Format Coverage:** Supports `.xml`, `.xsd`, `.xsl`, `.xslt`, `.svg`, and `.plist`.
- **Standard Protocol Support:** Standard JSON-RPC communication over standard I/O (`--stdio`).

---

## Requirements

- **Node.js:** Version 20.0 or higher.

---

## Installation

### Global CLI Tool
```bash
npm install --global @ronna/fixml-lsp
```

### Project Dependency
```bash
npm install @ronna/fixml-lsp
```

---

## Usage

Launch `fixml-lsp` over standard I/O:

```bash
fixml-lsp --stdio
```

### Configuring in LSP Clients

Pass `fixml-lsp` as the command and `--stdio` as the launch argument. When installed locally in a project, the executable resolves via `node_modules/.bin/fixml-lsp`.

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

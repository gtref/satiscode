# @ronna/fixml-lsp

[![npm version](https://img.shields.io/npm/v/%40ronna%2Ffixson-lsp)](https://www.npmjs.com/package/@ronna/fixson-lsp)
[![npm downloads](https://img.shields.io/npm/dm/%40ronna%2Ffixson-lsp)](https://www.npmjs.com/package/@ronna/fixson-lsp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Socket Badge](https://badge.socket.dev/npm/package/@ronna/fixson-lsp/latest)](https://badge.socket.dev/npm/package/@ronna/fixson-lsp/latest)

A small Language Server Protocol (LSP) server for XML documents. It provides
well-formedness diagnostics, element-name completions, and element hover
information.

## Requirements

- Node.js 20 or newer

## Install

```sh
npm install --global @ronna/fixml-lsp
```

Or install it as a project dependency:

```sh
npm install @ronna/fixml-lsp
```

## Run

The `fixml-lsp` executable communicates over standard input and output using
the Language Server Protocol:

```sh
fixml-lsp --stdio
```

For an LSP client that accepts a command and arguments, use `fixml-lsp` as the
command and `--stdio` as its argument.

## Development

```sh
npm install
npm run build
npm test
```

The build type-checks the TypeScript source and bundles the server and its
runtime dependencies into `dist/server.js`.

## License

MIT

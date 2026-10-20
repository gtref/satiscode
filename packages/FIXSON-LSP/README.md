# @ronna/fixson-lsp

[![npm version](https://img.shields.io/npm/v/%40ronna%2Ffixson-lsp)](https://www.npmjs.com/package/@ronna/fixson-lsp)
[![npm downloads](https://img.shields.io/npm/dm/%40ronna%2Ffixson-lsp)](https://www.npmjs.com/package/@ronna/fixson-lsp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A small Language Server Protocol (LSP) server for JSON documents. It provides
JSON syntax diagnostics, property-name completions, and a basic hover response.

## Requirements

- Node.js 20 or newer

## Install

```sh
npm install --global @ronna/fixson-lsp
```

Or install it as a project dependency:

```sh
npm install @ronna/fixson-lsp
```

## Run

The `fixson-lsp` executable communicates over standard input and output using
the Language Server Protocol:

```sh
fixson-lsp --stdio
```

For an LSP client that accepts a command and arguments, use `fixson-lsp` as the
command and `--stdio` as its argument. When installed locally, the executable
is available in the package manager's binary path.

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

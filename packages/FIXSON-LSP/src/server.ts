#!/usr/bin/env node

import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    TextDocumentSyncKind,
    Diagnostic,
    DiagnosticSeverity,
    CompletionItem,
    CompletionItemKind
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
// Simple interface for parse errors used by our lightweight JSONC parser
interface ParseError {
  error: number;
  offset: number;
  length: number;
}

function parseJsonc(text: string, errors: ParseError[], options?: { allowTrailingComma?: boolean }) {
  // Remove // line comments
  let stripped = text.replace(/\/\/.*$/gm, "");
  // Remove /* block comments */
  stripped = stripped.replace(/\/\*[\s\S]*?\*\//g, "");
  // Optionally handle trailing commas (basic support)
  if (options?.allowTrailingComma) {
    stripped = stripped.replace(/,\s*([}\]])/g, "$1");
  }
  try {
    JSON.parse(stripped);
  } catch (e) {
    // Populate a generic parse error. Offset handling is approximate.
    const err = { error: 1, offset: 0, length: 1 } as ParseError;
    errors.push(err);
  }
}


const connection = createConnection(ProposedFeatures.all);

const documents = new TextDocuments(TextDocument);

function getParseErrorOffset(text: string, message: string) {
    const positionMatch = message.match(/position\s+(\d+)/i);
    if (positionMatch) {
        return Math.min(Number(positionMatch[1]), text.length);
    }

    const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (lineColumnMatch) {
        const line = Number(lineColumnMatch[1]) - 1;
        const column = Number(lineColumnMatch[2]) - 1;
        const lines = text.split("\n");
        return Math.min(
            lines.slice(0, line).reduce((length, value) => length + value.length + 1, 0) + column,
            text.length
        );
    }

    if (/unexpected end/i.test(message)) {
        return text.length;
    }

    let low = 0;
    let high = text.length;
    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        const prefix = text.slice(0, middle + 1);
        let isValidOrIncomplete = false;
        try {
            JSON.parse(prefix);
            isValidOrIncomplete = true;
        } catch (error: unknown) {
            if (error instanceof Error && /unexpected end/i.test(error.message)) {
                isValidOrIncomplete = true;
            } else if (error instanceof Error) {
                const prefixPosition = error.message.match(/position\s+(\d+)/i);
                isValidOrIncomplete = Boolean(prefixPosition && Number(prefixPosition[1]) >= prefix.length);
            }
        }

        if (isValidOrIncomplete) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }

    return low;
}

connection.onInitialize(() => {
    console.error("Fixson LSP started");
    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            completionProvider: {},
            hoverProvider: true
        }
    };
});

documents.onDidChangeContent(({ document }) => {
    validateDocument(document);
});

documents.onDidOpen(({ document }) => {
    validateDocument(document);
});

function validateDocument(document: TextDocument) {
    const text = document.getText();
    const diagnostics: Diagnostic[] = [];

    const errors: ParseError[] = [];
    parseJsonc(text, errors, { allowTrailingComma: true });
    for (const err of errors) {
        const offset = err.offset;
        const end = offset + err.length;
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
                start: document.positionAt(offset),
                end: document.positionAt(end)
            },
            message: `Parse error code ${err.error}`,
            source: "fixson"
        });
    }

    connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

const PROPERTY_SUGGESTIONS = [
    "name",
    "version",
    "description",
    "author",
    "license",
    "homepage",
    "repository",
    "dependencies"
];

connection.onCompletion((): CompletionItem[] => {
    return PROPERTY_SUGGESTIONS.map(label => ({
        label,
        kind: CompletionItemKind.Property
    }));
});

connection.onHover(() => {
    return {
        contents: {
            kind: "plaintext",
            value: "Fixson JSON Document"
        }
    };
});

documents.listen(connection);
connection.listen();

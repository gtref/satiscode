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

    try {
        JSON.parse(text);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const offset = getParseErrorOffset(text, message);
        const endOffset = Math.min(offset + 1, text.length);

        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
                start: document.positionAt(offset),
                end: document.positionAt(endOffset)
            },
            message,
            source: "fixson"
        });
    }

    connection.sendDiagnostics({
        uri: document.uri,
        diagnostics
    });
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
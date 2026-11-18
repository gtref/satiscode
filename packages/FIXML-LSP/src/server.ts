#!/usr/bin/env node

import {
    CompletionItem,
    CompletionItemKind,
    createConnection,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    TextDocumentSyncKind,
    TextDocuments
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { SaxesParser } from "saxes";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

function validateDocument(document: TextDocument) {
    const diagnostics: Diagnostic[] = [];
    const parser = new SaxesParser({ xmlns: true });

    parser.on("error", (error) => {
        const line = Math.max(0, parser.line - 1);
        const character = Math.max(0, parser.column);
        const offset = document.offsetAt({ line, character });
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
                start: document.positionAt(offset),
                end: document.positionAt(Math.min(offset + 1, document.getText().length))
            },
            message: error.message,
            source: "fixml"
        });
    });

    parser.write(document.getText()).close();
    connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

documents.onDidOpen(({ document }) => validateDocument(document));
documents.onDidChangeContent(({ document }) => validateDocument(document));

connection.onInitialize(() => {
    console.error("FIXML LSP started");
    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            completionProvider: { triggerCharacters: ["<", "/"] },
            hoverProvider: true
        }
    };
});

connection.onCompletion(({ textDocument }): CompletionItem[] => {
    const document = documents.get(textDocument.uri);
    if (!document) return [];

    const tags = new Set<string>(["root", "item", "name", "value"]);
    for (const match of document.getText().matchAll(/<([A-Za-z_][\w:.-]*)\b/g)) {
        tags.add(match[1]);
    }
    return [...tags].sort().map((label) => ({
        label,
        kind: CompletionItemKind.Class
    }));
});

connection.onHover(({ textDocument, position }) => {
    const document = documents.get(textDocument.uri);
    if (!document) return null;

    const offset = document.offsetAt(position);
    const text = document.getText();
    let elementName: string | undefined;
    for (const tagMatch of text.matchAll(/<\/?([A-Za-z_][\w:.-]*)\b/g)) {
        const nameStart = tagMatch.index + tagMatch[0].indexOf(tagMatch[1]);
        if (offset >= nameStart && offset <= nameStart + tagMatch[1].length) {
            elementName = tagMatch[1];
            break;
        }
    }
    if (!elementName) return null;

    return {
        contents: {
            kind: "plaintext",
            value: `XML element <${elementName}>`
        }
    };
});

documents.listen(connection);
connection.listen();

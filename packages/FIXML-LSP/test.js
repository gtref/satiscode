const assert = require("node:assert/strict");
const cp = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

test("FIXML serves XML diagnostics, completions, and hover", async () => {
    const server = cp.spawn(
        process.execPath,
        [path.join(__dirname, "dist", "server.js"), "--stdio"],
        { stdio: ["pipe", "pipe", "pipe"] }
    );
    let buffer = Buffer.alloc(0);
    const messages = [];
    const waiters = [];

    server.stdout.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        while (true) {
            const headerEnd = buffer.indexOf("\r\n\r\n");
            if (headerEnd < 0) return;
            const header = buffer.subarray(0, headerEnd).toString("ascii");
            const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
            assert.ok(lengthMatch, "server response has a content length");
            const bodyStart = headerEnd + 4;
            const bodyLength = Number(lengthMatch[1]);
            if (buffer.length < bodyStart + bodyLength) return;
            const message = JSON.parse(buffer.subarray(bodyStart, bodyStart + bodyLength).toString("utf8"));
            buffer = buffer.subarray(bodyStart + bodyLength);
            messages.push(message);
            for (let index = waiters.length - 1; index >= 0; index--) {
                if (waiters[index].predicate(message)) {
                    waiters.splice(index, 1)[0].resolve(message);
                }
            }
        }
    });

    function send(message) {
        const body = Buffer.from(JSON.stringify(message), "utf8");
        server.stdin.write(Buffer.concat([
            Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "ascii"),
            body
        ]));
    }

    function waitFor(predicate) {
        const existing = messages.find(predicate);
        if (existing) return Promise.resolve(existing);
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timed out waiting for LSP response")), 3000);
            waiters.push({
                predicate,
                resolve: (message) => {
                    clearTimeout(timeout);
                    resolve(message);
                }
            });
        });
    }

    try {
        send({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: { processId: process.pid, rootUri: null, capabilities: {} }
        });
        const initialized = await waitFor((message) => message.id === 1);
        assert.equal(initialized.result.capabilities.textDocumentSync, 1);
        assert.equal(initialized.result.capabilities.hoverProvider, true);
        send({ jsonrpc: "2.0", method: "initialized", params: {} });

        send({
            jsonrpc: "2.0",
            method: "textDocument/didOpen",
            params: {
                textDocument: {
                    uri: "file:///test.xml",
                    languageId: "xml",
                    version: 1,
                    text: "<root>\n  <item></root>"
                }
            }
        });
        const invalidDiagnostics = await waitFor((message) =>
            message.method === "textDocument/publishDiagnostics" &&
            message.params.uri === "file:///test.xml"
        );
        assert.ok(invalidDiagnostics.params.diagnostics.length > 0);
        assert.equal(invalidDiagnostics.params.diagnostics[0].source, "fixml");

        send({
            jsonrpc: "2.0",
            method: "textDocument/didChange",
            params: {
                textDocument: { uri: "file:///test.xml", version: 2 },
                contentChanges: [{ text: "<catalog><item /></catalog>" }]
            }
        });
        const validDiagnostics = await waitFor((message) =>
            message.method === "textDocument/publishDiagnostics" &&
            message.params.uri === "file:///test.xml" &&
            message.params.diagnostics.length === 0
        );
        assert.deepEqual(validDiagnostics.params.diagnostics, []);

        send({
            jsonrpc: "2.0",
            id: 2,
            method: "textDocument/completion",
            params: {
                textDocument: { uri: "file:///test.xml" },
                position: { line: 0, character: 9 }
            }
        });
        const completion = await waitFor((message) => message.id === 2);
        assert.ok(completion.result.some((item) => item.label === "catalog"));

        send({
            jsonrpc: "2.0",
            id: 3,
            method: "textDocument/hover",
            params: {
                textDocument: { uri: "file:///test.xml" },
                position: { line: 0, character: 4 }
            }
        });
        const hover = await waitFor((message) => message.id === 3);
        assert.equal(hover.result.contents.value, "XML element <catalog>");
    } finally {
        server.kill();
    }
});

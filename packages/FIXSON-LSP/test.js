const cp = require("child_process");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("path");

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "fixson-lsp-test-"));
const serverPath = path.join(testDirectory, "server.js");
fs.copyFileSync(path.join(__dirname, "dist", "server.js"), serverPath);

const server = cp.spawn(
    process.execPath,
    [serverPath, "--stdio"],
    {
        stdio: ["pipe", "pipe", "pipe"]
    }
);

let buffer = "";
const received = new Set();

server.stdout.on("data", chunk => {
    buffer += chunk.toString();

    while (true) {
        const headerEnd = buffer.indexOf("\r\n\r\n");

        if (headerEnd === -1) break;

        const header = buffer.slice(0, headerEnd);
        const match = header.match(/Content-Length:\s*(\d+)/i);

        if (!match) {
            console.error("Bad LSP header");
            buffer = "";
            return;
        }

        const contentLength = parseInt(match[1], 10);
        const messageStart = headerEnd + 4;

        if (buffer.length < messageStart + contentLength) {
            break;
        }

        const body = buffer.slice(
            messageStart,
            messageStart + contentLength
        );

        const message = JSON.parse(body);
        console.log("\n=== SERVER ===");
        console.log(JSON.stringify(message, null, 2));
        if (message.id === 1) {
            assert.equal(message.result.capabilities.textDocumentSync, 1);
            received.add("initialize");
        } else if (message.id === 2) {
            assert.ok(message.result.some(item => item.label === "name"));
            received.add("completion");
        } else if (message.id === 3) {
            assert.equal(message.result.contents.value, "Fixson JSON Document");
            received.add("hover");
        } else if (message.method === "textDocument/publishDiagnostics") {
            if (message.params.diagnostics.length > 0) {
                const diagnostic = message.params.diagnostics[0];
                assert.equal(diagnostic.source, "fixson");
                assert.deepEqual(diagnostic.range.start, { line: 1, character: 10 });
                received.add("invalid-json-diagnostics");
            } else {
                received.add("valid-json-diagnostics");
            }
        }

        buffer = buffer.slice(
            messageStart + contentLength
        );
    }
});

server.stderr.on("data", data => {
    console.log("\n=== STDERR ===");
    console.log(data.toString());
});

server.on("exit", code => {
    console.log("Exited:", code);
    try {
        assert.equal(code, null);
        assert.deepEqual(
            [...received].sort(),
            ["completion", "hover", "initialize", "invalid-json-diagnostics", "valid-json-diagnostics"].sort()
        );
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    } finally {
        fs.rmSync(serverPath);
        fs.rmdirSync(testDirectory);
    }
});

function send(msg) {
    const json = JSON.stringify(msg);

    console.log("\n=== CLIENT ===");
    console.log(JSON.stringify(msg, null, 2));

    server.stdin.write(
        `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`
    );
}

//
// Initialize
//

send({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        processId: process.pid,
        rootUri: null,
        capabilities: {}
    }
});

//
// Initialized
//

setTimeout(() => {
    send({
        jsonrpc: "2.0",
        method: "initialized",
        params: {}
    });
}, 100);

//
// Open invalid JSON
//

setTimeout(() => {
    send({
        jsonrpc: "2.0",
        method: "textDocument/didOpen",
        params: {
            textDocument: {
                uri: "file:///test.json",
                languageId: "json",
                version: 1,
                text: "{\n  \"name\": }"
            }
        }
    });
}, 250);

//
// Change to valid JSON
//

setTimeout(() => {
    send({
        jsonrpc: "2.0",
        method: "textDocument/didChange",
        params: {
            textDocument: {
                uri: "file:///test.json",
                version: 2
            },
            contentChanges: [
                {
                    text: JSON.stringify({
                        name: "SatisCode",
                        version: "1.0.0"
                    })
                }
            ]
        }
    });
}, 1000);

//
// Completion request
//

setTimeout(() => {
    send({
        jsonrpc: "2.0",
        id: 2,
        method: "textDocument/completion",
        params: {
            textDocument: {
                uri: "file:///test.json"
            },
            position: {
                line: 0,
                character: 1
            }
        }
    });
}, 1500);

//
// Hover request
//

setTimeout(() => {
    send({
        jsonrpc: "2.0",
        id: 3,
        method: "textDocument/hover",
        params: {
            textDocument: {
                uri: "file:///test.json"
            },
            position: {
                line: 0,
                character: 1
            }
        }
    });
}, 2000);

setTimeout(() => {
    server.kill();
}, 5000);

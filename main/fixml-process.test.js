const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createHarness() {
  const children = [];
  const handlers = new Map();
  const messages = [];
  const event = { sender: { isDestroyed: () => false, send: (...args) => messages.push(args) } };
  const context = vm.createContext({
    Buffer, console, process, setTimeout, clearTimeout,
    __dirname: path.resolve(__dirname, '..'),
    require(id) {
      if (id === 'electron') return {
        app: { whenReady: () => ({ then() {} }), on() {} },
        ipcMain: { handle: (name, handler) => handlers.set(name, handler), on: (name, handler) => handlers.set(name, handler) }
      };
      if (id === 'child_process') return { spawn(command, args, options) {
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        child.stdin = { destroyed: false, write: (data) => child.writes.push(data) };
        child.writes = [];
        child.kill = () => { child.killed = true; };
        child.command = command;
        child.args = args;
        child.options = options;
        children.push(child);
        return child;
      } };
      if (id === './main/git-service') return { runGitRequest() {} };
      if (id === './main/settings-manager') return { SettingsManager: class {} };
      return require(id);
    }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8'), context);
  return {
    children,
    handlers,
    messages,
    context,
    start: () => handlers.get('fixml:start')(event, process.cwd()),
    send: (message) => handlers.get('fixml:message')(event, message)
  };
}

function frame(message) {
  const body = Buffer.from(JSON.stringify(message));
  return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`), body]);
}

test('FIXML starts the bundled server and bridges framed LSP messages', async () => {
  const harness = createHarness();
  const started = harness.start();
  const child = harness.children[0];
  child.emit('spawn');
  const result = await started;

  assert.match(result.command, /packages[\\/]FIXML-LSP[\\/]dist[\\/]server\.js$/);
  assert.equal(JSON.stringify(child.args), JSON.stringify([result.command, '--stdio']));
  assert.equal(child.command, process.execPath);
  assert.equal(child.options.cwd, process.cwd());

  const outgoing = { jsonrpc: '2.0', method: 'initialized', params: {} };
  harness.send(outgoing);
  assert.equal(child.writes.length, 1);

  const incoming = frame({ jsonrpc: '2.0', id: 1, result: { ok: true } });
  child.stdout.emit('data', incoming.subarray(0, incoming.length - 4));
  assert.deepEqual(harness.messages, []);
  child.stdout.emit('data', incoming.subarray(incoming.length - 4));
  assert.equal(harness.messages[0][0], 'fixml:message');
  assert.deepEqual(JSON.parse(JSON.stringify(harness.messages[0][1])), {
    jsonrpc: '2.0',
    id: 1,
    result: { ok: true }
  });
});

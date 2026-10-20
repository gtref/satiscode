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
      if (id === 'child_process') return { spawn() {
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        child.writes = [];
        child.stdin = { destroyed: false, write: (data) => child.writes.push(data) };
        child.kill = () => { child.killed = true; };
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
    children, messages, context,
    start: () => handlers.get('fixson:start')(event, process.cwd()),
    send: (message) => handlers.get('fixson:message')(event, message)
  };
}

function frame(message) {
  const body = Buffer.from(JSON.stringify(message));
  return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`), body]);
}

test('late FIXSON events cannot affect a replacement process or its partial message', async () => {
  const harness = createHarness();
  const firstStart = harness.start();
  const first = harness.children[0];
  first.emit('spawn');
  await firstStart;
  first.stdout.emit('data', Buffer.from('Content-Length: 100\r\n\r\n{'));

  const nextStart = harness.start();
  const next = harness.children[1];
  next.emit('spawn');
  await nextStart;
  assert.equal(first.killed, true);

  const message = { jsonrpc: '2.0', id: 1, result: 'current' };
  const data = frame(message);
  next.stdout.emit('data', data.subarray(0, data.length - 5));
  first.stdout.emit('data', frame({ id: 99, result: 'stale' }));
  first.stderr.emit('data', Buffer.from('stale stderr'));
  first.emit('error', new Error('stale error'));
  first.emit('exit', 0);
  assert.deepEqual(harness.messages, []);

  next.stdout.emit('data', data.subarray(data.length - 5));
  assert.equal(harness.messages[0][0], 'fixson:message');
  assert.equal(JSON.stringify(harness.messages[0][1]), JSON.stringify(message));
  assert.equal(harness.messages.length, 1);
  harness.send({ method: 'initialized' });
  assert.equal(next.writes.length, 1);

  next.stderr.emit('data', Buffer.from('current stderr'));
  next.emit('error', new Error('current error'));
  assert.deepEqual(harness.messages.slice(1), [
    ['fixson:stderr', 'current stderr'],
    ['fixson:error', 'current error']
  ]);
});

test('current FIXSON exit clears process and buffer and ignores subsequent events', async () => {
  const harness = createHarness();
  const started = harness.start();
  const child = harness.children[0];
  child.emit('spawn');
  await started;
  child.stdout.emit('data', Buffer.from('Content-Length: 100\r\n\r\n{'));
  child.emit('exit', 0);
  assert.equal(vm.runInContext('fixsonProcess', harness.context), null);
  assert.equal(vm.runInContext('fixsonBuffer.length', harness.context), 0);

  child.stdout.emit('data', frame({ id: 1, result: 'late' }));
  child.stderr.emit('data', Buffer.from('late stderr'));
  child.emit('error', new Error('late error'));
  child.emit('exit', 0);
  harness.send({ method: 'initialized' });
  assert.deepEqual(harness.messages, [['fixson:exit']]);
  assert.equal(child.writes.length, 0);
  assert.equal(vm.runInContext('fixsonBuffer.length', harness.context), 0);
});

test('a superseded spawn failure rejects only its own startup request', async () => {
  const harness = createHarness();
  const failedStart = harness.start();
  const failure = new Error('spawn failed');
  const rejected = assert.rejects(failedStart, failure);
  const nextStart = harness.start();
  harness.children[1].emit('spawn');
  await nextStart;
  harness.children[0].emit('error', failure);
  harness.children[0].emit('exit', 1);
  await rejected;
  assert.deepEqual(harness.messages, []);
  harness.send({ method: 'initialized' });
  assert.equal(harness.children[1].writes.length, 1);
});

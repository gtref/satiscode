const assert = require('node:assert/strict');
const test = require('node:test');
const GitManager = require('./gitman');

test('passes the selected workspace and arguments to the Git bridge', async () => {
  let request;
  const manager = new GitManager({ api: { run: async (...args) => { request = args; return { ok: true, stdout: 'done' }; } } });
  manager.setWorkspace('/selected/workspace');
  assert.equal(await manager.commit('message with spaces'), 'done');
  assert.deepEqual(request, ['commit', '/selected/workspace', ['message with spaces']]);
});

test('rejects structured bridge errors', async () => {
  const manager = new GitManager({ workspace: '/workspace', api: { run: async () => ({ ok: false, stderr: 'failed', code: 1 }) } });
  await assert.rejects(manager.status(), /failed/);
});

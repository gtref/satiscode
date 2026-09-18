const assert = require('node:assert/strict');
const test = require('node:test');
const { runGitRequest, validateGitRequest } = require('./git-service');

test('accepts allowlisted operations and rejects unsupported operations', async () => {
  assert.deepEqual(validateGitRequest({ operation: 'status', workspace: '/workspace' }).gitArgs, ['status', '--short']);
  const result = await runGitRequest({ operation: 'shell', workspace: '/workspace' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_REQUEST');
});

test('uses the selected workspace as cwd and keeps commit arguments separate', async () => {
  let invocation;
  const executor = (...args) => { invocation = args.slice(0, 3); args[3](null, 'committed\n', ''); };
  const result = await runGitRequest({ operation: 'commit', workspace: '/selected/project', args: ['fix; echo unsafe'] }, executor);
  assert.equal(result.ok, true);
  assert.deepEqual(invocation, ['git', ['commit', '-m', 'fix; echo unsafe'], { cwd: '/selected/project' }]);
});

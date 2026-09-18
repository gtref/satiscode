const assert = require('node:assert/strict');
const test = require('node:test');
const { StatusStub } = require('./gitstub');

test('parses modified, added, deleted, renamed, and untracked files', () => {
  assert.deepEqual(StatusStub.parse(' M modified.js\nA  added.js\n D deleted.js\nR  old.js -> new.js\n?? untracked.js'), [
    { code: ' M', file: 'modified.js' }, { code: 'A ', file: 'added.js' }, { code: ' D', file: 'deleted.js' },
    { code: 'R ', file: 'old.js -> new.js' }, { code: '??', file: 'untracked.js' }
  ]);
});

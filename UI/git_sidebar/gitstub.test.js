const assert = require('node:assert/strict');
const test = require('node:test');
const { StatusStub } = require('./gitstub');

test('parses modified, added, deleted, renamed, and untracked files', () => {
  assert.deepEqual(StatusStub.parse(' M modified.js\nA  added.js\n D deleted.js\nR  old.js -> new.js\n?? untracked.js'), [
    { code: ' M', file: 'modified.js' }, { code: 'A ', file: 'added.js' }, { code: ' D', file: 'deleted.js' },
    { code: 'R ', file: 'old.js -> new.js' }, { code: '??', file: 'untracked.js' }
  ]);
});

test('preserves graph connector rows in commit order', () => {
  const { LogStub } = require('./gitstub');
  const rows = LogStub.parse('*   \x1fmerge\x1fleft right\x1fAda\x1ftoday\x1fHEAD -> main\x1fMerge\r\n|\\  \r\n| * \x1fright\x1f\x1fGrace\x1ftoday\x1f\x1fBranch work\r\n|/  \r\n\n');
  assert.equal(rows.length, 4);
  assert.equal(rows[0].message, 'Merge');
  assert.deepEqual(rows[1], { graph: '|\\  ', graphOnly: true });
  assert.equal(rows[2].message, 'Branch work');
  assert.deepEqual(rows[3], { graph: '|/  ', graphOnly: true });
  assert.deepEqual(LogStub.parse(' \n'), []);
});

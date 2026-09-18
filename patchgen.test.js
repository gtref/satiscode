const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { generateUnifiedDiff } = require('./patchgen');

function withFiles(oldContent, newContent, assertion) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'satiscode-patchgen-'));
  const oldFile = path.join(directory, 'old.txt');
  const newFile = path.join(directory, 'new.txt');

  try {
    fs.writeFileSync(oldFile, oldContent);
    fs.writeFileSync(newFile, newContent);
    assertion(generateUnifiedDiff(oldFile, newFile));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('exports generateUnifiedDiff through CommonJS', () => {
  assert.equal(typeof generateUnifiedDiff, 'function');
});

test('uses an explicit zero-length new range for a deletion', () => {
  withFiles('first\nremoved', 'first', (patch) => {
    assert.match(patch, /@@ -2,1 \+1,0 @@\n-removed\n/);
  });
});

test('uses an explicit zero-length old range for an addition', () => {
  withFiles('first', 'first\nadded', (patch) => {
    assert.match(patch, /@@ -1,0 \+2,1 @@\n\+added\n/);
  });
});

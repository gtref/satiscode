const path = require('node:path');
const { execFile } = require('node:child_process');

const OPERATIONS = Object.freeze({
  init: ['init'], status: ['status', '--short'], addAll: ['add', '--all'], pull: ['pull'], push: ['push']
});

function validateGitRequest(request) {
  if (!request || typeof request !== 'object') throw new Error('Invalid Git request.');
  const { operation, workspace, args = [] } = request;
  if (!path.isAbsolute(workspace || '')) throw new Error('A valid workspace path is required.');
  if (!Array.isArray(args) || args.some((argument) => typeof argument !== 'string')) throw new Error('Invalid Git arguments.');
  if (operation === 'commit') {
    if (args.length !== 1 || !args[0].trim() || args[0].length > 1000) throw new Error('A commit message is required.');
    return { workspace: path.resolve(workspace), gitArgs: ['commit', '-m', args[0]] };
  }
  if (!Object.hasOwn(OPERATIONS, operation) || args.length) throw new Error('Unsupported Git operation.');
  return { workspace: path.resolve(workspace), gitArgs: OPERATIONS[operation] };
}

function runGitRequest(request, executor = execFile) {
  let command;
  try { command = validateGitRequest(request); } catch (error) {
    return Promise.resolve({ ok: false, stdout: '', stderr: error.message, code: 'INVALID_REQUEST' });
  }
  return new Promise((resolve) => {
    executor('git', command.gitArgs, { cwd: command.workspace }, (error, stdout = '', stderr = '') => {
      if (error) {
        resolve({ ok: false, stdout: stdout.trim(), stderr: stderr.trim() || error.message, code: typeof error.code === 'number' ? error.code : 'GIT_ERROR' });
        return;
      }
      resolve({ ok: true, stdout: stdout.trim(), stderr: stderr.trim(), code: 0 });
    });
  });
}

module.exports = { OPERATIONS, validateGitRequest, runGitRequest };

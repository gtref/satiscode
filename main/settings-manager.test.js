const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { SettingsManager } = require('./settings-manager');

test('loads defaults and persists user name and theme', async (t) => {
  const userDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'satiscode-settings-'));
  t.after(() => fs.rm(userDataPath, { recursive: true, force: true }));
  const settingsManager = new SettingsManager(userDataPath);

  assert.deepEqual(await settingsManager.getSettings(), {
    theme: 'dark',
    language: 'en',
    userName: '',
    namePromptCompleted: false
  });

  await settingsManager.setUserName('  Ada  ');
  await settingsManager.setTheme('light');
  await settingsManager.setLanguage('es');

  assert.deepEqual(await settingsManager.getSettings(), {
    theme: 'light',
    language: 'es',
    userName: 'Ada',
    namePromptCompleted: true
  });
});

test('rejects unsupported themes and non-string names', async (t) => {
  const userDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'satiscode-settings-'));
  t.after(() => fs.rm(userDataPath, { recursive: true, force: true }));
  const settingsManager = new SettingsManager(userDataPath);

  await assert.rejects(settingsManager.setTheme('unknown'), TypeError);
  await assert.rejects(settingsManager.setLanguage('fr'), TypeError);
  await assert.rejects(settingsManager.setUserName(null), TypeError);
});
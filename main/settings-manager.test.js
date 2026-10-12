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
    namePromptCompleted: false,
    nodeIsDetected: false
  });

  await settingsManager.setUserName('  Ada  ');
  await settingsManager.setTheme('light');
  await settingsManager.setLanguage('es');

  assert.deepEqual(await settingsManager.getSettings(), {
    theme: 'light',
    language: 'es',
    userName: 'Ada',
    namePromptCompleted: true,
    nodeIsDetected: false
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

test('serializes concurrent setting changes without losing unrelated values', async (t) => {
  const userDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'satiscode-settings-'));
  t.after(() => fs.rm(userDataPath, { recursive: true, force: true }));
  const manager = new SettingsManager(userDataPath);
  await manager.saveSettings({ nodeIsDetected: true });

  const [theme, language, name, finalTheme] = await Promise.all([
    manager.setTheme('light'), manager.setLanguage('es'), manager.setUserName(' Ada '), manager.setTheme('high_contrast')
  ]);
  assert.equal(theme.theme, 'light');
  assert.equal(language.language, 'es');
  assert.equal(language.theme, 'light');
  assert.equal(name.userName, 'Ada');
  assert.deepEqual(finalTheme, {
    theme: 'high_contrast', language: 'es', userName: 'Ada', namePromptCompleted: true, nodeIsDetected: true
  });
  assert.deepEqual(await manager.getSettings(), finalTheme);
});

test('replaces settings atomically and recovers after a failed rename', async (t) => {
  const userDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'satiscode-settings-'));
  t.after(() => fs.rm(userDataPath, { recursive: true, force: true }));
  const manager = new SettingsManager(userDataPath);
  const original = await manager.setTheme('light');
  const rename = fs.rename;
  const temporaryPaths = new Set();
  let failRename = true;
  t.mock.method(fs, 'rename', async (source, destination) => {
    assert.equal(destination, manager.filePath);
    assert.equal(path.dirname(source), userDataPath);
    assert.notEqual(source, destination);
    assert.equal(temporaryPaths.has(source), false);
    temporaryPaths.add(source);
    assert.deepEqual(JSON.parse(await fs.readFile(destination, 'utf8')), original);
    const pending = JSON.parse(await fs.readFile(source, 'utf8'));
    assert.equal(pending.theme, 'light');
    assert.equal(pending.language, 'es');
    if (failRename) throw new Error('rename failed');
    return rename(source, destination);
  });

  await assert.rejects(manager.setLanguage('es'), /rename failed/);
  assert.deepEqual(await manager.getSettings(), original);
  assert.deepEqual(await fs.readdir(userDataPath), ['settings.json']);
  failRename = false;
  const saved = await manager.setLanguage('es');
  assert.deepEqual(await manager.getSettings(), saved);
  assert.equal(temporaryPaths.size, 2);
  assert.deepEqual(await fs.readdir(userDataPath), ['settings.json']);
});

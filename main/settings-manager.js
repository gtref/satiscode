const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const DEFAULT_SETTINGS = {
  theme: 'dark',
  language: 'en',
  userName: '',
  namePromptCompleted: false,
  nodeIsDetected: false
};
const AVAILABLE_THEMES = new Set(['dark', 'light', 'high_contrast']);
const AVAILABLE_LANGUAGES = new Set(['en', 'es']);

function normalizeSettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    theme: AVAILABLE_THEMES.has(settings.theme) ? settings.theme : DEFAULT_SETTINGS.theme,
    language: AVAILABLE_LANGUAGES.has(settings.language) ? settings.language : DEFAULT_SETTINGS.language,
    userName: typeof settings.userName === 'string' ? settings.userName.trim().slice(0, 80) : '',
    namePromptCompleted: settings.namePromptCompleted === true,
    nodeIsDetected: settings.nodeIsDetected === true
  };
}

class SettingsManager {
  constructor(userDataPath) {
    this.filePath = path.join(userDataPath, 'settings.json');
    this.pendingSave = Promise.resolve();
  }

  async getSettings() {
    try {
      return normalizeSettings(JSON.parse(await fs.readFile(this.filePath, 'utf8')));
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
      return { ...DEFAULT_SETTINGS };
    }
  }

  async setUserName(userName) {
    if (typeof userName !== 'string') throw new TypeError('User name must be a string.');
    return this.saveSettings({ userName, namePromptCompleted: true });
  }

  async setTheme(theme) {
    if (!AVAILABLE_THEMES.has(theme)) throw new TypeError('Invalid theme.');
    return this.saveSettings({ theme });
  }

  async setLanguage(language) {
    if (!AVAILABLE_LANGUAGES.has(language)) throw new TypeError('Invalid interface language.');
    return this.saveSettings({ language });
  }

  async saveSettings(settings) {
    const save = this.pendingSave.then(async () => {
      const normalizedSettings = normalizeSettings({ ...await this.getSettings(), ...settings });
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const temporaryPath = `${this.filePath}.${randomUUID()}.tmp`;
      try {
        await fs.writeFile(temporaryPath, `${JSON.stringify(normalizedSettings, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
        await fs.rename(temporaryPath, this.filePath);
      } finally {
        await fs.rm(temporaryPath, { force: true });
      }
      return normalizedSettings;
    });
    // Keep later updates usable even when a write fails.
    this.pendingSave = save.catch(() => {});
    return save;
  }
}

module.exports = { SettingsManager };

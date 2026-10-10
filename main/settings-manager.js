const fs = require('node:fs/promises');
const path = require('node:path');

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
    const settings = await this.getSettings();
    settings.userName = userName.trim().slice(0, 80);
    settings.namePromptCompleted = true;
    return this.saveSettings(settings);
  }

  async setTheme(theme) {
    if (!AVAILABLE_THEMES.has(theme)) throw new TypeError('Invalid theme.');
    const settings = await this.getSettings();
    settings.theme = theme;
    return this.saveSettings(settings);
  }

  async setLanguage(language) {
    if (!AVAILABLE_LANGUAGES.has(language)) throw new TypeError('Invalid interface language.');
    const settings = await this.getSettings();
    settings.language = language;
    return this.saveSettings(settings);
  }

  async saveSettings(settings) {
    const normalizedSettings = normalizeSettings(settings);
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, `${JSON.stringify(normalizedSettings, null, 2)}\n`, 'utf8');
    return normalizedSettings;
  }
}

module.exports = { SettingsManager };
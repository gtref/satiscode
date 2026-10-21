/* ==========================================================================
   SATISCODE WEB IDE API TRANSLATION LAYER
   Translates Electron IPC APIs (window.api) to Browser APIs & Virtual Filesystem
   ========================================================================== */

(function () {
  'use strict';

  const SETTINGS_KEY = 'satiscode-web-settings';
  const DEFAULT_SETTINGS = {
    language: 'en',
    theme: 'dark',
    userName: '',
    namePromptCompleted: false
  };

  function loadSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Unable to save settings to localStorage:', e);
    }
    return settings;
  }

  // Virtual Filesystem in memory
  const virtualWorkspace = {
    path: '/workspace',
    name: 'workspace',
    files: new Map([
      ['/workspace/main.cpp', { name: 'main.cpp', path: '/workspace/main.cpp', content: '#include <iostream>\n\nint main() {\n    std::cout << "Hello from Satiscode Web IDE!" << std::endl;\n    return 0;\n}\n', isDirectory: false }],
      ['/workspace/script.py', { name: 'script.py', path: '/workspace/script.py', content: 'def main():\n    print("Hello from Python in Satiscode Web IDE!")\n\nif __name__ == "__main__":\n    main()\n', isDirectory: false }],
      ['/workspace/index.html', { name: 'index.html', path: '/workspace/index.html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Satiscode Sample</title>\n</head>\n<body>\n  <h1>Satiscode Web IDE</h1>\n</body>\n</html>\n', isDirectory: false }],
      ['/workspace/style.css', { name: 'style.css', path: '/workspace/style.css', content: 'body {\n  font-family: sans-serif;\n  background: #1e1e1e;\n  color: #cccccc;\n}\n', isDirectory: false }],
      ['/workspace/app.js', { name: 'app.js', path: '/workspace/app.js', content: 'console.log("Satiscode Web IDE initialized.");\n', isDirectory: false }],
      ['/workspace/README.md', { name: 'README.md', path: '/workspace/README.md', content: '# Satiscode Web IDE\n\nWelcome to Satiscode Web IDE running in your browser.\n\n## Features\n- C/C++, Python, Web Dev, and Markdown support\n- Tabbed editing using Monaco\n- Live Markdown preview\n- Local file open/save support\n', isDirectory: false }]
    ])
  };

  let activeWorkspacePath = '/workspace';

  function downloadFile(filename, content) {
    const a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Define window.api translation layer
  window.api = {
    highlightCode: (code, language) => {
      if (window.hljs && typeof window.hljs.getLanguage === 'function' && window.hljs.getLanguage(language)) {
        return window.hljs.highlight(code, { language }).value;
      }
      return null;
    },

    openFile: async () => {
      if (window.showOpenFilePicker) {
        try {
          const [handle] = await window.showOpenFilePicker();
          const file = await handle.getFile();
          const content = await file.text();
          const filePath = `${activeWorkspacePath}/${file.name}`;
          virtualWorkspace.files.set(filePath, {
            name: file.name,
            path: filePath,
            content,
            isDirectory: false
          });
          return { path: filePath, content };
        } catch (err) {
          if (err.name === 'AbortError') return null;
        }
      }

      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async () => {
          if (input.files && input.files[0]) {
            const file = input.files[0];
            const content = await file.text();
            const filePath = `${activeWorkspacePath}/${file.name}`;
            virtualWorkspace.files.set(filePath, {
              name: file.name,
              path: filePath,
              content,
              isDirectory: false
            });
            resolve({ path: filePath, content });
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    },

    readFile: async (filePath) => {
      const entry = virtualWorkspace.files.get(filePath);
      if (entry) {
        return { path: entry.path, content: entry.content };
      }
      return { path: filePath, content: '' };
    },

    getWorkspacePath: async () => activeWorkspacePath,

    saveFile: async (data) => {
      let targetPath = data.filePath;
      if (!targetPath) {
        const fileName = prompt('Save As file name:', 'untitled.txt');
        if (!fileName) return null;
        targetPath = `${activeWorkspacePath}/${fileName}`;
      }

      const fileName = targetPath.split(/[\\/]/).pop();
      virtualWorkspace.files.set(targetPath, {
        name: fileName,
        path: targetPath,
        content: data.content,
        isDirectory: false
      });

      downloadFile(fileName, data.content);
      return targetPath;
    },

    listDirectory: async (directoryPath) => {
      const dir = directoryPath || activeWorkspacePath;
      const results = [];
      for (const [filePath, file] of virtualWorkspace.files.entries()) {
        const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
        if (parentDir === dir || dir === '/workspace') {
          results.push({
            name: file.name,
            path: file.path,
            isDirectory: file.isDirectory
          });
        }
      }
      return results;
    },

    openFolder: async () => {
      if (window.showDirectoryPicker) {
        try {
          const dirHandle = await window.showDirectoryPicker();
          activeWorkspacePath = `/${dirHandle.name}`;
          virtualWorkspace.files.clear();

          for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              const content = await file.text();
              const filePath = `${activeWorkspacePath}/${file.name}`;
              virtualWorkspace.files.set(filePath, {
                name: file.name,
                path: filePath,
                content,
                isDirectory: false
              });
            }
          }
          return activeWorkspacePath;
        } catch (err) {
          if (err.name === 'AbortError') return null;
        }
      }

      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = async () => {
          if (input.files && input.files.length > 0) {
            const folderName = input.files[0].webkitRelativePath.split('/')[0] || 'folder';
            activeWorkspacePath = `/${folderName}`;
            virtualWorkspace.files.clear();

            for (const file of Array.from(input.files)) {
              const content = await file.text();
              const filePath = `${activeWorkspacePath}/${file.name}`;
              virtualWorkspace.files.set(filePath, {
                name: file.name,
                path: filePath,
                content,
                isDirectory: false
              });
            }
            resolve(activeWorkspacePath);
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    },

    setGitWorkspace: async (workspace) => {
      console.log('Web IDE Git workspace set:', workspace);
    },

    gitBlame: async (_workspace, filePath) => {
      const fileName = filePath ? filePath.split(/[\\/]/).pop() : 'file';
      return {
        ok: true,
        stdout: `1a2b3c4d (${loadSettings().userName || 'Developer'} 2026-01-01 12:00:00 +0000 1) Web IDE local file: ${fileName}`,
        stderr: ''
      };
    },

    getSettings: async () => loadSettings(),

    setUserName: async (userName) => {
      const settings = loadSettings();
      settings.userName = userName;
      settings.namePromptCompleted = true;
      return saveSettings(settings);
    },

    setTheme: async (theme) => {
      const settings = loadSettings();
      settings.theme = theme;
      return saveSettings(settings);
    },

    setLanguage: async (language) => {
      const settings = loadSettings();
      settings.language = language;
      return saveSettings(settings);
    },

    exit: () => {
      window.location.href = '../index.html';
    },

    // --- Language Server Stubs for Web Environment ---
    startClangd: async () => { throw new Error('clangd is unavailable in Web IDE'); },
    sendClangdMessage: () => {},
    stopClangd: () => {},
    onClangdMessage: () => {},
    onClangdStderr: () => {},
    onClangdError: () => {},

    startPyright: async () => { throw new Error('pyright is unavailable in Web IDE'); },
    sendPyrightMessage: () => {},
    stopPyright: () => {},
    onPyrightMessage: () => {},
    onPyrightStderr: () => {},
    onPyrightError: () => {},
    onPyrightExit: () => {},

    startFixson: async () => { throw new Error('FIXSON is unavailable in Web IDE'); },
    sendFixsonMessage: () => {},
    stopFixson: () => {},
    onFixsonMessage: () => {},
    onFixsonStderr: () => {},
    onFixsonError: () => {},
    onFixsonExit: () => {}
  };
})();

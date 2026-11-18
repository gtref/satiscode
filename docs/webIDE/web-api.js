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
      ['/workspace/package.json', { name: 'package.json', path: '/workspace/package.json', content: '{\n  "name": "satiscode-project",\n  "version": "1.0.0"\n}\n', isDirectory: false }],
      ['/workspace/app.js', { name: 'app.js', path: '/workspace/app.js', content: 'console.log("Satiscode Web IDE initialized.");\n', isDirectory: false }],
      ['/workspace/README.md', { name: 'README.md', path: '/workspace/README.md', content: '# Satiscode Web IDE\n\nWelcome to Satiscode Web IDE running in your browser.\n\n## Features\n- C/C++, Python, Web Dev, JSON, and Markdown support\n- Tabbed editing using Monaco\n- Live Markdown preview\n- In-browser FIXSON JSON LSP validation & auto-completion\n- Project export as ZIP archive\n', isDirectory: false }]
    ])
  };

  let activeWorkspacePath = '/workspace';

  // --- ZIP Save Functionality ---
  async function saveProjectAsZip() {
    if (!window.JSZip) {
      alert('JSZip library is loading. Please try again in a moment.');
      return false;
    }

    const zip = new window.JSZip();
    for (const [filePath, file] of virtualWorkspace.files.entries()) {
      if (!file.isDirectory) {
        const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        zip.file(relativePath, file.content);
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'satiscode-project.zip';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  // --- In-Browser FIXSON JS Language Service ---
  let fixsonDiagnosticsListener = null;

  function validateJsonDocument(uri, text) {
    const diagnostics = [];
    try {
      JSON.parse(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      diagnostics.push({
        severity: 1, // Error
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: Math.min(100, text.length || 1) }
        },
        message: `FIXSON JSON Error: ${message}`,
        source: 'fixson'
      });
    }

    if (fixsonDiagnosticsListener) {
      fixsonDiagnosticsListener({
        method: 'textDocument/publishDiagnostics',
        params: { uri, diagnostics }
      });
    }
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
      if (!data || typeof data.content !== 'string') return null;
      let filePath = data.filePath;
      if (!filePath) {
        let counter = 1;
        do {
          filePath = `${activeWorkspacePath}/Untitled-${counter++}.txt`;
        } while (virtualWorkspace.files.has(filePath));
      }
      virtualWorkspace.files.set(filePath, {
        name: filePath.split('/').pop(),
        path: filePath,
        content: data.content,
        isDirectory: false
      });
      try {
        return await saveProjectAsZip() ? filePath : null;
      } catch (error) {
        console.error('Unable to export project:', error);
        return null;
      }
    },

    saveProjectZip: saveProjectAsZip,

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
            const folderName = input.files[0].webkitRelativePath?.split('/')[0] || 'folder';
            activeWorkspacePath = `/${folderName}`;
            virtualWorkspace.files.clear();

            for (const file of Array.from(input.files)) {
              const content = await file.text();
              const filePath = `/${file.webkitRelativePath || `${folderName}/${file.name}`}`;
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

    setGitWorkspace: async () => {},
    gitBlame: async () => ({ ok: true, stdout: '', stderr: '' }),

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

    // --- In-Browser JS FIXSON LSP Implementation ---
    startFixson: async () => {
      console.log('FIXSON JSON LSP started in browser');
      return true;
    },
    sendFixsonMessage: (msg) => {
      if (msg.method === 'textDocument/didOpen' || msg.method === 'textDocument/didChange') {
        const uri = msg.params.textDocument.uri;
        const text = msg.params.contentChanges
          ? msg.params.contentChanges[0].text
          : msg.params.textDocument.text;
        validateJsonDocument(uri, text);
      } else if (msg.method === 'textDocument/completion' && fixsonDiagnosticsListener) {
        const items = ['name', 'version', 'description', 'author', 'license', 'homepage', 'repository', 'dependencies'].map((label) => ({
          label,
          kind: 10 // Property
        }));
        fixsonDiagnosticsListener({ id: msg.id, result: { items } });
      } else if (msg.method === 'textDocument/hover' && fixsonDiagnosticsListener) {
        fixsonDiagnosticsListener({
          id: msg.id,
          result: { contents: { kind: 'plaintext', value: 'Fixson JSON Document (Web LSP)' } }
        });
      }
    },
    stopFixson: () => {},
    onFixsonMessage: (cb) => { fixsonDiagnosticsListener = cb; },
    onFixsonStderr: () => {},
    onFixsonError: () => {},
    onFixsonExit: () => {},

    // Unused desktop LSPs
    startClangd: async () => { throw new Error('clangd native binary unavailable in Web IDE'); },
    sendClangdMessage: () => {},
    stopClangd: () => {},
    onClangdMessage: () => {},
    onClangdStderr: () => {},
    onClangdError: () => {},

    startPyright: async () => { throw new Error('pyright process unavailable in Web IDE'); },
    sendPyrightMessage: () => {},
    stopPyright: () => {},
    onPyrightMessage: () => {},
    onPyrightStderr: () => {},
    onPyrightError: () => {},
    onPyrightExit: () => {}
  };
})();

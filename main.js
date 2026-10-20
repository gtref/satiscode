process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { runGitRequest } = require('./main/git-service');
const { SettingsManager } = require('./main/settings-manager');

let clangdProcess = null;
let clangdBuffer = Buffer.alloc(0);
let isQuitting = false;
let pyrightProcess = null;
let pyrightBuffer = Buffer.alloc(0);
let fixsonProcess = null;
let fixsonBuffer = Buffer.alloc(0);
let settingsManager = null;


function sendToClangd(message) {
  if (!clangdProcess || clangdProcess.stdin.destroyed) return;
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'ascii');
  clangdProcess.stdin.write(Buffer.concat([header, body]));
}

function sendToPyright(message) {
  if (!pyrightProcess || pyrightProcess.stdin.destroyed) return;
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'ascii');
  pyrightProcess.stdin.write(Buffer.concat([header, body]));
}

function sendToFixson(message) {
  if (!fixsonProcess || fixsonProcess.stdin.destroyed) return;
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'ascii');
  fixsonProcess.stdin.write(Buffer.concat([header, body]));
}


function sendToRenderer(event, channel, ...args) {
  if (!event.sender.isDestroyed()) event.sender.send(channel, ...args);
}

function stopClangd() {
  if (clangdProcess) clangdProcess.kill();
  clangdProcess = null;
  clangdBuffer = Buffer.alloc(0);
}

function stopPyright() {
  if (pyrightProcess) pyrightProcess.kill();
  pyrightProcess = null;
  pyrightBuffer = Buffer.alloc(0);
}

function stopFixson() {
  if (fixsonProcess) fixsonProcess.kill();
  fixsonProcess = null;
  fixsonBuffer = Buffer.alloc(0);
}


function findProjectRoot(startPath) {
  let currentPath = path.resolve(startPath || process.cwd());
  while (true) {
    if (['compile_commands.json', '.clangd', '.git'].some((entry) => fs.existsSync(path.join(currentPath, entry)))) {
      return currentPath;
    }
    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) return path.resolve(startPath || process.cwd());
    currentPath = parentPath;
  }
}

function findPythonProjectRoot(startPath) {
  let currentPath = path.resolve(startPath || process.cwd());
  while (true) {
    if (['pyproject.toml', 'pyrightconfig.json', 'setup.py', 'requirements.txt', '.git'].some((entry) => fs.existsSync(path.join(currentPath, entry)))) {
      return currentPath;
    }
    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) return path.resolve(startPath || process.cwd());
    currentPath = parentPath;
  }
}

function gracefulStopClangd() {
  if (!clangdProcess) return Promise.resolve();
  const processToStop = clangdProcess;
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (clangdProcess === processToStop) stopClangd();
      resolve();
    };
    const timeout = setTimeout(finish, 1000);
    processToStop.once('exit', finish);
    sendToClangd({ jsonrpc: '2.0', id: Date.now(), method: 'shutdown', params: null });
    setTimeout(() => {
      if (!settled && !processToStop.killed) {
        sendToClangd({ jsonrpc: '2.0', method: 'exit', params: null });
      }
    }, 250);
  });
}

function gracefulStopPyright() {
  if (!pyrightProcess) return Promise.resolve();
  const processToStop = pyrightProcess;
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (pyrightProcess === processToStop) stopPyright();
      resolve();
    };
    const timeout = setTimeout(finish, 1000);
    processToStop.once('exit', finish);
    sendToPyright({ jsonrpc: '2.0', id: Date.now(), method: 'shutdown', params: null });
    setTimeout(() => {
      if (!settled && !processToStop.killed) {
        sendToPyright({ jsonrpc: '2.0', method: 'exit', params: null });
      }
    }, 250);
  });
}

function gracefulStopFixson() {
  if (!fixsonProcess) return Promise.resolve();
  const processToStop = fixsonProcess;
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (fixsonProcess === processToStop) stopFixson();
      resolve();
    };
    const timeout = setTimeout(finish, 1000);
    processToStop.once('exit', finish);
    sendToFixson({ jsonrpc: '2.0', id: Date.now(), method: 'shutdown', params: null });
    setTimeout(() => {
      if (!settled && !processToStop.killed) {
        sendToFixson({ jsonrpc: '2.0', method: 'exit', params: null });
      }
    }, 250);
  });
}


function getClangdPath() {
  const isWin = process.platform === 'win32';
  const clangdExecutable = isWin ? 'clangd.exe' : 'clangd';
  const baseDir = app.isPackaged ? process.resourcesPath : __dirname;
  return path.join(baseDir, 'bin', clangdExecutable);
}

function getPyrightPath() {
  const baseDir = app.isPackaged ? process.resourcesPath : __dirname;
  return path.join(baseDir, 'PythonLSP', 'pyright-langserver.js');
}

function getFixsonPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'FIXSON-LSP', 'dist', 'server.js')
    : path.join(__dirname, 'packages', 'FIXSON-LSP', 'dist', 'server.js');
}


function startClangd(event, rootPath) {
  stopClangd();
  const projectRoot = findProjectRoot(rootPath);
  const clangdCommand = getClangdPath();

  clangdProcess = spawn(clangdCommand, ['--background-index', '--header-insertion=never'], {
    cwd: projectRoot,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const processStarted = new Promise((resolve, reject) => {
    clangdProcess.once('spawn', () => resolve({ projectRoot, command: clangdCommand }));
    clangdProcess.once('error', reject);
  });

  clangdProcess.stdout.on('data', (chunk) => {
    clangdBuffer = Buffer.concat([clangdBuffer, chunk]);
    while (true) {
      const headerEnd = clangdBuffer.indexOf('\r\n\r\n');
      if (headerEnd < 0) break;
      const header = clangdBuffer.subarray(0, headerEnd).toString('ascii');
      const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
      if (!lengthMatch) {
        clangdBuffer = clangdBuffer.subarray(headerEnd + 4);
        continue;
      }
      const bodyLength = Number(lengthMatch[1]);
      const bodyStart = headerEnd + 4;
      if (clangdBuffer.length < bodyStart + bodyLength) break;
      const body = clangdBuffer.subarray(bodyStart, bodyStart + bodyLength).toString('utf8');
      clangdBuffer = clangdBuffer.subarray(bodyStart + bodyLength);
      try {
        sendToRenderer(event, 'clangd:message', JSON.parse(body));
      } catch (error) {
        console.error('Invalid clangd message:', error);
      }
    }
  });

  clangdProcess.stderr.on('data', (chunk) => sendToRenderer(event, 'clangd:stderr', chunk.toString()));
  clangdProcess.on('error', (error) => sendToRenderer(event, 'clangd:error', error.message));
  clangdProcess.on('exit', () => {
    sendToRenderer(event, 'clangd:exit');
    clangdProcess = null;
  });

  return processStarted;
}

function startPyright(event, rootPath) {
  stopPyright();

  const projectRoot = findPythonProjectRoot(rootPath);
  const pyrightCommand = getPyrightPath();

  pyrightProcess = spawn(process.execPath, [pyrightCommand, '--stdio'], {
    cwd: projectRoot,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const processStarted = new Promise((resolve, reject) => {
    pyrightProcess.once('spawn', () => resolve({ projectRoot, command: pyrightCommand }));
    pyrightProcess.once('error', reject);
  });

  pyrightProcess.stdout.on('data', (chunk) => {
    pyrightBuffer = Buffer.concat([pyrightBuffer, chunk]);

    while (true) {
      const headerEnd = pyrightBuffer.indexOf('\r\n\r\n');
      if (headerEnd < 0) break;

      const header = pyrightBuffer.subarray(0, headerEnd).toString('ascii');
      const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
      if (!lengthMatch) {
        pyrightBuffer = pyrightBuffer.subarray(headerEnd + 4);
        continue;
      }

      const bodyLength = Number(lengthMatch[1]);
      const bodyStart = headerEnd + 4;

      if (pyrightBuffer.length < bodyStart + bodyLength) break;

      const body = pyrightBuffer.subarray(bodyStart, bodyStart + bodyLength).toString('utf8');
      pyrightBuffer = pyrightBuffer.subarray(bodyStart + bodyLength);

      try {
        sendToRenderer(event, 'pyright:message', JSON.parse(body));
      } catch (error) {
        console.error('Invalid pyright message:', error);
      }
    }
  });

  pyrightProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    if (text.includes('Python was not found; run without arguments to install from the Microsoft Store')) {
      return;
    }
    sendToRenderer(event, 'pyright:stderr', text);
  });

  pyrightProcess.on('error', (error) =>
    sendToRenderer(event, 'pyright:error', error.message)
  );

  pyrightProcess.on('exit', () => {
    sendToRenderer(event, 'pyright:exit');
    pyrightProcess = null;
  });

  return processStarted;
}

function startFixson(event, rootPath) {
  stopFixson();

  const projectRoot = path.resolve(rootPath || process.cwd());
  const fixsonCommand = getFixsonPath();

  fixsonProcess = spawn(process.execPath, [fixsonCommand, '--stdio'], {
    cwd: projectRoot,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  const processStarted = new Promise((resolve, reject) => {
    fixsonProcess.once('spawn', () => resolve({ projectRoot, command: fixsonCommand }));
    fixsonProcess.once('error', reject);
  });

  fixsonProcess.stdout.on('data', (chunk) => {
    fixsonBuffer = Buffer.concat([fixsonBuffer, chunk]);

    while (true) {
      const headerEnd = fixsonBuffer.indexOf('\r\n\r\n');
      if (headerEnd < 0) break;

      const header = fixsonBuffer.subarray(0, headerEnd).toString('ascii');
      const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
      if (!lengthMatch) {
        fixsonBuffer = fixsonBuffer.subarray(headerEnd + 4);
        continue;
      }

      const bodyLength = Number(lengthMatch[1]);
      const bodyStart = headerEnd + 4;
      if (fixsonBuffer.length < bodyStart + bodyLength) break;

      const body = fixsonBuffer.subarray(bodyStart, bodyStart + bodyLength).toString('utf8');
      fixsonBuffer = fixsonBuffer.subarray(bodyStart + bodyLength);

      try {
        sendToRenderer(event, 'fixson:message', JSON.parse(body));
      } catch (error) {
        console.error('Invalid FIXSON message:', error);
      }
    }
  });

  fixsonProcess.stderr.on('data', (chunk) => sendToRenderer(event, 'fixson:stderr', chunk.toString()));
  fixsonProcess.on('error', (error) => sendToRenderer(event, 'fixson:error', error.message));
  fixsonProcess.on('exit', () => {
    sendToRenderer(event, 'fixson:exit');
    fixsonProcess = null;
  });

  return processStarted;
}


function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'satiacode.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.webContents.on('console-message', (event) => {
    const { level, message, line, sourceId } = event;
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process exited:', details.reason);
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  settingsManager = new SettingsManager(app.getPath('userData'));
  createWindow();
});

ipcMain.handle('settings:get', () => settingsManager.getSettings());
ipcMain.handle('settings:setUserName', (_event, userName) => settingsManager.setUserName(userName));
ipcMain.handle('settings:setTheme', (_event, theme) => settingsManager.setTheme(theme));
ipcMain.handle('settings:setLanguage', (_event, language) => settingsManager.setLanguage(language));

// File Open Handler
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  if (canceled) return null;
  const content = fs.readFileSync(filePaths[0], 'utf-8');
  return { path: filePaths[0], content };
});

// Folder Open Handler
ipcMain.handle('dialog:openFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

ipcMain.handle('file:read', async (_event, filePath) => ({
  path: filePath,
  content: await fs.promises.readFile(filePath, 'utf-8')
}));

ipcMain.handle('app:workspacePath', () => process.cwd());

// File Save Handler
ipcMain.handle('file:save', async (event, { filePath, content }) => {
  let targetPath = filePath;
  if (!targetPath) {
    const { canceled, filePath: savePath } = await dialog.showSaveDialog();
    if (canceled) return null;
    targetPath = savePath;
  }
  fs.writeFileSync(targetPath, content, 'utf-8');
  return targetPath;
});

ipcMain.handle('directory:list', async (_event, directoryPath) => {
  const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
  return entries
    .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'node_modules')
    .map((entry) => ({ name: entry.name, path: path.join(directoryPath, entry.name), isDirectory: entry.isDirectory() }))
    .sort((left, right) => Number(right.isDirectory) - Number(left.isDirectory) || left.name.localeCompare(right.name));
});

ipcMain.handle('git:run', (_event, request) => runGitRequest(request));

ipcMain.handle('clangd:start', (event, rootPath) => startClangd(event, rootPath));
ipcMain.on('clangd:message', (_event, message) => sendToClangd(message));
ipcMain.on('clangd:stop', stopClangd);
ipcMain.handle('pyright:start', (event, rootPath) => startPyright(event, rootPath));
ipcMain.on('pyright:message', (_event, message) => sendToPyright(message));
ipcMain.on('pyright:stop', stopPyright);
ipcMain.handle('fixson:start', (event, rootPath) => startFixson(event, rootPath));
ipcMain.on('fixson:message', (_event, message) => sendToFixson(message));
ipcMain.on('fixson:stop', stopFixson);

ipcMain.handle('app:exit', async () => {
  isQuitting = true;
  await Promise.all([gracefulStopClangd(), gracefulStopPyright(), gracefulStopFixson()]);
  app.quit();
});
app.on('before-quit', (event) => {
  if (isQuitting) return;
  isQuitting = true;
  event.preventDefault();
  Promise.all([gracefulStopClangd(), gracefulStopPyright(), gracefulStopFixson()]).finally(() => app.quit());
});
app.on('will-quit', () => {
  stopClangd();
  stopPyright();
  stopFixson();
});

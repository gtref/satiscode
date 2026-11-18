const fs = require('fs');
const path = require('path');
const { buildWebIdeShared } = require('./build-webide');

const rootDir = path.join(__dirname, '..');

function verifyFile(relativePath, minSize = 1) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Asset verification failed: Missing file at ${relativePath}`);
  }
  const stats = fs.statSync(fullPath);
  if (stats.size < minSize) {
    throw new Error(
      `Asset verification failed: File ${relativePath} size is ${stats.size} bytes (expected >= ${minSize})`
    );
  }
  console.log(`[PASS] ${relativePath} (${stats.size} bytes)`);
}

function verifyBuildAssets() {
  console.log('Verifying compiled LSP language server distributions...');
  verifyFile('packages/FIXSON-LSP/dist/server.js', 10000);
  verifyFile('packages/FIXML-LSP/dist/server.js', 10000);

  console.log('Verifying Web IDE shared assets synchronization...');
  buildWebIdeShared();
  verifyFile('docs/webIDE/index.html', 100);
  verifyFile('docs/webIDE/app.js', 100);
  verifyFile('docs/webIDE/web-api.js', 100);
  verifyFile('docs/webIDE/shared/styles/style1.css', 50);
  verifyFile('docs/webIDE/shared/UI/tab_manager/tabman.js', 50);
  verifyFile('docs/webIDE/shared/UI/git_sidebar/gitman.js', 50);
  verifyFile('docs/webIDE/shared/icons.js', 50);
  verifyFile('docs/webIDE/shared/themes.js', 50);

  console.log('Verifying core application entry points...');
  verifyFile('index.html', 1000);
  verifyFile('main.js', 1000);
  verifyFile('preload.js', 500);

  console.log('\nAll build assets verified successfully!');
}

try {
  verifyBuildAssets();
} catch (error) {
  console.error('\n' + error.message);
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const targetDir = path.join(rootDir, 'docs', 'webIDE', 'shared');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = stats && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else if (exists) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function buildWebIdeShared() {
  const itemsToSync = ['styles', 'UI', 'themes', 'icons', 'icons.js', 'themes.js'];

  itemsToSync.forEach((item) => {
    const srcPath = path.join(rootDir, item);
    const destPath = path.join(targetDir, item);
    copyRecursiveSync(srcPath, destPath);
  });

  // The desktop MarkdownView imports node_modules; the web app has its own view.
  fs.rmSync(path.join(targetDir, 'UI', 'markdown_view', 'view.js'), { force: true });

  console.log('Successfully synced main IDE internals to docs/webIDE/shared/');
}

if (require.main === module) {
  buildWebIdeShared();
}

module.exports = { buildWebIdeShared };

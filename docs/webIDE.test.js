const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

test("verifies Web IDE files and shared sync assets exist", () => {
  const webIdeDir = path.join(__dirname, "webIDE");
  assert.ok(existsSync(path.join(webIdeDir, "index.html")), "index.html should exist");
  assert.ok(existsSync(path.join(webIdeDir, "style.css")), "style.css should exist");
  assert.ok(existsSync(path.join(webIdeDir, "app.js")), "app.js should exist");
  assert.ok(existsSync(path.join(webIdeDir, "web-api.js")), "web-api.js should exist");

  const sharedDir = path.join(webIdeDir, "shared");
  assert.ok(existsSync(path.join(sharedDir, "styles", "style1.css")), "shared style1.css should exist");
  assert.ok(existsSync(path.join(sharedDir, "UI", "tab_manager", "tabman.js")), "shared TabManager should exist");
  assert.ok(existsSync(path.join(sharedDir, "icons.js")), "shared icons.js should exist");
  assert.ok(existsSync(path.join(sharedDir, "themes.js")), "shared themes.js should exist");
});

test("verifies web-api.js browser translation layer exports required window.api methods", () => {
  const apiJs = readFileSync(path.join(__dirname, "webIDE", "web-api.js"), "utf8");

  assert.match(apiJs, /window\.api\s*=\s*\{/);
  assert.match(apiJs, /openFile:/);
  assert.match(apiJs, /readFile:/);
  assert.match(apiJs, /saveFile:/);
  assert.match(apiJs, /listDirectory:/);
  assert.match(apiJs, /openFolder:/);
  assert.match(apiJs, /getSettings:/);
  assert.match(apiJs, /setUserName:/);
  assert.match(apiJs, /setTheme:/);
  assert.match(apiJs, /setLanguage:/);
  assert.match(apiJs, /startClangd:/);
  assert.match(apiJs, /startPyright:/);
  assert.match(apiJs, /startFixson:/);
});

test("verifies docs/webIDE/index.html loads web-api.js and shared module dependencies", () => {
  const htmlContent = readFileSync(path.join(__dirname, "webIDE", "index.html"), "utf8");

  assert.match(htmlContent, /<script src="web-api\.js"><\/script>/);
  assert.match(htmlContent, /href="shared\/styles\/style1\.css"/);
  assert.match(htmlContent, /type="module" src="app\.js"/);
});

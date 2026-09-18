const fs = require("fs");
const path = require("path");

function generateUnifiedDiff(oldFile, newFile) {
  const oldText = fs.readFileSync(oldFile, "utf8").split("\n");
  const newText = fs.readFileSync(newFile, "utf8").split("\n");

  let patch = "";
  patch += `--- ${path.basename(oldFile)}\n`;
  patch += `+++ ${path.basename(newFile)}\n`;

  let i = 0;
  let j = 0;

  while (i < oldText.length || j < newText.length) {
    const oldLine = oldText[i];
    const newLine = newText[j];

    if (oldLine === newLine) {
      i++;
      j++;
      continue;
    }

    // Both lines exist but differ
    if (oldLine !== undefined && newLine !== undefined) {
      patch += `@@ -${i + 1} +${j + 1} @@\n`;
      patch += `-${oldLine}\n`;
      patch += `+${newLine}\n`;
      i++;
      j++;
      continue;
    }

    // Old line removed
    if (oldLine !== undefined) {
      patch += `@@ -${i + 1},1 +${j},0 @@\n`;
      patch += `-${oldLine}\n`;
      i++;
      continue;
    }

    // New line added
    if (newLine !== undefined) {
      patch += `@@ -${i},0 +${j + 1},1 @@\n`;
      patch += `+${newLine}\n`;
      j++;
      continue;
    }
  }

  return patch;
}

module.exports = { generateUnifiedDiff };

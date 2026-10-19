const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

function createElement() {
  return {
    children: [],
    append(...elements) {
      this.children.push(...elements);
    },
    appendChild(element) {
      this.children.push(element);
    },
    replaceChildren(...elements) {
      this.children = elements;
    }
  };
}

test("indexes the latest published release and resolves version codenames", async () => {
  const releaseList = createElement();
  const releaseStatus = createElement();
  const elements = new Map([
    ["release-list", releaseList],
    ["release-status", releaseStatus]
  ]);
  const releases = [
    {
      tag_name: "v2.1.4",
      name: "2.1.4",
      prerelease: false,
      published_at: "2026-10-19T00:00:00Z",
      body: "New release notes"
    },
    {
      tag_name: "v2.1.3",
      name: "2.1.3",
      prerelease: false,
      published_at: "2026-10-01T00:00:00Z",
      body: "Previous release notes"
    }
  ];
  const metadata = {
    versions: [{ version: "2.1.3", name: "Curious Kea" }]
  };
  const source = readFileSync(path.join(__dirname, "versions.js"), "utf8");

  vm.runInNewContext(source, {
    console: { error: assert.fail },
    document: {
      createElement,
      getElementById: id => elements.get(id)
    },
    marked: {
      parse: markdown => `<p>${markdown}</p>`
    },
    fetch: async url => ({
      ok: true,
      json: async () => url === "../version-metadata.json" ? metadata : releases
    })
  });

  await new Promise(resolve => setImmediate(resolve));

  assert.equal(releaseStatus.textContent, "2 published releases.");
  assert.equal(releaseList.children.length, 2);
  const [currentRelease, previousRelease] = releaseList.children.map(item => item.children[0]);
  assert.match(currentRelease.children[0].textContent, /v2\.1\.4 .* Current/);
  assert.equal(currentRelease.children[1].innerHTML, "<p>New release notes</p>");
  assert.match(previousRelease.children[0].textContent, /v2\.1\.3 — Curious Kea/);
  assert.equal(previousRelease.children[1].innerHTML, "<p>Previous release notes</p>");
});

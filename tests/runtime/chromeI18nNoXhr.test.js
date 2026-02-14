const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

test("chromeI18n shim does not probe locales via sync XHR (avoids dev 404 noise)", () => {
  const shim = read("src/adapters/chromeI18n.ts");
  assert.equal(shim.includes("XMLHttpRequest"), false);
  assert.equal(shim.includes("xhr.open"), false);
});


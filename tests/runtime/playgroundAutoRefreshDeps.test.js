const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

test("Playground auto-refresh effect depends on loadSources (avoids stale closure)", () => {
  const setup = read("src/pages/Playground/Setup.jsx");
  assert.match(
    setup,
    /useEffect\(\(\) => \{[\s\S]*setInterval\(loadSources,[\s\S]*\},\s*\[\s*view\s*,\s*loadSources\s*\]\s*\)/,
  );
});

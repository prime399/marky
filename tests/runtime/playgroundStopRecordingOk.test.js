const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

test("Playground Stop button handles IPC failure (checks { ok })", () => {
  const setup = read("src/pages/Playground/Setup.jsx");
  // Contract: stop-recording-tab invoke result must be checked so Stop cannot silently no-op.
  assert.match(
    setup,
    /handleStopRecording[\s\S]*api\.invoke\([\s\S]*stop-recording-tab[\s\S]*\)[\s\S]*\bok\b/,
  );
});


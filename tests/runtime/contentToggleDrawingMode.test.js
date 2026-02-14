const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

test("Content toggle-drawing-mode handler is registered exactly once", () => {
  const handlers = read("src/pages/Content/context/messaging/handlers.js");
  const needle = 'registerMessage("toggle-drawing-mode"';
  const matches = handlers.split(needle).length - 1;
  assert.equal(
    matches,
    1,
    "toggle-drawing-mode must not be registered inside its own handler",
  );
});

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

test("Playground source card styles avoid border shorthand/longhand collisions", () => {
  const setup = read("src/pages/Playground/Setup.jsx");
  // If cardSelected overrides borderColor, card should not use border shorthand.
  assert.equal(setup.includes("cardSelected: {"), true);
  assert.equal(setup.includes("borderColor:"), true);
  assert.equal(setup.includes('border: "2px solid transparent"'), false);
});


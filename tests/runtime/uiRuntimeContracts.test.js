const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

test("AlertDialog modals do not use invalid asChild trigger composition", () => {
  const contentModal = read("src/pages/Content/modal/Modal.jsx");
  const sandboxModal = read("src/pages/Sandbox/components/global/Modal.jsx");

  assert.equal(
    contentModal.includes("<AlertDialog.Trigger asChild />"),
    false,
    "Content modal must not use Trigger asChild without a child element",
  );
  assert.equal(
    sandboxModal.includes("<AlertDialog.Trigger asChild />"),
    false,
    "Sandbox modal must not use Trigger asChild without a child element",
  );
});

test("AlertDialog content always includes title and description nodes", () => {
  const contentModal = read("src/pages/Content/modal/Modal.jsx");
  const sandboxModal = read("src/pages/Sandbox/components/global/Modal.jsx");

  assert.equal(contentModal.includes("<AlertDialog.Title"), true);
  assert.equal(contentModal.includes("<AlertDialog.Description"), true);
  assert.equal(sandboxModal.includes("<AlertDialog.Title"), true);
  assert.equal(sandboxModal.includes("<AlertDialog.Description"), true);
});

test("Content modal does not pass non-string href props into anchor tags", () => {
  const contentModal = read("src/pages/Content/modal/Modal.jsx");
  assert.equal(
    contentModal.includes("href={learnMoreLink}"),
    false,
    "learnMoreLink callback must be called via onClick, not bound to href",
  );
});

test("Radix callback props are functions, not boolean shorthand", () => {
  const radialMenu = read("src/pages/Content/toolbar/components/RadialMenu.jsx");
  assert.equal(
    radialMenu.includes("onOpenAutoFocus>"),
    false,
    "onOpenAutoFocus must be a function callback",
  );
  assert.equal(
    radialMenu.includes("onOpenAutoFocus "),
    false,
    "onOpenAutoFocus shorthand boolean usage is invalid for Radix callbacks",
  );
});

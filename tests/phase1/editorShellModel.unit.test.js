const test = require("node:test");
const assert = require("node:assert/strict");

const {
  EDIT_TAB,
  PREVIEW_TAB,
  clampPlayhead,
  getValidTab,
  getTabFromMode,
  getModeFromTab,
  shouldSyncPlayhead,
  resolveSelection,
} = require("../../src/core/editor/editorShellModel");

test("clampPlayhead normalizes invalid and negative values", () => {
  assert.equal(clampPlayhead(Number.NaN), 0);
  assert.equal(clampPlayhead(-20), 0);
  assert.equal(clampPlayhead(8.5), 8.5);
});

test("tab and mode mapping returns stable defaults", () => {
  assert.equal(getValidTab("invalid"), EDIT_TAB);
  assert.equal(getValidTab(PREVIEW_TAB), PREVIEW_TAB);
  assert.equal(getTabFromMode("player"), PREVIEW_TAB);
  assert.equal(getTabFromMode("crop"), EDIT_TAB);
  assert.equal(getModeFromTab(PREVIEW_TAB, "crop"), "player");
  assert.equal(getModeFromTab(EDIT_TAB, "crop"), "crop");
  assert.equal(getModeFromTab(EDIT_TAB, "unknown"), "player");
});

test("playhead sync check uses epsilon guard", () => {
  assert.equal(shouldSyncPlayhead(10.001, 10.0), false);
  assert.equal(shouldSyncPlayhead(10.1, 10.0), true);
  assert.equal(shouldSyncPlayhead(Number.NaN, 1), false);
});

test("resolveSelection preserves current ids when partial updates are sent", () => {
  const current = {
    selectedSceneId: "scene-1",
    selectedTrackId: "track-1",
    selectedItemId: "item-1",
  };

  const next = resolveSelection(current, { selectedTrackId: "track-2" });
  assert.deepEqual(next, {
    selectedSceneId: "scene-1",
    selectedTrackId: "track-2",
    selectedItemId: "item-1",
  });
});

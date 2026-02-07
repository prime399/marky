const test = require("node:test");
const assert = require("node:assert/strict");

const { applyStateUpdate } = require("../../src/core/state/immerUpdate");
const {
  EDIT_TAB,
  PREVIEW_TAB,
  getNextSandboxPatch,
} = require("../../src/core/editor/editorShellModel");

test("preview tab transition keeps playhead and switches sandbox to player mode", () => {
  const sandboxState = {
    mode: "edit",
    time: 4,
    updatePlayerTime: false,
  };

  const patch = getNextSandboxPatch({
    activeTab: PREVIEW_TAB,
    currentMode: sandboxState.mode,
    currentTime: sandboxState.time,
    playhead: 9.25,
  });

  const nextState = applyStateUpdate(sandboxState, (draft) => {
    Object.assign(draft, patch);
  });

  assert.deepEqual(nextState, {
    mode: "player",
    time: 9.25,
    updatePlayerTime: true,
  });
});

test("edit tab keeps player mode while preserving stable playhead", () => {
  const sandboxState = {
    mode: "player",
    time: 12,
    updatePlayerTime: false,
  };

  const patch = getNextSandboxPatch({
    activeTab: EDIT_TAB,
    currentMode: sandboxState.mode,
    currentTime: sandboxState.time,
    playhead: 12.005,
  });

  const nextState = applyStateUpdate(sandboxState, (draft) => {
    Object.assign(draft, patch);
  });

  assert.deepEqual(nextState, {
    mode: "player",
    time: 12,
    updatePlayerTime: false,
  });
});

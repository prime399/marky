const EDIT_TAB = "edit";
const PREVIEW_TAB = "preview";
const VALID_TABS = new Set([EDIT_TAB, PREVIEW_TAB]);
const EDIT_MODES = new Set(["edit", "crop", "audio"]);
const INITIAL_SELECTION = {
  selectedSceneId: null,
  selectedTrackId: null,
  selectedItemId: null,
};

const clampPlayhead = (value) => {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value;
};

const getValidTab = (tab) => (VALID_TABS.has(tab) ? tab : EDIT_TAB);

const getTabFromMode = (mode) => {
  if (mode === "player") return PREVIEW_TAB;
  return EDIT_TAB;
};

const getModeFromTab = (tab, previousMode) => {
  if (tab === PREVIEW_TAB) return "player";
  if (EDIT_MODES.has(previousMode)) return previousMode;
  return "edit";
};

const shouldSyncPlayhead = (nextValue, currentValue, epsilon = 0.01) => {
  if (!Number.isFinite(nextValue) || !Number.isFinite(currentValue)) {
    return false;
  }
  return Math.abs(nextValue - currentValue) > epsilon;
};

const resolveSelection = (currentSelection, incomingSelection = {}) => ({
  selectedSceneId:
    incomingSelection.selectedSceneId === undefined
      ? currentSelection.selectedSceneId
      : incomingSelection.selectedSceneId,
  selectedTrackId:
    incomingSelection.selectedTrackId === undefined
      ? currentSelection.selectedTrackId
      : incomingSelection.selectedTrackId,
  selectedItemId:
    incomingSelection.selectedItemId === undefined
      ? currentSelection.selectedItemId
      : incomingSelection.selectedItemId,
});

const getNextSandboxPatch = ({
  activeTab,
  currentMode,
  currentTime,
  playhead,
}) => {
  const targetMode = getModeFromTab(activeTab, currentMode);
  const patch = {};

  if (targetMode !== currentMode) {
    patch.mode = targetMode;
  }

  if (shouldSyncPlayhead(playhead, currentTime)) {
    patch.time = playhead;
    patch.updatePlayerTime = true;
  }

  return patch;
};

module.exports = {
  EDIT_TAB,
  PREVIEW_TAB,
  INITIAL_SELECTION,
  clampPlayhead,
  getValidTab,
  getTabFromMode,
  getModeFromTab,
  shouldSyncPlayhead,
  resolveSelection,
  getNextSandboxPatch,
};

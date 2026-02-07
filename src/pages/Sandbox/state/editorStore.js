import { create } from "zustand";
import editorShellModel from "../../../core/editor/editorShellModel";

const {
  EDIT_TAB,
  PREVIEW_TAB,
  INITIAL_SELECTION,
  clampPlayhead,
  getValidTab,
  resolveSelection,
} = editorShellModel;

const useEditorStore = create((set) => ({
  activeTab: EDIT_TAB,
  playhead: 0,
  ...INITIAL_SELECTION,
  setActiveTab: (tab) => set({ activeTab: getValidTab(tab) }),
  setPlayhead: (seconds) => set({ playhead: clampPlayhead(seconds) }),
  setSelection: (selection) =>
    set((state) => resolveSelection(state, selection)),
  setSelectedSceneId: (selectedSceneId) =>
    set({
      selectedSceneId,
      selectedTrackId: null,
      selectedItemId: null,
    }),
  setSelectedTrackId: (selectedTrackId) =>
    set({
      selectedTrackId,
      selectedItemId: null,
    }),
  setSelectedItemId: (selectedItemId) => set({ selectedItemId }),
  clearSelection: () => set(INITIAL_SELECTION),
  resetEditorShell: () =>
    set({
      activeTab: EDIT_TAB,
      playhead: 0,
      ...INITIAL_SELECTION,
    }),
}));

export const useEditorShellSelector = (selector) => useEditorStore(selector);

export const editorShellActions = {
  setActiveTab: (tab) => useEditorStore.getState().setActiveTab(tab),
  setPlayhead: (seconds) => useEditorStore.getState().setPlayhead(seconds),
  setSelection: (selection) => useEditorStore.getState().setSelection(selection),
  setSelectedSceneId: (sceneId) =>
    useEditorStore.getState().setSelectedSceneId(sceneId),
  setSelectedTrackId: (trackId) =>
    useEditorStore.getState().setSelectedTrackId(trackId),
  setSelectedItemId: (itemId) =>
    useEditorStore.getState().setSelectedItemId(itemId),
  clearSelection: () => useEditorStore.getState().clearSelection(),
  resetEditorShell: () => useEditorStore.getState().resetEditorShell(),
};

export const editorShellTestUtils = {
  ...editorShellModel,
};

export default useEditorStore;

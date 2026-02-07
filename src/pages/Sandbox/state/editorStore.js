import { create } from "zustand";
import editorShellModel from "../../../core/editor/editorShellModel";
import timelineModel from "../../../core/editor/timelineModel";

const {
  EDIT_TAB,
  PREVIEW_TAB,
  INITIAL_SELECTION,
  clampPlayhead,
  getValidTab,
  resolveSelection,
} = editorShellModel;

const { reduceTimelineState } = timelineModel;

const useEditorStore = create((set) => ({
  activeTab: EDIT_TAB,
  playhead: 0,
  scenes: [],
  sceneRanges: [],
  timelineDuration: 0,
  ...INITIAL_SELECTION,
  setActiveTab: (tab) =>
    set((state) => {
      const nextTab = getValidTab(tab);
      if (state.activeTab === nextTab) return state;
      return { activeTab: nextTab };
    }),
  setPlayhead: (seconds) =>
    set((state) => {
      const baselinePlayhead = clampPlayhead(seconds);
      const nextState = reduceTimelineState(state, {
        type: "SET_PLAYHEAD",
        playhead: baselinePlayhead,
      });
      if (state.playhead === nextState.playhead) return state;
      return nextState;
    }),
  scrubPlayhead: (delta) =>
    set((state) => reduceTimelineState(state, { type: "SCRUB_PLAYHEAD", delta })),
  setScenes: (scenes) =>
    set((state) => reduceTimelineState(state, { type: "SET_SCENES", scenes })),
  addScene: (scene, index) =>
    set((state) =>
      reduceTimelineState(state, {
        type: "ADD_SCENE",
        scene,
        index,
      }),
    ),
  removeScene: (sceneId) =>
    set((state) => reduceTimelineState(state, { type: "REMOVE_SCENE", sceneId })),
  duplicateScene: (sceneId) =>
    set((state) =>
      reduceTimelineState(state, {
        type: "DUPLICATE_SCENE",
        sceneId,
      }),
    ),
  reorderScenes: (fromIndex, toIndex) =>
    set((state) =>
      reduceTimelineState(state, {
        type: "REORDER_SCENES",
        fromIndex,
        toIndex,
      }),
    ),
  trimSceneStart: (sceneId, trimStart) =>
    set((state) =>
      reduceTimelineState(state, {
        type: "TRIM_SCENE_START",
        sceneId,
        trimStart,
      }),
    ),
  trimSceneEnd: (sceneId, trimEnd) =>
    set((state) =>
      reduceTimelineState(state, {
        type: "TRIM_SCENE_END",
        sceneId,
        trimEnd,
      }),
    ),
  setSelection: (selection) =>
    set((state) => resolveSelection(state, selection)),
  setSelectedSceneId: (selectedSceneId) =>
    set((state) =>
      reduceTimelineState(
        {
          ...state,
          selectedTrackId: null,
          selectedItemId: null,
        },
        {
          type: "SELECT_SCENE",
          sceneId: selectedSceneId,
        },
      ),
    ),
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
      scenes: [],
      sceneRanges: [],
      timelineDuration: 0,
      ...INITIAL_SELECTION,
    }),
}));

export const useEditorShellSelector = (selector) => useEditorStore(selector);

export const editorShellActions = {
  setActiveTab: (tab) => useEditorStore.getState().setActiveTab(tab),
  setPlayhead: (seconds) => useEditorStore.getState().setPlayhead(seconds),
  scrubPlayhead: (delta) => useEditorStore.getState().scrubPlayhead(delta),
  setScenes: (scenes) => useEditorStore.getState().setScenes(scenes),
  addScene: (scene, index) => useEditorStore.getState().addScene(scene, index),
  removeScene: (sceneId) => useEditorStore.getState().removeScene(sceneId),
  duplicateScene: (sceneId) => useEditorStore.getState().duplicateScene(sceneId),
  reorderScenes: (fromIndex, toIndex) =>
    useEditorStore.getState().reorderScenes(fromIndex, toIndex),
  trimSceneStart: (sceneId, trimStart) =>
    useEditorStore.getState().trimSceneStart(sceneId, trimStart),
  trimSceneEnd: (sceneId, trimEnd) =>
    useEditorStore.getState().trimSceneEnd(sceneId, trimEnd),
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
  ...timelineModel,
};

export default useEditorStore;

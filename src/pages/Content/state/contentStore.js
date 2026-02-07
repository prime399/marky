import { create } from "zustand";
import { applyStateUpdate } from "../../../core/state/immerUpdate";

const useContentStore = create((set) => ({
  state: {},
  updater: null,
  setSnapshot: (nextState) => set({ state: nextState || {} }),
  registerUpdater: (updater) => set({ updater }),
  updateState: (updaterOrState) =>
    set((store) => {
      if (typeof store.updater === "function") {
        store.updater(updaterOrState);
        return {};
      }
      return {
        state: applyStateUpdate(store.state || {}, updaterOrState),
      };
    }),
}));

export const setContentStateSnapshot = (nextState) =>
  useContentStore.getState().setSnapshot(nextState);

export const useContentStateSelector = (selector) =>
  useContentStore((store) => selector(store.state || {}));
export const registerContentStateUpdater = (updater) =>
  useContentStore.getState().registerUpdater(updater);
export const updateContentState = (updaterOrState) =>
  useContentStore.getState().updateState(updaterOrState);

export default useContentStore;

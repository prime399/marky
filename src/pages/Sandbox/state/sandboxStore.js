import { create } from "zustand";
import { applyStateUpdate } from "../../../core/state/immerUpdate";

const useSandboxStore = create((set) => ({
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

export const setSandboxStateSnapshot = (nextState) =>
  useSandboxStore.getState().setSnapshot(nextState);

export const useSandboxStateSelector = (selector) =>
  useSandboxStore((store) => selector(store.state || {}));
export const registerSandboxStateUpdater = (updater) =>
  useSandboxStore.getState().registerUpdater(updater);
export const updateSandboxState = (updaterOrState) =>
  useSandboxStore.getState().updateState(updaterOrState);

export default useSandboxStore;

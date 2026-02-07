import { create } from "zustand";

const useContentStore = create((set) => ({
  state: {},
  setSnapshot: (nextState) => set({ state: nextState || {} }),
}));

export const setContentStateSnapshot = (nextState) =>
  useContentStore.getState().setSnapshot(nextState);

export const useContentStateSelector = (selector) =>
  useContentStore((store) => selector(store.state || {}));

export default useContentStore;

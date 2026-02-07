import { create } from "zustand";

const useSandboxStore = create((set) => ({
  state: {},
  setSnapshot: (nextState) => set({ state: nextState || {} }),
}));

export const setSandboxStateSnapshot = (nextState) =>
  useSandboxStore.getState().setSnapshot(nextState);

export const useSandboxStateSelector = (selector) =>
  useSandboxStore((store) => selector(store.state || {}));

export default useSandboxStore;

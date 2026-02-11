import Store from "electron-store";
import { BrowserWindow } from "electron";

const store = new Store({
  name: "screenity-storage",
  defaults: {},
});

/**
 * Wrapper matching chrome.storage.local API shape.
 * Notifies all renderer windows on changes via "storage:changed" IPC.
 */
export const electronStore = {
  get(keys?: string | string[] | Record<string, any>): Record<string, any> {
    if (keys === undefined || keys === null) {
      return store.store;
    }
    if (typeof keys === "string") {
      const val = store.get(keys);
      return val !== undefined ? { [keys]: val } : {};
    }
    if (Array.isArray(keys)) {
      const result: Record<string, any> = {};
      for (const key of keys) {
        const val = store.get(key);
        if (val !== undefined) result[key] = val;
      }
      return result;
    }
    // Object with defaults
    const result: Record<string, any> = {};
    for (const [key, defaultVal] of Object.entries(keys)) {
      const val = store.get(key);
      result[key] = val !== undefined ? val : defaultVal;
    }
    return result;
  },

  set(items: Record<string, any>): void {
    const changes: Record<string, { oldValue?: any; newValue: any }> = {};
    for (const [key, newValue] of Object.entries(items)) {
      const oldValue = store.get(key);
      store.set(key, newValue);
      changes[key] = { oldValue, newValue };
    }
    // Broadcast changes to all renderer windows
    broadcastStorageChange(changes);
  },

  remove(keys: string | string[]): void {
    const keyList = typeof keys === "string" ? [keys] : keys;
    const changes: Record<string, { oldValue?: any }> = {};
    for (const key of keyList) {
      changes[key] = { oldValue: store.get(key) };
      store.delete(key);
    }
    broadcastStorageChange(changes);
  },

  clear(): void {
    store.clear();
    broadcastStorageChange({});
  },
};

function broadcastStorageChange(changes: Record<string, any>) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("storage:changed", changes);
    }
  }
}

export default electronStore;

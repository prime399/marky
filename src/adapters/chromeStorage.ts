/**
 * chrome.storage.local shim → IPC → electron-store
 */

const api = (window as any).electronAPI;

const changeListeners: Array<(changes: Record<string, any>) => void> = [];

// Listen for storage changes broadcast from main process
if (api) {
  api.on("storage:changed", (changes: Record<string, any>) => {
    for (const listener of changeListeners) {
      listener(changes);
    }
  });
}

export const chromeStorage = {
  local: {
    get(
      keys?: string | string[] | Record<string, any> | null,
      callback?: (result: Record<string, any>) => void
    ): Promise<Record<string, any>> {
      const promise = api.invoke("storage:get", keys);
      if (callback) {
        promise.then(callback);
      }
      return promise;
    },

    set(
      items: Record<string, any>,
      callback?: () => void
    ): Promise<void> {
      const promise = api.invoke("storage:set", items);
      if (callback) {
        promise.then(callback);
      }
      return promise;
    },

    remove(
      keys: string | string[],
      callback?: () => void
    ): Promise<void> {
      const promise = api.invoke("storage:remove", keys);
      if (callback) {
        promise.then(callback);
      }
      return promise;
    },

    clear(callback?: () => void): Promise<void> {
      const promise = api.invoke("storage:clear");
      if (callback) {
        promise.then(callback);
      }
      return promise;
    },
  },

  onChanged: {
    addListener(callback: (changes: Record<string, any>) => void): void {
      changeListeners.push(callback);
    },
    removeListener(callback: (changes: Record<string, any>) => void): void {
      const idx = changeListeners.indexOf(callback);
      if (idx !== -1) changeListeners.splice(idx, 1);
    },
  },

  // Stub for managed storage (enterprise policies) — returns empty
  managed: {
    get(
      _keys?: any,
      callback?: (result: Record<string, any>) => void
    ): Promise<Record<string, any>> {
      const result = {};
      if (callback) callback(result);
      return Promise.resolve(result);
    },
  },
};

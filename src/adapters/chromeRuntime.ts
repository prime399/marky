/**
 * chrome.runtime shim → ipcRenderer.invoke("message", ...)
 */

const api = (window as any).electronAPI;

type MessageCallback = (message: any, sender: any, sendResponse: (r: any) => void) => void;
const messageListeners: MessageCallback[] = [];

// Listen for messages sent from main process to this renderer
if (api) {
  api.on("message", (message: any) => {
    for (const listener of messageListeners) {
      listener(message, { id: "electron-main" }, () => {});
    }
  });
}

export const chromeRuntime = {
  sendMessage(
    message: any,
    callback?: (response: any) => void
  ): Promise<any> | void {
    const promise = api.invoke("message", message);
    if (callback) {
      promise.then(callback).catch((err: Error) => {
        chromeRuntime.lastError = { message: err.message };
        callback(undefined);
        chromeRuntime.lastError = null;
      });
      return;
    }
    return promise;
  },

  onMessage: {
    addListener(callback: MessageCallback): void {
      messageListeners.push(callback);
    },
    removeListener(callback: MessageCallback): void {
      const idx = messageListeners.indexOf(callback);
      if (idx !== -1) messageListeners.splice(idx, 1);
    },
  },

  lastError: null as { message: string } | null,

  getURL(path: string): string {
    // In Electron, resolve relative to the renderer directory
    if (path.startsWith("/")) path = path.slice(1);
    return `./${path}`;
  },

  getManifest(): Record<string, any> {
    return {
      version: "4.0.0",
      name: "Screenity",
    };
  },

  // No-op stubs for extension-only APIs
  setUninstallURL(_url: string): void {},
  getContexts(): Promise<any[]> { return Promise.resolve([]); },

  id: "electron-app",
};

/**
 * Chrome API polyfill for Electron.
 * Injects window.chrome with shims that route to Electron IPC.
 * Must be loaded before any app code that references chrome.* APIs.
 */
import { chromeStorage } from "./chromeStorage";
import { chromeRuntime } from "./chromeRuntime";
import { chromeI18n } from "./chromeI18n";
import { chromeDownloads } from "./chromeDownloads";

const api = (window as any).electronAPI;

const chromeShim: any = {
  storage: chromeStorage,
  runtime: chromeRuntime,
  i18n: chromeI18n,
  downloads: chromeDownloads,

  // Stubs for APIs that don't apply in Electron
  action: {
    onClicked: { addListener() {}, removeListener() {} },
    setIcon() {},
    setBadgeText() {},
    setBadgeBackgroundColor() {},
  },
  commands: {
    onCommand: { addListener() {}, removeListener() {} },
  },
  tabs: {
    query: () => Promise.resolve([]),
    get: () => Promise.resolve(null),
    create: () => Promise.resolve(null),
    update: () => Promise.resolve(null),
    remove: () => Promise.resolve(),
    sendMessage: (tabId: number, message: any, callback?: Function) => {
      // In Electron, route through main process to target window
      if (api) {
        const promise = api.invoke("message", { ...message, _targetWindow: tabId });
        if (callback) promise.then(callback);
      }
    },
    onUpdated: { addListener() {}, removeListener() {} },
    onRemoved: { addListener() {}, removeListener() {} },
    onActivated: { addListener() {}, removeListener() {} },
  },
  windows: {
    get: () => Promise.resolve(null),
    getCurrent: () => Promise.resolve({ id: 1 }),
    onFocusChanged: { addListener() {}, removeListener() {} },
  },
  permissions: {
    contains: (_perms: any, callback?: (result: boolean) => void) => {
      // Electron doesn't need runtime permission grants for most APIs
      if (callback) callback(true);
      return Promise.resolve(true);
    },
    request: (_perms: any, callback?: (granted: boolean) => void) => {
      if (callback) callback(true);
      return Promise.resolve(true);
    },
  },
  offscreen: {
    createDocument: () => Promise.resolve(),
    closeDocument: () => Promise.resolve(),
  },
  scripting: {
    executeScript: () => Promise.resolve([]),
  },
  system: {
    display: {
      getInfo: (callback?: (displays: any[]) => void) => {
        // Could be enhanced to use Electron's screen.getAllDisplays()
        const displays = [{ id: "0", bounds: { left: 0, top: 0, width: 1920, height: 1080 } }];
        if (callback) callback(displays);
        return Promise.resolve(displays);
      },
    },
  },
  alarms: {
    create() {},
    clear() {},
    onAlarm: { addListener() {}, removeListener() {} },
  },
  desktopCapture: {
    chooseDesktopMedia: (_sources: string[], callback: (streamId: string) => void) => {
      // In Electron, this is handled via desktopCapturer + SourcePicker window
      if (api) {
        api.invoke("capture:getSources").then((sources: any[]) => {
          if (sources.length > 0) {
            callback(sources[0].id);
          }
        });
      }
      return 1; // requestId
    },
    cancelChooseDesktopMedia() {},
  },
  tabCapture: {
    getMediaStreamId: () => Promise.resolve(""),
  },
  identity: {
    getAuthToken: () => Promise.resolve(""),
    launchWebAuthFlow: () => Promise.resolve(""),
  },
};

// Install the polyfill — our shim takes priority over Electron's partial chrome object
if (typeof window !== "undefined") {
  const existing = (window as any).chrome || {};
  // Our shim overrides Electron's broken/partial chrome APIs
  (window as any).chrome = { ...existing, ...chromeShim };
}

export default chromeShim;

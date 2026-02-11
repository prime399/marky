import { BrowserWindow, shell } from "electron";
import * as path from "path";
import { windowManager } from "./windowManager";

const isDev = process.env.NODE_ENV === "development";

function resolveRenderer(htmlFile: string): string {
  if (isDev) {
    return `http://localhost:3000/${htmlFile}`;
  }
  return path.join(__dirname, "..", "renderer", htmlFile);
}

export async function createRecorderWindow(sourceId?: string): Promise<BrowserWindow> {
  const existing = windowManager.get("recorder");
  if (existing) return existing;

  const preloadPath = path.join(__dirname, "..", "preload.js");

  const win = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  windowManager.register("recorder", win);

  const url = resolveRenderer("recorder.html");
  if (isDev) {
    await win.loadURL(url);
  } else {
    await win.loadFile(url);
  }

  // Pass sourceId to the recorder once loaded
  if (sourceId) {
    win.webContents.send("message", {
      type: "set-source-id",
      sourceId,
    });
  }

  return win;
}

export async function createCameraWindow(): Promise<BrowserWindow> {
  const existing = windowManager.get("camera");
  if (existing) {
    existing.show();
    return existing;
  }

  const preloadPath = path.join(__dirname, "..", "preload.js");

  const win = new BrowserWindow({
    width: 200,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  windowManager.register("camera", win);

  const url = resolveRenderer("camera.html");
  if (isDev) {
    await win.loadURL(url);
  } else {
    await win.loadFile(url);
  }

  win.show();
  return win;
}

export async function createEditorWindow(editorType: "sandbox" | "editor" | "editorwebcodecs" = "sandbox"): Promise<BrowserWindow> {
  const existing = windowManager.get("editor");
  if (existing) {
    existing.focus();
    return existing;
  }

  const preloadPath = path.join(__dirname, "..", "preload.js");

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Screenity - Editor",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  windowManager.register("editor", win);

  const url = resolveRenderer(`${editorType}.html`);
  if (isDev) {
    await win.loadURL(url);
  } else {
    await win.loadFile(url);
  }

  win.once("ready-to-show", () => win.show());

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  return win;
}

export async function createSourcePickerWindow(): Promise<BrowserWindow> {
  const existing = windowManager.get("sourcePicker");
  if (existing) {
    existing.focus();
    return existing;
  }

  const preloadPath = path.join(__dirname, "..", "preload.js");

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: "Choose what to share",
    modal: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  windowManager.register("sourcePicker", win);

  const url = resolveRenderer("sourcepicker.html");
  if (isDev) {
    await win.loadURL(url);
  } else {
    await win.loadFile(url);
  }

  win.once("ready-to-show", () => win.show());

  return win;
}

/**
 * Open a URL in the user's default browser (replaces chrome.tabs.create for external links).
 */
export function openExternalURL(url: string): void {
  shell.openExternal(url);
}

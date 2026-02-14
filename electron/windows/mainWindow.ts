import { BrowserWindow } from "electron";
import * as path from "path";
import { windowManager } from "./windowManager";

const isDev = process.env.NODE_ENV === "development";

function resolveRenderer(htmlFile: string): string {
  if (isDev) {
    return `http://localhost:3000/${htmlFile}`;
  }
  return path.join(__dirname, "..", "renderer", htmlFile);
}

export async function createMainWindow(): Promise<BrowserWindow> {
  const existing = windowManager.get("main");
  if (existing) {
    existing.focus();
    return existing;
  }

  const startPage = "playground.html";

  const preloadPath = path.join(__dirname, "preload.js");

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 360,
    minHeight: 400,
    title: "Screenity",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  windowManager.register("main", win);

  const url = resolveRenderer(startPage);
  if (isDev) {
    await win.loadURL(url);
  } else {
    await win.loadFile(url);
  }

  win.once("ready-to-show", () => {
    win.show();
  });

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  return win;
}

/**
 * Navigate the main window to a different page (e.g. playground.html, sandbox.html).
 */
export function navigateMainWindow(htmlFile: string): void {
  const win = windowManager.get("main");
  if (!win || win.isDestroyed()) return;

  const url = resolveRenderer(htmlFile);
  if (isDev) {
    win.loadURL(url);
  } else {
    win.loadFile(url);
  }
}

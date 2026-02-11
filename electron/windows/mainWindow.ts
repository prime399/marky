import { BrowserWindow } from "electron";
import * as path from "path";
import { windowManager } from "./windowManager";

const isDev = process.env.NODE_ENV === "development";

export async function createMainWindow(): Promise<BrowserWindow> {
  const existing = windowManager.get("main");
  if (existing) {
    existing.focus();
    return existing;
  }

  const preloadPath = path.join(__dirname, "..", "preload.js");

  const win = new BrowserWindow({
    width: 420,
    height: 620,
    minWidth: 360,
    minHeight: 500,
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

  if (isDev) {
    win.loadURL("http://localhost:3000/setup.html");
  } else {
    win.loadFile(path.join(__dirname, "..", "renderer", "setup.html"));
  }

  win.once("ready-to-show", () => {
    win.show();
  });

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  return win;
}

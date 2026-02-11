import { globalShortcut, BrowserWindow } from "electron";
import { windowManager } from "../windows/windowManager";

export function registerShortcuts(): void {
  // Alt+Shift+G — Start recording
  globalShortcut.register("Alt+Shift+G", () => {
    sendToMain({ type: "start-recording" });
  });

  // Alt+Shift+X — Cancel recording
  globalShortcut.register("Alt+Shift+X", () => {
    sendToMain({ type: "cancel-recording" });
  });

  // Alt+Shift+M — Pause/resume recording
  globalShortcut.register("Alt+Shift+M", () => {
    sendToMain({ type: "toggle-pause-recording" });
  });
}

function sendToMain(message: any): void {
  const mainWin = windowManager.get("main");
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.webContents.send("message", message);
  }
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}

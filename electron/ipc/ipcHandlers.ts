import { ipcMain, desktopCapturer, dialog, app } from "electron";
import { IPC } from "./channels";
import electronStore from "../storage/electronStore";
import * as fs from "fs";
import * as path from "path";

export function initializeIpcHandlers(): void {
  // --- Storage handlers ---
  ipcMain.handle(IPC.STORAGE_GET, (_event, keys) => {
    return electronStore.get(keys);
  });

  ipcMain.handle(IPC.STORAGE_SET, (_event, items) => {
    electronStore.set(items);
    return true;
  });

  ipcMain.handle(IPC.STORAGE_REMOVE, (_event, keys) => {
    electronStore.remove(keys);
    return true;
  });

  ipcMain.handle(IPC.STORAGE_CLEAR, () => {
    electronStore.clear();
    return true;
  });

  // --- Generic message dispatch (replaces chrome.runtime.sendMessage) ---
  ipcMain.handle(IPC.MESSAGE, async (_event, message) => {
    return handleMessage(message);
  });

  // --- Desktop capture ---
  ipcMain.handle(IPC.GET_SOURCES, async (_event, opts) => {
    const sources = await desktopCapturer.getSources({
      types: opts?.types || ["screen", "window"],
      thumbnailSize: opts?.thumbnailSize || { width: 320, height: 180 },
    });
    return sources.map((s) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail.toDataURL(),
      display_id: s.display_id,
      appIcon: s.appIcon ? s.appIcon.toDataURL() : null,
    }));
  });

  // --- File save dialog ---
  ipcMain.handle(IPC.SHOW_SAVE_DIALOG, async (_event, opts) => {
    const result = await dialog.showSaveDialog(opts || {});
    return result;
  });

  // --- Download / write file ---
  ipcMain.handle(IPC.DOWNLOAD_FILE, async (_event, { filePath, data, encoding }) => {
    const buffer = encoding === "base64"
      ? Buffer.from(data, "base64")
      : Buffer.from(data);
    fs.writeFileSync(filePath, buffer);
    return { success: true, filePath };
  });

  // --- App info ---
  ipcMain.handle(IPC.GET_LOCALE, () => app.getLocale());
  ipcMain.handle(IPC.GET_VERSION, () => app.getVersion());
  ipcMain.handle(IPC.GET_PLATFORM, () => ({
    os: process.platform,
    arch: process.arch,
  }));
}

/**
 * Central message handler — mirrors the Background service worker's messageRouter.
 * Routes messages by `type` to the appropriate handler.
 */
async function handleMessage(message: { type: string; [key: string]: any }): Promise<any> {
  const { type, ...payload } = message;

  switch (type) {
    case "get-platform-info":
      return { os: process.platform, arch: process.arch };

    case "available-memory":
      return { memory: process.getSystemMemoryInfo?.() || {} };

    case "check-auth-status":
      return electronStore.get("authStatus") || { authenticated: false };

    default:
      // For unhandled messages, return a no-op response.
      // Handlers will be added incrementally as features are ported.
      console.warn(`[ipc] Unhandled message type: ${type}`);
      return { error: `Unhandled message type: ${type}` };
  }
}

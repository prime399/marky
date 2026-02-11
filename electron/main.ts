import { app, BrowserWindow, ipcMain, session } from "electron";
import * as path from "path";
import { initializeIpcHandlers } from "./ipc/ipcHandlers";
import { createMainWindow } from "./windows/mainWindow";
import { windowManager } from "./windows/windowManager";
import { initTray } from "./platform/tray";
import { registerShortcuts } from "./platform/shortcuts";
import { buildMenu } from "./platform/menu";

const isDev = process.env.NODE_ENV === "development";

app.whenReady().then(async () => {
  // Register IPC handlers before creating any windows
  initializeIpcHandlers();

  // Build native menu
  buildMenu();

  // Create the main window (loads setup.html on first run, or main UI)
  const mainWin = await createMainWindow();

  // System tray
  initTray(mainWin);

  // Global shortcuts
  registerShortcuts();

  app.on("activate", () => {
    // macOS: re-create window when dock icon clicked and no windows open
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  windowManager.closeAll();
});

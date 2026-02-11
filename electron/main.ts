import { app, BrowserWindow } from "electron";
import { initializeIpcHandlers } from "./ipc/ipcHandlers";
import { createMainWindow } from "./windows/mainWindow";
import { windowManager } from "./windows/windowManager";
import { initTray } from "./platform/tray";
import { registerShortcuts, unregisterShortcuts } from "./platform/shortcuts";
import { buildMenu } from "./platform/menu";
import { fileService } from "./services/fileService";

app.whenReady().then(async () => {
  // Register IPC handlers before creating any windows
  initializeIpcHandlers();

  // Build native menu
  buildMenu();

  // Clean up old recording backups on startup
  fileService.cleanBackups();

  // Create the main window
  const mainWin = await createMainWindow();

  // System tray
  initTray(mainWin);

  // Global shortcuts
  registerShortcuts();

  app.on("activate", () => {
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
  unregisterShortcuts();
  windowManager.closeAll();
});

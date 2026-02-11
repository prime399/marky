import { autoUpdater } from "electron";
import { app, dialog } from "electron";

/**
 * Auto-update service using Electron's built-in autoUpdater.
 * For production builds distributed via GitHub Releases or similar.
 */
export function initAutoUpdater(): void {
  if (process.env.NODE_ENV === "development") return;

  autoUpdater.on("update-available", () => {
    dialog.showMessageBox({
      type: "info",
      title: "Update Available",
      message: "A new version of Screenity is available. It will be downloaded in the background.",
      buttons: ["OK"],
    });
  });

  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox({
        type: "info",
        title: "Update Ready",
        message: "A new version has been downloaded. Restart to apply the update?",
        buttons: ["Restart", "Later"],
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on("error", (err) => {
    console.error("Auto-update error:", err);
  });
}

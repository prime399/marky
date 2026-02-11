import { Tray, Menu, nativeImage, BrowserWindow } from "electron";
import * as path from "path";

let tray: Tray | null = null;

export function initTray(mainWindow: BrowserWindow): void {
  const iconPath = path.join(__dirname, "..", "..", "src", "assets", "favicon.png");
  let icon: Electron.NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip("Screenity");

  updateTrayMenu(mainWindow, "idle");

  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.focus();
    } else {
      mainWindow.show();
    }
  });
}

export function updateTrayMenu(
  mainWindow: BrowserWindow,
  state: "idle" | "recording" | "paused"
): void {
  if (!tray) return;

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Show Screenity",
      click: () => mainWindow.show(),
    },
    { type: "separator" },
  ];

  if (state === "idle") {
    template.push({
      label: "Start Recording",
      click: () => mainWindow.webContents.send("message", { type: "start-recording" }),
    });
  } else if (state === "recording") {
    template.push(
      {
        label: "Pause Recording",
        click: () => mainWindow.webContents.send("message", { type: "pause-recording-tab" }),
      },
      {
        label: "Stop Recording",
        click: () => mainWindow.webContents.send("message", { type: "stop-recording-tab" }),
      },
      {
        label: "Cancel Recording",
        click: () => mainWindow.webContents.send("message", { type: "cancel-recording" }),
      }
    );
  } else if (state === "paused") {
    template.push(
      {
        label: "Resume Recording",
        click: () => mainWindow.webContents.send("message", { type: "resume-recording-tab" }),
      },
      {
        label: "Stop Recording",
        click: () => mainWindow.webContents.send("message", { type: "stop-recording-tab" }),
      }
    );
  }

  template.push({ type: "separator" }, { label: "Quit", role: "quit" });

  tray.setContextMenu(Menu.buildFromTemplate(template));
}

export function getTray(): Tray | null {
  return tray;
}

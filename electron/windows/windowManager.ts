import { BrowserWindow } from "electron";
import * as path from "path";

interface ManagedWindow {
  name: string;
  window: BrowserWindow;
}

class WindowManager {
  private windows: Map<string, ManagedWindow> = new Map();

  register(name: string, window: BrowserWindow): void {
    this.windows.set(name, { name, window });
    window.on("closed", () => {
      this.windows.delete(name);
    });
  }

  get(name: string): BrowserWindow | undefined {
    return this.windows.get(name)?.window;
  }

  has(name: string): boolean {
    return this.windows.has(name);
  }

  sendTo(name: string, channel: string, ...args: any[]): boolean {
    const win = this.get(name);
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, ...args);
      return true;
    }
    return false;
  }

  close(name: string): void {
    const win = this.get(name);
    if (win && !win.isDestroyed()) {
      win.close();
    }
  }

  closeAll(): void {
    for (const [, { window }] of this.windows) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }
    this.windows.clear();
  }

  getAll(): Map<string, ManagedWindow> {
    return this.windows;
  }

  /**
   * Resolve the path to a renderer HTML file.
   * In dev mode, loads from webpack-dev-server; in prod, from the build dir.
   */
  static resolveRenderer(htmlFile: string): string {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      return `http://localhost:3000/${htmlFile}`;
    }
    return path.join(__dirname, "..", "renderer", htmlFile);
  }
}

export const windowManager = new WindowManager();

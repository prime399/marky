import { dialog } from "electron";
import * as fs from "fs";
import * as path from "path";
import { windowManager } from "../windows/windowManager";

/**
 * Native file save service — replaces chrome.downloads and the Download/Backup pages.
 */
export const fileService = {
  /**
   * Save a buffer to disk via native save dialog.
   */
  async saveFile(options: {
    data: Buffer | string;
    defaultPath?: string;
    filters?: Electron.FileFilter[];
    encoding?: BufferEncoding;
  }): Promise<{ success: boolean; filePath?: string; canceled?: boolean }> {
    const result = await dialog.showSaveDialog({
      defaultPath: options.defaultPath || "recording",
      filters: options.filters || [
        { name: "WebM Video", extensions: ["webm"] },
        { name: "MP4 Video", extensions: ["mp4"] },
        { name: "GIF Image", extensions: ["gif"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    const buffer =
      typeof options.data === "string"
        ? Buffer.from(options.data, options.encoding || "base64")
        : options.data;

    fs.writeFileSync(result.filePath, buffer);
    return { success: true, filePath: result.filePath };
  },

  /**
   * Save a file directly to a specific path (for auto-backup during recording).
   */
  saveToPath(filePath: string, data: Buffer | string, encoding?: BufferEncoding): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const buffer =
      typeof data === "string"
        ? Buffer.from(data, encoding || "base64")
        : data;

    fs.writeFileSync(filePath, buffer);
  },

  /**
   * Get the default backup directory for live recording backup.
   */
  getBackupDir(): string {
    const userDataPath = require("electron").app.getPath("userData");
    const backupDir = path.join(userDataPath, "recording-backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
  },

  /**
   * Clean up old backup files.
   */
  cleanBackups(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const backupDir = this.getBackupDir();
    if (!fs.existsSync(backupDir)) return;

    const now = Date.now();
    const files = fs.readdirSync(backupDir);

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
      }
    }
  },

  /**
   * Create a write stream for live backup during recording.
   */
  createBackupStream(filename: string): fs.WriteStream {
    const backupDir = this.getBackupDir();
    const filePath = path.join(backupDir, filename);
    return fs.createWriteStream(filePath);
  },
};

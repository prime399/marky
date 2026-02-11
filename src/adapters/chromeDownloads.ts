/**
 * chrome.downloads shim → IPC → native save dialog + fs.writeFile
 */

const api = (window as any).electronAPI;

export const chromeDownloads = {
  async download(
    options: { url?: string; filename?: string; blob?: Blob },
    callback?: (downloadId: number) => void
  ): Promise<void> {
    let data: string;
    let defaultPath = options.filename || "recording";

    if (options.blob) {
      // Convert blob to base64 for IPC transfer
      const buffer = await options.blob.arrayBuffer();
      data = btoa(
        new Uint8Array(buffer).reduce(
          (acc, byte) => acc + String.fromCharCode(byte),
          ""
        )
      );
    } else if (options.url && options.url.startsWith("blob:")) {
      const resp = await fetch(options.url);
      const blob = await resp.blob();
      const buffer = await blob.arrayBuffer();
      data = btoa(
        new Uint8Array(buffer).reduce(
          (acc, byte) => acc + String.fromCharCode(byte),
          ""
        )
      );
    } else if (options.url && options.url.startsWith("data:")) {
      data = options.url.split(",")[1];
    } else {
      console.warn("[chromeDownloads] Unsupported download source");
      return;
    }

    // Show native save dialog
    const result = await api.invoke("dialog:save", {
      defaultPath,
      filters: inferFilters(defaultPath),
    });

    if (result.canceled || !result.filePath) return;

    await api.invoke("download:file", {
      filePath: result.filePath,
      data,
      encoding: "base64",
    });

    if (callback) callback(1);
  },
};

function inferFilters(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "webm":
      return [{ name: "WebM Video", extensions: ["webm"] }];
    case "mp4":
      return [{ name: "MP4 Video", extensions: ["mp4"] }];
    case "gif":
      return [{ name: "GIF Image", extensions: ["gif"] }];
    default:
      return [{ name: "All Files", extensions: ["*"] }];
  }
}

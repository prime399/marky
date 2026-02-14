import { ipcMain, desktopCapturer, dialog, app, shell, screen } from "electron";
import { IPC } from "./channels";
import electronStore from "../storage/electronStore";
import { windowManager } from "../windows/windowManager";
import {
  createRecorderWindow,
  createCameraWindow,
  createEditorWindow,
  createSourcePickerWindow,
  openExternalURL,
} from "../windows/appWindows";
import { navigateMainWindow } from "../windows/mainWindow";
import * as fs from "fs";

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
  ipcMain.handle(IPC.MESSAGE, async (event, message) => {
    return handleMessage(message, event);
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
    return await dialog.showSaveDialog(opts || {});
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

  // --- Window management ---
  ipcMain.handle(IPC.WINDOW_OPEN, async (_event, { name, options }) => {
    switch (name) {
      case "recorder":
        await createRecorderWindow(options?.sourceId);
        return true;
      case "camera":
        await createCameraWindow();
        return true;
      case "editor":
        await createEditorWindow(options?.editorType);
        return true;
      case "sourcePicker":
        await createSourcePickerWindow();
        return true;
      default:
        return false;
    }
  });

  ipcMain.handle(IPC.WINDOW_CLOSE, (_event, name) => {
    windowManager.close(name);
    return true;
  });

  ipcMain.handle(IPC.WINDOW_SEND, (_event, { name, channel, args }) => {
    return windowManager.sendTo(name, channel, ...args);
  });
}

/**
 * Central message handler — mirrors the Background service worker's messageRouter.
 * Routes messages by `type` to the appropriate handler.
 */
async function handleMessage(
  message: { type: string; [key: string]: any },
  event: Electron.IpcMainInvokeEvent
): Promise<any> {
  const { type, ...payload } = message;
  if (["video-ready", "stop-recording-tab", "recording-complete", "navigate-to-editor"].includes(type)) {
    console.log(`[ipc] handleMessage type="${type}"`);
  }

  switch (type) {
    // --- Platform info ---
    case "get-platform-info":
      return { os: process.platform, arch: process.arch };

    case "available-memory":
      return { memory: process.getSystemMemoryInfo?.() || {} };

    case "is-pinned":
      return true; // Always "pinned" in desktop app

    // --- Auth (stub — cloud features not ported yet) ---
    case "check-auth-status":
      return electronStore.get("authStatus") || { authenticated: false };

    case "handle-login":
    case "handle-logout":
    case "refresh-auth":
      return { success: false, message: "Cloud features not available in desktop app" };

    // --- Recording lifecycle ---
    case "desktop-capture":
      return await handleDesktopCapture();

    case "start-recording":
      return await handleStartRecording(payload);

    case "stop-recording-tab":
      return handleForwardToRecorder(message);

    case "pause-recording-tab":
    case "resume-recording-tab":
      return handleForwardToRecorder(message);

    case "cancel-recording":
      return handleCancelRecording();

    case "restart-recording-tab":
      return handleForwardToRecorder(message);

    case "new-chunk":
      return handleForwardToRecorder(message);

    case "recording-complete":
      return await handleRecordingComplete(payload);

    case "recording-error":
      console.error("[recording-error]", payload);
      return { ok: true };

    case "source-selected":
      return await handleSourceSelected(payload);

    case "source-cancelled":
      // Source picker is inline — no separate window to close
      return { ok: true };

    case "check-recording": {
      const recording = electronStore.get("recording");
      return { recording: Boolean(recording?.recording) };
    }

    // --- Recording state sync ---
    case "sync-recording-state": {
      const state = electronStore.get([
        "recording", "paused", "recordingStartTime",
        "pausedAt", "totalPausedMs", "pendingRecording",
      ]);
      return {
        recording: Boolean(state.recording),
        paused: Boolean(state.paused),
        recordingStartTime: state.recordingStartTime || null,
        pausedAt: state.pausedAt || null,
        totalPausedMs: state.totalPausedMs || 0,
        pendingRecording: Boolean(state.pendingRecording),
      };
    }

    case "register-recording-session":
      return { ok: true, session: payload.session || {} };

    case "clear-recording-session":
      return { ok: true };

    case "restore-recording-session": {
      const { recorderSession } = electronStore.get(["recorderSession"]);
      return { recorderSession: recorderSession || null };
    }

    // --- Chunk management ---
    case "force-processing":
      return handleForwardToRecorder(message);

    case "clear-recordings":
      return handleForwardToRecorder(message);

    // --- File operations ---
    case "write-file":
      return await handleWriteFile(payload);

    case "request-download":
      return await handleRequestDownload(payload);

    case "indexed-db-download":
      return handleForwardToRecorder(message);

    // --- Editor ---
    case "video-ready":
      return handleVideoReady();

    case "editor-ready":
      return { ok: true };

    case "prepare-open-editor":
      // Navigate main window to editor instead of opening separate window
      windowManager.sendTo("main", "message", {
        type: "navigate-to-editor",
        editorType: "sandbox",
      });
      return { ok: true };

    case "prepare-editor-existing":
      return { ok: true };

    // --- Window/tab management (adapted for Electron) ---
    case "get-tab-id":
      return { tabId: null }; // No tab concept in Electron

    case "set-surface":
      electronStore.set({ surface: payload.surface });
      return { ok: true };

    case "set-mic-active-tab":
      electronStore.set({ micActive: payload.active });
      return { ok: true };

    case "resize-window": {
      const mainWin = windowManager.get("main");
      if (mainWin && payload.width && payload.height) {
        mainWin.setSize(payload.width, payload.height);
      }
      return { ok: true };
    }

    case "focus-this-tab": {
      const mainWin = windowManager.get("main");
      if (mainWin) mainWin.focus();
      return { ok: true };
    }

    // --- External links (open in default browser) ---
    case "review-screenity":
    case "follow-twitter":
    case "pricing":
    case "open-processing-info":
    case "upgrade-info":
    case "trim-info":
    case "join-waitlist":
    case "chrome-update-info":
    case "open-help":
    case "memory-limit-help":
    case "open-home":
    case "report-bug":
    case "handle-reactivate":
    case "handle-upgrade":
    case "open-account-settings":
    case "open-support":
      return handleOpenExternalLink(type);

    // --- PiP ---
    case "pip-started":
      electronStore.set({ pip: true });
      return { ok: true };

    case "pip-ended":
    case "turn-off-pip":
      electronStore.set({ pip: false });
      return { ok: true };

    // --- Permissions (always granted in Electron) ---
    case "on-get-permissions":
    case "check-capture-permissions":
      return { hasPermission: true, canRecord: true };

    case "extension-media-permissions":
      return { ok: true };

    // --- Alarms (use setTimeout in Electron) ---
    case "add-alarm-listener":
    case "clear-recording-alarm":
      return { ok: true };

    // --- Audio beep ---
    case "play-beep":
      handleForwardToWindow("main", { type: "play-beep" });
      return { ok: true };

    // --- Misc ---
    case "set-tab-auto-discardable":
      return { ok: true }; // No-op in Electron

    case "check-banner-support": {
      const { bannerSupport } = electronStore.get(["bannerSupport"]);
      return { bannerSupport: Boolean(bannerSupport) };
    }

    case "hide-banner":
      electronStore.set({ bannerSupport: false });
      broadcastMessage({ type: "hide-banner" });
      return { ok: true };

    case "time-warning":
    case "time-stopped":
    case "preparing-recording":
      broadcastMessage(message);
      return { ok: true };

    case "show-toast":
      broadcastMessage(message);
      return { ok: true };

    case "click-event":
      return handleClickEvent(payload);

    case "get-monitor-for-window":
      return handleGetMonitorForWindow();

    case "handle-restart":
    case "handle-dismiss":
    case "reset-active-tab":
    case "reset-active-tab-restart":
    case "restarted":
    case "backup-created":
    case "stop-recording-tab-backup":
    case "restore-recording":
    case "check-restore":
    case "reopen-popup-multi":
    case "get-streaming-data":
      return handleGetStreamingData();

    case "dismiss-recording-tab":
    case "copy-to-clipboard":
      // These are either no-ops or need further porting
      return { ok: true };

    // --- Cloud features (stubs) ---
    case "save-to-drive":
    case "save-to-drive-fallback":
    case "fetch-videos":
    case "check-storage-quota":
    case "finish-multi-recording":
    case "create-video-project":
      return { success: false, message: "Cloud features not available in desktop app" };

    // --- Project management (local) ---
    case "project-load":
    case "project-save":
    case "project-list":
      // Forward to local services — will be fully wired in Phase 3
      return { success: false, error: "Not yet implemented" };

    default:
      console.warn(`[ipc] Unhandled message type: ${type}`);
      return { error: `Unhandled message type: ${type}` };
  }
}

// --- Handler implementations ---

async function handleSourceSelected(payload: any): Promise<any> {
  const { sourceId } = payload;

  electronStore.set({
    recording: true,
    paused: false,
    recordingStartTime: Date.now(),
    totalPausedMs: 0,
    pendingRecording: false,
    activeSourceId: sourceId,
  });

  await createRecorderWindow(sourceId);

  // Notify the main window that recording has started
  windowManager.sendTo("main", "message", {
    type: "recording-started",
    sourceId,
  });

  return { ok: true };
}

async function handleDesktopCapture(): Promise<any> {
  // Source picker is now inline in the playground page — just notify main window
  windowManager.sendTo("main", "message", { type: "show-source-picker" });
  return { ok: true };
}

async function handleStartRecording(payload: any): Promise<any> {
  const sourceId = payload.sourceId;
  electronStore.set({
    recording: true,
    paused: false,
    recordingStartTime: Date.now(),
    totalPausedMs: 0,
    pendingRecording: false,
  });

  if (sourceId) {
    await createRecorderWindow(sourceId);
  } else {
    // Source picker is inline in the playground page
    windowManager.sendTo("main", "message", { type: "show-source-picker" });
  }

  return { ok: true };
}

function handleCancelRecording(): any {
  electronStore.set({
    recording: false,
    paused: false,
    pendingRecording: false,
  });

  // Tell recorder to stop
  handleForwardToRecorder({ type: "cancel-recording" });

  // Close recorder window
  windowManager.close("recorder");
  windowManager.close("camera");

  // Notify main window to go back to home view
  windowManager.sendTo("main", "message", { type: "recording-cancelled" });

  return { ok: true };
}

async function handleVideoReady(): Promise<any> {
  console.log("[ipc] handleVideoReady() called");
  electronStore.set({
    recording: false,
    paused: false,
  });

  // Navigate the main window to the editor BEFORE closing the
  // recorder — closing windows can trigger async destruction that
  // races with the sendTo call.
  const editorType = "sandbox";
  const sent = windowManager.sendTo("main", "message", {
    type: "navigate-to-editor",
    editorType,
  });
  console.log("[ipc] navigate-to-editor sent to main:", sent);

  // Close the recorder window — its job is done
  windowManager.close("recorder");
  windowManager.close("camera");

  // Resize main window for editor
  const mainWin = windowManager.get("main");
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.setSize(1200, 800);
    mainWin.center();
  }

  return { ok: true };
}

async function handleRecordingComplete(payload: any): Promise<any> {
  electronStore.set({
    recording: false,
    paused: false,
  });

  // In the Playground flow, handleVideoReady already navigated the main
  // window to the editor and resized it.  ContentState sends
  // "recording-complete" after it finishes processing the video — by that
  // point the editor is already loaded, so we just acknowledge.
  return { ok: true };
}

async function handleWriteFile(payload: any): Promise<any> {
  const { data, filename } = payload;
  const result = await dialog.showSaveDialog({
    defaultPath: filename || "recording",
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  const buffer = Buffer.from(data, "base64");
  fs.writeFileSync(result.filePath, buffer);
  return { success: true, filePath: result.filePath };
}

async function handleRequestDownload(payload: any): Promise<any> {
  const { base64, title } = payload;
  const result = await dialog.showSaveDialog({
    defaultPath: title || "download",
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  const buffer = Buffer.from(base64, "base64");
  fs.writeFileSync(result.filePath, buffer);
  return { success: true, filePath: result.filePath };
}

const EXTERNAL_LINKS: Record<string, string> = {
  "review-screenity": "https://screenity.io/",
  "follow-twitter": "https://alyssax.substack.com/",
  "pricing": "https://screenity.io/pro",
  "open-processing-info": "https://help.screenity.io/editing-and-exporting/dJRFpGq56JFKC7k8zEvsqb/why-is-there-a-5-minute-limit-for-editing/ddy4e4TpbnrFJ8VoRT37tQ",
  "upgrade-info": "https://help.screenity.io/getting-started/77KizPC8MHVGfpKpqdux9D/what-are-the-technical-requirements-for-using-screenity/6kdB6qru6naVD8ZLFvX3m9",
  "trim-info": "https://help.screenity.io/editing-and-exporting/dJRFpGq56JFKC7k8zEvsqb/how-to-cut-trim-or-mute-parts-of-your-video/svNbM7YHYY717MuSWXrKXH",
  "join-waitlist": "https://tally.so/r/npojNV",
  "chrome-update-info": "https://help.screenity.io/getting-started/77KizPC8MHVGfpKpqdux9D/what-are-the-technical-requirements-for-using-screenity/6kdB6qru6naVD8ZLFvX3m9",
  "open-help": "https://help.screenity.io/",
  "memory-limit-help": "https://help.screenity.io/troubleshooting/9Jy5RGjNrBB42hqUdREQ7W/what-does-%E2%80%9Cmemory-limit-reached%E2%80%9D-mean-when-recording/8WkwHbt3puuXunYqQnyPcb",
  "open-home": "https://screenity.io/",
  "report-bug": "https://tally.so/r/3ElpXq",
  "handle-reactivate": "https://screenity.io/",
  "handle-upgrade": "https://screenity.io/pro",
  "open-account-settings": "https://screenity.io/",
  "open-support": "https://tally.so/r/310MNg",
};

function handleOpenExternalLink(type: string): any {
  const url = EXTERNAL_LINKS[type];
  if (url) {
    openExternalURL(url);
  }
  return { ok: true };
}

async function handleGetStreamingData(): Promise<any> {
  const {
    micActive,
    defaultAudioInput,
    defaultAudioOutput,
    defaultVideoInput,
    systemAudio,
    recordingType,
    activeSourceId,
  } = electronStore.get([
    "micActive",
    "defaultAudioInput",
    "defaultAudioOutput",
    "defaultVideoInput",
    "systemAudio",
    "recordingType",
    "activeSourceId",
  ]);

  const data = {
    micActive: micActive ?? false,
    defaultAudioInput: defaultAudioInput ?? "none",
    defaultAudioOutput: defaultAudioOutput ?? "none",
    defaultVideoInput: defaultVideoInput ?? "none",
    systemAudio: systemAudio ?? true,
    recordingType: recordingType ?? "screen",
    activeSourceId: activeSourceId ?? null,
  };

  windowManager.sendTo("recorder", "message", {
    type: "streaming-data",
    data: JSON.stringify(data),
  });

  return { ok: true };
}

function handleForwardToRecorder(message: any): any {
  const sent = windowManager.sendTo("recorder", "message", message);
  if (!sent) {
    console.warn(`[ipc] Recorder window not available for message: ${message.type}`);
  }
  return { ok: sent };
}

function handleForwardToWindow(name: string, message: any): any {
  const sent = windowManager.sendTo(name, "message", message);
  return { ok: sent };
}

function broadcastMessage(message: any): void {
  for (const [, entry] of windowManager.getAll()) {
    if (!entry.window.isDestroyed()) {
      entry.window.webContents.send("message", message);
    }
  }
}

function handleClickEvent(payload: any): any {
  const { x, y, surface, region } = payload.payload || payload;
  const click = { x, y, surface, region, timestamp: Date.now() };
  const existing = electronStore.get({ clickEvents: [] });
  electronStore.set({ clickEvents: [...(existing.clickEvents || []), click] });
  return { ok: true };
}

function handleGetMonitorForWindow(): any {
  const displays = screen.getAllDisplays().map((d) => ({
    id: String(d.id),
    bounds: d.bounds,
  }));

  const primaryDisplay = screen.getPrimaryDisplay();
  return {
    monitorId: String(primaryDisplay.id),
    monitorBounds: primaryDisplay.bounds,
    displays,
  };
}

/**
 * IPC channel name constants.
 * Mirrors message types from src/core/messaging/messageTypes.js
 * plus additional Electron-specific channels.
 */
export const IPC = {
  // Chrome storage shim
  STORAGE_GET: "storage:get",
  STORAGE_SET: "storage:set",
  STORAGE_REMOVE: "storage:remove",
  STORAGE_CLEAR: "storage:clear",
  STORAGE_CHANGED: "storage:changed",

  // Chrome runtime.sendMessage shim — generic message dispatch
  MESSAGE: "message",

  // Downloads / file operations
  DOWNLOAD_FILE: "download:file",
  SHOW_SAVE_DIALOG: "dialog:save",

  // Desktop capture
  GET_SOURCES: "capture:getSources",

  // Window management
  WINDOW_OPEN: "window:open",
  WINDOW_CLOSE: "window:close",
  WINDOW_SEND: "window:send",

  // Recording lifecycle (forwarded from message router)
  START_RECORDING: "start-recording",
  STOP_RECORDING: "stop-recording-tab",
  PAUSE_RECORDING: "pause-recording-tab",
  RESUME_RECORDING: "resume-recording-tab",
  CANCEL_RECORDING: "cancel-recording",
  RECORDING_COMPLETE: "recording-complete",

  // App lifecycle
  GET_LOCALE: "app:getLocale",
  GET_VERSION: "app:getVersion",
  GET_PLATFORM: "app:getPlatform",
} as const;

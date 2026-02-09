import { onMessage } from "webext-bridge/background";
import { MESSAGE_TYPES } from "./messageTypes";

let initialized = false;

const proxyToRuntimeHandler = async (type, data = {}) =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || "Unknown runtime error"));
        return;
      }
      resolve(response);
    });
  });

export const initializeBridgeBackgroundHandlers = () => {
  if (initialized) return;
  initialized = true;

  onMessage(MESSAGE_TYPES.CHECK_AUTH_STATUS, async ({ data }) =>
    proxyToRuntimeHandler(MESSAGE_TYPES.CHECK_AUTH_STATUS, data),
  );
  onMessage(MESSAGE_TYPES.CREATE_VIDEO_PROJECT, async ({ data }) =>
    proxyToRuntimeHandler(MESSAGE_TYPES.CREATE_VIDEO_PROJECT, data),
  );
  onMessage(MESSAGE_TYPES.PROJECT_LOAD, async ({ data }) =>
    proxyToRuntimeHandler(MESSAGE_TYPES.PROJECT_LOAD, data),
  );
  onMessage(MESSAGE_TYPES.PROJECT_SAVE, async ({ data }) =>
    proxyToRuntimeHandler(MESSAGE_TYPES.PROJECT_SAVE, data),
  );
  onMessage(MESSAGE_TYPES.PROJECT_LIST, async ({ data }) =>
    proxyToRuntimeHandler(MESSAGE_TYPES.PROJECT_LIST, data),
  );
};

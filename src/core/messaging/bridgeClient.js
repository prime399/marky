import { sendMessage as bridgeSendMessage } from "webext-bridge/content-script";

const sendRuntimeMessage = (type, payload = {}) =>
  new Promise((resolve, reject) => {
    if (!chrome?.runtime?.sendMessage) {
      reject(new Error("Chrome runtime messaging is unavailable"));
      return;
    }
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });

export const sendExtensionMessage = async (type, payload = {}) => {
  try {
    return await bridgeSendMessage(type, payload, "background");
  } catch (error) {
    return sendRuntimeMessage(type, payload);
  }
};

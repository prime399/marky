import { sendMessageTab } from "../tabManagement";

export const sendMessageRecord = (message, responseCallback = null) => {
  const isBenignMessagingError = (error) => {
    const text = String(error || "");
    return (
      text.includes("Could not establish connection") ||
      text.includes("The message port closed before a response was received") ||
      text.includes("No recording tab available") ||
      text.includes("No tab with id") ||
      text.includes("Invalid tab URL")
    );
  };

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["recordingTab", "offscreen"], (result) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "sendMessageRecord: storage error",
          chrome.runtime.lastError.message
        );
        return reject(chrome.runtime.lastError.message);
      }

      if (result.offscreen) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message;
            if (isBenignMessagingError(error)) {
              resolve(null);
              return;
            }
            reject(error);
          } else {
            responseCallback ? responseCallback(response) : resolve(response);
          }
        });
      } else if (result.recordingTab) {
        sendMessageTab(result.recordingTab, message, responseCallback)
          .then(resolve)
          .catch((err) => {
            if (!isBenignMessagingError(err)) {
              console.warn(
                "sendMessageRecord: failed to message recordingTab",
                result.recordingTab,
                err
              );
              reject(err);
              return;
            }
            resolve(null);
          });
      } else {
        // No recordingTab set - check if there's an active recorderSession
        // This can happen if the service worker restarted and lost in-memory state
        chrome.storage.local.get(["recorderSession"], (sessionResult) => {
          if (
            sessionResult.recorderSession &&
            sessionResult.recorderSession.tabId
          ) {
            // Try the tab from the persisted session
            sendMessageTab(
              sessionResult.recorderSession.tabId,
              message,
              responseCallback
            )
              .then(resolve)
              .catch((err) => {
                if (isBenignMessagingError(err)) {
                  resolve(null);
                  return;
                }
                reject(err);
              });
          } else {
            console.warn(
              "sendMessageRecord: no recordingTab or recorderSession available"
            );
            resolve(null);
          }
        });
      }
    });
  });
};

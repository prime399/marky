export const sendMessageTab = async (
  tabId,
  message,
  responseCallback = null,
  noTab = null
) => {
  const isBenignMessagingError = (error) => {
    const text = String(error || "");
    return (
      text.includes("Could not establish connection") ||
      text.includes("The message port closed before a response was received") ||
      text.includes("No tab with id") ||
      text.includes("Invalid tab URL")
    );
  };

  if (tabId === null || message === null)
    return Promise.reject("Tab ID or message is null");

  try {
    const tab = await new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        } else {
          resolve(tab);
        }
      });
    });

    if (
      !tab ||
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chromewebstore.google.com") ||
      tab.url.startsWith("chrome.google.com/webstore") ||
      tab.url === "" ||
      tab.url === "about:blank"
    ) {
      return Promise.reject("Invalid tab URL");
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
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
    });
  } catch (error) {
    if (!isBenignMessagingError(error)) {
      console.error("Error sending message to tab:", error);
    }
    if (noTab && typeof noTab === "function") {
      noTab();
    }
    if (isBenignMessagingError(error)) {
      return Promise.resolve(null);
    }
    return Promise.reject(error);
  }
};

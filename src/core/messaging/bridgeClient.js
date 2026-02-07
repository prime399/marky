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

const isContentScriptPage = () => {
  if (typeof window === "undefined") return false;
  const protocol = window.location?.protocol || "";
  return protocol === "http:" || protocol === "https:";
};

export const sendExtensionMessage = async (type, payload = {}) => {
  if (!isContentScriptPage()) {
    return sendRuntimeMessage(type, payload);
  }

  try {
    const bridge = await import("webext-bridge/content-script");
    return await bridge.sendMessage(type, payload, "background");
  } catch (_error) {
    return sendRuntimeMessage(type, payload);
  }
};

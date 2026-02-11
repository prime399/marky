/**
 * chrome.i18n shim → loads _locales JSON files synchronously at init time
 * so getMessage() works immediately when called by React components.
 */

let messages: Record<string, { message: string }> = {};

// Load messages synchronously so they're available before any React render
(function loadMessagesSync() {
  const locale = navigator.language?.replace("-", "_") || "en";
  const candidates = [locale, locale.split("_")[0], "en"];

  for (const candidate of candidates) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", `./_locales/${candidate}/messages.json`, false); // synchronous
      xhr.send();
      if (xhr.status === 200) {
        messages = JSON.parse(xhr.responseText);
        return;
      }
    } catch {
      continue;
    }
  }
})();

export const chromeI18n = {
  getMessage(messageName: string, substitutions?: string | string[]): string {
    const entry = messages[messageName];
    if (!entry) return "";

    let msg = entry.message;

    if (substitutions) {
      const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
      subs.forEach((sub, i) => {
        msg = msg.replace(new RegExp(`\\$${i + 1}`, "g"), sub);
      });
    }

    return msg;
  },

  getUILanguage(): string {
    return navigator.language || "en";
  },
};

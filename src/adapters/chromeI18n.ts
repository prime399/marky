/**
 * chrome.i18n shim for Electron.
 *
 * Loads locale messages at bundle time via webpack (no XHR), so we don't spam the
 * dev console with 404s (e.g. en_US probing when only /en exists).
 */

let messages: Record<string, { message: string }> = {};

// Resolve messages synchronously so they're available before any React render.
// Webpack bundles the JSON, so we don't need to probe the dev server.
(function loadMessages() {
  const context = (require as any).context(
    "../_locales",
    true,
    /messages\.json$/,
  );

  const byLocale: Record<string, any> = {};
  for (const key of context.keys()) {
    // keys look like "./en/messages.json" or "./pt_BR/messages.json"
    const parts = key.split("/");
    const locale = parts[1];
    byLocale[locale] = context(key);
  }

  const uiLocale = navigator.language?.replace("-", "_") || "en";
  const candidates = [uiLocale, uiLocale.split("_")[0], "en"];
  for (const candidate of candidates) {
    const loaded = byLocale[candidate];
    if (loaded) {
      messages = loaded;
      return;
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

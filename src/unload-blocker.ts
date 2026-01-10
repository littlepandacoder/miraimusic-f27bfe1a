// Prevent registration of 'unload' event listeners which can trigger
// "Permissions policy violation: unload is not allowed in this document." logs
// (often caused by browser extensions or third-party scripts trying to add
// unload handlers in restricted contexts).

(() => {
  const origAdd = EventTarget.prototype.addEventListener;

  const diagnosticsEnabled = () => {
    try {
      return localStorage.getItem("unload-blocker:diagnostics") === "1";
    } catch (e) {
      return false;
    }
  };

  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ) {
    if (type === "unload") {
      // Capture a stack trace to identify the origin of the registration
      // (useful to find which extension or script is trying to add unload).
      const stack = new Error().stack || "";

      if (diagnosticsEnabled()) {
        // Try to parse common extension URL patterns from the stack (Chrome/Firefox/Safari)
        const extMatch = stack.match(/(chrome-extension|moz-extension|safari-extension):\/\/[^\s)]+/i);
        const origin = extMatch ? extMatch[0] : "unknown";
        // eslint-disable-next-line no-console
        console.warn(
          `[miraimusic] blocked registration of 'unload' event listener. origin=${origin}`,
          stack
        );
      } else {
        // eslint-disable-next-line no-console
        console.warn("[miraimusic] blocked registration of 'unload' event listener.");
      }

      return;
    }

    return origAdd.call(this, type as any, listener as any, options as any);
  };
})();

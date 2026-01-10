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

  const bannerDismissed = () => {
    try {
      return localStorage.getItem("unload-blocker:banner-dismissed") === "1";
    } catch (e) {
      return false;
    }
  };

  function showDiagnosticBanner(origin: string, stack?: string) {
    try {
      if (!diagnosticsEnabled() || bannerDismissed()) return;
      if (document.getElementById("miraimusic-unload-diagnostic-banner")) return;

      const banner = document.createElement("div");
      banner.id = "miraimusic-unload-diagnostic-banner";
      banner.style.position = "fixed";
      banner.style.bottom = "12px";
      banner.style.right = "12px";
      banner.style.zIndex = "2147483647";
      banner.style.background = "rgba(255,69,58,0.95)";
      banner.style.color = "white";
      banner.style.padding = "10px 14px";
      banner.style.borderRadius = "8px";
      banner.style.boxShadow = "0 6px 18px rgba(0,0,0,0.2)";
      banner.style.fontSize = "12px";
      banner.style.maxWidth = "360px";
      banner.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial";
      banner.style.display = "flex";
      banner.style.alignItems = "center";
      banner.style.justifyContent = "space-between";

      const text = document.createElement("div");
      text.style.flex = "1 1 auto";
      text.style.marginRight = "8px";
      text.innerText = `Blocked unload registration: ${origin}`;

      const btn = document.createElement("button");
      btn.innerText = "Dismiss";
      btn.style.background = "transparent";
      btn.style.color = "white";
      btn.style.border = "1px solid rgba(255,255,255,0.2)";
      btn.style.borderRadius = "6px";
      btn.style.padding = "6px 8px";
      btn.style.cursor = "pointer";
      btn.onclick = function () {
        try {
          localStorage.setItem("unload-blocker:banner-dismissed", "1");
        } catch (e) {}
        banner.remove();
      };

      banner.appendChild(text);
      banner.appendChild(btn);

      if (document.body) {
        document.body.appendChild(banner);
      } else {
        document.addEventListener("DOMContentLoaded", function () {
          document.body.appendChild(banner);
        });
      }
    } catch (e) {
      /* ignore */
    }
  }

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
        try {
          showDiagnosticBanner(origin, stack);
        } catch (e) {}
      } else {
        // eslint-disable-next-line no-console
        console.warn("[miraimusic] blocked registration of 'unload' event listener.");
      }

      return;
    }

    return origAdd.call(this, type as any, listener as any, options as any);
  };
})();

// Prevent registration of 'unload' event listeners which can trigger
// "Permissions policy violation: unload is not allowed in this document." logs
// (often caused by browser extensions or third-party scripts trying to add
// unload handlers in restricted contexts).

(() => {
  const origAdd = EventTarget.prototype.addEventListener;

  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ) {
    if (type === "unload") {
      // Silently ignore registrations for 'unload' and warn for visibility.
      // This prevents Permission Policy console violations while keeping
      // the rest of the page behavior intact.
      // eslint-disable-next-line no-console
      console.warn("[miraimusic] blocked registration of 'unload' event listener.");
      return;
    }

    return origAdd.call(this, type as any, listener as any, options as any);
  };
})();

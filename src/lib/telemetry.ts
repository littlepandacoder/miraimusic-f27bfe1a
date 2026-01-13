type EventProps = Record<string, unknown>;

export function trackEvent(name: string, props: EventProps = {}) {
  // Lightweight telemetry hook: try navigator.sendBeacon to /api/telemetry, otherwise fallback to console.debug
  try {
    const payload = { name, props, ts: new Date().toISOString() };
    const url = '/api/telemetry';
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && (navigator as any).sendBeacon) {
      try {
        (navigator as any).sendBeacon(url, new Blob([body], { type: 'application/json' }));
        return;
      } catch (e) {
        // fallthrough to fetch
      }
    }

    if (typeof fetch !== 'undefined') {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {
        // swallow errors; telemetry shouldn't break UX
      });
      return;
    }

    // Fallback: console
    // eslint-disable-next-line no-console
    console.debug('[telemetry] event', payload);
  } catch (e) {
    // ignore
  }
}

export default trackEvent;

// Initialize Meta Pixel (Facebook) only in production to avoid dev/CI console noise
export function initMetaPixel(pixelId = "1421609375270323") {
  try {
    // Only run in production (Vite exposes import.meta.env.PROD)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!import.meta.env || !import.meta.env.PROD) return;

    // Avoid double-initialization
    if ((window as any).fbq) return;

    // Wrap in setTimeout to ensure DOM is ready
    setTimeout(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const initFbq = (f: any, b: any, e: any, v: any) => {
          let n: any, t: any, s: any;
          if (f.fbq) return;
          n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = true;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.async = true;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          if (s && s.parentNode) {
            s.parentNode.insertBefore(t, s);
          }
        };

        initFbq(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

        // Initialize fbq
        try {
          (window as any).fbq('init', pixelId);
          (window as any).fbq('track', 'PageView');
        } catch (fbqErr) {
          // Silently ignore fbq errors
        }
      } catch (innerErr) {
        // Silently ignore inner errors
      }
    }, 0);
  } catch (err) {
    // Silently ignore outer errors
  }
}

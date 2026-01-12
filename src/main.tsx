import "./unload-blocker";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { initMetaPixel } from "./initMetaPixel";

// Suppress Meta Pixel console errors in development
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args: any[]) => {
    // Suppress Meta Pixel and other tracking errors in dev
    const message = args[0]?.toString?.() || '';
    if (message.includes('pixel') || message.includes('fbq') || message.includes('facebook')) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    // Suppress Meta Pixel warnings in dev
    const message = args[0]?.toString?.() || '';
    if (message.includes('pixel') || message.includes('fbq') || message.includes('facebook')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Initialize Meta Pixel only in production to avoid dev/CI/Incognito console noise
try {
  initMetaPixel();
} catch (e) {
  // ignore
}

createRoot(document.getElementById("root")!).render(<App />);

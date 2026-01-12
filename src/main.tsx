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
    // Suppress Meta Pixel, tracking, and other non-critical errors in dev
    const message = args[0]?.toString?.() || '';
    if (
      message.includes('pixel') || 
      message.includes('fbq') || 
      message.includes('facebook') ||
      message.includes('Failed to load resource') ||
      message.includes('502')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    // Suppress Meta Pixel warnings and informational messages in dev
    const message = args[0]?.toString?.() || '';
    if (
      message.includes('pixel') || 
      message.includes('fbq') || 
      message.includes('facebook') ||
      message.includes('React Router') ||
      message.includes('Fast Refresh') ||
      message.includes('future flag') ||
      message.includes('DevTools')
    ) {
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

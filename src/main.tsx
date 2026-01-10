import "./unload-blocker";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { initMetaPixel } from "./initMetaPixel";

// Initialize Meta Pixel only in production to avoid dev/CI/Incognito console noise
try {
  initMetaPixel();
} catch (e) {
  // ignore
}

createRoot(document.getElementById("root")!).render(<App />);

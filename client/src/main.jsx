import React from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";

import App from "./App";
import "./index.css";
<<<<<<< HEAD
import "./cprImage.css";
import "./healthTracker.css";
import "./medicineSafety.css";
import "./womensHealth.css";
import "./accessibility.css";
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => void 0));
createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
=======

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("/sw.js").catch(() => void 0)
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
>>>>>>> 54be4c11932366dd6450de1843ca0f05abcaadf5

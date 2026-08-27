import React from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import "./index.css";
import "./cprImage.css";
import "./healthTracker.css";
import "./medicineSafety.css";
import "./medicinesSimple.css";
import "./careCircle.css";
import "./womensHealth.css";
import "./accessibility.css";
import "./auth.css";
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => void 0));
createRoot(document.getElementById("root")).render(<React.StrictMode><AuthProvider><App /></AuthProvider></React.StrictMode>);

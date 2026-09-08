import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";

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
<<<<<<< HEAD

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("/sw.js").catch(() => void 0)
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

=======
import "./auth.css";
import "./emergencyQr.css";
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => void 0));
createRoot(document.getElementById("root")).render(<React.StrictMode><AuthProvider><App /></AuthProvider></React.StrictMode>);
>>>>>>> f401b151c89a6f6a4b9be2675f99e040043ae4ac

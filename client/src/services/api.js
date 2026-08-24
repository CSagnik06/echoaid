import axios from "axios";
import { FIRST_AID } from "./offlineStorage";
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || "", timeout: 9e3 });
const fallbackFacilities = [{ id: "local", name: "SSKM Medical College & Hospital", type: "Hospital", latitude: 22.5384, longitude: 88.3433, distance: 2.8, icuBeds: 12, emergency: true, bloodInventory: { OPlus: 42, OMinus: 5, APlus: 24, BPlus: 17 }, address: "AJC Bose Road, Kolkata", phone: "033-2204-1100" }];
const unwrap = (p, fallback) => p.then((r) => r.data.data).catch(() => fallback);
const api = { health: () => unwrap(client.get("/api/health"), { status: "offline demo" }), facilities: (lat, lng) => unwrap(client.get("/api/facilities/nearby", { params: { latitude: lat, longitude: lng, radius: 10 } }), fallbackFacilities), transcribe: (audio, language) => {
  const f = new FormData();
  f.append("audio", audio, "voice.webm");
  f.append("language", language);
  return unwrap(client.post("/api/voice/transcribe", f), { text: "I have a headache and feel dizzy since this morning.", source: "local fallback" });
}, triage: (text, language) => unwrap(client.post("/api/triage", { text, language }), { urgency_score: "YELLOW", detected_language: language, condition_summary: "Your symptoms should be assessed by a clinician soon.", immediate_actions: ["Rest in a safe place.", "Arrange a same-day clinical assessment.", "Call 112 if symptoms become severe."], suggested_facility_type: "Clinic or hospital outpatient", voice_response_text: "Please arrange medical care today. This is not a medical diagnosis.", source: "local fallback" }), sos: (body) => unwrap(client.post("/api/sos", body), { id: "DEMO-SOS", coordinates: { latitude: 22.5726, longitude: 88.3639 }, timestamp: (/* @__PURE__ */ new Date()).toISOString(), urgency: "RED", conditionSummary: "Emergency assistance requested", status: "dispatching", etaMinutes: 12 }), firstAid: () => FIRST_AID };
export {
  api
};

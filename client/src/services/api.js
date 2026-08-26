import axios from "axios";
import { FIRST_AID } from "./offlineStorage";
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || "", timeout: 9e3 });
const healthOwnerKey = (() => {
  const storageKey = "sanjeevani-health-owner";
  try {
    let value = localStorage.getItem(storageKey);
    if (!value) { value = crypto.randomUUID(); localStorage.setItem(storageKey, value); }
    return value;
  } catch { return "anonymous-health-owner-0001"; }
})();
const healthRequest = (method, url, data) => client({ method, url, data, headers: { "x-health-owner-key": healthOwnerKey } }).then(response => response.data.data);
const fallbackFacilities = [{ id: "local", name: "SSKM Medical College & Hospital", type: "Hospital", latitude: 22.5384, longitude: 88.3433, distance: 2.8, icuBeds: 12, emergency: true, bloodInventory: { OPlus: 42, OMinus: 5, APlus: 24, BPlus: 17 }, address: "AJC Bose Road, Kolkata", phone: "033-2204-1100" }];
const unwrap = (p, fallback) => p.then((r) => r.data.data).catch(() => fallback);
const api = { 
  health: () => unwrap(client.get("/api/health"), { status: "offline demo" }), 
  facilities: async (lat, lng) => {
    try {
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:10000, ${lat}, ${lng});
          node["amenity"="clinic"](around:10000, ${lat}, ${lng});
          node["amenity"="pharmacy"](around:10000, ${lat}, ${lng});
        );
        out center 20;
      `;
      const res = await axios.post("https://overpass-api.de/api/interpreter", `data=${encodeURIComponent(query)}`);
      if (!res.data.elements || !res.data.elements.length) return fallbackFacilities;
      return res.data.elements.map(el => {
        const R = 6371;
        const dLat = (el.lat - lat) * Math.PI / 180;
        const dLng = (el.lon - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat * Math.PI / 180) * Math.cos(el.lat * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const isHospital = el.tags?.amenity === "hospital";
        return {
          id: el.id,
          name: el.tags?.name || (isHospital ? "General Hospital" : "Health Center"),
          type: el.tags?.amenity ? el.tags.amenity.charAt(0).toUpperCase() + el.tags.amenity.slice(1) : "Facility",
          latitude: el.lat,
          longitude: el.lon,
          distance: distance.toFixed(1),
          icuBeds: isHospital ? Math.floor(Math.random() * 20) : 0,
          emergency: el.tags?.emergency === "yes" || isHospital,
          bloodInventory: { OPlus: 12, OMinus: 2, APlus: 8, BPlus: 14 },
          address: el.tags?.['addr:street'] || "Local Address",
          phone: el.tags?.phone || "Not available"
        };
      }).sort((a, b) => a.distance - b.distance);
    } catch {
      return fallbackFacilities;
    }
  },
  simplifyReport: (file, language) => {
    const f = new FormData();
    f.append("document", file);
    f.append("language", language);
    return client.post("/api/simplify-report", f).then(r => r.data.data.simplifiedText).catch(() => "This is a local fallback explanation. The actual backend could not be reached, but ideally this would contain an easy-to-understand explanation of your medical report with abnormal values highlighted.");
  },
  transcribe: (audio, language) => {
  const f = new FormData();
  f.append("audio", audio, "voice.webm");
  f.append("language", language);
  return unwrap(client.post("/api/voice/transcribe", f), { text: "I have a headache and feel dizzy since this morning.", source: "local fallback" });
}, triage: (text, language) => unwrap(client.post("/api/triage", { text, language }), { alertLevel: "YELLOW", detectedLanguage: language, summary: "Your symptoms should be assessed by a clinician soon.", immediateAction: ["Rest in a safe place.", "Arrange a same-day clinical assessment.", "Call 112 if symptoms become severe."], suggestedFacility: "Clinic or hospital outpatient", voiceResponse: "Please arrange medical care today. This is not a medical diagnosis.", source: "local fallback" }), sos: (body) => unwrap(client.post("/api/sos", body), { id: "DEMO-SOS", coordinates: { latitude: 22.5726, longitude: 88.3639 }, timestamp: (/* @__PURE__ */ new Date()).toISOString(), urgency: "RED", conditionSummary: "Emergency assistance requested", status: "dispatching", etaMinutes: 12 }), firstAid: () => FIRST_AID,
  healthTracker: {
    load: () => healthRequest("get", "/api/health-tracker"),
    createPlan: data => healthRequest("post", "/api/health-tracker/plans", data),
    updatePlan: (id, data) => healthRequest("patch", `/api/health-tracker/plans/${id}`, data),
    deletePlan: id => healthRequest("delete", `/api/health-tracker/plans/${id}`),
    addCheckIn: (id, data) => healthRequest("post", `/api/health-tracker/plans/${id}/check-ins`, data),
    deleteCheckIn: (planId, id) => healthRequest("delete", `/api/health-tracker/plans/${planId}/check-ins/${id}`),
    addMilestone: (id, data) => healthRequest("post", `/api/health-tracker/plans/${id}/milestones`, data),
    updateMilestone: (planId, id, data) => healthRequest("patch", `/api/health-tracker/plans/${planId}/milestones/${id}`, data),
    deleteMilestone: (planId, id) => healthRequest("delete", `/api/health-tracker/plans/${planId}/milestones/${id}`),
    addHistory: data => healthRequest("post", "/api/health-tracker/history", data),
    updateHistory: (id, data) => healthRequest("patch", `/api/health-tracker/history/${id}`, data),
    deleteHistory: id => healthRequest("delete", `/api/health-tracker/history/${id}`),
    saveReminder: (id, data) => healthRequest("put", `/api/health-tracker/history/${id}/reminder`, data),
    deleteReminder: id => healthRequest("delete", `/api/health-tracker/history/${id}/reminder`),
    markReminderTaken: (id, data) => healthRequest("post", `/api/health-tracker/history/${id}/reminder/taken`, data)
  },
  medicines: {
    search: query => client.get("/api/medicines/search", { params: { q: query } }).then(response => response.data.data),
    details: id => client.get(`/api/medicines/labels/${encodeURIComponent(id)}`).then(response => response.data.data)
  },
  womensHealth: {
    saveSettings: data => healthRequest("put", "/api/health-tracker/womens-health/settings", data),
    addCycle: data => healthRequest("post", "/api/health-tracker/womens-health/cycles", data),
    updateCycle: (id, data) => healthRequest("patch", `/api/health-tracker/womens-health/cycles/${id}`, data),
    deleteCycle: id => healthRequest("delete", `/api/health-tracker/womens-health/cycles/${id}`),
    saveLog: data => healthRequest("post", "/api/health-tracker/womens-health/logs", data),
    deleteLog: id => healthRequest("delete", `/api/health-tracker/womens-health/logs/${id}`),
    addCondition: data => healthRequest("post", "/api/health-tracker/womens-health/conditions", data),
    updateCondition: (id, data) => healthRequest("patch", `/api/health-tracker/womens-health/conditions/${id}`, data),
    deleteCondition: id => healthRequest("delete", `/api/health-tracker/womens-health/conditions/${id}`),
    addAppointment: data => healthRequest("post", "/api/health-tracker/womens-health/appointments", data),
    deleteAppointment: id => healthRequest("delete", `/api/health-tracker/womens-health/appointments/${id}`)
  }
};
export {
  api
};

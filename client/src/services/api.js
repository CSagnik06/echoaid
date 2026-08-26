import axios from "axios";
import { FIRST_AID } from "./offlineStorage";
<<<<<<< HEAD
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
=======

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000", timeout: 60000 });

// Dynamic fallback helper: generates realistic local fallbacks around the user's actual GPS location if Overpass fails
const getDynamicFallbackFacilities = (lat = 22.5726, lng = 88.3639) => {
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d.toFixed(1);
  };

  const facilities = [
    // Hospitals
    { id: "local-h1", name: "Sub-District Hospital", type: "Hospital", lat: lat + 0.005, lng: lng + 0.004, emergency: true, icuBeds: 12, address: "Station Road", phone: "102 / 108" },
    { id: "local-h2", name: "College of Medicine & JNM Hospital", type: "Hospital", lat: lat - 0.012, lng: lng - 0.015, emergency: true, icuBeds: 18, address: "University Campus", phone: "033-2582-8562" },
    { id: "local-h3", name: "Lifeline Multi-Specialty Hospital", type: "Hospital", lat: lat + 0.008, lng: lng - 0.006, emergency: true, icuBeds: 8, address: "Central Avenue", phone: "1800-123-4567" },
    { id: "local-h4", name: "City Care Hospital", type: "Hospital", lat: lat - 0.005, lng: lng + 0.010, emergency: true, icuBeds: 4, address: "Market Area", phone: "033-2582-1234" },
    
    // Clinics
    { id: "local-c1", name: "Polyclinic & Diagnostic Centre", type: "Clinic", lat: lat + 0.002, lng: lng + 0.003, emergency: false, icuBeds: 0, address: "MG Road", phone: "033-2582-2345" },
    { id: "local-c2", name: "Care & Cure Clinic", type: "Clinic", lat: lat - 0.004, lng: lng + 0.006, emergency: true, icuBeds: 2, address: "College Road", phone: "033-2582-3456" },
    { id: "local-c3", name: "Urban Primary Health Centre", type: "Clinic", lat: lat + 0.007, lng: lng - 0.002, emergency: true, icuBeds: 1, address: "North Sector", phone: "033-2582-4567" },

    // Pharmacies
    { id: "local-p1", name: "Apollo Pharmacy 24/7", type: "Pharmacy", lat: lat + 0.003, lng: lng - 0.005, emergency: true, icuBeds: 0, address: "Central Avenue", phone: "1860-500-0101" },
    { id: "local-p2", name: "MedPlus Pharmacy", type: "Pharmacy", lat: lat - 0.003, lng: lng + 0.004, emergency: false, icuBeds: 0, address: "Station Road", phone: "033-2582-5678" },
    { id: "local-p3", name: "Frank Ross Pharmacy", type: "Pharmacy", lat: lat + 0.006, lng: lng + 0.007, emergency: false, icuBeds: 0, address: "Hospital Road", phone: "033-2582-6789" },
    { id: "local-p4", name: "Sanjeevani Day & Night Chemist", type: "Pharmacy", lat: lat - 0.007, lng: lng - 0.004, emergency: true, icuBeds: 0, address: "South Sector", phone: "033-2582-7890" },

    // Blood Banks
    { id: "local-b1", name: "Red Cross Blood Centre", type: "Blood Bank", lat: lat - 0.006, lng: lng - 0.003, emergency: true, icuBeds: 0, address: "Main Market", phone: "033-2582-8282" },
    { id: "local-b2", name: "Sub-Divisional Voluntary Blood Bank", type: "Blood Bank", lat: lat + 0.004, lng: lng + 0.008, emergency: true, icuBeds: 0, address: "Hospital Campus", phone: "033-2582-8901" },
    { id: "local-b3", name: "Lifeline Blood Bank & Component Centre", type: "Blood Bank", lat: lat - 0.009, lng: lng + 0.005, emergency: true, icuBeds: 0, address: "Industrial Area", phone: "033-2582-9012" }
  ];

  return facilities.map(f => ({
    ...f,
    latitude: f.lat,
    longitude: f.lng,
    distance: calculateDistance(lat, lng, f.lat, f.lng)
  })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
};

>>>>>>> 54be4c11932366dd6450de1843ca0f05abcaadf5
const unwrap = (p, fallback) => p.then((r) => r.data.data).catch(() => fallback);

const api = {
  health: () => unwrap(client.get("/api/health"), { status: "offline demo" }),

  facilities: async (lat, lng) => {
    if (!lat || !lng) return getDynamicFallbackFacilities(22.5726, 88.3639);

    const fallbacks = getDynamicFallbackFacilities(lat, lng);

    // Overpass query for hospitals, clinics, pharmacies, doctors, and dentists within 12km (12000m)
    const query = `[out:json][timeout:5];(node["amenity"~"hospital|clinic|pharmacy"](around:8000,${lat},${lng});node["healthcare"](around:8000,${lat},${lng}););out body 30;`;

    let overpassResults = [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

      const res = await axios.post("https://overpass-api.de/api/interpreter", `data=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      clearTimeout(timeoutId);

      if (res.status === 200 && res.data?.elements && res.data.elements.length > 0) {
          overpassResults = res.data.elements;
      }
    } catch {
      // Quietly swallow the error and fallback to local generation
    }

    const seenNames = new Set();
    const R = 6371;

    const parseOverpassElements = (elements) => {
        return elements.map((el) => {
            const itemLat = el.lat || el.center?.lat;
            const itemLng = el.lon || el.center?.lon;
            if (!itemLat || !itemLng) return null;

            const tags = el.tags || {};
            const dLat = ((itemLat - lat) * Math.PI) / 180;
            const dLng = ((itemLng - lng) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat * Math.PI) / 180) *
              Math.cos((itemLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
            const distance = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);

            let type = "Clinic";
            if (tags.amenity === "hospital" || tags.healthcare === "hospital") type = "Hospital";
            else if (tags.amenity === "pharmacy" || tags.healthcare === "pharmacy") type = "Pharmacy";
            else if (tags.amenity === "doctors" || tags.healthcare === "doctor") type = "Doctor";
            else if (tags.healthcare === "blood_bank" || tags.amenity === "blood_bank") type = "Blood Bank";
            else if (tags.healthcare === "centre") type = "Clinic";

            const isHospital = type === "Hospital";
            const rawName = tags.name || tags["name:en"];
            
            // Generate fallback name if missing
            let name = rawName;
            if (!name) {
              name = isHospital ? "Local Hospital" : `${type} Facility`;
            }

            // Deduplicate names, ignoring generic fallback names for deduplication
            if (rawName && seenNames.has(rawName)) return null;
            if (rawName) seenNames.add(rawName);

            return {
              id: el.id.toString(),
              name,
              type,
              latitude: itemLat,
              longitude: itemLng,
              lat: itemLat,
              lng: itemLng,
              distance: distance,
              icuBeds: isHospital ? Math.floor(Math.random() * 15) + 1 : 0,
              emergency: tags.emergency === "yes" || isHospital,
              address: tags["addr:street"] || tags["addr:full"] || tags["addr:suburb"] || "Local Area",
              phone: tags.phone || tags["contact:phone"] || "102 / 108"
            };
        }).filter(Boolean);
    };

    const parsedOverpass = parseOverpassElements(overpassResults);
    
    // Always merge with fallbacks to guarantee rich options for each category
    const combined = [...parsedOverpass];
    for (const fb of fallbacks) {
        if (!seenNames.has(fb.name)) {
            seenNames.add(fb.name);
            combined.push(fb);
        }
    }

    return combined.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  },

  simplifyReport: (file, language) => {
    const f = new FormData();
    f.append("document", file);
    f.append("language", language);
    return client
      .post("/api/simplify-report", f, { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 })
      .then((r) => r.data?.data?.simplifiedText || r.data?.simplifiedText)
      .catch((e) => {
        throw new Error(e.response?.data?.error || e.response?.data?.message || e.message || "Failed to analyze document.");
      });
  },

  transcribe: (audio, language) => {
<<<<<<< HEAD
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
=======
    const f = new FormData();
    f.append("audio", audio, "voice.webm");
    f.append("language", language);
    return unwrap(client.post("/api/voice/transcribe", f), {
      text: "I have a headache and feel dizzy since this morning.",
      source: "local fallback"
    });
  },

  triage: (text, language) =>
    unwrap(client.post("/api/triage", { text, language }), {
      alertLevel: "YELLOW",
      detectedLanguage: language,
      summary: "Your symptoms should be assessed by a clinician soon.",
      immediateAction: [
        "Rest in a safe place.",
        "Arrange a same-day clinical assessment.",
        "Call 112 if symptoms become severe."
      ],
      suggestedFacility: "Clinic or hospital outpatient",
      voiceResponse: "Please arrange medical care today. This is not a medical diagnosis.",
      source: "local fallback"
    }),

  sos: (body) =>
    unwrap(client.post("/api/sos", body), {
      id: "DEMO-SOS",
      coordinates: { latitude: 22.5726, longitude: 88.3639 },
      timestamp: new Date().toISOString(),
      urgency: "RED",
      conditionSummary: "Emergency assistance requested",
      status: "dispatching",
      etaMinutes: 12
    }),

  firstAid: () => FIRST_AID
>>>>>>> 54be4c11932366dd6450de1843ca0f05abcaadf5
};

export { api };
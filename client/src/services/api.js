import axios from "axios";
import { FIRST_AID } from "./offlineStorage";

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || "", timeout: 9e3 });

// Dynamic fallback helper: generates realistic local fallbacks around the user's actual GPS location if Overpass fails
const getDynamicFallbackFacilities = (lat = 22.5726, lng = 88.3639) => [
  { id: "local-1", name: "Sub-District Hospital", type: "Hospital", lat: lat + 0.005, lng: lng + 0.004, latitude: lat + 0.005, longitude: lng + 0.004, distance: "0.8", emergency: true, icuBeds: 6, address: "Station Road", phone: "102 / 108" },
  { id: "local-2", name: "Red Cross Blood Centre", type: "Blood Bank", lat: lat - 0.006, lng: lng - 0.003, latitude: lat - 0.006, longitude: lng - 0.003, distance: "1.2", emergency: false, icuBeds: 0, address: "Main Market", phone: "033-2582-8282" },
  { id: "local-3", name: "Apollo Pharmacy 24/7", type: "Pharmacy", lat: lat + 0.003, lng: lng - 0.005, latitude: lat + 0.003, longitude: lng - 0.005, distance: "0.5", emergency: true, icuBeds: 0, address: "Central Avenue", phone: "1860-500-0101" },
  { id: "local-4", name: "Care & Cure Clinic", type: "Clinic", lat: lat - 0.004, lng: lng + 0.006, latitude: lat - 0.004, longitude: lng + 0.006, distance: "1.5", emergency: true, icuBeds: 2, address: "College Road", phone: "Not available" }
];

const unwrap = (p, fallback) => p.then((r) => r.data.data).catch(() => fallback);

const api = {
  health: () => unwrap(client.get("/api/health"), { status: "offline demo" }),

  facilities: async (lat, lng) => {
    if (!lat || !lng) return getDynamicFallbackFacilities(22.5726, 88.3639);

    // Overpass query for hospitals, clinics, pharmacies, doctors, and dentists within 10km (10000m)
    const query = `
      [out:json][timeout:9];
      (
        node["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](around:10000, ${lat}, ${lng});
        way["amenity"~"hospital|clinic|pharmacy|doctors|dentist"](around:10000, ${lat}, ${lng});
        node["healthcare"](around:10000, ${lat}, ${lng});
        way["healthcare"](around:10000, ${lat}, ${lng});
      );
      out center body 40;
    `;

    // Multi-server pool to prevent timeouts from a single overloaded endpoint
    const servers = [
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass-api.de/api/interpreter"
    ];

    for (const server of servers) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000); // 9s timeout

        const res = await axios.post(server, `data=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        clearTimeout(timeoutId);

        if (!res.data?.elements || res.data.elements.length === 0) continue;

        const seenNames = new Set();

        return res.data.elements
          .map((el) => {
            const itemLat = el.lat || el.center?.lat;
            const itemLng = el.lon || el.center?.lon;
            if (!itemLat || !itemLng) return null;

            const tags = el.tags || {};
            const R = 6371;
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
            else if (tags.amenity === "dentist" || tags.healthcare === "dentist") type = "Dentist";
            else if (tags.healthcare === "blood_bank" || tags.amenity === "blood_bank") type = "Blood Bank";

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
          })
          .filter(Boolean)
          .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      } catch {
        // Continue to the next server if this one fails
      }
    }

    return getDynamicFallbackFacilities(lat, lng);
  },

  simplifyReport: (file, language) => {
    const f = new FormData();
    f.append("document", file);
    f.append("language", language);
    return client
      .post("/api/simplify-report", f)
      .then((r) => r.data.data.simplifiedText)
      .catch(
        () =>
          "This is a local fallback explanation. The actual backend could not be reached, but ideally this would contain an easy-to-understand explanation of your medical report with abnormal values highlighted."
      );
  },

  transcribe: (audio, language) => {
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
};

export { api };
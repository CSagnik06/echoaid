import { useCallback, useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarHeart,
  ChevronRight,
  Droplet,
  FileText,
  HeartPulse,
  Map,
  MapPin,
  Mic,
  Pill,
  Play,
  ShieldAlert,
  Square,
  Stethoscope
} from "lucide-react";

import { Navbar } from "./components/common/Navbar";
import { AccessibilitySettings } from "./components/common/AccessibilitySettings";
import { LanguageSelector } from "./components/voice/LanguageSelector";
import { VoiceWaveform } from "./components/voice/VoiceWaveform";
import { TriageCard } from "./components/triage/TriageCard";
import { NeonMap } from "./components/map/NeonMap";
import { HospitalDrawer } from "./components/map/HospitalDrawer";
import { BloodStockCounter } from "./components/map/BloodStockCounter";
import { SosButton } from "./components/emergency/SosButton";
import { EmergencyTracker } from "./components/emergency/EmergencyTracker";
import { FirstAidList } from "./components/firstaid/FirstAidList";
import { StepByStepCard } from "./components/firstaid/StepByStepCard";
import { ReportSimplifier } from "./components/reports/ReportSimplifier";
import { HealthTracker } from "./components/health/HealthTracker";
import { MedicineSafety } from "./components/medicines/MedicineSafety";
import { MedicineReminderWatcher } from "./components/medicines/MedicineReminderWatcher";
import { WomensHealth } from "./components/womensHealth/WomensHealth";
import { api } from "./services/api";
import { cacheFirstAid, getFirstAid } from "./services/offlineStorage";
import { useGeolocation } from "./hooks/useGeolocation";
import { useVoiceRecorder } from "./hooks/useVoiceRecorder";
import { useVoiceSynthesis } from "./hooks/useVoiceSynthesis";
import { useSocket } from "./hooks/useSocket";

// Route path constants — single source of truth
const PATHS = {
  dashboard: "/",
  voiceCheck: "/voice-check",
  facilities: "/facilities",
  bloodBank: "/blood-bank",
  firstAid: "/first-aid",
  reportReader: "/report-reader",
  sos: "/sos",
  healthTracker: "/health-tracker",
  medicineSafety: "/medicine-safety",
  womensHealth: "/womens-health"
};

// Backward-compat: child components that still pass view-name strings
const VIEW_TO_PATH = {
  "Dashboard":      "/",
  "Voice Check":    "/voice-check",
  "Voice Triage":   "/voice-check",
  "Facilities":     "/facilities",
  "Emergency Map":  "/facilities",
  "Blood Bank":     "/blood-bank",
  "First Aid":      "/first-aid",
  "Report Reader":  "/report-reader",
  "Medical Reports":"/report-reader",
  "SOS Response":   "/sos",
  "Health Tracker": "/health-tracker",
  "Medicine Safety":"/medicine-safety",
  "Women's Health": "/womens-health"
};

// Feature card definitions [label, description, Icon, path, colorClass]
const features = [
  ["AI Health Check",   "Describe symptoms and receive thoughtful guidance.",           Mic,          PATHS.voiceCheck,     "blue"],
  ["Nearby Facilities", "Find hospitals and emergency care near you.",                  Map,          PATHS.facilities,     "green"],
  ["Emergency SOS",     "Request urgent support with your location.",                  ShieldAlert,  PATHS.sos,            "red"],
  ["Blood Bank",        "Live blood inventory and availability.",                       Droplet,      PATHS.bloodBank,      "red"],
  ["Report Simplifier", "Understand complex medical jargon with AI.",                   FileText,     PATHS.reportReader,   "purple"],
  ["Health Tracker",    "Track your health and recovery progress over time.",           HeartPulse,   PATHS.healthTracker,  "green"],
  ["Medicine Safety",   "Understand medicine uses, side effects and important safety.", Pill,         PATHS.medicineSafety, "amber"],
  ["Women's Health",    "Track your cycle, symptoms and women's health over time.",     CalendarHeart,PATHS.womensHealth,   "blue"],
  ["Offline First Aid", "Essential emergency guides, ready when offline.",              BookOpen,     PATHS.firstAid,       "amber"]
];

// ---------------------------------------------------------------------------
// Page components — defined inline to share App-level state via props
// ---------------------------------------------------------------------------

function DashboardPage({ language, setLanguage, triage, geo, voice, processing, text, setText, record, showVoice, doConsultationStep, navigate }) {
  return (
    <>
      <section className="hero-section">
        <div className="hero-badge">✦ AI-powered emergency guidance</div>
        <h1>Healthcare guidance<br /><em>when you need it.</em></h1>
        <p>Describe symptoms by voice or text. SANJEEVANI provides AI-assisted guidance, emergency support, and nearby care when every moment matters.</p>
        <p className="hero-disclaimer">Guidance only — not a replacement for professional medical diagnosis.</p>
        <div className="hero-actions">
          <button className="button primary" onClick={() => record(false)} disabled={processing}>
            <Mic size={18} />
            {voice.recording ? "Stop & analyze" : "Start Voice Check"}
            <ChevronRight size={16} />
          </button>
          <button className="button secondary" onClick={showVoice}>
            <Stethoscope size={18} />
            Describe symptoms
          </button>
        </div>
        <LanguageSelector onChange={setLanguage} value={language} />
      </section>

      <section className="voice-card" aria-label="Voice and text symptom input">
        <div className="voice-card-copy">
          <span className="section-kicker">YOUR HEALTH CHECK</span>
          <h2>Tell us what you're feeling</h2>
          <p>Speak naturally or type a few details below. We'll guide you through the next best step.</p>
        </div>
        <div className="voice-card-action">
          <VoiceWaveform state={processing ? "processing" : voice.recording ? "recording" : "idle"} />
          <button
            className="mic-button"
            onClick={() => record(false)}
            disabled={processing}
            aria-label={voice.recording ? "Stop voice recording" : "Start voice check"}
          >
            {voice.recording ? <Square size={19} /> : <Mic size={20} />}
          </button>
        </div>
        <div className="symptom-input">
          <label htmlFor="symptoms">Describe your symptoms</label>
          <div>
            <input
              id="symptoms"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doConsultationStep(text)}
              placeholder="For example, I feel dizzy and have chest discomfort…"
            />
            <button className="button healthcare" onClick={() => doConsultationStep(text)} disabled={processing}>
              <Play size={15} />
              Analyze
            </button>
          </div>
          {voice.error && <small className="error">{voice.error}</small>}
        </div>
      </section>

      {triage && <TriageCard result={triage} />}

      <section className="feature-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">CARE AT A GLANCE</span>
            <h2>Support beyond the check-in</h2>
          </div>
          <span>{geo?.error ? "Location fallback active" : "Location ready"} <MapPin size={15} /></span>
        </div>
        <div className="feature-grid">
          {features.map(([title, description, Icon, path, color]) => (
            <button className="feature-card" key={title} onClick={() => navigate(path)}>
              <span className={`feature-icon ${color}`}><Icon size={21} /></span>
              <ChevronRight className="feature-arrow" size={18} />
              <h3>{title}</h3>
              <p>{description}</p>
              <small><i className={color} /> Ready now</small>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function VoiceCheckPage({ language, setLanguage, triage, geo, voice, processing, text, setText, record, showVoice, doConsultationStep, navigate }) {
  // Voice check shares the same UI as dashboard — reuse
  return (
    <DashboardPage
      language={language}
      setLanguage={setLanguage}
      triage={triage}
      geo={geo}
      voice={voice}
      processing={processing}
      text={text}
      setText={setText}
      record={record}
      showVoice={showVoice}
      doConsultationStep={doConsultationStep}
      navigate={navigate}
    />
  );
}

function FacilitiesPage({ facilities, geo, selected, setSelected, filterType, setFilterType, searchQuery, setSearchQuery }) {
  const displayFacilities = facilities.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "All" || f.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <section className="directory-view">
      <header className="page-heading">
        <span className="section-kicker">CARE DIRECTORY</span>
        <h1>Nearby healthcare facilities</h1>
        <p>Real-time hospitals, clinics, emergency centers, and pharmacies within 10 km of your location.</p>
      </header>

      <div className="facility-filters" style={{ display: "flex", gap: "10px", marginBottom: "20px", maxWidth: "800px", width: "100%" }}>
        <input
          type="text"
          placeholder="Search facilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: "10px 15px", flex: 1, borderRadius: "8px", border: "1px solid #d8d2c8", fontSize: "1rem", background: "#fff", color: "#1f1f1f" }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: "10px 15px", borderRadius: "8px", border: "1px solid #d8d2c8", fontSize: "1rem", background: "#fff", color: "#1f1f1f" }}
        >
          <option value="All">All Types</option>
          <option value="Hospital">Hospitals</option>
          <option value="Clinic">Clinics</option>
          <option value="Pharmacy">Pharmacies</option>
          <option value="Blood Bank">Blood Banks</option>
        </select>
      </div>

      <div className="facility-layout">
        <div className="facility-list">
          {displayFacilities.length === 0 ? (
            <p style={{ padding: "20px", textAlign: "center", color: "#817b72" }}>
              Searching for healthcare facilities in your 10 km radius...
            </p>
          ) : (
            displayFacilities.map((facility) => (
              <button key={facility.id} className="facility-card" onClick={() => setSelected(facility)}>
                <div>
                  <b>{facility.name}</b>
                  <small>{facility.type} · {facility.distance} km away</small>
                </div>
                <span className="availability">{facility.emergency ? "Emergency available" : "Standard care"}</span>
                <p>{facility.icuBeds || 0} ICU beds available</p>
                <span className="card-link">View route & details <ChevronRight size={15} /></span>
              </button>
            ))
          )}
        </div>
        <div style={{ minWidth: "0", width: "100%", flex: "1", minHeight: "550px" }}>
          <NeonMap facilities={displayFacilities} onSelect={setSelected} position={geo} selected={selected} />
          <HospitalDrawer facility={selected} onClose={() => setSelected(undefined)} userPosition={geo} />
        </div>
      </div>
    </section>
  );
}

function SosPage({ geo, triage, alert, sos }) {
  return (
    <section className="sos-view">
      <header className="page-heading centered">
        <span className="section-kicker emergency-text">EMERGENCY ASSISTANCE</span>
        <h1>Help is one step away.</h1>
        <p>Share your location with our simulated response system. In a real emergency, call <b>112</b> immediately.</p>
      </header>
      <div className="sos-layout">
        <section className="sos-intro">
          <span className="sos-icon"><ShieldAlert size={30} /></span>
          <h2>Emergency SOS</h2>
          <p>Request immediate assistance and share your current location with the response team.</p>
          <SosButton geo={geo} onConfirm={sos} />
        </section>
        <EmergencyTracker alert={alert} />
      </div>
    </section>
  );
}

function FirstAidPage({ guide, setGuide }) {
  return (
    <section className="firstaid-view">
      <header className="page-heading">
        <span className="section-kicker">OFFLINE KNOWLEDGE CENTER</span>
        <h1>Emergency first-aid guides</h1>
        <p>Quick, step-by-step guidance for common emergency situations — available even offline.</p>
      </header>
      <div className="firstaid-grid">
        <FirstAidList guides={getFirstAid()} onSelect={setGuide} />
        <StepByStepCard guide={guide} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Root App component — owns all shared state, sets up routes
// ---------------------------------------------------------------------------

export default function App() {
  const navigate = useNavigate();

  // Application state (NOT routing state — routing is React Router's job)
  const [language, setLanguage]     = useState("English");
  const [triage, setTriage]         = useState(undefined);
  const [facilities, setFacilities] = useState([]);
  const [selected, setSelected]     = useState(undefined);
  const [alert, setAlert]           = useState(undefined);
  const [guide, setGuide]           = useState(getFirstAid()[0]);
  const [text, setText]             = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [online, setOnline]         = useState(navigator.onLine);

  const geo    = useGeolocation();
  const voice  = useVoiceRecorder();
  const tts    = useVoiceSynthesis();
  const onSocket = useCallback((nextAlert) => setAlert(nextAlert), []);
  const socket = useSocket(onSocket);
  const lastCoordRef = useRef(null);

  // Facilities loader
  useEffect(() => {
    cacheFirstAid();
    const lat = geo?.latitude || 22.5726;
    const lng = geo?.longitude || 88.3639;
    if (
      lastCoordRef.current &&
      Math.abs(lastCoordRef.current.lat - lat) < 0.001 &&
      Math.abs(lastCoordRef.current.lng - lng) < 0.001
    ) return;
    lastCoordRef.current = { lat, lng };
    api.facilities(lat, lng).then((data) => {
      if (data && data.length > 0) {
        setFacilities(data);
        setSelected((prev) => prev || data[0]);
      }
    });
  }, [geo?.latitude, geo?.longitude]);

  // Online/offline detector
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Multi-turn voice consultation step
  const doConsultationStep = async (value) => {
    if (!value.trim()) return;
    setProcessing(true);
    setText("");
    const newHistory = [...chatHistory, { role: "user", parts: [{ text: value }] }];
    setChatHistory(newHistory);
    navigate(PATHS.voiceCheck);

    try {
      const result = await api.voiceConsultation(newHistory, language);
      setTriage(result);
      const updatedHistory = [...newHistory, { role: "model", parts: [{ text: result.spokenResponse }] }];
      setChatHistory(updatedHistory);
      setProcessing(false);
      tts.speak(result.spokenResponse, language, () => {
        if (!result.isFinalVerdict) record(true);
      });
    } catch {
      setProcessing(false);
    }
  };

  // Voice recorder toggle
  const record = async (forceStart = false) => {
    if (forceStart || !voice.recording) {
      const langMap = { English:"en-IN", Hindi:"hi-IN", Bengali:"bn-IN", Marathi:"mr-IN", Gujarati:"gu-IN", Telugu:"te-IN", Tamil:"ta-IN" };
      await voice.start(langMap[language] || "en-IN");
      return;
    }
    setProcessing(true);
    const result = await voice.stop();
    if (result) {
      if (result instanceof Blob) {
        try {
          const transcribed = await api.transcribe(result, language);
          await doConsultationStep(transcribed.text);
        } catch { setProcessing(false); }
      } else {
        await doConsultationStep(result);
      }
    } else {
      setProcessing(false);
    }
  };

  // SOS trigger
  const sos = async () => {
    const nextAlert = await api.sos({
      latitude: geo?.latitude,
      longitude: geo?.longitude,
      urgency: triage?.alertLevel || "RED",
      conditionSummary: triage?.summary || "Emergency assistance requested"
    });
    setAlert(nextAlert);
    navigate(PATHS.sos);
  };

  // Focus symptom input on voice check page
  const showVoice = () => {
    navigate(PATHS.voiceCheck);
    setTimeout(() => document.getElementById("symptoms")?.focus(), 0);
  };

  // Shared page props
  const dashProps = { language, setLanguage, triage, geo, voice, processing, text, setText, record, showVoice, doConsultationStep, navigate };

  return (
    <div className="app-shell">
      <MedicineReminderWatcher />
      <AccessibilitySettings />
      <Navbar online={online && !!socket} />

      <main className="page-shell">
        <Routes>
          <Route path={PATHS.dashboard}     element={<DashboardPage   {...dashProps} />} />
          <Route path={PATHS.voiceCheck}    element={<VoiceCheckPage  {...dashProps} />} />
          <Route path={PATHS.facilities}    element={
            <FacilitiesPage
              facilities={facilities}
              geo={geo}
              selected={selected}
              setSelected={setSelected}
              filterType={filterType}
              setFilterType={setFilterType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          } />
          <Route path={PATHS.sos}           element={<SosPage geo={geo} triage={triage} alert={alert} sos={sos} />} />
          <Route path={PATHS.bloodBank}     element={<BloodStockCounter facilities={facilities} />} />
          <Route path={PATHS.reportReader}  element={<ReportSimplifier language={language} />} />
          <Route path={PATHS.healthTracker} element={<HealthTracker onNavigate={(v) => navigate(VIEW_TO_PATH[v] ?? v)} />} />
          <Route path={PATHS.medicineSafety}element={<MedicineSafety  onNavigate={(v) => navigate(VIEW_TO_PATH[v] ?? v)} />} />
          <Route path={PATHS.womensHealth}  element={<WomensHealth    onNavigate={(v) => navigate(VIEW_TO_PATH[v] ?? v)} />} />
          <Route path={PATHS.firstAid}      element={<FirstAidPage guide={guide} setGuide={setGuide} />} />
          {/* Catch-all: unknown URLs redirect to dashboard */}
          <Route path="*" element={<Navigate to={PATHS.dashboard} replace />} />
        </Routes>
      </main>
    </div>
  );
}
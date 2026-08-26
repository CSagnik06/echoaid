import { useCallback, useEffect, useRef, useState } from "react";
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

const features = [
  ["AI Health Check", "Describe symptoms and receive thoughtful guidance.", Mic, "Voice Triage", "blue"],
  ["Nearby Facilities", "Find hospitals and emergency care near you.", Map, "Facilities", "green"],
  ["Emergency SOS", "Request urgent support with your location.", ShieldAlert, "SOS Response", "red"],
  ["Blood Bank", "Live blood inventory and availability.", Droplet, "Blood Bank", "red"],
  ["Report Simplifier", "Understand complex medical jargon with AI.", FileText, "Medical Reports", "purple"],
  ["Health Tracker", "Track your health and recovery progress over time.", HeartPulse, "Health Tracker", "green"],
  ["Medicine Safety", "Understand medicine uses, side effects and important safety information.", Pill, "Medicine Safety", "amber"],
  ["Women's Health", "Track your cycle, symptoms and women's health over time.", CalendarHeart, "Women's Health", "blue"],
  ["Offline First Aid", "Essential emergency guides, ready when offline.", BookOpen, "First Aid", "amber"]
];

export default function App() {
  const [view, setView] = useState("Dashboard");
  const [language, setLanguage] = useState("English");
  const [triage, setTriage] = useState();
  const [facilities, setFacilities] = useState([]);
  const [selected, setSelected] = useState();
  const [alert, setAlert] = useState();
  const [guide, setGuide] = useState(getFirstAid()[0]);
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [online, setOnline] = useState(navigator.onLine);

  const geo = useGeolocation();
  const voice = useVoiceRecorder();
  const tts = useVoiceSynthesis();
  const onSocket = useCallback((nextAlert) => setAlert(nextAlert), []);
  const socket = useSocket(onSocket);
  const lastCoordRef = useRef(null);

  // Fetch real facilities within 10km radius of the user's location
  useEffect(() => {
    cacheFirstAid();
    const lat = geo?.latitude || 22.5726;
    const lng = geo?.longitude || 88.3639;

    if (
      lastCoordRef.current &&
      Math.abs(lastCoordRef.current.lat - lat) < 0.001 &&
      Math.abs(lastCoordRef.current.lng - lng) < 0.001
    ) {
      return;
    }

    lastCoordRef.current = { lat, lng };
    api.facilities(lat, lng).then((data) => {
      if (data && data.length > 0) {
        setFacilities(data);
        setSelected((prev) => prev || data[0]);
      }
    });
  }, [geo?.latitude, geo?.longitude]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const doTriage = async (value) => {
    if (!value.trim()) return;
    setProcessing(true);
    setText(value);
    const result = await api.triage(value, language);
    setTriage(result);
    setProcessing(false);
    setView("Voice Triage");
    tts.speak(result.voiceResponse, language);
  };

  const record = async () => {
    if (!voice.recording) {
      const langMap = {
        English: "en-IN",
        Hindi: "hi-IN",
        Bengali: "bn-IN",
        Marathi: "mr-IN",
        Gujarati: "gu-IN",
        Telugu: "te-IN",
        Tamil: "ta-IN"
      };
      await voice.start(langMap[language] || "en-IN");
      return;
    }
    setProcessing(true);
    const result = await voice.stop();
    if (result) {
      if (result instanceof Blob) {
        try {
          const transcribed = await api.transcribe(result, language);
          await doTriage(transcribed.text);
        } catch {
          setProcessing(false);
        }
      } else {
        await doTriage(result);
      }
    } else {
      setProcessing(false);
    }
  };

  const sos = async () => {
    const nextAlert = await api.sos({
      latitude: geo?.latitude,
      longitude: geo?.longitude,
      urgency: triage?.alertLevel || "RED",
      conditionSummary: triage?.summary || "Emergency assistance requested"
    });
    setAlert(nextAlert);
    setView("SOS Response");
  };

  const showVoice = () => {
    setView("Voice Triage");
    setTimeout(() => document.getElementById("symptoms")?.focus(), 0);
  };

  const handleNavigate = (newView) => {
    setView(newView);
    if (newView === "Dashboard") {
      setTriage(undefined);
      setText("");
    }
  };

  return (
    <div className="app-shell">
      <MedicineReminderWatcher />
      <AccessibilitySettings />
      <Navbar activeView={view} onNavigate={handleNavigate} online={online && socket} />
      
      <main className="page-shell">
        {(view === "Dashboard" || view === "Voice Triage" || view === "Voice Check") && (
          <>
            <section className="hero-section">
              <div className="hero-badge">✦ AI-powered emergency guidance</div>
              <h1>Healthcare guidance<br /><em>when you need it.</em></h1>
              <p>Describe symptoms by voice or text. SANJEEVANI provides AI-assisted guidance, emergency support, and nearby care when every moment matters.</p>
              <p className="hero-disclaimer">Guidance only — not a replacement for professional medical diagnosis.</p>
              <div className="hero-actions">
                <button className="button primary" onClick={record} disabled={processing}>
                  <Mic size={18} />
                  {voice.recording ? "Stop & analyze" : "Start Voice Check"}
                  <ChevronRight size={16} />
                </button>
                <button className="button secondary" onClick={showVoice}>
                  <Stethoscope size={18} />
                  Describe symptoms
                </button>
              </div>
              <LanguageSelector value={language} onChange={setLanguage} />
            </section>

            <section className="voice-card" aria-label="Voice and text symptom input">
              <div className="voice-card-copy">
                <span className="section-kicker">YOUR HEALTH CHECK</span>
                <h2>Tell us what you’re feeling</h2>
                <p>Speak naturally or type a few details below. We’ll guide you through the next best step.</p>
              </div>
              <div className="voice-card-action">
                <VoiceWaveform state={processing ? "processing" : voice.recording ? "recording" : "idle"} />
                <button className="mic-button" onClick={record} disabled={processing} aria-label={voice.recording ? "Stop voice recording" : "Start voice check"}>
                  {voice.recording ? <Square size={19} /> : <Mic size={20} />}
                </button>
              </div>
              <div className="symptom-input">
                <label htmlFor="symptoms">Describe your symptoms</label>
                <div>
                  <input
                    id="symptoms"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && doTriage(text)}
                    placeholder="For example, I feel dizzy and have chest discomfort…"
                  />
                  <button className="button healthcare" onClick={() => doTriage(text)} disabled={processing}>
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
                {features.map(([title, description, Icon, destination, color]) => (
                  <button className="feature-card" key={title} onClick={() => setView(destination)}>
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
        )}

        {(view === "Facilities" || view === "Emergency Map") && (() => {
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
                  <NeonMap facilities={displayFacilities} position={geo} onSelect={setSelected} selected={selected} />
                  <HospitalDrawer facility={selected} onClose={() => setSelected(undefined)} userPosition={geo} />
                </div>
              </div>
            </section>
          );
        })()}

        {view === "SOS Response" && (
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
        )}

        {view === "Blood Bank" && <BloodStockCounter facilities={facilities} />}
        {view === "Medical Reports" && <ReportSimplifier language={language} />}
        {view === "Health Tracker" && <HealthTracker onNavigate={handleNavigate} />}
        {view === "Medicine Safety" && <MedicineSafety onNavigate={handleNavigate} />}
        {view === "Women's Health" && <WomensHealth onNavigate={handleNavigate} />}

        {view === "First Aid" && (
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
        )}

        {view === "System Status" && (
          <section className="system-card">
            <span className="section-kicker">SYSTEM STATUS</span>
            <h1>Everything is ready when you are.</h1>
            <div className="system-grid">
              <p><i /> API live & fallback-safe</p>
              <p><i /> GPS {geo?.error ? "fallback active" : "calibrated"}</p>
              <p><i /> Voice recorder {window.MediaRecorder ? "available" : "unavailable"}</p>
              <p><i /> Socket {socket ? "connected" : "local demo"}</p>
            </div>
            <p className="disclaimer">Demo mode keeps SANJEEVANI useful without a database, API key, GPS, microphone, or socket connection.</p>
          </section>
        )}
      </main>
    </div>
  );
}
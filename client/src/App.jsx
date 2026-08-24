import { useCallback, useEffect, useState } from "react";
import { BookOpen, ChevronRight, HeartPulse, Map, MapPin, Mic, Play, ShieldAlert, Square, Stethoscope } from "lucide-react";
import { Navbar } from "./components/common/Navbar";
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
import { api } from "./services/api";
import { cacheFirstAid, getFirstAid } from "./services/offlineStorage";
import { useGeolocation } from "./hooks/useGeolocation";
import { useVoiceRecorder } from "./hooks/useVoiceRecorder";
import { useSocket } from "./hooks/useSocket";

const features = [
  ["AI Health Check", "Describe symptoms and receive thoughtful guidance.", Mic, "Voice Triage", "blue"],
  ["Nearby Facilities", "Find hospitals and emergency care near you.", Map, "Emergency Map", "green"],
  ["Emergency SOS", "Request urgent support with your location.", ShieldAlert, "SOS Response", "red"],
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
  const [online, setOnline] = useState(navigator.onLine);
  const geo = useGeolocation();
  const voice = useVoiceRecorder();
  const onSocket = useCallback((nextAlert) => setAlert(nextAlert), []);
  const socket = useSocket(onSocket);

  useEffect(() => { cacheFirstAid(); api.facilities(geo.latitude, geo.longitude).then(setFacilities); }, [geo.latitude, geo.longitude]);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
  const doTriage = async (value) => { if (!value.trim()) return; setProcessing(true); setText(value); const result = await api.triage(value, language); setTriage(result); setProcessing(false); setView("Voice Triage"); };
  const record = async () => { if (!voice.recording) { await voice.start(); return; } setProcessing(true); const audio = await voice.stop(); if (audio) { const result = await api.transcribe(audio, language); await doTriage(result.text); } else setProcessing(false); };
  const sos = async () => { const nextAlert = await api.sos({ latitude: geo.latitude, longitude: geo.longitude, urgency: triage?.urgency_score || "RED", conditionSummary: triage?.condition_summary || "Emergency assistance requested" }); setAlert(nextAlert); setView("SOS Response"); };
  const showVoice = () => { setView("Voice Triage"); setTimeout(() => document.getElementById("symptoms")?.focus(), 0); };

  return <div className="app-shell">
    <Navbar activeView={view} onNavigate={setView} online={online && socket} />
    <main className="page-shell">
      {(view === "Dashboard" || view === "Voice Triage") && <>
        <section className="hero-section">
          <div className="hero-badge">✦ AI-powered emergency guidance</div>
          <h1>Healthcare guidance<br /><em>when you need it.</em></h1>
          <p>Describe symptoms by voice or text. SANJEEVANI provides AI-assisted guidance, emergency support, and nearby care when every moment matters.</p>
          <p className="hero-disclaimer">Guidance only — not a replacement for professional medical diagnosis.</p>
          <div className="hero-actions"><button className="button primary" onClick={record} disabled={processing}><Mic size={18} />{voice.recording ? "Stop & analyze" : "Start Voice Check"}<ChevronRight size={16} /></button><button className="button secondary" onClick={showVoice}><Stethoscope size={18} />Describe symptoms</button></div>
          <LanguageSelector value={language} onChange={setLanguage} />
        </section>
        <section className="voice-card" aria-label="Voice and text symptom input">
          <div className="voice-card-copy"><span className="section-kicker">YOUR HEALTH CHECK</span><h2>Tell us what you’re feeling</h2><p>Speak naturally or type a few details below. We’ll guide you through the next best step.</p></div>
          <div className="voice-card-action"><VoiceWaveform state={processing ? "processing" : voice.recording ? "recording" : "idle"} /><button className="mic-button" onClick={record} disabled={processing} aria-label={voice.recording ? "Stop voice recording" : "Start voice check"}>{voice.recording ? <Square size={19} /> : <Mic size={20} />}</button></div>
          <div className="symptom-input"><label htmlFor="symptoms">Describe your symptoms</label><div><input id="symptoms" value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => event.key === "Enter" && doTriage(text)} placeholder="For example, I feel dizzy and have chest discomfort…" /><button className="button healthcare" onClick={() => doTriage(text)} disabled={processing}><Play size={15} />Analyze</button></div>{voice.error && <small className="error">{voice.error}</small>}</div>
        </section>
        {triage ? <TriageCard result={triage} /> : <section className="feature-section"><div className="section-heading"><div><span className="section-kicker">CARE AT A GLANCE</span><h2>Support beyond the check-in</h2></div><span>{geo.error ? "Kolkata demo location" : "Location ready"} <MapPin size={15} /></span></div><div className="feature-grid">{features.map(([title, description, Icon, destination, color]) => <button className="feature-card" key={title} onClick={() => setView(destination)}><span className={`feature-icon ${color}`}><Icon size={21} /></span><ChevronRight className="feature-arrow" size={18} /><h3>{title}</h3><p>{description}</p><small><i className={color} /> Ready now</small></button>)}</div></section>}
      </>}
      {view === "Emergency Map" && <section className="directory-view"><header className="page-heading"><span className="section-kicker">CARE DIRECTORY</span><h1>Nearby healthcare facilities</h1><p>Find hospitals, emergency services, and blood banks near your current location.</p></header><div className="facility-layout"><div className="facility-list">{facilities.map((facility) => <button key={facility.id} className="facility-card" onClick={() => setSelected(facility)}><div><b>{facility.name}</b><small>{facility.type} · {facility.distance} km away</small></div><span className="availability">{facility.emergency ? "Emergency available" : "Limited services"}</span><p>{facility.icuBeds} ICU beds available</p><span className="card-link">View details <ChevronRight size={15} /></span></button>)}</div><div><NeonMap facilities={facilities} position={geo} onSelect={setSelected} /><HospitalDrawer facility={selected} onClose={() => setSelected(undefined)} /></div></div><BloodStockCounter facility={selected || facilities[0]} /></section>}
      {view === "SOS Response" && <section className="sos-view"><header className="page-heading centered"><span className="section-kicker emergency-text">EMERGENCY ASSISTANCE</span><h1>Help is one step away.</h1><p>Share your location with our simulated response system. In a real emergency, call <b>112</b> immediately.</p></header><div className="sos-layout"><section className="sos-intro"><span className="sos-icon"><ShieldAlert size={30} /></span><h2>Emergency SOS</h2><p>Request immediate assistance and share your current location with the response team.</p><SosButton onConfirm={sos} /></section><EmergencyTracker alert={alert} /></div>{facilities[0] && <BloodStockCounter facility={facilities.find((facility) => facility.type === "Blood Bank") || facilities[0]} />}</section>}
      {view === "First Aid" && <section className="firstaid-view"><header className="page-heading"><span className="section-kicker">OFFLINE KNOWLEDGE CENTER</span><h1>Emergency first-aid guides</h1><p>Quick, step-by-step guidance for common emergency situations — available even offline.</p></header><div className="firstaid-grid"><FirstAidList guides={getFirstAid()} onSelect={setGuide} /><StepByStepCard guide={guide} /></div></section>}
      {view === "System Status" && <section className="system-card"><span className="section-kicker">SYSTEM STATUS</span><h1>Everything is ready when you are.</h1><div className="system-grid"><p><i /> API fallback-safe</p><p><i /> GPS {geo.error ? "demo active" : "available"}</p><p><i /> Voice recorder {window.MediaRecorder ? "available" : "unavailable"}</p><p><i /> Socket {socket ? "connected" : "local demo"}</p></div><p className="disclaimer">Demo mode keeps SANJEEVANI useful without a database, API key, GPS, microphone, or socket connection.</p></section>}
    </main>
  </div>;
}

import { useCallback, useEffect, useState } from "react";
import { BookOpen, HeartPulse, Map, Mic, Radio, Settings, Siren, MapPin, Play, Square } from "lucide-react";
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
const nav = [["Dashboard", HeartPulse], ["Voice Triage", Mic], ["Emergency Map", Map], ["SOS Response", Siren], ["First Aid", BookOpen], ["System Status", Settings]];
function App() {
  const [view, setView] = useState("Dashboard"), [language, setLanguage] = useState("English"), [triage, setTriage] = useState(), [facilities, setFacilities] = useState([]), [selected, setSelected] = useState(), [alert, setAlert] = useState(), [guide, setGuide] = useState(getFirstAid()[0]), [text, setText] = useState(""), [processing, setProcessing] = useState(false), [online, setOnline] = useState(navigator.onLine);
  const geo = useGeolocation(), voice = useVoiceRecorder();
  const onSocket = useCallback((a) => setAlert(a), []);
  const socket = useSocket(onSocket);
  useEffect(() => {
    cacheFirstAid();
    api.facilities(geo.latitude, geo.longitude).then(setFacilities);
  }, [geo.latitude, geo.longitude]);
  useEffect(() => {
    const up = () => setOnline(navigator.onLine);
    window.addEventListener("online", up);
    window.addEventListener("offline", up);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", up);
    };
  }, []);
  const doTriage = async (value) => {
    if (!value.trim()) return;
    setProcessing(true);
    setText(value);
    const r = await api.triage(value, language);
    setTriage(r);
    setProcessing(false);
    setView("Voice Triage");
  };
  const record = async () => {
    if (!voice.recording) {
      await voice.start();
      return;
    }
    setProcessing(true);
    const audio = await voice.stop();
    if (audio) {
      const r = await api.transcribe(audio, language);
      await doTriage(r.text);
    } else setProcessing(false);
  };
  const sos = async () => {
    const a = await api.sos({ latitude: geo.latitude, longitude: geo.longitude, urgency: triage?.urgency_score || "RED", conditionSummary: triage?.condition_summary || "Emergency assistance requested" });
    setAlert(a);
    setView("SOS Response");
  };
  return <div className="app-shell"><nav className="rail" aria-label="Primary navigation">{nav.map(([name, Icon]) => <button key={name} className={view === name ? "active" : ""} onClick={() => setView(name)} aria-label={name}><Icon size={21} /><span>{name}</span></button>)}</nav><aside className="context"><div className="brand"><div className="brand-mark">S</div><div><b>SANJEEVANI</b><small>HEALTH COMMAND</small></div></div><div className="context-block"><label>LOCATION</label><p><MapPin size={14} /> {geo.error ? "Kolkata \xB7 demo" : `${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}`}</p></div><div className="context-block"><label>EMERGENCY READINESS</label><p className="ready"><i /> System standing by</p></div><div className="context-block"><label>QUICK ACCESS</label>{[["Start voice check", "Voice Triage"], ["Nearest facilities", "Emergency Map"], ["Offline procedures", "First Aid"]].map(([a, b]) => <button key={a} onClick={() => setView(b)}>{a}<span>›</span></button>)}</div><div className="context-note"><Radio size={14} /> {socket ? "Connected to response channel" : "Response channel in local demo mode"}</div></aside><main><Navbar title={view} online={online && socket} gps={!geo.error} language={language} /><div className="workspace">{(view === "Dashboard" || view === "Voice Triage") && <><section className="hero panel"><div className="hero-copy"><span className="eyebrow">VOICE-FIRST AI TRIAGE</span><h1>{view === "Dashboard" ? "How can we help?" : "Voice assessment"}</h1><p>Describe symptoms in your preferred language. Sanjeevani provides conservative guidance, never a diagnosis.</p><LanguageSelector value={language} onChange={setLanguage} /></div><div className="voice-console"><VoiceWaveform state={processing ? "processing" : voice.recording ? "recording" : "idle"} /><button className="mic-button" onClick={record} disabled={processing} aria-label={voice.recording ? "Stop voice recording" : "Start voice check"}>{voice.recording ? <Square /> : <Mic />}</button><button className="primary-action" onClick={record} disabled={processing}>{voice.recording ? "Stop & analyse" : "Start Voice Check"}</button>{voice.error && <small className="error">{voice.error}</small>}</div></section><section className="text-triage panel"><label>OR TYPE A SYMPTOM DESCRIPTION</label><div><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doTriage(text)} placeholder="e.g. I feel dizzy and have chest discomfort" /><button onClick={() => doTriage(text)} disabled={processing}><Play size={15} /> Assess</button></div></section>{triage ? <TriageCard result={triage} /> : view === "Dashboard" && <div className="status-cards">{[["AI Triage Status", "Ready for symptom assessment", "blue", Mic], ["Nearby Facilities", `${facilities.length || "\u2026"} facilities in range`, "green", Map], ["Emergency SOS", "One-tap tactical dispatch", "red", Siren], ["Offline First Aid", "5 essential procedures saved", "cyan", BookOpen]].map(([a, b, c, Icon]) => {
    const I = Icon;
    return <button className="status-card" key={a} onClick={() => setView(a === "Nearby Facilities" ? "Emergency Map" : a === "Emergency SOS" ? "SOS Response" : a === "Offline First Aid" ? "First Aid" : "Voice Triage")}><I /><div><b>{a}</b><small>{b}</small></div><i className={c} /></button>;
  })}</div>}</>}{view === "Emergency Map" && <div className="map-view"><div className="map-header"><div><span className="eyebrow">EMERGENCY COORDINATION</span><h1>Nearby response network</h1></div><button className="outline" onClick={geo.refresh}>Refresh GPS</button></div><NeonMap facilities={facilities} position={geo} onSelect={setSelected} /><HospitalDrawer facility={selected} onClose={() => setSelected(void 0)} /><BloodStockCounter facility={selected || facilities[0]} /></div>}{view === "SOS Response" && <div className="sos-view"><section className="sos-intro panel"><span className="eyebrow red-text">EMERGENCY RESPONSE</span><h1>Request immediate help</h1><p>This demonstrator sends your location to an in-app simulated response channel. In a real emergency, call <b>112</b> immediately.</p><SosButton onConfirm={sos} /></section><EmergencyTracker alert={alert} />{facilities[0] && <BloodStockCounter facility={facilities.find((x) => x.type === "Blood Bank") || facilities[0]} />}</div>}{view === "First Aid" && <div className="firstaid-view"><div className="map-header"><div><span className="eyebrow">AVAILABLE OFFLINE</span><h1>First-aid procedures</h1></div></div><div className="firstaid-grid"><FirstAidList guides={getFirstAid()} onSelect={setGuide} /><StepByStepCard guide={guide} /></div></div>}{view === "System Status" && <section className="panel system"><span className="eyebrow">SYSTEM STATUS</span><h1>Operational readiness</h1><div className="system-grid"><p><i className="status-dot" /> API fallback-safe</p><p><i className="status-dot" /> GPS {geo.error ? "demo active" : "available"}</p><p><i className="status-dot" /> Voice recorder {window.MediaRecorder ? "available" : "unavailable"}</p><p><i className="status-dot" /> Socket {socket ? "connected" : "local demo"}</p></div><p className="disclaimer">Demo mode keeps the interface usable without MongoDB, AI API keys, GPS, microphone, or a socket connection.</p></section>}</div></main></div>;
}
export {
  App as default
};

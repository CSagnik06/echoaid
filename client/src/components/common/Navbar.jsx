import { Activity, HeartPulse, Menu, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
const items = [
  ["Dashboard", "Dashboard"], 
  ["Voice Check", "Voice Triage"], 
  ["Facilities", "Facilities"], 
  ["Blood Bank", "Blood Bank"], 
  ["First Aid", "First Aid"],
  ["Report Reader", "Medical Reports"]
];
export function Navbar({ activeView, onNavigate, online }) {
  const [open, setOpen] = useState(false);
  const navigate = (view) => { onNavigate(view); setOpen(false); };
  return <header className="site-nav"><div className="nav-inner"><button className="brand" onClick={() => navigate("Dashboard")} aria-label="Go to Sanjeevani dashboard"><span className="brand-icon"><HeartPulse size={20} /></span><span><b>SANJEEVANI</b><small>HEALTH COMPANION</small></span></button><nav className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">{items.map(([label, view]) => <button key={view} className={activeView === view ? "active" : ""} onClick={() => navigate(view)}>{label}</button>)}</nav><div className="nav-actions"><span className={online ? "connection live" : "connection"}><Activity size={14} />{online ? "Online" : "Demo mode"}</span><button className={activeView === "SOS Response" ? "nav-sos active" : "nav-sos"} onClick={() => navigate("SOS Response")}><ShieldAlert size={16} /> SOS</button><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button></div></div></header>;
}

import { Activity, MapPin, Mic, WifiOff } from "lucide-react";
function Navbar({ title, online, gps, language }) {
  return <header className="topbar"><div><strong>{title}</strong><span className="crumb"> / SANJEEVANI</span></div><div className="statusline"><span className={online ? "online" : "offline"}><Activity size={14} />{online ? "LIVE" : "DEMO"}</span><span><MapPin size={14} />{gps ? "GPS READY" : "GPS DEMO"}</span><span><Mic size={14} /> {language}</span>{!online && <WifiOff size={14} />}</div></header>;
}
export {
  Navbar
};

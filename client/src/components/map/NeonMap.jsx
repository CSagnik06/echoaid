import { Cross, Navigation } from "lucide-react";
function NeonMap({ facilities, position, onSelect }) {
  return <div className="neon-map" aria-label="Simulated tactical emergency map"><div className="map-grid" /><div className="route-line" /><div className="user-marker" style={{ left: "43%", top: "53%" }}><Navigation size={15} /><span>YOU</span></div><div className="ambulance">✚</div>{facilities.slice(0, 7).map((f, i) => <button className="facility-marker" key={f.id} style={{ left: `${18 + i * 19 % 72}%`, top: `${22 + i * 29 % 60}%` }} onClick={() => onSelect(f)} aria-label={`View ${f.name}`}><Cross size={15} /><span>{f.name.split(" ")[0]}</span></button>)}<div className="map-label">TACTICAL MAP · {position.latitude.toFixed(3)}, {position.longitude.toFixed(3)} · DEMO MODE</div></div>;
}
export {
  NeonMap
};

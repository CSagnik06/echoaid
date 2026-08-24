import { Phone, Route, X } from "lucide-react";
function HospitalDrawer({ facility, onClose }) {
  if (!facility) return null;
  return <aside className="hospital-drawer"><button className="icon-button close" onClick={onClose} aria-label="Close facility details"><X /></button><small>{facility.type.toUpperCase()} · {facility.distance} KM AWAY</small><h2>{facility.name}</h2><p>{facility.address}</p><div className="facility-stats"><b>{facility.emergency ? "24/7 EMERGENCY" : "LIMITED SERVICES"}</b><b>{facility.icuBeds} ICU BEDS</b></div><div className="drawer-actions"><a href={`tel:${facility.phone}`}><Phone size={16} /> Call facility</a><button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`, "_blank")}><Route size={16} /> Route</button></div></aside>;
}
export {
  HospitalDrawer
};

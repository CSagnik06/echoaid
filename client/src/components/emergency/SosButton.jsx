import { useState } from "react";
import { Siren } from "lucide-react";
function SosButton({ onConfirm, disabled }) {
  const [confirm, setConfirm] = useState(false);
  return <div className="sos-wrap">{confirm && <p>Confirm emergency alert? This sends your location to the demo dispatch system.</p>}<button className={`sos-button ${confirm ? "confirm" : ""}`} disabled={disabled} onClick={() => confirm ? onConfirm() : setConfirm(true)}><Siren size={22} />{confirm ? "CONFIRM SOS" : "SEND SOS"}</button>{confirm && <button className="text-button" onClick={() => setConfirm(false)}>Cancel</button>}</div>;
}
export {
  SosButton
};

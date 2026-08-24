import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
const meta = { GREEN: [CheckCircle2, "Low urgency \u2014 monitor symptoms"], YELLOW: [AlertTriangle, "Needs medical assessment"], RED: [ShieldAlert, "Emergency \u2014 act now"] };
function UrgencyMeter({ urgency }) {
  const [Icon, text] = meta[urgency];
  return <div className={`urgency ${urgency.toLowerCase()}`}><Icon size={20} /><div><b>{urgency} URGENCY</b><small>{text}</small></div></div>;
}
export {
  UrgencyMeter
};

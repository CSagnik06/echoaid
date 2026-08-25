import { UrgencyMeter } from "./UrgencyMeter";
function TriageCard({ result }) {
  return <section className="panel triage-card"><div className="panel-head"><span>AI TRIAGE RESULT {result.urgencyTitle ? `- ${result.urgencyTitle}` : ''}</span><small>{result.source === "gemini" ? "AI-assisted" : "Safety fallback"}</small></div><UrgencyMeter urgency={result.alertLevel} /><p className="summary">{result.summary}</p><div className="two-col"><div><label>IMMEDIATE ACTIONS</label><ol>{result.immediateActions?.map((x) => <li key={x}>{x}</li>)}</ol></div><div><label>RECOMMENDED CARE</label><p>{result.recommendedCare}</p><label>VOICE RESPONSE · {result.detectedLanguage}</label><p>{result.voiceResponse}</p></div></div><p className="disclaimer">This tool does not diagnose or replace professional medical care. For life-threatening symptoms, call 112 now.</p></section>;
}
export {
  TriageCard
};

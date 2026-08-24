import { UrgencyMeter } from "./UrgencyMeter";
function TriageCard({ result }) {
  return <section className="panel triage-card"><div className="panel-head"><span>AI TRIAGE RESULT</span><small>{result.source === "gemini" ? "AI-assisted" : "Safety fallback"}</small></div><UrgencyMeter urgency={result.urgency_score} /><p className="summary">{result.condition_summary}</p><div className="two-col"><div><label>IMMEDIATE ACTIONS</label><ol>{result.immediate_actions.map((x) => <li key={x}>{x}</li>)}</ol></div><div><label>RECOMMENDED CARE</label><p>{result.suggested_facility_type}</p><label>VOICE RESPONSE · {result.detected_language}</label><p>{result.voice_response_text}</p></div></div><p className="disclaimer">This tool does not diagnose or replace professional medical care. For life-threatening symptoms, call 112 now.</p></section>;
}
export {
  TriageCard
};

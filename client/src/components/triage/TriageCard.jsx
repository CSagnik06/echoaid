import { UrgencyMeter } from "./UrgencyMeter";
import { Loader2 } from "lucide-react";

function TriageCard({ result }) {
  const isInProgress = result.alertLevel === "IN_PROGRESS" || !result.isFinalVerdict;
  
  if (isInProgress) {
    return (
      <section className="panel triage-card">
        <div className="panel-head" style={{ marginBottom: "16px" }}>
          <span>AI DOCTOR CONSULTATION</span>
          <small>In Progress</small>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fdfcfb", border: "1px solid #d8d2c8", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
          <Loader2 className="spinner" size={24} style={{ color: "#2f7cc0", animation: "spin 1s linear infinite" }} />
          <div>
            <b style={{ display: "block", fontSize: "14px" }}>AI Doctor is speaking / listening...</b>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#4a453e" }}>"{result.spokenResponse}"</p>
          </div>
        </div>
        <p className="summary" style={{ fontSize: "13px", color: "#817b72" }}>{result.summary}</p>
      </section>
    );
  }

  // Final Verdict
  return (
    <section className="panel triage-card">
      <div className="panel-head">
        <span>FINAL TRIAGE RESULT</span>
        <small>AI-assisted</small>
      </div>
      <UrgencyMeter urgency={result.alertLevel} />
      <p className="summary" style={{ fontWeight: 600, color: "#1f1f1f", fontSize: "16px" }}>{result.summary}</p>
      
      <div className="two-col" style={{ marginTop: "24px" }}>
        <div>
          <label>IMMEDIATE ACTIONS</label>
          <ul style={{ paddingLeft: "18px", marginTop: "8px" }}>
            {result.immediateActions?.map((obs, idx) => (
              <li key={idx} style={{ marginBottom: "8px", fontSize: "14px", color: "#4a453e" }}>{obs}</li>
            ))}
          </ul>
        </div>
        <div>
          <label>RECOMMENDED ACTION</label>
          <p style={{ fontSize: "14px", color: "#4a453e", background: "#fdfcfb", border: "1px solid #d8d2c8", padding: "12px", borderRadius: "8px", marginTop: "8px" }}>
            {result.recommendedAction || result.recommendedCare}
          </p>
          <label style={{ marginTop: "16px" }}>DOCTOR'S SUMMARY</label>
          <p style={{ fontSize: "14px", color: "#4a453e", fontStyle: "italic", marginTop: "8px" }}>"{result.spokenResponse || result.voiceResponse}"</p>
        </div>
      </div>
      
      <p className="disclaimer" style={{ marginTop: "24px" }}>
        This tool does not diagnose or replace professional medical care. For life-threatening symptoms, call 112 now.
      </p>
    </section>
  );
}

export { TriageCard };

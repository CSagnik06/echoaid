import { useState } from "react";
import { Search } from "lucide-react";
function FirstAidList({ guides, onSelect }) {
  const [q, setQ] = useState("");
  const filtered = guides.filter((x) => `${x.title} ${x.category}`.toLowerCase().includes(q.toLowerCase()));
  return <section className="panel guide-list"><div className="search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search emergency guides" aria-label="Search first aid guides" /></div>{filtered.map((g) => <button key={g.title} onClick={() => onSelect(g)}><span className={`dot ${g.urgency.toLowerCase()}`} /><div><b>{g.title}</b><small>{g.category}</small></div><em>{g.urgency}</em></button>)}</section>;
}
export {
  FirstAidList
};

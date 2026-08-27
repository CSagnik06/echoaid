import { useState } from "react";
import { Search } from "lucide-react";
import { FIRST_AID_SEARCH_ALIASES } from "../../services/offlineStorage";
import { searchFirstAid } from "../../services/firstAidSearch";

function FirstAidList({ guides, onSelect }) {
  const [query, setQuery] = useState("");
  const results = searchFirstAid(guides, query, FIRST_AID_SEARCH_ALIASES);
  return <section className="panel guide-list"><div className="search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search first aid or describe the problem..." aria-label="Search first aid guides; spelling mistakes and problem descriptions are supported" /></div>{results.map(guide => <button key={guide.title} onClick={() => onSelect(guide)}><span className={`dot ${guide.urgency.toLowerCase()}`} /><div><b>{guide.title}</b><small>{guide.category}</small></div><em>{guide.urgency}</em></button>)}{query.trim() && !results.length && <div className="empty"><small>No close First Aid match found. Try describing the main problem with simple words.</small></div>}</section>;
}
export { FirstAidList };

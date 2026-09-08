<<<<<<< HEAD
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Activity, HeartPulse, Menu, ShieldAlert, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/" },
  { label: "Voice Check",  path: "/voice-check" },
  { label: "Facilities",   path: "/facilities" },
  { label: "Blood Bank",   path: "/blood-bank" },
  { label: "First Aid",    path: "/first-aid" },
  { label: "Report Reader",path: "/report-reader" }
];

// Returns true when the current URL pathname matches the nav item's path
function isActive(currentPath, itemPath) {
  if (itemPath === "/") return currentPath === "/";
  return currentPath.startsWith(itemPath);
=======
import { Activity, HeartPulse, LogIn, LogOut, Menu, ShieldAlert, UserRound, X } from "lucide-react";
import { useState } from "react";
const items = [["Dashboard", "Dashboard"], ["Voice Check", "Voice Triage"], ["Facilities", "Emergency Map"], ["Blood Bank", "Blood Bank"], ["First Aid", "First Aid"]];
export function Navbar({ activeView, onNavigate, online, user, isHospitalAdmin, onSignOut }) {
  const [open, setOpen] = useState(false);
  const navigate = (view) => { onNavigate(view); setOpen(false); };
  return <header className="site-nav"><div className="nav-inner"><button className="brand" onClick={() => navigate("Dashboard")} aria-label="Go to Sanjeevani dashboard"><span className="brand-icon"><HeartPulse size={20} /></span><span><b>SANJEEVANI</b><small>HEALTH COMPANION</small></span></button><nav className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">{items.map(([label, view]) => <button key={view} className={activeView === view ? "active" : ""} onClick={() => navigate(view)}>{label}</button>)}{isHospitalAdmin && <button className={activeView === "Admin" ? "active" : ""} onClick={() => navigate("Admin")}>Admin</button>}</nav><div className="nav-actions"><span className={online ? "connection live" : "connection"}><Activity size={14} />{online ? "Online" : "Demo mode"}</span>{user ? <><button className="text-button" onClick={() => navigate(isHospitalAdmin ? "Admin" : "Health Tracker")}><UserRound size={15} />{isHospitalAdmin ? "Admin" : "Account"}</button><button className="text-button" onClick={onSignOut}><LogOut size={15} />Sign Out</button></> : <button className="text-button" onClick={() => navigate("Sign In")}><LogIn size={15} />Sign In</button>}<button className="nav-sos" onClick={() => navigate("SOS Response")}><ShieldAlert size={16} /> SOS</button><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button></div></div></header>;
>>>>>>> f401b151c89a6f6a4b9be2675f99e040043ae4ac
}

export function Navbar({ online }) {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const go = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <header className="site-nav">
      <div className="nav-inner">
        {/* Brand / logo */}
        <button className="brand" onClick={() => go("/")} aria-label="Go to Sanjeevani dashboard">
          <span className="brand-icon"><HeartPulse size={20} /></span>
          <span><b>SANJEEVANI</b><small>HEALTH COMPANION</small></span>
        </button>

        {/* Main nav links */}
        <nav className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={isActive(pathname, item.path) ? "active" : ""}
              onClick={() => go(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right-side actions */}
        <div className="nav-actions">
          <span className={online ? "connection live" : "connection"}>
            <Activity size={14} />
            {online ? "Online" : "Demo mode"}
          </span>
          <button
            className={isActive(pathname, "/sos") ? "nav-sos active" : "nav-sos"}
            onClick={() => go("/sos")}
          >
            <ShieldAlert size={16} /> SOS
          </button>
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
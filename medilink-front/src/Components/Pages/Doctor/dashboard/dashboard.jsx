import { useState, useEffect } from "react";
import api from "../../../../api/axios";
import PatientSidebar from "../sidebar/side";
import { useNavigate, useLocation } from "react-router-dom";
import useLogout from "../../../../hooks/useLogout";
import useDarkMode from "../../../../contexts/DarkModeContext";

const navItems = [
  { icon: "dashboard", label: "Dashboard", path: "/doctor/dashboard" },
  { icon: "groups", label: "Patients", path: "/doctor/scan-qr" },
  { icon: "chat", label: "Messages", path: "/doctor/messages" },
  { icon: "settings", label: "Settings", path: "/doctor/settings" },
];

const statConfig = [
  { key: "patients_accessed", icon: "person_search", label: "Total Patients Accessed", iconBg: "#eff6ff", iconColor: "#2463eb" },
  { key: "recent_scans", icon: "barcode_scanner", label: "Recent Scans (30 days)", iconBg: "#f5f3ff", iconColor: "#7c3aed" },
  { key: "prescriptions", icon: "medication", label: "Prescriptions Issued", iconBg: "#fffbeb", iconColor: "#d97706" },
];

const schedule = [
  { time: "10:30 AM", name: "Linda Thompson", type: "Follow-up Exam", active: true },
  { time: "11:15 AM", name: "Thomas Miller", type: "Lab Results Review", active: false },
  { time: "01:00 PM", name: "Sarah Jenkins", type: "Consultation", active: false },
  { time: "02:30 PM", name: "Robert Wilson", type: "MRI Review", active: false },
];

const tips = [
  "Remember to review the new clinical guidelines for hypertension management.",
  "Ensure all patient records are updated before end of shift.",
  "New cardiology protocols are available in the resources section.",
];

function Icon({ name, size = 20, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>
        {time.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800 }}>
        {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = useLogout();
  const [dark, setDark] = useDarkMode();
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ patients_accessed: 0, recent_scans: 0, prescriptions: 0 });
  const [activities, setActivities] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [consultModal, setConsultModal] = useState(false);
  const [consultName, setConsultName] = useState("");
  const [consultAdded, setConsultAdded] = useState(false);
  const [openActivity, setOpenActivity] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);

  const bg = dark ? "#0f172a" : "#f1f5f9";
  const card = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "#334155" : "#e2e8f0";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const sidebarBg = dark ? "#0f172a" : "#ffffff";
  const rowHover = dark ? "#243044" : "#f8fafc";

  const filteredActivities = activities.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.location.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    let mounted = true;
    api.get("/me")
      .then(res => {
        if (!mounted) return;
        setDoctor(res.data);
      })
      .catch(err => {
        console.error("Failed to load doctor profile:", err);
      })
      .finally(() => {
        if (mounted) setLoadingDoctor(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    api.get("/doctor/dashboard")
      .then(res => {
        if (!mounted) return;
        setStats(res.data.stats || { patients_accessed: 0, recent_scans: 0, prescriptions: 0 });
        setActivities(res.data.activity || []);
      })
      .catch(err => {
        console.error("Failed to load dashboard:", err);
      })
      .finally(() => {
        if (mounted) setLoadingDashboard(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleAddConsult = () => {
    if (!consultName.trim()) return;
    const newActivity = {
      id: "local_" + Date.now(),
      icon: "add_circle",
      color: "#2463eb",
      bg: "#eff6ff",
      title: "New Consultation:",
      name: consultName,
      time: "Just now",
      location: "Cardiology Suite",
    };
    setActivities(prev => [newActivity, ...prev]);
    setConsultAdded(true);
    setConsultName("");
    setTimeout(() => { setConsultModal(false); setConsultAdded(false); }, 1500);
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: bg, fontFamily: "'DM Sans', sans-serif", color: text, transition: "all 0.3s" }}>

        {/* Sidebar */}
        <aside style={{ width: 260, background: sidebarBg, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px 16px", flexShrink: 0, transition: "all 0.3s" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
              <div style={{ background: "#eff6ff", borderRadius: 10, padding: "9px", display: "flex" }}>
                <Icon name="medical_services" size={22} style={{ color: "#2463eb" }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px", color: "#2463eb" }}>MediLink</div>
                <div style={{ fontSize: 11, color: muted }}>Medical Professional</div>
              </div>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {navItems.map(item => {
                const isActive = location.pathname === item.path || (item.path === "/doctor/scan-qr" && location.pathname.startsWith("/doctor/patient"));
                return (
                  <button key={item.label} onClick={() => navigate(item.path)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: isActive ? "#2463eb" : "transparent", color: isActive ? "#fff" : muted, fontWeight: 600, fontSize: 14, transition: "all 0.2s", textAlign: "left" }}>
                    <Icon name={item.icon} size={20} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <button onClick={() => setConsultModal(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#2463eb", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 20px #2463eb30", marginBottom: 20 }}>
              <Icon name="add_circle" size={18} style={{ color: "#fff" }} />
              New Consultation
            </button>
            <div style={{ paddingTop: 20, borderTop: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#2463eb20", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2463eb", fontSize: 14, flexShrink: 0 }}>
                {doctor ? doctor.name.split(" ").map(n => n[0]).join("") : "DR"}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {doctor ? doctor.name : "Loading..."}
                </div>
                <div style={{ fontSize: 11, color: muted }}>
                  {doctor?.role ? doctor.role.charAt(0).toUpperCase() + doctor.role.slice(1) : "Medical Professional"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => setDark(!dark)} style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex" }}>
                  <Icon name={dark ? "light_mode" : "dark_mode"} size={18} />
                </button>
                <button onClick={handleLogout} title="Logout" style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex" }}>
                  <Icon name="logout" size={18} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>

          {/* Header */}
          <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: dark ? "#0f172a99" : "#ffffff99", backdropFilter: "blur(12px)", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
            <div style={{ position: "relative", width: 380 }}>
              <Icon name="search" size={17} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: muted }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search patients, records, or files..."
                style={{ width: "100%", background: dark ? "#1e293b" : "#f1f5f9", border: "none", borderRadius: 10, padding: "9px 14px 9px 38px", fontSize: 13, color: text, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button style={{ padding: "8px", background: dark ? "#1e293b" : "#f1f5f9", border: "none", borderRadius: 9, cursor: "pointer", color: muted, display: "flex", position: "relative" }}>
                <Icon name="notifications" size={20} />
                <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, background: "#ef4444", borderRadius: "50%", border: "2px solid white" }} />
              </button>
              <button style={{ padding: "8px", background: dark ? "#1e293b" : "#f1f5f9", border: "none", borderRadius: 9, cursor: "pointer", color: muted, display: "flex" }}>
                <Icon name="chat_bubble" size={20} />
              </button>
              <div style={{ width: 1, height: 24, background: border, margin: "0 6px" }} />
              <Clock />
            </div>
          </header>

          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }}>

            {/* Welcome */}
            <div>
              <h2 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: 28, letterSpacing: "-0.6px" }}>
                Welcome {doctor ? `, ${doctor.name.split(" ")[0]}` : ""}
              </h2>
              <p style={{ margin: 0, color: muted, fontSize: 14 }}>
                {loadingDoctor ? "Loading your practice overview..." : "Here is what's happening with your practice today."}
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
              {statConfig.map((s, i) => (
                <div key={s.key} style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "22px", display: "flex", flexDirection: "column", gap: 14, transition: "all 0.2s", cursor: "default" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ background: s.iconBg, borderRadius: 12, padding: 10, display: "flex" }}>
                      <Icon name={s.icon} size={22} style={{ color: s.iconColor }} />
                    </div>
                    {loadingDashboard && (
                      <div style={{ width: 40, height: 20, background: border, borderRadius: 6 }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: muted, fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-1px" }}>
                      {loadingDashboard ? "—" : (stats[s.key] ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity + Schedule */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>

              {/* Activity Feed */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Recent Activity Feed</h3>
                  <button style={{ background: "none", border: "none", color: "#2463eb", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>View All</button>
                </div>
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, overflow: "hidden" }}>
                  {loadingDashboard ? (
                    <div style={{ padding: "28px", textAlign: "center", color: muted, fontSize: 13 }}>Loading activity...</div>
                  ) : filteredActivities.length === 0 ? (
                    <div style={{ padding: "28px", textAlign: "center", color: muted, fontSize: 13 }}>No activity yet. Access patients via QR or issue prescriptions to see activity here.</div>
                  ) : filteredActivities.map((a, i) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < filteredActivities.length - 1 ? `1px solid ${border}` : "none", transition: "background 0.15s", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = rowHover}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name={a.icon} size={20} style={{ color: a.color }} />
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          <span style={{ fontWeight: 800 }}>{a.title}</span> {a.name}
                        </div>
                        <div style={{ fontSize: 11, color: muted }}>{a.time} · {a.location}</div>
                      </div>
                      <button onClick={() => setOpenActivity(a)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex", transition: "color 0.15s", padding: 6, borderRadius: 6 }}
                        onMouseEnter={e => e.currentTarget.style.color = "#2463eb"}
                        onMouseLeave={e => e.currentTarget.style.color = muted}>
                        <Icon name="open_in_new" size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Schedule */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Today's Schedule</h3>
                  <button style={{ background: "none", border: "none", color: "#2463eb", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Full Calendar</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {schedule.map((s, i) => (
                    <div key={i} style={{ background: card, border: `1px solid ${s.active ? "#2463eb40" : border}`, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, transition: "all 0.2s", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                      <div style={{ width: 3, background: s.active ? "#2463eb" : border, borderRadius: 999, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: s.active ? "#2463eb" : muted, textTransform: "uppercase", marginBottom: 2 }}>{s.time}</div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: muted }}>{s.type}</div>
                      </div>
                    </div>
                  ))}

                  {/* Daily Tip */}
                  <div style={{ background: dark ? "#1a2744" : "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
                    <Icon name="lightbulb" size={28} style={{ color: "#2463eb" }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: "#2463eb", marginBottom: 4 }}>Daily Tip</div>
                      <div style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>{tips[tipIndex]}</div>
                    </div>
                    <button onClick={() => setTipIndex((tipIndex + 1) % tips.length)}
                      style={{ background: "none", border: "none", color: "#2463eb", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Next Tip →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* New Consultation Modal */}
      {consultModal && (
        <div onClick={() => setConsultModal(false)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 32, width: 420, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            {consultAdded ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Icon name="check_circle" size={28} style={{ color: "#16a34a" }} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Consultation Added!</div>
                <div style={{ color: muted, fontSize: 13 }}>Activity feed has been updated.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>New Consultation</h2>
                  <button onClick={() => setConsultModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><Icon name="close" size={20} /></button>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6 }}>Patient Name</div>
                  <input value={consultName} onChange={e => setConsultName(e.target.value)}
                    placeholder="Enter patient name..."
                    onKeyDown={e => e.key === "Enter" && handleAddConsult()}
                    style={{ width: "100%", background: dark ? "#0f172a" : "#f8fafc", border: `1.5px solid ${border}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, color: text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setConsultModal(false)} style={{ flex: 1, padding: "12px", border: `1.5px solid ${border}`, borderRadius: 10, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleAddConsult} style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px #2463eb30" }}>Start Consultation</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Activity Detail Modal */}
      {openActivity && (
        <div onClick={() => setOpenActivity(null)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 32, width: 400, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Activity Detail</h2>
              <button onClick={() => setOpenActivity(null)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><Icon name="close" size={20} /></button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: openActivity.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={openActivity.icon} size={24} style={{ color: openActivity.color }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{openActivity.name}</div>
                <div style={{ fontSize: 13, color: muted }}>{openActivity.title.replace(":", "")}</div>
              </div>
            </div>
            {[["Time", openActivity.time], ["Location", openActivity.location], ["Action", openActivity.title.replace(":", "")]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: dark ? "#0f172a" : "#f8fafc", borderRadius: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: muted }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            <button onClick={() => setOpenActivity(null)} style={{ width: "100%", marginTop: 8, padding: "12px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Open Full Record
            </button>
          </div>
        </div>
      )}
    </>
  );
}
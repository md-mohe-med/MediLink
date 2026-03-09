import { useState, useEffect } from "react";
import Sidebar from "../sidebar/sidebar";
import api from "../../../../api/axios";
import useDarkMode from "../../../../contexts/DarkModeContext";

const iconMap = {
  "Total Patients": "person",
  "Total Doctors": "medical_services",
  "Total Labs": "biotech",
  "Total Uploads": "cloud_upload",
  "Active QR Codes": "qr_code_2",
};

const activityIconMap = {
  patient: { icon: "person_add", color: "blue" },
  doctor: { icon: "medical_services", color: "emerald" },
  lab: { icon: "upload_file", color: "amber" },
  default: { icon: "update", color: "slate" },
};

const colorMap = {
  blue: { bg: "#eff6ff", icon: "#2563eb" },
  emerald: { bg: "#ecfdf5", icon: "#059669" },
  amber: { bg: "#fffbeb", icon: "#d97706" },
  purple: { bg: "#f5f3ff", icon: "#7c3aed" },
  rose: { bg: "#fff1f2", icon: "#e11d48" },
  slate: { bg: "#f1f5f9", icon: "#475569" },
};

const uptimeBars = [60, 80, 70, 90, 85];
const apiBars = [40, 30, 50, 45, 35];

function Icon({ name, size = 22, style = {} }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>{name}</span>;
}

export default function AdminDashboard() {
  const [dark, setDark] = useDarkMode();
  const [stats, setStats] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError("");
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/activity"),
        ]);

        if (!mounted) return;

        // Map backend stats to the format the UI expects
        const mappedStats = (statsRes.data.stats || []).map(s => ({
          icon: iconMap[s.label] || "info",
          label: s.label,
          value: Number(s.value).toLocaleString(),
          change: "",
          up: true,
        }));
        setStats(mappedStats);

        // Map backend activities to the format the UI expects
        const mappedActivities = (activityRes.data.activities || []).map(a => {
          const mapping = activityIconMap[a.iconClass] || activityIconMap.default;
          return {
            icon: a.icon ? "person_add" : mapping.icon,
            color: mapping.color,
            title: a.event,
            desc: a.desc,
            time: a.time,
          };
        });
        setActivityFeed(mappedActivities);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load admin dashboard:", err);
        setError("Unable to load dashboard data. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const bg = dark ? "#0f172a" : "#f6f6f8";
  const card = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "#334155" : "#e2e8f0";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const inputBg = dark ? "#1e293b" : "#f1f5f9";
  const hoverRow = dark ? "#1e293b80" : "#f8fafc";
  const sidebarBg = dark ? "#0f172a" : "#ffffff";

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", minHeight: "100vh", background: bg, fontFamily: "'DM Sans', sans-serif", color: text, transition: "all 0.3s" }}>

        <Sidebar dark={dark} setDark={setDark} />

        <main style={{ flex: 1, marginLeft: 240, overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* Header */}
          <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: sidebarBg, borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 10 }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
              <Icon name="search" size={20} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: muted }} />
              <input placeholder="Search system logs, users, or medical records..."
                style={{ width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 8, paddingBottom: 8, background: inputBg, border: "none", borderRadius: 8, fontSize: 14, color: text, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button style={{ position: "relative", padding: 8, background: "none", border: "none", cursor: "pointer", color: muted, borderRadius: 8 }}>
                <Icon name="notifications" size={24} />
                <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", border: `2px solid ${sidebarBg}` }} />
              </button>
              <button style={{ padding: 8, background: "none", border: "none", cursor: "pointer", color: muted, borderRadius: 8 }}>
                <Icon name="help" size={24} />
              </button>
            </div>
          </header>

          <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Page Title */}
            <div>
              <h2 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.5px", marginBottom: 4 }}>Platform Overview</h2>
              <p style={{ color: muted, fontSize: 15, fontWeight: 500 }}>Real-time system monitoring and health statistics</p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && !error && (
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "16px", color: muted, fontSize: 14, textAlign: "center" }}>
                Loading dashboard data...
              </div>
            )}

            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
              {stats.map((s, i) => (
                <div key={i} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ background: "#2463eb18", borderRadius: 8, padding: 8, display: "flex" }}>
                      <Icon name={s.icon} size={22} style={{ color: "#2463eb" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.up ? "#059669" : "#e11d48", background: s.up ? "#ecfdf5" : "#fff1f2", padding: "3px 8px", borderRadius: 4 }}>{s.change}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: muted, marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 900, color: text }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Activity Feed */}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 17, fontWeight: 800 }}>Recent Activity Feed</h3>
                <button style={{ fontSize: 13, fontWeight: 700, color: "#2463eb", background: "none", border: "none", cursor: "pointer" }}>View All History</button>
              </div>
              {activityFeed.map((item, i) => {
                const c = colorMap[item.color];
                return (
                  <div key={i}
                    style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 16, borderBottom: i < activityFeed.length - 1 ? `1px solid ${border}` : "none", transition: "background 0.15s", cursor: "default" }}
                    onMouseEnter={e => e.currentTarget.style.background = hoverRow}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={item.icon} size={20} style={{ color: c.icon }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: 700 }}>{item.title}</p>
                        <span style={{ fontSize: 12, fontWeight: 500, color: muted }}>{item.time}</span>
                      </div>
                      <p style={{ fontSize: 14, color: muted }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
              <div style={{ padding: 16, background: dark ? "#0f172a80" : "#f8fafc", textAlign: "center" }}>
                <button style={{ padding: "8px 24px", fontSize: 14, fontWeight: 700, background: card, border: `1px solid ${border}`, borderRadius: 8, cursor: "pointer", color: text }}>Load More Activity</button>
              </div>
            </div>

            {/* Footer Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: muted, marginBottom: 4 }}>System Uptime</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: "#10b981" }}>99.99%</p>
                </div>
                <div style={{ height: 48, width: 128, background: "#ecfdf5", borderRadius: 6, display: "flex", alignItems: "flex-end", padding: "4px 8px", gap: 4 }}>
                  {uptimeBars.map((h, i) => <div key={i} style={{ flex: 1, background: "#10b981", height: `${h}%`, borderRadius: "2px 2px 0 0" }} />)}
                </div>
              </div>
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: muted, marginBottom: 4 }}>API Response Time</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: text }}>124ms</p>
                </div>
                <div style={{ height: 48, width: 128, background: "#2463eb18", borderRadius: 6, display: "flex", alignItems: "flex-end", padding: "4px 8px", gap: 4 }}>
                  {apiBars.map((h, i) => <div key={i} style={{ flex: 1, background: "#2463eb", height: `${h}%`, borderRadius: "2px 2px 0 0" }} />)}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
} 
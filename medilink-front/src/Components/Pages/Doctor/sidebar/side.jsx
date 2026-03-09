// components/Sidebar.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../../api/axios";
import useLogout from "../../../../hooks/useLogout";

const navItems = [
  { icon: "dashboard",   label: "Dashboard", path: "/doctor/dashboard" },
  { icon: "groups",      label: "Patients",  path: "/doctor/scan-qr", paths: ["/doctor/scan-qr", "/doctor/patient"] },
  { icon: "chat",        label: "Messages", path: "/doctor/messages" },
  { icon: "settings",    label: "Settings",  path: "/doctor/settings"  },
];

function Icon({ name, size = 20, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

export default function Sidebar({ dark, setDark, onNewConsultation }) {
  const navigate     = useNavigate();
  const location     = useLocation();
  const handleLogout = useLogout();
  const [doctor, setDoctor] = useState(null);

  // Active item is always derived from the real URL — no prop needed
  const activeLabel = navItems.find((item) => {
    const paths = item.paths || [item.path];
    return paths.some((p) => location.pathname.startsWith(p));
  })?.label;

  const border    = dark ? "#334155" : "#e2e8f0";
  const muted     = dark ? "#94a3b8" : "#64748b";
  const sidebarBg = dark ? "#0f172a" : "#ffffff";
  const text      = dark ? "#f1f5f9" : "#0f172a";

  useEffect(() => {
    let mounted = true;
    api.get("/me")
      .then((res) => { if (mounted) setDoctor(res.data); })
      .catch((err) => console.error("Failed to load doctor profile:", err));
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <aside style={{
        width: 260,
        background: sidebarBg,
        borderRight: `1px solid ${border}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "24px 16px",
        flexShrink: 0,
        transition: "all 0.3s",
        fontFamily: "'DM Sans', sans-serif",
        color: text,
      }}>

        {/* ── Logo ── */}
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

          {/* ── Nav items ── */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {navItems.map((item) => {
              const isActive = activeLabel === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}   // ← real navigation
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 14px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? "#2463eb" : "transparent",
                    color: isActive ? "#fff" : muted,
                    fontWeight: 600,
                    fontSize: 14,
                    transition: "all 0.2s",
                    textAlign: "left",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <Icon name={item.icon} size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Bottom: CTA + Profile ── */}
        <div>
          <button
            onClick={onNewConsultation}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "#2463eb",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "13px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 6px 20px #2463eb30",
              marginBottom: 20,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Icon name="add_circle" size={18} style={{ color: "#fff" }} />
            New Consultation
          </button>

          {/* Profile row */}
          <div style={{ paddingTop: 20, borderTop: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "#2463eb20", display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 800, color: "#2463eb",
              fontSize: 14, flexShrink: 0,
            }}>
              {doctor ? doctor.name.split(" ").map((n) => n[0]).join("") : "DR"}
            </div>

            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {doctor ? doctor.name : "Loading..."}
              </div>
              <div style={{ fontSize: 11, color: muted }}>
                {doctor?.role
                  ? doctor.role.charAt(0).toUpperCase() + doctor.role.slice(1)
                  : "Medical Professional"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setDark(!dark)}
                title={dark ? "Light mode" : "Dark mode"}
                style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex" }}
              >
                <Icon name={dark ? "light_mode" : "dark_mode"} size={18} />
              </button>
              <button
                onClick={handleLogout}
                title="Logout"
                style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex" }}
              >
                <Icon name="logout" size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
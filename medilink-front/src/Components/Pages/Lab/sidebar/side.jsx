import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import useLogout from "../../../../hooks/useLogout";

const navItems = [
    { icon: "dashboard", label: "Dashboard", path: "/lab/dashboard" },
    { icon: "cloud_upload", label: "Uploads", path: "/lab/upload" },
    { icon: "settings", label: "Settings", path: "/lab/settings", admin: true },
];

function Icon({ name, size = 20, style = {} }) {
    return (
        <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>
            {name}
        </span>
    );
}

export default function LabSidebar({ dark, setDark, activeNav, setActiveNav }) {
    const [localActiveNav, setLocalActiveNav] = useState("");
    const active = activeNav ?? localActiveNav;
    const setActive = setActiveNav ?? setLocalActiveNav;
    const handleLogout = useLogout();
    const navigate = useNavigate();
    const location = useLocation();

    const border    = dark ? "#334155" : "#dbdee6";
    const muted     = dark ? "#94a3b8" : "#64748b";
    const sidebarBg = dark ? "#0f172a" : "#ffffff";

    return (
        <aside style={{ width: 260, background: sidebarBg, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", flexShrink: 0, transition: "all 0.3s" }}>

            {/* Logo */}
            <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#2463eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="biotech" size={20} style={{ color: "#fff" }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px", color: dark ? "#f1f5f9" : "#0f172a" }}>MediLink Lab</div>
                        <div style={{ fontSize: 11, color: muted }}>General Hospital Branch</div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "14px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
                {navItems.filter(i => !i.admin).map(item => {
                    const isActive = active === item.label || location.pathname === item.path;
                    return (
                        <button key={item.label} onClick={() => { setActive(item.label); navigate(item.path); }}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: isActive ? "#eff6ff" : "transparent", color: isActive ? "#2463eb" : muted, fontWeight: isActive ? 700 : 500, fontSize: 13, transition: "all 0.2s", textAlign: "left" }}>
                            <Icon name={item.icon} size={18} />
                            {item.label}
                        </button>
                    );
                })}

                {/* Administration section */}
                <div style={{ borderTop: `1px solid ${border}`, margin: "10px 0", paddingTop: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 1.5, padding: "0 14px", marginBottom: 6 }}>Administration</div>
                    <button onClick={() => { setActive("Settings"); navigate("/lab/settings"); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: active === "Settings" || location.pathname === "/lab/settings" ? "#eff6ff" : "transparent", color: active === "Settings" || location.pathname === "/lab/settings" ? "#2463eb" : muted, fontWeight: 500, fontSize: 13, transition: "all 0.2s", textAlign: "left", width: "100%" }}>
                        <Icon name="settings" size={18} />
                        Settings
                    </button>
                </div>
            </nav>

            {/* Bottom section */}
            <div style={{ margin: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Logout button — matches admin Sidebar style */}
                <button onClick={handleLogout}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 12, padding: "10px", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Icon name="logout" size={18} />
                    Sign Out
                </button>

                {/* User tile */}
                <div style={{ background: dark ? "#0f172a" : "#f8fafc", border: `1px solid ${border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#2463eb20", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2463eb", fontSize: 13, flexShrink: 0 }}>SC</div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: dark ? "#f1f5f9" : "#0f172a" }}>Dr. Sarah Chen</div>
                        <div style={{ fontSize: 11, color: muted }}>Lab Director</div>
                    </div>
                    <button onClick={() => setDark(!dark)} style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex" }}>
                        <Icon name={dark ? "light_mode" : "dark_mode"} size={16} />
                    </button>
                </div>

            </div>
        </aside>
    );
}
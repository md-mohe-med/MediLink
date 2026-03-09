import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../../api/axios';
import useLogout from '../../../../hooks/useLogout';
import { useState, useEffect } from 'react';

const navItems = [
  { icon: "dashboard", label: "Dashboard", path: "/patient/dashboard" },
  { icon: "calendar_month", label: "Appointments", path: "/patient/appointments" },
  { icon: "description", label: "Medical Records", path: "/patient/records" },
  { icon: "chat_bubble", label: "Messages", path: "/patient/messages" },
  { icon: "settings", label: "Settings", path: "/patient/settings" },
];

function Icon({ name, size = 20, style = {} }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>{name}</span>;
}

export default function PatientSidebar({ dark, setDark }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, profileRes] = await Promise.all([
          api.get('/me'),
          api.get('/patient/profile')
        ]);
        setCurrentUser(userRes.data);
        setProfile(profileRes.data.profile);
      } catch (err) {
        console.error('Failed to fetch user data', err);
      }
    };
    fetchData();
  }, []);

  const border = dark ? "#334155" : "#e2e8f0";
  const muted = dark ? "#94a3b8" : "#64748b";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const sidebarBg = dark ? "#0f172a" : "#ffffff";

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <aside style={{ 
        width: 240, background: sidebarBg, borderRight: `1px solid ${border}`, 
        display: "flex", flexDirection: "column", position: "fixed", 
        top: 0, bottom: 0, left: 0, zIndex: 20, 
        justifyContent: "space-between", padding: "20px 14px", 
        fontFamily: "'DM Sans', sans-serif" 
      }}>
        <div>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#2463eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="medical_services" size={17} style={{ color: "#fff" }} />
            </div>
            <div>
              <span style={{ fontWeight: 900, fontSize: 17, color: "#2463eb", letterSpacing: "-0.3px" }}>MediLink</span>
              <div style={{ fontSize: 11, color: muted, fontWeight: 500 }}>Patient Portal</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              const activeBg = dark ? "rgba(36,99,235,0.15)" : "#eff6ff";
              return (
                <button key={item.label} onClick={() => navigate(item.path)}
                  style={{ 
                    display: "flex", alignItems: "center", gap: 10, 
                    padding: "9px 12px", borderRadius: 9, border: "none", 
                    cursor: "pointer", background: isActive ? activeBg : "transparent", 
                    color: isActive ? "#2463eb" : muted, 
                    fontWeight: isActive ? 700 : 500, fontSize: 13, 
                    transition: "all 0.2s", textAlign: "left", fontFamily: "inherit" 
                  }}>
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom section */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Logout button */}
          <button onClick={logout}
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", 
              gap: 8, background: "transparent", color: "#ef4444", 
              border: "1px solid #fecaca", borderRadius: 12, padding: "10px", 
              fontWeight: 600, fontSize: 13, cursor: "pointer", 
              transition: "all 0.2s", fontFamily: "inherit" 
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Icon name="logout" size={18} />
            Sign Out
          </button>

          {/* User tile */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderTop: `1px solid ${border}`, paddingTop: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#2463eb20", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2463eb", fontSize: 12, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: text }}>
                {currentUser?.name ?? 'Loading...'}
              </div>
              <div style={{ fontSize: 11, color: muted }}>
                {profile?.patient_id ? `ID: ${profile.patient_id}` : 'Patient'}
              </div>
            </div>
            <button onClick={() => setDark && setDark(!dark)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}>
              <Icon name={dark ? "light_mode" : "dark_mode"} size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

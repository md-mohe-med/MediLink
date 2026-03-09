import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const navItems = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "people", label: "Patients" },
  { icon: "qr_code_2", label: "QR Access", active: true },
  { icon: "description", label: "Medical Records" },
  { icon: "settings", label: "Settings" },
];

const SESSION_DURATION = 30 * 60; // 30 minutes in seconds

// Enhanced session ID generator with better randomness
function generateSessionId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part3 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part1}-${part2}-${part3}`;
}

// Generate secure access token
function generateAccessToken() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const sessionId = generateSessionId();
  const payload = btoa(JSON.stringify({
    sessionId: sessionId,
    timestamp: timestamp,
    expires: timestamp + (SESSION_DURATION * 1000),
    patientId: "PAT-001", // This would come from current patient context
    accessLevel: "read_only"
  }));
  return { token: payload, sessionId: sessionId };
}

function QRPattern({ seed, size = 200 }) {
  const grid = 21;
  const cell = size / grid;
  const cells = [];

  // deterministic pattern from seed
  const hash = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  // finder patterns (corners)
  const isFinderPattern = (r, c) => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= grid - 7;
    const inBottomLeft = r >= grid - 7 && c < 7;
    if (inTopLeft || inTopRight || inBottomLeft) {
      const lr = inTopLeft ? r : inBottomLeft ? r - (grid - 7) : r;
      const lc = inTopLeft ? c : inTopRight ? c - (grid - 7) : c;
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    }
    return false;
  };

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const isFinder = isFinderPattern(r, c);
      const isDark = isFinder || ((r * grid + c + hash) % 3 === 0) || ((r + c + hash) % 5 === 0);
      cells.push({ r, c, dark: isDark });
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill="white" rx="4" />
      {cells.map(({ r, c, dark }) =>
        dark ? (
          <rect key={`${r}-${c}`} x={c * cell + 0.5} y={r * cell + 0.5} width={cell - 1} height={cell - 1} fill="#111827" rx="0.5" />
        ) : null
      )}
    </svg>
  );
}

function Icon({ name, size = 20, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

const logs = [
  { time: "10:32 AM", action: "QR Scanned", by: "Dr. Ahmed Raza", location: "Room 204", status: "active" },
  { time: "09:15 AM", action: "Access Granted", by: "Nurse Liu Wei", location: "Reception", status: "active" },
  { time: "Yesterday", action: "QR Generated", by: "Dr. Sarah Chen", location: "Portal", status: "completed" },
  { time: "Yesterday", action: "Session Expired", by: "System", location: "Auto", status: "expired" },
];

export default function QRAccess() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("QR Access");
  const [dark, setDark] = useState(false);
  
  // Initialize with generated session and token
  const initialToken = generateAccessToken();
  const [sessionId, setSessionId] = useState(initialToken.sessionId);
  const [accessToken, setAccessToken] = useState(initialToken.token);
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [revoked, setRevoked] = useState(false);
  const [refreshAnim, setRefreshAnim] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [search, setSearch] = useState("");
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(new Date());

  const bg = dark ? "#0f172a" : "#f1f5f9";
  const card = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "#334155" : "#e2e8f0";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const sidebarBg = dark ? "#0f172a" : "#ffffff";

  // Countdown timer
  useEffect(() => {
    if (revoked || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [revoked, timeLeft]);

  // Simulate backend session management
  useEffect(() => {
    if (timeLeft === 0 && !revoked) {
      // Notify backend that session expired
      console.log("Session expired for:", sessionId);
      // Here you would make an API call to invalidate the session
    }
  }, [timeLeft, revoked, sessionId]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const pct = (timeLeft / SESSION_DURATION) * 100;
  const timerColor = timeLeft > 600 ? "#2463eb" : timeLeft > 180 ? "#d97706" : "#dc2626";

  // Enhanced refresh function with backend integration
  const handleRefresh = useCallback(async () => {
    setRefreshAnim(true);
    setIsLoading(true);
    
    try {
      // Simulate API call to create new session
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Generate new session and token
      const newTokenData = generateAccessToken();
      
      // Update local state
      setSessionId(newTokenData.sessionId);
      setAccessToken(newTokenData.token);
      setTimeLeft(SESSION_DURATION);
      setRevoked(false);
      setLastGenerated(new Date());
      
      // Here you would make actual API calls:
      // await fetch('/api/sessions/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     sessionId: newTokenData.sessionId,
      //     accessToken: newTokenData.token,
      //     patientId: "PAT-001",
      //     expires: Date.now() + (SESSION_DURATION * 1000)
      //   })
      // });
      
      // Add to active sessions for demo
      setActiveSessions(prev => [...prev, {
        id: newTokenData.sessionId,
        token: newTokenData.token,
        created: new Date(),
        expires: new Date(Date.now() + SESSION_DURATION * 1000),
        status: 'active'
      }]);
      
      console.log("New QR Code Generated:", {
        sessionId: newTokenData.sessionId,
        token: newTokenData.token.substring(0, 50) + "...",
        expires: new Date(Date.now() + SESSION_DURATION * 1000)
      });
      
    } catch (error) {
      console.error("Failed to refresh session:", error);
    } finally {
      setRefreshAnim(false);
      setIsLoading(false);
    }
  }, []);

  // Enhanced revoke function with backend integration
  const handleRevoke = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call to revoke session
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setRevoked(true);
      setTimeLeft(0);
      
      // Here you would make actual API call:
      // await fetch(`/api/sessions/${sessionId}/revoke`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // });
      
      // Update active sessions
      setActiveSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'revoked', revoked: new Date() }
            : session
        )
      );
      
    } catch (error) {
      console.error("Failed to revoke session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced share function with token sharing
  const handleShare = async () => {
    try {
      const shareData = {
        sessionId: sessionId,
        accessToken: accessToken,
        expiresAt: Date.now() + (timeLeft * 1000),
        patientName: "John Doe", // This would come from patient data
        accessUrl: `${window.location.origin}/doctor-access?token=${accessToken}`
      };
      
      // Copy to clipboard
      await navigator.clipboard.writeText(JSON.stringify(shareData, null, 2));
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
      
      // Here you could also send via email/SMS
      // await fetch('/api/sessions/share', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(shareData)
      // });
      
    } catch (error) {
      console.error("Failed to share session:", error);
    }
  };

  // Simulate doctor scanning QR (for demo purposes)
  const simulateDoctorAccess = () => {
    const accessData = {
      doctorName: "Dr. Ahmed Raza",
      hospital: "City General Hospital",
      department: "Emergency Medicine",
      licenseNumber: "MD-12345",
      timestamp: new Date().toISOString()
    };
    
    // Add to logs
    const newLog = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: "QR Scanned",
      by: accessData.doctorName,
      location: accessData.department,
      status: "active"
    };
    
    // Navigate to doctor access page with token
    navigate(`/doctor-access?token=${accessToken}&doctor=${encodeURIComponent(accessData.doctorName)}`);
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@500&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: bg, fontFamily: "'DM Sans', sans-serif", color: text, transition: "all 0.3s" }}>

        {/* Sidebar */}
        <aside style={{ width: 220, background: sidebarBg, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px 14px", flexShrink: 0, transition: "all 0.3s" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
              <div style={{ background: "#2463eb", borderRadius: 10, padding: "8px", display: "flex" }}>
                <Icon name="shield" size={18} style={{ color: "#fff" }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.4px" }}>MediLink</div>
                <div style={{ fontSize: 10, color: muted }}>Medical Portal</div>
              </div>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {navItems.map(item => {
                const isActive = activeNav === item.label;
                return (
                  <button key={item.label} onClick={() => setActiveNav(item.label)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: isActive ? "#2463eb15" : "transparent", color: isActive ? "#2463eb" : muted, fontWeight: isActive ? 700 : 500, fontSize: 14, transition: "all 0.2s", textAlign: "left" }}>
                    <Icon name={item.icon} size={18} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: dark ? "#0f172a" : "#f8fafc", border: `1px solid ${border}`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#2463eb20", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2463eb", fontSize: 13, flexShrink: 0 }}>SC</div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Dr. Sarah Chen</div>
              <div style={{ fontSize: 11, color: muted }}>General Physician</div>
            </div>
            <button onClick={() => setDark(!dark)} style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex" }}>
              <Icon name={dark ? "light_mode" : "dark_mode"} size={16} />
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>

          {/* Header */}
          <header style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: dark ? "#0f172a99" : "#ffffff99", backdropFilter: "blur(12px)", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
            <div style={{ position: "relative", width: 360 }}>
              <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: muted }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients or records..."
                style={{ width: "100%", background: dark ? "#1e293b" : "#f1f5f9", border: "none", borderRadius: 10, padding: "9px 14px 9px 36px", fontSize: 13, color: text, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex", position: "relative" }}>
                <Icon name="notifications" size={20} />
                <span style={{ position: "absolute", top: 0, right: 0, width: 7, height: 7, background: "#ef4444", borderRadius: "50%", border: "2px solid white" }} />
              </button>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex" }}>
                <Icon name="help" size={20} />
              </button>
            </div>
          </header>

          <div style={{ padding: "36px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>

            {/* Title */}
            <div style={{ textAlign: "center" }}>
              <h1 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: 28, letterSpacing: "-0.6px" }}>Patient Access QR Code</h1>
              <p style={{ margin: 0, color: muted, fontSize: 14 }}>Generate a temporary, secure access token for onsite medical verification.</p>
              
              {/* Generation Status */}
              <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#10b98120", border: "1px solid #10b98140", borderRadius: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>
                  QR Code Active • Generated {lastGenerated.toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Toast */}
            {showShareToast && (
              <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 10, padding: "11px 18px", display: "flex", alignItems: "center", gap: 8, color: "#15803d", fontWeight: 700, fontSize: 13 }}>
                <Icon name="check_circle" size={16} style={{ color: "#16a34a" }} />
                Share link copied to clipboard!
              </div>
            )}

            {/* Main Card */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, background: card, border: `1px solid ${border}`, borderRadius: 20, overflow: "hidden", width: "100%", maxWidth: 780, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

              {/* QR Side */}
              <div style={{ padding: "36px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, borderRight: `1px solid ${border}` }}>
                
                {/* Quick Generate Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  style={{ 
                    display: "flex", alignItems: "center", gap: 8, 
                    background: "#10b981", color: "#fff", 
                    border: "none", borderRadius: 10, padding: "10px 20px", 
                    fontWeight: 600, fontSize: 14, cursor: isLoading ? "not-allowed" : "pointer", 
                    transition: "all 0.2s", opacity: isLoading ? 0.6 : 1,
                    marginBottom: 8
                  }}
                  onMouseEnter={e => !isLoading && (e.currentTarget.style.background = "#059669")}
                  onMouseLeave={e => !isLoading && (e.currentTarget.style.background = "#10b981")}
                >
                  <Icon name="add_circle" size={18} style={{ animation: refreshAnim ? "spin 0.6s linear" : "none" }} />
                  {isLoading ? "Generating..." : "Generate New QR"}
                </button>

                <div style={{ background: revoked ? "#fef2f2" : "#fff", borderRadius: 16, padding: 20, border: `1px solid ${revoked ? "#fecaca" : border}`, position: "relative", transition: "all 0.3s", cursor: "pointer" }} onClick={simulateDoctorAccess}>
                  <div style={{ opacity: revoked ? 0.3 : 1, filter: refreshAnim ? "blur(4px)" : "none", transition: "all 0.3s" }}>
                    <QRPattern seed={accessToken} size={180} />
                  </div>
                  {revoked && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Icon name="block" size={36} style={{ color: "#dc2626" }} />
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#dc2626" }}>REVOKED</span>
                    </div>
                  )}
                  {timeLeft === 0 && !revoked && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.85)", borderRadius: 16 }}>
                      <Icon name="timer_off" size={36} style={{ color: "#d97706" }} />
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#d97706" }}>EXPIRED</span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(36,99,235,0.9)", borderRadius: 16, opacity: 0, transition: "opacity 0.3s", color: "white" }} 
                       onMouseEnter={e => e.currentTarget.style.opacity = "1"} 
                       onMouseLeave={e => e.currentTarget.style.opacity = "0"}>
                    <Icon name="qr_code_scanner" size={36} />
                    <span style={{ fontWeight: 800, fontSize: 13 }}>Click to Simulate Scan</span>
                  </div>
                </div>

                {/* Session ID */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: dark ? "#0f172a" : "#f8fafc", border: `1px solid ${border}`, borderRadius: 10, padding: "9px 16px" }}>
                  <Icon name="verified_user" size={16} style={{ color: "#2463eb" }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, letterSpacing: 1 }}>
                    Session: {sessionId}
                  </span>
                </div>

                {/* Access Token Preview */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: dark ? "#0f172a" : "#f8fafc", border: `1px solid ${border}`, borderRadius: 10, padding: "9px 16px", maxWidth: "100%" }}>
                  <Icon name="key" size={16} style={{ color: "#2463eb" }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Token: {accessToken.substring(0, 20)}...
                  </span>
                </div>

                {/* Demo Doctor Access Button */}
                <button onClick={simulateDoctorAccess}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#059669"}
                  onMouseLeave={e => e.currentTarget.style.background = "#10b981"}>
                  <Icon name="medical_services" size={16} />
                  Simulate Doctor Access
                </button>
              </div>

              {/* Timer Side */}
              <div style={{ padding: "36px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Timer badge */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: dark ? "#0f172a" : "#f1f5f9", border: `1px solid ${border}`, borderRadius: 999, padding: "5px 14px", alignSelf: "flex-start" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: revoked || timeLeft === 0 ? "#ef4444" : "#22c55e", animation: !revoked && timeLeft > 0 ? "pulse 2s infinite" : "none" }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: muted, letterSpacing: 1, textTransform: "uppercase" }}>Access Timer</span>
                </div>

                {/* Big Timer */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 52, fontWeight: 700, letterSpacing: -2, color: revoked || timeLeft === 0 ? "#ef4444" : timerColor, transition: "color 0.5s", lineHeight: 1 }}>
                      {revoked ? "00:00" : `${mins}:${secs}`}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: muted }}>MINS</span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop: 12, height: 4, background: dark ? "#334155" : "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${revoked ? 0 : pct}%`, background: timerColor, borderRadius: 999, transition: "width 1s linear, background 0.5s" }} />
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 13, color: muted, lineHeight: 1.6 }}>
                  This access code will automatically expire when the timer reaches zero for security purposes.
                </p>

                {/* Privacy Notice */}
                <div style={{ background: dark ? "#2d1f00" : "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
                  <Icon name="info" size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.6 }}>
                    <strong>Privacy Notice:</strong> Scanning this QR code grants temporary, read-only access to selected patient vitals and medical history. Access is logged and audited.
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleRefresh} disabled={isLoading}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#2463eb", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 14, cursor: isLoading ? "not-allowed" : "pointer", boxShadow: "0 4px 14px #2463eb30", transition: "all 0.2s", opacity: isLoading ? 0.6 : 1 }}>
                    <Icon name="refresh" size={18} style={{ color: "#fff", animation: refreshAnim ? "spin 0.6s linear" : "none" }} />
                    {isLoading ? "Generating..." : "Refresh"}
                  </button>
                  <button onClick={handleRevoke}
                    disabled={revoked || timeLeft === 0 || isLoading}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", color: revoked || timeLeft === 0 || isLoading ? muted : "#dc2626", border: `2px solid ${revoked || timeLeft === 0 || isLoading ? border : "#fecaca"}`, borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 14, cursor: revoked || timeLeft === 0 || isLoading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                    <Icon name="cancel" size={18} style={{ color: revoked || timeLeft === 0 || isLoading ? muted : "#dc2626" }} />
                    Revoke
                  </button>
                </div>

                {/* Active Sessions Info */}
                {activeSessions.length > 0 && (
                  <div style={{ background: dark ? "#0f172a" : "#f8fafc", border: `1px solid ${border}`, borderRadius: 10, padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Icon name="history" size={16} style={{ color: "#2463eb" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: text }}>Active Sessions</span>
                    </div>
                    <div style={{ fontSize: 11, color: muted }}>
                      {activeSessions.filter(s => s.status === 'active').length} active, {activeSessions.filter(s => s.status === 'revoked').length} revoked
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, width: "100%", maxWidth: 780 }}>
              {[
                { icon: "print", label: "Print ID Card", action: () => setPrintMode(true) },
                { icon: "share", label: "Share Link", action: handleShare },
                { icon: "history", label: "View Logs", action: () => setShowLogs(true) },
              ].map(({ icon, label, action }) => (
                <button key={label} onClick={action}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "20px", background: card, border: `1px solid ${border}`, borderRadius: 16, cursor: "pointer", color: muted, fontWeight: 600, fontSize: 14, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#2463eb50"; e.currentTarget.style.color = "#2463eb"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}>
                  <Icon name={icon} size={22} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Logs Modal */}
      {showLogs && (
        <div onClick={() => setShowLogs(false)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 28, width: 460, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Access Logs</h2>
              <button onClick={() => setShowLogs(false)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><Icon name="close" size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: dark ? "#0f172a" : "#f8fafc", borderRadius: 12, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="person" size={18} style={{ color: "#2463eb" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{log.action}</div>
                    <div style={{ fontSize: 12, color: muted }}>{log.by} · {log.location}</div>
                  </div>
                  <span style={{ fontSize: 11, color: muted, flexShrink: 0 }}>{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printMode && (
        <div onClick={() => setPrintMode(false)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 32, width: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 4 }}>MediLink Patient ID</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Dr. Sarah Chen · General Physician</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <QRPattern seed={sessionId} size={140} />
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#0f172a", marginBottom: 20, background: "#f1f5f9", borderRadius: 8, padding: "8px 12px" }}>{sessionId}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setPrintMode(false)} style={{ flex: 1, padding: "11px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "transparent", color: "#0f172a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Close</button>
              <button onClick={() => window.print()} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Print</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </>
  );
}
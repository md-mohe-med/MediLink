import { useState, useEffect } from "react";
import api from "../../../../api/axios";
import PatientSidebar from "../sidebar/sidebar";
import { useNavigate } from "react-router-dom";
import useDarkMode from "../../../../contexts/DarkModeContext";

function Icon({ name, size = 22, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

function PatientDashboard() {
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();
  const [search, setSearch] = useState("");
  const [qrVisible, setQrVisible] = useState(false);
  const [qrToken, setQrToken] = useState(null);
  const [qrExpiry, setQrExpiry] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [sosActive, setSosActive] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState({ patient_documents: [], lab_uploads: [] });
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError("");
      try {
        const [profileRes, docsRes, prescRes] = await Promise.all([
          api.get("/patient/profile"),
          api.get("/patient/documents"),
          api.get("/patient/prescriptions"),
        ]);

        if (!mounted) return;

        setUser(profileRes.data.user);
        setProfile(profileRes.data.profile);
        setDocuments(docsRes.data || { patient_documents: [], lab_uploads: [] });
        setPrescriptions(prescRes.data?.prescriptions || prescRes.data || []);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load patient dashboard:", err);
        console.error("Error response:", err.response);
        console.error("Error message:", err.message);
        setError("Unable to load your medical data. " + (err.response?.data?.message || err.message || "Please try again."));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  // Countdown timer for QR code
  useEffect(() => {
    let timer;
    if (qrVisible && qrExpiry && countdown > 0) {
      timer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((new Date(qrExpiry) - new Date()) / 1000));
        setCountdown(remaining);
        if (remaining === 0) {
          setQrToken(null);
          setQrExpiry(null);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [qrVisible, qrExpiry, countdown]);

  const generateQR = async () => {
    if (qrLoading) return;
    setQrLoading(true);
    try {
      const response = await api.post('/qr/generate');
      setQrToken(response.data.token);
      setQrExpiry(response.data.expires_at);
      setCountdown(60);
      setQrVisible(true);
    } catch (err) {
      console.error('Failed to generate QR:', err);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setQrLoading(false);
    }
  };

  const toggleQR = () => {
    if (!qrVisible) {
      generateQR();
    } else {
      setQrVisible(false);
      setQrToken(null);
      setQrExpiry(null);
    }
  };

  const dynamicHealthCards = [
    {
      icon: "pill", label: "Medications",
      value: prescriptions ? `${prescriptions.length} Prescribed` : "0 Prescribed",
      sub: prescriptions && prescriptions.length > 0 ? "Active prescriptions" : "None active",
      badge: prescriptions && prescriptions.length > 0 ? "ACTIVE" : "NONE",
      badgeColor: "#2463eb", iconBg: "#eff6ff", iconColor: "#2463eb"
    },
    {
      icon: "biotech", label: "Lab Results",
      value: documents.lab_uploads && documents.lab_uploads.length > 0 ? `${documents.lab_uploads.length} Reports` : "0 Reports",
      sub: documents.lab_uploads && documents.lab_uploads.length > 0 ? "Available" : "No recent labs",
      badge: documents.lab_uploads && documents.lab_uploads.length > 0 ? "RECENT" : "NONE",
      badgeColor: "#7c3aed", iconBg: "#f5f3ff", iconColor: "#7c3aed", subGreen: documents.lab_uploads && documents.lab_uploads.length > 0
    },
    {
      icon: "radiology", label: "Documents",
      value: documents.patient_documents && documents.patient_documents.length > 0 ? `${documents.patient_documents.length} Files` : "0 Files",
      sub: "Uploaded records",
      badge: documents.patient_documents && documents.patient_documents.length > 0 ? "STORED" : "EMPTY",
      badgeColor: "#d97706", iconBg: "#fff7ed", iconColor: "#ea580c", badgeBg: "#fed7aa"
    },
    {
      icon: "warning", label: "Allergies",
      value: profile?.allergies ? `${profile.allergies.split(',').length} Known` : "None Known",
      sub: profile?.allergies || "No allergies recorded",
      badge: profile?.allergies ? "CRITICAL" : "CLEAR",
      badgeColor: profile?.allergies ? "#dc2626" : "#16a34a", iconBg: profile?.allergies ? "#fef2f2" : "#dcfce7", iconColor: profile?.allergies ? "#dc2626" : "#16a34a"
    },
  ];

  const dynamicAppointments = [];

  const dynamicRecentUpdates = [
    ...(documents.lab_uploads || []).map(l => ({
      tag: "LAB RESULT", title: l.title, time: l.test_date ? new Date(l.test_date).toLocaleDateString() : "Unknown date", date: new Date(l.test_date || 0).getTime(), color: "#2463eb", bg: "#eff6ff", emoji: "🧪"
    })),
    ...(documents.patient_documents || []).map(d => ({
      tag: "DOCUMENT", title: d.title, time: d.document_date ? new Date(d.document_date).toLocaleDateString() : "Unknown date", date: new Date(d.document_date || 0).getTime(), color: "#d97706", bg: "#fffbeb", emoji: "📄"
    })),
    ...(prescriptions || []).map(p => ({
      tag: "MEDICATION", title: "New Prescription", time: p.prescription_date ? new Date(p.prescription_date).toLocaleDateString() : "Unknown date", date: new Date(p.prescription_date || 0).getTime(), color: "#059669", bg: "#ecfdf5", emoji: "💊"
    }))
  ].sort((a, b) => b.date - a.date).slice(0, 4);

  const bg = dark ? "#0f172a" : "#f1f5f9";
  const card = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "#334155" : "#e2e8f0";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const sidebarBg = dark ? "#0f172a" : "#ffffff";

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: bg, fontFamily: "'DM Sans', sans-serif", color: text, transition: "all 0.3s" }}>
        <PatientSidebar dark={dark} setDark={setDark} />

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", marginLeft: 240 }}>

          {/* Header */}
          <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: dark ? "#0f172a99" : "#ffffff99", backdropFilter: "blur(12px)", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
            <div style={{ position: "relative", width: 340 }}>
              <Icon name="search" size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: muted }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records, doctors, or labs..."
                style={{ width: "100%", background: dark ? "#1e293b" : "#f1f5f9", border: "none", borderRadius: 10, padding: "9px 12px 9px 38px", fontSize: 13, color: text, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setDark(!dark)}
                style={{ padding: "8px", background: "transparent", border: `1px solid ${border}`, borderRadius: 8, cursor: "pointer", color: muted, display: "flex" }}>
                <Icon name={dark ? "light_mode" : "dark_mode"} size={18} />
              </button>
              <button style={{ position: "relative", padding: "8px", background: "transparent", border: "none", cursor: "pointer", color: muted, display: "flex" }}>
                <Icon name="notifications" size={20} />
                <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, background: "#ef4444", borderRadius: "50%", border: "2px solid white" }} />
              </button>
              <div style={{ width: 1, height: 24, background: border }} />
              <span style={{ fontSize: 13, color: muted, fontWeight: 500 }}>Monday, Oct 23</span>
            </div>
          </header>

          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28 }}>

            {/* Error / Loading */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 14px", color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}
            {loading && !error && (
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px", color: muted, fontSize: 13 }}>
                Loading your dashboard...
              </div>
            )}

            {/* Welcome Banner */}
            <section style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: 0, top: 0, width: "40%", height: "100%", background: "linear-gradient(to left, #2463eb08, transparent)", pointerEvents: "none" }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2463eb", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Good Morning</div>
                <h2 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
                  Welcome {user ? `, ${user.name.split(" ")[0]}` : ""}
                </h2>
                <p style={{ color: muted, fontSize: 14, margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
                  {prescriptions.length > 0 || documents.patient_documents.length > 0 || documents.lab_uploads.length > 0
                    ? `You currently have ${prescriptions.length} prescriptions and ${documents.patient_documents.length + documents.lab_uploads.length} documents in your record.`
                    : "Your health record is ready. Any new lab results or prescriptions will appear here automatically."}
                </p>
              </div>
              <button onClick={toggleQR}
                disabled={qrLoading}
                style={{ display: "flex", alignItems: "center", gap: 10, background: "#2463eb", color: "#fff", border: "none", borderRadius: 14, padding: "14px 22px", fontWeight: 700, fontSize: 14, cursor: qrLoading ? "not-allowed" : "pointer", boxShadow: "0 8px 20px #2463eb30", transition: "all 0.2s", flexShrink: 0, opacity: qrLoading ? 0.7 : 1 }}>
                <Icon name={qrLoading ? "hourglass_empty" : "qr_code_2"} size={20} />
                {qrLoading ? "Generating..." : (qrVisible ? "Hide QR Code" : "Generate QR for Doctor")}
              </button>
            </section>

            {/* QR Modal */}
            {qrVisible && (
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 120, height: 120, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {qrToken ? (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrToken)}`}
                      alt="QR Code"
                      style={{ width: 120, height: 120 }}
                    />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                      {Array.from({ length: 49 }).map((_, i) => (
                        <div key={i} style={{ width: 10, height: 10, background: Math.random() > 0.5 ? "#0f172a" : "transparent", borderRadius: 1 }} />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Your Medical QR Code</div>
                  <div style={{ color: muted, fontSize: 13, marginBottom: 12 }}>Share this token with your doctor to grant temporary access to your medical records.</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ background: countdown > 10 ? "#dcfce7" : "#fef2f2", color: countdown > 10 ? "#16a34a" : "#dc2626", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>
                      ● {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                    </span>
                    <span style={{ background: dark ? "#1e293b" : "#f1f5f9", color: muted, borderRadius: 6, padding: "4px 10px", fontSize: 12 }}>
                      Expires in {countdown}s
                    </span>
                  </div>
                  {qrToken && (
                    <div style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8, fontFamily: "monospace", fontSize: 11, wordBreak: "break-all", border: `1px solid ${border}` }}>
                      {qrToken}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>

              {/* Health Summary */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Health Summary</h3>
                  <button style={{ background: "none", border: "none", color: "#2463eb", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>View All Trends</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {dynamicHealthCards.map((c, i) => (
                    <div key={i} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div style={{ background: c.iconBg, borderRadius: 10, padding: 10, display: "flex" }}>
                          <Icon name={c.icon} size={20} style={{ color: c.iconColor }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: c.badgeColor, background: c.badgeBg || "transparent", padding: c.badgeBg ? "3px 7px" : 0, borderRadius: 6 }}>{c.badge}</span>
                      </div>
                      <div style={{ fontSize: 12, color: muted, fontWeight: 500, marginBottom: 2 }}>{c.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px" }}>{c.value}</div>
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: c.subGreen ? "#16a34a" : muted, fontWeight: c.subGreen ? 700 : 400 }}>{c.sub}</span>
                        <Icon name="arrow_forward_ios" size={14} style={{ color: muted }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appointments */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Appointments</h3>
                  <button style={{ background: "none", border: "none", color: "#2463eb", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Manage</button>
                </div>
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
                  {dynamicAppointments.length === 0 ? (
                    <div style={{ padding: "16px", color: muted, fontSize: 13, textAlign: "center" }}>
                      No upcoming appointments.
                    </div>
                  ) : dynamicAppointments.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: i < dynamicAppointments.length - 1 ? `1px solid ${border}` : "none", cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = dark ? "#1e293b" : "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: dark ? "#0f172a" : "#f1f5f9", borderRadius: 10, minWidth: 48, height: 52 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: muted, textTransform: "uppercase" }}>{a.month}</span>
                        <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{a.day}</span>
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.doctor}</div>
                        <div style={{ fontSize: 11, color: muted }}>{a.type}</div>
                        <div style={{ fontSize: 10, color: "#2463eb", fontWeight: 700, marginTop: 2 }}>{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button style={{ width: "100%", padding: "14px", border: `2px dashed ${border}`, borderRadius: 14, background: "transparent", color: muted, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#2463eb"; e.currentTarget.style.borderColor = "#2463eb50"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = muted; e.currentTarget.style.borderColor = border; }}>
                  <Icon name="add" size={18} /> Schedule Appointment
                </button>
              </div>
            </div>

            {/* Recent Updates */}
            <section>
              <h3 style={{ margin: "0 0 14px", fontWeight: 800, fontSize: 18 }}>Recent Updates</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {dynamicRecentUpdates.length === 0 ? (
                  <div style={{ padding: "16px", color: muted, fontSize: 13, background: card, border: `1px solid ${border}`, borderRadius: 14, gridColumn: "span 4" }}>
                    No recent updates found.
                  </div>
                ) : dynamicRecentUpdates.map((u, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: card, border: `1px solid ${border}`, borderRadius: 14, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: u.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{u.emoji}</div>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: u.color, marginBottom: 2 }}>{u.tag}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.title}</div>
                      <div style={{ fontSize: 10, color: muted }}>{u.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>
    </>
  );
}

export default PatientDashboard; 

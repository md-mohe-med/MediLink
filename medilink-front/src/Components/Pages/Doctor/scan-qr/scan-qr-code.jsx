import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/side";
import api from "../../../../api/axios";

const steps = [
  { n: 1, text: <>Ask the patient to open the <strong>MediLink</strong> portal on their device.</> },
  { n: 2, text: <>Have them navigate to the <span style={{ fontWeight: 700, textDecoration: "underline" }}>"Provider Access"</span> section on their dashboard.</> },
  { n: 3, text: "They will see a QR code and an access token valid for 1 minute." },
  { n: 4, text: "Enter the token manually or scan the QR code using your device camera." },
];

function Icon({ name, size = 20, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

export default function PatientAccess() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessResult, setAccessResult] = useState(null); // null | 'success' | 'error'
  const [patientInfo, setPatientInfo] = useState(null); // { id, name, public_id } on success
  const [cameraActive, setCameraActive] = useState(false);
  const [scanLine, setScanLine] = useState(0);
  const [scanned, setScanned] = useState(false);
  const inputRef = useRef();
  const scanRef = useRef();

  const bg = dark ? "#0f172a" : "#f6f6f8";
  const card = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "#334155" : "#e2e8f0";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const sidebarBg = dark ? "#0f172a" : "#ffffff";

  // Animate scan line
  useEffect(() => {
    if (!cameraActive || scanned) return;
    let dir = 1;
    let pos = 0;
    const t = setInterval(() => {
      pos += dir * 2;
      if (pos >= 100) dir = -1;
      if (pos <= 0) dir = 1;
      setScanLine(pos);
    }, 16);
    return () => clearInterval(t);
  }, [cameraActive, scanned]);

  const handleTokenChange = (e) => {
    setToken(e.target.value.trim());
    setAccessResult(null);
  };

  const handleAuthorize = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setAccessResult(null);
    try {
      const res = await api.post("/qr/verify", { token: token.trim() });
      setPatientInfo(res.data.patient);
      setAccessResult("success");
    } catch (err) {
      setAccessResult("error");
      console.error("QR verify failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setToken("");
    setAccessResult(null);
    setPatientInfo(null);
    setLoading(false);
  };

  const handleOpenRecords = () => {
    if (patientInfo?.id) navigate(`/doctor/patient/${patientInfo.id}`);
  };

  const handleNewMessage = async () => {
    if (!patientInfo?.id) return;
    
    try {
      // Create conversation with patient using doctor endpoint
      const response = await api.post('/doctor/conversations', {
        patient_id: patientInfo.id
      });
      
      console.log('Created conversation:', response.data);
      
      // Navigate to messages page with conversation ID
      navigate('/doctor/messages', { 
        state: { 
          selectedConversationId: response.data.conversation?.id || response.data.id,
          patientId: patientInfo.id,
          patientName: patientInfo.name,
          // Also pass the full conversation data so it's immediately available
          conversation: response.data.conversation || response.data
        }
      });
    } catch (err) {
      console.error('Failed to create conversation:', err);
      // Still navigate - messages page will create it on first send
      navigate('/doctor/messages', { 
        state: { 
          patientId: patientInfo.id,
          patientName: patientInfo.name
        }
      });
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@500&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: bg, fontFamily: "'DM Sans', sans-serif", color: text, transition: "all 0.3s" }}>

        <Sidebar dark={dark} setDark={setDark} onNewConsultation={() => {}} />

        {/* Main */}
        <main style={{ flex: 1, overflowY: "auto", padding: "48px 56px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ marginBottom: 40 }}>
              <h1 style={{ margin: "0 0 10px", fontWeight: 900, fontSize: 36, letterSpacing: "-1px" }}>Secure Patient Access</h1>
              <p style={{ margin: 0, fontSize: 16, color: muted, lineHeight: 1.7, maxWidth: 560 }}>
                Connect with your patient's records instantly. Ask the patient to provide their access token or scan the QR code from their MediLink Provider Access page.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

              {/* Left — Form */}
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "32px" }}>

                  {/* Success State */}
                  {accessResult === "success" ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <Icon name="check_circle" size={32} style={{ color: "#16a34a" }} />
                      </div>
                      <h3 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 20 }}>Access Granted</h3>
                      <p style={{ margin: "0 0 8px", color: muted, fontSize: 13 }}>Patient records are now accessible.</p>
                      <div style={{ background: dark ? "#0f172a" : "#f8fafc", border: `1px solid ${border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Patient Info</div>
                        {[["Name", patientInfo?.name ?? "—"], ["Patient ID", patientInfo?.public_id ?? "—"], ["Access Level", "Read-Only"], ["Session", "1 min"]].map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: muted }}>{k}</span>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button onClick={handleReset} style={{ flex: 1, minWidth: 100, padding: "11px", border: `1.5px solid ${border}`, borderRadius: 10, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                          New Access
                        </button>
                        <button onClick={handleNewMessage} style={{ flex: 1, minWidth: 100, padding: "11px", border: "none", borderRadius: 10, background: "#22c55e", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <Icon name="chat" size={16} />
                          Message
                        </button>
                        <button onClick={handleOpenRecords} style={{ flex: 1, minWidth: 100, padding: "11px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                          Open Records
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Token Input */}
                      <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                          Enter Access Token
                        </label>
                        <input
                          ref={inputRef}
                          value={token}
                          onChange={handleTokenChange}
                          placeholder="Paste token from patient's QR or mobile app"
                          style={{
                            display: "block", width: "100%", textAlign: "center",
                            fontSize: 14, fontFamily: "'DM Mono', monospace", fontWeight: 500,
                            height: 52, borderRadius: 12,
                            border: `2px solid ${accessResult === "error" ? "#ef4444" : token.trim().length > 0 ? "#2463eb" : border}`,
                            background: dark ? "#0f172a" : "#f8fafc",
                            color: text, outline: "none", boxSizing: "border-box",
                            transition: "border 0.2s"
                          }}
                          onKeyDown={e => e.key === "Enter" && handleAuthorize()}
                        />
                        {accessResult === "error" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: "#ef4444", fontSize: 12, fontWeight: 600 }}>
                            <Icon name="error" size={14} style={{ color: "#ef4444" }} />
                            Invalid token. Please check with the patient and try again.
                          </div>
                        )}
                        {!accessResult && (
                          <p style={{ marginTop: 8, fontSize: 12, color: muted, fontStyle: "italic" }}>
                            Tokens expire after 1 minute for security.
                          </p>
                        )}
                      </div>

                      {/* Authorize Button */}
                      <button onClick={handleAuthorize}
                        disabled={!token.trim() || loading}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: token.trim() && !loading ? "#2463eb" : (dark ? "#1e293b" : "#e2e8f0"), color: token.trim() && !loading ? "#fff" : muted, border: "none", borderRadius: 12, padding: "15px", fontWeight: 800, fontSize: 15, cursor: token.trim() && !loading ? "pointer" : "not-allowed", boxShadow: token.trim() ? "0 6px 20px #2463eb30" : "none", transition: "all 0.2s" }}>
                        {loading ? (
                          <>
                            <div style={{ width: 18, height: 18, border: "3px solid #ffffff40", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Icon name="sync_alt" size={18} style={{ color: token.trim() ? "#fff" : muted }} />
                            Authorize Access
                          </>
                        )}
                      </button>

                      {/* Divider */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
                        <div style={{ flex: 1, height: 1, background: border }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 2 }}>or scan qr</span>
                        <div style={{ flex: 1, height: 1, background: border }} />
                      </div>

                      {/* Camera Scanner */}
                      <div ref={scanRef} onClick={() => !cameraActive && setCameraActive(true)}
                        style={{ position: "relative", aspectRatio: "1", width: "100%", borderRadius: 14, background: "#0f172a", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `3px solid ${cameraActive ? "#2463eb" : "#1e293b"}`, cursor: cameraActive ? "default" : "pointer", transition: "border 0.3s" }}>

                        {/* Dot grid bg */}
                        <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: "radial-gradient(circle, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />

                        {!cameraActive ? (
                          <>
                            <Icon name="photo_camera" size={52} style={{ color: "rgba(255,255,255,0.4)", marginBottom: 10 }} />
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600 }}>Click to initialize camera</p>
                          </>
                        ) : (
                          <>
                            {scanned ? (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Icon name="check_circle" size={28} style={{ color: "#16a34a" }} />
                                </div>
                                <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 14 }}>QR Code Detected!</span>
                              </div>
                            ) : (
                              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, zIndex: 1 }}>
                                📷 Camera Active — Scanning...
                              </div>
                            )}
                          </>
                        )}

                        {/* Corner brackets */}
                        <div style={{ position: "absolute", inset: 24 }}>
                          {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h]) => (
                            <div key={`${v}-${h}`} style={{ position: "absolute", [v]: 0, [h]: 0, width: 28, height: 28, borderTop: v === "top" ? "4px solid #2463eb" : "none", borderBottom: v === "bottom" ? "4px solid #2463eb" : "none", borderLeft: h === "left" ? "4px solid #2463eb" : "none", borderRight: h === "right" ? "4px solid #2463eb" : "none" }} />
                          ))}

                          {/* Scan line */}
                          {cameraActive && !scanned && (
                            <div style={{ position: "absolute", left: 0, right: 0, top: `${scanLine}%`, height: 2, background: "rgba(36,99,235,0.7)", boxShadow: "0 0 12px rgba(36,99,235,0.9)", transition: "top 0.016s linear" }} />
                          )}
                        </div>

                        {/* Cancel button */}
                        {cameraActive && !scanned && (
                          <button onClick={e => { e.stopPropagation(); setCameraActive(false); setScanLine(0); }}
                            style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                            <Icon name="close" size={16} style={{ color: "#fff" }} />
                          </button>
                        )}
                      </div>

                      <p style={{ marginTop: 10, fontSize: 11, color: muted, textAlign: "center" }}>
                        Ask the patient to generate a token from their MediLink Provider Access page.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Right — Instructions + Security */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Instructions */}
                <div style={{ background: dark ? "#1a2744" : "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 16, padding: "24px" }}>
                  <h3 style={{ margin: "0 0 18px", fontWeight: 800, fontSize: 15, color: "#2463eb", display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="info" size={18} style={{ color: "#2463eb" }} />
                    Instructions
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {steps.map(s => (
                      <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2463eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>
                          {s.n}
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: dark ? "#cbd5e1" : "#374151", lineHeight: 1.6 }}>{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Notice */}
                <div style={{ background: dark ? "#1e293b" : "#f8fafc", border: `1px solid ${border}`, borderRadius: 16, padding: "24px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Security Notice</div>
                  <p style={{ margin: "0 0 16px", fontSize: 12, color: muted, lineHeight: 1.7 }}>
                    Access is logged under your provider ID. This session will grant you read-only access to the patient's medical history, prescriptions, and latest lab results. Any modifications must be signed with your digital certificate.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#2463eb" }}>
                    <Icon name="verified_user" size={16} style={{ color: "#2463eb" }} />
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>HIPAA Compliant Environment</span>
                  </div>
                </div>

                {/* Recent Access Log */}
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "24px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Recent Access</div>
                  {[
                    { name: "Maria Garcia", time: "09:12 AM", token: "••••91" },
                    { name: "James Chen", time: "Yesterday", token: "••••47" },
                    { name: "Linda Thompson", time: "Yesterday", token: "••••82" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 12 : 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2463eb", fontSize: 11, flexShrink: 0 }}>
                        {r.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: muted }}>{r.time} · Token {r.token}</div>
                      </div>
                      <Icon name="check_circle" size={16} style={{ color: "#16a34a" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
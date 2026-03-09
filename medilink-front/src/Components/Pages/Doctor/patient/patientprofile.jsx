// pages/PatientProfile.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../../api/axios";
import Sidebar from "../sidebar/side";
import useDarkMode from "../../../../contexts/DarkModeContext";

const tabs = ["Medical History", "Analyses", "Imaging", "Prescriptions"];

const timelinePlaceholder = [
  { icon: "stethoscope", bg: "#eff6ff", color: "#2463eb", title: "Routine Checkup", date: "Oct 12, 2023", desc: "Patient reported mild fatigue and seasonal allergies. Blood pressure normal at 120/80 mmHg.", file: null },
  { icon: "science", bg: "#f0fdf4", color: "#16a34a", title: "Blood Analysis Results", date: "Sep 28, 2023", desc: "Complete Blood Count (CBC) results within normal ranges. Vitamin D slightly low (22 ng/mL).", file: "report.pdf" },
  { icon: "radiology", bg: "#fff7ed", color: "#ea580c", title: "Chest X-Ray", date: "Aug 15, 2023", desc: "No abnormalities detected in thoracic cavity. Clear lung fields.", file: null },
];

const vitals = [
  { label: "Blood Pressure", value: "120/80", unit: "mmHg" },
  { label: "Heart Rate", value: "72", unit: "bpm" },
  { label: "Glucose", value: "95", unit: "mg/dL" },
  { label: "Oxygen Sat.", value: "98", unit: "%" },
];

const allergies = [
  { name: "Penicillin", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { name: "Peanuts", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  { name: "Lactose", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
];

const imagingItems = [
  { label: "Chest X-Ray", emoji: "🫁", desc: "Aug 15, 2023 · No abnormalities detected" },
  { label: "Brain MRI", emoji: "🧠", desc: "Jul 02, 2023 · Normal brain tissue" },
];

function Icon({ name, size = 20, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Medical History");
  const [dark, setDark] = useDarkMode();
  const [search, setSearch] = useState("");
  const [consultModal, setConsultModal] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [imagingModal, setImagingModal] = useState(null);

  const [prescription, setPrescription] = useState({ med: "", dosage: "", freq: "Once daily", notes: "" });
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescSaved, setPrescSaved] = useState(false);
  const [prescError, setPrescError] = useState("");
  const [prescLoading, setPrescLoading] = useState(false);

  const [patient, setPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    
    // Fetch patient profile and lab results
    Promise.all([
      api.get(`/doctor/patient/${id}`),
      api.get(`/doctor/patient/${id}/lab-results`).catch(() => ({ data: [] }))
    ])
      .then(([patientRes, labRes]) => {
        if (!mounted) return;
        const p = patientRes.data.patient;
        const prof = patientRes.data.profile || {};
        setPatient(p);
        setProfile(prof);
        setLabResults(labRes.data || []);
        setPrescriptions(
          (patientRes.data.prescriptions || []).map((pr) => ({
            id: pr.id,
            med: Array.isArray(pr.medications) && pr.medications[0] ? pr.medications[0].name : "—",
            dosage: Array.isArray(pr.medications) && pr.medications[0] ? pr.medications[0].dose : "—",
            freq: Array.isArray(pr.medications) && pr.medications[0] ? pr.medications[0].frequency : "—",
            notes: pr.notes || "",
            date: pr.prescription_date ? new Date(pr.prescription_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
          }))
        );
        setDocuments(patientRes.data.documents || []);
        setEditForm({
          name: p?.name ?? "",
          age: prof?.date_of_birth ? new Date().getFullYear() - new Date(prof.date_of_birth).getFullYear() : "",
          gender: prof?.gender ?? "",
          id: prof?.patient_id ?? "",
          blood: prof?.blood_type ?? "",
          weight: prof?.weight ?? "",
          height: prof?.height ?? "",
        });
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.message || "Failed to load patient. Ensure a valid QR session exists.");
        console.error("Patient fetch error:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [id]);

  // Theme tokens
  const bg = dark ? "#0f172a" : "#f6f6f8";
  const card = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "#334155" : "#e2e8f0";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const inputBg = dark ? "#0f172a" : "#f8fafc";

  const inputStyle = {
    width: "100%",
    background: inputBg,
    border: `1.5px solid ${border}`,
    borderRadius: 9,
    padding: "9px 12px",
    fontSize: 13,
    color: text,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border 0.2s",
  };

  const handleSavePresc = async () => {
    setPrescError("");
    if (!prescription.med.trim()) return setPrescError("Medication name is required.");
    if (!prescription.dosage.trim()) return setPrescError("Dosage is required.");
    if (!id) return setPrescError("Patient ID missing.");
    setPrescLoading(true);
    try {
      await api.post("/prescriptions", {
        patient_id: parseInt(id, 10),
        medications: [
          {
            name: prescription.med.trim(),
            dose: prescription.dosage.trim(),
            frequency: prescription.freq,
            duration: "As prescribed",
          },
        ],
        notes: prescription.notes.trim() || null,
      });
      setPrescriptions((prev) => [
        {
          id: Date.now(),
          med: prescription.med,
          dosage: prescription.dosage,
          freq: prescription.freq,
          notes: prescription.notes,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        },
        ...prev,
      ]);
      setPrescription({ med: "", dosage: "", freq: "Once daily", notes: "" });
      setPrescSaved(true);
      setTimeout(() => setPrescSaved(false), 2500);
    } catch (err) {
      setPrescError(err.response?.data?.message || "Failed to save prescription.");
    } finally {
      setPrescLoading(false);
    }
  };

  const handleSaveEdit = () => {
    setEditForm((prev) => ({ ...prev }));
    setEditModal(false);
  };

  if (loading) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, border: "4px solid #e2e8f0", borderTopColor: "#2463eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <div>Loading patient records...</div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  if (error || !patient) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", flexDirection: "column", gap: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#ef4444" }}>error</span>
          <div>{error || "Patient not found."}</div>
          <button onClick={() => navigate("/doctor/scan-qr")} style={{ padding: "10px 20px", background: "#2463eb", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
            Back to Patient Access
          </button>
        </div>
      </>
    );
  }

  const displayPatient = {
    name: patient.name,
    age: profile?.date_of_birth ? `${new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()}` : "—",
    gender: profile?.gender ?? "—",
    id: profile?.patient_id ?? "—",
    blood: profile?.blood_type ?? "—",
    weight: profile?.weight ?? "—",
    height: profile?.height ?? "—",
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", minHeight: "100vh", background: bg, fontFamily: "'DM Sans', sans-serif", color: text, transition: "all 0.3s" }}>

        {/* ── Shared Sidebar ── */}
        <Sidebar dark={dark} setDark={setDark} onNewConsultation={() => setConsultModal(true)} />

        {/* ── Main Content ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>

          {/* Header */}
          <header
            style={{
              height: 64,
              background: dark ? "#0f172a99" : "#ffffff99",
              backdropFilter: "blur(12px)",
              borderBottom: `1px solid ${border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 32px",
              position: "sticky",
              top: 0,
              zIndex: 10,
              flexShrink: 0,
            }}
          >
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: muted }}>
              <span>Patients</span>
              <Icon name="chevron_right" size={16} style={{ color: muted }} />
              <span style={{ fontWeight: 700, color: text }}>{displayPatient.name}</span>
            </div>

            {/* Search + notifications */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <Icon name="search" size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: muted }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search records..."
                  style={{ background: dark ? "#1e293b" : "#f1f5f9", border: "none", borderRadius: 9, padding: "8px 12px 8px 32px", fontSize: 13, color: text, outline: "none", width: 220 }}
                />
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex" }}>
                <Icon name="notifications" size={20} />
              </button>
            </div>
          </header>

          {/* Page Body */}
          <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

            {/* Patient Info Card */}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "24px 28px", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  {/* Avatar */}
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#2463eb20", border: `4px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 28, color: "#2463eb", flexShrink: 0 }}>
                    {(displayPatient.name || "P").split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h1 style={{ margin: "0 0 4px", fontWeight: 900, fontSize: 22, letterSpacing: "-0.4px" }}>{displayPatient.name}</h1>
                    <p style={{ margin: "0 0 8px", color: muted, fontSize: 13 }}>{displayPatient.age} years old · {displayPatient.gender} · ID: {displayPatient.id}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ background: "#eff6ff", color: "#2463eb", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Blood: {displayPatient.blood}</span>
                      <span style={{ background: dark ? "#1e293b" : "#f1f5f9", color: muted, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>Weight: {displayPatient.weight}</span>
                      <span style={{ background: dark ? "#1e293b" : "#f1f5f9", color: muted, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>Height: {displayPatient.height}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => { setEditForm({ ...displayPatient }); setEditModal(true); }}
                    style={{ padding: "9px 18px", border: `1.5px solid ${border}`, borderRadius: 10, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setContactModal(true)}
                    style={{ padding: "9px 18px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px #2463eb30" }}
                  >
                    Contact Patient
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: `1px solid ${border}`, marginBottom: 24 }}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ padding: "12px 20px", background: "none", border: "none", borderBottom: `2px solid ${activeTab === tab ? "#2463eb" : "transparent"}`, color: activeTab === tab ? "#2463eb" : muted, fontWeight: activeTab === tab ? 700 : 500, fontSize: 14, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {activeTab === "Medical History" && (
                  <>
                    {/* Add Prescription */}
                    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "24px" }}>
                      <h3 style={{ margin: "0 0 18px", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon name="pill" size={20} style={{ color: "#2463eb" }} /> Add New Prescription
                      </h3>
                      {prescSaved && (
                        <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, color: "#15803d", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
                          <Icon name="check_circle" size={16} style={{ color: "#16a34a" }} /> Prescription saved successfully!
                        </div>
                      )}
                      {prescError && (
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{prescError}</div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6 }}>Medication Name</div>
                          <input value={prescription.med} onChange={(e) => setPrescription({ ...prescription, med: e.target.value })} placeholder="e.g. Amoxicillin" style={inputStyle}
                            onFocus={(e) => (e.target.style.borderColor = "#2463eb")} onBlur={(e) => (e.target.style.borderColor = border)} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6 }}>Dosage</div>
                          <input value={prescription.dosage} onChange={(e) => setPrescription({ ...prescription, dosage: e.target.value })} placeholder="e.g. 500mg" style={inputStyle}
                            onFocus={(e) => (e.target.style.borderColor = "#2463eb")} onBlur={(e) => (e.target.style.borderColor = border)} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6 }}>Frequency</div>
                          <select value={prescription.freq} onChange={(e) => setPrescription({ ...prescription, freq: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                            <option>Once daily</option>
                            <option>Twice daily</option>
                            <option>Three times daily</option>
                            <option>As needed</option>
                          </select>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6 }}>Special Instructions</div>
                          <textarea value={prescription.notes} onChange={(e) => setPrescription({ ...prescription, notes: e.target.value })} placeholder="Take after meals..." rows={2}
                            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                            onFocus={(e) => (e.target.style.borderColor = "#2463eb")} onBlur={(e) => (e.target.style.borderColor = border)} />
                        </div>
                      </div>
                      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                        <button onClick={handleSavePresc} disabled={prescLoading} style={{ background: prescLoading ? "#94a3b8" : "#2463eb", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: prescLoading ? "not-allowed" : "pointer", boxShadow: "0 4px 12px #2463eb30" }}>
                          {prescLoading ? "Saving..." : "Save Prescription"}
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>Recent History</h3>
                        <button style={{ background: "none", border: "none", color: "#2463eb", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>View All</button>
                      </div>
                      <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: 19, top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom, ${border}, transparent)` }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                          {(documents.length ? documents.slice(0, 5).map((d, i) => ({ icon: "description", bg: "#eff6ff", color: "#2463eb", title: d.title || "Document", date: d.document_date ? new Date(d.document_date).toLocaleDateString("en-US") : "—", desc: d.description || "", file: d.file_path ? "View" : null })) : timelinePlaceholder).map((t, i) => (
                            <div key={i} style={{ display: "flex", gap: 16 }}>
                              <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.bg, border: `3px solid ${card}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                                <Icon name={t.icon} size={16} style={{ color: t.color }} />
                              </div>
                              <div style={{ flex: 1, paddingTop: 4 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontWeight: 700, fontSize: 14 }}>{t.title}</span>
                                  <span style={{ fontSize: 11, color: muted }}>{t.date}</span>
                                </div>
                                <p style={{ margin: "0 0 8px", fontSize: 13, color: muted, lineHeight: 1.6 }}>{t.desc}</p>
                                {t.file && (
                                  <button style={{ display: "inline-flex", alignItems: "center", gap: 5, background: dark ? "#1e293b" : "#f1f5f9", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, color: muted, cursor: "pointer", fontWeight: 600 }}>
                                    <Icon name="download" size={13} /> {t.file}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "Prescriptions" && (
                  <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "18px 22px", borderBottom: `1px solid ${border}` }}>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>All Prescriptions</h3>
                    </div>
                    {prescriptions.map((p, i) => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: i < prescriptions.length - 1 ? `1px solid ${border}` : "none" }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="pill" size={18} style={{ color: "#2463eb" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{p.med} <span style={{ fontWeight: 500, color: muted }}>— {p.dosage}</span></div>
                          <div style={{ fontSize: 12, color: muted }}>{p.freq} · {p.notes}</div>
                        </div>
                        <span style={{ fontSize: 11, color: muted }}>{p.date}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "Analyses" && (
                  <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "18px 22px", borderBottom: `1px solid ${border}` }}>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>Lab Analysis Results</h3>
                    </div>
                    {labResults.length === 0 ? (
                      <div style={{ padding: "32px", textAlign: "center", color: muted }}>
                        <Icon name="science" size={40} style={{ marginBottom: 12 }} />
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No Analysis Records</div>
                        <div style={{ fontSize: 13 }}>No lab analysis results available for this patient.</div>
                      </div>
                    ) : (
                      labResults.map((result, i) => (
                        <div key={result.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: i < labResults.length - 1 ? `1px solid ${border}` : "none" }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon name="science" size={18} style={{ color: "#16a34a" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{result.title || "Lab Analysis"}</div>
                            <div style={{ fontSize: 12, color: muted }}>{result.test_type} · {result.lab_name}</div>
                            {result.description && <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{result.description}</div>}
                          </div>
                          <button 
                            onClick={async () => {
                              try {
                                const response = await api.get(`/doctor/patient/${id}/lab-results/${result.id}/view`, {
                                  responseType: 'blob'
                                });
                                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                                const url = window.URL.createObjectURL(blob);
                                window.open(url, '_blank');
                              } catch (err) {
                                console.error('Failed to open file:', err);
                                alert('Failed to open file. Please try again.');
                              }
                            }}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: "#2463eb", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, color: "#fff", cursor: "pointer", fontWeight: 600 }}
                          >
                            <Icon name="visibility" size={13} /> View
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "Imaging" && (
                  <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "18px 22px", borderBottom: `1px solid ${border}` }}>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>Medical Imaging</h3>
                    </div>
                    {documents.filter(d => d.document_type?.includes('xray') || d.document_type?.includes('mri') || d.document_type?.includes('scanner') || d.document_type?.includes('imaging')).length === 0 ? (
                      <div style={{ padding: "32px", textAlign: "center", color: muted }}>
                        <Icon name="radiology" size={40} style={{ marginBottom: 12 }} />
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No Imaging Records</div>
                        <div style={{ fontSize: 13 }}>No imaging results available for this patient.</div>
                      </div>
                    ) : (
                      documents.filter(d => d.document_type?.includes('xray') || d.document_type?.includes('mri') || d.document_type?.includes('scanner') || d.document_type?.includes('imaging')).map((doc, i) => (
                        <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: i < documents.length - 1 ? `1px solid ${border}` : "none" }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon name="radiology" size={18} style={{ color: "#ea580c" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{doc.title || "Medical Imaging"}</div>
                            <div style={{ fontSize: 12, color: muted }}>{doc.document_type} · {doc.document_date ? new Date(doc.document_date).toLocaleDateString() : "—"}</div>
                            {doc.description && <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{doc.description}</div>}
                          </div>
                          {doc.file_path && (
                            <button style={{ display: "flex", alignItems: "center", gap: 5, background: dark ? "#1e293b" : "#f1f5f9", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, color: muted, cursor: "pointer" }}>
                              <Icon name="visibility" size={13} /> View
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Right sidebar panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Vitals */}
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Vital Signs</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {vitals.map((v, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: muted }}>{v.label}</span>
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{v.value} <span style={{ fontSize: 11, fontWeight: 500, color: muted }}>{v.unit}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Allergies & Risks</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {allergies.map((a, i) => (
                      <span key={i} style={{ background: a.bg, color: a.color, border: `1px solid ${a.border}`, borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 800 }}>
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Imaging Thumbnails */}
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Recent Imaging</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {imagingItems.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setImagingModal(img)}
                        style={{ aspectRatio: "1", background: dark ? "#0f172a" : "#f1f5f9", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", overflow: "hidden", border: `1px solid ${border}`, transition: "all 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2463eb")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
                      >
                        <span style={{ fontSize: 32 }}>{img.emoji}</span>
                        <span style={{ fontSize: 10, color: muted, fontWeight: 600, marginTop: 6 }}>{img.label}</span>
                        <div
                          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.3)"; e.currentTarget.querySelector("span").style.opacity = "1"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0)"; e.currentTarget.querySelector("span").style.opacity = "0"; }}
                        >
                          <span style={{ opacity: 0, transition: "opacity 0.2s" }}>
                            <Icon name="visibility" size={22} style={{ color: "#fff" }} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button style={{ width: "100%", padding: "10px", background: "transparent", border: "1.5px solid #bfdbfe", borderRadius: 10, color: "#2463eb", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    View All Imaging
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── New Consultation Modal (triggered from Sidebar) ── */}
      {consultModal && (
        <div onClick={() => setConsultModal(false)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 32, width: 420, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>New Consultation</h2>
              <button onClick={() => setConsultModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><Icon name="close" size={20} /></button>
            </div>
            <div style={{ color: muted, fontSize: 13 }}>Start a new consultation from this patient's profile.</div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setConsultModal(false)} style={{ flex: 1, padding: "12px", border: `1.5px solid ${border}`, borderRadius: 10, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setConsultModal(false)} style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {editModal && (
        <div onClick={() => setEditModal(false)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 32, width: 460, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Edit Patient Profile</h2>
              <button onClick={() => setEditModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><Icon name="close" size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["Full Name", "name"], ["Age", "age"], ["Gender", "gender"], ["Blood Type", "blood"], ["Weight", "weight"], ["Height", "height"]].map(([label, key]) => (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6 }}>{label}</div>
                  <input value={editForm[key]} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#2463eb")} onBlur={(e) => (e.target.style.borderColor = border)} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditModal(false)} style={{ flex: 1, padding: "11px", border: `1.5px solid ${border}`, borderRadius: 10, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Contact Patient Modal ── */}
      {contactModal && (
        <div onClick={() => setContactModal(false)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 32, width: 380, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Contact {displayPatient.name}</h2>
              <button onClick={() => setContactModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><Icon name="close" size={20} /></button>
            </div>
            {[{ icon: "phone", label: "Call", value: "+1 (555) 123-4567" }, { icon: "mail", label: "Email", value: "john.doe@email.com" }, { icon: "chat_bubble", label: "Message", value: "Send in-app message" }].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: dark ? "#0f172a" : "#f8fafc", borderRadius: 12, marginBottom: 10, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={c.icon} size={18} style={{ color: "#2463eb" }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: muted }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Imaging Modal ── */}
      {imagingModal && (
        <div onClick={() => setImagingModal(null)} style={{ position: "fixed", inset: 0, background: "#00000080", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 32, width: 360, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>{imagingModal.emoji}</div>
            <h3 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 18 }}>{imagingModal.label}</h3>
            <p style={{ margin: "0 0 20px", color: muted, fontSize: 13 }}>{imagingModal.desc}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setImagingModal(null)} style={{ flex: 1, padding: "11px", border: `1.5px solid ${border}`, borderRadius: 10, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Close</button>
              <button style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="download" size={15} style={{ color: "#fff" }} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
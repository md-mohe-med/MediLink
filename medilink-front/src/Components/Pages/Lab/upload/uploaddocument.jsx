import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LabSidebar from "../sidebar/side";
import api from "../../../../api/axios";
import useDarkMode from "../../../../contexts/DarkModeContext";

function Icon({ name, size = 18, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>
      {name}
    </span>
  );
}

const testTypes = [
  "COVID-19 PCR",
  "Glucose Test",
  "Liver Function",
  "Thyroid Panel",
  "Blood Count",
];

export default function UploadLabResults() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Lab Results");
  const [dark, setDark] = useDarkMode();

  // Patient search
  const [searchQuery, setSearchQuery] = useState("");
  const [foundPatient, setFoundPatient] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);

  // Metadata
  const [meta, setMeta] = useState({ type: "", date: "", time: "", tech: "", priority: "NORMAL" });
  const [metaErrors, setMetaErrors] = useState({});

  // Files
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const bg       = dark ? "#0f172a" : "#f6f6f8";
  const card     = dark ? "#1e293b" : "#ffffff";
  const border   = dark ? "#334155" : "#e2e8f0";
  const text     = dark ? "#f1f5f9" : "#0f172a";
  const muted    = dark ? "#94a3b8" : "#64748b";
  const inputBg  = dark ? "#0f172a" : "#f8fafc";

  const inputStyle = {
    width: "100%", background: inputBg, border: `1.5px solid ${border}`,
    borderRadius: 9, padding: "9px 12px", fontSize: 13, color: text,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border 0.2s",
  };

  // Search for patient via API
  const handleSearch = async (val) => {
    setSearchQuery(val);
    setNotFound(false);
    setUploadError("");

    if (val.length < 3) {
      setFoundPatient(null);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/lab/verify-patient?patient_id=${encodeURIComponent(val.toUpperCase().trim())}`);
      if (response.data.found) {
        setFoundPatient(response.data.patient);
        setNotFound(false);
      } else {
        setFoundPatient(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error("Patient search failed:", err);
      setFoundPatient(null);
      if (err.response?.status === 404) {
        setNotFound(true);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleFileAdd = (newFiles) => {
    const added = Array.from(newFiles).map((f, i) => ({
      id: Date.now() + i,
      file: f,
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
      icon: f.type.includes("pdf") ? "picture_as_pdf" : "image",
      color: f.type.includes("pdf") ? "#ef4444" : "#2463eb",
    }));
    setFiles(prev => [...prev, ...added]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileAdd(e.dataTransfer.files);
  };

  const validate = () => {
    const errs = {};
    if (!foundPatient)    errs.patient = "Please select a valid patient.";
    if (!meta.type)       errs.type    = "Test type is required.";
    if (!meta.date)       errs.date    = "Date is required.";
    if (!meta.tech.trim()) errs.tech   = "Technician name is required.";
    if (files.length === 0) errs.files = "At least one file is required.";
    setMetaErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("patient_id", foundPatient.id);
      formData.append("document_type", meta.type);
      formData.append("title", `${meta.type} Results`);
      formData.append("description", `Uploaded by ${meta.tech} on ${meta.date} ${meta.time}`);
      formData.append("test_date", meta.date);
      formData.append("file", files[0].file);

      await api.post("/lab/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError(err.response?.data?.message || "Failed to upload results. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setSearchQuery(""); setFoundPatient(null); setNotFound(false);
    setMeta({ type: "", date: "", time: "", tech: "", priority: "NORMAL" });
    setFiles([]); setMetaErrors({});
    setCleared(true); setTimeout(() => setCleared(false), 2000);
  };

  const handleDraft = () => {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  };

  if (submitted) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: card, borderRadius: 24, padding: "48px 40px", textAlign: "center", border: `1px solid ${border}`, maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Icon name="check_circle" size={36} style={{ color: "#16a34a" }} />
          </div>
          <h2 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: 22, color: text }}>Results Submitted!</h2>
          <p style={{ color: muted, fontSize: 14, marginBottom: 28 }}>
            Lab results for <strong style={{ color: text }}>{foundPatient?.name}</strong> have been successfully uploaded and linked to their record.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => { setSubmitted(false); handleClear(); }}
              style={{ background: "#2463eb", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px #2463eb30" }}>
              Upload Another
            </button>
            <button onClick={() => navigate('/lab/dashboard')}
              style={{ background: "transparent", color: text, border: `1.5px solid ${border}`, borderRadius: 12, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: bg, fontFamily: "'DM Sans', sans-serif", color: text, transition: "all 0.3s" }}>

        {/* ── Sidebar ── */}
        <LabSidebar
          dark={dark}
          setDark={setDark}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
        />

        {/* ── Main ── */}
        <main style={{ flex: 1, marginLeft: 260, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header */}
          <header style={{ height: 64, background: dark ? "#0f172a" : "#ffffff", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Lab Portal</span>
              <div style={{ width: 1, height: 22, background: border }} />
              <div style={{ display: "flex", gap: 6, fontSize: 13, color: muted }}>
                <span style={{ cursor: "pointer" }} onMouseEnter={e => e.target.style.color = "#2463eb"} onMouseLeave={e => e.target.style.color = muted}>Records</span>
                <span>/</span>
                <span style={{ color: text, fontWeight: 600 }}>Upload New Results</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {["notifications", "help"].map(ic => (
                <button key={ic} style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9, background: dark ? "#1e293b" : "#f8fafc", border: "none", cursor: "pointer", color: muted }}>
                  <Icon name={ic} size={19} />
                </button>
              ))}
            </div>
          </header>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 30px" }}>
            <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Toast notifications */}
              {(cleared || draftSaved || uploadError) && (
                <div style={{ 
                  background: uploadError ? "#fef2f2" : cleared ? "#fef9c3" : "#eff6ff", 
                  border: `1px solid ${uploadError ? "#fecaca" : cleared ? "#fde047" : "#bfdbfe"}`, 
                  borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, 
                  color: uploadError ? "#b91c1c" : cleared ? "#713f12" : "#1d4ed8", fontSize: 13, fontWeight: 700 
                }}>
                  <Icon name={uploadError ? "error" : cleared ? "refresh" : "save"} size={16} />
                  {uploadError || (cleared ? "All fields cleared." : "Draft saved successfully!")}
                </div>
              )}

              <div>
                <h1 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: 26, letterSpacing: "-0.5px" }}>Upload Lab Results</h1>
                <p style={{ margin: 0, color: muted, fontSize: 14 }}>Associate diagnostic files with a patient record and specify test metadata.</p>
              </div>

              {/* Patient Selection */}
              <div style={{ background: card, border: `1px solid ${metaErrors.patient || notFound ? "#fca5a5" : border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", borderBottom: `1px solid ${border}` }}>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>Patient Selection</div>
                  <div style={{ fontSize: 13, color: muted }}>Search by Medical ID (e.g., MED-2024-12345)</div>
                </div>
                <div style={{ padding: "20px 22px" }}>
                  <div style={{ position: "relative", maxWidth: 480 }}>
                    <Icon name="search" size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: muted }} />
                    <input 
                      value={searchQuery} 
                      onChange={e => handleSearch(e.target.value)}
                      onFocus={() => setSearchFocused(true)} 
                      onBlur={() => setSearchFocused(false)}
                      placeholder="Find Patient by Medical ID"
                      disabled={searching}
                      style={{ 
                        ...inputStyle, 
                        paddingLeft: 38, 
                        border: `1.5px solid ${searchFocused ? "#2463eb" : metaErrors.patient || notFound ? "#fca5a5" : border}` 
                      }} 
                    />
                    {searching && (
                      <Icon name="sync" size={18} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: muted, animation: "spin 1s linear infinite" }} />
                    )}
                  </div>

                  {foundPatient && (
                    <div style={{ marginTop: 16, padding: "14px 18px", borderRadius: 12, border: "2px dashed #93c5fd", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#2463eb20", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#2463eb", fontSize: 14 }}>{foundPatient.initials}</div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: "#1e40af" }}>{foundPatient.name}</div>
                          <div style={{ fontSize: 12, color: "#3b82f6" }}>DOB: {foundPatient.dob} · ID: {foundPatient.id}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#dcfce7", border: "1px solid #86efac", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 800, color: "#15803d" }}>
                        <Icon name="check_circle" size={14} style={{ color: "#16a34a" }} /> Verified Record
                      </div>
                    </div>
                  )}

                  {notFound && !foundPatient && (
                    <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#dc2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name="error" size={16} style={{ color: "#ef4444" }} /> No patient found with that ID.
                    </div>
                  )}
                  {metaErrors.patient && <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{metaErrors.patient}</div>}
                </div>
              </div>

              {/* Metadata + File Upload */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* Metadata */}
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "22px" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 18 }}>Test Metadata</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 6 }}>Test Type</div>
                      <select value={meta.type} onChange={e => setMeta({ ...meta, type: e.target.value })}
                        style={{ ...inputStyle, border: `1.5px solid ${metaErrors.type ? "#fca5a5" : border}`, cursor: "pointer" }}
                        onFocus={e => e.target.style.borderColor = "#2463eb"} onBlur={e => e.target.style.borderColor = metaErrors.type ? "#fca5a5" : border}>
                        <option value="">Select test category...</option>
                        {testTypes.map(t => <option key={t}>{t}</option>)}
                      </select>
                      {metaErrors.type && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{metaErrors.type}</div>}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 6 }}>Date Conducted</div>
                        <input type="date" value={meta.date} onChange={e => setMeta({ ...meta, date: e.target.value })}
                          style={{ ...inputStyle, border: `1.5px solid ${metaErrors.date ? "#fca5a5" : border}` }}
                          onFocus={e => e.target.style.borderColor = "#2463eb"} onBlur={e => e.target.style.borderColor = metaErrors.date ? "#fca5a5" : border} />
                        {metaErrors.date && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{metaErrors.date}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 6 }}>Time</div>
                        <input type="time" value={meta.time} onChange={e => setMeta({ ...meta, time: e.target.value })}
                          style={inputStyle}
                          onFocus={e => e.target.style.borderColor = "#2463eb"} onBlur={e => e.target.style.borderColor = border} />
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 6 }}>Lab Technician</div>
                      <div style={{ position: "relative" }}>
                        <Icon name="person" size={16} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: muted }} />
                        <input value={meta.tech} onChange={e => setMeta({ ...meta, tech: e.target.value })}
                          placeholder="Technician Name or ID"
                          style={{ ...inputStyle, paddingLeft: 34, border: `1.5px solid ${metaErrors.tech ? "#fca5a5" : border}` }}
                          onFocus={e => e.target.style.borderColor = "#2463eb"} onBlur={e => e.target.style.borderColor = metaErrors.tech ? "#fca5a5" : border} />
                      </div>
                      {metaErrors.tech && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{metaErrors.tech}</div>}
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8 }}>Priority Level</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {["NORMAL", "URGENT", "STAT"].map(p => {
                          const isActive = meta.priority === p;
                          const activeColor = p === "URGENT" ? "#2463eb" : p === "STAT" ? "#dc2626" : "#16a34a";
                          return (
                            <button key={p} onClick={() => setMeta({ ...meta, priority: p })}
                              style={{ flex: 1, padding: "8px 6px", fontSize: 11, fontWeight: 800, borderRadius: 9, border: `1.5px solid ${isActive ? activeColor : border}`, background: isActive ? `${activeColor}15` : "transparent", color: isActive ? activeColor : muted, cursor: "pointer", transition: "all 0.2s" }}>
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div style={{ background: card, border: `1px solid ${metaErrors.files ? "#fca5a5" : border}`, borderRadius: 16, padding: "22px", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Result Files</div>
                  <div style={{ fontSize: 13, color: muted, marginBottom: 16 }}>Upload PDF, JPG, or PNG files. Max 20MB per file.</div>

                  <div
                    onClick={() => fileRef.current.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px dashed ${dragging ? "#2463eb" : border}`, borderRadius: 14, background: dragging ? "#eff6ff" : dark ? "#0f172a50" : "#f8fafc", cursor: "pointer", padding: "28px 16px", transition: "all 0.2s", minHeight: 140 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, transition: "transform 0.2s", transform: dragging ? "scale(1.1)" : "scale(1)" }}>
                      <Icon name="upload_file" size={28} style={{ color: "#2463eb" }} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Click to upload or drag & drop</div>
                    <div style={{ fontSize: 12, color: muted }}>PDF, PNG, JPG or DICOM</div>
                    <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={e => handleFileAdd(e.target.files)} />
                  </div>
                  {metaErrors.files && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6, fontWeight: 600 }}>{metaErrors.files}</div>}

                  {files.length > 0 && (
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                      {files.map(f => (
                        <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: dark ? "#0f172a" : "#f8fafc", borderRadius: 10, border: `1px solid ${border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                            <Icon name={f.icon} size={20} style={{ color: f.color, flexShrink: 0 }} />
                            <div style={{ overflow: "hidden" }}>
                              <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                              <div style={{ fontSize: 11, color: muted }}>{f.size} · Complete</div>
                            </div>
                          </div>
                          <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}
                            style={{ background: "none", border: "none", cursor: "pointer", color: muted, display: "flex", flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                            onMouseLeave={e => e.currentTarget.style.color = muted}>
                            <Icon name="delete" size={17} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${border}`, paddingTop: 20 }}>
                <button onClick={handleClear}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "transparent", color: muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = dark ? "#1e293b" : "#f1f5f9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  Clear All Fields
                </button>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={handleDraft}
                    style={{ padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${border}`, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = dark ? "#1e293b" : "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    Save as Draft
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 28px", borderRadius: 10, border: "none", background: submitting ? "#93c5fd" : "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 4px 14px #2463eb30", transition: "all 0.2s" }}>
                    {submitting
                      ? <><Icon name="sync" size={15} style={{ color: "#fff", animation: "spin 1s linear infinite" }} /> Submitting...</>
                      : <><span>Submit Results</span><Icon name="send" size={15} style={{ color: "#fff" }} /></>
                    }
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}
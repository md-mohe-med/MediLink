import PatientSidebar from "../sidebar/sidebar";
import { useState, useEffect } from "react";
import api from "../../../../api/axios";
import useDarkMode from "../../../../contexts/DarkModeContext";

const MS = ({ children, style }) => (
  <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1, ...style }}>{children}</span>
);

export default function PatientMedicalRecords() {
  const [darkMode, setDarkMode] = useDarkMode();
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('records');

  useEffect(() => {
    fetchRecords();
    fetchPrescriptions();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get("/patient/lab-results");
      setRecords(response.data);
    } catch (err) {
      console.error("Failed to fetch records:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);
      const response = await api.get("/patient/prescriptions");
      setPrescriptions(response.data);
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const getFileIcon = (filePath) => {
    if (filePath?.endsWith('.pdf')) return "picture_as_pdf";
    return "image";
  };

  const getFileColor = (filePath) => {
    if (filePath?.endsWith('.pdf')) return "#ef4444";
    return "#2463eb";
  };

  const bg = darkMode ? "#0f172a" : "#f6f6f8";
  const cardBg = darkMode ? "#1e293b" : "#fff";
  const textColor = darkMode ? "#f1f5f9" : "#0f172a";
  const mutedColor = darkMode ? "#94a3b8" : "#64748b";
  const borderColor = darkMode ? "#334155" : "#e2e8f0";

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      
      <div style={{ display: "flex", minHeight: "100vh", background: bg, transition: "all 0.3s" }}>
        <PatientSidebar dark={darkMode} setDark={setDarkMode} />
        
        <main style={{ flex: 1, marginLeft: 240, padding: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: textColor, marginBottom: "1.5rem" }}>
            <MS style={{ verticalAlign: "middle", marginRight: 12 }}>description</MS>
            Medical Records
          </h1>
          
          {/* Tabs */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: `2px solid ${borderColor}` }}>
            <button
              onClick={() => setActiveTab('records')}
              style={{
                padding: "12px 24px",
                background: "none",
                border: "none",
                borderBottom: activeTab === 'records' ? "3px solid #2463eb" : "3px solid transparent",
                color: activeTab === 'records' ? "#2463eb" : mutedColor,
                fontWeight: activeTab === 'records' ? 700 : 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <MS style={{ fontSize: 20 }}>folder</MS>
              Lab Results ({records.length})
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              style={{
                padding: "12px 24px",
                background: "none",
                border: "none",
                borderBottom: activeTab === 'prescriptions' ? "3px solid #2463eb" : "3px solid transparent",
                color: activeTab === 'prescriptions' ? "#2463eb" : mutedColor,
                fontWeight: activeTab === 'prescriptions' ? 700 : 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <MS style={{ fontSize: 20 }}>medication</MS>
              Prescriptions ({prescriptions.length})
            </button>
          </div>
          
          {/* Lab Results Tab */}
          {activeTab === 'records' && (
            <>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                  <MS style={{ fontSize: 32, color: "#94a3b8", animation: "spin 1s linear infinite" }}>sync</MS>
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : records.length === 0 ? (
                <div style={{ 
                  background: cardBg, borderRadius: 16, padding: "3rem", 
                  textAlign: "center", border: `1px solid ${borderColor}`
                }}>
                  <div style={{ 
                    width: 80, height: 80, background: "#f1f5f9", 
                    borderRadius: "50%", display: "flex", alignItems: "center", 
                    justifyContent: "center", margin: "0 auto 1.5rem"
                  }}>
                    <MS style={{ fontSize: 40, color: "#94a3b8" }}>folder_open</MS>
                  </div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: textColor, marginBottom: 8 }}>
                    No Lab Results
                  </h2>
                  <p style={{ color: "#64748b" }}>
                    Your lab results will appear here once your lab uploads them.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {records.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      style={{
                        background: cardBg,
                        borderRadius: 12,
                        padding: "1.25rem 1.5rem",
                        border: `1px solid ${borderColor}`,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        transition: "all 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "#2463eb";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(36,99,235,0.1)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                      }}
                    >
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        background: `${getFileColor(record.file_path)}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <MS style={{ fontSize: 24, color: getFileColor(record.file_path) }}>
                          {getFileIcon(record.file_path)}
                        </MS>
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "1rem", color: textColor, marginBottom: 4 }}>
                          {record.title}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{record.test_type}</span>
                          <span style={{ color: "#cbd5e1" }}>•</span>
                          <span>{record.lab_name}</span>
                          <span style={{ color: "#cbd5e1" }}>•</span>
                          <span>{record.uploaded_at}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(record);
                        }}
                        style={{
                          padding: "8px 16px",
                          background: "#2463eb",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}>
                        <MS style={{ fontSize: 18 }}>visibility</MS>
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <>
              {loadingPrescriptions ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                  <MS style={{ fontSize: 32, color: "#94a3b8", animation: "spin 1s linear infinite" }}>sync</MS>
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : prescriptions.length === 0 ? (
                <div style={{ 
                  background: cardBg, 
                  borderRadius: 20, 
                  padding: "3rem", 
                  textAlign: "center", 
                  border: `2px dashed ${borderColor}`
                }}>
                  <div style={{ 
                    width: 90, 
                    height: 90, 
                    background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    margin: "0 auto 1.5rem",
                    boxShadow: "0 4px 12px rgba(22,163,74,0.15)"
                  }}>
                    <MS style={{ fontSize: 44, color: "#16a34a" }}>medication</MS>
                  </div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
                    No Prescriptions Yet
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "1rem", maxWidth: 400, margin: "0 auto" }}>
                    Your prescriptions will appear here once your doctor adds them to your medical record.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1.25rem" }}>
                  {prescriptions.map((prescription, index) => (
                    <div
                      key={prescription.id}
                      style={{
                        background: cardBg,
                        borderRadius: 16,
                        padding: "1.75rem",
                        border: `1px solid ${borderColor}`,
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
                        transition: "all 0.3s ease",
                        position: "relative",
                        overflow: "hidden"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0,0,0,0.08), 0 10px 10px -5px rgba(0,0,0,0.02)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)";
                      }}
                    >
                      {/* Status Badge */}
                      <div style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        padding: "6px 14px",
                        background: prescription.status === 'active' ? "#dcfce7" : "#f1f5f9",
                        color: prescription.status === 'active' ? "#16a34a" : "#64748b",
                        borderRadius: 20,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {prescription.status}
                      </div>

                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                        <div style={{
                          width: 56,
                          height: 56,
                          borderRadius: 14,
                          background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 10px rgba(22,163,74,0.2)"
                        }}>
                          <MS style={{ fontSize: 28, color: "#16a34a" }}>medication</MS>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: textColor, marginBottom: 4 }}>
                            {prescription.doctor_name}
                          </div>
                          <div style={{ fontSize: "0.875rem", color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                            <MS style={{ fontSize: 16 }}>calendar_today</MS>
                            {new Date(prescription.prescription_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Divider */}
                      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #e2e8f0, transparent)", margin: "1rem 0" }} />
                      
                      {/* Medications */}
                      {prescription.medications.length > 0 && (
                        <div style={{ marginBottom: "1.25rem" }}>
                          <div style={{ 
                            fontSize: "0.75rem", 
                            fontWeight: 700, 
                            color: "#475569", 
                            textTransform: "uppercase", 
                            letterSpacing: "1px", 
                            marginBottom: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}>
                            <MS style={{ fontSize: 14 }}>pill</MS>
                            Medications ({prescription.medications.length})
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {prescription.medications.map((med, idx) => (
                              <div 
                                key={idx} 
                                style={{ 
                                  background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", 
                                  borderRadius: 10, 
                                  padding: "0.875rem 1rem",
                                  border: "1px solid #e2e8f0",
                                  borderLeft: "4px solid #16a34a"
                                }}
                              >
                                <div style={{ fontWeight: 700, color: textColor, fontSize: "0.95rem", marginBottom: 6 }}>
                                  {med.name}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                  <span style={{ 
                                    fontSize: "0.75rem", 
                                    color: "#475569", 
                                    background: "#e2e8f0", 
                                    padding: "3px 10px", 
                                    borderRadius: 6,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3
                                  }}>
                                    <MS style={{ fontSize: 12 }}>straighten</MS>
                                    {med.dose}
                                  </span>
                                  <span style={{ 
                                    fontSize: "0.75rem", 
                                    color: "#475569", 
                                    background: "#e2e8f0", 
                                    padding: "3px 10px", 
                                    borderRadius: 6,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3
                                  }}>
                                    <MS style={{ fontSize: 12 }}>schedule</MS>
                                    {med.frequency}
                                  </span>
                                  <span style={{ 
                                    fontSize: "0.75rem", 
                                    color: "#475569", 
                                    background: "#e2e8f0", 
                                    padding: "3px 10px", 
                                    borderRadius: 6,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3
                                  }}>
                                    <MS style={{ fontSize: 12 }}>timer</MS>
                                    {med.duration}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Notes */}
                      {prescription.notes && (
                        <div style={{ 
                          background: "#fefce8", 
                          borderRadius: 10, 
                          padding: "1rem",
                          border: "1px solid #fde047",
                          borderLeft: "4px solid #eab308"
                        }}>
                          <div style={{ 
                            fontSize: "0.7rem", 
                            fontWeight: 700, 
                            color: "#a16207", 
                            textTransform: "uppercase", 
                            letterSpacing: "0.5px", 
                            marginBottom: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}>
                            <MS style={{ fontSize: 14 }}>sticky_note_2</MS>
                            Doctor's Notes
                          </div>
                          <p style={{ margin: 0, fontSize: "0.875rem", color: "#713f12", lineHeight: 1.5, fontStyle: "italic" }}>
                            "{prescription.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal Window */}
      {selectedRecord && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "85vh",
              overflow: "hidden",
              boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
              animation: "modalSlideIn 0.3s ease-out",
              position: "relative"
            }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`
              @keyframes modalSlideIn {
                from { opacity: 0; transform: translateY(-30px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #2463eb 0%, #1d4ed8 100%)",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <MS style={{ fontSize: 24, color: "#fff" }}>{getFileIcon(selectedRecord.file_path)}</MS>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>
                    {selectedRecord.title}
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "rgba(255,255,255,0.8)" }}>
                    {selectedRecord.test_type}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "8px",
                  display: "flex",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              >
                <MS style={{ fontSize: 24, color: "#fff" }}>close</MS>
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div style={{ padding: "24px", overflowY: "auto", maxHeight: "calc(85vh - 140px)" }}>
              {/* Info Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                    Lab
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
                    {selectedRecord.lab_name}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                    Test Date
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
                    {selectedRecord.test_date ? new Date(selectedRecord.test_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                    Uploaded
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
                    {selectedRecord.uploaded_at}
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {selectedRecord.description && (
                <div style={{ 
                  background: "#f0f9ff", 
                  padding: "16px 20px", 
                  borderRadius: "12px", 
                  border: "1px solid #bae6fd",
                  marginBottom: "20px"
                }}>
                  <div style={{ fontSize: "0.75rem", color: "#0369a1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <MS style={{ fontSize: 16 }}>info</MS>
                    Description
                  </div>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#0c4a6e", lineHeight: 1.6 }}>
                    {selectedRecord.description}
                  </p>
                </div>
              )}
              
              {/* File Section */}
              <div style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                border: "2px dashed #cbd5e1",
                borderRadius: "16px",
                padding: "32px",
                textAlign: "center"
              }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: "16px",
                  background: getFileColor(selectedRecord.file_path) + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px"
                }}>
                  <MS style={{ fontSize: 40, color: getFileColor(selectedRecord.file_path) }}>
                    {getFileIcon(selectedRecord.file_path)}
                  </MS>
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                  Lab Result File
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: "0.875rem", color: "#64748b" }}>
                  Click the button below to view or download your result
                </p>
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get(`/patient/lab-results/${selectedRecord.id}/view`, {
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
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px 28px",
                    background: "#2463eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    boxShadow: "0 4px 14px rgba(36,99,235,0.3)",
                    transition: "all 0.2s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#1d4ed8";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "#2463eb";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <MS style={{ fontSize: 22 }}>open_in_new</MS>
                  Open & View File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


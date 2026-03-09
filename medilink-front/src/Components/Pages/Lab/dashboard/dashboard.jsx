import { useState, useEffect } from "react";
import LabSidebar from "../sidebar/side";
import api from "../../../../api/axios";
import useDarkMode from "../../../../contexts/DarkModeContext";

const equipment = [
  { name: "Hematology Analyzer A1", status: "active", pct: 85 },
  { name: "PCR Thermal Cycler B4", status: "calibration", pct: 40 },
  { name: "Chemistry Analyzer C2", status: "active", pct: 92 },
];

const staff = ["AL", "BK", "CW", "DM"];

const statusConfig = {
  completed: { color: "#07883d", bg: "#f0fdf4", dot: "#07883d", label: "Completed", icon: null },
  processing: { color: "#2463eb", bg: "#eff6ff", dot: "#2463eb", label: "Processing", icon: "sync" },
  pending: { color: "#e73c08", bg: "#fff7ed", dot: "#e73c08", label: "Pending", icon: null },
};

function Icon({ name, size = 20, style = {}, spin = false }) {
  return (
    <span className="material-symbols-outlined"
      style={{ fontSize: size, lineHeight: 1, animation: spin ? "spin 1s linear infinite" : "none", ...style }}>
      {name}
    </span>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, change, changeColor, changeIcon, sub, dark, border, card }) {
  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "all 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, color: dark ? "#94a3b8" : "#64748b", fontWeight: 500, marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-1px" }}>{value}</div>
        </div>
        <div style={{ background: iconBg, borderRadius: 12, padding: 10, display: "flex" }}>
          <Icon name={icon} size={22} style={{ color: iconColor }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: changeColor }}>
        <Icon name={changeIcon} size={16} style={{ color: changeColor }} />
        {change}
        <span style={{ color: dark ? "#64748b" : "#94a3b8", fontWeight: 400, fontSize: 12 }}>{sub}</span>
      </div>
    </div>
  );
}

export default function LabDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [dark, setDark] = useDarkMode();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [viewModal, setViewModal] = useState(null);
  const [newSampleModal, setNewSampleModal] = useState(false);
  const [newSample, setNewSample] = useState({ id: "", test: "Blood Count", reg: "" });
  const [sampleAdded, setSampleAdded] = useState(false);
  const [spinIds, setSpinIds] = useState(new Set());
  const [uploads, setUploads] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bg = dark ? "#0f172a" : "#f6f6f8";
  const card = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "#334155" : "#dbdee6";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const rowHover = dark ? "#243044" : "#f8fafc";
  const inputBg = dark ? "#0f172a" : "#f8fafc";

  const inputStyle = { width: "100%", background: inputBg, border: `1.5px solid ${border}`, borderRadius: 9, padding: "9px 12px", fontSize: 13, color: text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  // Fetch data from API
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError("");
      try {
        const [dashRes, uploadsRes] = await Promise.all([
          api.get("/lab/dashboard"),
          api.get("/lab/uploads"),
        ]);

        if (!mounted) return;

        // Use dashboard stats directly from API
        setUploads(dashRes.data.uploads_today || 0);
        setTotalProcessed(dashRes.data.total_processed || 0);

        // Map uploads to table rows from paginated response
        const mappedRows = (uploadsRes.data.data || []).map(u => ({
          id: u.patient?.name || 'Unknown',
          patient_id: u.patient_id,
          reg: u.test_date ? new Date(u.test_date).toISOString().split('T')[0] : new Date(u.created_at).toISOString().split('T')[0],
          time: new Date(u.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          test: u.document_type || u.title,
          status: "completed",
          title: u.title,
          description: u.description,
          dbId: u.id,
          file_path: u.file_path,
        }));
        setRows(mappedRows);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load lab dashboard:", err);
        setError("Unable to load dashboard data. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Animate processing rows
  useEffect(() => {
    const t = setInterval(() => { setSpinIds(prev => new Set([...prev])); }, 100);
    return () => clearInterval(t);
  }, []);

  const filtered = rows.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.test.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSample = () => {
    if (!newSample.id.trim()) return;
    const s = {
      id: newSample.id.toUpperCase(),
      reg: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      test: newSample.test,
      status: "pending",
    };
    setRows(prev => [s, ...prev]);
    setUploads(u => u + 1);
    setSampleAdded(true);
    setTimeout(() => { setNewSampleModal(false); setSampleAdded(false); setNewSample({ id: "", test: "Blood Count", reg: "" }); }, 1500);
  };

  const handleAssign = (id) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: "processing" } : r));
    setSpinIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setRows(prev => prev.map(r => r.id === id ? { ...r, status: "completed" } : r));
    }, 4000);
  };

  const eqColor = s => s === "active" ? "#07883d" : "#e73c08";
  const eqBg = s => s === "active" ? "#f0fdf4" : "#fff7ed";

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: bg, fontFamily: "'DM Sans', sans-serif", color: text, transition: "all 0.3s" }}>

        {/* ── Sidebar ── */}
        <LabSidebar
          dark={dark}
          setDark={setDark}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
        />

        {/* ── Main ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>

          {/* Header */}
          <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: dark ? "#0f172a" : "#ffffff", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
            <div style={{ position: "relative", width: 360 }}>
              <Icon name="search" size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: muted }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient ID, test name..."
                style={{ width: "100%", background: dark ? "#1e293b" : "#f6f6f8", border: "none", borderRadius: 10, padding: "9px 14px 9px 38px", fontSize: 13, color: text, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: dark ? "#1e293b" : "#f6f6f8", border: "none", cursor: "pointer", color: muted, position: "relative" }}>
                <Icon name="notifications" size={20} />
                <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, background: "#e73c08", borderRadius: "50%", border: "2px solid white" }} />
              </button>
              <button onClick={() => setNewSampleModal(true)}
                style={{ display: "flex", alignItems: "center", gap: 7, background: "#2463eb", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px #2463eb30" }}>
                <Icon name="add" size={18} style={{ color: "#fff" }} />
                New Sample
              </button>
            </div>
          </header>

          <div style={{ padding: "28px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 24 }}>

            <div>
              <h2 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: 26, letterSpacing: "-0.5px" }}>Laboratory Dashboard</h2>
              <p style={{ margin: 0, color: muted, fontSize: 14 }}>Real-time monitoring of diagnostic data and processing status.</p>
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

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
              <StatCard icon="cloud_upload" iconBg="#eff6ff" iconColor="#2463eb" label="Uploads Today" value={uploads.toLocaleString()} change="" changeColor="#07883d" changeIcon="trending_up" sub="today" dark={dark} border={border} card={card} />
              <StatCard icon="hourglass_empty" iconBg="#fff7ed" iconColor="#e73c08" label="Pending Results" value={rows.filter(r => r.status === "pending").length.toString()} change="" changeColor="#e73c08" changeIcon="trending_down" sub="in queue" dark={dark} border={border} card={card} />
              <StatCard icon="task_alt" iconBg="#f0fdf4" iconColor="#07883d" label="Total Processed" value={totalProcessed.toLocaleString()} change="" changeColor="#07883d" changeIcon="trending_up" sub="all time" dark={dark} border={border} card={card} />
            </div>

            {/* Table */}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${border}` }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: 17 }}>Recent Uploads</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ padding: "7px 14px", border: `1.5px solid ${border}`, borderRadius: 9, background: "transparent", color: muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Export CSV</button>
                  <button style={{ padding: "7px 14px", border: "none", borderRadius: 9, background: dark ? "#f1f5f9" : "#0f172a", color: dark ? "#0f172a" : "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View All</button>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: dark ? "#243044" : "#f8fafc" }}>
                      {["Patient ID", "Upload Time", "Test Type", "Status", "Action"].map((h, i) => (
                        <th key={h} style={{ padding: "12px 22px", fontSize: 11, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 0.8, textAlign: i === 4 ? "right" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const s = statusConfig[r.status];
                      return (
                        <tr key={r.id} style={{ borderTop: `1px solid ${border}`, transition: "background 0.15s", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background = rowHover}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "16px 22px" }}>
                            <div style={{ fontWeight: 800, fontSize: 14 }}>{r.id}</div>
                            <div style={{ fontSize: 11, color: muted }}>Reg: {r.reg}</div>
                          </td>
                          <td style={{ padding: "16px 22px", fontSize: 13, color: muted }}>{r.time}</td>
                          <td style={{ padding: "16px 22px" }}>
                            <span style={{ background: dark ? "#1e293b" : "#f1f5f9", color: muted, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{r.test}</span>
                          </td>
                          <td style={{ padding: "16px 22px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              {s.icon
                                ? <Icon name={s.icon} size={14} style={{ color: s.color, animation: "spin 1s linear infinite" }} />
                                : <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot }} />
                              }
                              <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: "16px 22px", textAlign: "right" }}>
                            {r.status === "completed" && <button onClick={() => setViewModal(r)} style={{ background: "none", border: "none", color: "#2463eb", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>View Result</button>}
                            {r.status === "processing" && <span style={{ color: muted, fontSize: 13, fontWeight: 600 }}>Reviewing...</span>}
                            {r.status === "pending" && <button onClick={() => handleAssign(r.id)} style={{ background: "none", border: "none", color: "#2463eb", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Assign</button>}
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: "28px", textAlign: "center", color: muted, fontSize: 13 }}>No results match your search.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, paddingBottom: 24 }}>

              {/* Equipment Status */}
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "24px" }}>
                <h4 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 16 }}>Equipment Status</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {equipment.map((eq, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: muted, fontWeight: 500 }}>{eq.name}</span>
                        <span style={{ background: eqBg(eq.status), color: eqColor(eq.status), borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                          {eq.status === "active" ? "Active" : "Calibration Required"}
                        </span>
                      </div>
                      <div style={{ height: 6, background: dark ? "#334155" : "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${eq.pct}%`, background: eqColor(eq.status), borderRadius: 999, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ fontSize: 11, color: muted, marginTop: 4, textAlign: "right" }}>{eq.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Availability */}
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "24px" }}>
                <h4 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 16 }}>Staff Availability</h4>
                <div style={{ display: "flex", marginBottom: 20 }}>
                  {staff.map((s, i) => (
                    <div key={i} style={{ width: 40, height: 40, borderRadius: "50%", background: `hsl(${i * 60 + 200}, 70%, 60%)`, border: "2px solid white", marginLeft: i > 0 ? -10 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff", zIndex: staff.length - i }}>
                      {s}
                    </div>
                  ))}
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: dark ? "#334155" : "#e2e8f0", border: "2px solid white", marginLeft: -10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, color: muted }}>+4</div>
                </div>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: muted, lineHeight: 1.7 }}>
                  Currently <strong style={{ color: text }}>8 lab technicians</strong> on shift. Average turnaround time is currently <span style={{ color: "#07883d", fontWeight: 800 }}>14.2 minutes</span>.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["On Shift", "8"], ["Available", "5"], ["On Break", "2"], ["Off Duty", "1"]].map(([k, v]) => (
                    <div key={k} style={{ background: dark ? "#0f172a" : "#f8fafc", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, color: muted, marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ── View Result Modal ── */}
      {viewModal && (
        <div onClick={() => setViewModal(null)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 32, width: 440, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Lab Result</h2>
              <button onClick={() => setViewModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><Icon name="close" size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {[["Patient ID", viewModal.id], ["Test", viewModal.test], ["Upload Time", viewModal.time], ["Registration", viewModal.reg], ["Status", "Completed ✓"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: dark ? "#0f172a" : "#f8fafc", borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: muted }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: k === "Status" ? "#07883d" : text }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setViewModal(null)} style={{ flex: 1, padding: "11px", border: `1.5px solid ${border}`, borderRadius: 10, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Close</button>
              <button style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="download" size={15} style={{ color: "#fff" }} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Sample Modal ── */}
      {newSampleModal && (
        <div onClick={() => setNewSampleModal(false)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 32, width: 420, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            {sampleAdded ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Icon name="check_circle" size={28} style={{ color: "#16a34a" }} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Sample Added!</div>
                <div style={{ color: muted, fontSize: 13 }}>Added to the pending queue.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>New Sample</h2>
                  <button onClick={() => setNewSampleModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><Icon name="close" size={20} /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6 }}>Patient ID</div>
                    <input value={newSample.id} onChange={e => setNewSample({ ...newSample, id: e.target.value })} placeholder="e.g. PT-1234" style={inputStyle} onKeyDown={e => e.key === "Enter" && handleAddSample()} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6 }}>Test Type</div>
                    <select value={newSample.test} onChange={e => setNewSample({ ...newSample, test: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      {["Blood Count", "Urinalysis", "Lipid Profile", "COVID-19 PCR", "Thyroid Panel", "Glucose", "Liver Function"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setNewSampleModal(false)} style={{ flex: 1, padding: "11px", border: `1.5px solid ${border}`, borderRadius: 10, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                  <button onClick={handleAddSample} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add Sample</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
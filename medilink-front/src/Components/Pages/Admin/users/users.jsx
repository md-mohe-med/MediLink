import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../../../api/axios';
import Sidebar from "../sidebar/sidebar";
import useDarkMode from "../../../../contexts/DarkModeContext";

const roleColors = {
  Doctor: { bg: "#dbeafe", color: "#1d4ed8" },
  Patient: { bg: "#f1f5f9", color: "#475569" },
  Lab: { bg: "#f3e8ff", color: "#7c3aed" },
  Admin: { bg: "#dcfce7", color: "#15803d" },
};

const statusConfig = {
  Active: { color: "#16a34a", dot: "#22c55e" },
  Pending: { color: "#d97706", dot: "#f59e0b" },
  Inactive: { color: "#94a3b8", dot: "#cbd5e1" },
};

function Icon({ name, size = 20, style = {} }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>{name}</span>;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [page, setPage] = useState(1);
  const [viewUser, setViewUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Patient" });
  const [addError, setAddError] = useState("");

  const bg = dark ? "#0f172a" : "#f6f6f8";
  const card = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "#334155" : "#e2e8f0";
  const text = dark ? "#f1f5f9" : "#0f172a";
  const muted = dark ? "#94a3b8" : "#64748b";
  const inputBg = dark ? "#0f172a" : "#f8fafc";
  const rowHover = dark ? "#243044" : "#f8fafc";
  const inputStyle = { background: inputBg, border: `1.5px solid ${border}`, borderRadius: 9, padding: "9px 12px", fontSize: 13, color: text, outline: "none", fontFamily: "inherit", transition: "border 0.2s" };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        const mapped = res.data.data.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
          status: u.status
            ? u.status.charAt(0).toUpperCase() + u.status.slice(1)
            : 'Pending',
          joined: new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          initials: u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          initBg: { doctor: '#eff6ff', patient: '#f1f5f9', lab: '#f3e8ff', admin: '#dcfce7' }[u.role] ?? '#f1f5f9',
          initColor: { doctor: '#2463eb', patient: '#475569', lab: '#7c3aed', admin: '#15803d' }[u.role] ?? '#475569',
        }));
        setUsers(mapped);
      } catch (err) {
        setFetchError('Failed to load users.');
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleStatus = async (id) => {
    const user = users.find(u => u.id === id);
    const newStatus = user.status === "Active" ? "inactive" : "active";
    try {
      await api.put(`/admin/users/${id}/status`, { status: newStatus });
      setUsers(prev => prev.map(u =>
        u.id === id
          ? { ...u, status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1) }
          : u
      ));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) { setAddError("Name and email are required."); return; }
    if (!newUser.email.includes("@")) { setAddError("Enter a valid email."); return; }
    const initials = newUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const roleColorMap = { Doctor: ["#eff6ff", "#2463eb"], Patient: ["#f1f5f9", "#475569"], Lab: ["#f3e8ff", "#7c3aed"], Admin: ["#dcfce7", "#15803d"] };
    const [initBg, initColor] = roleColorMap[newUser.role] || ["#f1f5f9", "#475569"];
    setUsers(prev => [{ id: Date.now(), ...newUser, initials, initBg, initColor, status: "Pending", joined: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }, ...prev]);
    setNewUser({ name: "", email: "", role: "Patient" });
    setAddError("");
    setAddModal(false);
  };

  const stats = [
    { label: "Total Users", value: users.length.toLocaleString(), color: text },
    { label: "Active Patients", value: users.filter(u => u.role === "Patient" && u.status === "Active").length, color: "#2463eb" },
    { label: "Doctors", value: users.filter(u => u.role === "Doctor").length, color: "#16a34a" },
    { label: "Pending Approval", value: users.filter(u => u.status === "Pending").length, color: "#f59e0b" },
  ];

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All Roles" || u.role === roleFilter;
    const matchStatus = statusFilter === "All Status" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: bg, fontFamily: "'DM Sans', sans-serif", color: text, transition: "all 0.3s" }}>

        <Sidebar dark={dark} setDark={setDark} />

        <main style={{ flex: 1, marginLeft: 240, padding: "28px" }}>

          {/* Page header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: 26, letterSpacing: "-0.5px" }}>User Management</h2>
              <p style={{ margin: 0, color: muted, fontSize: 14 }}>Manage, monitor, and configure all system accounts and permissions.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: `1.5px solid ${border}`, borderRadius: 10, background: card, color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                <Icon name="file_download" size={17} /> Export List
              </button>
              <button onClick={() => setAddModal(true)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px #2463eb30" }}>
                <Icon name="person_add" size={17} style={{ color: "#fff" }} /> Add New User
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Table Card */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>

            {/* Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: `1px solid ${border}`, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
                <Icon name="search" size={17} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: muted }} />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, email, or user ID..."
                  style={{ ...inputStyle, paddingLeft: 34, width: "100%", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#2463eb"} onBlur={e => e.target.style.borderColor = border} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[["Role", ["All Roles", "Doctor", "Patient", "Lab"], roleFilter, setRoleFilter],
                  ["Status", ["All Status", "Active", "Inactive", "Pending"], statusFilter, setStatusFilter]].map(([label, opts, val, setter]) => (
                  <select key={label} value={val} onChange={e => { setter(e.target.value); setPage(1); }}
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: dark ? "#243044" : "#f8fafc" }}>
                    {["User Details", "Role", "Status", "Joined Date", "Actions"].map((h, i) => (
                      <th key={h} style={{ padding: "12px 20px", fontSize: 11, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 0.8, textAlign: i === 4 ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: muted, fontSize: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <Icon name="sync" size={20} style={{ animation: "spin 1s linear infinite" }} /> Loading users...
                      </div>
                    </td></tr>
                  ) : fetchError ? (
                    <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#dc2626", fontSize: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Icon name="error" size={20} style={{ color: "#dc2626" }} /> {fetchError}
                      </div>
                    </td></tr>
                  ) : paged.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "28px", textAlign: "center", color: muted, fontSize: 13 }}>No users match your filters.</td></tr>
                  ) : paged.map((u) => {
                    const rc = roleColors[u.role] || roleColors.Patient;
                    const sc = statusConfig[u.status] || statusConfig.Inactive;
                    return (
                      <tr key={u.id} style={{ borderTop: `1px solid ${border}`, transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = rowHover}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: u.initBg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: u.initColor, fontSize: 13, flexShrink: 0 }}>{u.initials}</div>
                            <div>
                              <div 
                                onClick={() => navigate(`/admin/users/${u.id}`)}
                                style={{ fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#2463eb" }}
                              >
                                {u.name}
                              </div>
                              <div style={{ fontSize: 12, color: muted }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ background: rc.bg, color: rc.color, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{u.role}</span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: sc.color }}>{u.status}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: 13, color: muted }}>{u.joined}</td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                            <button onClick={() => setViewUser(u)} title="View"
                              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: muted, transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background = dark ? "#1e293b" : "#eff6ff"; e.currentTarget.style.color = "#2463eb"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = muted; }}>
                              <Icon name="visibility" size={18} />
                            </button>
                            <button onClick={() => toggleStatus(u.id)} title={u.status === "Active" ? "Deactivate" : "Activate"}
                              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: muted, transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#fffbeb"; e.currentTarget.style.color = "#d97706"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = muted; }}>
                              <Icon name={u.status === "Active" ? "block" : "check_circle"} size={18} />
                            </button>
                            <button onClick={() => setDeleteConfirm(u)} title="Delete"
                              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: muted, transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = muted; }}>
                              <Icon name="delete" size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: `1px solid ${border}`, background: dark ? "#1a2638" : "#fafafa" }}>
              <span style={{ fontSize: 12, color: muted }}>Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length} entries</span>
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${border}`, borderRadius: 8, background: card, cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1, color: muted }}>
                  <Icon name="chevron_left" size={17} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${p === page ? "#2463eb" : border}`, borderRadius: 8, background: p === page ? "#2463eb" : card, color: p === page ? "#fff" : text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${border}`, borderRadius: 8, background: card, cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1, color: muted }}>
                  <Icon name="chevron_right" size={17} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* View User Modal */}
      {viewUser && (
        <div onClick={() => setViewUser(null)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 32, width: 420, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>User Details</h2>
              <button onClick={() => setViewUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><Icon name="close" size={20} /></button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: inputBg, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: viewUser.initBg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: viewUser.initColor, fontSize: 18 }}>{viewUser.initials}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{viewUser.name}</div>
                <div style={{ fontSize: 13, color: muted }}>{viewUser.email}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["Role", viewUser.role], ["Status", viewUser.status], ["Joined", viewUser.joined]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: inputBg, borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: muted }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setViewUser(null)} style={{ flex: 1, padding: "11px", border: `1.5px solid ${border}`, borderRadius: 10, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Close</button>
              <button onClick={() => { toggleStatus(viewUser.id); setViewUser(null); }}
                style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: viewUser.status === "Active" ? "#fef3c7" : "#dcfce7", color: viewUser.status === "Active" ? "#d97706" : "#15803d", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {viewUser.status === "Active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 32, width: 380, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icon name="delete" size={24} style={{ color: "#dc2626" }} />
            </div>
            <h2 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 18 }}>Delete User?</h2>
            <p style={{ margin: "0 0 22px", color: muted, fontSize: 14 }}>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "11px", border: `1.5px solid ${border}`, borderRadius: 10, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => deleteUser(deleteConfirm.id)} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addModal && (
        <div onClick={() => setAddModal(false)} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: card, borderRadius: 20, padding: 32, width: 420, border: `1px solid ${border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Add New User</h2>
              <button onClick={() => setAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: muted }}><Icon name="close" size={20} /></button>
            </div>
            {addError && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{addError}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[["Full Name", "name", "text", "e.g. Dr. John Smith"], ["Email", "email", "email", "user@example.com"]].map(([label, key, type, ph]) => (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6 }}>{label}</div>
                  <input type={type} value={newUser[key]} onChange={e => setNewUser({ ...newUser, [key]: e.target.value })} placeholder={ph}
                    style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#2463eb"} onBlur={e => e.target.style.borderColor = border} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6 }}>Role</div>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box", cursor: "pointer" }}>
                  {["Patient", "Doctor", "Lab", "Admin"].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setAddModal(false)} style={{ flex: 1, padding: "11px", border: `1.5px solid ${border}`, borderRadius: 10, background: "transparent", color: text, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAddUser} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add User</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
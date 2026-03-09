import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminSidebar from "../sidebar/sidebar";
import api from "../../../../api/axios";
import useDarkMode from "../../../../contexts/DarkModeContext";

const MS = ({ children, style }) => (
  <span
    style={{
      fontFamily: "Material Symbols Outlined",
      fontWeight: "normal",
      fontStyle: "normal",
      fontSize: 20,
      lineHeight: 1,
      display: "inline-block",
      textTransform: "none",
      letterSpacing: "normal",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

const Toggle = ({ checked, onChange }) => {
  const [on, setOn] = useState(checked);
  const handleClick = () => {
    const newValue = !on;
    setOn(newValue);
    onChange?.(newValue);
  };
  return (
    <button
      onClick={handleClick}
      style={{
        position: "relative", width: 44, height: 24,
        borderRadius: 9999, border: "none", cursor: "pointer",
        background: on ? "#2463eb" : "#cbd5e1", transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
};

const NavItem = ({ icon, label, active }) => (
  <a href="#" style={{
    display: "flex", alignItems: "center", gap: 12,
    padding: "8px 12px", borderRadius: 8,
    background: active ? "rgba(36,99,235,0.1)" : "transparent",
    color: active ? "#2463eb" : "#64748b",
    textDecoration: "none", transition: "background 0.15s",
    fontWeight: 500, fontSize: 14,
  }}>
    <MS>{icon}</MS>
    {label}
  </a>
);

// Mock login history - can be replaced with real API later
const loginHistory = [
  { time: "Today, 09:42 AM", ip: "192.168.1.45", device: "Chrome (Mac OS)", success: true },
  { time: "Oct 24, 08:15 PM", ip: "192.168.1.45", device: "Chrome (Mac OS)", success: true },
  { time: "Oct 22, 11:30 AM", ip: "102.34.22.12", device: "Safari (iPhone)", success: false },
  { time: "Oct 20, 09:00 AM", ip: "192.168.1.45", device: "Chrome (Mac OS)", success: true },
];

export default function UserProfileDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useDarkMode();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Modal states
  const [editModal, setEditModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [changeRoleModal, setChangeRoleModal] = useState(false);
  const [forceLogoutModal, setForceLogoutModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", department: "" });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/users/${userId}`);
      setUser(response.data);
      setEditForm({
        name: response.data.name || "",
        email: response.data.email || "",
        role: response.data.role?.toLowerCase() || "patient",
        department: response.data.department || "",
      });
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setError("Failed to load user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // ─── Update Status ─────────────────────────────────────
  const handleStatusToggle = async (newStatus) => {
    try {
      const statusValue = newStatus ? "active" : "inactive";
      await api.put(`/admin/users/${userId}/status`, { status: statusValue });
      setUser({ ...user, status: newStatus ? "ACTIVE" : "INACTIVE" });
      showSuccess(`User ${newStatus ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      console.error("Failed to update status:", err);
      setError("Failed to update status. Please try again.");
    }
  };

  // ─── Update User Profile ───────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const response = await api.put(`/admin/users/${userId}`, editForm);
      setUser(response.data.user);
      setEditModal(false);
      showSuccess("User updated successfully");
    } catch (err) {
      console.error("Failed to update user:", err);
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Reset Password ────────────────────────────────────
  const handleResetPassword = async () => {
    try {
      const response = await api.post(`/admin/users/${userId}/reset-password`);
      setTempPassword(response.data.temp_password);
      setResetPasswordModal(true);
      showSuccess("Password reset successfully");
    } catch (err) {
      console.error("Failed to reset password:", err);
      setError("Failed to reset password");
    }
  };

  // ─── Change Role ─────────────────────────────────────────
  const handleChangeRole = async (newRole) => {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUser({ ...user, role: response.data.role });
      setChangeRoleModal(false);
      showSuccess(`Role changed to ${response.data.role}`);
    } catch (err) {
      console.error("Failed to change role:", err);
      setError("Failed to change role");
    }
  };

  // ─── Force Logout ────────────────────────────────────────
  const handleForceLogout = async () => {
    try {
      await api.post(`/admin/users/${userId}/force-logout`);
      setForceLogoutModal(false);
      showSuccess("User logged out from all devices");
    } catch (err) {
      console.error("Failed to force logout:", err);
      setError("Failed to force logout");
    }
  };

  // ─── Delete User ─────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setDeleteModal(false);
      navigate("/admin/users");
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError("Failed to delete user");
    }
  };

  const adminActions = [
    { icon: "lock_reset", label: "Reset Password", sub: "Send recovery email", color: "#d97706", bg: "rgba(251,191,36,0.12)", onClick: handleResetPassword },
    { icon: "logout", label: "Force Logout", sub: "Kill all active sessions", color: "#dc2626", bg: "rgba(220,38,38,0.1)", onClick: () => setForceLogoutModal(true) },
    { icon: "manage_accounts", label: "Change Role", sub: "Modify permissions", color: "#2563eb", bg: "rgba(37,99,235,0.1)", onClick: () => setChangeRoleModal(true) },
  ];

  if (loading) {
    return (
      <>
        <AdminSidebar dark={darkMode} setDark={setDarkMode} />
        <div style={{ marginLeft: 240, padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>Loading user profile...</div>
            <div style={{ color: "#64748b" }}>Please wait</div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AdminSidebar dark={darkMode} setDark={setDarkMode} />
        <div style={{ marginLeft: 240, padding: "2rem" }}>
          <div style={{ background: darkMode ? "rgba(239,68,68,0.1)" : "#fef2f2", border: `1px solid ${darkMode ? "#ef4444" : "#fecaca"}`, borderRadius: "0.5rem", padding: "1rem", color: "#dc2626" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="material-symbols-outlined">error</span>
              <span style={{ fontWeight: 500 }}>User not found</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/admin/users')}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#2463eb",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer"
            }}
          >
            Back to Users
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebar dark={darkMode} setDark={setDarkMode} />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; margin: 0; padding: 0; }
        body { background: #f6f6f8; }
        a { text-decoration: none; }
        table { border-collapse: collapse; width: 100%; }
      `}</style>

      {/* Success Message */}
      {successMessage && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 100,
          background: darkMode ? "rgba(34,197,94,0.1)" : "#dcfce7", border: `1px solid ${darkMode ? "#22c55e" : "#bbf7d0"}`, borderRadius: 8, padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <MS style={{ color: "#16a34a" }}>check_circle</MS>
          <span style={{ color: "#15803d", fontWeight: 600 }}>{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{
          position: "fixed", top: 0, left: 240, right: 0, zIndex: 100,
          background: darkMode ? "rgba(239,68,68,0.1)" : "#fef2f2", borderBottom: `1px solid ${darkMode ? "#ef4444" : "#fecaca"}`,
          padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MS style={{ color: "#dc2626" }}>error</MS>
            <span style={{ color: "#dc2626", fontWeight: 600, fontSize: "0.875rem" }}>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            style={{
              padding: "6px 12px", background: "#dc2626", color: "white",
              border: "none", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer"
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div style={{ display: "flex", minHeight: "100vh", background: darkMode ? "#0f172a" : "#f6f6f8", marginLeft: 240 }}>
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
          {/* Header */}
          <header style={{
            position: "sticky", top: error ? 50 : 0, zIndex: 10,
            background: darkMode ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
            padding: "1rem 2rem", display: "flex",
            alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "#94a3b8" }}>
              <span style={{ cursor: "pointer", color: darkMode ? "#94a3b8" : "#64748b" }} onClick={() => navigate("/admin/users")}>User Management</span>
              <MS style={{ fontSize: 14 }}>chevron_right</MS>
              <span style={{ color: darkMode ? "#f1f5f9" : "#0f172a", fontWeight: 600 }}>Profile Details</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button 
                onClick={() => navigate("/admin/users")}
                style={{
                  padding: "8px 16px", background: "transparent", color: darkMode ? "#94a3b8" : "#64748b",
                  border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, borderRadius: 8, cursor: "pointer",
                  fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6
                }}
              >
                <MS style={{ fontSize: 16 }}>arrow_back</MS> Back
              </button>
            </div>
          </header>

          <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
            {/* Profile Hero */}
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start", marginBottom: 32 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 120, height: 120, borderRadius: 16, overflow: "hidden",
                  border: `4px solid ${darkMode ? "#1e293b" : "#fff"}`, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                }}>
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2463eb&color=fff&size=128`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    alt={user.name}
                  />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: darkMode ? "#f1f5f9" : "#0f172a", letterSpacing: "-0.03em" }}>{user.name}</h2>
                  <span style={{
                    padding: "3px 10px", background: user.status === "ACTIVE" ? "#dcfce7" : "#fee2e2", color: user.status === "ACTIVE" ? "#15803d" : "#dc2626",
                    fontSize: "0.7rem", fontWeight: 800, borderRadius: 9999,
                    border: user.status === "ACTIVE" ? "1px solid #bbf7d0" : "1px solid #fecaca", letterSpacing: "0.05em",
                  }}>{user.status}</span>
                </div>
                <p style={{ color: darkMode ? "#94a3b8" : "#64748b", fontSize: "0.875rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <MS style={{ fontSize: 16 }}>badge</MS>
                  ID: #{user.id} • Registered {user.registered}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button 
                    onClick={() => setEditModal(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 18px", background: "#2463eb", color: "#fff",
                      border: "none", borderRadius: 8, fontWeight: 600,
                      fontSize: "0.875rem", cursor: "pointer",
                    }}
                  >
                    <MS style={{ fontSize: 16 }}>edit</MS> Edit Profile
                  </button>
                  <button style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 18px", background: darkMode ? "#1e293b" : "#fff", color: darkMode ? "#f1f5f9" : "#334155",
                    border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, borderRadius: 8, fontWeight: 600,
                    fontSize: "0.875rem", cursor: "pointer",
                  }}>
                    <MS style={{ fontSize: 16 }}>mail</MS> Send Message
                  </button>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
              {/* Col 1+2 */}
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Account Info */}
                <Card darkMode={darkMode}>
                  <CardHeader darkMode={darkMode} icon="account_circle" title="Account Information" />
                  <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    {[
                      { label: "Full Name", value: user.name },
                      { label: "Email Address", value: user.email },
                      { label: "Role", value: user.role },
                      { label: "Department", value: user.department || "General" },
                    ].map(f => (
                      <div key={f.label}>
                        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: darkMode ? "#94a3b8" : "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{f.label}</div>
                        <div style={{ fontWeight: 500, fontSize: "0.9rem", color: darkMode ? "#f1f5f9" : "#0f172a" }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "1rem 1.5rem", borderTop: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: darkMode ? "#f1f5f9" : "#0f172a" }}>Account Status</div>
                      <div style={{ fontSize: "0.78rem", color: darkMode ? "#94a3b8" : "#64748b", marginTop: 2 }}>Enable or disable user access</div>
                    </div>
                    <Toggle checked={user.status === "ACTIVE"} onChange={handleStatusToggle} />
                  </div>
                </Card>

                {/* Login History */}
                <Card darkMode={darkMode}>
                  <div style={{
                    padding: "1rem 1.5rem", borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <h3 style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8, color: darkMode ? "#f1f5f9" : "#0f172a" }}>
                      <MS style={{ color: "#2463eb" }}>history</MS> Login History
                    </h3>
                    <button style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2463eb", background: "none", border: "none", cursor: "pointer" }}>Download CSV</button>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: "0.875rem" }}>
                      <thead>
                        <tr style={{ background: darkMode ? "#0f172a" : "#f8fafc" }}>
                          {["Timestamp", "IP Address", "Device", "Status"].map(h => (
                            <th key={h} style={{ padding: "10px 24px", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.map((row, i) => (
                          <tr key={i} style={{ borderTop: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}` }}>
                            <td style={{ padding: "14px 24px", fontWeight: 600, color: darkMode ? "#f1f5f9" : "#0f172a" }}>{row.time}</td>
                            <td style={{ padding: "14px 24px", color: darkMode ? "#94a3b8" : "#475569" }}>{row.ip}</td>
                            <td style={{ padding: "14px 24px", color: darkMode ? "#94a3b8" : "#475569" }}>{row.device}</td>
                            <td style={{ padding: "14px 24px" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 6, color: row.success ? "#16a34a" : "#dc2626" }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.success ? "#16a34a" : "#dc2626", display: "inline-block" }} />
                                {row.success ? "Success" : "Failed"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Col 3 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Admin Actions */}
                <Card darkMode={darkMode}>
                  <CardHeader darkMode={darkMode} icon="admin_panel_settings" title="Admin Actions" />
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 10 }}>
                    {adminActions.map(action => (
                      <button key={action.label} 
                        onClick={action.onClick}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 14px", background: darkMode ? "#1e293b" : "#f8fafc",
                          borderRadius: 12, border: "none", cursor: "pointer",
                          transition: "background 0.15s", width: "100%",
                          color: action.color === "#dc2626" ? "#dc2626" : darkMode ? "#f1f5f9" : "inherit",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = darkMode ? "#334155" : "#f1f5f9"}
                        onMouseLeave={e => e.currentTarget.style.background = darkMode ? "#1e293b" : "#f8fafc"}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <MS style={{ color: action.color, fontSize: 20 }}>{action.icon}</MS>
                          <div style={{ textAlign: "left", flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: action.color === "#dc2626" ? "#dc2626" : darkMode ? "#f1f5f9" : "#0f172a" }}>{action.label}</div>
                            <div style={{ fontSize: "0.75rem", color: darkMode ? "#94a3b8" : "#64748b", marginTop: 2 }}>{action.sub}</div>
                          </div>
                          <MS style={{ color: "#94a3b8", fontSize: 20 }}>chevron_right</MS>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Danger Zone */}
                <div style={{
                  background: darkMode ? "rgba(239,68,68,0.1)" : "rgba(254,242,242,0.6)", border: `1px solid ${darkMode ? "#ef4444" : "#fecaca"}`,
                  borderRadius: 12, padding: "1.5rem",
                }}>
                  <h3 style={{ fontWeight: 700, color: "#dc2626", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <MS style={{ color: "#dc2626" }}>warning</MS> Danger Zone
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: darkMode ? "#fca5a5" : "#ef4444", marginBottom: 16, lineHeight: 1.5 }}>
                    Deleting this account is permanent and cannot be undone. All user data will be archived.
                  </p>
                  <button 
                    onClick={() => setDeleteModal(true)}
                    style={{
                      width: "100%", padding: "8px 0",
                      background: "#dc2626", color: "#fff",
                      border: "none", borderRadius: 8,
                      fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ─── Edit Modal ─────────────────────────────────────── */}
      {editModal && (
        <Modal onClose={() => setEditModal(false)} title="Edit User Profile">
          <form onSubmit={handleEditSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Full Name" value={editForm.name} onChange={v => setEditForm({...editForm, name: v})} />
              <Input label="Email Address" type="email" value={editForm.email} onChange={v => setEditForm({...editForm, email: v})} />
              <Select label="Role" value={editForm.role} onChange={v => setEditForm({...editForm, role: v})} options={[
                { value: "patient", label: "Patient" },
                { value: "doctor", label: "Doctor" },
                { value: "lab", label: "Lab" },
                { value: "admin", label: "Admin" },
              ]} />
              <Input label="Department" value={editForm.department} onChange={v => setEditForm({...editForm, department: v})} placeholder="e.g. Cardiology" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => setEditModal(false)} style={{ flex: 1, padding: "11px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "transparent", color: "#0f172a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={editLoading} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 10, background: "#2463eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: editLoading ? 0.6 : 1 }}>
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Reset Password Modal ─────────────────────────── */}
      {resetPasswordModal && (
        <Modal onClose={() => { setResetPasswordModal(false); setTempPassword(null); }} title="Password Reset" width={400}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <MS style={{ color: "#16a34a", fontSize: 28 }}>check_circle</MS>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>Password Reset Successfully</h3>
            <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>A new temporary password has been generated:</p>
            {tempPassword && (
              <div style={{ 
                background: "#f1f5f9", padding: "12px 16px", borderRadius: 8, 
                fontFamily: "monospace", fontSize: "1rem", letterSpacing: 1,
                marginBottom: 16, userSelect: "all"
              }}>
                {tempPassword}
              </div>
            )}
            <p style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Please copy this password. It won't be shown again.</p>
            <button 
              onClick={() => { setResetPasswordModal(false); setTempPassword(null); }}
              style={{ marginTop: 20, padding: "10px 24px", background: "#2463eb", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              Done
            </button>
          </div>
        </Modal>
      )}

      {/* ─── Change Role Modal ────────────────────────────── */}
      {changeRoleModal && (
        <Modal onClose={() => setChangeRoleModal(false)} title="Change User Role" width={360}>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>Select a new role for {user.name}:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["patient", "doctor", "lab", "admin"].map(role => (
              <button
                key={role}
                onClick={() => handleChangeRole(role)}
                style={{
                  padding: "12px 16px", borderRadius: 8, border: user.role?.toLowerCase() === role ? "2px solid #2463eb" : "1px solid #e2e8f0",
                  background: user.role?.toLowerCase() === role ? "#eff6ff" : "#fff",
                  cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 12
                }}
              >
                <MS style={{ color: role === "doctor" ? "#2463eb" : role === "admin" ? "#16a34a" : role === "lab" ? "#7c3aed" : "#475569" }}>
                  {role === "doctor" ? "stethoscope" : role === "admin" ? "admin_panel_settings" : role === "lab" ? "science" : "person"}
                </MS>
                <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{role}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* ─── Force Logout Modal ─────────────────────────────── */}
      {forceLogoutModal && (
        <Modal onClose={() => setForceLogoutModal(false)} title="Force Logout" width={360}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <MS style={{ color: "#dc2626", fontSize: 28 }}>logout</MS>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>Force Logout {user.name}?</h3>
            <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 20 }}>This will immediately log out the user from all devices and sessions.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setForceLogoutModal(false)} style={{ flex: 1, padding: "10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "transparent", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={handleForceLogout} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Force Logout</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Delete Modal ─────────────────────────────────── */}
      {deleteModal && (
        <Modal onClose={() => setDeleteModal(false)} title="Delete User" width={360}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <MS style={{ color: "#dc2626", fontSize: 28 }}>delete</MS>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>Delete {user.name}?</h3>
            <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 20 }}>This action cannot be undone. All user data will be permanently removed.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteModal(false)} style={{ flex: 1, padding: "10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "transparent", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: "#dc2626", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </Modal>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </>
  );
}

// ─── Helper Components ───────────────────────────────────

function Card({ children, darkMode }) {
  return (
    <div style={{
      background: darkMode ? "#1e293b" : "#fff", borderRadius: 12,
      border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, overflow: "hidden",
      boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
    }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, darkMode }) {
  return (
    <div style={{
      padding: "1rem 1.5rem", borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`,
      background: darkMode ? "#0f172a" : "rgba(248,250,252,0.5)",
    }}>
      <h3 style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8, color: darkMode ? "#f1f5f9" : "#0f172a" }}>
        <MS style={{ color: "#2463eb" }}>{icon}</MS> {title}
      </h3>
    </div>
  );
}

function Modal({ children, onClose, title, width = 420, darkMode }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000060", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: darkMode ? "#1e293b" : "#fff", borderRadius: 20, padding: 32, width, border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 18, color: darkMode ? "#f1f5f9" : "#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: darkMode ? "#94a3b8" : "#64748b" }}><MS>close</MS></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>{label}</div>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        style={{ 
          width: "100%", padding: "10px 12px", borderRadius: 8, 
          border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
          boxSizing: "border-box"
        }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, darkMode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: darkMode ? "#94a3b8" : "#64748b", marginBottom: 6 }}>{label}</div>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)}
        style={{ 
          width: "100%", padding: "10px 12px", borderRadius: 8, 
          border: `1.5px solid ${darkMode ? "#334155" : "#e2e8f0"}`, fontSize: 14, outline: "none",
          boxSizing: "border-box", background: darkMode ? "#1e293b" : "#fff", 
          color: darkMode ? "#f1f5f9" : "#0f172a", cursor: "pointer"
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

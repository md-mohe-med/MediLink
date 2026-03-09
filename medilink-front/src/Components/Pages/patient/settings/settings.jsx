import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../api/axios";
import PatientSidebar from "../sidebar/sidebar";
import useDarkMode from "../../../../contexts/DarkModeContext";

const Toggle = ({ checked: initialChecked = false, onChange, disabled = false }) => {
  const [checked, setChecked] = useState(initialChecked);
  
  const handleClick = () => {
    if (disabled) return;
    const newChecked = !checked;
    setChecked(newChecked);
    if (onChange) onChange(newChecked);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        position: "relative", width: 44, height: 24,
        borderRadius: 9999, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "#2463eb" : "#cbd5e1", transition: "background 0.2s",
        opacity: disabled ? 0.5 : 1
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
};

const Skeleton = ({ width = "100%", height = "16px" }) => (
  <div style={{ width, height, background: "#e2e8f0", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
);

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { bg: "#dcfce7", border: "#86efac", text: "#15803d" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626" },
    info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  };

  const icons = {
    success: "check_circle",
    error: "error",
    info: "info",
  };

  const c = colors[type];

  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 50,
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8,
      padding: "12px 16px", display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}>
      <span className="material-symbols-outlined" style={{ color: c.text }}>{icons[type]}</span>
      <span style={{ color: c.text, fontWeight: 600, fontSize: 14 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.text, marginLeft: 8 }}>
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
};

const MS = ({ children, style }) => (
  <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1, ...style }}>{children}</span>
);

export default function PatientSettings() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    blood_type: "",
    allergies: "",
    emergency_contact: ""
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    dark_mode: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, profileRes] = await Promise.all([
          api.get('/me'),
          api.get('/patient/profile')
        ]);
        
        setCurrentUser(userRes.data);
        setProfile(profileRes.data.profile);
        
        setProfileForm({
          name: userRes.data?.name || "",
          email: userRes.data?.email || "",
          phone: profileRes.data?.profile?.phone || "",
          date_of_birth: profileRes.data?.profile?.date_of_birth || "",
          blood_type: profileRes.data?.profile?.blood_type || "",
          allergies: profileRes.data?.profile?.allergies || "",
          emergency_contact: profileRes.data?.profile?.emergency_contact || ""
        });
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        setErrors({ fetch: "Failed to load settings. Please try again." });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(s => ({ ...s, profile: true }));
    try {
      await api.put("/me", { name: profileForm.name, email: profileForm.email });
      await api.put("/patient/profile", {
        phone: profileForm.phone,
        date_of_birth: profileForm.date_of_birth,
        blood_type: profileForm.blood_type,
        allergies: profileForm.allergies,
        emergency_contact: profileForm.emergency_contact
      });
      showToast("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Failed to save profile:", error);
      showToast(error.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(s => ({ ...s, profile: false }));
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast("Passwords do not match!", "error");
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      showToast("Password must be at least 8 characters!", "error");
      return;
    }

    setSaving(s => ({ ...s, password: true }));
    try {
      await api.put("/me/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      showToast("Password changed successfully!", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to change password", "error");
    } finally {
      setSaving(s => ({ ...s, password: false }));
    }
  };

  const handleTogglePreference = async (key, value) => {
    try {
      const updatedPrefs = { ...preferences, [key]: value };
      setPreferences(updatedPrefs);
      await api.put("/patient/preferences", { [key]: value });
      showToast(`${key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} ${value ? "enabled" : "disabled"}`, "success");
    } catch (error) {
      setPreferences(preferences);
      showToast("Failed to update preference", "error");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <style>{`
        * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: darkMode ? "#0f172a" : "#f6f6f8" }}>
        <PatientSidebar dark={darkMode} setDark={setDarkMode} />

        <main style={{ flex: 1, marginLeft: 240, padding: "2rem 3rem", maxWidth: 900 }}>
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: darkMode ? "#f1f5f9" : "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>Settings</h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>Manage your profile and application preferences.</p>
          </div>

          {/* Profile Section */}
          <Section darkMode={darkMode} title="Profile Information" subtitle="Update your personal information and medical details.">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Skeleton width="88px" height="88px" />
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <Skeleton width="200px" height="20px" />
                    <Skeleton width="300px" height="16px" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <Skeleton width="120px" height="16px" />
                      <Skeleton height="44px" />
                    </div>
                  ))}
                </div>
              </div>
            ) : errors.fetch ? (
              <div style={{ background: darkMode ? "#1e293b" : "#fef2f2", border: `1px solid ${darkMode ? "#ef4444" : "#fecaca"}`, borderRadius: 8, padding: "1rem", color: darkMode ? "#fca5a5" : "#dc2626" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <MS style={{ color: darkMode ? "#fca5a5" : "#dc2626" }}>error</MS>
                  <span style={{ fontWeight: 600 }}>{errors.fetch}</span>
                </div>
                <button onClick={() => window.location.reload()} style={{ padding: "0.5rem 1rem", background: "#dc2626", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}>
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.5rem" }}>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      width: 88, height: 88, borderRadius: "50%",
                      background: currentUser?.avatar 
                        ? `url(${currentUser.avatar})` 
                        : "linear-gradient(135deg, #2463eb 0%, #7c3aed 100%)",
                      backgroundSize: "cover", backgroundPosition: "center",
                      border: `2px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: "1.5rem"
                    }}>
                      {!currentUser?.avatar && profileForm.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <button style={{
                      position: "absolute", bottom: 0, right: 0, width: 28, height: 28,
                      borderRadius: "50%", background: "#2463eb", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.4)"
                    }}>
                      <MS style={{ color: "#fff", fontSize: 14 }}>edit</MS>
                    </button>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: darkMode ? "#f1f5f9" : "#0f172a" }}>Profile Photo</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>PNG, JPG or GIF (max. 400x400px)</div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <Btn small primary>Upload New</Btn>
                      <Btn small>Delete</Btn>
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {[
                    { label: "Full Name", key: "name", type: "text", placeholder: "Your full name" },
                    { label: "Email Address", key: "email", type: "email", placeholder: "your@email.com" },
                    { label: "Phone Number", key: "phone", type: "tel", placeholder: "+1 (555) 000-0000" },
                    { label: "Date of Birth", key: "date_of_birth", type: "date", placeholder: "" },
                    { label: "Blood Type", key: "blood_type", type: "text", placeholder: "e.g. A+" },
                    { label: "Emergency Contact", key: "emergency_contact", type: "text", placeholder: "Name and phone number" },
                  ].map(field => (
                    <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>{field.label}</label>
                      <input
                        type={field.type}
                        value={profileForm[field.key]}
                        onChange={(e) => setProfileForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={{ 
                          background: darkMode ? "#1e293b" : "#fff", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                          borderRadius: 8, padding: "10px 12px",
                          fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#0f172a", outline: "none"
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginTop: "1rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>Allergies</label>
                  <textarea
                    value={profileForm.allergies}
                    onChange={(e) => setProfileForm(f => ({ ...f, allergies: e.target.value }))}
                    placeholder="List any allergies or medical conditions..."
                    rows={3}
                    style={{ 
                      background: darkMode ? "#1e293b" : "#fff", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                      borderRadius: 8, padding: "10px 12px",
                      fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#0f172a", outline: "none",
                      resize: "vertical", fontFamily: "inherit"
                    }}
                  />
                </div>
              </>
            )}
            <SectionFooter darkMode={darkMode}>
              <Btn primary onClick={handleSaveProfile} disabled={saving.profile || loading}>
                {saving.profile ? "Saving..." : "Save Profile Changes"}
              </Btn>
            </SectionFooter>
          </Section>

          {/* Security Section */}
          <Section darkMode={darkMode} title="Security" subtitle="Manage your password and account protection.">
            <div style={{ background: darkMode ? "#0f172a" : "#f8fafc", borderRadius: 12, border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, padding: "1.5rem" }}>
              <h3 style={{ fontWeight: 600, fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#0f172a", marginBottom: "1rem" }}>Change Password</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { label: "Current Password", key: "current_password", placeholder: "Enter current password" },
                  { label: "New Password", key: "new_password", placeholder: "Min. 8 characters" },
                  { label: "Confirm New Password", key: "confirm_password", placeholder: "Repeat new password" },
                ].map(field => (
                  <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>{field.label}</label>
                    <input
                      type="password"
                      value={passwordForm[field.key]}
                      onChange={(e) => setPasswordForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      style={{
                        background: darkMode ? "#1e293b" : "#fff", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                        borderRadius: 8, padding: "10px 12px",
                        fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#0f172a", outline: "none"
                      }}
                    />
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <Btn primary onClick={handleChangePassword} disabled={saving.password}>
                    {saving.password ? "Updating..." : "Update Password"}
                  </Btn>
                </div>
              </div>
            </div>
          </Section>

          {/* Preferences Section */}
          <Section darkMode={darkMode} title="Preferences" subtitle="Customize your notification and application experience.">
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                Notification Channels
              </div>
              {[
                { icon: "mail", label: "Email Notifications", key: "email_notifications" },
                { icon: "send_to_mobile", label: "Push Notifications", key: "push_notifications" },
                { icon: "sms", label: "SMS Alerts (Critical Only)", key: "sms_notifications" },
              ].map(item => (
                <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <MS style={{ color: "#94a3b8", fontSize: 18 }}>{item.icon}</MS>
                    <span style={{ fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#334155" }}>{item.label}</span>
                  </div>
                  <Toggle 
                    checked={preferences[item.key]}
                    onChange={(value) => handleTogglePreference(item.key, value)}
                  />
                </div>
              ))}
            </div>

            <div style={{ paddingTop: "1.5rem", borderTop: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`, marginTop: "1rem" }}>
              <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                Display Settings
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.25rem 0" }}>
                <span style={{ fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#334155" }}>Dark Mode</span>
                <Toggle checked={darkMode} onChange={setDarkMode} />
              </div>
            </div>
          </Section>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

function Section({ darkMode, title, subtitle, children }) {
  return (
    <div style={{
      background: darkMode ? "#1e293b" : "#fff", borderRadius: 14,
      border: `1px solid ${darkMode ? "#334155" : "#e8eaf0"}`, overflow: "hidden",
      marginBottom: "1.5rem",
      boxShadow: "0 1px 4px rgba(15,23,42,0.04)"
    }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}` }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: darkMode ? "#f1f5f9" : "#0f172a" }}>{title}</div>
        <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 3 }}>{subtitle}</div>
      </div>
      <div style={{ padding: "1.5rem" }}>
        {children}
      </div>
    </div>
  );
}

function SectionFooter({ darkMode, children }) {
  return (
    <div style={{
      margin: "1rem -1.5rem -1.5rem",
      padding: "1rem 1.5rem",
      background: darkMode ? "#0f172a" : "#f8fafc",
      borderTop: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`,
      display: "flex", justifyContent: "flex-end"
    }}>
      {children}
    </div>
  );
}

function Btn({ children, primary, small, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "6px 14px" : "10px 20px",
        fontSize: small ? "0.78rem" : "0.875rem",
        fontWeight: 600,
        background: primary ? "#2463eb" : "#f1f5f9",
        color: primary ? "#fff" : "#475569",
        border: primary ? "none" : "1px solid #e2e8f0",
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "opacity 0.15s",
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      {children}
    </button>
  );
}

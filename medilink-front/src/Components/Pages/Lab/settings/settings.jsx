import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../api/axios";
import LabSidebar from "../sidebar/side";

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
        position: "relative",
        width: 44,
        height: 24,
        borderRadius: 9999,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "#2463eb" : "#cbd5e1",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.2s"
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: 2,
          width: 20,
          height: 20,
          background: "#fff",
          borderRadius: "50%",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          transition: "transform 0.2s",
          transform: checked ? "translateX(20px)" : "translateX(0)"
        }}
      />
    </button>
  );
};

const Skeleton = ({ width = "100%", height = "16px", className = "" }) => (
  <div 
    style={{ 
      width, 
      height, 
      background: "#e2e8f0", 
      borderRadius: 4,
      animation: "pulse 1.5s infinite"
    }}
  />
);

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { bg: "#f0fdf4", border: "#86efac", text: "#166534" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626" },
    info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  };

  const icons = {
    success: "check_circle",
    error: "error",
    info: "info",
  };

  const style = colors[type];

  return (
    <div style={{
      position: "fixed",
      top: 16,
      right: 16,
      zIndex: 50,
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 8,
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}>
      <span className="material-symbols-outlined" style={{ color: style.text, fontSize: 20 }}>{icons[type]}</span>
      <span style={{ color: style.text, fontSize: 14, fontWeight: 500 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 8 }}>
        <span className="material-symbols-outlined" style={{ color: style.text, fontSize: 18 }}>close</span>
      </button>
    </div>
  );
};

export default function LabSettings() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  // Data states
  const [profile, setProfile] = useState(null);
  const [security, setSecurity] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    lab_name: "",
    license_number: ""
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrors({});
        
        const requests = [
          api.get("/lab/settings/profile").catch(err => ({ error: err, type: 'profile' })),
          api.get("/lab/settings/security").catch(err => ({ error: err, type: 'security' })),
          api.get("/lab/settings/preferences").catch(err => ({ error: err, type: 'preferences' })),
          api.get("/me").catch(err => ({ error: err, type: 'user' }))
        ];
        
        const [profileRes, securityRes, preferencesRes, userRes] = await Promise.all(requests);
        
        if (profileRes.error || securityRes.error || preferencesRes.error || userRes.error) {
          throw new Error("One or more API calls failed");
        }

        setProfile(profileRes.data);
        setSecurity(securityRes.data);
        setPreferences(preferencesRes.data);
        setCurrentUser(userRes.data);

        setProfileForm({
          name: profileRes.data?.name || "",
          email: profileRes.data?.email || "",
          lab_name: profileRes.data?.lab_name || "",
          license_number: profileRes.data?.license_number || ""
        });

      } catch (error) {
        console.error("Failed to fetch settings:", error);
        let errorMessage = "Failed to load settings. Please try again.";
        
        if (error.response?.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          setTimeout(() => {
            localStorage.removeItem("token");
            navigate("/login");
          }, 2000);
        }
        
        setErrors({ fetch: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Save profile
  const handleSaveProfile = async () => {
    setSaving(s => ({ ...s, profile: true }));
    try {
      const response = await api.put("/lab/settings/profile", profileForm);
      setProfile(response.data);
      showToast("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Failed to save profile:", error);
      showToast(error.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(s => ({ ...s, profile: false }));
    }
  };

  // Change password
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
      await api.put("/lab/settings/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      showToast("Password changed successfully!", "success");
    } catch (error) {
      console.error("Failed to change password:", error);
      showToast(error.response?.data?.message || "Failed to change password", "error");
    } finally {
      setSaving(s => ({ ...s, password: false }));
    }
  };

  // Toggle preferences
  const handleTogglePreference = async (key, value) => {
    try {
      const updatedPrefs = { ...preferences, [key]: value };
      setPreferences(updatedPrefs);
      await api.put("/lab/settings/preferences", { [key]: value });
      showToast(`${key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} ${value ? "enabled" : "disabled"}`, "success");
    } catch (error) {
      console.error("Failed to update preference:", error);
      setPreferences(preferences);
      showToast("Failed to update preference", "error");
    }
  };

  // Deactivate account
  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to deactivate your account? This action cannot be undone.");
    if (!confirmed) return;

    setSaving(s => ({ ...s, deactivate: true }));
    try {
      await api.post("/lab/settings/deactivate");
      showToast("Account deactivated successfully", "info");
      setTimeout(() => {
        localStorage.removeItem("token");
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Failed to deactivate account:", error);
      showToast("Failed to deactivate account", "error");
    } finally {
      setSaving(s => ({ ...s, deactivate: false }));
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap"
        rel="stylesheet"
      />
      <style>{`
        * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        .mono { font-family: 'DM Mono', monospace; }
        .ms { font-family: 'Material Symbols Outlined'; font-weight: normal;
          font-style: normal; font-size: 20px; line-height: 1; display: inline-block;
          text-transform: none; letter-spacing: normal; word-wrap: normal; white-space: nowrap; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#f6f6f8" }}>
        {/* Lab Sidebar */}
        <LabSidebar dark={darkMode} setDark={setDarkMode} />

        {/* Main Content */}
        <main style={{ flex: 1, marginLeft: 260, padding: "2rem 3rem", maxWidth: 900 }}>
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>Lab Settings</h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>Manage your laboratory profile and application preferences.</p>
          </div>

          {/* Profile Section */}
          <Section title="Lab Profile" subtitle="Update your laboratory information and profile.">
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
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "0.5rem", padding: "1rem", color: "#dc2626", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span className="ms" style={{ fontSize: 20 }}>error</span>
                  <span style={{ fontWeight: 600 }}>{errors.fetch}</span>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.5rem" }}>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      width: 88, height: 88, borderRadius: "50%",
                      backgroundImage: currentUser?.avatar 
                        ? `url(${currentUser.avatar})` 
                        : "linear-gradient(135deg, #2463eb 0%, #7c3aed 100%)",
                      backgroundSize: "cover", backgroundPosition: "center",
                      border: "2px solid #e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: "1.5rem"
                    }}>
                      {!currentUser?.avatar && profileForm.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <button style={{
                      position: "absolute", bottom: 0, right: 0, width: 28, height: 28,
                      borderRadius: "50%", background: "#2463eb", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
                      transition: "transform 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                      <span className="ms" style={{ color: "#fff", fontSize: 14 }}>edit</span>
                    </button>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a" }}>Lab Logo</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>SVG, PNG, JPG or GIF (max. 400×400px)</div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <Btn small>Upload New</Btn>
                      <Btn small>Delete</Btn>
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {[
                    { label: "Lab Name", key: "lab_name", type: "text", placeholder: "Enter laboratory name" },
                    { label: "Email Address", key: "email", type: "email", placeholder: "lab@example.com" },
                    { label: "Contact Name", key: "name", type: "text", placeholder: "Primary contact person" },
                    { label: "License Number", key: "license_number", type: "text", placeholder: "LL-XXXX-XXX" },
                  ].map(field => (
                    <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>{field.label}</label>
                      <input
                        type={field.type}
                        value={profileForm[field.key]}
                        onChange={(e) => setProfileForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={{ 
                          fontFamily: field.key === "license_number" ? "'DM Mono', monospace" : undefined,
                          background: "#fff", border: "1px solid #e2e8f0",
                          borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
                          fontSize: "0.875rem", color: "#0f172a",
                          transition: "border-color 0.15s, box-shadow 0.15s",
                          outline: "none"
                        }}
                        onFocus={e => e.target.style.borderColor = "#2463eb"}
                        onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
            <SectionFooter>
              <Btn 
                primary 
                onClick={handleSaveProfile}
                disabled={saving.profile || loading}
                style={{ opacity: (saving.profile || loading) ? 0.6 : 1 }}
              >
                {saving.profile ? "Saving..." : "Save Profile Changes"}
              </Btn>
            </SectionFooter>
          </Section>

          {/* Security Section */}
          <Section title="Security" subtitle="Manage your password and account protection.">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Skeleton height="120px" />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[1, 2].map(i => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <Skeleton width="200px" height="16px" />
                        <Skeleton width="300px" height="14px" />
                      </div>
                      <Skeleton width="44px" height="24px" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "1rem", background: "#f8fafc", borderRadius: "0.625rem",
                  border: "1px solid #f1f5f9"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: "rgba(36,99,235,0.08)", display: "flex",
                      alignItems: "center", justifyContent: "center"
                    }}>
                      <span className="ms" style={{ color: "#2463eb" }}>lock</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>Change Password</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                        Last updated: {security?.password_last_changed 
                          ? new Date(security.password_last_changed).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                          : "Never"
                        }
                      </div>
                    </div>
                  </div>
                  <Btn>Update</Btn>
                </div>

                <div style={{
                  background: "#f8fafc", borderRadius: "0.75rem",
                  border: "1px solid #e2e8f0", padding: "1.5rem"
                }}>
                  <h3 style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a", marginBottom: "1rem" }}>Password Change</h3>
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
                            background: "#fff", border: "1px solid #e2e8f0",
                            borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
                            fontSize: "0.875rem", color: "#0f172a",
                            transition: "border-color 0.15s, box-shadow 0.15s",
                            outline: "none"
                          }}
                          onFocus={e => e.target.style.borderColor = "#2463eb"}
                          onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                        />
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                      <Btn 
                        primary 
                        onClick={handleChangePassword}
                        disabled={saving.password}
                        style={{ opacity: saving.password ? 0.6 : 1 }}
                      >
                        {saving.password ? "Updating..." : "Update Password"}
                      </Btn>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.25rem 0"
                }}>
                  <div style={{ maxWidth: "75%" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>Two-Factor Authentication (2FA)</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4, lineHeight: 1.5 }}>
                      Adds an extra layer of security by requiring more than just a password to log in.
                    </div>
                  </div>
                  <Toggle 
                    checked={security?.two_factor_enabled || false}
                    onChange={(value) => handleTogglePreference("two_factor_enabled", value)}
                  />
                </div>
              </>
            )}
          </Section>

          {/* Platform Preferences Section */}
          <Section title="Platform Preferences" subtitle="Customize your notification and application experience.">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Skeleton height="20px" width="150px" />
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <Skeleton width="20px" height="20px" />
                      <Skeleton width="200px" height="16px" />
                    </div>
                    <Skeleton width="44px" height="24px" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                    Notification Channels
                  </div>
                  {[
                    { icon: "mail", label: "Email Notifications", key: "email_notifications" },
                    { icon: "send_to_mobile", label: "Push Notifications", key: "push_notifications" },
                    { icon: "sms", label: "SMS Alerts (Critical Only)", key: "sms_notifications" },
                  ].map(item => (
                    <div key={item.key} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.625rem 0", borderBottom: "1px solid #f1f5f9"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span className="ms" style={{ color: "#94a3b8", fontSize: 18 }}>{item.icon}</span>
                        <span style={{ fontSize: "0.875rem", color: "#334155" }}>{item.label}</span>
                      </div>
                      <Toggle 
                        checked={preferences?.[item.key] || false}
                        onChange={(value) => handleTogglePreference(item.key, value)}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ paddingTop: "1.5rem", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                    Display Settings
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.25rem 0" }}>
                    <span style={{ fontSize: "0.875rem", color: "#334155" }}>Dark Mode</span>
                    <Toggle 
                      checked={darkMode}
                      onChange={setDarkMode}
                    />
                  </div>
                </div>
              </>
            )}
          </Section>

          {/* Danger Zone */}
          <div style={{
            border: "1px solid #fecaca", borderRadius: "0.75rem",
            background: "rgba(254,242,242,0.5)", padding: "1.5rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "1rem", marginTop: "1.5rem"
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#dc2626" }}>Account Deactivation</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>
                Once deactivated, you will lose access to all lab functions and patient records.
              </div>
            </div>
            <button 
              onClick={handleDeactivateAccount}
              disabled={saving.deactivate}
              style={{
                padding: "0.5rem 1.25rem", fontSize: "0.875rem", fontWeight: 700,
                color: "#dc2626", background: "transparent",
                border: "1px solid #fca5a5", borderRadius: "0.5rem",
                cursor: saving.deactivate ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                transition: "background 0.15s", opacity: saving.deactivate ? 0.6 : 1
              }}
              onMouseEnter={e => !saving.deactivate && (e.target.style.background = "rgba(254,202,202,0.4)")}
              onMouseLeave={e => !saving.deactivate && (e.target.style.background = "transparent")}
            >
              {saving.deactivate ? "Deactivating..." : "Deactivate Account"}
            </button>
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "0.875rem",
      border: "1px solid #e8eaf0", overflow: "hidden",
      marginBottom: "1.5rem",
      boxShadow: "0 1px 4px rgba(15,23,42,0.04)"
    }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>{title}</div>
        <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 3 }}>{subtitle}</div>
      </div>
      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {children}
      </div>
    </div>
  );
}

function SectionFooter({ children }) {
  return (
    <div style={{
      margin: "0.5rem -1.5rem -1.5rem",
      padding: "1rem 1.5rem",
      background: "#f8fafc",
      borderTop: "1px solid #f1f5f9",
      display: "flex", justifyContent: "flex-end"
    }}>
      {children}
    </div>
  );
}

function Btn({ children, primary, small, onClick, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "0.35rem 0.875rem" : "0.5rem 1.25rem",
        fontSize: small ? "0.78rem" : "0.875rem",
        fontWeight: 600,
        background: primary ? "#2463eb" : "#f1f5f9",
        color: primary ? "#fff" : "#475569",
        border: primary ? "none" : "1px solid #e2e8f0",
        borderRadius: "0.5rem",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "opacity 0.15s",
        fontFamily: "'DM Sans', sans-serif",
        ...style
      }}
      onMouseEnter={e => !disabled && (e.target.style.opacity = "0.85")}
      onMouseLeave={e => !disabled && (e.target.style.opacity = "1")}
    >
      {children}
    </button>
  );
}

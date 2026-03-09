import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../api/axios";
import Sidebar from "../sidebar/sidebar";
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
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-blue-600" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

// Skeleton loader for data loading
const Skeleton = ({ width = "100%", height = "16px", className = "" }) => (
  <div 
    className={`bg-gray-200 rounded animate-pulse ${className}`}
    style={{ width, height }}
  />
);

// Toast notification component
const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    success: "check_circle",
    error: "error",
    info: "info",
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${colors[type]} border rounded-lg px-4 py-3 flex items-center gap-2 shadow-lg animate-slide-in`}>
      <span className="material-symbols-outlined text-lg">{icons[type]}</span>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
};

export default function MediLinkSettings() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useDarkMode();
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
    specialization: "",
    license_number: ""
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrors({});
        
        console.log("Connecting to backend at:", api.defaults.baseURL);

        // Fetch all settings data in parallel with better error handling
        const requests = [
          api.get("/admin/settings/profile").catch(err => ({ error: err, type: 'profile' })),
          api.get("/admin/settings/security").catch(err => ({ error: err, type: 'security' })),
          api.get("/admin/settings/preferences").catch(err => ({ error: err, type: 'preferences' })),
          api.get("/me").catch(err => ({ error: err, type: 'user' }))
        ];
        
        const [profileRes, securityRes, preferencesRes, userRes] = await Promise.all(requests);
        
        // Check for errors in any response
        if (profileRes.error || securityRes.error || preferencesRes.error || userRes.error) {
          const errors = [];
          if (profileRes.error) errors.push(`Profile: ${profileRes.error.message}`);
          if (securityRes.error) errors.push(`Security: ${securityRes.error.message}`);
          if (preferencesRes.error) errors.push(`Preferences: ${preferencesRes.error.message}`);
          if (userRes.error) errors.push(`User: ${userRes.error.message}`);
          
          console.error("API errors:", errors);
          throw new Error("One or more API calls failed");
        }

        console.log("Settings loaded successfully:", {
          profile: profileRes.data,
          security: securityRes.data,
          preferences: preferencesRes.data,
          user: userRes.data
        });

        setProfile(profileRes.data);
        setSecurity(securityRes.data);
        setPreferences(preferencesRes.data);
        setCurrentUser(userRes.data);

        // Initialize forms with fetched data
        setProfileForm({
          name: profileRes.data?.name || "",
          email: profileRes.data?.email || "",
          specialization: profileRes.data?.specialization || "",
          license_number: profileRes.data?.license_number || ""
        });

      } catch (error) {
        console.error("Failed to fetch settings:", error);
        
        // Show actual error from backend
        let errorMessage = "Failed to load settings. Please try again.";
        
        if (error.response?.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          setTimeout(() => {
            localStorage.removeItem("token");
            navigate("/login");
          }, 2000);
        } else if (error.response?.status === 403) {
          errorMessage = "Access denied. You don't have permission to view settings.";
        } else if (error.response?.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (!error.response) {
          errorMessage = "Cannot connect to server. Please check your internet connection.";
        }
        
        setErrors({
          fetch: errorMessage
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Save profile to database
  const handleSaveProfile = async () => {
    setSaving(s => ({ ...s, profile: true }));
    try {
      const response = await api.put("/admin/settings/profile", profileForm);
      setProfile(response.data);
      showToast("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Failed to save profile:", error);
      
      let errorMessage = "Failed to update profile. Please try again.";
      if (error.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        setTimeout(() => {
          localStorage.removeItem("token");
          navigate("/login");
        }, 2000);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showToast(errorMessage, "error");
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
      await api.put("/admin/settings/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      showToast("Password changed successfully!", "success");
    } catch (error) {
      console.error("Failed to change password:", error);
      
      let errorMessage = "Failed to change password. Please check your current password.";
      if (error.response?.status === 401) {
        errorMessage = "Current password is incorrect.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showToast(errorMessage, "error");
    } finally {
      setSaving(s => ({ ...s, password: false }));
    }
  };

  // Toggle preferences
  const handleTogglePreference = async (key, value) => {
    try {
      const updatedPrefs = { ...preferences, [key]: value };
      setPreferences(updatedPrefs);
      await api.put("/admin/settings/preferences", { [key]: value });
      showToast(`${key.replace(/_/g, " ").charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")} ${value ? "enabled" : "disabled"}`, "success");
    } catch (error) {
      console.error("Failed to update preference:", error);
      setPreferences(preferences); // Rollback
      
      let errorMessage = "Failed to update preference";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showToast(errorMessage, "error");
    }
  };

  // Deactivate account
  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to deactivate your account? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    setSaving(s => ({ ...s, deactivate: true }));
    try {
      await api.post("/admin/settings/deactivate");
      showToast("Account deactivated successfully", "info");
      // Redirect to login after deactivation
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
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: darkMode ? "#0f172a" : "#f6f6f8" }}>
        {/* Shared Admin Sidebar */}
        <Sidebar dark={darkMode} setDark={setDarkMode} />

        {/* Main Content */}
        <main style={{ flex: 1, marginLeft: 240, padding: "2rem 3rem", maxWidth: 900 }}>
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: darkMode ? "#f1f5f9" : "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>Settings</h1>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 4 }}>Manage your professional account and application preferences.</p>
          </div>

          {/* Profile Section */}
          <Section darkMode={darkMode} title="Profile Settings" subtitle="Update your public information and avatar.">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Skeleton width="88px" height="88px" className="rounded-full" />
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <Skeleton width="200px" height="20px" />
                    <Skeleton width="300px" height="16px" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <Skeleton width="120px" height="16px" />
                      <Skeleton height="44px" className="rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            ) : errors.fetch ? (
              <div style={{ background: darkMode ? "#1e293b" : "#fef2f2", border: `1px solid ${darkMode ? "#ef4444" : "#fecaca"}`, borderRadius: "0.5rem", padding: "1rem", color: darkMode ? "#fca5a5" : "#dc2626", marginBottom: "1rem" }}>
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
                      cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
                      transition: "transform 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                      <span className="ms" style={{ color: "#fff", fontSize: 14 }}>edit</span>
                    </button>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: darkMode ? "#f1f5f9" : "#0f172a" }}>Profile Photo</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>SVG, PNG, JPG or GIF (max. 400×400px)</div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <Btn small>Upload New</Btn>
                      <Btn small>Delete</Btn>
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {[
                    { label: "Full Name", key: "name", type: "text", placeholder: "Enter your full name" },
                    { label: "Email Address", key: "email", type: "email", placeholder: "your.email@example.com" },
                    { label: "Specialization", key: "specialization", type: "text", placeholder: "e.g. General Practitioner" },
                    { label: "Medical License Number", key: "license_number", type: "text", placeholder: "ML-XXXX-XXX" },
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
                          background: darkMode ? "#1e293b" : "#fff", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                          borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
                          fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#0f172a",
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
            <SectionFooter darkMode={darkMode}>
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
          <Section darkMode={darkMode} title="Security" subtitle="Manage your password and account protection.">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Skeleton height="120px" className="rounded-lg" />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[1, 2].map(i => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <Skeleton width="200px" height="16px" />
                        <Skeleton width="300px" height="14px" />
                      </div>
                      <Skeleton width="44px" height="24px" className="rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "1rem", background: darkMode ? "#0f172a" : "#f8fafc", borderRadius: "0.625rem",
                  border: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`
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
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#0f172a" }}>Change Password</div>
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
                  background: darkMode ? "#0f172a" : "#f8fafc", borderRadius: "0.75rem",
                  border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, padding: "1.5rem"
                }}>
                  <h3 style={{ fontWeight: 600, fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#0f172a", marginBottom: "1rem" }}>Password Change</h3>
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
                            borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
                            fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#0f172a",
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
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#0f172a" }}>Two-Factor Authentication (2FA)</div>
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
          <Section darkMode={darkMode} title="Platform Preferences" subtitle="Customize your notification and application experience.">
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Skeleton height="20px" width="150px" />
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <Skeleton width="20px" height="20px" />
                      <Skeleton width="200px" height="16px" />
                    </div>
                    <Skeleton width="44px" height="24px" style={{ borderRadius: "9999px" }} />
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
                      padding: "0.625rem 0", borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span className="ms" style={{ color: "#94a3b8", fontSize: 18 }}>{item.icon}</span>
                        <span style={{ fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#334155" }}>{item.label}</span>
                      </div>
                      <Toggle 
                        checked={preferences?.[item.key] || false}
                        onChange={(value) => handleTogglePreference(item.key, value)}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ paddingTop: "1.5rem", borderTop: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}` }}>
                  <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                    Display Settings
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.25rem 0" }}>
                    <span style={{ fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#334155" }}>Dark Mode</span>
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
            border: `1px solid ${darkMode ? "#ef4444" : "#fecaca"}`, borderRadius: "0.75rem",
            background: darkMode ? "rgba(239,68,68,0.1)" : "rgba(254,242,242,0.5)", padding: "1.5rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "1rem", marginTop: "1.5rem"
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#dc2626" }}>Account Deactivation</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>
                Once deactivated, you will lose access to all patient records.
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

function Section({ darkMode, title, subtitle, children }) {
  return (
    <div style={{
      background: darkMode ? "#1e293b" : "#fff", borderRadius: "0.875rem",
      border: `1px solid ${darkMode ? "#334155" : "#e8eaf0"}`, overflow: "hidden",
      marginBottom: "1.5rem",
      boxShadow: "0 1px 4px rgba(15,23,42,0.04)"
    }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}` }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: darkMode ? "#f1f5f9" : "#0f172a" }}>{title}</div>
        <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 3 }}>{subtitle}</div>
      </div>
      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {children}
      </div>
    </div>
  );
}

function SectionFooter({ darkMode, children }) {
  return (
    <div style={{
      margin: "0.5rem -1.5rem -1.5rem",
      padding: "1rem 1.5rem",
      background: darkMode ? "#0f172a" : "#f8fafc",
      borderTop: `1px solid ${darkMode ? "#334155" : "#f1f5f9"}`,
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
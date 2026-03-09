import PatientSidebar from "../sidebar/sidebar";
import useDarkMode from "../../../../contexts/DarkModeContext";

const MS = ({ children, style }) => (
  <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1, ...style }}>{children}</span>
);

export default function PatientAppointments() {
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      
      <div style={{ display: "flex", minHeight: "100vh", background: darkMode ? "#0f172a" : "#f6f6f8" }}>
        <PatientSidebar dark={darkMode} setDark={setDarkMode} />
        
        <main style={{ flex: 1, marginLeft: 240, padding: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 800, color: darkMode ? "#f1f5f9" : "#0f172a", marginBottom: "1.5rem" }}>
            <MS style={{ verticalAlign: "middle", marginRight: 12 }}>calendar_month</MS>
            Appointments
          </h1>
          
          <div style={{ 
            background: darkMode ? "#1e293b" : "#fff", borderRadius: 16, padding: "3rem", 
            textAlign: "center", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`
          }}>
            <div style={{ 
              width: 80, height: 80, background: "#f1f5f9", 
              borderRadius: "50%", display: "flex", alignItems: "center", 
              justifyContent: "center", margin: "0 auto 1.5rem"
            }}>
              <MS style={{ fontSize: 40, color: "#94a3b8" }}>event_available</MS>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: darkMode ? "#f1f5f9" : "#0f172a", marginBottom: 8 }}>
              No Appointments Scheduled
            </h2>
            <p style={{ color: darkMode ? "#94a3b8" : "#64748b", marginBottom: 24 }}>
              You don't have any upcoming appointments. Schedule one with your doctor.
            </p>
            <button style={{
              padding: "12px 24px", background: "#2463eb", color: "#fff",
              border: "none", borderRadius: 10, fontWeight: 600,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8
            }}>
              <MS style={{ fontSize: 18 }}>add</MS>
              Schedule Appointment
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

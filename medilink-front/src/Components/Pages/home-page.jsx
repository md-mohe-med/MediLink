import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PRIMARY = "#2463eb";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'Inter', sans-serif; background: #f6f6f8; }

  .medilink-root {
    font-family: 'Inter', sans-serif;
    color: #0f172a;
    background: #f6f6f8;
    overflow-x: hidden;
  }

  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    user-select: none;
  }

  .fade-in {
    animation: fadeInUp 0.7s ease both;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes scan {
    0%   { top: 10%; }
    50%  { top: 80%; }
    100% { top: 10%; }
  }

  .qr-scan-line {
    position: absolute;
    left: 8px; right: 8px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #2463eb, transparent);
    animation: scan 2.4s ease-in-out infinite;
  }

  .sol-card:hover .sol-icon {
    background: #2463eb !important;
    color: white !important;
  }
  .sol-icon { transition: background 0.2s, color 0.2s; }

  a { text-decoration: none; }

  .nav-link {
    color: #475569;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s;
  }
  .nav-link:hover { color: #2463eb; }

  .footer-link {
    font-size: 14px;
    color: #94a3b8;
    transition: color 0.2s;
  }
  .footer-link:hover { color: #2463eb; }

  .social-link {
    color: #94a3b8;
    transition: color 0.2s;
  }
  .social-link:hover { color: #2463eb; }

  .hero-img { filter: grayscale(0.2); transition: filter 0.5s ease; }
  .hero-img:hover { filter: grayscale(0); }

  .qr-glow {
    position: absolute;
    inset: 0;
    background: rgba(36,99,235,0.2);
    filter: blur(60px);
    border-radius: 9999px;
    transform: scale(0.75);
    transition: transform 0.3s;
  }
  .qr-wrapper:hover .qr-glow { transform: scale(1.1); }
`;

function Icon({ name, size, color, style: extra }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: size || 24, color: color || "inherit", lineHeight: 1, ...extra }}
    >
      {name}
    </span>
  );
}

/* ─── HEADER ─────────────────────────────────────────────────── */
function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "1rem 5rem",
      background: "white", borderBottom: "1px solid #e2e8f0",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <style>{styles}</style>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: PRIMARY }}>
        <Icon name="medical_services" size={32} color={PRIMARY} />
        <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "Inter", color: "#0f172a" }}>MediLink</span>
      </div>

      {/* Desktop Nav */}
      <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {["Features", "Solutions", "How it Works"].map(item => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(/ /g, "-")}`}
            className="nav-link"
          >
            {item}
          </a>
        ))}
        <button
          onClick={() => navigate("/register")}
          style={{
            minWidth: 100, height: 40, padding: "0 20px",
            background: PRIMARY, color: "white",
            border: "none", borderRadius: 8,
            fontWeight: 700, fontSize: 14, cursor: "pointer",
            fontFamily: "Inter", opacity: 1, transition: "opacity 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          Get Started
        </button>
        <button
          onClick={() => navigate("/login")}
          style={{
            minWidth: 100, height: 40, padding: "0 20px",
            background: "#f1f5f9", color: "#0f172a",
            border: "none", borderRadius: 8,
            fontWeight: 700, fontSize: 14, cursor: "pointer",
            fontFamily: "Inter", transition: "background 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
          onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
        >
          Login
        </button>
      </nav>

      {/* Mobile Menu */}
      <div style={{ display: "none" }} onClick={() => setMenuOpen(!menuOpen)}>
        <Icon name="menu" size={24} />
      </div>
    </header>
  );
}

/* ─── HERO ────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      padding: "6rem 5rem",
      background: "white",
      display: "grid", gridTemplateColumns: "1fr 1fr",
      gap: 48, alignItems: "center",
      maxWidth: 1200, margin: "0 auto",
    }}>
      {/* Left */}
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{
            color: PRIMARY, fontWeight: 700,
            letterSpacing: "0.15em", fontSize: 11, textTransform: "uppercase",
          }}>
            Health Tech Innovation
          </span>
          <h1 style={{
            fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
            fontWeight: 900, lineHeight: 1.05,
            color: "#0f172a", letterSpacing: "-0.03em",
          }}>
            Your entire health history, in one{" "}
            <span style={{ color: PRIMARY }}>secure place.</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: 18, lineHeight: 1.7, maxWidth: 540 }}>
            Empowering patients and providers with instant, secure access to medical records, labs, and imaging.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <button style={{
            minWidth: 160, height: 56, padding: "0 32px",
            background: PRIMARY, color: "white",
            border: "none", borderRadius: 10,
            fontWeight: 700, fontSize: 16, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(36,99,235,0.25)",
            transition: "transform 0.2s", fontFamily: "Inter",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            Get Started Free
          </button>
          <button style={{
            minWidth: 160, height: 56, padding: "0 32px",
            background: "transparent", color: "#0f172a",
            border: "2px solid #e2e8f0", borderRadius: 10,
            fontWeight: 700, fontSize: 16, cursor: "pointer",
            transition: "background 0.2s", fontFamily: "Inter",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            Learn More
          </button>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 24,
          paddingTop: 16, borderTop: "1px solid #f1f5f9",
        }}>
          {[
            { icon: "verified_user", label: "HIPAA Compliant" },
            { icon: "lock",          label: "256-bit Encryption" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={icon} size={16} color={PRIMARY} />
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — image card */}
      <div style={{ position: "relative" }}>
        <div style={{
          width: "100%", aspectRatio: "1",
          background: "#f1f5f9", borderRadius: "1.5rem",
          overflow: "hidden",
          boxShadow: "0 32px 64px rgba(0,0,0,0.12)",
          position: "relative",
        }}>
          <img
            className="hero-img"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAk656KzdStsjbKzg8zGUW-RFOsNdfP_ZdWgIHAk-y_s0Znf1hVHl9EbqvqsamINddQxT6F3fObLtHkdwLxx9PCuinWViYB_FZENJ8t56FnDMscWpfZwokpSkUzgIfvqBp16smZMnPH2u4KG8BvXiRb7GwwP457y_dvoqFo9gyRKLW7fKW_KI8nfzSLmmI4tLOzsdz51qQdVFk0ticspPSx67V6846fmRWxYe2t_AIlJf1NMXjJb88TRC4HK5FNfY39m4lo5cEtfMoJ"
            alt="Doctor using digital tablet in modern clinic"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* Floating badge */}
          <div style={{
            position: "absolute", bottom: 24, left: 24, right: 24,
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
            padding: "1rem 1.25rem", borderRadius: 12,
            display: "flex", alignItems: "center", gap: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}>
            <div style={{ background: "rgba(36,99,235,0.1)", padding: 8, borderRadius: 8 }}>
              <Icon name="analytics" size={22} color={PRIMARY} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                Latest Sync
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                All Records Updated 2m ago
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ────────────────────────────────────────────────── */
function Features() {
  return (
    <section id="features" style={{ padding: "5rem", background: "#f6f6f8" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 900, color: "#0f172a",
            marginBottom: 16, letterSpacing: "-0.02em",
          }}>
            The Fragmented Data Problem vs. The MediLink Solution
          </h2>
          <p style={{ color: "#64748b", fontSize: 18, maxWidth: 700, margin: "0 auto" }}>
            Healthcare data is stuck in silos. We're building the bridge for a truly connected medical journey.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          {/* Problem */}
          <div style={{
            background: "white", borderRadius: 20, padding: 40,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            display: "flex", flexDirection: "column", gap: 24,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "#fee2e2",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="warning" size={24} color="#dc2626" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                The Problem: Fragmented Data
              </h3>
              <p style={{ color: "#64748b", lineHeight: 1.7 }}>
                Medical records are often scattered across different providers, labs, and clinics, leading to delayed care, repeated tests, and lost critical information.
              </p>
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {["Manual faxing and paper files", "Delayed emergency access", "Patient data privacy risks"].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 14 }}>
                  <Icon name="close" size={14} color="#f87171" /> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Solution */}
          <div style={{
            background: "rgba(36,99,235,0.05)", borderRadius: 20, padding: 40,
            border: "2px solid rgba(36,99,235,0.2)",
            boxShadow: "0 8px 32px rgba(36,99,235,0.08)",
            display: "flex", flexDirection: "column", gap: 24,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: PRIMARY,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="shield" size={24} color="white" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                The MediLink Solution
              </h3>
              <p style={{ color: "#64748b", lineHeight: 1.7 }}>
                We centralize your labs, imaging, and prescriptions into a single, encrypted profile accessible anywhere, anytime by authorized parties.
              </p>
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {["Unified digital health vault", "Real-time record synchronization", "User-controlled access levels"].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 8, color: PRIMARY, fontSize: 14, fontWeight: 600 }}>
                  <Icon name="check_circle" size={16} color={PRIMARY} /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── QR SHARE ────────────────────────────────────────────────── */
function QRShare() {
  return (
    <section style={{
      padding: "5rem",
      background: "#0f172a", color: "white",
      position: "relative", overflow: "hidden",
    }}>
      {/* Radial glow bg */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "50%", height: "100%",
        background: "radial-gradient(circle at center, rgba(36,99,235,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 80, alignItems: "center", position: "relative",
      }}>
        {/* Left text */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ color: PRIMARY, fontWeight: 700, letterSpacing: "0.15em", fontSize: 11, textTransform: "uppercase" }}>
              Instant Access
            </span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Secure QR Share
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 18, lineHeight: 1.7 }}>
              Need to share your history with a new doctor? Instantly grant access using a one-time secure QR code. You maintain complete privacy control over which records are visible.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              { icon: "qr_code_2",     title: "One-Time Tokens",   desc: "Access links expire automatically for maximum security." },
              { icon: "visibility_off", title: "Granular Privacy",  desc: "Choose to share specific labs or your entire history." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <Icon name={icon} size={24} color={PRIMARY} />
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{title}</h4>
                  <p style={{ color: "#94a3b8", fontSize: 14 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button style={{
            alignSelf: "flex-start",
            minWidth: 200, height: 56, padding: "0 32px",
            background: PRIMARY, color: "white",
            border: "none", borderRadius: 10,
            fontWeight: 700, fontSize: 16, cursor: "pointer",
            transition: "transform 0.2s", fontFamily: "Inter",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            Generate My QR Code
          </button>
        </div>

        {/* Right — QR card */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="qr-wrapper" style={{ position: "relative" }}>
            <div className="qr-glow" />
            <div style={{
              position: "relative",
              background: "white", padding: 32,
              borderRadius: "2.5rem",
              boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
            }}>
              <div style={{
                width: 256, height: 256,
                background: "#f8fafc", borderRadius: 16,
                border: "4px solid #f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
              }}>
                <Icon name="qr_code_2" size={160} color="#0f172a" />
                <div className="qr-scan-line" />
              </div>
              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ height: 8, width: 128, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "66%", background: PRIMARY, borderRadius: 999 }} />
                </div>
                <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Secure Session Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── SOLUTIONS ───────────────────────────────────────────────── */
function Solutions() {
  const cards = [
    {
      icon: "person", title: "For Patients",
      items: ["Centralized vault for all medical files.", "Full ownership and privacy control.", "Easily share records with specialists."],
    },
    {
      icon: "stethoscope", title: "For Doctors",
      items: ["Instant access to patient longitudinal history.", "Reduced diagnostic errors and duplication.", "Optimized workflow for emergency triage."],
    },
    {
      icon: "biotech", title: "For Labs",
      items: ["Direct-to-patient result uploads.", "API integration with modern LIS.", "Securely verified patient identities."],
    },
  ];

  return (
    <section id="solutions" style={{ padding: "5rem", background: "white" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 900, color: "#0f172a", marginBottom: 16, letterSpacing: "-0.02em" }}>
            Tailored Solutions for Everyone
          </h2>
          <p style={{ color: "#64748b", fontSize: 18 }}>A unified platform serving the entire medical ecosystem.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32 }}>
          {cards.map(({ icon, title, items }) => (
            <div
              key={title}
              className="sol-card"
              style={{
                padding: 32, borderRadius: 20,
                background: "#f6f6f8",
                border: "1px solid #f1f5f9",
                transition: "box-shadow 0.2s", cursor: "default",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.10)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              <div
                className="sol-icon"
                style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: "rgba(36,99,235,0.1)", color: PRIMARY,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <Icon name={icon} size={28} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>{title}</h3>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
                {items.map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, color: "#64748b" }}>
                    <Icon name="check" size={18} color={PRIMARY} style={{ flexShrink: 0, marginTop: 1 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: 1, title: "Create Profile", desc: "Sign up and verify your identity securely in minutes." },
    { n: 2, title: "Sync Records",   desc: "Connect your providers or upload historical documents." },
    { n: 3, title: "Control & Share", desc: "Grant temporary access to care teams via secure QR." },
  ];

  return (
    <section id="how-it-works" style={{ padding: "5rem", background: "#f6f6f8" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
            How it Works
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 48, position: "relative" }}>
          {/* Connector line */}
          <div style={{
            position: "absolute", top: 32, left: "15%", right: "15%",
            height: 2, background: "#e2e8f0", zIndex: 0,
          }} />

          {steps.map(({ n, title, desc }) => (
            <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "white",
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, fontWeight: 900, color: PRIMARY,
                fontFamily: "Inter",
                border: "4px solid #f6f6f8",
                position: "relative", zIndex: 1,
              }}>
                {n}
              </div>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", marginBottom: 8 }}>{title}</h4>
                <p style={{ fontSize: 14, color: "#94a3b8" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TRUST BADGES ────────────────────────────────────────────── */
function TrustBadges() {
  const badges = [
    { icon: "admin_panel_settings", label: "HIPAA COMPLIANT" },
    { icon: "enhanced_encryption",  label: "AES-256 BIT" },
    { icon: "cloud_done",           label: "SOC2 TYPE II" },
    { icon: "verified",             label: "GDPR READY" },
  ];

  return (
    <section style={{
      padding: "3rem 5rem",
      background: "white",
      borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", flexWrap: "wrap",
        justifyContent: "center", alignItems: "center",
        gap: "3rem 6rem", opacity: 0.6,
      }}>
        {badges.map(({ icon, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name={icon} size={36} />
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", fontFamily: "Inter" }}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── CTA ─────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section style={{ padding: "5rem", background: PRIMARY, color: "white", textAlign: "center" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32, alignItems: "center" }}>
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Ready to take control of your health data?
        </h2>
        <p style={{ fontSize: 20, opacity: 0.9 }}>
          Join 500,000+ patients and 12,000+ providers already on MediLink.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <button style={{
            minWidth: 200, height: 56, padding: "0 32px",
            background: "white", color: PRIMARY,
            border: "none", borderRadius: 10,
            fontWeight: 800, fontSize: 18, cursor: "pointer",
            transition: "background 0.2s", fontFamily: "Inter",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}
          >
            Get Started for Free
          </button>
          <button style={{
            minWidth: 200, height: 56, padding: "0 32px",
            background: "transparent", color: "white",
            border: "2px solid white", borderRadius: 10,
            fontWeight: 800, fontSize: 18, cursor: "pointer",
            transition: "background 0.2s", fontFamily: "Inter",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            Talk to Sales
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: "white", borderTop: "1px solid #e2e8f0", padding: "4rem 5rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }}>
        {/* Brand */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="medical_services" size={28} color={PRIMARY} />
            <span style={{ fontSize: 20, fontWeight: 900, fontFamily: "Inter", color: "#0f172a" }}>MediLink</span>
          </div>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, maxWidth: 280 }}>
            The secure platform for universal health record accessibility. Built for patients, trusted by doctors.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            {["public", "share", "alternate_email"].map(icon => (
              <a key={icon} href="#" className="social-link">
                <Icon name={icon} size={22} />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {[
          { title: "Product",  links: ["Features", "Security", "Mobile App", "API Docs"] },
          { title: "Company",  links: ["About Us", "Careers", "Press", "Compliance"] },
          { title: "Support",  links: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"] },
        ].map(({ title, links }) => (
          <div key={title}>
            <h4 style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", marginBottom: 24, fontFamily: "Inter" }}>{title}</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
              {links.map(link => (
                <li key={link}>
                  <a href="#" className="footer-link">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: 1200, margin: "3rem auto 0",
        paddingTop: 24, borderTop: "1px solid #f1f5f9",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 12, color: "#94a3b8",
      }}>
        <p> 2024 MediLink Health Systems Inc. All rights reserved.</p>
        <div style={{ display: "flex", gap: 24 }}>
          <span>HIPAA Compliant Platform</span>
          <span>Made with care for global health</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── ROOT EXPORT ─────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="medilink-root">
      <Header />
      <main>
        <Hero />
        <Features />
        <QRShare />
        <Solutions />
        <HowItWorks />
        <TrustBadges />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
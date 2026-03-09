import { useState, useRef, useEffect } from "react";
import PatientSidebar from "../sidebar/sidebar";
import api from "../../../../api/axios";
import useDarkMode from "../../../../contexts/DarkModeContext";

const MS = ({ children, style, className }) => (
  <span
    className={className}
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

const tabs = ["Doctors", "Patients", "Lab Techs"];

export default function PatientMessages() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useDarkMode();
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages(activeConversation.id);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patient/conversations');
      setConversations(response.data);
      if (response.data.length > 0 && !activeConversation) {
        setActiveConversation(response.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(`/patient/conversations/${conversationId}/messages`);
      setMessages(response.data.messages);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setError("Failed to load messages");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation || sending) return;
    
    setSending(true);
    const messageContent = input.trim();
    
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const tempMessage = { 
      id: Date.now(), 
      from: "me", 
      text: messageContent, 
      time,
      type: 'text'
    };
    setMessages(prev => [...prev, tempMessage]);
    setInput("");

    try {
      const response = await api.post(`/patient/conversations/${activeConversation.id}/messages`, {
        content: messageContent,
        type: 'text'
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? { ...response.data.message, id: response.data.message.id } : msg
      ));
      
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation.id 
          ? { ...conv, preview: messageContent, time: 'Just now' }
          : conv
      ));
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectConversation = (conv) => {
    setActiveConversation(conv);
    setConversations(prev => prev.map(c => 
      c.id === conv.id ? { ...c, unread_count: 0 } : c
    ));
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,0&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        textarea { font-family: 'DM Sans', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .dot { animation: pulse 1.2s infinite; }
        .dot2 { animation: pulse 1.2s 0.2s infinite; }
        .dot3 { animation: pulse 1.2s 0.4s infinite; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: darkMode ? "#0f172a" : "#f6f6f8" }}>
        <PatientSidebar dark={darkMode} setDark={setDarkMode} />

        <div style={{ flex: 1, display: "flex", marginLeft: 240, overflow: "hidden" }}>
          {/* Conversation List */}
          <aside style={{
            width: 300, background: darkMode ? "#1e293b" : "#fff", borderRight: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
            display: "flex", flexDirection: "column", flexShrink: 0,
          }}>
            <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ position: "relative" }}>
                <MS style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 18 }}>search</MS>
                <input
                  placeholder="Search conversations..."
                  style={{
                    width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                    background: darkMode ? "#0f172a" : "#f1f5f9", border: `1px solid ${darkMode ? "#334155" : "transparent"}`, borderRadius: 8,
                    fontSize: "0.8rem", outline: "none", color: darkMode ? "#f1f5f9" : "#0f172a"
                  }}
                />
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
              {tabs.map((tab, i) => (
                <button key={tab} onClick={() => setActiveTab(i)} style={{
                  flex: 1, padding: "10px 4px",
                  fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em",
                  textTransform: "uppercase", border: "none", background: "transparent",
                  cursor: "pointer",
                  color: activeTab === i ? "#2463eb" : "#94a3b8",
                  borderBottom: activeTab === i ? "2px solid #2463eb" : "2px solid transparent",
                  transition: "color 0.15s",
                }}>{tab}</button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: "10px", background: "#fef2f2", color: "#dc2626", fontSize: "0.8rem", textAlign: "center" }}>
                {error}
                <button onClick={() => setError(null)} style={{ marginLeft: 8, background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>✕</button>
              </div>
            )}

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                  <MS style={{ fontSize: 40, color: "#cbd5e1", marginBottom: 8 }}>chat</MS>
                  <div style={{ fontSize: "0.85rem" }}>No conversations yet</div>
                  <div style={{ fontSize: "0.75rem", marginTop: 4 }}>Visit a doctor to start chatting</div>
                </div>
              ) : (
                conversations.map((c, i) => (
                  <div key={c.id} 
                    onClick={() => selectConversation(c)}
                    style={{
                      display: "flex", gap: 12, padding: "14px 16px",
                      background: activeConversation?.id === c.id ? (darkMode ? "rgba(36,99,235,0.1)" : "rgba(36,99,235,0.05)") : (darkMode ? "#1e293b" : "#fff"),
                      borderLeft: activeConversation?.id === c.id ? "3px solid #2463eb" : "3px solid transparent",
                      borderTop: i > 0 ? "1px solid #f8fafc" : "none",
                      cursor: "pointer", transition: "background 0.15s",
                    }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img 
                        src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=2463eb&color=fff`} 
                        style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} 
                        alt={c.name} 
                      />
                      {c.online && (
                        <span style={{
                          position: "absolute", bottom: 1, right: 1,
                          width: 11, height: 11, borderRadius: "50%",
                          background: c.statusColor, border: "2px solid #fff",
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                        <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 500, flexShrink: 0, marginLeft: 4 }}>{c.time}</span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: c.unread_count > 0 ? "#2463eb" : "#94a3b8", fontWeight: c.unread_count > 0 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.preview || 'No messages yet'}
                      </p>
                      {c.unread_count > 0 && (
                        <span style={{ 
                          display: "inline-block", 
                          background: "#2463eb", color: "#fff", 
                          borderRadius: 10, padding: "2px 8px", 
                          fontSize: "0.65rem", fontWeight: 700, marginTop: 4 
                        }}>
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Chat Main */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", background: darkMode ? "#0f172a" : "#fff", minWidth: 0 }}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <header style={{
                  height: 72, padding: "0 1.5rem", borderBottom: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexShrink: 0, background: darkMode ? "#1e293b" : "#fff"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ position: "relative" }}>
                      <img
                        src={activeConversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.name)}&background=2463eb&color=fff`}
                        style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }}
                        alt={activeConversation.name}
                      />
                      <span style={{
                        position: "absolute", bottom: 1, right: 1,
                        width: 11, height: 11, borderRadius: "50%",
                        background: "#22c55e", border: "2px solid #fff",
                      }} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: "0.95rem", color: darkMode ? "#f1f5f9" : "#0f172a" }}>
                        {activeConversation.name}
                        <MS style={{ color: "#2463eb", fontSize: 16 }}>verified</MS>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 500 }}>{activeConversation.specialization}</span>
                        <span style={{ color: "#cbd5e1", fontSize: 10 }}>•</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.04em" }}>Online</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {["videocam", "call", "info"].map(icon => (
                      <button key={icon} style={{
                        width: 36, height: 36, borderRadius: "50%", border: "none",
                        background: "transparent", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <MS style={{ color: "#64748b" }}>{icon}</MS>
                      </button>
                    ))}
                  </div>
                </header>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 20, background: darkMode ? "#0f172a" : "rgba(248,250,252,0.5)" }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <span style={{
                      padding: "3px 12px", background: "#e2e8f0", borderRadius: 9999,
                      fontSize: "0.62rem", fontWeight: 800, color: "#64748b",
                      textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>Today</span>
                  </div>

                  {messages.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                      <MS style={{ fontSize: 48, color: "#cbd5e1", marginBottom: 12 }}>chat_bubble_outline</MS>
                      <div style={{ fontSize: "0.9rem", marginBottom: 4 }}>No messages yet</div>
                      <div style={{ fontSize: "0.8rem" }}>Start the conversation by sending a message</div>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} style={{
                        display: "flex",
                        flexDirection: msg.from === "me" ? "row-reverse" : "row",
                        alignItems: "flex-start",
                        gap: 10,
                        maxWidth: "78%",
                        alignSelf: msg.from === "me" ? "flex-end" : "flex-start",
                      }}>
                        {msg.from === "them" && (
                          <img
                            src={activeConversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.name)}&background=2463eb&color=fff`}
                            style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", marginTop: 2, flexShrink: 0 }}
                            alt={activeConversation.name}
                          />
                        )}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: msg.from === "me" ? "flex-end" : "flex-start", gap: 4 }}>
                          {msg.type === "file" ? (
                            <div style={{
                              background: darkMode ? "#1e293b" : "#fff", border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                              borderRadius: msg.from === "me" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                              padding: "10px 14px", display: "flex", alignItems: "center", gap: 12,
                              width: 260, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            }}>
                              <div style={{
                                width: 44, height: 44, background: "rgba(239,68,68,0.08)",
                                borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <MS style={{ color: "#dc2626", fontSize: 28 }}>picture_as_pdf</MS>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: "0.8rem", color: darkMode ? "#f1f5f9" : "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.fileName}</div>
                                <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 2 }}>{msg.fileSize}</div>
                              </div>
                              <button style={{
                                width: 30, height: 30, background: "transparent", border: "none",
                                borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <MS style={{ color: "#2463eb", fontSize: 18 }}>download</MS>
                              </button>
                            </div>
                          ) : (
                            <div style={{
                              padding: "10px 14px",
                              background: msg.from === "me" ? "#2463eb" : (darkMode ? "#1e293b" : "#fff"),
                              color: msg.from === "me" ? "#fff" : (darkMode ? "#f1f5f9" : "#0f172a"),
                              borderRadius: msg.from === "me" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                              border: msg.from === "them" ? `1px solid ${darkMode ? "#334155" : "#e2e8f0"}` : "none",
                              boxShadow: msg.from === "me"
                                ? "0 4px 12px rgba(36,99,235,0.2)"
                                : "0 1px 3px rgba(0,0,0,0.06)",
                              fontSize: "0.875rem", lineHeight: 1.6,
                            }}>
                              {msg.text}
                            </div>
                          )}
                          <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 500 }}>{msg.time}</span>
                        </div>
                      </div>
                    ))
                  )}

                  {isTyping && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, maxWidth: "78%" }}>
                      <img
                        src={activeConversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.name)}&background=2463eb&color=fff`}
                        style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", marginTop: 2 }}
                        alt={activeConversation.name}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {["dot", "dot2", "dot3"].map(cls => (
                            <span key={cls} className={cls} style={{
                              width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", display: "inline-block",
                            }} />
                          ))}
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontStyle: "italic" }}>{activeConversation.name} is typing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input Footer */}
                <footer style={{
                  padding: "0.875rem 1.25rem",
                  background: darkMode ? "#1e293b" : "#fff", borderTop: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`, flexShrink: 0,
                }}>
                  <div style={{
                    background: darkMode ? "#0f172a" : "#f1f5f9", borderRadius: 14, padding: "6px 8px",
                    display: "flex", alignItems: "flex-end", gap: 6,
                    border: `1px solid ${darkMode ? "#334155" : "transparent"}`, transition: "border-color 0.15s",
                  }}>
                    {["add_circle", "image"].map(icon => (
                      <button key={icon} style={{
                        width: 34, height: 34, background: "transparent", border: "none",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#94a3b8", borderRadius: 8, flexShrink: 0,
                      }}>
                        <MS style={{ color: "#94a3b8" }}>{icon}</MS>
                      </button>
                    ))}
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Type a message..."
                      rows={1}
                      disabled={sending}
                      style={{
                        flex: 1, background: "transparent", border: "none", outline: "none",
                        fontSize: "0.875rem", color: darkMode ? "#f1f5f9" : "#0f172a", resize: "none",
                        maxHeight: 120, paddingTop: 8, paddingBottom: 8, lineHeight: 1.5,
                        opacity: sending ? 0.6 : 1,
                      }}
                    />
                    <button style={{
                      width: 34, height: 34, background: "transparent", border: "none",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <MS style={{ color: "#94a3b8" }}>mood</MS>
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      style={{
                        width: 38, height: 38, background: sending ? "#94a3b8" : "#2463eb", border: "none",
                        borderRadius: 10, cursor: sending ? "not-allowed" : "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                        boxShadow: "0 4px 12px rgba(36,99,235,0.3)", transition: "opacity 0.15s",
                      }}
                    >
                      <MS style={{ color: "#fff", fontSize: 18 }}>{sending ? "hourglass_empty" : "send"}</MS>
                    </button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 4px 0" }}>
                    <span style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 500 }}>HIPAA Compliant Secure Messaging</span>
                    <span style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Enter to send</span>
                  </div>
                </footer>
              </>
            ) : (
              <div style={{ 
                flex: 1, display: "flex", flexDirection: "column", 
                alignItems: "center", justifyContent: "center",
                color: "#94a3b8", background: "rgba(248,250,252,0.5)"
              }}>
                <MS style={{ fontSize: 64, color: "#cbd5e1", marginBottom: 16 }}>chat</MS>
                <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Select a conversation</div>
                <div style={{ fontSize: "0.85rem" }}>Choose a doctor from the list to start messaging</div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

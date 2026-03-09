import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../sidebar/side";
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

const tabs = ["Patients", "Doctors", "Lab Techs"];

export default function DoctorMessages() {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [dark, setDark] = useDarkMode();
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const border = dark ? "#334155" : "#e2e8f0";
  const muted = dark ? "#94a3b8" : "#64748b";

  // Get navigation state
  const navState = location.state || {};
  const { selectedConversationId, patientId, patientName, conversation: navConversation } = navState;
  
  console.log('Navigation state:', navState);

  useEffect(() => {
    // If we have a conversation from navigation (scan page), add it immediately
    if (navConversation && !conversations.find(c => String(c.id) === String(navConversation.id))) {
      console.log('Adding conversation from navigation:', navConversation);
      setConversations(prev => [navConversation, ...prev]);
      setActiveConversation(navConversation);
      // Clear the conversation from nav state
      navigate(location.pathname, { replace: true, state: { ...navState, conversation: undefined } });
    }
    
    fetchConversations();
  }, []);

  // Handle navigation state - pre-select conversation when coming from scan page
  useEffect(() => {
    if (conversations.length > 0) {
      // If we have a selectedConversationId from navigation, find and select it
      if (selectedConversationId) {
        // Convert to string for comparison since IDs might be numbers or strings
        const targetId = String(selectedConversationId);
        const conversation = conversations.find(c => String(c.id) === targetId);
        if (conversation) {
          setActiveConversation(conversation);
          // Clear the navigation state to prevent re-selection on refresh
          navigate(location.pathname, { replace: true, state: {} });
          return;
        }
      }
      
      // If we have patientId but no conversation ID, find conversation by patient
      if (patientId && !activeConversation) {
        const targetPatientId = String(patientId);
        const conversation = conversations.find(c => String(c.patient_id) === targetPatientId);
        if (conversation) {
          setActiveConversation(conversation);
          navigate(location.pathname, { replace: true, state: {} });
          return;
        }
        // If no conversation exists for this patient, we might need to create one
        // This will be handled when the user tries to send a message
      }
      
      // Default: select first conversation if none selected
      if (!activeConversation) {
        setActiveConversation(conversations[0]);
      }
    }
  }, [conversations, selectedConversationId, patientId, activeConversation, navigate, location.pathname]);

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
      const response = await api.get('/doctor/conversations');
      setConversations(response.data);
      // Only auto-select first conversation if we don't have navigation state
      // Navigation state handling will select the correct conversation
      const navState = location.state || {};
      if (response.data.length > 0 && !activeConversation && !navState.selectedConversationId && !navState.patientId) {
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
      const response = await api.get(`/doctor/conversations/${conversationId}/messages`);
      setMessages(response.data.messages);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setError("Failed to load messages");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    
    let conversation = activeConversation;
    
    // If no active conversation but we have patientId from scan, create conversation first
    if (!conversation && patientId) {
      try {
        console.log('Creating conversation for patient:', patientId);
        setLoading(true);
        const response = await api.post('/doctor/conversations', {
          patient_id: patientId
        });
        console.log('Conversation created:', response.data);
        conversation = response.data.conversation || response.data;
        setActiveConversation(conversation);
        // Add to conversations list
        setConversations(prev => [conversation, ...prev]);
      } catch (err) {
        console.error('Failed to create conversation:', err);
        if (err.response?.data?.message?.includes('already exists')) {
          // Conversation exists, fetch conversations again
          await fetchConversations();
        } else {
          setError('Failed to start conversation: ' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }
    
    if (!conversation) {
      setError('No conversation selected');
      return;
    }
    
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
      const response = await api.post(`/doctor/conversations/${conversation.id}/messages`, {
        content: messageContent,
        type: 'text'
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? { ...response.data.message, id: response.data.message.id } : msg
      ));
      
      setConversations(prev => prev.map(conv => 
        conv.id === conversation.id 
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

  const viewPatientRecords = () => {
    if (activeConversation?.patient_id) {
      navigate(`/doctor/patient/${activeConversation.patient_id}`);
    }
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

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: dark ? "#0f172a" : "#f6f6f8" }}>
        <Sidebar dark={dark} setDark={setDark} />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Conversation List */}
          <aside style={{
            width: 300, background: "#fff", borderRight: "1px solid #e2e8f0",
            display: "flex", flexDirection: "column", flexShrink: 0,
          }}>
            <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ position: "relative" }}>
                <MS style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 18 }}>search</MS>
                <input
                  placeholder="Search patients..."
                  style={{
                    width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                    background: "#f1f5f9", border: "none", borderRadius: 8,
                    fontSize: "0.8rem", outline: "none",
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
                  <div style={{ fontSize: "0.75rem", marginTop: 4 }}>Scan a patient QR code to start chatting</div>
                </div>
              ) : (
                conversations.map((c, i) => (
                  <div key={c.id} 
                    onClick={() => selectConversation(c)}
                    style={{
                      display: "flex", gap: 12, padding: "14px 16px",
                      background: activeConversation?.id === c.id ? "rgba(36,99,235,0.05)" : "#fff",
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
                          background: "#22c55e", border: "2px solid #fff",
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
          <main style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", minWidth: 0 }}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <header style={{
                  height: 72, padding: "0 1.5rem", borderBottom: "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexShrink: 0,
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
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                        {activeConversation.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 500 }}>Patient ID: {activeConversation.patient_id_display || 'N/A'}</span>
                        <span style={{ color: "#cbd5e1", fontSize: 10 }}>•</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.04em" }}>Online</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button 
                      onClick={viewPatientRecords}
                      style={{
                        padding: "8px 16px", background: "#2463eb", color: "#fff",
                        border: "none", borderRadius: 8, cursor: "pointer",
                        fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <MS style={{ fontSize: 16 }}>folder_open</MS>
                      View Records
                    </button>
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
                <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 20, background: "rgba(248,250,252,0.5)" }}>
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
                              background: "#fff", border: "1px solid #e2e8f0",
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
                                <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.fileName}</div>
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
                              background: msg.from === "me" ? "#2463eb" : "#fff",
                              color: msg.from === "me" ? "#fff" : "#0f172a",
                              borderRadius: msg.from === "me" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                              border: msg.from === "them" ? "1px solid #e2e8f0" : "none",
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
                  background: "#fff", borderTop: "1px solid #e2e8f0", flexShrink: 0,
                }}>
                  <div style={{
                    background: "#f1f5f9", borderRadius: 14, padding: "6px 8px",
                    display: "flex", alignItems: "flex-end", gap: 6,
                    border: "1px solid transparent", transition: "border-color 0.15s",
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
                        fontSize: "0.875rem", color: "#0f172a", resize: "none",
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
            ) : patientId && !activeConversation ? (
              <div style={{ 
                flex: 1, display: "flex", flexDirection: "column", 
                alignItems: "center", justifyContent: "center",
                color: "#94a3b8", background: "rgba(248,250,252,0.5)",
                padding: "2rem"
              }}>
                <MS style={{ fontSize: 64, color: "#cbd5e1", marginBottom: 16 }}>chat</MS>
                <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8, color: "#0f172a" }}>
                  Ready to chat with {patientName || 'patient'}
                </div>
                <div style={{ fontSize: "0.85rem", marginBottom: "1.5rem", textAlign: "center" }}>
                  Type your first message below to start the conversation
                </div>
                <div style={{ 
                  background: "#f1f5f9", borderRadius: 14, padding: "6px 8px",
                  display: "flex", alignItems: "flex-end", gap: 6,
                  border: "1px solid #e2e8f0", width: "100%", maxWidth: "500px"
                }}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Type your first message..."
                    rows={2}
                    style={{
                      flex: 1, background: "transparent", border: "none", outline: "none",
                      fontSize: "0.875rem", color: "#0f172a", resize: "none",
                      maxHeight: 120, padding: "8px", lineHeight: 1.5,
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    style={{
                      width: 38, height: 38, background: !input.trim() || sending ? "#94a3b8" : "#2463eb", border: "none",
                      borderRadius: 10, cursor: !input.trim() || sending ? "not-allowed" : "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: "0 4px 12px rgba(36,99,235,0.3)",
                    }}
                  >
                    <MS style={{ color: "#fff", fontSize: 18 }}>{sending ? "hourglass_empty" : "send"}</MS>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ 
                flex: 1, display: "flex", flexDirection: "column", 
                alignItems: "center", justifyContent: "center",
                color: "#94a3b8", background: "rgba(248,250,252,0.5)"
              }}>
                <MS style={{ fontSize: 64, color: "#cbd5e1", marginBottom: 16 }}>chat</MS>
                <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Select a conversation</div>
                <div style={{ fontSize: "0.85rem" }}>Choose a patient from the list to start messaging</div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

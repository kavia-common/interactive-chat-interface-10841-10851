import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import './App.css';
import './index.css';

/**
 * Ocean Professional theme tokens
 */
const theme = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  error: '#EF4444',
  surface: '#ffffff',
  background: '#f9fafb',
  text: '#111827',
  border: 'rgba(17, 24, 39, 0.08)',
};

/**
 * Small helper to get backend base URL from env, with fallback to same-origin proxy.
 */
const getApiBase = () => {
  // PUBLIC_INTERFACE
  /** Returns the base URL for the backend API. Set REACT_APP_API_BASE in .env to override. */
  return process.env.REACT_APP_API_BASE || '';
};

/**
 * Fetch helper with basic error handling
 */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

/**
 * UI primitives
 */
function TopBar({ onToggleSettings, provider, healthy, onToggleTheme, darkMode }) {
  return (
    <div style={{
      height: 56,
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      background: `linear-gradient(180deg, rgba(37,99,235,0.05) 0%, rgba(249,250,251,0) 100%)`,
      position: 'sticky',
      top: 0,
      zIndex: 5
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 10, height: 10, borderRadius: 10,
          background: healthy ? theme.secondary : theme.error,
          boxShadow: `0 0 0 3px ${healthy ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'}`
        }} />
        <div style={{ fontWeight: 600, color: theme.text }}>LLM Chat</div>
        <div style={{ color: '#6B7280', fontSize: 12 }}>
          {provider ? `Provider: ${provider}` : '—'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onToggleTheme}
          title="Toggle theme"
          style={ghostBtnStyle}
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        <button
          onClick={onToggleSettings}
          style={primaryBtnStyle}
        >
          Settings
        </button>
      </div>
    </div>
  );
}

function Sidebar({
  sessions,
  onSelectSession,
  currentSessionId,
  availableModels,
  model,
  setModel,
  onNewSession,
}) {
  return (
    <div style={{
      width: 280,
      borderRight: `1px solid ${theme.border}`,
      background: theme.surface,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Model</div>
        <select
          value={model || ''}
          onChange={(e) => setModel(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${theme.border}`,
            background: theme.background,
            color: theme.text,
            outline: 'none'
          }}
        >
          <option value="">Auto</option>
          {availableModels.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name} • {m.provider} {m.status !== 'available' ? `(${m.status})` : ''}
            </option>
          ))}
        </select>
        <button onClick={onNewSession} style={{ ...secondaryBtnStyle, width: '100%', marginTop: 12 }}>
          + New Chat
        </button>
      </div>

      <div style={{ padding: 12, fontSize: 12, color: '#6B7280' }}>History</div>
      <div style={{ overflowY: 'auto', padding: '0 8px 16px 8px' }}>
        {sessions.length === 0 && (
          <div style={{ color: '#9CA3AF', fontSize: 13, padding: '0 8px' }}>No sessions yet</div>
        )}
        {sessions.map((s) => (
          <button
            key={s.session_id}
            onClick={() => onSelectSession(s.session_id)}
            style={{
              textAlign: 'left',
              width: '100%',
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${currentSessionId === s.session_id ? theme.primary : theme.border}`,
              background: currentSessionId === s.session_id ? 'rgba(37,99,235,0.06)' : theme.surface,
              color: theme.text,
              marginBottom: 8,
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{s.title || 'Untitled chat'}</div>
            <div style={{ color: '#6B7280', fontSize: 12 }}>
              {new Date(s.updated_at || s.created_at || Date.now()).toLocaleString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageItem({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      padding: '6px 0'
    }}>
      <div style={{
        maxWidth: '75%',
        background: isUser ? theme.primary : theme.surface,
        color: isUser ? '#ffffff' : theme.text,
        border: `1px solid ${isUser ? 'rgba(37,99,235,0.25)' : theme.border}`,
        padding: '10px 12px',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        whiteSpace: 'pre-wrap'
      }}>
        {msg.content}
        {!!msg.attachments?.length && (
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
            Attachments:
            <ul style={{ margin: '6px 0 0 18px' }}>
              {msg.attachments.map((a) => (
                <li key={a.id}>
                  {a.filename} {a.size_bytes ? `(${a.size_bytes} bytes)` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        {msg.model && !isUser && (
          <div style={{ marginTop: 6, fontSize: 11, opacity: 0.8 }}>Model: {msg.model}</div>
        )}
      </div>
    </div>
  );
}

function ChatInput({
  onSend,
  onUploadFile,
  onUploadPhoto,
  disabled,
}) {
  const [message, setMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [attachments, setAttachments] = useState([]);
  const fileRef = useRef(null);
  const photoRef = useRef(null);

  const handleSend = () => {
    if (!message.trim()) return;
    onSend({ message: message.trim(), system_prompt: systemPrompt || null, attachments });
    setMessage('');
  };

  const handleUpload = async (e, isPhoto) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const form = new FormData();
      form.append(isPhoto ? 'photo' : 'file', file);
      const data = await apiFetch(isPhoto ? '/uploads/photo' : '/uploads/file', {
        method: 'POST',
        body: form
      });
      setAttachments((prev) => [...prev, data.id]);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div style={{
      borderTop: `1px solid ${theme.border}`,
      padding: 12,
      background: theme.surface
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          rows={3}
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={textAreaStyle}
          disabled={disabled}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Optional system prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            style={inputStyle}
            disabled={disabled}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => fileRef.current?.click()}
              title="Upload file"
              style={ghostBtnStyle}
              disabled={disabled}
            >
              📎 File
            </button>
            <button
              onClick={() => photoRef.current?.click()}
              title="Upload photo"
              style={ghostBtnStyle}
              disabled={disabled}
            >
              🖼️ Photo
            </button>
            <button
              onClick={handleSend}
              style={primaryBtnStyle}
              disabled={disabled}
            >
              Send →
            </button>
          </div>
        </div>
        {!!attachments.length && (
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            Attached IDs: {attachments.join(', ')}
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={(e) => handleUpload(e, false)} />
      <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUpload(e, true)} />
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: theme.background,
  color: theme.text
};

const chatAreaStyle = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  height: '100vh'
};

const messagesWrapStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: 16,
  background: `linear-gradient(180deg, rgba(37,99,235,0.04) 0%, rgba(249,250,251,0.6) 40%, rgba(249,250,251,1) 100%)`
};

const inputStyle = {
  flex: 1,
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${theme.border}`,
  background: theme.surface,
  outline: 'none'
};

const textAreaStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
  background: theme.surface,
  outline: 'none',
  resize: 'vertical'
};

const primaryBtnStyle = {
  background: theme.primary,
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
};

const secondaryBtnStyle = {
  background: theme.secondary,
  color: '#111827',
  border: 'none',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 600,
};

const ghostBtnStyle = {
  background: 'transparent',
  color: theme.text,
  border: `1px solid ${theme.border}`,
  borderRadius: 10,
  padding: '10px 12px',
  cursor: 'pointer'
};

// PUBLIC_INTERFACE
function App() {
  /** Main application component that renders the Ocean Professional chat UI and integrates with the FastAPI backend. */
  const [darkMode, setDarkMode] = useState(false);
  const [provider, setProvider] = useState('');
  const [healthy, setHealthy] = useState(true);
  const [models, setModels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Apply theme to document (light/dark background adjustments)
  useEffect(() => {
    document.body.style.background = darkMode ? '#0b1220' : theme.background;
    document.body.style.color = darkMode ? '#e5e7eb' : theme.text;
  }, [darkMode]);

  // Fetch models and sessions at load
  useEffect(() => {
    (async () => {
      try {
        const modelRes = await apiFetch('/models');
        setProvider(modelRes.provider);
        setHealthy(!!modelRes.healthy);
        setModels(modelRes.models || []);
      } catch (e) {
        console.warn('Failed to fetch models', e);
        setHealthy(false);
      }
      try {
        const sess = await apiFetch('/chat/sessions');
        setSessions(sess.sessions || []);
      } catch (e) {
        console.warn('Failed to fetch sessions', e);
      }
    })();
  }, []);

  const currentModel = useMemo(() => {
    return models.find((m) => m.selected) ? models.find((m) => m.selected).name : null;
  }, [models]);

  const setModel = useCallback((modelName) => {
    setModels((prev) =>
      prev.map((m) => ({ ...m, selected: m.name === modelName }))
    );
  }, []);

  const loadMessages = useCallback(async (sid) => {
    try {
      const res = await apiFetch(`/chat/${encodeURIComponent(sid)}/messages`);
      setMessages(res.messages || []);
    } catch (e) {
      console.warn('Failed to fetch messages', e);
      setMessages([]);
    }
  }, []);

  const handleSelectSession = async (sid) => {
    setSessionId(sid);
    await loadMessages(sid);
  };

  const handleNewSession = () => {
    setSessionId(null);
    setMessages([]);
  };

  const upsertSessionMeta = useCallback((sid, title) => {
    // Update sessions list optimistically with current time
    setSessions((prev) => {
      const nowIso = new Date().toISOString();
      const idx = prev.findIndex((s) => s.session_id === sid);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], updated_at: nowIso, title: copy[idx].title || title || 'Chat' };
        return copy;
      }
      return [{ session_id: sid, title: title || 'New chat', created_at: nowIso, updated_at: nowIso, messages: [] }, ...prev];
    });
  }, []);

  const sendMessage = async ({ message, system_prompt, attachments }) => {
    setLoading(true);
    // optimistic user message
    const optimisticId = `temp_${Date.now()}`;
    const newUserMsg = { id: optimisticId, role: 'user', content: message, attachments: [], created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, newUserMsg]);

    try {
      const payload = {
        session_id: sessionId || null,
        message,
        model: models.find((m) => m.selected)?.name || null,
        attachments: attachments || [],
        system_prompt: system_prompt || null
      };
      const res = await apiFetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      // set active session id if new
      if (!sessionId) {
        setSessionId(res.session_id);
      }
      upsertSessionMeta(res.session_id, messages[0]?.content?.slice(0, 30) || 'Chat');

      // Replace optimistic user message id (optional) or leave it; then add assistant response
      setMessages((prev) => {
        // keep the optimistic user message as-is for simplicity, append assistant
        return [...prev, res.message];
      });

      // refresh sessions timestamp order
      setSessions((prev) => {
        const nowIso = new Date().toISOString();
        const others = prev.filter((s) => s.session_id !== res.session_id);
        const current = prev.find((s) => s.session_id === res.session_id) || { session_id: res.session_id, created_at: nowIso, title: 'Chat' };
        return [{ ...current, updated_at: nowIso }, ...others];
      });
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { id: `err_${Date.now()}`, role: 'assistant', content: `Error: ${e.message}`, created_at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <Sidebar
        sessions={sessions}
        onSelectSession={handleSelectSession}
        currentSessionId={sessionId}
        availableModels={models}
        model={models.find((m) => m.selected)?.name || ''}
        setModel={setModel}
        onNewSession={handleNewSession}
      />
      <div style={chatAreaStyle}>
        <TopBar
          onToggleSettings={() => alert('Settings placeholder')}
          provider={provider}
          healthy={healthy}
          onToggleTheme={() => setDarkMode((d) => !d)}
          darkMode={darkMode}
        />
        <div style={messagesWrapStyle}>
          {messages.length === 0 ? (
            <div style={{
              height: '100%',
              minHeight: '50vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7280',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: theme.text }}>Start a conversation</div>
                <div style={{ maxWidth: 520, margin: '0 auto' }}>
                  Choose a model, optionally upload files or photos, and send your message.
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => <MessageItem key={m.id} msg={m} />)
          )}
          {loading && (
            <div style={{ color: '#6B7280', fontSize: 13, padding: '8px 0' }}>Assistant is thinking…</div>
          )}
        </div>
        <ChatInput
          onSend={sendMessage}
          onUploadFile={() => {}}
          onUploadPhoto={() => {}}
          disabled={loading}
        />
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Trash2, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  HelpCircle, 
  ChevronRight,
  RefreshCw,
  Terminal,
  Info
} from 'lucide-react';
import { askAssistant, fetchAssistantSuggestions, fetchAiStatus, testAiProvider } from '../services/api';

export default function CivicPulseAssistant({
  incidents = [],
  selectedIncidentId = 'CIV-104',
  onSelectIncident,
  isSevereActive = false,
  isShortageActive = false
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Welcome to **CivicPulse Assistant** — your algorithmic decision-support and explainability layer.\n\nI can explain calculated incident metrics, 4-factor evidence correlations, severity scores, and simulate fleet contingency what-if scenarios.\n\nSelect an incident above or tap any suggested question below to begin.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [testingAi, setTestingAi] = useState(false);
  const [testLatency, setTestLatency] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load dynamic suggested questions when selected incident changes or simulation triggers
  useEffect(() => {
    let isMounted = true;
    async function loadSuggestions() {
      try {
        const res = await fetchAssistantSuggestions(selectedIncidentId);
        if (isMounted && res.success && res.questions) {
          setSuggestedQuestions(res.questions);
        }
      } catch (err) {
        // Fallback default suggestions
        if (isMounted) {
          setSuggestedQuestions([
            `Why is ${selectedIncidentId} critical?`,
            `What caused ${selectedIncidentId}'s severity to increase?`,
            `What evidence is linked to ${selectedIncidentId}?`,
            `Does ${selectedIncidentId} have photo evidence?`,
            `Why was this resource recommended?`,
            `What happens if the Electrical Response Team is unavailable?`,
            `What changed in ${selectedIncidentId}?`
          ]);
        }
      }
    }
    loadSuggestions();
    return () => { isMounted = false; };
  }, [selectedIncidentId, isSevereActive, isShortageActive]);

  // Load AI engine status
  useEffect(() => {
    let isMounted = true;
    fetchAiStatus()
      .then(res => {
        if (isMounted && res.success) {
          setAiStatus(res);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleTestAi = async () => {
    if (testingAi) return;
    setTestingAi(true);
    setTestLatency(null);
    try {
      const active = aiStatus?.activeProvider || 'openai';
      const res = await testAiProvider(active);
      setTestLatency(res.latencyMs);
    } catch {
      setTestLatency('Err');
    } finally {
      setTestingAi(false);
    }
  };

  // Send query to assistant endpoint
  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      const response = await askAssistant(query, selectedIncidentId);

      const assistantMsg = {
        id: `msg-${Date.now()}-asst`,
        sender: 'assistant',
        text: response.answer,
        intent: response.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (response.suggested_questions?.length) {
        setSuggestedQuestions(response.suggested_questions);
      }
    } catch (err) {
      console.error('Assistant error:', err);
      setError(err.message || 'Unable to communicate with CivicPulse Assistant backend.');
      const errorMsg = {
        id: `msg-${Date.now()}-err`,
        sender: 'assistant',
        isError: true,
        text: `⚠️ **Connection Error**: ${err.message || 'Failed to fetch decision-support explanation from backend.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Chat cleared. Ask about **${selectedIncidentId}** or select another incident above.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Find active incident object
  const activeIncident = incidents.find(i => i.id === selectedIncidentId);

  // Clean markdown renderer for bold, italics, lists, and linebreaks
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    const formatInline = (raw) => {
      const parts = raw.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      return parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={partIdx}>{part.slice(1, -1)}</em>;
        }
        return part;
      });
    };

    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();

      // Empty lines as spacing
      if (trimmed === '') {
        return <div key={lineIdx} style={{ height: '8px' }} />;
      }

      // Bullet points
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const cleanContent = trimmed.replace(/^[•\-]\s*/, '');
        return (
          <div key={lineIdx} style={{ paddingLeft: '14px', position: 'relative', margin: '3px 0' }}>
            <span style={{ position: 'absolute', left: '2px', color: '#38bdf8' }}>•</span>
            <span>{formatInline(cleanContent)}</span>
          </div>
        );
      }

      // Numbered lists (e.g. "1. ")
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        return (
          <div key={lineIdx} style={{ paddingLeft: '18px', position: 'relative', margin: '4px 0' }}>
            <span style={{ position: 'absolute', left: '0', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>
              {numMatch[1]}.
            </span>
            <span>{formatInline(numMatch[2])}</span>
          </div>
        );
      }

      return (
        <div key={lineIdx} style={{ margin: '2px 0' }}>
          {formatInline(line)}
        </div>
      );
    });
  };

  return (
    <div className="detail-panel assistant-panel" id="civicpulse-assistant-panel">
      {/* 1. Header with Tactical Branding */}
      <div className="detail-header assistant-header">
        <div className="detail-top-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="assistant-avatar-badge">
              <Bot size={16} color="#38bdf8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="assistant-brand-title">CivicPulse Assistant</span>
                <span className="assistant-round-tag">ROUND 2</span>
              </div>
              <div className="assistant-subtitle">
                Decision support & algorithmic explanation layer
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {aiStatus?.providers?.openai?.configured && (
              <button
                className="ai-status-badge"
                onClick={handleTestAi}
                disabled={testingAi}
                title="Click to test live OpenAI API connection & latency"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  color: '#34d399',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={11} color="#10b981" />
                <span>OpenAI {aiStatus.providers.openai.model}</span>
                {testingAi && <span>...</span>}
                {testLatency && !testingAi && (
                  <span style={{ color: testLatency === 'Err' ? '#ef4444' : '#94a3b8' }}>
                    ({testLatency}{testLatency === 'Err' ? '' : 'ms'})
                  </span>
                )}
              </button>
            )}

            <button 
              className="btn-header"
              onClick={handleClearChat}
              style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--text-muted)' }}
              title="Clear chat history"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Incident Selector Bar */}
        <div className="assistant-selector-strip">
          <span className="selector-label">Target Incident:</span>
          <select 
            className="assistant-incident-select"
            value={selectedIncidentId}
            onChange={(e) => onSelectIncident && onSelectIncident(e.target.value)}
          >
            {incidents.map(inc => (
              <option key={inc.id} value={inc.id}>
                {inc.id} — {inc.priority} ({inc.severity}/100) — {inc.title.slice(0, 32)}...
              </option>
            ))}
          </select>

          {activeIncident && (
            <span className={`assistant-priority-pill ${activeIncident.priority.toLowerCase()}`}>
              {activeIncident.priority} {activeIncident.severity}
            </span>
          )}
        </div>
      </div>

      {/* 2. Suggested Questions Bar */}
      <div className="assistant-suggested-strip">
        <div className="suggested-header">
          <Sparkles size={11} color="#38bdf8" />
          <span>SUGGESTED EXPLANATIONS</span>
        </div>
        <div className="suggested-chips-container">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              className="suggested-chip-btn"
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              title={`Ask: ${q}`}
            >
              <ChevronRight size={11} color="#38bdf8" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Chat Messages Body */}
      <div className="assistant-chat-body">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`chat-bubble-row ${msg.sender === 'user' ? 'bubble-user-row' : 'bubble-assistant-row'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="chat-avatar-assistant">
                <Bot size={13} color="#38bdf8" />
              </div>
            )}

            <div className={`chat-bubble ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'} ${msg.isError ? 'bubble-error' : ''}`}>
              {msg.sender === 'assistant' && (
                <div className="chat-bubble-meta">
                  <span className="meta-tag">CivicPulse Decision Support</span>
                  <span className="meta-time">{msg.timestamp}</span>
                </div>
              )}

              <div className="chat-bubble-content">
                {renderFormattedText(msg.text)}
              </div>

              {msg.sender === 'user' && (
                <div className="chat-bubble-time-user">{msg.timestamp}</div>
              )}
            </div>
          </div>
        ))}

        {/* Loading typing indicator */}
        {loading && (
          <div className="chat-bubble-row bubble-assistant-row">
            <div className="chat-avatar-assistant">
              <Bot size={13} color="#38bdf8" />
            </div>
            <div className="chat-bubble chat-bubble-assistant loading-bubble">
              <div className="loading-radar-text">
                <RefreshCw size={12} className="spin-icon" color="#38bdf8" />
                <span>Evaluating CivicPulse telemetry & engine algorithms...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Chat Input Bar */}
      <div className="assistant-input-tray">
        <div className="input-box-wrapper">
          <input
            type="text"
            className="assistant-text-input"
            placeholder={`Ask about ${selectedIncidentId} severity, evidence, resources, or what-if scenarios...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="assistant-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            title="Send query to CivicPulse Assistant"
          >
            <Send size={14} />
          </button>
        </div>

        <div className="assistant-disclaimer-footer">
          <Info size={10} color="var(--text-muted)" />
          <span>Decision support only. Explains calculated CivicPulse metrics. Does not execute emergency dispatch.</span>
        </div>
      </div>
    </div>
  );
}

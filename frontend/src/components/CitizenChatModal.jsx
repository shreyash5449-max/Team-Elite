import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  Shield, 
  Check, 
  CheckCheck, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  RefreshCw,
  Lock,
  UserCheck
} from 'lucide-react';
import { 
  getOrCreateConversationForReport, 
  fetchChatMessages, 
  sendChatMessage, 
  markChatConversationAsRead,
  uploadChatAttachment 
} from '../services/api';

export default function CitizenChatModal({
  isOpen,
  onClose,
  report,
  citizenId = 'citizen-current',
  citizenName = 'Citizen Submitter'
}) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollTimerRef = useRef(null);

  const reportId = report?.report_id || report?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize or fetch conversation when modal opens
  useEffect(() => {
    if (!isOpen || !reportId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function initChat() {
      try {
        const convRes = await getOrCreateConversationForReport(reportId, 'citizen', citizenId);
        if (!isMounted) return;
        setConversation(convRes.conversation);

        const msgRes = await fetchChatMessages(convRes.conversation.id, 'citizen', citizenId);
        if (!isMounted) return;
        setMessages(msgRes.messages || []);

        // Mark as read
        await markChatConversationAsRead(convRes.conversation.id, 'citizen', citizenId);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initChat();

    // Start real-time polling every 2.5s
    pollTimerRef.current = setInterval(async () => {
      if (!reportId) return;
      try {
        const convRes = await getOrCreateConversationForReport(reportId, 'citizen', citizenId);
        if (!isMounted) return;
        setConversation(convRes.conversation);

        const msgRes = await fetchChatMessages(convRes.conversation.id, 'citizen', citizenId);
        if (!isMounted) return;

        setMessages(prev => {
          if ((msgRes.messages || []).length !== prev.length) {
            // New message arrived, mark as read
            markChatConversationAsRead(convRes.conversation.id, 'citizen', citizenId).catch(() => {});
            return msgRes.messages;
          }
          return prev;
        });
      } catch {
        // Silently retry on next poll
      }
    }, 2500);

    return () => {
      isMounted = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, reportId, citizenId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen || !report) return null;

  // Handle file attachment selection
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Selected file exceeds the maximum limit of 5MB.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await uploadChatAttachment(reader.result, file.name, file.type);
          setAttachment(res.attachment);
        } catch (err) {
          alert(`Attachment upload failed: ${err.message}`);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert(err.message);
      setUploading(false);
    }
  };

  // Handle sending a message
  const handleSend = async (e) => {
    e?.preventDefault();
    const textToSend = inputText.trim();
    if ((!textToSend && !attachment) || sending || !conversation) return;

    setSending(true);
    setError(null);

    try {
      const res = await sendChatMessage(conversation.id, {
        text: textToSend,
        attachment,
        senderName: citizenName,
        role: 'citizen',
        userId: citizenId
      });

      setMessages(prev => [...prev, res.message]);
      setInputText('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const authority = conversation ? {
    name: conversation.authority_name,
    department: conversation.authority_dept,
    role: conversation.authority_role,
    status: conversation.authority_status || 'online',
    avatar: conversation.authority_avatar || 'OF'
  } : null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 3000 }}>
      <div 
        className="modal-content citizen-chat-modal" 
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '95%',
          height: '85vh',
          maxHeight: '750px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: '#090e1a',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.15)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        {/* 1. Modal Top Bar */}
        <div style={{
          background: '#0e172a',
          padding: '12px 18px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {authority ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Authority Avatar with Live Beacon */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: '0 0 10px rgba(2, 132, 199, 0.4)'
                }}>
                  {authority.avatar}
                </div>
                <span style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: authority.status === 'online' ? '#10b981' : '#f59e0b',
                  border: '2px solid #0e172a'
                }} title={`Authority is ${authority.status}`} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '14px' }}>
                    {authority.name}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontWeight: 600
                  }}>
                    Assigned Authority
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                  {authority.department} • {authority.role}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#f8fafc', fontWeight: 700 }}>Connecting to Assigned Authority...</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <Lock size={12} />
              <span>Private 1-to-1 Channel</span>
            </div>

            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close Chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. Complaint Context Strip */}
        <div style={{
          background: '#131e36',
          padding: '8px 18px',
          borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <span style={{ 
              fontWeight: 800, 
              color: '#38bdf8', 
              fontFamily: 'var(--font-mono)',
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {reportId}
            </span>
            <span style={{ color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '380px' }}>
              {report.description}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>Status:</span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px',
              background: conversation?.complaint_status === 'Resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: conversation?.complaint_status === 'Resolved' ? '#10b981' : '#f59e0b',
              border: '1px solid currentColor'
            }}>
              {conversation?.complaint_status || report.status || 'Under Review'}
            </span>
          </div>
        </div>

        {/* 3. Messages Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(14, 23, 42, 0.7) 0%, rgba(9, 14, 26, 0.95) 100%)'
        }}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px', fontSize: '13px' }}>
              <RefreshCw size={20} className="spinning" style={{ display: 'block', margin: '0 auto 8px' }} />
              Connecting secure 1-to-1 channel with {authority?.name || 'Authority'}...
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#64748b', marginTop: '50px' }}>
              <UserCheck size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
                Private Conversation Started
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Send your first message or share complaint photos with {authority?.name}.
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isCitizen = msg.sender_role === 'citizen';
            const isSystem = msg.sender_role === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} style={{
                  textAlign: 'center',
                  margin: '6px 0',
                  fontSize: '11px',
                  color: '#94a3b8',
                  background: 'rgba(30, 41, 59, 0.6)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  alignSelf: 'center',
                  border: '1px solid rgba(51, 65, 85, 0.4)'
                }}>
                  {msg.text}
                </div>
              );
            }

            return (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isCitizen ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  alignSelf: isCitizen ? 'flex-end' : 'flex-start'
                }}
              >
                {/* Sender badge for authority */}
                {!isCitizen && (
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, marginBottom: '2px', marginLeft: '4px' }}>
                    {msg.sender_name} • <span style={{ color: '#64748b', fontWeight: 400 }}>{authority?.department}</span>
                  </div>
                )}

                {/* Message Bubble */}
                <div style={{
                  background: isCitizen 
                    ? 'linear-gradient(135deg, #0284c7, #0369a1)' 
                    : '#1e293b',
                  color: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius: isCitizen ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  fontSize: '13px',
                  lineHeight: '1.45',
                  boxShadow: isCitizen ? '0 2px 8px rgba(2, 132, 199, 0.3)' : '0 2px 6px rgba(0,0,0,0.3)',
                  border: isCitizen ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(51, 65, 85, 0.6)'
                }}>
                  {msg.text}

                  {/* Attachment Container */}
                  {msg.attachment && (
                    <div style={{ marginTop: '8px' }}>
                      {msg.attachment.type?.startsWith('image/') ? (
                        <div 
                          onClick={() => setPreviewImage(msg.attachment.url)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.2)',
                            maxHeight: '180px'
                          }}
                        >
                          <img 
                            src={msg.attachment.url} 
                            alt={msg.attachment.name}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                          />
                        </div>
                      ) : (
                        <a 
                          href={msg.attachment.url} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(0,0,0,0.25)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            color: '#38bdf8',
                            textDecoration: 'none',
                            fontSize: '12px'
                          }}
                        >
                          <FileText size={16} />
                          <span style={{ textDecoration: 'underline' }}>{msg.attachment.name}</span>
                          <Download size={12} style={{ marginLeft: 'auto' }} />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamp & Read Receipt */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  color: '#64748b',
                  marginTop: '3px',
                  marginRight: isCitizen ? '4px' : '0',
                  marginLeft: !isCitizen ? '4px' : '0'
                }}>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isCitizen && (
                    <span>
                      {msg.read ? (
                        <span title={`Read by authority at ${msg.read_at ? new Date(msg.read_at).toLocaleTimeString() : ''}`} style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }}>
                          <CheckCheck size={13} />
                        </span>
                      ) : (
                        <span title="Delivered to municipal dispatch" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                          <Check size={12} />
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* 4. Attachment Staging Preview (if file selected) */}
        {attachment && (
          <div style={{
            background: '#1e293b',
            padding: '6px 14px',
            borderTop: '1px solid rgba(51, 65, 85, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={15} color="#38bdf8" />
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{attachment.name}</span>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                ({(attachment.size_bytes / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button 
              onClick={() => {
                setAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
              title="Remove attachment"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 5. Message Input Bar */}
        <form onSubmit={handleSend} style={{
          background: '#0e172a',
          padding: '12px 16px',
          borderTop: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {/* File Upload Input */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt,.doc,.docx"
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '8px',
              color: '#38bdf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Attach Complaint Photo or Document (Max 5MB)"
          >
            <Paperclip size={16} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Message ${authority?.name || 'Assigned Officer'}...`}
            disabled={sending || loading}
            style={{
              flex: 1,
              background: '#1e293b',
              border: '1px solid rgba(51, 65, 85, 0.8)',
              borderRadius: '8px',
              padding: '9px 14px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !attachment) || sending || uploading}
            style={{
              background: (inputText.trim() || attachment) ? '#0284c7' : '#334155',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: (inputText.trim() || attachment) ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {sending ? <RefreshCw size={14} className="spinning" /> : <Send size={14} />}
            <span>Send</span>
          </button>
        </form>

        {/* Modal Full Image Preview */}
        {previewImage && (
          <div 
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3500
            }}
          >
            <img 
              src={previewImage} 
              alt="Enlarged evidence" 
              style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

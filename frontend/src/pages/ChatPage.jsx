import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  Check, 
  Search,
  MessageSquare,
  PlusCircle,
  Building2
} from 'lucide-react';
import { 
  fetchConversations, 
  getOrCreateConversationForReport, 
  fetchChatMessages, 
  sendChatMessage, 
  markChatConversationAsRead, 
  uploadChatAttachment 
} from '../services/api';
import { getFriendlyLocationName } from '../utils/geoUtils';

export default function ChatPage({
  reports = [],
  myReportIds = [],
  initialReport = null,
  currentUser = { name: 'Dhruva Supali', role: 'citizen' },
  onNavigate
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Attachment upload
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [attachmentData, setAttachmentData] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 1. Load active conversations
  const loadConversations = async (preferredReportId = null) => {
    setLoadingConv(true);
    try {
      const res = await fetchConversations({
        role: currentUser.role,
        userId: currentUser.role === 'authority' ? 'authority-current' : 'citizen-current'
      });
      const convList = res.conversations || [];
      setConversations(convList);

      // If a specific report was requested or initialReport exists
      const targetRepId = preferredReportId || initialReport?.report_id || initialReport?.id || myReportIds[0];
      
      let matched = convList.find(c => c.report_id === targetRepId);
      if (!matched && targetRepId) {
        // Initialize conversation for this report
        try {
          const initRes = await getOrCreateConversationForReport(
            targetRepId, 
            currentUser.role, 
            currentUser.role === 'authority' ? 'authority-current' : 'citizen-current'
          );
          if (initRes.conversation) {
            matched = initRes.conversation;
            convList.unshift(matched);
            setConversations([...convList]);
          }
        } catch {
          // ignore creation fallback
        }
      }

      const active = matched || convList[0] || null;
      setSelectedConversation(active);
    } catch (err) {
      setError(err.message || 'Failed to load conversations.');
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    loadConversations(initialReport?.report_id || initialReport?.id);
  }, [currentUser.role, initialReport]);

  // 2. Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    const loadMsg = async () => {
      setLoadingMessages(true);
      try {
        const res = await fetchChatMessages(
          selectedConversation.id,
          currentUser.role,
          currentUser.role === 'authority' ? 'authority-current' : 'citizen-current'
        );
        if (isMounted) {
          setMessages(res.messages || []);
          markChatConversationAsRead(
            selectedConversation.id,
            currentUser.role,
            currentUser.role === 'authority' ? 'authority-current' : 'citizen-current'
          ).catch(() => {});
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    loadMsg();
    const interval = setInterval(loadMsg, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedConversation, currentUser.role]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle attachment selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds maximum allowed 5 MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentPreview(reader.result);
      setAttachmentData({
        data: reader.result,
        name: file.name,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !attachmentData) return;
    if (!selectedConversation) return;

    setSending(true);
    setError(null);

    try {
      let attachmentUrl = null;
      if (attachmentData) {
        const uploadRes = await uploadChatAttachment(
          attachmentData.data,
          attachmentData.name,
          attachmentData.type
        );
        attachmentUrl = uploadRes.attachment_url;
      }

      const res = await sendChatMessage(selectedConversation.id, {
        text: inputText.trim(),
        attachment: attachmentUrl,
        senderName: currentUser.name,
        role: currentUser.role,
        userId: currentUser.role === 'authority' ? 'authority-current' : 'citizen-current'
      });

      if (res.message) {
        setMessages(prev => [...prev, res.message]);
      }

      setInputText('');
      setAttachmentPreview(null);
      setAttachmentData(null);
    } catch (err) {
      setError(err.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const activeAuthority = selectedConversation?.assigned_authority || {
    name: 'Officer Rajesh Deshmukh',
    designation: 'Senior Assistant Engineer',
    department: 'Water & Sanitation Division',
    status: 'ONLINE'
  };

  const activeReport = selectedConversation?.complaint_details || reports.find(r => (r.report_id || r.id) === selectedConversation?.report_id) || {
    id: selectedConversation?.report_id || 'R-101',
    category: 'Water & Sanitation',
    status: 'In Progress',
    description: 'Civic grievance under official inspection'
  };

  return (
    <div className="chat-page site-container" id="chat-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <span className="section-label">Direct Municipal Communication</span>
          <h1 className="page-title">Chat with Authority</h1>
          <p className="page-subtitle">
            Private 1-to-1 messaging between you and the designated municipal officer managing your complaint.
          </p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="chat-interface-wrapper">
        {/* Left Column: Conversations List */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <strong>My Conversations ({conversations.length})</strong>
          </div>

          <div className="conversations-list">
            {loadingConv && conversations.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={20} className="spin-icon" style={{ margin: '0 auto' }} />
                <span style={{ fontSize: '12px', marginTop: '6px', display: 'block' }}>Loading chats...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                <MessageSquare size={24} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                <div>No active chat threads yet.</div>
                <button
                  type="button"
                  className="btn-create-chat"
                  onClick={() => onNavigate('my-complaints')}
                >
                  Start from My Complaints
                </button>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConversation?.id === c.id;
                const rep = c.complaint_details || {};
                const auth = c.assigned_authority || {};
                return (
                  <div
                    key={c.id}
                    className={`conversation-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedConversation(c)}
                  >
                    <div className="conv-item-top">
                      <strong className="conv-id">#{c.report_id}</strong>
                      <span className="conv-time">
                        {c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                    </div>

                    <div className="conv-officer">
                      <Building2 size={12} color="#0284c7" />
                      <span>{auth.name || 'Municipal Officer'}</span>
                    </div>

                    <div className="conv-snippet">
                      {c.last_message || rep.description || 'Tap to start conversation'}
                    </div>

                    {c.unread_count > 0 && (
                      <span className="conv-unread-pill">{c.unread_count}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Stream & Input Tray */}
        <div className="chat-main-pane">
          {selectedConversation ? (
            <>
              {/* Chat Top Banner */}
              <div className="chat-officer-banner">
                <div className="officer-profile-row">
                  <div className="officer-avatar-box">
                    <span>👮</span>
                    <span className="online-indicator"></span>
                  </div>

                  <div className="officer-details">
                    <div className="officer-name-row">
                      <h4 className="officer-name">{activeAuthority.name}</h4>
                      <span className="officer-verified-badge">
                        <ShieldCheck size={13} color="#0284c7" />
                        Verified Officer
                      </span>
                    </div>
                    <div className="officer-dept">
                      {activeAuthority.designation} • {activeAuthority.department}
                    </div>
                  </div>
                </div>

                {/* Linked Complaint Ref Tag */}
                <div className="chat-linked-complaint-tag">
                  <span className="linked-label">Complaint:</span>
                  <strong>#{selectedConversation.report_id}</strong>
                  <span className="linked-status-pill">{activeReport.status || 'Active'}</span>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="chat-messages-container">
                {loadingMessages && messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto' }} />
                    <span style={{ fontSize: '12px', marginTop: '6px', display: 'block' }}>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-welcome-box">
                    <div className="welcome-icon">💬</div>
                    <h4>Private Conversation Initialized</h4>
                    <p>
                      You are now connected with {activeAuthority.name} regarding complaint #{selectedConversation.report_id}. 
                      Share details, follow up on repairs, or attach photographic updates below.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_role === currentUser.role;
                    const timeStr = msg.timestamp 
                      ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div 
                        key={msg.id} 
                        className={`chat-bubble-wrapper ${isMe ? 'outgoing' : 'incoming'}`}
                      >
                        <div className="chat-bubble">
                          <div className="bubble-sender-name">
                            {msg.sender_name || (isMe ? 'You' : activeAuthority.name)}
                          </div>

                          <div className="bubble-text">
                            {msg.text}
                          </div>

                          {msg.attachment && (
                            <div className="bubble-attachment">
                              <img 
                                src={msg.attachment} 
                                alt="Attachment" 
                                className="attachment-img"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          )}

                          <div className="bubble-time-row">
                            <span>{timeStr}</span>
                            {isMe && <Check size={12} color="#0284c7" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Preview (if any) */}
              {attachmentPreview && (
                <div className="chat-attachment-preview-tray">
                  <img src={attachmentPreview} alt="Upload preview" className="tray-img" />
                  <span style={{ fontSize: '11px', color: '#334155' }}>{attachmentData?.name}</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setAttachmentPreview(null);
                      setAttachmentData(null);
                    }}
                    className="btn-remove-tray-img"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Input Tray */}
              <form onSubmit={handleSendMessage} className="chat-input-tray">
                <button
                  type="button"
                  className="btn-chat-attach"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach photo or document"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <input
                  type="text"
                  placeholder="Type your message to the assigned officer..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="chat-text-input"
                />

                <button
                  type="submit"
                  disabled={sending || (!inputText.trim() && !attachmentData)}
                  className="btn-chat-send"
                >
                  {sending ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-select-prompt">
              <MessageSquare size={36} color="#94a3b8" />
              <h4>Select a Conversation</h4>
              <p>Choose an ongoing issue on the left or select an issue from My Complaints.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

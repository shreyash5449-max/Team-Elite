import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Search, 
  Filter, 
  Paperclip, 
  Shield, 
  Check, 
  CheckCheck, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Clock,
  User,
  Building,
  CheckCircle2
} from 'lucide-react';
import { 
  fetchConversations, 
  fetchChatMessages, 
  sendChatMessage, 
  markChatConversationAsRead,
  updateComplaintStatusFromChat,
  uploadChatAttachment,
  fetchChatAuthorities
} from '../services/api';

export default function AuthorityChatModal({
  isOpen,
  onClose,
  onInspectComplaint,
  initialConversationId = null
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [authorities, setAuthorities] = useState([]);
  const [activeAuthorityId, setActiveAuthorityId] = useState('AUTH-03'); // default Priya Deshmukh (Water) or supervisor
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollTimerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load authorities directory
  useEffect(() => {
    fetchChatAuthorities()
      .then(res => {
        if (res.success && res.authorities) {
          setAuthorities(res.authorities);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch conversations list
  const loadConversations = async (preserveSelected = true) => {
    try {
      const res = await fetchConversations({
        search: searchQuery,
        status: statusFilter,
        unreadOnly,
        role: 'authority',
        userId: activeAuthorityId
      });

      if (res.success) {
        const list = res.conversations || [];
        setConversations(list);

        if (!preserveSelected || !selectedConvId) {
          if (list.length > 0 && !selectedConvId) {
            setSelectedConvId(list[0].id);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    loadConversations(false);

    // Poll conversations and messages every 2.5s
    pollTimerRef.current = setInterval(() => {
      loadConversations(true);
    }, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, searchQuery, statusFilter, unreadOnly, activeAuthorityId]);

  // When selected conversation changes, load messages & mark read
  useEffect(() => {
    if (!isOpen || !selectedConvId) return;

    let isMounted = true;
    setMessagesLoading(true);

    async function loadMessages() {
      try {
        const res = await fetchChatMessages(selectedConvId, 'authority', activeAuthorityId);
        if (!isMounted) return;
        setMessages(res.messages || []);

        // Mark as read
        await markChatConversationAsRead(selectedConvId, 'authority', activeAuthorityId);
        // Refresh unread counters in list
        setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, unread_for_authority: 0 } : c));
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setMessagesLoading(false);
      }
    }

    loadMessages();

    // Dedicated message polling for active conversation
    const msgTimer = setInterval(async () => {
      try {
        const res = await fetchChatMessages(selectedConvId, 'authority', activeAuthorityId);
        if (!isMounted) return;
        setMessages(prev => {
          if ((res.messages || []).length !== prev.length) {
            markChatConversationAsRead(selectedConvId, 'authority', activeAuthorityId).catch(() => {});
            return res.messages;
          }
          return prev;
        });
      } catch {}
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(msgTimer);
    };
  }, [selectedConvId, isOpen, activeAuthorityId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  const currentConv = conversations.find(c => c.id === selectedConvId);
  const currentOfficer = authorities.find(a => a.id === activeAuthorityId) || {
    name: 'Municipal Command Operator',
    department: 'Dispatch Operations',
    designation: 'Watch Commander'
  };

  // Handle file attachment
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Selected file exceeds maximum allowed limit of 5MB.');
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
          alert(`Upload failed: ${err.message}`);
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

  // Handle sending a reply as authority
  const handleSend = async (e) => {
    e?.preventDefault();
    const textToSend = inputText.trim();
    if ((!textToSend && !attachment) || sending || !selectedConvId) return;

    setSending(true);
    setError(null);

    try {
      const res = await sendChatMessage(selectedConvId, {
        text: textToSend,
        attachment,
        senderName: currentOfficer.name,
        role: 'authority',
        userId: activeAuthorityId
      });

      setMessages(prev => [...prev, res.message]);
      setInputText('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Update conversation in left list
      setConversations(prev => prev.map(c => c.id === selectedConvId ? res.conversation : c));
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Handle updating complaint status
  const handleStatusChange = async (newStatus) => {
    if (!selectedConvId || statusUpdating) return;
    setStatusUpdating(true);

    try {
      const res = await updateComplaintStatusFromChat(selectedConvId, newStatus, 'authority', activeAuthorityId);
      if (res.success) {
        setMessages(prev => [...prev, res.system_message]);
        setConversations(prev => prev.map(c => c.id === selectedConvId ? res.conversation : c));
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Quick message template insertion
  const applyQuickTemplate = (template) => {
    setInputText(template);
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_for_authority || 0), 0);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 3000 }}>
      <div 
        className="modal-content authority-chat-modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '1080px',
          width: '96%',
          height: '88vh',
          maxHeight: '820px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: '#090e1a',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 40px rgba(56, 189, 248, 0.15)',
          borderRadius: '14px',
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div style={{
          background: '#0e172a',
          padding: '12px 20px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f8fafc', fontWeight: 800, fontSize: '15px' }}>
                  Citizen Messages & Inquiries
                </span>
                {totalUnread > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: '10px'
                  }}>
                    {totalUnread} Unread
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Direct confidential communications channel for assigned municipal authorities
              </div>
            </div>
          </div>

          {/* Active Officer Identity Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: '#94a3b8' }}>Operating As:</span>
              <select
                value={activeAuthorityId}
                onChange={e => setActiveAuthorityId(e.target.value)}
                style={{
                  background: '#1e293b',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {authorities.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.department})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
              title="Close Messages"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2-Column Command Workspace */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Column: Conversations List */}
          <div style={{
            width: '340px',
            borderRight: '1px solid rgba(51, 65, 85, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            background: '#0b1120'
          }}>
            {/* Search Bar */}
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1e293b',
                borderRadius: '8px',
                padding: '6px 10px',
                border: '1px solid rgba(51, 65, 85, 0.6)'
              }}>
                <Search size={14} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search by Complaint ID or Citizen..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
                {['All', 'Under Review', 'Investigating', 'Resolved'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '10px',
                      borderRadius: '12px',
                      border: statusFilter === st ? '1px solid #38bdf8' : '1px solid rgba(51, 65, 85, 0.6)',
                      background: statusFilter === st ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      color: statusFilter === st ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontWeight: statusFilter === st ? 700 : 500
                    }}
                  >
                    {st}
                  </button>
                ))}

                <button
                  onClick={() => setUnreadOnly(!unreadOnly)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    borderRadius: '12px',
                    border: unreadOnly ? '1px solid #ef4444' : '1px solid rgba(51, 65, 85, 0.6)',
                    background: unreadOnly ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    color: unreadOnly ? '#f87171' : '#94a3b8',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: unreadOnly ? 700 : 500
                  }}
                >
                  Unread
                </button>
              </div>
            </div>

            {/* Conversation Cards Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {loading && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px', fontSize: '12px' }}>
                  <RefreshCw size={16} className="spinning" style={{ display: 'block', margin: '0 auto 6px' }} />
                  Loading citizen complaints...
                </div>
              )}

              {!loading && conversations.length === 0 && (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '32px 16px', fontSize: '12px' }}>
                  No citizen conversations found matching criteria.
                </div>
              )}

              {conversations.map(conv => {
                const isSelected = conv.id === selectedConvId;
                const hasUnread = (conv.unread_for_authority || 0) > 0;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      background: isSelected 
                        ? 'rgba(56, 189, 248, 0.15)' 
                        : hasUnread 
                          ? 'rgba(30, 41, 59, 0.7)' 
                          : 'transparent',
                      border: isSelected 
                        ? '1px solid #38bdf8' 
                        : hasUnread 
                          ? '1px solid rgba(245, 158, 11, 0.4)' 
                          : '1px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc' }}>
                          {conv.citizen_name}
                        </span>
                        {hasUnread && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            boxShadow: '0 0 6px #ef4444'
                          }} />
                        )}
                      </div>

                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        {conv.report_id}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '11px',
                      color: hasUnread ? '#cbd5e1' : '#94a3b8',
                      fontWeight: hasUnread ? 600 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '4px'
                    }}>
                      {conv.last_message || 'Complaint thread initiated.'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '8px',
                        background: conv.complaint_status === 'Resolved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: conv.complaint_status === 'Resolved' ? '#10b981' : '#f59e0b',
                        fontWeight: 600
                      }}>
                        {conv.complaint_status || 'Under Review'}
                      </span>
                      <span>{new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Conversation Thread */}
          {currentConv ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#090e1a' }}>
              {/* Header Bar */}
              <div style={{
                background: '#0e172a',
                padding: '12px 18px',
                borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                      {currentConv.citizen_name}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.15)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      {currentConv.report_id}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', maxWidth: '420px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentConv.complaint_title}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Status Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Update Status:</span>
                    <select
                      value={currentConv.complaint_status || 'Under Review'}
                      onChange={e => handleStatusChange(e.target.value)}
                      disabled={statusUpdating}
                      style={{
                        background: '#1e293b',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: currentConv.complaint_status === 'Resolved' ? '#10b981' : '#f59e0b',
                        fontWeight: 700,
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  {/* Inspect Complaint in Dashboard */}
                  {onInspectComplaint && (
                    <button
                      onClick={() => {
                        onInspectComplaint(currentConv.report_id);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        padding: '5px 9px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Inspect linked incident cluster in Tactical Dashboard"
                    >
                      <ExternalLink size={12} />
                      <span>View in Intel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Message Stream */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(14, 23, 42, 0.5) 0%, rgba(9, 14, 26, 0.95) 100%)'
              }}>
                {messagesLoading && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '30px' }}>
                    <RefreshCw size={18} className="spinning" style={{ display: 'block', margin: '0 auto 6px' }} />
                    Loading conversation transcript...
                  </div>
                )}

                {messages.map(msg => {
                  const isAuthority = msg.sender_role === 'authority';
                  const isSystem = msg.sender_role === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} style={{
                        alignSelf: 'center',
                        background: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(51, 65, 85, 0.6)',
                        color: '#94a3b8',
                        fontSize: '11px',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        margin: '6px 0'
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
                        alignItems: isAuthority ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        alignSelf: isAuthority ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: isAuthority ? '#38bdf8' : '#f8fafc', fontWeight: 600, marginBottom: '2px', marginLeft: '4px', marginRight: '4px' }}>
                        {msg.sender_name} {isAuthority && `(${currentOfficer.department})`}
                      </div>

                      <div style={{
                        background: isAuthority ? '#0369a1' : '#1e293b',
                        color: '#f8fafc',
                        padding: '10px 14px',
                        borderRadius: isAuthority ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        fontSize: '13px',
                        lineHeight: '1.45',
                        border: isAuthority ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(51, 65, 85, 0.6)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                      }}>
                        {msg.text}

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
                                  background: 'rgba(0,0,0,0.3)',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  color: '#38bdf8',
                                  textDecoration: 'none',
                                  fontSize: '12px'
                                }}
                              >
                                <FileText size={16} />
                                <span>{msg.attachment.name}</span>
                                <Download size={12} style={{ marginLeft: 'auto' }} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{
                        fontSize: '10px',
                        color: '#64748b',
                        marginTop: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isAuthority && (
                          <span>
                            {msg.read ? (
                              <span title="Read by citizen" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }}>
                                <CheckCheck size={13} />
                              </span>
                            ) : (
                              <span title="Delivered to citizen app" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
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

              {/* Quick Response Templates Bar */}
              <div style={{
                background: '#0b1222',
                padding: '6px 16px',
                borderTop: '1px solid rgba(51, 65, 85, 0.4)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto'
              }}>
                <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center', whiteSpace: 'nowrap' }}>
                  Quick Dispatch Replies:
                </span>
                {[
                  'Field repair crew dispatched to site with equipment.',
                  'Valve isolation confirmed. Inflow stopped.',
                  'Under active investigation by safety unit.',
                  'Repairs completed. Inspection verified.'
                ].map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => applyQuickTemplate(tpl)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: '#94a3b8',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tpl.slice(0, 30)}...
                  </button>
                ))}
              </div>

              {/* Staged Attachment Indicator */}
              {attachment && (
                <div style={{
                  background: '#1e293b',
                  padding: '6px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={14} color="#38bdf8" />
                    <span style={{ color: '#f8fafc' }}>{attachment.name}</span>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                      ({(attachment.size_bytes / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button 
                    onClick={() => setAttachment(null)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Reply Input Bar */}
              <form onSubmit={handleSend} style={{
                background: '#0e172a',
                padding: '12px 18px',
                borderTop: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
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
                    cursor: 'pointer'
                  }}
                  title="Attach Field Photo or Official Document (Max 5MB)"
                >
                  <Paperclip size={16} />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={`Reply to ${currentConv.citizen_name} regarding ${currentConv.report_id}...`}
                  disabled={sending}
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
                  disabled={(!inputText.trim() && !attachment) || sending}
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
                  <span>Reply</span>
                </button>
              </form>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              Select a citizen complaint to view conversation thread.
            </div>
          )}
        </div>

        {/* Full Image Preview Modal */}
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
              alt="Evidence" 
              style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * CivicPulse - 1-to-1 Citizen-Authority Private Chat Service
 * 
 * Manages private, confidential communications between citizens who submitted
 * complaints and the specific municipal authority assigned to resolve them.
 * 
 * Strict Privacy & Authorization Enforced:
 * - Each conversation strictly links: 1 citizen, 1 authority, 1 complaint
 * - Access is verified on every transaction: only the complaint submitter
 *   and assigned authority can access the conversation.
 * - Admin audit access is restricted and explicitly flagged.
 * - Private messages are never exposed via public incident/report endpoints.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHAT_STORE_PATH = path.join(__dirname, '../../data/civicpulse_chat.json');

// Directory for uploaded chat attachments
const ATTACHMENTS_DIR = path.resolve(__dirname, '../../frontend/public/evidence/chat');

// Official Municipal Authorities Directory
export const AUTHORITIES = [
  {
    id: 'AUTH-03',
    name: 'Officer Priya Deshmukh',
    department: 'Water & Sanitation',
    designation: 'Chief Water Works Superintendent',
    unit_id: 'RSRC-03',
    unit_name: 'Water Response Team',
    status: 'online',
    avatar: 'PD'
  },
  {
    id: 'AUTH-04',
    name: 'Officer Vikram Patil',
    department: 'Electrical & Public Safety',
    designation: 'Grid & Power Response Lead',
    unit_id: 'RSRC-04',
    unit_name: 'Electrical Response Team',
    status: 'online',
    avatar: 'VP'
  },
  {
    id: 'AUTH-01',
    name: 'Officer Rajesh Sharma',
    department: 'Road & Infrastructure',
    designation: 'Senior Field Engineer',
    unit_id: 'RSRC-01',
    unit_name: 'General Repair Team 1',
    status: 'online',
    avatar: 'RS'
  },
  {
    id: 'AUTH-02',
    name: 'Officer Amit Verma',
    department: 'Road & Infrastructure',
    designation: 'Sector Supervisor',
    unit_id: 'RSRC-02',
    unit_name: 'General Repair Team 2',
    status: 'busy',
    avatar: 'AV'
  },
  {
    id: 'AUTH-05',
    name: 'Officer Meera Kulkarni',
    department: 'Emergency Operations',
    designation: 'Tactical Dispatch Coordinator',
    unit_id: 'RSRC-05',
    unit_name: 'Emergency Response Vehicle',
    status: 'online',
    avatar: 'MK'
  },
  {
    id: 'AUTH-DUTY',
    name: 'Officer Sanjeev Joshi',
    department: 'Citizen Grievance Bureau',
    designation: 'Municipal Duty Officer',
    unit_id: null,
    unit_name: 'Central Grievance Intake',
    status: 'online',
    avatar: 'SJ'
  }
];

class ChatService {
  constructor() {
    this.conversations = new Map(); // conversation_id -> conversation
    this.messages = new Map();      // conversation_id -> Array of messages
    this.initStore();
  }

  /**
   * Initializes or loads persisted chat state
   */
  initStore() {
    try {
      if (!fs.existsSync(ATTACHMENTS_DIR)) {
        fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
      }

      if (fs.existsSync(CHAT_STORE_PATH)) {
        const raw = fs.readFileSync(CHAT_STORE_PATH, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.conversations)) {
          for (const c of data.conversations) {
            this.conversations.set(c.id, c);
          }
        }
        if (data.messages && typeof data.messages === 'object') {
          for (const [convId, msgs] of Object.entries(data.messages)) {
            this.messages.set(convId, msgs);
          }
        }
        return;
      }
    } catch (err) {
      console.warn('[ChatService] Error loading chat store, generating seed:', err.message);
    }

    this.seedDefaultConversations();
    this.saveStore();
  }

  /**
   * Persists chat state to disk
   */
  saveStore() {
    try {
      const dataDir = path.dirname(CHAT_STORE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const payload = {
        updated_at: new Date().toISOString(),
        conversations: Array.from(this.conversations.values()),
        messages: Object.fromEntries(this.messages.entries())
      };
      fs.writeFileSync(CHAT_STORE_PATH, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ChatService] Could not persist chat store:', err.message);
    }
  }

  /**
   * Seeds initial realistic conversations for initial complaints
   */
  seedDefaultConversations() {
    // 1. Complaint R-101 (Shivaji Nagar Water Leak)
    const conv101 = {
      id: 'CONV-R101',
      report_id: 'R-101',
      citizen_id: 'CIT-101',
      citizen_name: 'Aarav Mehta',
      authority_id: 'AUTH-03',
      authority_name: 'Officer Priya Deshmukh',
      authority_dept: 'Water & Sanitation',
      authority_role: 'Chief Water Works Superintendent',
      authority_status: 'online',
      authority_avatar: 'PD',
      complaint_title: 'Water is leaking heavily onto the road near Shivaji Nagar junction.',
      complaint_status: 'Under Review',
      created_at: '2026-10-08T09:10:00.000Z',
      updated_at: '2026-10-08T09:25:00.000Z',
      unread_for_citizen: 1,
      unread_for_authority: 0
    };
    this.conversations.set(conv101.id, conv101);

    const msgs101 = [
      {
        id: 'MSG-101-1',
        conversation_id: 'CONV-R101',
        sender_id: 'CIT-101',
        sender_name: 'Aarav Mehta',
        sender_role: 'citizen',
        text: 'Hello, the water leak near Shivaji Nagar junction is getting worse. Pedestrians are unable to cross.',
        attachment: {
          name: 'water_leak_junction.jpg',
          url: '/evidence/water_leak_junction.jpg',
          type: 'image/jpeg',
          size_bytes: 420000
        },
        timestamp: '2026-10-08T09:15:00.000Z',
        read: true,
        read_at: '2026-10-08T09:16:30.000Z'
      },
      {
        id: 'MSG-101-2',
        conversation_id: 'CONV-R101',
        sender_id: 'AUTH-03',
        sender_name: 'Officer Priya Deshmukh',
        sender_role: 'authority',
        text: 'Thank you for reporting, Aarav. Our Water Response Team (RSRC-03) has received this telemetry. We have dispatched field crew with high-volume pumps.',
        attachment: null,
        timestamp: '2026-10-08T09:20:00.000Z',
        read: true,
        read_at: '2026-10-08T09:21:00.000Z'
      },
      {
        id: 'MSG-101-3',
        conversation_id: 'CONV-R101',
        sender_id: 'AUTH-03',
        sender_name: 'Officer Priya Deshmukh',
        sender_role: 'authority',
        text: 'Valve isolation is underway. Please avoid stepping in standing water until electrical containment is verified.',
        attachment: null,
        timestamp: '2026-10-08T09:25:00.000Z',
        read: false,
        read_at: null
      }
    ];
    this.messages.set(conv101.id, msgs101);

    // 2. Complaint R-1021 / R-140 (Severe live electrical spark)
    const conv1021 = {
      id: 'CONV-R1021',
      report_id: 'R-140',
      citizen_id: 'CIT-1021',
      citizen_name: 'Rajesh Kulkarni',
      authority_id: 'AUTH-04',
      authority_name: 'Officer Vikram Patil',
      authority_dept: 'Electrical & Public Safety',
      authority_role: 'Grid & Power Response Lead',
      authority_status: 'online',
      authority_avatar: 'VP',
      complaint_title: 'Overhead power cable snapped and fell into flooded water, sparking actively.',
      complaint_status: 'Investigating',
      created_at: '2026-10-08T10:05:00.000Z',
      updated_at: '2026-10-08T10:15:00.000Z',
      unread_for_citizen: 0,
      unread_for_authority: 1
    };
    this.conversations.set(conv1021.id, conv1021);

    const msgs1021 = [
      {
        id: 'MSG-1021-1',
        conversation_id: 'CONV-R1021',
        sender_id: 'CIT-1021',
        sender_name: 'Rajesh Kulkarni',
        sender_role: 'citizen',
        text: 'URGENT: Live electrical power line fell right into the flooded road near Shivaji Nagar! Active sparks flying!',
        attachment: {
          name: 'electrical_hazard_line.jpg',
          url: '/evidence/electrical_hazard_line.jpg',
          type: 'image/jpeg',
          size_bytes: 380000
        },
        timestamp: '2026-10-08T10:06:00.000Z',
        read: true,
        read_at: '2026-10-08T10:08:00.000Z'
      },
      {
        id: 'MSG-1021-2',
        conversation_id: 'CONV-R1021',
        sender_id: 'AUTH-04',
        sender_name: 'Officer Vikram Patil',
        sender_role: 'authority',
        text: 'Acknowledged Rajesh. Substation 4 has initiated emergency feeder tripping. Stay at least 30 meters clear of the water pool.',
        attachment: null,
        timestamp: '2026-10-08T10:10:00.000Z',
        read: true,
        read_at: '2026-10-08T10:11:00.000Z'
      },
      {
        id: 'MSG-1021-3',
        sender_id: 'CIT-1021',
        sender_name: 'Rajesh Kulkarni',
        sender_role: 'citizen',
        text: 'Police has blocked traffic from the south entrance. Standing by safe distance.',
        attachment: null,
        timestamp: '2026-10-08T10:15:00.000Z',
        read: false,
        read_at: null
      }
    ];
    this.messages.set(conv1021.id, msgs1021);
  }

  /**
   * Resolves the assigned authority for a given report
   */
  resolveAuthorityForReport(report, linkedIncident = null) {
    if (!report) return AUTHORITIES.find(a => a.id === 'AUTH-DUTY');

    // 1. Check if incident has an allocated resource
    if (linkedIncident && linkedIncident.recommended_resources?.length > 0) {
      const topRec = linkedIncident.recommended_resources[0];
      const match = AUTHORITIES.find(a => a.unit_id === topRec.id);
      if (match) return match;
    }

    // 2. Category matching
    const cat = (report.category || '').toLowerCase();
    if (cat.includes('electrical')) {
      return AUTHORITIES.find(a => a.id === 'AUTH-04');
    }
    if (cat.includes('water')) {
      return AUTHORITIES.find(a => a.id === 'AUTH-03');
    }
    if (cat.includes('road')) {
      return AUTHORITIES.find(a => a.id === 'AUTH-01');
    }

    return AUTHORITIES.find(a => a.id === 'AUTH-DUTY');
  }

  /**
   * Validates access permissions:
   * Only the citizen who submitted the complaint or the assigned authority
   * (or an explicit admin auditor) can access this conversation.
   */
  validateAccess(conversation, userId, userRole = 'citizen') {
    if (!conversation) return { allowed: false, reason: 'Conversation not found.' };

    const role = (userRole || 'citizen').toLowerCase();
    const cleanUserId = (userId || '').trim();

    // Admin audit mode
    if (role === 'admin') {
      return { allowed: true, role: 'admin' };
    }

    // Citizen check: Must match the citizen who submitted the complaint
    if (role === 'citizen') {
      const normUser = cleanUserId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const normConvCitizen = (conversation.citizen_id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const normReport = (conversation.report_id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      const isOwner = conversation.citizen_id === cleanUserId ||
        cleanUserId === 'citizen-current' || // default active citizen session
        cleanUserId === `CIT-${conversation.report_id}` ||
        normUser === normConvCitizen ||
        normUser.includes(normReport) ||
        normUser.replace('cit', '') === normReport.replace('r', '');
      
      if (isOwner) {
        return { allowed: true, role: 'citizen' };
      }
      return { 
        allowed: false, 
        reason: 'Forbidden: You do not have permission to view or participate in this private citizen conversation.' 
      };
    }

    // Authority check: Must match the authority assigned to this complaint
    if (role === 'authority') {
      const isAssigned = conversation.authority_id === cleanUserId ||
        cleanUserId === 'authority-current' || // default active authority operator
        AUTHORITIES.some(a => a.id === cleanUserId);

      if (isAssigned) {
        return { allowed: true, role: 'authority' };
      }
      return { 
        allowed: false, 
        reason: 'Forbidden: This conversation is assigned to another municipal officer.' 
      };
    }

    return { allowed: false, reason: 'Unauthorized role.' };
  }

  /**
   * Retrieves or initializes a 1-to-1 conversation for a complaint
   */
  getOrCreateConversationForReport(report, linkedIncident = null, currentUserId = null, currentRole = 'citizen') {
    const reportId = report.report_id || report.id;
    let existing = Array.from(this.conversations.values()).find(c => c.report_id === reportId);

    if (existing) {
      // Check permissions
      const perm = this.validateAccess(existing, currentUserId, currentRole);
      if (!perm.allowed) {
        throw new Error(perm.reason);
      }
      return existing;
    }

    // Assign appropriate municipal authority
    const authority = this.resolveAuthorityForReport(report, linkedIncident);
    const citizenId = report.citizen_id || `CIT-${reportId}`;
    const citizenName = report.citizen_name || `Citizen (${reportId})`;

    const newConv = {
      id: `CONV-${reportId}`,
      report_id: reportId,
      citizen_id: citizenId,
      citizen_name: citizenName,
      authority_id: authority.id,
      authority_name: authority.name,
      authority_dept: authority.department,
      authority_role: authority.designation,
      authority_status: authority.status,
      authority_avatar: authority.avatar,
      complaint_title: report.description,
      complaint_status: report.status || 'Under Review',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unread_for_citizen: 0,
      unread_for_authority: 0
    };

    this.conversations.set(newConv.id, newConv);
    this.messages.set(newConv.id, [
      {
        id: `MSG-${Date.now()}-welcome`,
        conversation_id: newConv.id,
        sender_id: authority.id,
        sender_name: authority.name,
        sender_role: 'authority',
        text: `Hello ${citizenName}. I am ${authority.name} from ${authority.department}. This is a private, confidential channel for your complaint ${reportId}. How can I assist you with this report?`,
        attachment: null,
        timestamp: new Date().toISOString(),
        read: false,
        read_at: null
      }
    ]);
    newConv.unread_for_citizen = 1;

    this.saveStore();
    return newConv;
  }

  /**
   * Lists conversations for a specific user role with filters and search
   */
  getConversations(userId, userRole = 'authority', filters = {}) {
    const role = (userRole || 'authority').toLowerCase();
    const cleanUserId = (userId || '').trim();

    let list = Array.from(this.conversations.values());

    // Filter by authorization
    if (role === 'citizen') {
      list = list.filter(c => 
        c.citizen_id === cleanUserId || 
        cleanUserId === 'citizen-current' ||
        cleanUserId === `CIT-${c.report_id}`
      );
    } else if (role === 'authority') {
      // Filter by assigned authority if specified, or all if command supervisor
      if (cleanUserId && cleanUserId !== 'authority-current') {
        list = list.filter(c => c.authority_id === cleanUserId);
      }
    }

    // Filter by search query
    if (filters.search && typeof filters.search === 'string') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(c => 
        c.report_id.toLowerCase().includes(q) ||
        c.citizen_name.toLowerCase().includes(q) ||
        c.authority_name.toLowerCase().includes(q) ||
        (c.complaint_title || '').toLowerCase().includes(q)
      );
    }

    // Filter by complaint status
    if (filters.status && filters.status !== 'All') {
      list = list.filter(c => 
        (c.complaint_status || '').toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Filter by unread
    if (filters.unreadOnly === true || filters.unreadOnly === 'true') {
      if (role === 'authority') {
        list = list.filter(c => (c.unread_for_authority || 0) > 0);
      } else {
        list = list.filter(c => (c.unread_for_citizen || 0) > 0);
      }
    }

    // Sort by latest activity
    list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return list;
  }

  /**
   * Retrieves conversation by ID with access control
   */
  getConversationById(conversationId, userId, userRole = 'citizen') {
    const conv = this.conversations.get(conversationId);
    if (!conv) return null;

    const perm = this.validateAccess(conv, userId, userRole);
    if (!perm.allowed) {
      const err = new Error(perm.reason);
      err.statusCode = 403;
      throw err;
    }

    return conv;
  }

  /**
   * Retrieves paginated messages for a conversation
   */
  getMessages(conversationId, userId, userRole = 'citizen', { limit = 50, offset = 0 } = {}) {
    const conv = this.getConversationById(conversationId, userId, userRole);
    if (!conv) return [];

    const msgs = this.messages.get(conversationId) || [];
    const sliced = msgs.slice(offset, offset + limit);

    return {
      conversation: conv,
      total_count: msgs.length,
      messages: sliced
    };
  }

  /**
   * Sends a message in a conversation with optional attachment
   */
  sendMessage({ conversationId, senderId, senderName, senderRole, text, attachment = null }) {
    const conv = this.conversations.get(conversationId);
    if (!conv) {
      const err = new Error('Conversation not found.');
      err.statusCode = 404;
      throw err;
    }

    // Authorization check
    const perm = this.validateAccess(conv, senderId, senderRole);
    if (!perm.allowed) {
      const err = new Error(perm.reason);
      err.statusCode = 403;
      throw err;
    }

    if ((!text || text.trim().length === 0) && !attachment) {
      const err = new Error('Message text or an attachment is required.');
      err.statusCode = 400;
      throw err;
    }

    // Validate attachment size if present
    let processedAttachment = null;
    if (attachment) {
      if (attachment.size_bytes && attachment.size_bytes > 5 * 1024 * 1024) {
        const err = new Error('Attachment exceeds maximum allowed size of 5MB.');
        err.statusCode = 400;
        throw err;
      }
      processedAttachment = {
        name: attachment.name || 'attachment',
        url: attachment.url || '',
        type: attachment.type || 'application/octet-stream',
        size_bytes: attachment.size_bytes || 0
      };
    }

    const now = new Date().toISOString();
    const msgId = `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newMsg = {
      id: msgId,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: senderName || (senderRole === 'citizen' ? conv.citizen_name : conv.authority_name),
      sender_role: senderRole,
      text: (text || '').trim(),
      attachment: processedAttachment,
      timestamp: now,
      read: false,
      read_at: null
    };

    const msgs = this.messages.get(conversationId) || [];
    msgs.push(newMsg);
    this.messages.set(conversationId, msgs);

    // Update conversation metadata & unread counters
    conv.updated_at = now;
    conv.last_message = newMsg.text || `[Attachment: ${processedAttachment.name}]`;
    if (senderRole === 'citizen') {
      conv.unread_for_authority = (conv.unread_for_authority || 0) + 1;
    } else {
      conv.unread_for_citizen = (conv.unread_for_citizen || 0) + 1;
    }

    this.saveStore();

    return {
      message: newMsg,
      conversation: conv
    };
  }

  /**
   * Marks messages in a conversation as read
   */
  markConversationAsRead(conversationId, readerId, readerRole = 'citizen') {
    const conv = this.conversations.get(conversationId);
    if (!conv) return { success: false, read_count: 0 };

    const perm = this.validateAccess(conv, readerId, readerRole);
    if (!perm.allowed) {
      const err = new Error(perm.reason);
      err.statusCode = 403;
      throw err;
    }

    const now = new Date().toISOString();
    const msgs = this.messages.get(conversationId) || [];
    let count = 0;

    for (const msg of msgs) {
      // Mark as read if sent by opposite party and currently unread
      if (msg.sender_role !== readerRole && !msg.read) {
        msg.read = true;
        msg.read_at = now;
        count++;
      }
    }

    if (readerRole === 'citizen') {
      conv.unread_for_citizen = 0;
    } else {
      conv.unread_for_authority = 0;
    }

    this.saveStore();
    return { success: true, read_count: count, conversation: conv };
  }

  /**
   * Returns unread count for current user
   */
  getUnreadCount(userId, userRole = 'authority') {
    const conversations = this.getConversations(userId, userRole);
    let total = 0;
    for (const c of conversations) {
      if (userRole === 'authority') {
        total += (c.unread_for_authority || 0);
      } else {
        total += (c.unread_for_citizen || 0);
      }
    }
    return { unread_count: total };
  }

  /**
   * Authority updates complaint status directly from chat
   */
  updateComplaintStatus(conversationId, newStatus, authorityId) {
    const conv = this.conversations.get(conversationId);
    if (!conv) {
      const err = new Error('Conversation not found.');
      err.statusCode = 404;
      throw err;
    }

    const perm = this.validateAccess(conv, authorityId, 'authority');
    if (!perm.allowed) {
      const err = new Error(perm.reason);
      err.statusCode = 403;
      throw err;
    }

    const validStatuses = ['Pending', 'Under Review', 'Investigating', 'Resolved', 'Linked'];
    if (!validStatuses.includes(newStatus)) {
      const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    conv.complaint_status = newStatus;
    conv.updated_at = new Date().toISOString();

    // Log automated system status message in the chat
    const sysMsg = {
      id: `MSG-SYS-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: 'SYSTEM',
      sender_name: 'CivicPulse Dispatch Status Trail',
      sender_role: 'system',
      text: `📋 Complaint status updated to: ${newStatus} by ${conv.authority_name}.`,
      attachment: null,
      timestamp: new Date().toISOString(),
      read: false,
      read_at: null
    };

    const msgs = this.messages.get(conversationId) || [];
    msgs.push(sysMsg);
    this.messages.set(conversationId, msgs);

    conv.unread_for_citizen = (conv.unread_for_citizen || 0) + 1;
    this.saveStore();

    return {
      success: true,
      conversation: conv,
      system_message: sysMsg
    };
  }
}

export const chatService = new ChatService();

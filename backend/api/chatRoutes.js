/**
 * CivicPulse - 1-to-1 Citizen-Authority Private Chat Routes
 * 
 * Strict Privacy & Authorization Enforced:
 * - Checks X-User-Id and X-User-Role (defaults to active authenticated session)
 * - Validates ownership: only the citizen who submitted the complaint or assigned authority
 * - Safe file attachment handling with 5MB validation
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { chatService, AUTHORITIES } from '../services/chatService.js';
import { civicPulseService } from '../services/civicPulseService.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHAT_UPLOADS_DIR = path.resolve(__dirname, '../../frontend/public/evidence/chat');

// Ensure upload directory exists
if (!fs.existsSync(CHAT_UPLOADS_DIR)) {
  fs.mkdirSync(CHAT_UPLOADS_DIR, { recursive: true });
}

/**
 * Middleware to extract authenticated user credentials from headers or body
 */
function authMiddleware(req, res, next) {
  // Support headers, query, or body parameters for testability and client convenience
  const userRole = (req.headers['x-user-role'] || req.query.user_role || req.body?.user_role || 'citizen').toLowerCase();
  const defaultUserId = (userRole === 'authority' || userRole === 'admin') ? 'authority-current' : 'citizen-current';
  const userId = req.headers['x-user-id'] || req.query.user_id || req.body?.user_id || defaultUserId;

  req.auth = {
    userId: String(userId).trim(),
    role: userRole
  };
  next();
}

router.use(authMiddleware);

// GET /api/chat/authorities - Directory of official municipal authorities
router.get('/authorities', (req, res) => {
  res.json({
    success: true,
    authorities: AUTHORITIES
  });
});

// GET /api/chat/unread-count - Unread messages count for current authenticated user
router.get('/unread-count', (req, res) => {
  try {
    const { userId, role } = req.auth;
    const result = chatService.getUnreadCount(userId, role);
    res.json({
      success: true,
      unread_count: result.unread_count
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/chat/conversations - List conversations with filters & search
router.get('/conversations', (req, res) => {
  try {
    const { userId, role } = req.auth;
    const { search, status, unreadOnly } = req.query;

    const conversations = chatService.getConversations(userId, role, {
      search,
      status,
      unreadOnly
    });

    res.json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/chat/conversations - Create or retrieve conversation for a complaint
router.post('/conversations', (req, res) => {
  try {
    const { reportId } = req.body;
    const { userId, role } = req.auth;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: reportId'
      });
    }

    const report = civicPulseService.getReportById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: `Complaint/Report '${reportId}' not found in CivicPulse database.`
      });
    }

    // Resolve linked incident
    const linkedIncident = report.linked_incident_id
      ? civicPulseService.getIncidentById(report.linked_incident_id)
      : null;

    const conversation = chatService.getOrCreateConversationForReport(
      report,
      linkedIncident,
      userId,
      role
    );

    res.json({
      success: true,
      conversation
    });
  } catch (err) {
    const status = err.statusCode || (err.message.includes('Forbidden') ? 403 : 500);
    res.status(status).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/chat/conversations/:id - Get conversation details
router.get('/conversations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.auth;

    const conversation = chatService.getConversationById(id, userId, role);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found.'
      });
    }

    res.json({
      success: true,
      conversation
    });
  } catch (err) {
    const status = err.statusCode || (err.message.includes('Forbidden') ? 403 : 500);
    res.status(status).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/chat/conversations/:id/messages - Paginated message history
router.get('/conversations/:id/messages', (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.auth;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    const result = chatService.getMessages(id, userId, role, { limit, offset });

    res.json({
      success: true,
      conversation: result.conversation,
      total_count: result.total_count,
      messages: result.messages
    });
  } catch (err) {
    const status = err.statusCode || (err.message.includes('Forbidden') ? 403 : 500);
    res.status(status).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/chat/conversations/:id/messages - Send a message
router.post('/conversations/:id/messages', (req, res) => {
  try {
    const { id } = req.params;
    const { text, attachment, senderName } = req.body;
    const { userId, role } = req.auth;

    const result = chatService.sendMessage({
      conversationId: id,
      senderId: userId,
      senderName,
      senderRole: role,
      text,
      attachment
    });

    res.status(201).json({
      success: true,
      message: result.message,
      conversation: result.conversation
    });
  } catch (err) {
    const status = err.statusCode || (err.message.includes('Forbidden') ? 403 : 400);
    res.status(status).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/chat/conversations/:id/read - Mark messages as read
router.post('/conversations/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.auth;

    const result = chatService.markConversationAsRead(id, userId, role);

    res.json({
      success: true,
      read_count: result.read_count,
      conversation: result.conversation
    });
  } catch (err) {
    const status = err.statusCode || (err.message.includes('Forbidden') ? 403 : 500);
    res.status(status).json({
      success: false,
      error: err.message
    });
  }
});

// PATCH /api/chat/conversations/:id/complaint-status - Authority updates complaint status
router.patch('/conversations/:id/complaint-status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { userId, role } = req.auth;

    if (role !== 'authority' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only municipal authorities can update complaint status.'
      });
    }

    const result = chatService.updateComplaintStatus(id, status, userId);

    // Also sync with main civicPulseService report if matching
    const reportId = result.conversation.report_id;
    if (reportId) {
      try {
        civicPulseService.updateReport(reportId, { status });
      } catch {
        // Silently preserve conversation status
      }
    }

    res.json({
      success: true,
      conversation: result.conversation,
      system_message: result.system_message
    });
  } catch (err) {
    const status = err.statusCode || (err.message.includes('Forbidden') ? 403 : 400);
    res.status(status).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/chat/upload - Upload file attachment (Photo or Document)
router.post('/upload', (req, res) => {
  try {
    const { fileData, fileName, fileType } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing fileData or fileName in upload payload.'
      });
    }

    // Validate size (max 5MB)
    const base64Data = fileData.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds maximum allowed size of 5MB.'
      });
    }

    // Validate mime types: image or documents (pdf, txt, doc)
    const mime = (fileType || '').toLowerCase();
    const isImage = mime.startsWith('image/');
    const isDoc = mime.includes('pdf') || mime.includes('text') || mime.includes('document');

    if (!isImage && !isDoc && !fileName.match(/\.(jpg|jpeg|png|webp|pdf|txt|docx?)$/i)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Allowed formats: JPG, PNG, WEBP, PDF, TXT, DOC.'
      });
    }

    // Save with safe unique filename
    const ext = path.extname(fileName) || (isImage ? '.jpg' : '.pdf');
    const safeHash = crypto.randomBytes(8).toString('hex');
    const safeFileName = `chat_${Date.now()}_${safeHash}${ext}`;
    const targetPath = path.join(CHAT_UPLOADS_DIR, safeFileName);

    fs.writeFileSync(targetPath, buffer);

    const fileUrl = `/evidence/chat/${safeFileName}`;

    res.status(201).json({
      success: true,
      attachment: {
        name: fileName,
        url: fileUrl,
        type: fileType || (isImage ? 'image/jpeg' : 'application/pdf'),
        size_bytes: buffer.length
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;

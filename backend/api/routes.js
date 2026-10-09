/**
 * CivicPulse - Core API Router
 * 
 * Provides REST endpoints for:
 * - Citizen Reports (Create, Read all, Read by ID, Update, Delete, Filter)
 * - Clustered Incidents & Priority Ranking
 * - Dynamic Resource Recommendations & Shortage Toggles
 * - Simulation Workflows & Analytics
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { civicPulseService } from '../services/civicPulseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const evidenceDir = path.join(__dirname, '../../frontend/public/evidence');

// Ensure evidence directory exists
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

const router = express.Router();

// Supported image MIME types & max size (5MB)
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// ============================================================================
// 1. REPORT MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/reports - Fetch citizen reports with optional filters (category, status, search)
router.get('/reports', (req, res) => {
  try {
    const { category, status, search } = req.query;
    const reports = civicPulseService.getReports({ category, status, search });
    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/:id - Fetch single report by ID
router.get('/reports/:id', (req, res) => {
  try {
    const report = civicPulseService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: `Report ${req.params.id} not found.` });
    }
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reports - Create a citizen report with optional evidence
router.post('/reports', (req, res) => {
  try {
    const { category, description, latitude, longitude, timestamp, image, evidence, metadata, status } = req.body;
    if (!category || !description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category, description, latitude, longitude.'
      });
    }

    const numLat = parseFloat(latitude);
    const numLng = parseFloat(longitude);
    if (isNaN(numLat) || isNaN(numLng)) {
      return res.status(400).json({ success: false, error: 'Invalid coordinates: latitude and longitude must be numbers.' });
    }

    const rawEvidence = evidence || image || null;
    let storedImage = null;
    let storedEvidenceUrl = null;

    if (rawEvidence && typeof rawEvidence === 'string') {
      if (rawEvidence.startsWith('data:image/')) {
        // Base64 Data URL upload
        const match = rawEvidence.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (!match) {
          return res.status(400).json({ success: false, error: 'Invalid image data format. Must be a valid image Data URL.' });
        }

        const mimeType = match[1].toLowerCase();
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
          return res.status(400).json({ success: false, error: 'Unsupported file format. Allowed formats: JPG, JPEG, PNG, WEBP.' });
        }

        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        if (buffer.length > MAX_IMAGE_BYTES) {
          return res.status(400).json({ success: false, error: 'File size exceeds maximum limit of 5MB.' });
        }

        const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
        const safeFilename = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const targetPath = path.join(evidenceDir, safeFilename);

        fs.writeFileSync(targetPath, buffer);
        storedImage = safeFilename;
        storedEvidenceUrl = `/evidence/${safeFilename}`;
      } else {
        const sanitized = path.basename(rawEvidence);
        storedImage = sanitized;
        storedEvidenceUrl = `/evidence/${sanitized}`;
      }
    }

    const result = civicPulseService.addNewReport({
      category,
      description,
      latitude: numLat,
      longitude: numLng,
      timestamp: timestamp || new Date().toISOString(),
      image: storedImage,
      evidence: storedEvidenceUrl,
      status: status || 'Linked',
      metadata: {
        ...(metadata || {}),
        source: metadata?.source || 'Citizen Submission Portal',
        has_photo: Boolean(storedImage)
      }
    });

    res.status(201).json({ 
      success: true, 
      ...result,
      evidence_url: storedEvidenceUrl,
      evidence_reference: storedImage ? `EV-REP-${result.report?.report_id || 'NEW'}` : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/reports/:id - Update an existing report
router.put('/reports/:id', (req, res) => {
  try {
    const updated = civicPulseService.updateReport(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: `Report ${req.params.id} not found.` });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/reports/:id - Delete a report and update incident clusters
router.delete('/reports/:id', (req, res) => {
  try {
    const deleted = civicPulseService.deleteReport(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: `Report ${req.params.id} not found.` });
    }
    res.json({ success: true, message: `Report ${req.params.id} deleted successfully.`, deleted_id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 2. INCIDENT & PRIORITY ENDPOINTS
// ============================================================================

// GET /api/incidents - Fetch all clustered incidents
router.get('/incidents', (req, res) => {
  try {
    const incidents = civicPulseService.getIncidents();
    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/incidents/ranked - Fetch priority-ranked incidents with justifications
router.get('/incidents/ranked', (req, res) => {
  try {
    const ranked = civicPulseService.rankIncidents();
    res.json({ success: true, count: ranked.length, data: ranked });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/incidents/:id - Fetch incident details with linked reports
router.get('/incidents/:id', (req, res) => {
  try {
    const incident = civicPulseService.getIncidentById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: `Incident ${req.params.id} not found.` });
    }
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/incidents/:id/recommendation - Fetch deep resource recommendation with alternatives
router.get('/incidents/:id/recommendation', (req, res) => {
  try {
    const rec = civicPulseService.recommendResource(req.params.id);
    if (!rec) {
      return res.status(404).json({ success: false, error: `Incident ${req.params.id} not found.` });
    }
    res.json({ success: true, data: rec });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/incidents/:id/recalculate - Recalculate incident metrics
router.post('/incidents/:id/recalculate', (req, res) => {
  try {
    civicPulseService.recalculateAll();
    const incident = civicPulseService.getIncidentById(req.params.id);
    res.json({ success: true, data: incident });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 3. RESOURCE & FLEET ENDPOINTS
// ============================================================================

// GET /api/resources - Fetch municipal resources
router.get('/resources', (req, res) => {
  try {
    const resources = civicPulseService.getResources();
    res.json({ success: true, count: resources.length, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/resources/:id - Toggle or update resource availability
router.patch('/resources/:id', (req, res) => {
  try {
    const { availability } = req.body;
    const result = civicPulseService.toggleResourceAvailability(req.params.id, availability);
    if (!result) {
      return res.status(404).json({ success: false, error: `Resource ${req.params.id} not found.` });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 4. SIMULATION WORKFLOW STEPPERS
// ============================================================================

// POST /api/simulation/severe-report - Demo Step 3: Inject critical severe report
router.post('/simulation/severe-report', (req, res) => {
  try {
    const result = civicPulseService.injectSevereReport();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/simulation/resource-shortage - Demo Step 6: Simulate Electrical Team shortage
router.post('/simulation/resource-shortage', (req, res) => {
  try {
    const result = civicPulseService.simulateResourceShortage();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/simulation/reset - Reset demo to initial state
router.post('/simulation/reset', (req, res) => {
  try {
    civicPulseService.resetState();
    res.json({
      success: true,
      message: 'Demo state reset to initial conditions (20 reports, 6 incidents).',
      incidents: civicPulseService.getIncidents(),
      reports_count: civicPulseService.getReports().length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/simulation/recalculate - Force recalculation of all priorities
router.post('/simulation/recalculate', (req, res) => {
  try {
    const result = civicPulseService.recalculateAll();
    res.json({ success: true, message: 'All priorities and allocations recalculated.', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics - Get analytics and KPI stats
router.get('/analytics', (req, res) => {
  try {
    const analytics = civicPulseService.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

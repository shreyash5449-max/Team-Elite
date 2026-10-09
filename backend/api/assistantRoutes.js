/**
 * CivicPulse - CivicPulse Assistant API Router (Round 2)
 * 
 * Provides dedicated endpoints for decision-support chat explanations,
 * dynamic question suggestions, and telemetry context snapshots.
 */

import express from 'express';
import { civicPulseService } from '../services/civicPulseService.js';
import { handleAssistantQuery, getSuggestedQuestions } from '../engines/assistantEngine.js';

const router = express.Router();

/**
 * POST /api/assistant/chat
 * Primary decision-support chat endpoint
 * 
 * Request:
 * {
 *   "message": "Why is CIV-104 critical?",
 *   "incident_id": "CIV-104"
 * }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, incident_id } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Field "message" is required and must be a string.'
      });
    }

    const response = await handleAssistantQuery({
      message,
      incidentId: incident_id,
      service: civicPulseService
    });

    res.json(response);
  } catch (err) {
    console.error('[AssistantAPI] Error processing chat query:', err);
    res.status(500).json({
      success: false,
      error: 'An internal error occurred while generating decision support.',
      details: err.message
    });
  }
});

/**
 * GET /api/assistant/suggested-questions
 * Fetches dynamic suggested questions based on selected incident state
 */
router.get('/suggested-questions', (req, res) => {
  try {
    const incidentId = req.query.incident_id || 'CIV-104';
    const incident = civicPulseService.getIncidentById(incidentId) || civicPulseService.getIncidents()[0];
    const questions = getSuggestedQuestions(incident);

    res.json({
      success: true,
      incident_id: incidentId,
      questions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/assistant/context/:id
 * Fetches grounded telemetry context snapshot for an incident
 */
router.get('/context/:id', (req, res) => {
  try {
    const incident = civicPulseService.getIncidentById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: `Incident ${req.params.id} not found.` });
    }

    res.json({
      success: true,
      incident_id: incident.id,
      context: {
        severity: incident.severity,
        priority: incident.priority,
        categories: incident.categories,
        severity_factors: incident.severity_breakdown?.factors || [],
        evidence_breakdown: incident.evidence_breakdown || null,
        recommended_resources: incident.recommended_resources || [],
        shortage_detected: incident.shortage_detected || false,
        status_trail_count: incident.status_trail?.length || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

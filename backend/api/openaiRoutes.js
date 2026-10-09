/**
 * CivicPulse - OpenAI API Integration Routes
 * Handles AI-powered incident analysis, severity prediction, and recommendations
 */

import express from 'express';
import { civicPulseService } from '../services/civicPulseService.js';

const router = express.Router();

// GET /api/openai/health - Check OpenAI API configuration
router.get('/health', (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: 'OpenAI API key not configured. Set OPENAI_API_KEY in .env'
    });
  }
  res.json({
    success: true,
    message: 'OpenAI API is configured',
    model: process.env.OPENAI_MODEL || 'gpt-4o'
  });
});

// POST /api/openai/analyze-report - Analyze a citizen report using GPT
router.post('/analyze-report', async (req, res) => {
  try {
    const { reportId, reportText } = req.body;

    if (!reportId || !reportText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportId, reportText'
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a municipal incident analysis AI. Analyze citizen reports and provide:
1. Severity level (LOW, MEDIUM, HIGH, CRITICAL)
2. Incident category (Water & Sanitation, Road & Infrastructure, Electrical & Public Safety, Other)
3. Key details and risks
4. Recommended response units
Format response as JSON with keys: severity, category, key_details, risks, recommended_units`
          },
          {
            role: 'user',
            content: `Analyze this civic incident report: "${reportText}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    res.json({
      success: true,
      reportId,
      analysis,
      usage: data.usage
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/openai/suggest-severity - Get AI severity recommendation for incident
router.post('/suggest-severity', async (req, res) => {
  try {
    const { incidentId, incidentDescription, linkedReports } = req.body;

    if (!incidentId || !incidentDescription) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: incidentId, incidentDescription'
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    const reportContext = linkedReports
      ? `Linked reports: ${linkedReports.join(', ')}`
      : 'No linked reports';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a municipal severity assessment AI. Given an incident description, provide:
1. Severity score (0-100)
2. Urgency level (LOW, MEDIUM, HIGH, CRITICAL)
3. Main risk factors
4. Immediate action required
Format response as JSON with keys: severity_score, urgency_level, risk_factors (array), immediate_action`
          },
          {
            role: 'user',
            content: `Assess severity for incident: "${incidentDescription}". ${reportContext}`
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const assessment = data.choices[0].message.content;

    res.json({
      success: true,
      incidentId,
      assessment,
      usage: data.usage
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/openai/generate-dispatch-plan - Generate optimal dispatch strategy
router.post('/generate-dispatch-plan', async (req, res) => {
  try {
    const { incidentId, incidentType, severity, availableResources } = req.body;

    if (!incidentId || !incidentType || severity === undefined || !availableResources) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: incidentId, incidentType, severity, availableResources'
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    const resourceList = JSON.stringify(availableResources);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a municipal resource dispatch optimization AI. Given incident details and available resources, provide:
1. Recommended primary response unit
2. Secondary support units
3. Deployment priority order
4. Estimated arrival time impact
5. Special instructions
Format response as JSON with keys: primary_unit, secondary_units (array), deployment_order, eta_notes, special_instructions`
          },
          {
            role: 'user',
            content: `Create dispatch plan for ${incidentType} incident (Severity: ${severity}/100). Available resources: ${resourceList}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const dispatchPlan = data.choices[0].message.content;

    res.json({
      success: true,
      incidentId,
      dispatchPlan,
      usage: data.usage
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/openai/predict-escalation - Predict if incident will escalate
router.post('/predict-escalation', async (req, res) => {
  try {
    const { incidentId, currentSeverity, reportTrend, weatherConditions } = req.body;

    if (!incidentId || currentSeverity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: incidentId, currentSeverity'
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    const trend = reportTrend || 'stable';
    const weather = weatherConditions || 'unknown';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a municipal incident escalation prediction AI. Analyze if an incident will escalate. Provide:
1. Escalation probability (0-100%)
2. Escalation likelihood (Very Low, Low, Medium, High, Very High)
3. Key risk factors
4. Preventive measures
Format response as JSON with keys: escalation_probability, escalation_likelihood, risk_factors (array), preventive_measures (array)`
          },
          {
            role: 'user',
            content: `Predict escalation for incident with current severity ${currentSeverity}/100, trend: ${trend}, weather: ${weather}`
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const prediction = data.choices[0].message.content;

    res.json({
      success: true,
      incidentId,
      prediction,
      usage: data.usage
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/openai/generate-summary - Generate human-readable incident summary
router.post('/generate-summary', async (req, res) => {
  try {
    const { incidentId, incidentData } = req.body;

    if (!incidentId || !incidentData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: incidentId, incidentData'
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    const incidentContext = JSON.stringify(incidentData);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a municipal incident report generator. Create a concise, professional summary of the incident for command center operators. Keep it under 150 words.`
          },
          {
            role: 'user',
            content: `Generate a summary for this incident: ${incidentContext}`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    res.json({
      success: true,
      incidentId,
      summary,
      usage: data.usage
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;

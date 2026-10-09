/**
 * CivicPulse - Google Gemini API Integration Routes
 * Handles AI-powered incident analysis, severity assessment, and response recommendations
 * using the Google Gemini models (gemini-1.5-flash / gemini-2.0-flash).
 */

import express from 'express';

const router = express.Router();

/**
 * Helper to call Gemini REST API
 */
async function callGemini({ systemInstruction, prompt, temperature = 0.7, maxTokens = 600 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens
    }
  };

  if (systemInstruction) {
    payload.system_instruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || response.statusText;
    throw new Error(`Gemini API error (${response.status}): ${message}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response received from Gemini API');
  }

  return {
    text,
    usage: data.usageMetadata
  };
}

// GET /api/gemini/health - Check Gemini API configuration
router.get('/health', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: 'Gemini API key not configured. Set GEMINI_API_KEY in .env'
    });
  }
  res.json({
    success: true,
    message: 'Gemini API is configured',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  });
});

// POST /api/gemini/analyze-report - Analyze a citizen report using Gemini
router.post('/analyze-report', async (req, res) => {
  try {
    const { reportId, reportText } = req.body;

    if (!reportId || !reportText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportId, reportText'
      });
    }

    const systemInstruction = `You are a municipal incident analysis AI. Analyze citizen reports and provide:
1. Severity level (LOW, MEDIUM, HIGH, CRITICAL)
2. Incident category (Water & Sanitation, Road & Infrastructure, Electrical & Public Safety, Other)
3. Key details and risks
4. Recommended response units
Format response as JSON with keys: severity, category, key_details, risks, recommended_units`;

    const prompt = `Analyze this civic incident report: "${reportText}"`;
    const { text, usage } = await callGemini({ systemInstruction, prompt, temperature: 0.7, maxTokens: 600 });

    res.json({
      success: true,
      reportId,
      analysis: text,
      usage
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/gemini/suggest-severity - Get AI severity recommendation for incident
router.post('/suggest-severity', async (req, res) => {
  try {
    const { incidentId, incidentDescription, linkedReports } = req.body;

    if (!incidentId || !incidentDescription) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: incidentId, incidentDescription'
      });
    }

    const reportContext = linkedReports?.length
      ? `Linked reports: ${linkedReports.join(', ')}`
      : 'No linked reports';

    const systemInstruction = `You are a municipal severity assessment AI. Given an incident description, provide:
1. Severity score (0-100)
2. Urgency level (LOW, MEDIUM, HIGH, CRITICAL)
3. Main risk factors
4. Immediate action required
Format response as JSON with keys: severity_score, urgency_level, risk_factors (array), immediate_action`;

    const prompt = `Assess severity for incident: "${incidentDescription}". ${reportContext}`;
    const { text, usage } = await callGemini({ systemInstruction, prompt, temperature: 0.5, maxTokens: 500 });

    res.json({
      success: true,
      incidentId,
      assessment: text,
      usage
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/gemini/generate-dispatch-plan - Generate optimal dispatch strategy
router.post('/generate-dispatch-plan', async (req, res) => {
  try {
    const { incidentId, incidentType, severity, availableResources } = req.body;

    if (!incidentId || !incidentType || severity === undefined || !availableResources) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: incidentId, incidentType, severity, availableResources'
      });
    }

    const resourceList = JSON.stringify(availableResources);

    const systemInstruction = `You are a municipal resource dispatch optimization AI. Given incident details and available resources, provide:
1. Recommended primary response unit
2. Secondary support units
3. Deployment priority order
4. Estimated arrival time impact
5. Special instructions
Format response as JSON with keys: primary_unit, secondary_units (array), deployment_order, eta_notes, special_instructions`;

    const prompt = `Create dispatch plan for ${incidentType} incident (Severity: ${severity}/100). Available resources: ${resourceList}`;
    const { text, usage } = await callGemini({ systemInstruction, prompt, temperature: 0.5, maxTokens: 600 });

    res.json({
      success: true,
      incidentId,
      dispatchPlan: text,
      usage
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/gemini/predict-escalation - Predict if incident will escalate
router.post('/predict-escalation', async (req, res) => {
  try {
    const { incidentId, currentSeverity, reportTrend, weatherConditions } = req.body;

    if (!incidentId || currentSeverity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: incidentId, currentSeverity'
      });
    }

    const trend = reportTrend || 'stable';
    const weather = weatherConditions || 'unknown';

    const systemInstruction = `You are a municipal incident escalation prediction AI. Analyze if an incident will escalate. Provide:
1. Escalation probability (0-100%)
2. Escalation likelihood (Very Low, Low, Medium, High, Very High)
3. Key risk factors
4. Preventive measures
Format response as JSON with keys: escalation_probability, escalation_likelihood, risk_factors (array), preventive_measures (array)`;

    const prompt = `Predict escalation for incident with current severity ${currentSeverity}/100, trend: ${trend}, weather: ${weather}`;
    const { text, usage } = await callGemini({ systemInstruction, prompt, temperature: 0.5, maxTokens: 500 });

    res.json({
      success: true,
      incidentId,
      prediction: text,
      usage
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/gemini/generate-summary - Generate human-readable incident summary
router.post('/generate-summary', async (req, res) => {
  try {
    const { incidentId, incidentData } = req.body;

    if (!incidentId || !incidentData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: incidentId, incidentData'
      });
    }

    const incidentContext = JSON.stringify(incidentData);

    const systemInstruction = `You are a municipal incident report generator. Create a concise, professional summary of the incident for command center operators. Keep it under 150 words.`;
    const prompt = `Generate a summary for this incident: ${incidentContext}`;

    const { text, usage } = await callGemini({ systemInstruction, prompt, temperature: 0.6, maxTokens: 350 });

    res.json({
      success: true,
      incidentId,
      summary: text,
      usage
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;

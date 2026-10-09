/**
 * CivicPulse - Unified AI Configuration & Diagnostics Routes
 * Provides unified health monitoring, provider switching, and diagnostics
 * across OpenAI and Google Gemini.
 */

import express from 'express';

const router = express.Router();

// GET /api/ai/status - Return unified status of AI engines
router.get('/status', (req, res) => {
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 5);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
  const activeProvider = (process.env.LLM_PROVIDER || (openaiConfigured ? 'openai' : 'gemini')).toLowerCase();
  const llmAssistantEnabled = process.env.ENABLE_LLM_ASSISTANT === 'true';

  res.json({
    success: true,
    activeProvider,
    llmAssistantEnabled,
    providers: {
      openai: {
        configured: openaiConfigured,
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        hasKey: openaiConfigured
      },
      gemini: {
        configured: geminiConfigured,
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        hasKey: geminiConfigured
      }
    }
  });
});

// POST /api/ai/config - Dynamically update AI settings
router.post('/config', (req, res) => {
  const { provider, openaiModel, geminiModel, enableAssistant, openaiKey, geminiKey } = req.body;

  if (provider && ['openai', 'gemini'].includes(provider.toLowerCase())) {
    process.env.LLM_PROVIDER = provider.toLowerCase();
  }

  if (openaiModel && typeof openaiModel === 'string') {
    process.env.OPENAI_MODEL = openaiModel.trim();
  }

  if (geminiModel && typeof geminiModel === 'string') {
    process.env.GEMINI_MODEL = geminiModel.trim();
  }

  if (typeof enableAssistant === 'boolean') {
    process.env.ENABLE_LLM_ASSISTANT = enableAssistant ? 'true' : 'false';
  }

  if (openaiKey && typeof openaiKey === 'string' && openaiKey.trim().length > 0) {
    process.env.OPENAI_API_KEY = openaiKey.trim();
  }

  if (geminiKey && typeof geminiKey === 'string' && geminiKey.trim().length > 0) {
    process.env.GEMINI_API_KEY = geminiKey.trim();
  }

  res.json({
    success: true,
    message: 'AI configuration updated successfully',
    activeProvider: process.env.LLM_PROVIDER || 'openai',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    llmAssistantEnabled: process.env.ENABLE_LLM_ASSISTANT === 'true'
  });
});

// POST /api/ai/test - Test connection to specified or active provider
router.post('/test', async (req, res) => {
  const provider = (req.body.provider || process.env.LLM_PROVIDER || 'openai').toLowerCase();

  try {
    const startTime = Date.now();

    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          provider: 'openai',
          error: 'OpenAI API key not configured'
        });
      }

      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          provider: 'openai',
          latencyMs,
          error: err.error?.message || response.statusText
        });
      }

      return res.json({
        success: true,
        provider: 'openai',
        latencyMs,
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        message: 'OpenAI authentication handshake succeeded'
      });
    }

    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          provider: 'gemini',
          error: 'Gemini API key not configured'
        });
      }

      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey}`);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          provider: 'gemini',
          latencyMs,
          error: err.error?.message || response.statusText
        });
      }

      return res.json({
        success: true,
        provider: 'gemini',
        latencyMs,
        model,
        message: 'Google Gemini authentication handshake succeeded'
      });
    }

    res.status(400).json({
      success: false,
      error: `Unknown AI provider '${provider}'. Supported: 'openai', 'gemini'`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      provider,
      error: err.message
    });
  }
});

export default router;

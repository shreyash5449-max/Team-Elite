import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('AI Integration Providers (OpenAI & Gemini)', () => {
  it('1. GET /api/openai/health reports configuration status', async () => {
    const res = await fetch('http://localhost:5000/api/openai/health');
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.model, 'gpt-4o');
  });

  it('2. GET /api/gemini/health reports status or prompts for key', async () => {
    const res = await fetch('http://localhost:5000/api/gemini/health');
    const data = await res.json();
    if (process.env.GEMINI_API_KEY) {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
    } else {
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.error, /GEMINI_API_KEY/i);
    }
  });

  it('3. POST /api/openai/analyze-report validates required parameters', async () => {
    const res = await fetch('http://localhost:5000/api/openai/analyze-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Missing required fields/i);
  });

  it('4. POST /api/gemini/analyze-report validates required parameters', async () => {
    const res = await fetch('http://localhost:5000/api/gemini/analyze-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Missing required fields/i);
  });

  it('5. GET /api/ai/status reports unified AI status', async () => {
    const res = await fetch('http://localhost:5000/api/ai/status');
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(typeof data.activeProvider, 'string');
    assert.strictEqual(typeof data.providers, 'object');
    assert.strictEqual(data.providers.openai.configured, true);
  });

  it('6. POST /api/ai/config updates active configuration safely', async () => {
    const res = await fetch('http://localhost:5000/api/ai/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'openai', openaiModel: 'gpt-4o' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.activeProvider, 'openai');
  });

  it('7. POST /api/ai/test conducts live authentication handshake with active provider', async () => {
    const res = await fetch('http://localhost:5000/api/ai/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'openai' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.provider, 'openai');
    assert.strictEqual(typeof data.latencyMs, 'number');
  });
});

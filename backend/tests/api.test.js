/**
 * CivicPulse - Full API Integration Test Suite
 * 
 * Tests REST endpoints including core pipeline and Round 2 Assistant routes.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import cors from 'cors';
import apiRouter from '../api/routes.js';
import assistantRouter from '../api/assistantRoutes.js';
import { civicPulseService } from '../services/civicPulseService.js';

let server;
let baseUrl;

describe('CivicPulse API Endpoints Integration', () => {
  before(async () => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', apiRouter);
    app.use('/api/assistant', assistantRouter);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('GET /api/incidents returns clustered incidents with CIV-104', async () => {
    const res = await fetch(`${baseUrl}/api/incidents`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.length >= 6);
    const civ104 = json.data.find(i => i.id === 'CIV-104');
    assert.ok(civ104);
  });

  test('POST /api/assistant/chat - Answers "Why is CIV-104 HIGH?"', async () => {
    civicPulseService.resetState();
    const res = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Why is CIV-104 HIGH?',
        incident_id: 'CIV-104'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.incident_id, 'CIV-104');
    assert.strictEqual(json.intent, 'INCIDENT_EXPLANATION');
    assert.ok(json.answer.includes('68'));
    assert.ok(json.answer.includes('HIGH'));
  });

  test('POST /api/simulation/severe-report escalates CIV-104 to 94 CRITICAL', async () => {
    const res = await fetch(`${baseUrl}/api/simulation/severe-report`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.severity_delta.to, 94);
    assert.strictEqual(json.priority_delta.to, 'CRITICAL');
  });

  test('POST /api/assistant/chat - Explains severity increase from 68 to 94', async () => {
    const res = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Why did CIV-104 change from 68 to 94?',
        incident_id: 'CIV-104'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.intent, 'SEVERITY_CHANGE');
    assert.ok(json.answer.includes('68'));
    assert.ok(json.answer.includes('94'));
    assert.ok(json.answer.includes('CRITICAL'));
  });

  test('POST /api/assistant/chat - Explains evidence linking model (40/20/25/15)', async () => {
    const res = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What evidence caused the change?',
        incident_id: 'CIV-104'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.answer.length > 50);
  });

  test('POST /api/simulation/resource-shortage detains electrical team', async () => {
    const res = await fetch(`${baseUrl}/api/simulation/resource-shortage`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.shortage_comparison);
  });

  test('POST /api/assistant/chat - Explains active shortage and recalculated recommendation', async () => {
    const res = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What happens now?',
        incident_id: 'CIV-104'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.answer.includes('Emergency Response Vehicle'));
    assert.ok(json.answer.includes('UNAVAILABLE') || json.answer.includes('unavailable'));
  });

  test('GET /api/assistant/suggested-questions returns questions array', async () => {
    const res = await fetch(`${baseUrl}/api/assistant/suggested-questions?incident_id=CIV-104`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.questions));
    assert.ok(json.questions.length > 0);
  });

  test('GET /api/assistant/context/:id returns telemetry context', async () => {
    const res = await fetch(`${baseUrl}/api/assistant/context/CIV-104`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.incident_id, 'CIV-104');
    assert.ok(json.context.severity !== undefined);
  });

  test('POST /api/simulation/reset restores initial demo state', async () => {
    const res = await fetch(`${baseUrl}/api/simulation/reset`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.reports_count, 20);
  });
});

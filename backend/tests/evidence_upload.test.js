import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from '../api/routes.js';
import assistantRouter from '../api/assistantRoutes.js';
import { civicPulseService } from '../services/civicPulseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let server;
let baseUrl;

describe('Citizen Evidence & Photo Upload Feature', () => {
  before(async () => {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '15mb' }));
    app.use(express.urlencoded({ extended: true, limit: '15mb' }));
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

  test('1. Submit report WITHOUT photo succeeds (Photo evidence is completely optional)', async () => {
    const reportPayload = {
      category: 'Water & Sanitation',
      description: 'Minor water seepage near curb on Shivaji Nagar road',
      latitude: 18.5206,
      longitude: 73.8569,
      timestamp: new Date().toISOString()
    };

    const res = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload)
    });

    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.report);
    assert.strictEqual(json.report.evidence, null);
    assert.strictEqual(json.report.image, null);
    assert.strictEqual(json.evidence_url, null);
  });

  test('2. Submit report WITH valid JPG base64 photo saves file and returns evidence URL', async () => {
    // 1x1 transparent JPEG minimal base64
    const fakeJpgBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

    const reportPayload = {
      category: 'Water & Sanitation',
      description: 'Severe high pressure pipe leak spraying street water',
      latitude: 18.5204,
      longitude: 73.8567,
      timestamp: new Date().toISOString(),
      evidence: fakeJpgBase64
    };

    const res = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload)
    });

    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.report);
    assert.ok(json.evidence_url);
    assert.ok(json.evidence_url.startsWith('/evidence/upload_'));
    assert.ok(json.evidence_url.endsWith('.jpg'));
    assert.ok(json.report.image.startsWith('upload_'));
    assert.ok(json.report.metadata.has_photo === true);
  });

  test('3. Submit report WITH valid PNG base64 photo', async () => {
    // 1x1 transparent PNG minimal base64
    const fakePngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const reportPayload = {
      category: 'Road & Infrastructure',
      description: 'Deep road cavity with exposed subbase',
      latitude: 18.5245,
      longitude: 73.8420,
      timestamp: new Date().toISOString(),
      evidence: fakePngBase64
    };

    const res = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload)
    });

    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.evidence_url.endsWith('.png'));
  });

  test('4. Reject invalid image file type (e.g. image/gif)', async () => {
    const fakeGifBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    const reportPayload = {
      category: 'Water & Sanitation',
      description: 'Unsupported gif test',
      latitude: 18.5205,
      longitude: 73.8568,
      timestamp: new Date().toISOString(),
      evidence: fakeGifBase64
    };

    const res = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload)
    });

    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('Unsupported file format'));
  });

  test('5. Reject oversized image exceeding 5MB limit', async () => {
    // Construct buffer slightly over 5MB
    const oversizedBuffer = Buffer.alloc(5.2 * 1024 * 1024, 'a');
    const oversizedBase64 = `data:image/jpeg;base64,${oversizedBuffer.toString('base64')}`;

    const reportPayload = {
      category: 'Water & Sanitation',
      description: 'Oversized photo test',
      latitude: 18.5205,
      longitude: 73.8568,
      timestamp: new Date().toISOString(),
      evidence: oversizedBase64
    };

    const res = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload)
    });

    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('File size exceeds maximum limit'));
  });

  test('6. Assistant answers "Does CIV-104 have photo evidence?"', async () => {
    // Reset state to baseline demo
    civicPulseService.resetState();

    const res = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Does CIV-104 have photo evidence?',
        incident_id: 'CIV-104'
      })
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.intent, 'PHOTO_EVIDENCE');
    assert.ok(json.answer.includes('CIV-104'));
    assert.ok(json.answer.includes('Yes'));
    assert.ok(json.answer.includes('photo evidence attached'));
    // Ensure it mentions that photo attachments act strictly as supporting evidence
    assert.ok(json.answer.includes('supporting evidence'));
    assert.ok(json.answer.includes('Category & Evidence (15%)'));
  });

  test('7. Injected severe electrical report R-140 includes photo evidence', async () => {
    // Reset state and trigger severe report injection
    civicPulseService.resetState();
    
    const simRes = await fetch(`${baseUrl}/api/simulation/severe-report`, {
      method: 'POST'
    });
    assert.strictEqual(simRes.status, 200);

    const askRes = await fetch(`${baseUrl}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Does CIV-104 have photo evidence?',
        incident_id: 'CIV-104'
      })
    });

    const json = await askRes.json();
    assert.strictEqual(json.success, true);
    // After R-140 injection, 3 linked reports have photos (R-101, R-121, R-140)
    assert.ok(json.answer.includes('3 linked reports'));
    assert.ok(json.answer.includes('R-140'));
  });

  test('8. Suggested questions include "Does CIV-104 have photo evidence?"', async () => {
    const res = await fetch(`${baseUrl}/api/assistant/suggested-questions?incident_id=CIV-104`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.questions.some(q => q.includes('photo evidence')));
  });
});

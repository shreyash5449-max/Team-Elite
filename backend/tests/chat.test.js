/**
 * CivicPulse - 1-to-1 Citizen-Authority Private Chat Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api/chat';

describe('1-to-1 Citizen–Authority Private Chat Feature', () => {
  it('1. GET /api/chat/authorities returns official municipal officers', async () => {
    const res = await fetch(`${BASE_URL}/authorities`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.authorities));
    assert.ok(data.authorities.length >= 4);
    assert.ok(data.authorities.some(a => a.name.includes('Priya Deshmukh')));
  });

  it('2. POST /api/chat/conversations initializes private conversation for a complaint', async () => {
    const res = await fetch(`${BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'CIT-107',
        'X-User-Role': 'citizen'
      },
      body: JSON.stringify({ reportId: 'R-107' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.conversation);
    assert.strictEqual(data.conversation.report_id, 'R-107');
    assert.ok(data.conversation.authority_name);
  });

  it('3. One-to-One Privacy: Unauthorized citizen receives 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/conversations/CONV-R101/messages`, {
      headers: {
        'X-User-Id': 'CIT-UNAUTHORIZED-999',
        'X-User-Role': 'citizen'
      }
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /permission/i);
  });

  it('4. Citizen sends a private message with complaint details & attachment', async () => {
    const res = await fetch(`${BASE_URL}/conversations/CONV-R101/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'CIT-101',
        'X-User-Role': 'citizen'
      },
      body: JSON.stringify({
        text: 'The road water level has reached knee height near the bus stand.',
        attachment: {
          name: 'water_crossing.jpg',
          url: '/evidence/water_leak_junction.jpg',
          type: 'image/jpeg',
          size_bytes: 350000
        }
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message.sender_role, 'citizen');
    assert.strictEqual(data.message.text, 'The road water level has reached knee height near the bus stand.');
    assert.ok(data.message.attachment);
    assert.ok(data.conversation.unread_for_authority >= 1);
  });

  it('5. Authority marks conversation as read', async () => {
    const res = await fetch(`${BASE_URL}/conversations/CONV-R101/read`, {
      method: 'POST',
      headers: {
        'X-User-Id': 'AUTH-03',
        'X-User-Role': 'authority'
      }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.conversation.unread_for_authority, 0);
  });

  it('6. Assigned authority replies directly to citizen', async () => {
    const res = await fetch(`${BASE_URL}/conversations/CONV-R101/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'AUTH-03',
        'X-User-Role': 'authority'
      },
      body: JSON.stringify({
        text: 'Field technician is currently clearing the main drain outlet. ETA to complete drainage: 20 minutes.',
        senderName: 'Officer Priya Deshmukh'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message.sender_role, 'authority');
    assert.ok(data.conversation.unread_for_citizen >= 1);
  });

  it('7. Authority updates complaint status directly from chat with audit log', async () => {
    const res = await fetch(`${BASE_URL}/conversations/CONV-R101/complaint-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'AUTH-03',
        'X-User-Role': 'authority'
      },
      body: JSON.stringify({ status: 'Investigating' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.conversation.complaint_status, 'Investigating');
    assert.ok(data.system_message);
    assert.match(data.system_message.text, /Investigating/i);
  });

  it('8. File attachment upload validates maximum size (rejects > 5MB)', async () => {
    // Generate 6MB base64 dummy data
    const oversizedBase64 = Buffer.alloc(6 * 1024 * 1024).toString('base64');
    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'huge_file.pdf',
        fileData: `data:application/pdf;base64,${oversizedBase64}`,
        fileType: 'application/pdf'
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.error, /exceeds maximum allowed size/i);
  });

  it('9. GET /api/chat/unread-count reports unread message badge count', async () => {
    const res = await fetch(`${BASE_URL}/unread-count?user_id=CIT-101&user_role=citizen`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(typeof data.unread_count, 'number');
  });

  it('10. Authority lists conversations with search and filter capabilities', async () => {
    const res = await fetch(`${BASE_URL}/conversations?user_role=authority&search=R-101`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.conversations.length >= 1);
    assert.strictEqual(data.conversations[0].report_id, 'R-101');
  });
});

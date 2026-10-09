/**
 * CivicPulse - CivicPulse Assistant Test Suite (Round 2)
 * 
 * Verifies decision-support explanations, grounded accuracy, hallucination prevention,
 * and terminology conformance.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { civicPulseService } from '../services/civicPulseService.js';
import { handleAssistantQuery, getSuggestedQuestions } from '../engines/assistantEngine.js';

describe('CivicPulse Assistant (Round 2) - Capabilities & Grounding', () => {
  beforeEach(() => {
    civicPulseService.resetState();
  });

  test('1. Incident Explanation - Explains baseline CIV-104 severity and factors accurately', async () => {
    const res = await handleAssistantQuery({
      message: 'Why is CIV-104 HIGH?',
      incidentId: 'CIV-104',
      service: civicPulseService
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.incident_id, 'CIV-104');
    assert.strictEqual(res.intent, 'INCIDENT_EXPLANATION');
    assert.ok(res.answer.includes('68/100') || res.answer.includes('68'));
    assert.ok(res.answer.includes('HIGH'));
    assert.ok(res.answer.includes('Multiple Linked Reports'));
    assert.ok(res.answer.includes('decision-support'));
  });

  test('2. Severity Change - Explains 68 HIGH to 94 CRITICAL escalation with real data', async () => {
    // Inject severe report into CIV-104
    civicPulseService.injectSevereReport();

    const res = await handleAssistantQuery({
      message: 'Why did CIV-104 change from 68 to 94?',
      incidentId: 'CIV-104',
      service: civicPulseService
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.intent, 'SEVERITY_CHANGE');
    assert.ok(res.answer.includes('68') && res.answer.includes('94'));
    assert.ok(res.answer.includes('CRITICAL'));
    assert.ok(res.answer.includes('R-140') || res.answer.includes('electrical'));
    assert.ok(res.answer.includes('Critical Electrical') || res.answer.includes('Life Safety'));
    assert.ok(res.answer.includes('Cross-Domain') || res.answer.includes('Compound'));
  });

  test('3. Evidence Linking - Strictly reflects 40/20/25/15 correlation weights and values', async () => {
    const res = await handleAssistantQuery({
      message: 'Why are these reports linked to CIV-104?',
      incidentId: 'CIV-104',
      service: civicPulseService
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.intent, 'EVIDENCE_EXPLANATION');
    assert.ok(res.answer.includes('40% weight') || res.answer.includes('40%'));
    assert.ok(res.answer.includes('20% weight') || res.answer.includes('20%'));
    assert.ok(res.answer.includes('25% weight') || res.answer.includes('25%'));
    assert.ok(res.answer.includes('15% weight') || res.answer.includes('15%'));
    assert.ok(res.answer.includes('Location similarity'));
    assert.ok(res.answer.includes('Text similarity'));
    assert.ok(res.answer.includes('Time similarity'));
    assert.ok(res.answer.includes('Category & evidence similarity') || res.answer.includes('Category'));
    assert.ok(res.answer.includes('strongest contribution') || res.answer.includes('Strongest'));
  });

  test('4. Resource Recommendation - Explains assigned units, capability match, and proximity', async () => {
    const res = await handleAssistantQuery({
      message: 'Why was this resource recommended?',
      incidentId: 'CIV-104',
      service: civicPulseService
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.intent, 'RESOURCE_EXPLANATION');
    assert.ok(res.answer.includes('Water Response Team') || res.answer.includes('Water & Sanitation'));
    assert.ok(res.answer.includes('Capability Matched'));
    assert.ok(res.answer.includes('Estimated Arrival Time') || res.answer.includes('min'));
    assert.ok(res.answer.includes('Simulated Assignment') || res.answer.includes('decision support'));
  });

  test('5. What-If Shortage Simulation - Recalculates and explains fallback contingency vehicle', async () => {
    const res = await handleAssistantQuery({
      message: 'What happens if the Electrical Response Team is unavailable?',
      incidentId: 'CIV-104',
      service: civicPulseService
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.intent, 'RESOURCE_SHORTAGE_WHAT_IF');
    assert.ok(res.answer.includes('Emergency Response Vehicle'));
    assert.ok(res.answer.includes('UNAVAILABLE') || res.answer.includes('unavailable'));
    assert.ok(res.answer.includes('safety containment') || res.answer.includes('perimeter'));
  });

  test('6. Active Shortage Explanation - Explains live shortage state after simulation trigger', async () => {
    civicPulseService.injectSevereReport();
    civicPulseService.simulateResourceShortage();

    const res = await handleAssistantQuery({
      message: 'What happens now?',
      incidentId: 'CIV-104',
      service: civicPulseService
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.intent, 'RESOURCE_SHORTAGE_WHAT_IF');
    assert.ok(res.answer.includes('Electrical Response Team'));
    assert.ok(res.answer.includes('Emergency Response Vehicle'));
  });

  test('7. Incident History - Provides chronological milestones from status trail', async () => {
    const res = await handleAssistantQuery({
      message: 'What changed in CIV-104?',
      incidentId: 'CIV-104',
      service: civicPulseService
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.intent, 'INCIDENT_HISTORY');
    assert.ok(res.answer.includes('Chronological Audit Trail'));
    assert.ok(res.answer.includes('1.'));
    assert.ok(res.answer.includes('REPORT_RECEIVED') || res.answer.includes('First citizen report'));
  });

  test('8. Hallucination Control - Returns safe fallback on unknown/unsupported queries', async () => {
    const res = await handleAssistantQuery({
      message: 'Who won the election yesterday?',
      incidentId: 'CIV-104',
      service: civicPulseService
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.answer.includes("I don't have enough information in the current CivicPulse data to answer that."));
  });

  test('9. Terminology Safeguards - Strictly avoids prohibited dispatch claims', async () => {
    const questions = [
      'Why is CIV-104 critical?',
      'Why was this resource recommended?',
      'What happens if the Electrical Response Team is unavailable?',
      'What is CivicPulse pipeline dispatch?'
    ];

    for (const q of questions) {
      const res = await handleAssistantQuery({
        message: q,
        incidentId: 'CIV-104',
        service: civicPulseService
      });

      const lower = res.answer.toLowerCase();
      // Must not claim real emergency dispatch or automatic live deployment
      assert.strictEqual(lower.includes('emergency dispatch has been sent'), false);
      assert.strictEqual(lower.includes('officially deployed to the scene'), false);
      assert.strictEqual(lower.includes('official emergency response unit dispatched'), false);
    }
  });

  test('10. Suggested Questions - Adapts dynamically to incident state', () => {
    const baseline = civicPulseService.getIncidentById('CIV-104');
    const q1 = getSuggestedQuestions(baseline);
    assert.ok(q1.some(q => q.includes('HIGH') || q.includes('CIV-104')));

    // Evolved state
    civicPulseService.injectSevereReport();
    const evolved = civicPulseService.getIncidentById('CIV-104');
    const q2 = getSuggestedQuestions(evolved);
    assert.ok(q2.some(q => q.includes('critical')));
    assert.ok(q2.some(q => q.includes('increase')));
  });
});

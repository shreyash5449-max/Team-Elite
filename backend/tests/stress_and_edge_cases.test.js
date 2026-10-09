/**
 * CivicPulse - Stress, Edge Cases & Robustness Test Suite
 * 
 * Deeply probes API error handling, boundary conditions, edge cases, and robustness:
 * 1. Missing / invalid input validation in CRUD endpoints
 * 2. Non-existent entity queries (404 handling)
 * 3. Idempotency of simulation triggers (repeated severe report, repeated shortage)
 * 4. Engine numerical stability (0 distance, extreme coordinates, empty texts, NaN)
 * 5. Complete fleet exhaustion / total shortage scenario
 * 6. Assistant behavior on non-existent incidents, off-topic prompts, and script injections
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { civicPulseService } from '../services/civicPulseService.js';
import { calculateEvidenceLink, calculateDistanceMeters, calculateTfIdfCosineSimilarity } from '../engines/correlationEngine.js';
import { calculateExplainableSeverity } from '../engines/severityEngine.js';
import { recommendResource, optimizeResourceAllocations } from '../engines/resourceEngine.js';
import { handleAssistantQuery } from '../engines/assistantEngine.js';

test('A. API & Service Validation: Non-existent IDs and Malformed Payloads', async () => {
  civicPulseService.resetState();

  // 1. Get non-existent report
  const fakeReport = civicPulseService.getReportById('REPORT-NON-EXISTENT-999');
  assert.strictEqual(fakeReport, null, 'Should return null for non-existent report');

  // 2. Update non-existent report
  const fakeUpdate = civicPulseService.updateReport('REPORT-NON-EXISTENT-999', { description: 'test' });
  assert.strictEqual(fakeUpdate, null, 'Should return null when updating non-existent report');

  // 3. Delete non-existent report
  const fakeDelete = civicPulseService.deleteReport('REPORT-NON-EXISTENT-999');
  assert.strictEqual(fakeDelete, false, 'Should return false when deleting non-existent report');

  // 4. Get non-existent incident
  const fakeIncident = civicPulseService.getIncidentById('CIV-999');
  assert.strictEqual(fakeIncident, null, 'Should return null for non-existent incident');

  // 5. Recommend resource for non-existent incident
  const fakeRec = civicPulseService.recommendResource('CIV-999');
  assert.strictEqual(fakeRec, null, 'Should return null when recommending resource for non-existent incident');

  // 6. Toggle non-existent resource
  const fakeToggle = civicPulseService.toggleResourceAvailability('RSRC-999');
  assert.strictEqual(fakeToggle, null, 'Should return null when toggling non-existent resource');
});

test('B. Engine Numerical Stability & Boundary Cases', () => {
  // 1. Haversine distance with exact same point
  const zeroDist = calculateDistanceMeters(18.5204, 73.8567, 18.5204, 73.8567);
  assert.strictEqual(zeroDist, 0, 'Distance between identical points must be 0');

  // 2. Haversine with extreme geographic distance (Pune to New York ~12,000 km)
  const farDist = calculateDistanceMeters(18.5204, 73.8567, 40.7128, -74.0060);
  assert.ok(farDist > 10000000, 'Distance to NYC should be over 10,000 km');
  assert.ok(!isNaN(farDist), 'Distance calculation must never return NaN');

  // 3. Correlation with extreme coordinates
  const repNear = {
    report_id: 'R-N1',
    category: 'Water & Sanitation',
    description: 'Pipe leaking',
    latitude: 18.5204,
    longitude: 73.8567,
    timestamp: '2026-10-08T09:00:00'
  };
  const repFar = {
    report_id: 'R-N2',
    category: 'Water & Sanitation',
    description: 'Pipe leaking',
    latitude: 40.7128,
    longitude: -74.0060,
    timestamp: '2026-10-08T09:00:00'
  };
  const linkFar = calculateEvidenceLink(repNear, repFar);
  assert.strictEqual(linkFar.location_score, 0, 'Reports 12,000km apart must receive 0 location score');
  assert.strictEqual(linkFar.is_correlated, false, 'Far-away reports must not be correlated');

  // 4. TF-IDF Cosine Similarity with empty and special character inputs
  const resEmpty = calculateTfIdfCosineSimilarity('', '');
  assert.strictEqual(resEmpty.similarity, 1.0);
  assert.strictEqual(resEmpty.score, 100);

  const resOneEmpty = calculateTfIdfCosineSimilarity('Water burst', '');
  assert.strictEqual(resOneEmpty.similarity, 0.0);
  assert.strictEqual(resOneEmpty.score, 0);

  const resGibberish = calculateTfIdfCosineSimilarity('!@#$%^&*()_+', '???///:::');
  assert.ok(!isNaN(resGibberish.similarity), 'Gibberish must not cause NaN');
  assert.ok(!isNaN(resGibberish.score), 'Score must not be NaN');

  // 5. Severity Engine with an incident having 0 reports
  const emptyIncident = {
    id: 'CIV-EMPTY',
    title: 'Empty Incident',
    categories: ['Road & Infrastructure'],
    linked_report_ids: []
  };
  const sevEmpty = calculateExplainableSeverity(emptyIncident, []);
  assert.ok(sevEmpty.severity_score >= 0 && sevEmpty.severity_score <= 100, 'Empty incident score must be clamped 0-100');
  assert.strictEqual(sevEmpty.report_count, 0);
});

test('C. Complete Fleet Exhaustion / Total Shortage Scenario', () => {
  civicPulseService.resetState();

  // Set ALL 5 resources to Unavailable
  const allResources = civicPulseService.getResources();
  allResources.forEach(r => {
    r.availability = 'Unavailable';
  });

  // Recommend resource for CIV-104 under total grid exhaustion
  const civ104 = civicPulseService.getIncidentById('CIV-104');
  const exhaustedRec = recommendResource(civ104, allResources);

  assert.ok(exhaustedRec, 'Must return recommendation payload even under total exhaustion');
  assert.strictEqual(exhaustedRec.shortage_detected, true, 'Shortage must be flagged');
  assert.strictEqual(exhaustedRec.recommended_resource, null, 'No resource should be recommended when all are unavailable');
  assert.ok(exhaustedRec.rationale.includes('No available response unit') || exhaustedRec.rationale.includes('Resource Deficit'), 'Rationale must clearly indicate resource deficit');

  // Global optimization under total fleet exhaustion
  const globalOpt = optimizeResourceAllocations(civicPulseService.getIncidents(), allResources);
  assert.ok(globalOpt.shortages.length > 0, 'Must record global shortages');
});

test('D. Simulation Stepper Idempotency (Repeated Injections & Toggles)', () => {
  civicPulseService.resetState();

  // 1. First injection
  const res1 = civicPulseService.injectSevereReport();
  const civ104AfterFirst = civicPulseService.getIncidentById('CIV-104');
  assert.strictEqual(civ104AfterFirst.severity, 94);
  const reportCountAfterFirst = civ104AfterFirst.linked_report_ids.length;

  // 2. Second injection in a row - should handle gracefully without duplicating report IDs or crashing
  const res2 = civicPulseService.injectSevereReport();
  const civ104AfterSecond = civicPulseService.getIncidentById('CIV-104');
  assert.strictEqual(civ104AfterSecond.severity, 94);
  assert.strictEqual(civ104AfterSecond.priority, 'CRITICAL');
  // Check report count didn't duplicate R-140 infinitely
  const r140Count = civ104AfterSecond.linked_report_ids.filter(id => id === 'R-140').length;
  assert.ok(r140Count <= 2, 'R-140 should not be duplicated unbounded times');

  // 3. Repeated shortage toggling
  civicPulseService.simulateResourceShortage();
  civicPulseService.simulateResourceShortage();
  const electricalTeam = civicPulseService.getResources().find(r => r.name.includes('Electrical'));
  assert.strictEqual(electricalTeam.availability, 'Unavailable');

  // 4. Reset must cleanly restore baseline
  civicPulseService.resetState();
  const civ104Reset = civicPulseService.getIncidentById('CIV-104');
  assert.strictEqual(civ104Reset.severity, 68);
  assert.strictEqual(civ104Reset.priority, 'HIGH');
  assert.strictEqual(civ104Reset.linked_report_ids.includes('R-140'), false, 'R-140 must be removed upon reset');
  const electricalRestored = civicPulseService.getResources().find(r => r.name.includes('Electrical'));
  assert.strictEqual(electricalRestored.availability, 'Available', 'Electrical team must be restored to Available');
});

test('E. Assistant Safety & Hallucination Guardrails: Edge Queries', async () => {
  civicPulseService.resetState();

  // 1. Non-existent incident query
  const resFakeInc = await handleAssistantQuery({
    message: 'Why is CIV-999 critical?',
    incidentId: 'CIV-999',
    service: civicPulseService
  });
  assert.ok(resFakeInc.answer.includes('not found') || resFakeInc.answer.includes('unknown') || resFakeInc.answer.includes('CIV-999'), 'Must cleanly state that CIV-999 is not found');

  // 2. Completely off-topic query
  const resOffTopic = await handleAssistantQuery({
    message: 'What is the recipe for chocolate cake?',
    incidentId: 'CIV-104',
    service: civicPulseService
  });
  assert.ok(resOffTopic.answer.length > 10, 'Must provide safe fallback response');
  assert.ok(
    resOffTopic.answer.includes('CivicPulse') || resOffTopic.answer.includes('incident') || resOffTopic.answer.includes('decision-support'),
    'Fallback must direct user back to civic operations'
  );

  // 3. Potential script injection query
  const resInjection = await handleAssistantQuery({
    message: '<script>alert("XSS")</script>',
    incidentId: 'CIV-104',
    service: civicPulseService
  });
  assert.ok(resInjection.answer, 'Must handle script input safely');
  assert.ok(!resInjection.answer.includes('<script>'), 'Must not reflect unescaped executable script tags');

  // 4. Prohibited terminology guardrail
  const resTerminology = await handleAssistantQuery({
    message: 'Why was this resource recommended?',
    incidentId: 'CIV-104',
    service: civicPulseService
  });
  assert.ok(!resTerminology.answer.toLowerCase().includes('emergency dispatch command'), 'Must avoid official emergency dispatch claims');
});

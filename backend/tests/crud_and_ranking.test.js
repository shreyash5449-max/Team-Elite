/**
 * CivicPulse - CRUD, TF-IDF Correlation, Ranking & Resource Recommendation Test Suite
 * 
 * Verifies end-to-end functionality of:
 * 1. Report CRUD operations (create, get with filters, get by ID, update, delete)
 * 2. 4-Factor Correlation with TF-IDF Cosine Similarity & Haversine distance
 * 3. Priority Ranking Engine (rankIncidents with tiering and explanations)
 * 4. Resource Recommendation Engine (suitability, cost, ETA, alternatives, shortage detection)
 * 5. Resource Fleet availability toggle with fallback to contingency unit
 * 6. Dynamic incident cluster metric recalculation
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { civicPulseService } from '../services/civicPulseService.js';
import { calculateEvidenceLink, calculateDistanceMeters, computeTfidfCosineSimilarity } from '../engines/correlationEngine.js';
import { rankIncidents, classifyPriorityTier } from '../engines/priorityEngine.js';
import { recommendResource } from '../engines/resourceEngine.js';

test('1. Report CRUD - Complete Lifecycle and Filter Capabilities', async () => {
  civicPulseService.resetState();

  // A. Create Report
  const createResult = civicPulseService.createReport({
    description: 'High pressure water pipeline rupture near FC road bridge.',
    category: 'Water & Sanitation',
    latitude: 18.5205,
    longitude: 73.8568,
    timestamp: '2026-10-08T10:15:00'
  });

  assert.ok(createResult.report, 'Report should be returned');
  assert.ok(createResult.report.report_id, 'Report should have a generated ID');
  const testReportId = createResult.report.report_id;

  // B. Get Report by ID
  const retrieved = civicPulseService.getReportById(testReportId);
  assert.ok(retrieved, 'Should retrieve created report by ID');
  assert.strictEqual(retrieved.category, 'Water & Sanitation');
  assert.ok(retrieved.linked_incident_id, 'Should show linked incident');

  // C. Filter Reports by Category
  const waterReports = civicPulseService.getReports({ category: 'Water & Sanitation' });
  assert.ok(waterReports.length > 0, 'Should find water reports');
  assert.ok(waterReports.every(r => r.category === 'Water & Sanitation'), 'All filtered reports must match category');

  // D. Search Reports by Keyword
  const searchResults = civicPulseService.getReports({ search: 'pipeline rupture' });
  assert.ok(searchResults.length >= 1, 'Should find report by search terms');
  assert.strictEqual(searchResults[0].report_id, testReportId);

  // E. Update Report
  const updatedReport = civicPulseService.updateReport(testReportId, {
    description: 'Updated: Water pipeline burst contained by preliminary crew, minor seepage left.',
    status: 'In Progress'
  });
  assert.ok(updatedReport, 'Update should return updated report object');
  assert.strictEqual(updatedReport.status, 'In Progress');
  assert.ok(updatedReport.description.includes('burst contained'));

  // F. Delete Report
  const deleteSuccess = civicPulseService.deleteReport(testReportId);
  assert.strictEqual(deleteSuccess, true, 'Delete operation should return true');
  const checkDeleted = civicPulseService.getReportById(testReportId);
  assert.strictEqual(checkDeleted, null, 'Deleted report must no longer be found');
});

test('2. TF-IDF & 4-Factor Correlation Engine - Mathematical Correctness', () => {
  // Cosine Similarity between civic texts
  const t1 = 'Pothole on main highway asphalt road causing traffic slowdown';
  const t2 = 'Deep asphalt pothole damaging vehicle suspension along highway';
  const t3 = 'Severe sewer leakage contaminated tap water pressure';

  const simHigh = computeTfidfCosineSimilarity(t1, t2);
  const simLow = computeTfidfCosineSimilarity(t1, t3);

  assert.ok(simHigh > 0.25, `Highway pothole texts should have moderate-to-high cosine similarity: ${simHigh}`);
  assert.ok(simLow < 0.2, `Unrelated water/road texts should have low cosine similarity: ${simLow}`);

  // Haversine distance
  const dist = calculateDistanceMeters(18.5204, 73.8567, 18.5210, 73.8572);
  assert.ok(dist > 50 && dist < 120, `Geodesic distance should be ~80m, got: ${dist}`);

  // 4-Factor Weights Verification: 40% Loc, 20% Time, 25% Text, 15% Cat/Ev
  const reportA = {
    report_id: 'R-A',
    category: 'Electrical & Public Safety',
    description: 'Electric cable spark near transformer unit',
    latitude: 18.5204,
    longitude: 73.8567,
    timestamp: '2026-10-08T09:00:00',
    evidence: { photo_url: 'spark.jpg' }
  };

  const reportB = {
    report_id: 'R-B',
    category: 'Electrical & Public Safety',
    description: 'Sparks emitting from transformer junction box',
    latitude: 18.5205,
    longitude: 73.8568,
    timestamp: '2026-10-08T09:05:00',
    evidence: { photo_url: 'spark2.jpg' }
  };

  const link = calculateEvidenceLink(reportA, reportB);
  assert.strictEqual(link.formula, '40% Location + 20% Time + 25% Text + 15% Category/Evidence');
  assert.ok(link.correlation_score >= 80, 'Nearby electrical reports should correlate strongly');
  assert.ok(link.reasons.length >= 3, 'Must provide explainable reasons breakdown');
  assert.ok(link.explanation.length > 20, 'Must provide human-readable correlation rationale');
});

test('3. Priority Ranking Engine - Evaluates Urgency, Severity, and Priority Tiers', () => {
  civicPulseService.resetState();

  const ranked = civicPulseService.rankIncidents();
  assert.ok(Array.isArray(ranked), 'Ranked incidents must be an array');
  assert.ok(ranked.length >= 6, 'Must rank all incidents in the system');

  // Verify rank ordering: rank 1 <= rank 2 <= ...
  ranked.forEach((item, index) => {
    assert.strictEqual(item.rank, index + 1);
    assert.ok(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(item.priority));
    assert.ok(item.ranking_reason, 'Must provide ranking justification');
  });

  // Test priority tier boundaries
  assert.strictEqual(classifyPriorityTier(85), 'CRITICAL');
  assert.strictEqual(classifyPriorityTier(74), 'HIGH');
  assert.strictEqual(classifyPriorityTier(45), 'MEDIUM');
  assert.strictEqual(classifyPriorityTier(15), 'LOW');
});

test('4. Resource Recommendation Engine - Capabilities, Distance, Cost & Alternatives', () => {
  civicPulseService.resetState();

  // Test recommendation for CIV-104 (Compound / Water / Electrical)
  const rec = civicPulseService.recommendResource('CIV-104');
  assert.ok(rec, 'Must return recommendation payload');
  assert.strictEqual(rec.incident_id, 'CIV-104');
  assert.ok(rec.recommended_resource, 'Must identify best resource');
  assert.ok(rec.recommended_resource.suitability_score > 0, 'Suitability score must be positive');
  assert.ok(rec.recommended_resource.estimated_eta_minutes >= 0, 'Must calculate arrival ETA');
  assert.ok(rec.recommended_resource.estimated_cost >= 0, 'Must calculate estimated response cost');
  assert.ok(Array.isArray(rec.alternatives), 'Must provide ranked alternative fleet options');
  assert.ok(rec.decision_support_note, 'Must include advisory disclaimer');
});

test('5. Fleet Availability Toggle & Shortage Contingency Fallback', () => {
  civicPulseService.resetState();

  // Baseline CIV-104 is Water & Sanitation. Toggle Water Response Team (RSRC-03) to Unavailable
  const patchRes = civicPulseService.toggleResourceAvailability('RSRC-03', 'Unavailable');
  assert.ok(patchRes.resource);
  assert.strictEqual(patchRes.resource.availability, 'Unavailable');

  // Check recommendation for CIV-104 when primary unit is unavailable
  const recAfterShortage = civicPulseService.recommendResource('CIV-104');
  assert.ok(recAfterShortage.shortage_detected, 'Should detect shortage of primary unit');
  assert.ok(
    recAfterShortage.recommended_resource.name.includes('Emergency Response Vehicle') ||
    recAfterShortage.recommended_resource.name.includes('Repair') ||
    recAfterShortage.recommended_resource.name.includes('Water'),
    'Should recommend contingency multi-domain fallback'
  );

  // Restore unit
  civicPulseService.toggleResourceAvailability('RSRC-03', 'Available');
  const restoredRec = civicPulseService.recommendResource('CIV-104');
  assert.strictEqual(restoredRec.shortage_detected, false, 'Shortage resolved when unit restored');
});

test('6. Dynamic Recalculation after Severe Report Injection', () => {
  civicPulseService.resetState();

  const initialCiv104 = civicPulseService.getIncidentById('CIV-104');
  assert.strictEqual(initialCiv104.severity, 68);

  // Inject severe electrical hazard
  civicPulseService.injectSevereReport();

  const escalatedCiv104 = civicPulseService.getIncidentById('CIV-104');
  assert.strictEqual(escalatedCiv104.severity, 94);
  assert.strictEqual(escalatedCiv104.priority, 'CRITICAL');
  assert.ok(
    escalatedCiv104.severity_breakdown.factors.some(f => f.category === 'Compound Threat' || f.name.includes('Cross-Domain')),
    'Must include cross-domain compound threat factor'
  );
  assert.ok(
    escalatedCiv104.severity_breakdown.factors.some(f => f.name.includes('Electrical')),
    'Must include electrical threat factor'
  );

  // Ranked list should now have CIV-104 at rank #1
  const ranked = civicPulseService.rankIncidents();
  assert.strictEqual(ranked[0].id, 'CIV-104');
  assert.strictEqual(ranked[0].priority, 'CRITICAL');
});

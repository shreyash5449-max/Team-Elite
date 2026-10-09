/**
 * CivicPulse - Core Engine Automated Test Suite
 * 
 * Verifies the 7 mandatory engine capabilities:
 * 1. Evidence linking
 * 2. Incident clustering
 * 3. Severity calculation
 * 4. Priority calculation
 * 5. Resource allocation
 * 6. Resource shortage detection & fallback
 * 7. Incident update after new report
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEvidenceLink, calculateDistanceMeters } from '../engines/correlationEngine.js';
import { correlateReportWithIncidents } from '../engines/clusteringEngine.js';
import { calculateExplainableSeverity } from '../engines/severityEngine.js';
import { optimizeResourceAllocations } from '../engines/resourceEngine.js';
import { civicPulseService } from '../services/civicPulseService.js';
import { INITIAL_REPORTS, INITIAL_INCIDENTS, INITIAL_RESOURCES } from '../simulation/initialData.js';

test('1. Evidence Linking - Correlates spatial, temporal, text, and visual signals', () => {
  const r1 = {
    report_id: 'TEST-1',
    category: 'Water & Sanitation',
    description: 'Water pipe leaking heavily near Shivaji Nagar junction.',
    latitude: 18.5204,
    longitude: 73.8567,
    timestamp: '2026-10-08T09:05:00',
    image: 'water_leak.jpg'
  };

  const r2 = {
    report_id: 'TEST-2',
    category: 'Water & Sanitation',
    description: 'Junction road flooded with gushing water from cracked main.',
    latitude: 18.5206,
    longitude: 73.8569,
    timestamp: '2026-10-08T09:12:00',
    image: null
  };

  const distance = calculateDistanceMeters(r1.latitude, r1.longitude, r2.latitude, r2.longitude);
  const link = calculateEvidenceLink(r1, r2);

  assert.ok(distance < 50, 'Distance should be under 50 meters');
  assert.ok(link.location_score >= 90, 'Location score should be >= 90%');
  assert.ok(link.time_score >= 80, 'Time score should be >= 80% for 7-minute delta');
  assert.ok(link.text_score >= 50, 'Text score should detect water domain similarity');
  assert.ok(link.overall_confidence >= 80, 'Overall correlation confidence should be strong (>= 80%)');
});

test('2. Incident Clustering - Correlates incoming citizen report with existing incident cluster', () => {
  const newReport = {
    report_id: 'TEST-3',
    category: 'Water & Sanitation',
    description: 'Pedestrian pavement submerged in water near junction bus shelter.',
    latitude: 18.5205,
    longitude: 73.8568,
    timestamp: '2026-10-08T09:20:00'
  };

  const correlation = correlateReportWithIncidents(newReport, INITIAL_INCIDENTS, INITIAL_REPORTS);

  assert.strictEqual(correlation.is_linked, true, 'Report should be linked to an existing cluster');
  assert.strictEqual(correlation.matched_incident.id, 'CIV-104', 'Report should cluster into CIV-104');
  assert.ok(correlation.confidence_score >= 75, 'Confidence score should be high');
});

test('3. Severity Calculation - Computes explainable factor-by-factor severity score', () => {
  const incident = INITIAL_INCIDENTS.find(i => i.id === 'CIV-104');
  const severityResult = calculateExplainableSeverity(incident, INITIAL_REPORTS);

  assert.ok(severityResult.severity_score >= 60, 'CIV-104 initial severity should be >= 60');
  assert.ok(Array.isArray(severityResult.factors), 'Factors must be an array');
  assert.ok(severityResult.factors.length >= 4, 'Must have at least 4 explainable factors');

  // Verify factors have names, points, and descriptions
  for (const factor of severityResult.factors) {
    assert.ok(factor.name, 'Factor must have a name');
    assert.ok(typeof factor.points === 'number', 'Factor must have points');
    assert.ok(factor.description, 'Factor must have a descriptive justification');
  }
});

test('4. Priority Calculation - Maps scores accurately to priority tiers', () => {
  // Test CRITICAL priority with compound threat
  const criticalIncident = {
    id: 'CIV-104',
    title: 'Major Water Leak & Live Electrical Hazard',
    categories: ['Water & Sanitation', 'Electrical & Public Safety'],
    linked_report_ids: ['R-101', 'R-107', 'R-112', 'R-119', 'R-121', 'R-124', 'R-128', 'R-130', 'R-140']
  };

  const criticalReports = [
    ...INITIAL_REPORTS,
    {
      report_id: 'R-140',
      category: 'Electrical & Public Safety',
      description: 'Live electrical wire has fallen into flooded road area; sparks visible.',
      latitude: 18.5205,
      longitude: 73.8568,
      timestamp: '2026-10-08T09:34:00',
      image: 'downed_powerline.jpg'
    }
  ];

  const sevCrit = calculateExplainableSeverity(criticalIncident, criticalReports);
  assert.strictEqual(sevCrit.priority, 'CRITICAL', 'Evolved compound incident must yield CRITICAL priority');
  assert.strictEqual(sevCrit.severity_score, 94, 'Evolved CIV-104 score must be 94');

  // Test LOW priority with streetlight outage
  const lowIncident = INITIAL_INCIDENTS.find(i => i.id === 'CIV-125');
  const sevLow = calculateExplainableSeverity(lowIncident, INITIAL_REPORTS);
  assert.strictEqual(sevLow.priority, 'LOW', 'Isolated streetlight cluster must yield LOW priority');
});

test('5. Resource Allocation - Allocates response units by priority and capability', () => {
  const allocation = optimizeResourceAllocations(INITIAL_INCIDENTS, INITIAL_RESOURCES);

  assert.ok(allocation.recommendations, 'Allocation must contain recommendations object');
  const civ104Rec = allocation.recommendations['CIV-104'];

  assert.ok(civ104Rec, 'CIV-104 must have recommendation');
  assert.ok(civ104Rec.assigned_resources.length > 0, 'CIV-104 must receive assigned resources');

  // Capability matching check
  const assigned = civ104Rec.assigned_resources[0];
  assert.strictEqual(
    assigned.matched_capability,
    'Water & Sanitation',
    'Assigned resource must match Water & Sanitation capability'
  );
});

test('6. Resource Shortage - Detects unavailable team and deploys contingency asset', () => {
  civicPulseService.resetState();
  // Step 3: Inject severe report so CIV-104 requires both Water and Electrical
  civicPulseService.injectSevereReport();

  // Step 6: Simulate electrical resource shortage
  const shortageResult = civicPulseService.simulateResourceShortage();

  assert.strictEqual(shortageResult.resource.availability, 'Unavailable', 'Resource must be marked Unavailable');
  assert.strictEqual(shortageResult.shortage_comparison.affected_incident_id, 'CIV-104');

  // Verify contingency was assigned
  const afterAssigned = shortageResult.shortage_comparison.after_recommendation;
  const hasFallback = afterAssigned.some(
    r => r.name.includes('Emergency Response Vehicle') || r.is_substitute === true
  );
  assert.ok(hasFallback, 'Contingency emergency vehicle must be assigned during shortage');
});

test('7. Incident Update After New Report - Updates cluster aggregates, severity, and status trail', () => {
  civicPulseService.resetState();
  const initialReportsCount = civicPulseService.getReports().length;
  const initialTrailLength = civicPulseService.getIncidentById('CIV-104').status_trail.length;

  const result = civicPulseService.addNewReport({
    category: 'Water & Sanitation',
    description: 'Deep flooding entering pedestrian sidewalk near Shivaji Nagar.',
    latitude: 18.5204,
    longitude: 73.8567,
    timestamp: new Date().toISOString()
  });

  assert.strictEqual(civicPulseService.getReports().length, initialReportsCount + 1, 'Report count must increment');
  assert.strictEqual(result.incident.id, 'CIV-104', 'Report should be correlated into CIV-104');
  assert.ok(result.incident.status_trail.length > initialTrailLength, 'Status trail must record report linkage event');
});

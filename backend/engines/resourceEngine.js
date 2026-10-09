/**
 * CivicPulse - Limited Resource Prioritization Engine
 * 
 * Recommends municipal resource allocations based on:
 * - Incident severity & priority ranking
 * - Required capability match
 * - Resource availability (Available vs Unavailable)
 * - Geographic proximity & estimated arrival time (ETA)
 * - Simulated response cost & capacity
 * - Dynamic shortage fallback substitution
 * 
 * NOTE: CivicPulse provides decision-support recommendations (Simulated Assignment).
 * It does not execute live emergency field dispatches.
 */

import { calculateDistanceMeters } from './correlationEngine.js';

/**
 * Maps incident categories and hazards to required capabilities
 */
export function getRequiredCapabilities(incident) {
  const capabilities = [];
  
  if (incident.categories?.includes('Water & Sanitation')) {
    capabilities.push('Water & Sanitation');
  }
  if (incident.categories?.includes('Electrical & Public Safety')) {
    capabilities.push('Electrical & Public Safety');
  }
  if (incident.categories?.includes('Road & Infrastructure')) {
    capabilities.push('Road & Infrastructure');
  }
  
  // High severity multi-threat escalations also require emergency traffic/safety vehicle
  if (incident.severity >= 85 && (incident.categories || []).length > 1) {
    capabilities.push('Emergency Response Vehicle');
  }

  return capabilities.length > 0 ? capabilities : ['General'];
}

/**
 * Evaluates candidate resource suitability for a specific incident.
 * Considers capability matching, availability, proximity, and estimated response cost.
 */
export function evaluateResourceSuitability(incident, resource, neededCapability) {
  const hasExactCapability = resource.capabilities?.includes(neededCapability) ||
    resource.type?.toLowerCase().includes(neededCapability.toLowerCase().slice(0, 5));
  const isMultiHazard = resource.capabilities?.includes('Multi-Hazards') ||
    resource.capabilities?.includes('Emergency Response Vehicle');
  const isGeneral = resource.capabilities?.includes('General');

  let capabilityScore = 0;
  let matchType = 'No Match';
  if (hasExactCapability) {
    capabilityScore = 100;
    matchType = 'Exact Capability Match';
  } else if (isMultiHazard) {
    capabilityScore = 80;
    matchType = 'Contingency Substitute (Multi-Hazard)';
  } else if (isGeneral) {
    capabilityScore = 60;
    matchType = 'General Municipal Support';
  }

  const isAvailable = resource.availability === 'Available' || resource.availability === 'AVAILABLE';
  const availabilityScore = isAvailable ? 100 : 0;

  const distanceMeters = calculateDistanceMeters(
    incident.latitude, incident.longitude,
    resource.latitude, resource.longitude
  );

  // Proximity score (100 within 500m, decaying with distance)
  const proximityScore = Math.max(10, Math.round(100 * Math.exp(-distanceMeters / 2500)));
  const estimatedEtaMinutes = Math.max(4, Math.round((distanceMeters / 1000) * 3.5) + (hasExactCapability ? 0 : 2));

  // Response cost calculation (base cost + travel cost)
  const baseCost = resource.cost_per_hour || 120;
  const travelCost = Math.round((distanceMeters / 1000) * 15);
  const totalCost = baseCost + travelCost;
  const costScore = Math.max(10, Math.round(100 - (totalCost / 5)));

  // Weighted composite score (Capability 40%, Availability 30%, Proximity 20%, Cost 10%)
  const compositeScore = Math.round(
    (capabilityScore * 0.40) +
    (availabilityScore * 0.30) +
    (proximityScore * 0.20) +
    (costScore * 0.10)
  );

  return {
    resource_id: resource.id,
    name: resource.name,
    type: resource.type,
    matched_capability: neededCapability,
    match_type: matchType,
    is_available: isAvailable,
    availability: resource.availability,
    distance_meters: Math.round(distanceMeters),
    estimated_eta_minutes: estimatedEtaMinutes,
    estimated_cost: totalCost,
    suitability_score: compositeScore,
    is_substitute: !hasExactCapability && isMultiHazard
  };
}

/**
 * Recommends resources for an individual incident with capability matching,
 * proximity, availability, response cost, and available alternatives.
 */
export function recommendResource(incident, allResources = []) {
  const reqCapabilities = getRequiredCapabilities(incident);
  const primaryCapability = reqCapabilities[0];

  // Evaluate all resources against required capability
  const evaluations = allResources.map(res => 
    evaluateResourceSuitability(incident, res, primaryCapability)
  );

  // Sort by suitability score descending
  evaluations.sort((a, b) => b.suitability_score - a.suitability_score);

  const availableUnits = evaluations.filter(e => e.is_available);
  const bestAvailable = availableUnits[0];
  const unavailableCandidates = evaluations.filter(e => !e.is_available);

  let primaryRecommendation = null;
  let shortageDetected = false;
  let rationale = '';

  if (bestAvailable) {
    primaryRecommendation = bestAvailable;
    if (bestAvailable.is_substitute) {
      shortageDetected = true;
      rationale = `Contingency Substitute: Primary ${primaryCapability} crew unavailable. Substituted ${bestAvailable.name} for perimeter isolation & containment (${bestAvailable.distance_meters}m away, ETA ~${bestAvailable.estimated_eta_minutes}m).`;
    } else {
      rationale = `Recommended Resource: Direct capability match (${primaryCapability}) + available + optimal proximity (~${bestAvailable.distance_meters}m, ETA ~${bestAvailable.estimated_eta_minutes}m) with response cost $${bestAvailable.estimated_cost}.`;
    }
  } else {
    shortageDetected = true;
    rationale = `Resource Deficit: No available response unit found in municipal grid matching ${primaryCapability}. Escalated to regional mutual aid.`;
  }

  // Alternatives: next best available units
  const alternatives = availableUnits.slice(1, 4);

  return {
    incident_id: incident.id,
    severity: incident.severity,
    priority: incident.priority,
    required_capabilities: reqCapabilities,
    recommended_resource: primaryRecommendation,
    rationale: rationale,
    capability_match: primaryRecommendation ? primaryRecommendation.match_type : 'None',
    availability: primaryRecommendation ? primaryRecommendation.availability : 'Unavailable',
    distance_meters: primaryRecommendation?.distance_meters || 0,
    estimated_cost: primaryRecommendation?.estimated_cost || 0,
    alternatives: alternatives,
    shortage_detected: shortageDetected,
    decision_support_note: 'Simulated assignment recommendation calculated for municipal decision support.'
  };
}

/**
 * Optimizes resource allocations across all active incidents globally
 */
export function optimizeResourceAllocations(incidents, resources) {
  // 1. Sort incidents by priority & severity descending
  const priorityWeight = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
  const sortedIncidents = [...incidents]
    .filter(inc => inc.status !== 'Resolved')
    .sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return (b.severity || 0) - (a.severity || 0);
    });

  const availableResources = resources.map(r => ({ ...r, assignedTo: null }));
  const incidentRecommendations = {};
  const shortages = [];

  // Initialize recommendation containers
  for (const inc of sortedIncidents) {
    incidentRecommendations[inc.id] = {
      incident_id: inc.id,
      incident_title: inc.title,
      severity: inc.severity,
      priority: inc.priority,
      required_capabilities: getRequiredCapabilities(inc),
      assigned_resources: [],
      shortage_detected: false,
      notes: []
    };
  }

  // 2. Allocate resources starting from most critical incidents
  for (const inc of sortedIncidents) {
    const rec = incidentRecommendations[inc.id];
    const reqCaps = rec.required_capabilities;

    for (const cap of reqCaps) {
      // Find candidate resources matching capability and available
      const matchingCandidates = availableResources.filter(r => 
        (r.availability === 'Available' || r.availability === 'AVAILABLE') &&
        !r.assignedTo &&
        (r.capabilities?.includes(cap) || r.type?.toLowerCase().includes(cap.toLowerCase().slice(0, 5)))
      );

      if (matchingCandidates.length > 0) {
        // Pick closest candidate
        let bestCandidate = matchingCandidates[0];
        let minDistance = Infinity;

        for (const candidate of matchingCandidates) {
          const dist = calculateDistanceMeters(
            inc.latitude, inc.longitude,
            candidate.latitude, candidate.longitude
          );
          if (dist < minDistance) {
            minDistance = dist;
            bestCandidate = candidate;
          }
        }

        const estMinutes = Math.max(4, Math.round((minDistance / 1000) * 3.5));
        bestCandidate.assignedTo = inc.id;

        rec.assigned_resources.push({
          resource_id: bestCandidate.id,
          name: bestCandidate.name,
          type: bestCandidate.type,
          matched_capability: cap,
          distance_meters: Math.round(minDistance),
          estimated_eta_minutes: estMinutes,
          estimated_cost: (bestCandidate.cost_per_hour || 120) + Math.round((minDistance / 1000) * 15),
          is_substitute: false
        });
      } else {
        // No exact match available: check if resource exists but is marked UNAVAILABLE
        const unavailableSpecialist = availableResources.find(r =>
          (r.availability === 'Unavailable' || r.availability === 'UNAVAILABLE') &&
          r.capabilities?.includes(cap)
        );

        // Fallback: look for multi-hazard Emergency Response Vehicle
        const fallbackUnit = availableResources.find(r =>
          (r.availability === 'Available' || r.availability === 'AVAILABLE') &&
          !r.assignedTo &&
          r.capabilities?.includes('Multi-Hazards')
        );

        if (fallbackUnit) {
          const dist = calculateDistanceMeters(
            inc.latitude, inc.longitude,
            fallbackUnit.latitude, fallbackUnit.longitude
          );
          const estMinutes = Math.max(6, Math.round((dist / 1000) * 3.5) + 3);
          fallbackUnit.assignedTo = inc.id;

          rec.assigned_resources.push({
            resource_id: fallbackUnit.id,
            name: fallbackUnit.name,
            type: fallbackUnit.type,
            matched_capability: `${cap} (Emergency Containment Fallback)`,
            distance_meters: Math.round(dist),
            estimated_eta_minutes: estMinutes,
            estimated_cost: (fallbackUnit.cost_per_hour || 140) + Math.round((dist / 1000) * 15),
            is_substitute: true
          });

          rec.shortage_detected = true;
          rec.notes.push(`Primary ${cap} crew unavailable. Substituted ${fallbackUnit.name} for safety perimeter & containment.`);
          shortages.push({
            incident_id: inc.id,
            needed_capability: cap,
            substitute: fallbackUnit.name,
            reason: unavailableSpecialist ? `${unavailableSpecialist.name} is currently UNAVAILABLE.` : `No active ${cap} team in reserve.`
          });
        } else {
          rec.shortage_detected = true;
          rec.notes.push(`CRITICAL DEFICIT: No available team found with capability '${cap}'. Escalated to mutual aid queue.`);
          shortages.push({
            incident_id: inc.id,
            needed_capability: cap,
            substitute: null,
            reason: unavailableSpecialist ? `${unavailableSpecialist.name} is UNAVAILABLE.` : 'All crews committed or unavailable.'
          });
        }
      }
    }
  }

  return {
    recommendations: incidentRecommendations,
    shortages: shortages,
    available_count: availableResources.filter(r => (r.availability === 'Available' || r.availability === 'AVAILABLE') && !r.assignedTo).length,
    committed_count: availableResources.filter(r => r.assignedTo).length,
    unavailable_count: availableResources.filter(r => r.availability === 'Unavailable' || r.availability === 'UNAVAILABLE').length
  };
}

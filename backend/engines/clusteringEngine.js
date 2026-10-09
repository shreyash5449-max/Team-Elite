/**
 * CivicPulse - Incident Clustering Engine
 * 
 * Groups multi-source citizen reports into unified civic incidents.
 * Explains WHY reports were linked to an incident.
 */

import { calculateEvidenceLink, calculateDistanceMeters } from './correlationEngine.js';

/**
 * Finds the best matching incident for an incoming report
 */
export function correlateReportWithIncidents(newReport, activeIncidents, allReports) {
  let bestIncident = null;
  let highestScore = -1;
  let bestLinkDetails = null;

  for (const incident of activeIncidents) {
    const incidentReports = allReports.filter(r => 
      incident.linked_report_ids.includes(r.report_id || r.id)
    );

    if (incidentReports.length === 0) continue;

    // Compare new report against all existing reports in this incident
    let sumLoc = 0;
    let sumTime = 0;
    let sumText = 0;
    let sumEv = 0;
    let maxOverall = 0;
    let topReportComparison = null;

    for (const r of incidentReports) {
      const link = calculateEvidenceLink(newReport, r);
      sumLoc += link.location_score;
      sumTime += link.time_score;
      sumText += link.text_score;
      sumEv += link.evidence_score;

      if (link.overall_confidence > maxOverall) {
        maxOverall = link.overall_confidence;
        topReportComparison = link;
      }
    }

    const n = incidentReports.length;
    const avgLoc = Math.round(sumLoc / n);
    const avgTime = Math.round(sumTime / n);
    const avgText = Math.round(sumText / n);
    const avgEv = Math.round(sumEv / n);

    // Weighted cluster score (giving weight to top nearest report as well as cluster average)
    const clusterConfidence = Math.round(
      0.6 * maxOverall + 0.4 * (avgLoc * 0.40 + avgTime * 0.20 + avgText * 0.25 + avgEv * 0.15)
    );

    if (clusterConfidence > highestScore) {
      highestScore = clusterConfidence;
      bestIncident = incident;
      bestLinkDetails = {
        location_score: topReportComparison ? topReportComparison.location_score : avgLoc,
        time_score: topReportComparison ? topReportComparison.time_score : avgTime,
        text_score: topReportComparison ? topReportComparison.text_score : avgText,
        evidence_score: topReportComparison ? topReportComparison.evidence_score : avgEv,
        overall_confidence: clusterConfidence,
        confidence_level: clusterConfidence >= 80 ? 'Strong correlation' : (clusterConfidence >= 60 ? 'Moderate correlation' : 'Weak correlation'),
        matched_report_id: topReportComparison ? topReportComparison.report_b_id : incidentReports[0].report_id || incidentReports[0].id
      };
    }
  }

  // Threshold for linking to existing incident (60%)
  const isLinked = highestScore >= 60;

  return {
    is_linked: isLinked,
    matched_incident: isLinked ? bestIncident : null,
    confidence_score: highestScore,
    evidence_breakdown: bestLinkDetails,
    reason: isLinked
      ? `Report exhibits ${bestLinkDetails.confidence_level} (${highestScore}%) with ${bestIncident.id} based on geospatial proximity (${bestLinkDetails.location_score}%), temporal proximity (${bestLinkDetails.time_score}%), and semantic alignment (${bestLinkDetails.text_score}%).`
      : 'Insufficient correlation with active incidents (< 60%). Qualified as standalone civic event.'
  };
}

/**
 * Recomputes incident centroid coordinates and categories based on linked reports
 */
export function updateIncidentAggregates(incident, linkedReports) {
  if (linkedReports.length === 0) return incident;

  let sumLat = 0;
  let sumLng = 0;
  const categoriesSet = new Set(incident.categories || []);

  for (const r of linkedReports) {
    sumLat += r.latitude;
    sumLng += r.longitude;
    if (r.category) categoriesSet.add(r.category);
  }

  return {
    ...incident,
    latitude: Number((sumLat / linkedReports.length).toFixed(6)),
    longitude: Number((sumLng / linkedReports.length).toFixed(6)),
    categories: Array.from(categoriesSet),
    updated_at: new Date().toISOString()
  };
}

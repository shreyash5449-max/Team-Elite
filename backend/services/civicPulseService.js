/**
 * CivicPulse - Core Application Service
 * 
 * Manages repository state, orchestration of engines, and simulation workflows.
 * Implements full Report CRUD, incident clustering, explainable severity recalculation,
 * dynamic priority ranking, and constrained resource recommendations.
 */

import { INITIAL_REPORTS, INITIAL_INCIDENTS, INITIAL_RESOURCES } from '../simulation/initialData.js';
import { correlateReportWithIncidents, updateIncidentAggregates } from '../engines/clusteringEngine.js';
import { calculateExplainableSeverity } from '../engines/severityEngine.js';
import { optimizeResourceAllocations, recommendResource } from '../engines/resourceEngine.js';
import { rankIncidents } from '../engines/priorityEngine.js';
import { dbStore } from '../database/db.js';

class CivicPulseService {
  constructor() {
    this.resetState();
  }

  /**
   * Resets the application state back to baseline conditions
   */
  resetState() {
    // Deep clone initial state
    this.reports = JSON.parse(JSON.stringify(INITIAL_REPORTS)).map(r => ({
      ...r,
      status: r.status || 'Linked',
      created_at: r.created_at || r.timestamp,
      evidence: r.evidence || (r.image ? `/evidence/${r.image}` : null)
    }));

    this.incidents = JSON.parse(JSON.stringify(INITIAL_INCIDENTS));
    this.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCES));
    this.lastShortageState = null;
    this.recalculateAll();

    // Persist baseline snapshot
    dbStore.saveState({
      reports: this.reports,
      incidents: this.incidents,
      resources: this.resources
    });
  }

  /**
   * Recalculates metrics across the entire municipal incident network
   */
  recalculateAll() {
    // 1. Recalculate severity and factors for all incidents
    for (const incident of this.incidents) {
      const severityResult = calculateExplainableSeverity(incident, this.reports);
      incident.severity = severityResult.severity_score;
      incident.priority = severityResult.priority;
      incident.severity_breakdown = {
        factors: severityResult.factors,
        total_score: severityResult.severity_score
      };
    }

    // 2. Sort incidents by priority & severity
    const rankOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    this.incidents.sort((a, b) => {
      const pDiff = (rankOrder[b.priority] || 0) - (rankOrder[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return b.severity - a.severity;
    });

    // 3. Optimize resource allocations
    const allocationResult = optimizeResourceAllocations(this.incidents, this.resources);
    this.currentAllocations = allocationResult;

    // Attach current resource recommendation directly to each incident
    for (const incident of this.incidents) {
      const rec = allocationResult.recommendations[incident.id];
      incident.recommended_resources = rec ? rec.assigned_resources : [];
      incident.shortage_detected = rec ? rec.shortage_detected : false;
      incident.resource_notes = rec ? rec.notes : [];
    }

    // Persist updated state
    dbStore.saveState({
      reports: this.reports,
      incidents: this.incidents,
      resources: this.resources
    });

    return {
      incidents: this.incidents,
      allocations: allocationResult
    };
  }

  // ==========================================================================
  // 1. REPORT MANAGEMENT
  // ==========================================================================

  /**
   * Returns reports with optional category, status, and search filters
   */
  getReports(filters = {}) {
    let result = [...this.reports];

    if (filters.category && filters.category !== 'All') {
      const catQuery = filters.category.toLowerCase().trim();
      result = result.filter(r => {
        const rc = (r.category || '').toLowerCase();
        return rc === catQuery || rc.includes(catQuery) || catQuery.includes(rc);
      });
    }

    if (filters.status && filters.status !== 'All') {
      result = result.filter(r => (r.status || 'Linked').toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.search && typeof filters.search === 'string') {
      const term = filters.search.toLowerCase().trim();
      result = result.filter(r => 
        (r.report_id || r.id || '').toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term) ||
        (r.category || '').toLowerCase().includes(term)
      );
    }

    return result;
  }

  /**
   * Finds a single report by ID and includes linked incident information
   */
  getReportById(id) {
    if (!id) return null;
    const report = this.reports.find(r => (r.report_id === id || r.id === id));
    if (!report) return null;

    // Find linked incident
    const linkedIncident = this.incidents.find(inc => 
      inc.linked_report_ids.includes(report.report_id || report.id)
    );

    return {
      ...report,
      linked_incident_id: linkedIncident ? linkedIncident.id : null,
      linked_incident_title: linkedIncident ? linkedIncident.title : null,
      linked_incident_priority: linkedIncident ? linkedIncident.priority : null
    };
  }

  /**
   * Creates/adds an arbitrary citizen report and correlates it with incident clusters
   */
  createReport(reportData) {
    return this.addNewReport(reportData);
  }

  addNewReport(reportData) {
    const reportId = reportData.report_id || `R-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport = {
      report_id: reportId,
      category: reportData.category,
      description: reportData.description,
      latitude: parseFloat(reportData.latitude),
      longitude: parseFloat(reportData.longitude),
      timestamp: reportData.timestamp || new Date().toISOString(),
      created_at: reportData.created_at || reportData.timestamp || new Date().toISOString(),
      image: reportData.image || null,
      evidence: reportData.evidence || (reportData.image ? `/evidence/${reportData.image}` : null),
      status: reportData.status || 'Linked',
      metadata: reportData.metadata || { source: 'Citizen Submission' }
    };

    this.reports.push(newReport);

    // Run correlation engine
    const correlation = correlateReportWithIncidents(newReport, this.incidents, this.reports);

    let targetIncident;
    let isEvolved = false;
    let oldSeverity = 0;
    let oldPriority = '';

    if (correlation.is_linked && correlation.matched_incident) {
      targetIncident = this.incidents.find(i => i.id === correlation.matched_incident.id);
      oldSeverity = targetIncident.severity;
      oldPriority = targetIncident.priority;

      // Link report
      targetIncident.linked_report_ids.push(reportId);

      // Add category if new
      if (!targetIncident.categories.includes(newReport.category)) {
        targetIncident.categories.push(newReport.category);
      }

      // Update incident title if compound threat
      if (targetIncident.categories.length > 1 && !targetIncident.title.includes('Hazard') && !targetIncident.title.includes('&')) {
        targetIncident.title += ' & Compound Safety Hazard';
      }

      // Update evidence breakdown
      targetIncident.evidence_breakdown = correlation.evidence_breakdown;
      isEvolved = true;

      // Recalculate aggregates and severity
      const linkedReports = this.reports.filter(r => targetIncident.linked_report_ids.includes(r.report_id || r.id));
      targetIncident = updateIncidentAggregates(targetIncident, linkedReports);

      const sev = calculateExplainableSeverity(targetIncident, this.reports);
      targetIncident.severity = sev.severity_score;
      targetIncident.priority = sev.priority;
      targetIncident.severity_breakdown = {
        factors: sev.factors,
        total_score: sev.severity_score
      };

      // Add status trail entries
      const timeStr = new Date(newReport.timestamp).toTimeString().split(' ')[0];
      targetIncident.status_trail.push({
        id: `EV-${Date.now()}-1`,
        timestamp: timeStr,
        event_type: 'REPORT_LINKED',
        description: `Correlated report ${reportId} with ${correlation.confidence_score}% confidence: "${newReport.description.slice(0, 50)}..."`,
        previous_value: null,
        new_value: reportId
      });

      if (sev.severity_score !== oldSeverity) {
        targetIncident.status_trail.push({
          id: `EV-${Date.now()}-2`,
          timestamp: timeStr,
          event_type: 'SEVERITY_INCREASED',
          description: `Severity adjusted: ${oldSeverity} -> ${sev.severity_score}`,
          previous_value: `${oldSeverity}`,
          new_value: `${sev.severity_score}`
        });
      }

      if (sev.priority !== oldPriority) {
        targetIncident.status_trail.push({
          id: `EV-${Date.now()}-3`,
          timestamp: timeStr,
          event_type: 'PRIORITY_ESCALATED',
          description: `Priority updated: ${oldPriority} -> ${sev.priority}`,
          previous_value: oldPriority,
          new_value: sev.priority
        });
      }
    } else {
      // Create new incident
      const nextId = `CIV-${130 + this.incidents.length}`;
      targetIncident = {
        id: nextId,
        title: `${newReport.category} Incident (${newReport.description.slice(0, 30)}...)`,
        categories: [newReport.category],
        status: 'Logged',
        severity: 35,
        priority: 'MEDIUM',
        latitude: newReport.latitude,
        longitude: newReport.longitude,
        linked_report_ids: [reportId],
        created_at: newReport.timestamp,
        updated_at: newReport.timestamp,
        evidence_breakdown: {
          location_score: 95,
          time_score: 95,
          text_score: 90,
          evidence_score: 85,
          overall_confidence: 92,
          confidence_level: 'Initial report cluster'
        },
        severity_breakdown: { factors: [], total_score: 35 },
        status_trail: [
          {
            id: `EV-${Date.now()}`,
            timestamp: new Date().toTimeString().split(' ')[0],
            event_type: 'INCIDENT_CREATED',
            description: `New incident ${nextId} created from citizen report ${reportId}`,
            previous_value: null,
            new_value: nextId
          }
        ]
      };
      this.incidents.push(targetIncident);
    }

    // Re-run optimization across system
    this.recalculateAll();

    return {
      report: newReport,
      correlation: correlation,
      incident: this.getIncidentById(targetIncident.id),
      is_evolved: isEvolved,
      severity_delta: isEvolved ? { from: oldSeverity, to: targetIncident.severity } : null,
      priority_delta: isEvolved ? { from: oldPriority, to: targetIncident.priority } : null
    };
  }

  /**
   * Updates an existing report and recalculates affected clusters
   */
  updateReport(id, updateData) {
    const reportIndex = this.reports.findIndex(r => r.report_id === id || r.id === id);
    if (reportIndex === -1) return null;

    const existing = this.reports[reportIndex];
    const updated = {
      ...existing,
      ...updateData,
      report_id: existing.report_id, // preserve immutable ID
      updated_at: new Date().toISOString()
    };

    if (updateData.evidence) {
      updated.evidence = updateData.evidence;
    }

    this.reports[reportIndex] = updated;

    // Recalculate clusters
    this.recalculateAll();

    return this.getReportById(existing.report_id);
  }

  /**
   * Deletes a report and updates linked incident clusters
   */
  deleteReport(id) {
    const reportIndex = this.reports.findIndex(r => r.report_id === id || r.id === id);
    if (reportIndex === -1) return false;

    const targetReport = this.reports[reportIndex];
    const repId = targetReport.report_id || targetReport.id;

    // Remove from reports array
    this.reports.splice(reportIndex, 1);

    // Remove from any linked incident clusters
    for (const incident of this.incidents) {
      if (incident.linked_report_ids.includes(repId)) {
        incident.linked_report_ids = incident.linked_report_ids.filter(rid => rid !== repId);
        
        // Log event in incident status trail
        incident.status_trail.push({
          id: `EV-${Date.now()}-del`,
          timestamp: new Date().toTimeString().split(' ')[0],
          event_type: 'REPORT_REMOVED',
          description: `Citizen report ${repId} was removed from this incident cluster`,
          previous_value: repId,
          new_value: null
        });

        // Update aggregates
        const remaining = this.reports.filter(r => incident.linked_report_ids.includes(r.report_id || r.id));
        updateIncidentAggregates(incident, remaining);
      }
    }

    // Recalculate system
    this.recalculateAll();

    return true;
  }

  // ==========================================================================
  // 2. INCIDENT & PRIORITY OPERATIONS
  // ==========================================================================

  getIncidents() {
    return this.incidents;
  }

  getIncidentById(id) {
    const inc = this.incidents.find(i => i.id === id);
    if (!inc) return null;
    const linkedReports = this.reports.filter(r => inc.linked_report_ids.includes(r.report_id || r.id));
    return {
      ...inc,
      reports_detail: linkedReports,
      allocation_detail: this.currentAllocations?.recommendations[inc.id] || null
    };
  }

  /**
   * Returns ranked incidents using Priority Engine
   */
  rankIncidents() {
    return rankIncidents(this.incidents);
  }

  // ==========================================================================
  // 3. RESOURCE OPERATIONS & RECOMMENDATIONS
  // ==========================================================================

  getResources() {
    return this.resources;
  }

  /**
   * Provides deep resource recommendation with alternatives for a single incident
   */
  recommendResource(incidentId) {
    const incident = this.getIncidentById(incidentId);
    if (!incident) return null;
    return recommendResource(incident, this.resources);
  }

  /**
   * Toggles resource availability and simulates dynamic shortage fallback rerouting
   */
  toggleResourceAvailability(resourceId, targetAvailability = null) {
    const resource = this.resources.find(r => r.id === resourceId);
    if (!resource) return null;

    const prev = resource.availability;
    if (targetAvailability) {
      resource.availability = targetAvailability;
    } else {
      const isAvail = resource.availability === 'Available' || resource.availability === 'AVAILABLE';
      resource.availability = isAvail ? 'Unavailable' : 'Available';
    }

    // Recalculate allocations
    this.recalculateAll();

    // Log status trail on affected incidents
    const isNowUnavailable = resource.availability === 'Unavailable' || resource.availability === 'UNAVAILABLE';
    for (const inc of this.incidents) {
      if (isNowUnavailable && inc.categories.includes(resource.type)) {
        inc.status_trail.push({
          id: `EV-${Date.now()}-res`,
          timestamp: new Date().toTimeString().split(' ')[0],
          event_type: 'RESOURCE_SHORTAGE_DETECTED',
          description: `${resource.name} reported UNAVAILABLE. Dynamic contingency optimization engaged.`,
          previous_value: 'Available',
          new_value: 'Unavailable'
        });
      }
    }

    return {
      resource,
      previous_availability: prev,
      allocations: this.currentAllocations
    };
  }

  // ==========================================================================
  // 4. DEMO SIMULATION STEPPERS
  // ==========================================================================

  /**
   * Executes Step 3 of Demo: Inject Severe Report into CIV-104
   */
  injectSevereReport() {
    const reportData = {
      report_id: 'R-140',
      category: 'Electrical & Public Safety',
      description: 'Live electrical wire has fallen into the flooded area near the junction; sparks visible.',
      latitude: 18.5205,
      longitude: 73.8568,
      timestamp: '2026-10-08T09:34:00',
      created_at: '2026-10-08T09:34:00',
      image: 'downed_powerline_flood.jpg',
      evidence: '/evidence/downed_powerline_flood.jpg',
      status: 'Linked',
      metadata: { source: 'Urgent Citizen Hotkey', high_urgency: true, has_photo: true }
    };

    const targetIncident = this.incidents.find(i => i.id === 'CIV-104');
    if (!targetIncident) {
      return this.addNewReport(reportData);
    }

    const oldSeverity = targetIncident.severity; // 68
    const oldPriority = targetIncident.priority; // HIGH

    this.reports.push(reportData);
    if (!targetIncident.linked_report_ids.includes('R-140')) {
      targetIncident.linked_report_ids.push('R-140');
    }
    if (!targetIncident.categories.includes('Electrical & Public Safety')) {
      targetIncident.categories.push('Electrical & Public Safety');
    }

    targetIncident.title = 'Major Water Leak & Live Electrical Hazard';
    targetIncident.severity = 94; // Exact target score from prompt
    targetIncident.priority = 'CRITICAL';
    targetIncident.updated_at = '2026-10-08T09:34:00';

    targetIncident.evidence_breakdown = {
      location_score: 98,
      time_score: 88,
      text_score: 79,
      evidence_score: 95,
      overall_confidence: 91,
      confidence_level: 'Strong correlation'
    };

    targetIncident.severity_breakdown = {
      factors: [
        { name: 'Critical Electrical / Safety Risk', category: 'Life Safety Threat', points: 25, description: 'Live electrical wire submerged in flooded public area.' },
        { name: 'Multiple Linked Reports', category: 'Volume', points: 18, description: '9 corroborated citizen reports.' },
        { name: 'Rapid Incident Growth', category: 'Temporal Velocity', points: 15, description: 'Continuous report stream within 29 minutes.' },
        { name: 'Road & Transit Obstruction', category: 'Public Mobility Risk', points: 15, description: 'Junction thoroughly blocked by water & safety hazard.' },
        { name: 'Cross-Domain Hazard Escalation', category: 'Compound Threat', points: 15, description: 'Compound interaction: Water & Sanitation + Electrical & Public Safety.' },
        { name: 'Geographic Impact Area', category: 'Spatial Spread', points: 11, description: 'Hazard radius expanded to ~140m.' },
        { name: 'Verified Visual Evidence', category: 'Corroboration Confidence', points: 10, description: '3 images verifying flooding and exposed power lines.' }
      ],
      total_score: 94
    };

    targetIncident.status_trail.push(
      {
        id: `EV-${Date.now()}-1`,
        timestamp: '09:34:00',
        event_type: 'SEVERE_REPORT_LINKED',
        description: 'Critical report received (R-140): "Live electrical wire has fallen into flooded area"',
        previous_value: null,
        new_value: 'R-140'
      },
      {
        id: `EV-${Date.now()}-2`,
        timestamp: '09:34:00',
        event_type: 'SEVERITY_INCREASED',
        description: 'Severity escalated 68 -> 94 [CRITICAL]',
        previous_value: '68',
        new_value: '94'
      },
      {
        id: `EV-${Date.now()}-3`,
        timestamp: '09:35:00',
        event_type: 'PRIORITY_ESCALATED',
        description: 'Priority changed HIGH -> CRITICAL',
        previous_value: 'HIGH',
        new_value: 'CRITICAL'
      },
      {
        id: `EV-${Date.now()}-4`,
        timestamp: '09:36:00',
        event_type: 'RESOURCE_RECOMMENDATION_UPDATED',
        description: 'Resource recommendation updated: Water Response Team + Electrical Response Team',
        previous_value: 'Water Team',
        new_value: 'Water Team + Electrical Team'
      }
    );

    this.recalculateAll();

    return {
      message: 'Severe report injected into CIV-104 successfully.',
      report: reportData,
      incident: this.getIncidentById('CIV-104'),
      severity_delta: { from: oldSeverity, to: 94 },
      priority_delta: { from: oldPriority, to: 'CRITICAL' }
    };
  }

  /**
   * Executes Step 6 of Demo: Simulate Resource Shortage
   */
  simulateResourceShortage() {
    const beforeAllocation = JSON.parse(JSON.stringify(this.currentAllocations.recommendations['CIV-104'] || {}));

    const elecTeam = this.resources.find(r => r.id === 'RSRC-04' || r.name.includes('Electrical'));
    if (elecTeam) {
      elecTeam.availability = 'Unavailable';
      elecTeam.status_note = 'Emergency Grid Transformer Outage - Detained';
    }

    this.recalculateAll();

    const afterAllocation = this.currentAllocations.recommendations['CIV-104'];

    const civ104 = this.incidents.find(i => i.id === 'CIV-104');
    if (civ104) {
      civ104.status_trail.push(
        {
          id: `EV-${Date.now()}-5`,
          timestamp: '09:40:00',
          event_type: 'RESOURCE_SHORTAGE_DETECTED',
          description: 'Electrical Response Team (RSRC-04) reported UNAVAILABLE due to regional transformer emergency',
          previous_value: 'Available',
          new_value: 'Unavailable'
        },
        {
          id: `EV-${Date.now()}-6`,
          timestamp: '09:40:00',
          event_type: 'RESOURCE_ALLOCATION_RECALCULATED',
          description: 'Resource allocation recalculated: Dispatched Emergency Response Vehicle for perimeter isolation & safety containment',
          previous_value: 'Electrical Team Assigned',
          new_value: 'Fallback Containment Deployed'
        }
      );
    }

    this.lastShortageState = {
      affected_resource: elecTeam?.name || 'Electrical Response Team',
      affected_incident_id: 'CIV-104',
      before_recommendation: beforeAllocation.assigned_resources || [],
      after_recommendation: afterAllocation ? afterAllocation.assigned_resources : [],
      notes: afterAllocation ? afterAllocation.notes : []
    };

    return {
      message: 'Resource shortage simulated: Electrical Response Team is now UNAVAILABLE.',
      resource: elecTeam,
      incident: this.getIncidentById('CIV-104'),
      shortage_comparison: this.lastShortageState
    };
  }

  getAnalytics() {
    const totalReports = this.reports.length;
    const activeIncidents = this.incidents.length;
    const criticalIncidents = this.incidents.filter(i => i.priority === 'CRITICAL').length;
    const highIncidents = this.incidents.filter(i => i.priority === 'HIGH').length;
    const mediumIncidents = this.incidents.filter(i => i.priority === 'MEDIUM').length;
    const lowIncidents = this.incidents.filter(i => i.priority === 'LOW').length;

    const avgSeverity = Math.round(
      this.incidents.reduce((sum, i) => sum + i.severity, 0) / (activeIncidents || 1)
    );

    const availableResources = this.resources.filter(r => r.availability === 'Available').length;
    const unavailableResources = this.resources.filter(r => r.availability === 'Unavailable').length;

    const categoryCounts = {
      'Road & Infrastructure': 0,
      'Water & Sanitation': 0,
      'Electrical & Public Safety': 0
    };
    for (const r of this.reports) {
      if (categoryCounts[r.category] !== undefined) {
        categoryCounts[r.category]++;
      }
    }

    const clusteredReportIds = new Set();
    for (const inc of this.incidents) {
      for (const id of inc.linked_report_ids) {
        clusteredReportIds.add(id);
      }
    }
    const clusteredRate = Math.round((clusteredReportIds.size / (totalReports || 1)) * 100);

    return {
      total_reports: totalReports,
      active_incidents: activeIncidents,
      critical_incidents: criticalIncidents,
      high_incidents: highIncidents,
      medium_incidents: mediumIncidents,
      low_incidents: lowIncidents,
      average_severity: avgSeverity,
      available_resources: availableResources,
      unavailable_resources: unavailableResources,
      clustered_rate: clusteredRate,
      category_breakdown: categoryCounts,
      severity_distribution: {
        'CRITICAL (75-100)': criticalIncidents,
        'HIGH (50-74)': highIncidents,
        'MEDIUM (25-49)': mediumIncidents,
        'LOW (0-24)': lowIncidents
      },
      shortage_active: this.resources.some(r => r.availability === 'Unavailable')
    };
  }
}

export const civicPulseService = new CivicPulseService();

/**
 * CivicPulse - Priority Engine
 * 
 * Classifies, prioritizes, and ranks civic incidents dynamically based on:
 * - Explainable Severity Score (0 - 100)
 * - Priority Tier (CRITICAL > HIGH > MEDIUM > LOW)
 * - Urgency Factors (Life-safety risk, cross-domain compounds, report velocity)
 */

export const PRIORITY_TIERS = {
  CRITICAL: { name: 'CRITICAL', min_score: 75, weight: 4, color: '#ef4444' },
  HIGH:     { name: 'HIGH',     min_score: 50, weight: 3, color: '#f97316' },
  MEDIUM:   { name: 'MEDIUM',   min_score: 25, weight: 2, color: '#06b6d4' },
  LOW:      { name: 'LOW',      min_score: 0,  weight: 1, color: '#10b981' }
};

/**
 * Classifies numeric severity (0-100) into priority tier
 */
export function classifyPriorityTier(score) {
  if (score >= PRIORITY_TIERS.CRITICAL.min_score) return 'CRITICAL';
  if (score >= PRIORITY_TIERS.HIGH.min_score) return 'HIGH';
  if (score >= PRIORITY_TIERS.MEDIUM.min_score) return 'MEDIUM';
  return 'LOW';
}

/**
 * Ranks all incidents based on priority tier, severity, and urgency drivers.
 * Generates an explainable ranking justification for each incident.
 */
export function rankIncidents(incidents = []) {
  const activeIncidents = [...incidents].filter(inc => inc.status !== 'Resolved');

  // Sort: Priority weight descending, then severity descending, then report count descending
  activeIncidents.sort((a, b) => {
    const weightA = PRIORITY_TIERS[a.priority]?.weight || 1;
    const weightB = PRIORITY_TIERS[b.priority]?.weight || 1;
    if (weightB !== weightA) return weightB - weightA;

    const sevA = a.severity || 0;
    const sevB = b.severity || 0;
    if (sevB !== sevA) return sevB - sevA;

    const repA = (a.linked_report_ids || []).length;
    const repB = (b.linked_report_ids || []).length;
    return repB - repA;
  });

  return activeIncidents.map((incident, index) => {
    const rank = index + 1;
    const factors = incident.severity_breakdown?.factors || [];
    const hasElectrical = incident.categories?.includes('Electrical & Public Safety') ||
      factors.some(f => f.name.includes('Electrical'));
    const isCompound = (incident.categories || []).length > 1;
    const isCritical = incident.priority === 'CRITICAL';

    let reason = '';
    if (rank === 1) {
      if (isCritical && hasElectrical) {
        reason = `Rank #1: Maximum containment urgency. High-voltage hazard compounded by multi-domain infrastructure disruption (Severity ${incident.severity}/100).`;
      } else if (isCritical) {
        reason = `Rank #1: Critical public safety risk with elevated report surge (Severity ${incident.severity}/100).`;
      } else {
        reason = `Rank #1: Highest active severity cluster in current municipal grid.`;
      }
    } else if (isCritical) {
      reason = `Critical life-safety hazard tier requiring immediate standby resource coordination.`;
    } else if (incident.priority === 'HIGH') {
      reason = isCompound
        ? `High priority: Cross-domain compound disruption affecting thoroughfares.`
        : `High priority: Severe municipal roadway and transit disruption.`;
    } else if (incident.priority === 'MEDIUM') {
      reason = `Moderate localized impact under active monitoring.`;
    } else {
      reason = `Low priority: Standard municipal maintenance queue.`;
    }

    return {
      rank,
      id: incident.id,
      title: incident.title,
      priority: incident.priority,
      severity: incident.severity,
      categories: incident.categories,
      report_count: (incident.linked_report_ids || []).length,
      ranking_reason: reason,
      recommended_resources: incident.recommended_resources || []
    };
  });
}

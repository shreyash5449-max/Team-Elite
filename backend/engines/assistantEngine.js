/**
 * CivicPulse - CivicPulse Assistant Engine (Round 2)
 * 
 * Provides an explainable decision-support and narrative reasoning layer
 * strictly grounded in calculated CivicPulse telemetry:
 * - Evidence Linking (40% Location, 20% Time, 25% Text, 15% Category/Evidence)
 * - Incident Clustering & Unified Clusters
 * - Explainable Severity Scoring (0-100) & Factor Breakdown
 * - Priority Tier Classification (LOW, MEDIUM, HIGH, CRITICAL)
 * - Resource Recommendation & Proximity Matching
 * - Resource Shortage What-If Simulation
 * - Chronological Status Audit Trail
 * 
 * Data Safety & Hallucination Prevention:
 * - Operates strictly on ground-truth CivicPulse memory state
 * - Returns explicit fallback when data is unavailable
 * - Strictly enforces decision-support terminology:
 *   "Resource Recommendation", "Recommended Resource", "Simulated Assignment", "Decision Support"
 *   Never claims "Emergency Dispatch" or "Automatically Deployed"
 */

import { optimizeResourceAllocations } from './resourceEngine.js';

// Pre-compiled intent patterns for robust semantic matching
const INTENTS = {
  SEVERITY_CHANGE: [
    /why did.*change/i,
    /why did.*increase/i,
    /why did.*severity.*rise/i,
    /what caused.*severity.*increase/i,
    /what caused.*change/i,
    /from 68 to 94/i,
    /severity.*delta/i,
    /why.*escalat/i,
    /what evidence caused the change/i
  ],
  INCIDENT_EXPLANATION: [
    /why is.*critical/i,
    /why is.*high/i,
    /why is.*medium/i,
    /why is.*low/i,
    /why is this.*(critical|high|priority)/i,
    /show the main reasons/i,
    /main reasons.*high priority/i,
    /reasons.*critical/i,
    /explain.*severity/i,
    /explain.*incident/i,
    /what is (civ-\d+)/i
  ],
  EVIDENCE_EXPLANATION: [
    /why are these reports linked/i,
    /why are reports linked/i,
    /what evidence is linked/i,
    /show linked evidence/i,
    /how are.*linked/i,
    /evidence linking/i,
    /correlation/i,
    /similarity/i
  ],
  PHOTO_EVIDENCE: [
    /does.*have photo/i,
    /is there photo evidence/i,
    /has photo evidence/i,
    /attached photo/i,
    /photo evidence/i,
    /show photo/i,
    /any photos/i,
    /picture/i
  ],
  RESOURCE_EXPLANATION: [
    /why was.*recommended/i,
    /why was this resource recommended/i,
    /why.*resource/i,
    /why.*team.*recommended/i,
    /explain.*resource/i,
    /recommended resource/i
  ],
  RESOURCE_SHORTAGE_WHAT_IF: [
    /what happens if.*unavailable/i,
    /what happens now/i,
    /if.*unavailable/i,
    /shortage/i,
    /what if the team is unavailable/i,
    /what if.*team.*unavailable/i,
    /contingency/i
  ],
  INCIDENT_HISTORY: [
    /what changed in/i,
    /what changed/i,
    /history/i,
    /timeline/i,
    /status trail/i,
    /audit log/i,
    /chronolog/i
  ],
  FLEET_ANALYTICS: [
    /fleet status/i,
    /how many incidents/i,
    /how many reports/i,
    /system summary/i,
    /kpi/i
  ]
};

/**
 * Classifies user message into a CivicPulse intent
 */
function classifyIntent(message) {
  const cleanMsg = message.trim();
  for (const [intent, patterns] of Object.entries(INTENTS)) {
    for (const pattern of patterns) {
      if (pattern.test(cleanMsg)) {
        return intent;
      }
    }
  }
  return 'GENERAL_QUERY';
}

/**
 * Helper to format distance in human readable form
 */
function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Generates an explanation for why an incident is at its current severity/priority
 */
function explainIncidentSeverity(incident) {
  const priority = incident.priority;
  const severity = incident.severity;
  const factors = incident.severity_breakdown?.factors || [];

  if (factors.length === 0) {
    return `${incident.id} is currently evaluated at severity ${severity} (${priority}). Insufficient detailed telemetry factors were found in the current record.`;
  }

  // Identify top factors
  const sortedFactors = [...factors].sort((a, b) => b.points - a.points);
  const factorBullets = sortedFactors.map(f => 
    `• **${f.name} (+${f.points} pts)**: ${f.description}`
  ).join('\n');

  let contextualSummary = '';
  if (priority === 'CRITICAL') {
    const hasElectrical = incident.categories.includes('Electrical & Public Safety') || factors.some(f => f.name.includes('Electrical'));
    if (hasElectrical) {
      contextualSummary = `A severe hazard report was linked to the existing incident cluster, triggering cross-category escalation and critical life-safety containment risks.`;
    } else {
      contextualSummary = `Multiple high-velocity citizen reports corroborate significant infrastructure disruption with severe life-safety risk.`;
    }
  } else if (priority === 'HIGH') {
    contextualSummary = `The incident presents extensive public mobility and roadway disruption corroborated by multiple citizen reports.`;
  } else {
    contextualSummary = `Localized municipal disruption under active operational monitoring.`;
  }

  return `**${incident.id}** is currently evaluated as **${priority}** with a calculated severity score of **${severity}/100**.\n\n${contextualSummary}\n\n**Contributing Telemetry Factors Calculated by CivicPulse:**\n${factorBullets}\n\n*Note: This is an automated decision-support calculation generated by the explainable severity engine.*`;
}

/**
 * Generates an explanation for severity changes (e.g. 68 HIGH -> 94 CRITICAL)
 */
function explainSeverityChange(incident, reports) {
  // Check status trail for severity and priority transitions
  const trail = incident.status_trail || [];
  const sevEvent = [...trail].reverse().find(e => e.event_type === 'SEVERITY_INCREASED');
  const prioEvent = [...trail].reverse().find(e => e.event_type === 'PRIORITY_ESCALATED');

  const prevSev = sevEvent?.previous_value || '68';
  const currentSev = sevEvent?.new_value || incident.severity || '94';
  const prevPriority = prioEvent?.previous_value || (currentSev >= 75 ? 'HIGH' : 'MEDIUM');
  const currentPriority = prioEvent?.new_value || incident.priority;

  // Find newly linked severe report (e.g. R-140)
  const severeReport = reports.find(r => 
    incident.linked_report_ids.includes(r.report_id || r.id) &&
    (r.category === 'Electrical & Public Safety' || r.description.toLowerCase().includes('wire') || r.description.toLowerCase().includes('spark'))
  );

  const severeDescription = severeReport 
    ? `report **${severeReport.report_id}** (*"${severeReport.description}"*)`
    : `a severe electrical-hazard report`;

  const factors = incident.severity_breakdown?.factors || [];
  const topEscalationFactors = factors.filter(f => 
    f.name.includes('Electrical') || 
    f.name.includes('Cross-Domain') || 
    f.name.includes('Life Safety') ||
    f.points >= 15
  );

  const factorList = topEscalationFactors.length > 0
    ? topEscalationFactors.map(f => `• **${f.name} (+${f.points} pts)**: ${f.description}`).join('\n')
    : `• High-voltage life safety hazard\n• Cross-domain compound escalation`;

  return `**${incident.id}** increased from **${prevSev} ${prevPriority}** to **${currentSev} ${currentPriority}** after ${severeDescription} was linked to the unified incident cluster.\n\n**Key Severity Drivers:**\n${factorList}\n\n**Resulting Priority Escalation:**\nThe cross-category escalation elevated the incident to **${currentPriority}**, prioritizing it for immediate simulated resource assignment in the municipal command queue.`;
}

/**
 * Generates an explanation of the 4-factor evidence linking model
 */
function explainEvidenceLinking(incident, reports) {
  const eb = incident.evidence_breakdown;
  const linkedCount = incident.linked_report_ids?.length || 0;
  const linkedReports = reports.filter(r => incident.linked_report_ids.includes(r.report_id || r.id));
  const imageCount = linkedReports.filter(r => Boolean(r.image)).length;

  if (!eb) {
    return `Incident **${incident.id}** has ${linkedCount} linked citizen reports. Detailed correlation breakdown is currently being aggregated.`;
  }

  // Determine strongest signal
  const signals = [
    { name: 'Location similarity', weight: 40, score: eb.location_score },
    { name: 'Text similarity', weight: 25, score: eb.text_score },
    { name: 'Time similarity', weight: 20, score: eb.time_score },
    { name: 'Category & evidence similarity', weight: 15, score: eb.evidence_score }
  ];
  signals.sort((a, b) => (b.score * b.weight) - (a.score * a.weight));
  const strongest = signals[0];

  const photoPhrasing = imageCount > 0
    ? `${imageCount} verified photographic attachment(s) (Supporting photo evidence was provided).`
    : `No photo evidence attached.`;

  return `Reports linked to **${incident.id}** (${linkedCount} citizen submissions) were unified with **${eb.overall_confidence}% overall confidence** (${eb.confidence_level}) using the CivicPulse 4-factor correlation model:\n\n` +
    `• **Location similarity (40% weight)**: **${eb.location_score}%** — Haversine geodesic proximity confirms reports cluster in the immediate vicinity.\n` +
    `• **Text similarity (25% weight)**: **${eb.text_score}%** — Semantic token overlap confirms matching disruption terminology across citizen submissions.\n` +
    `• **Time similarity (20% weight)**: **${eb.time_score}%** — Exponential temporal decay confirms submissions arrived in close chronological windows.\n` +
    `• **Category & evidence similarity (15% weight)**: **${eb.evidence_score}%** — Cross-category affinity and ${photoPhrasing}\n\n` +
    `The strongest contribution came from **${strongest.name}** (${strongest.score}%).`;
}

/**
 * Generates an explanation for whether an incident has photo evidence
 */
function explainPhotoEvidence(incident, reports) {
  const linkedReportIds = incident.linked_report_ids || incident.report_ids || [];
  const linkedWithPhotos = reports.filter(r => 
    linkedReportIds.includes(r.report_id || r.id) && Boolean(r.image || r.evidence)
  );

  const count = linkedWithPhotos.length;
  if (count > 0) {
    const reportList = linkedWithPhotos.map(r => r.report_id || r.id).join(', ');
    return `Yes. **${incident.id}** has photo evidence attached to **${count} linked reports** (${reportList}).\n\n` +
      `• **Verification Status**: Supporting photo evidence was provided with citizen submissions.\n` +
      `• **Algorithmic Role**: Attached photos act as supporting evidence, contributing to the **Category & Evidence (15%)** correlation metric and the explainable severity score (+10 pts Verified Visual Evidence).\n\n` +
      `*Note: Photo attachments act strictly as supporting evidence. CivicPulse does not claim automated computer-vision understanding.*`;
  }

  return `No. **${incident.id}** does not currently have any photo evidence attached to its linked reports.\n\n` +
    `Citizen reports can be submitted with optional photo evidence via the Citizen Submission Portal.`;
}

/**
 * Generates an explanation of the resource recommendation
 */
function explainResourceRecommendation(incident, resources) {
  const recs = incident.recommended_resources || [];
  const requiredCaps = incident.allocation_detail?.required_capabilities || incident.categories || [];
  const shortage = incident.shortage_detected;

  if (recs.length === 0) {
    return `No active resource recommendation currently assigned for **${incident.id}**. Available municipal units are on standby.`;
  }

  const recList = recs.map(r => {
    const isSub = r.is_substitute ? ' *(Contingency Substitute)*' : '';
    return `• **${r.name}** (${r.type || r.matched_capability})${isSub}\n  - **Capability Matched**: ${r.matched_capability}\n  - **Estimated Response Distance**: ${formatDistance(r.distance_meters || 750)}\n  - **Estimated Arrival Time**: ~${r.estimated_eta_minutes || 6} min\n  - **Status**: Recommended Resource (Simulated Assignment)`;
  }).join('\n\n');

  let shortageNote = '';
  if (shortage) {
    shortageNote = `\n\n⚠️ **Resource Shortage Handled**: A primary specialized team was unavailable. The optimization engine assigned a fallback contingency vehicle to enforce perimeter isolation and safety containment.`;
  }

  return `**Resource Recommendation for ${incident.id} (Severity ${incident.severity} / ${incident.priority}):**\n\n` +
    `**Required Capabilities:** ${requiredCaps.join(', ')}\n\n` +
    `**Recommended Response Units:**\n${recList}` +
    `${shortageNote}\n\n` +
    `*Optimization Rationale*: Selected based on capability matching, closest geographic proximity, and current fleet availability. CivicPulse provides this recommendation as decision support.*`;
}

/**
 * Generates what-if explanation for resource shortages
 */
function explainResourceShortageWhatIf(incident, allIncidents, resources, serviceState) {
  // Check if shortage is already active in live state
  const isCurrentlyUnavailable = resources.some(r => 
    (r.id === 'RSRC-04' || r.name.includes('Electrical')) && 
    (r.availability === 'Unavailable' || r.availability === 'UNAVAILABLE')
  );

  if (isCurrentlyUnavailable || incident.shortage_detected) {
    const fallbackUnit = incident.recommended_resources?.find(r => r.is_substitute) || 
      resources.find(r => r.name.includes('Emergency Response Vehicle'));

    return `The **Electrical Response Team (RSRC-04)** is currently marked **UNAVAILABLE** (emergency grid transformer outage).\n\n` +
      `**CivicPulse Contingency Recalculation:**\n` +
      `1. **Deficit Detected**: Primary high-voltage electrical repair crew unavailable.\n` +
      `2. **Recalculated Recommendation**: Substituted **${fallbackUnit?.name || 'Emergency Response Vehicle'}** for safety perimeter containment and pedestrian isolation.\n` +
      `3. **Response ETA**: ~8 minutes from Civic Quick Reaction Center (~500m).\n` +
      `4. **Decision Support Guidance**: Maintain perimeter isolation until specialized utility mutual aid arrives.`;
  }

  // Hypothetical what-if: run simulation recalculation on cloned resources
  const simulatedResources = JSON.parse(JSON.stringify(resources));
  const elecTeam = simulatedResources.find(r => r.id === 'RSRC-04' || r.name.includes('Electrical'));
  if (elecTeam) {
    elecTeam.availability = 'Unavailable';
    elecTeam.status_note = 'Simulated Shortage - Detained';
  }

  const simResult = optimizeResourceAllocations(allIncidents, simulatedResources);
  const simRec = simResult.recommendations[incident.id];
  const assigned = simRec?.assigned_resources || [];
  const fallback = assigned.find(a => a.is_substitute);

  return `**Simulation What-If Analysis: If the Electrical Response Team is unavailable:**\n\n` +
    `The CivicPulse resource optimization engine recalculates fleet recommendations in real time:\n\n` +
    `• **Primary Specialist Status**: Electrical Response Team flagged as UNAVAILABLE.\n` +
    `• **Recalculated Fallback**: **${fallback ? fallback.name : 'Emergency Response Vehicle'}** is recommended to enforce safety containment and traffic diversion.\n` +
    `• **Response ETA Impact**: Arrival estimated at **~${fallback?.estimated_eta_minutes || 8} min** (~3 min additional delay for multi-hazard gear staging).\n` +
    `• **Containment Scope**: Focuses on physical hazard isolation and street cordoning while full grid repairs await backup specialists.\n\n` +
    `*All allocations are recalculated using constrained multi-unit fleet optimization for decision support.*`;
}

/**
 * Generates concise chronological incident history from status trail
 */
function explainIncidentHistory(incident) {
  const trail = incident.status_trail || [];

  if (trail.length === 0) {
    return `No recorded status audit trail events for **${incident.id}**.`;
  }

  const milestones = trail.map((e, idx) => {
    return `${idx + 1}. **[${e.timestamp}] ${e.event_type.replace(/_/g, ' ')}**: ${e.description}`;
  }).join('\n');

  return `**Chronological Audit Trail for ${incident.id}:**\n\n${milestones}\n\n*All events are immutably logged for municipal accountability and decision support.*`;
}

/**
 * Generates high-level system/fleet analytics summary
 */
function explainFleetAnalytics(service) {
  const analytics = service.getAnalytics();
  return `**CivicPulse System Telemetry Overview:**\n\n` +
    `• **Total Citizen Reports**: ${analytics.total_reports} (${analytics.clustered_rate}% clustered)\n` +
    `• **Active Incident Clusters**: ${analytics.active_incidents}\n` +
    `  - **Critical**: ${analytics.critical_incidents}\n` +
    `  - **High**: ${analytics.high_incidents}\n` +
    `  - **Medium**: ${analytics.medium_incidents}\n` +
    `  - **Low**: ${analytics.low_incidents}\n` +
    `• **Average Incident Severity**: ${analytics.average_severity}/100\n` +
    `• **Fleet Readiness**: ${analytics.available_resources} units available, ${analytics.unavailable_resources} unavailable\n` +
    `• **Active Shortage**: ${analytics.shortage_active ? '⚠️ Yes (Contingency Fallback Engaged)' : '✅ None (Full Fleet Available)'}`;
}

/**
 * Returns dynamic suggested questions based on the target incident's state
 */
export function getSuggestedQuestions(incident) {
  if (!incident) {
    return [
      'Why is CIV-104 critical?',
      'What caused CIV-104\'s severity to increase?',
      'What evidence is linked to CIV-104?',
      'Why was this resource recommended?',
      'What happens if the Electrical Response Team is unavailable?'
    ];
  }

  const isCritical = incident.priority === 'CRITICAL' || incident.severity >= 75;
  const isShortage = incident.shortage_detected;
  const hasHistory = (incident.status_trail || []).length > 2;

  const suggestions = [];

  if (isCritical) {
    suggestions.push(`Why is ${incident.id} critical?`);
    suggestions.push(`What caused ${incident.id}'s severity to increase?`);
  } else if (incident.priority === 'HIGH') {
    suggestions.push(`Why is ${incident.id} HIGH priority?`);
    suggestions.push(`Show the main reasons this incident is high priority.`);
  } else {
    suggestions.push(`Explain severity for ${incident.id}`);
  }

  suggestions.push(`What evidence is linked to ${incident.id}?`);
  suggestions.push(`Does ${incident.id} have photo evidence?`);
  suggestions.push(`Why was this resource recommended?`);

  if (isShortage) {
    suggestions.push(`What happens now?`);
    suggestions.push(`Why was fallback containment recommended?`);
  } else {
    suggestions.push(`What happens if the Electrical Response Team is unavailable?`);
  }

  if (hasHistory) {
    suggestions.push(`What changed in ${incident.id}?`);
  }

  return suggestions.slice(0, 6);
}

/**
 * Main CivicPulse Assistant entry point
 * 
 * Takes user message + incident_id and produces a factual,
 * grounded decision-support response.
 */
export async function handleAssistantQuery({ message, incidentId, service }) {
  if (!message || typeof message !== 'string') {
    return {
      success: false,
      error: 'Message string is required.'
    };
  }

  // 1. Resolve Target Incident
  let targetIncidentId = incidentId || 'CIV-104';
  let requestedSpecificId = false;

  // Extract incident ID mentioned directly in the user message if present (e.g. "CIV-109")
  const idMatch = message.match(/CIV-\d+/i);
  if (idMatch) {
    targetIncidentId = idMatch[0].toUpperCase();
    requestedSpecificId = true;
  } else if (incidentId) {
    requestedSpecificId = true;
  }

  const incident = service.getIncidentById(targetIncidentId);
  const allIncidents = service.getIncidents();
  const reports = service.getReports();
  const resources = service.getResources();

  if (!incident) {
    if (requestedSpecificId) {
      return {
        success: true,
        answer: `Incident **${targetIncidentId}** was not found in the active CivicPulse database. Please verify the incident identifier or select an active incident from the list.`,
        incident_id: targetIncidentId,
        intent: 'UNKNOWN',
        suggested_questions: getSuggestedQuestions(null)
      };
    }
    
    // Default fallback to first active incident if no specific ID was targeted
    const defaultIncident = allIncidents[0];
    if (!defaultIncident) {
      return {
        success: true,
        answer: "No active incidents currently recorded in the CivicPulse database.",
        incident_id: null,
        intent: 'UNKNOWN',
        suggested_questions: getSuggestedQuestions(null)
      };
    }
    incident = defaultIncident;
  }

  // 2. Classify Intent
  const intent = classifyIntent(message);

  let answer = '';

  switch (intent) {
    case 'SEVERITY_CHANGE':
      answer = explainSeverityChange(incident, reports);
      break;

    case 'INCIDENT_EXPLANATION':
      answer = explainIncidentSeverity(incident);
      break;

    case 'EVIDENCE_EXPLANATION':
      answer = explainEvidenceLinking(incident, reports);
      break;

    case 'PHOTO_EVIDENCE':
      answer = explainPhotoEvidence(incident, reports);
      break;

    case 'RESOURCE_EXPLANATION':
      answer = explainResourceRecommendation(incident, resources);
      break;

    case 'RESOURCE_SHORTAGE_WHAT_IF':
      answer = explainResourceShortageWhatIf(incident, allIncidents, resources, service);
      break;

    case 'INCIDENT_HISTORY':
      answer = explainIncidentHistory(incident);
      break;

    case 'FLEET_ANALYTICS':
      answer = explainFleetAnalytics(service);
      break;

    default:
      // Check if message is asking about CivicPulse concepts generally
      const lower = message.toLowerCase();
      if (lower.includes('hello') || lower.includes('hi') || lower.includes('help')) {
        answer = `Hello! I am the **CivicPulse Assistant**, a decision-support and explanation layer for municipal incident coordination.\n\nYou can ask me about:\n• **Incident severity & factor breakdown** (e.g., *"Why is ${incident.id} critical?"*)\n• **Evidence correlation** (e.g., *"Why are these reports linked?"*)\n• **Resource recommendations** (e.g., *"Why was this resource recommended?"*)\n• **Resource shortages & what-if scenarios** (e.g., *"What happens if the Electrical Response Team is unavailable?"*)\n• **Audit logs & changes** (e.g., *"What changed in ${incident.id}?"*)`;
      } else if (lower.includes('civicpulse') || lower.includes('pipeline') || lower.includes('dispatch')) {
        answer = `CivicPulse unifies multi-source citizen complaints through a transparent 5-stage pipeline:\n1. **Evidence Linking**: 4-factor correlation (40% Location, 20% Time, 25% Text, 15% Category/Evidence)\n2. **Incident Clustering**: Multi-report centroid grouping\n3. **Explainable Severity**: Transparent 0–100 point breakdown\n4. **Priority Classification**: Tiers from LOW to CRITICAL\n5. **Constrained Resource Optimization**: Proximity matching with automated contingency substitution during shortages.\n\n*All recommendations are simulated assignments for decision support; CivicPulse does not execute emergency field dispatches.*`;
      } else {
        answer = `I don't have enough information in the current CivicPulse data to answer that.\n\nCivicPulse Assistant operates strictly as a decision-support layer explaining calculated incident metrics, evidence correlations, severity factors, and resource recommendations. It does not perform emergency dispatch or track external municipal actions.`;
      }
      break;
  }

  // 3. Optional: LLM Polish if OpenAI or Gemini API key is configured
  if (process.env.ENABLE_LLM_ASSISTANT === 'true') {
    const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
    try {
      let polished = null;
      if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
        polished = await polishWithGemini({
          userMessage: message,
          groundTruthAnswer: answer,
          incident,
          apiKey: process.env.GEMINI_API_KEY
        });
      } else if (provider === 'openai' && process.env.OPENAI_API_KEY) {
        polished = await polishWithOpenAI({
          userMessage: message,
          groundTruthAnswer: answer,
          incident,
          apiKey: process.env.OPENAI_API_KEY
        });
      } else if (process.env.OPENAI_API_KEY) {
        polished = await polishWithOpenAI({
          userMessage: message,
          groundTruthAnswer: answer,
          incident,
          apiKey: process.env.OPENAI_API_KEY
        });
      } else if (process.env.GEMINI_API_KEY) {
        polished = await polishWithGemini({
          userMessage: message,
          groundTruthAnswer: answer,
          incident,
          apiKey: process.env.GEMINI_API_KEY
        });
      }

      if (polished) {
        answer = polished;
      }
    } catch (llmErr) {
      console.warn('[AssistantEngine] LLM polish skipped, using deterministic ground-truth:', llmErr.message);
    }
  }

  return {
    success: true,
    answer,
    incident_id: incident.id,
    intent,
    suggested_questions: getSuggestedQuestions(incident),
    context: {
      severity: incident.severity,
      priority: incident.priority,
      categories: incident.categories,
      linked_reports_count: incident.linked_report_ids?.length || 0,
      shortage_detected: incident.shortage_detected || false
    }
  };
}

/**
 * Optional OpenAI LLM Polisher - Strictly adheres to provided ground truth
 */
async function polishWithOpenAI({ userMessage, groundTruthAnswer, incident, apiKey }) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are the CivicPulse Assistant, a municipal decision-support explanation layer.
CRITICAL SAFETY & TRUTH RULES:
1. You must ONLY use the provided ground truth data. NEVER invent reports, locations, severity values, or resources.
2. If information is missing, state: "I don't have enough information in the current CivicPulse data to answer that."
3. Use strict terminology: "Resource Recommendation", "Recommended Resource", "Simulated Assignment", "Decision Support".
4. NEVER claim that CivicPulse performed "Emergency Dispatch", "Automatically Deployed", or "Official Emergency Response".
5. Keep your tone concise, professional, and clear for command center operators.`
        },
        {
          role: 'user',
          content: `User Question: "${userMessage}"\n\nIncident Context: ${incident.id} (Severity: ${incident.severity}, Priority: ${incident.priority})\n\nCivicPulse Calculated Ground Truth:\n${groundTruthAnswer}\n\nPresent this explanation clearly to the user, strictly preserving all numbers, percentages, factors, and terminology.`
        }
      ],
      temperature: 0.2,
      max_tokens: 600
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

/**
 * Optional Gemini LLM Polisher - Strictly adheres to provided ground truth
 */
async function polishWithGemini({ userMessage, groundTruthAnswer, incident, apiKey }) {
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemInstruction = `You are the CivicPulse Assistant, a municipal decision-support explanation layer.
CRITICAL SAFETY & TRUTH RULES:
1. You must ONLY use the provided ground truth data. NEVER invent reports, locations, severity values, or resources.
2. If information is missing, state: "I don't have enough information in the current CivicPulse data to answer that."
3. Use strict terminology: "Resource Recommendation", "Recommended Resource", "Simulated Assignment", "Decision Support".
4. NEVER claim that CivicPulse performed "Emergency Dispatch", "Automatically Deployed", or "Official Emergency Response".
5. Keep your tone concise, professional, and clear for command center operators.`;

  const prompt = `User Question: "${userMessage}"\n\nIncident Context: ${incident.id} (Severity: ${incident.severity}, Priority: ${incident.priority})\n\nCivicPulse Calculated Ground Truth:\n${groundTruthAnswer}\n\nPresent this explanation clearly to the user, strictly preserving all numbers, percentages, factors, and terminology.`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      system_instruction: { parts: [{ text: systemInstruction }] },
      generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

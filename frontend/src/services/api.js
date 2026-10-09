/**
 * CivicPulse - Client API Service
 *
 * Communicates with backend REST endpoints for incidents, reports,
 * fleet resources, simulation state changes, and the CivicPulse Assistant.
 */

const BASE_URL = '/api';

export async function fetchIncidents() {
  const res = await fetch(`${BASE_URL}/incidents`);
  if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.statusText}`);
  return await res.json();
}

export async function fetchRankedIncidents() {
  const res = await fetch(`${BASE_URL}/incidents/ranked`);
  if (!res.ok) throw new Error(`Failed to fetch ranked incidents: ${res.statusText}`);
  return await res.json();
}

export async function fetchIncidentById(id) {
  const res = await fetch(`${BASE_URL}/incidents/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch incident ${id}: ${res.statusText}`);
  return await res.json();
}

export async function fetchReports(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'All') params.append('category', filters.category);
  if (filters.status && filters.status !== 'All') params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${BASE_URL}/reports${queryStr}`);
  if (!res.ok) throw new Error(`Failed to fetch reports: ${res.statusText}`);
  return await res.json();
}

export async function fetchReportById(id) {
  const res = await fetch(`${BASE_URL}/reports/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch report ${id}: ${res.statusText}`);
  return await res.json();
}

export async function submitCitizenReport(report) {
  const res = await fetch(`${BASE_URL}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report)
  });
  if (!res.ok) throw new Error(`Failed to submit report: ${res.statusText}`);
  return await res.json();
}

export async function updateReport(id, updateData) {
  const res = await fetch(`${BASE_URL}/reports/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  if (!res.ok) throw new Error(`Failed to update report: ${res.statusText}`);
  return await res.json();
}

export async function deleteReport(id) {
  const res = await fetch(`${BASE_URL}/reports/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to delete report: ${res.statusText}`);
  return await res.json();
}

export async function fetchResources() {
  const res = await fetch(`${BASE_URL}/resources`);
  if (!res.ok) throw new Error(`Failed to fetch resources: ${res.statusText}`);
  return await res.json();
}

export async function toggleResourceAvailability(resourceId, availability = null) {
  const res = await fetch(`${BASE_URL}/resources/${encodeURIComponent(resourceId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ availability })
  });
  if (!res.ok) throw new Error(`Failed to update resource availability: ${res.statusText}`);
  return await res.json();
}

export async function fetchResourceRecommendation(incidentId) {
  const res = await fetch(`${BASE_URL}/incidents/${encodeURIComponent(incidentId)}/recommendation`);
  if (!res.ok) throw new Error(`Failed to fetch recommendation: ${res.statusText}`);
  return await res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${BASE_URL}/analytics`);
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.statusText}`);
  return await res.json();
}

export async function triggerSevereReportSimulation() {
  const res = await fetch(`${BASE_URL}/simulation/severe-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Simulation failed: ${res.statusText}`);
  return await res.json();
}

export async function triggerResourceShortageSimulation() {
  const res = await fetch(`${BASE_URL}/simulation/resource-shortage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Shortage simulation failed: ${res.statusText}`);
  return await res.json();
}

export async function resetSimulationState() {
  const res = await fetch(`${BASE_URL}/simulation/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Reset simulation failed: ${res.statusText}`);
  return await res.json();
}

export async function recalculatePriorities() {
  const res = await fetch(`${BASE_URL}/simulation/recalculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Recalculate failed: ${res.statusText}`);
  return await res.json();
}

/**
 * ROUND 2: CivicPulse Assistant Endpoints
 */
export async function askAssistant(message, incidentId = 'CIV-104') {
  const res = await fetch(`${BASE_URL}/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      incident_id: incidentId
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Assistant error: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchAssistantSuggestions(incidentId = 'CIV-104') {
  const res = await fetch(`${BASE_URL}/assistant/suggested-questions?incident_id=${encodeURIComponent(incidentId)}`);
  if (!res.ok) throw new Error(`Failed to fetch suggestions: ${res.statusText}`);
  return await res.json();
}

export async function fetchAssistantContext(incidentId = 'CIV-104') {
  const res = await fetch(`${BASE_URL}/assistant/context/${encodeURIComponent(incidentId)}`);
  if (!res.ok) throw new Error(`Failed to fetch assistant context: ${res.statusText}`);
  return await res.json();
}

/**
 * Optional OpenAI Routes
 */
export async function analyzeIncidentWithAI(payload) {
  const res = await fetch(`${BASE_URL}/openai/analyze-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`AI analysis failed: ${res.statusText}`);
  return await res.json();
}

export async function suggestIncidentSeverityAI(payload) {
  const res = await fetch(`${BASE_URL}/openai/suggest-severity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`AI severity suggestion failed: ${res.statusText}`);
  return await res.json();
}

export async function generateDispatchPlanAI(payload) {
  const res = await fetch(`${BASE_URL}/openai/generate-dispatch-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`AI dispatch plan failed: ${res.statusText}`);
  return await res.json();
}

export async function getOpenAIHealth() {
  const res = await fetch(`${BASE_URL}/openai/health`);
  return await res.json();
}

export async function getGeminiHealth() {
  const res = await fetch(`${BASE_URL}/gemini/health`);
  return await res.json();
}

/**
 * Optional Gemini Routes
 */
export async function analyzeIncidentWithGemini(payload) {
  const res = await fetch(`${BASE_URL}/gemini/analyze-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Gemini analysis failed: ${res.statusText}`);
  return await res.json();
}

export async function suggestIncidentSeverityGemini(payload) {
  const res = await fetch(`${BASE_URL}/gemini/suggest-severity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Gemini severity suggestion failed: ${res.statusText}`);
  return await res.json();
}

export async function generateDispatchPlanGemini(payload) {
  const res = await fetch(`${BASE_URL}/gemini/generate-dispatch-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Gemini dispatch plan failed: ${res.statusText}`);
  return await res.json();
}

export async function generateIncidentSummaryGemini(payload) {
  const res = await fetch(`${BASE_URL}/gemini/generate-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Gemini summary failed: ${res.statusText}`);
  return await res.json();
}

/**
 * Unified AI Status & Diagnostics
 */
export async function fetchAiStatus() {
  const res = await fetch(`${BASE_URL}/ai/status`);
  if (!res.ok) throw new Error(`Failed to fetch AI status: ${res.statusText}`);
  return await res.json();
}

export async function updateAiConfig(config) {
  const res = await fetch(`${BASE_URL}/ai/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error(`Failed to update AI config: ${res.statusText}`);
  return await res.json();
}

export async function testAiProvider(provider = 'openai') {
  const res = await fetch(`${BASE_URL}/ai/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `AI test failed: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * 1-to-1 Citizen-Authority Private Chat APIs
 */
export async function fetchChatAuthorities() {
  const res = await fetch(`${BASE_URL}/chat/authorities`);
  if (!res.ok) throw new Error(`Failed to fetch authorities: ${res.statusText}`);
  return await res.json();
}

export async function fetchChatUnreadCount(role = 'citizen', userId = 'citizen-current') {
  const res = await fetch(`${BASE_URL}/chat/unread-count?user_role=${role}&user_id=${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch unread count: ${res.statusText}`);
  return await res.json();
}

export async function fetchConversations({ search = '', status = 'All', unreadOnly = false, role = 'authority', userId = 'authority-current' } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status && status !== 'All') params.append('status', status);
  if (unreadOnly) params.append('unreadOnly', 'true');
  params.append('user_role', role);
  params.append('user_id', userId);

  const res = await fetch(`${BASE_URL}/chat/conversations?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.statusText}`);
  return await res.json();
}

export async function getOrCreateConversationForReport(reportId, role = 'citizen', userId = 'citizen-current') {
  const res = await fetch(`${BASE_URL}/chat/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': role,
      'X-User-Id': userId
    },
    body: JSON.stringify({ reportId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to initialize conversation: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchChatMessages(conversationId, role = 'citizen', userId = 'citizen-current') {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
    headers: {
      'X-User-Role': role,
      'X-User-Id': userId
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch messages: ${res.statusText}`);
  }
  return await res.json();
}

export async function sendChatMessage(conversationId, { text, attachment, senderName, role = 'citizen', userId = 'citizen-current' }) {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': role,
      'X-User-Id': userId
    },
    body: JSON.stringify({ text, attachment, senderName })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to send message: ${res.statusText}`);
  }
  return await res.json();
}

export async function markChatConversationAsRead(conversationId, role = 'citizen', userId = 'citizen-current') {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: {
      'X-User-Role': role,
      'X-User-Id': userId
    }
  });
  if (!res.ok) return { success: false };
  return await res.json();
}

export async function updateComplaintStatusFromChat(conversationId, status, role = 'authority', userId = 'authority-current') {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/complaint-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': role,
      'X-User-Id': userId
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update status: ${res.statusText}`);
  }
  return await res.json();
}

export async function uploadChatAttachment(fileData, fileName, fileType) {
  const res = await fetch(`${BASE_URL}/chat/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileData, fileName, fileType })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed: ${res.statusText}`);
  }
  return await res.json();
}



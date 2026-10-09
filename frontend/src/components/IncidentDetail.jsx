import React from 'react';
import { 
  ShieldAlert, 
  Clock, 
  MapPin, 
  FileText, 
  Truck, 
  AlertTriangle, 
  Image as ImageIcon,
  RotateCw,
  Sparkles,
  Bot,
  ExternalLink,
  Flame,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

export default function IncidentDetail({
  incident,
  allReports = [],
  onOpenEvidenceModal,
  onRecalculate,
  onOpenAssistant,
  onOpenCitizenChat
}) {
  if (!incident) {
    return (
      <div className="detail-panel" id="incident-detail-panel">
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <ShieldAlert size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: '14px', fontWeight: 600 }}>No Incident Selected</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>
            Select an incident cluster from the feed or map to inspect intelligence scorecard.
          </p>
        </div>
      </div>
    );
  }

  // Linked reports detail
  const linkedReportIds = incident.linked_report_ids || incident.report_ids || [];
  const linkedReports = allReports.filter(r => 
    linkedReportIds.includes(r.report_id || r.id)
  );
  const reportsWithEvidence = linkedReports.filter(r => Boolean(r.image || r.evidence));

  const priorityClass = (incident.priority || 'MEDIUM').toLowerCase();
  const severityScore = incident.severity ?? 50;
  const factors = incident.severity_breakdown?.factors || [];
  const eb = incident.evidence_breakdown;
  const recommendedResources = incident.recommended_resources || [];
  const statusTrail = incident.status_trail || [];

  return (
    <div className="detail-panel" id="incident-detail-panel">
      {/* 1. Header */}
      <div className="detail-header">
        <div className="detail-top-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontWeight: 800, 
              fontSize: '13px', 
              color: '#38bdf8' 
            }}>
              {incident.id}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)'
            }}>
              {incident.status || 'Active'}
            </span>
          </div>

          {onOpenAssistant && (
            <button 
              className="btn-header"
              onClick={() => onOpenAssistant(incident.id)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                background: 'rgba(56, 189, 248, 0.12)',
                borderColor: 'rgba(56, 189, 248, 0.35)',
                color: '#38bdf8'
              }}
              title="Open CivicPulse Assistant for decision-support explanation"
            >
              <Bot size={13} />
              <span>Ask Assistant</span>
            </button>
          )}
        </div>

        <div className="detail-title">
          {incident.title}
        </div>

        {/* Categories & Location meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {(incident.categories || []).map(cat => (
            <span 
              key={cat} 
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: cat.includes('Water') ? 'rgba(56, 189, 248, 0.15)' :
                            cat.includes('Electrical') ? 'rgba(239, 68, 68, 0.15)' :
                            'rgba(245, 158, 11, 0.15)',
                color: cat.includes('Water') ? '#38bdf8' :
                       cat.includes('Electrical') ? '#f87171' :
                       '#fbbf24',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {cat}
            </span>
          ))}

          {incident.latitude && (
            <span style={{ 
              fontSize: '10px', 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--text-muted)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              marginLeft: 'auto' 
            }}>
              <MapPin size={11} />
              {incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* 2. Explainable Severity Score Card */}
      <div className="severity-hero-card">
        <div className="detail-section-title" style={{ margin: 0 }}>
          <span>Explainable Severity Telemetry</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CivicPulse Engine</span>
        </div>

        <div className="severity-gauge-row">
          <div className="severity-dial-box">
            <span className={`score-number ${priorityClass}`}>
              {severityScore}
            </span>
            <span className="score-total">/100</span>
          </div>

          <div className={`priority-tag-large ${priorityClass}`}>
            {incident.priority || 'MEDIUM'} PRIORITY
          </div>
        </div>

        {/* Factors Breakdown */}
        <div className="factor-list">
          {factors.map((factor, idx) => (
            <div key={idx} className="factor-item">
              <div className="factor-header">
                <span className="factor-name">{factor.name}</span>
                <span className="factor-points">+{factor.points} pts</span>
              </div>
              <div className="factor-desc">{factor.description}</div>
            </div>
          ))}

          {factors.length === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Base algorithmic evaluation without special multipliers.
            </div>
          )}
        </div>
      </div>

      {/* 3. Evidence Correlation Grid */}
      <div style={{ padding: '0 20px', marginBottom: '16px' }}>
        <div className="detail-section-title">
          <span>Evidence Correlation Model</span>
          <span style={{ fontSize: '10px', color: '#38bdf8' }}>4-Signal Weights</span>
        </div>

        {eb && (
          <>
            <div className="confidence-banner">
              <span className="confidence-label">Overall Evidence Confidence</span>
              <span className="confidence-val">{eb.overall_confidence}% • {eb.confidence_level}</span>
            </div>

            <div className="evidence-grid">
              <div className="evidence-metric-box">
                <span className="metric-label">Location (40%)</span>
                <div className="metric-bar-row">
                  <span className="metric-score">{eb.location_score}%</span>
                </div>
              </div>

              <div className="evidence-metric-box">
                <span className="metric-label">Text (25%)</span>
                <div className="metric-bar-row">
                  <span className="metric-score">{eb.text_score}%</span>
                </div>
              </div>

              <div className="evidence-metric-box">
                <span className="metric-label">Time (20%)</span>
                <div className="metric-bar-row">
                  <span className="metric-score">{eb.time_score}%</span>
                </div>
              </div>

              <div className="evidence-metric-box">
                <span className="metric-label">Category (15%)</span>
                <div className="metric-bar-row">
                  <span className="metric-score">{eb.evidence_score}%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. Constrained Resource Optimization Card */}
      <div className="resource-allocations-card">
        <div className="detail-section-title" style={{ margin: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Truck size={13} color="#38bdf8" />
            Resource Recommendation (Decision Support)
          </span>
          {onRecalculate && (
            <button
              onClick={onRecalculate}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px'
              }}
              title="Force recalculation"
            >
              <RotateCw size={11} />
              Re-optimize
            </button>
          )}
        </div>

        {/* Shortage callout */}
        {incident.shortage_detected && (
          <div className="shortage-callout">
            <div className="shortage-title">
              <AlertTriangle size={13} />
              Resource Shortage Detected
            </div>
            <div className="shortage-body">
              Primary specialized response crew detained off-grid. CivicPulse optimization engine rerouted Emergency Response Vehicle for perimeter isolation & safety containment.
            </div>
          </div>
        )}

        {/* Assigned resources list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {recommendedResources.map((rsrc, idx) => (
            <div key={idx} className="resource-dispatch-row">
              <div className="resource-info">
                <Truck size={14} color={rsrc.is_substitute ? '#fbbf24' : '#38bdf8'} />
                <div>
                  <div className="resource-name">
                    {rsrc.name}
                    {rsrc.is_substitute && (
                      <span style={{ 
                        marginLeft: '6px', 
                        fontSize: '9px', 
                        color: '#fbbf24', 
                        border: '1px solid rgba(245, 158, 11, 0.4)', 
                        padding: '1px 4px', 
                        borderRadius: '3px' 
                      }}>
                        Fallback
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Match: {rsrc.matched_capability || rsrc.type}
                  </div>
                </div>
              </div>

              <div className="resource-eta">
                ETA ~{rsrc.estimated_eta_minutes || 6}m
              </div>
            </div>
          ))}

          {recommendedResources.length === 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
              No municipal units currently reserved for this cluster.
            </div>
          )}
        </div>
      </div>

      {/* 5. Evidence Section */}
      <div style={{ padding: '0 20px', marginBottom: '16px' }} id="incident-evidence-section">
        <div className="detail-section-title">
          <span>Evidence ({reportsWithEvidence.length})</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Supporting Citizen Proof</span>
        </div>

        {reportsWithEvidence.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reportsWithEvidence.map(report => {
              const repId = report.report_id || report.id;
              const imgSrc = report.evidence || (report.image ? `/evidence/${report.image}` : '');
              return (
                <div
                  key={`evidence-item-${repId}`}
                  style={{
                    background: 'rgba(11, 17, 32, 0.7)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '6px',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                      position: 'relative'
                    }}>
                      <ImageIcon size={18} color="#38bdf8" style={{ position: 'absolute' }} />
                      <img
                        src={imgSrc}
                        alt={`Evidence for ${repId}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 1 }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        <span>📷 Photo</span>
                        <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                          Report {repId}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Uploaded evidence
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-header"
                    onClick={() => onOpenEvidenceModal && onOpenEvidenceModal(report)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '11px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ImageIcon size={12} />
                    <span>View Photo</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            padding: '10px 14px',
            background: 'rgba(11, 17, 32, 0.4)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-subtle)'
          }}>
            No photo evidence attached to reports in this incident cluster. Photo evidence is optional.
          </div>
        )}
      </div>

      {/* 6. Linked Citizen Reports */}
      <div style={{ padding: '0 20px', marginBottom: '16px' }}>
        <div className="detail-section-title">
          <span>Corroborating Reports ({linkedReports.length})</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Citizen Telemetry</span>
        </div>

        <div className="reports-list">
          {linkedReports.map(report => (
            <div key={report.report_id || report.id} className="report-item">
              <div className="report-top">
                <span className="report-id">{report.report_id || report.id}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => onOpenCitizenChat && onOpenCitizenChat(report)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      padding: '2px 7px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={`Open private chat with assigned authority for complaint ${report.report_id || report.id}`}
                  >
                    <MessageSquare size={10} />
                    <span>Chat with Authority</span>
                  </button>
                  <span className="report-time">
                    {report.timestamp ? new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Logged'}
                  </span>
                </div>
              </div>

              <div className="report-desc">{report.description}</div>

              {(report.evidence || report.image) && (
                <div className="report-thumb-row">
                  <img
                    src={report.evidence || `/evidence/${report.image}`}
                    alt="Evidence attachment"
                    className="evidence-thumbnail"
                    onClick={() => onOpenEvidenceModal && onOpenEvidenceModal(report)}
                    title="Click to inspect photographic proof"
                    onError={(e) => {
                      // Fallback placeholder if image not loaded
                      e.target.style.display = 'none';
                    }}
                  />
                  <span style={{ fontSize: '10px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <ImageIcon size={11} /> Photo verified
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. Status Audit Trail Timeline */}
      <div className="status-trail-container">
        <div className="detail-section-title" style={{ margin: 0 }}>
          <span>Chronological Status Trail</span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Immutable Log</span>
        </div>

        <div className="timeline">
          {statusTrail.map((ev, idx) => {
            const isSevere = ev.event_type?.includes('SEVERE') || ev.event_type?.includes('CRITICAL');
            return (
              <div key={ev.id || idx} className="timeline-event">
                <div className={`timeline-node ${isSevere ? 'severe' : ''}`} />
                <div className="timeline-time">{ev.timestamp} • {ev.event_type}</div>
                <div className="timeline-desc">{ev.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

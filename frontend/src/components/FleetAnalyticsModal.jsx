import React from 'react';
import { X, Truck, BarChart2, ShieldCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function FleetAnalyticsModal({
  isOpen,
  onClose,
  resources = [],
  analytics = null,
  incidents = [],
  onToggleResource
}) {
  if (!isOpen) return null;

  const kpis = analytics?.kpi || {
    total_reports: 20,
    active_incidents: incidents.length,
    critical_count: incidents.filter(i => i.priority === 'CRITICAL').length,
    high_count: incidents.filter(i => i.priority === 'HIGH').length,
    average_severity: 48
  };

  const categories = analytics?.category_distribution || [
    { category: 'Water & Sanitation', count: 8 },
    { category: 'Road & Infrastructure', count: 8 },
    { category: 'Electrical & Public Safety', count: 4 }
  ];

  return (
    <div className="modal-overlay" id="fleet-analytics-modal" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Truck size={18} color="#38bdf8" />
            <span>Municipal Fleet Readiness & Shortage Simulation</span>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: '#111a2e', padding: '12px', borderRadius: '8px', border: '1px solid #223254' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Active Clusters</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                {incidents.length}
              </div>
            </div>

            <div style={{ background: '#111a2e', padding: '12px', borderRadius: '8px', border: '1px solid #223254' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Avg Severity</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono' }}>
                {kpis.average_severity || 52}/100
              </div>
            </div>

            <div style={{ background: '#111a2e', padding: '12px', borderRadius: '8px', border: '1px solid #223254' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Fleet Available</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono' }}>
                {resources.filter(r => r.availability === 'AVAILABLE' || r.availability === 'Available').length}/{resources.length}
              </div>
            </div>

            <div style={{ background: '#111a2e', padding: '12px', borderRadius: '8px', border: '1px solid #223254' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Life Safety Risk</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444', fontFamily: 'JetBrains Mono' }}>
                {incidents.filter(i => i.priority === 'CRITICAL').length} Critical
              </div>
            </div>
          </div>

          {/* Municipal Fleet Table */}
          <div>
            <div className="detail-section-title">
              <span>Municipal Response Units ({resources.length})</span>
              <span style={{ fontSize: '11px', color: '#38bdf8' }}>Interactive Shortage Simulation</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {resources.map((res, idx) => {
                const isUnavailable = res.availability === 'UNAVAILABLE' || res.availability === 'Unavailable';

                return (
                  <div
                    key={idx}
                    style={{
                      background: isUnavailable ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.7)',
                      border: isUnavailable ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #223254',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                          {res.id}
                        </span>
                        <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{res.name}</strong>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isUnavailable ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: isUnavailable ? '#ef4444' : '#10b981'
                          }}
                        >
                          {res.availability}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        Capabilities: {res.capabilities?.join(' • ')}
                      </div>

                      {res.status_note && (
                        <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px', fontStyle: 'italic' }}>
                          Status: {res.status_note}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                        <div>Base: {res.base_station || 'Central Depot'}</div>
                        <div>Cost: ${res.cost_per_hour || 120}/hr</div>
                      </div>

                      {onToggleResource && (
                        <button
                          type="button"
                          className="btn-header"
                          onClick={() => onToggleResource(res.id, isUnavailable ? 'Available' : 'Unavailable')}
                          style={{
                            padding: '5px 10px',
                            fontSize: '11px',
                            background: isUnavailable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            borderColor: isUnavailable ? '#10b981' : '#ef4444',
                            color: isUnavailable ? '#34d399' : '#f87171'
                          }}
                          title={`Toggle ${res.name} availability`}
                        >
                          {isUnavailable ? 'Set Available' : 'Set Unavailable'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Distribution Bar Chart */}
          <div>
            <div className="detail-section-title">
              <span>Reports By Category Distribution</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map((c, i) => {
                const total = categories.reduce((sum, item) => sum + item.count, 0) || 1;
                const pct = Math.round((c.count / total) * 100);

                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#cbd5e1' }}>{c.category}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', color: '#94a3b8' }}>
                        {c.count} reports ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: c.category.includes('Water') ? '#0ea5e9' : c.category.includes('Road') ? '#f59e0b' : '#eab308',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

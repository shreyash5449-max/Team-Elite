import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Truck, 
  Users, 
  Layers, 
  Settings, 
  RotateCcw,
  Sparkles,
  BarChart3,
  Flame,
  Check
} from 'lucide-react';
import { 
  fetchAnalytics, 
  fetchResources, 
  resetSimulationState, 
  recalculatePriorities 
} from '../services/api';

export default function AdminDashboardPage({
  incidents = [],
  reports = [],
  resources = [],
  onNavigate,
  onResetSimulation,
  onRecalculate
}) {
  const [resetting, setResetting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter(i => i.priority === 'CRITICAL').length;
  const highCount = incidents.filter(i => i.priority === 'HIGH').length;
  const resolvedCount = reports.filter(r => (r.status || '').toLowerCase().includes('resolve')).length;
  const activeFleetCount = resources.filter(r => (r.availability || '').toUpperCase() === 'AVAILABLE').length;

  const handleReset = async () => {
    setResetting(true);
    try {
      await onResetSimulation();
      setFeedback('Baseline municipal simulation state restored successfully.');
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      setFeedback('Error resetting state: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  const handleRecalc = async () => {
    setRecalculating(true);
    try {
      await onRecalculate();
      setFeedback('Global multi-factor severity scores & fleet allocations recalculated.');
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      setFeedback('Error recalculating metrics: ' + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="admin-page site-container" id="admin-page">
      {/* Admin Header */}
      <div className="admin-header-row">
        <div>
          <span className="section-label">Municipal Administration Portal</span>
          <h1 className="admin-title">Central Administrative Oversight</h1>
          <p className="admin-subtitle">
            System performance telemetry, department resolution metrics, and dispatch audit logs.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn-admin-recalc"
            onClick={handleRecalc}
            disabled={recalculating}
          >
            <RefreshCw size={14} className={recalculating ? 'spin-icon' : ''} />
            <span>{recalculating ? 'Recalculating...' : 'Recalculate Metrics'}</span>
          </button>

          <button
            type="button"
            className="btn-admin-reset"
            onClick={handleReset}
            disabled={resetting}
          >
            <RotateCcw size={14} className={resetting ? 'spin-icon' : ''} />
            <span>{resetting ? 'Resetting...' : 'Restore Demo Baseline'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="admin-feedback-toast">
          <CheckCircle2 size={16} color="#10b981" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Overview Strip */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="kpi-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Layers size={20} />
          </div>
          <div>
            <div className="kpi-num">{totalIncidents}</div>
            <div className="kpi-label">Active Clustered Incidents</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="kpi-num">{criticalCount} Critical • {highCount} High</div>
            <div className="kpi-label">Priority Tiers</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="kpi-num">{resolvedCount}</div>
            <div className="kpi-label">Resolved Complaints</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Truck size={20} />
          </div>
          <div>
            <div className="kpi-num">{activeFleetCount} / {resources.length}</div>
            <div className="kpi-label">Fleet Readiness</div>
          </div>
        </div>
      </div>

      {/* Department Breakdown Section */}
      <div className="admin-section-card">
        <h3 className="admin-card-heading">Department Performance & Resolution Status</h3>
        <p className="admin-card-sub">
          Cross-department response efficiency across Pune municipal divisions:
        </p>

        <div className="dept-scorecard-grid">
          {[
            { name: 'Water & Sanitation Division', head: 'Er. V. Deshpande', incidents: 2, resolved: 3, readiness: '1/2 Active', color: '#0284c7' },
            { name: 'Roads & Public Infrastructure', head: 'Er. M. Kulkarni', incidents: 2, resolved: 2, readiness: '2/2 Active', color: '#d97706' },
            { name: 'Electrical & Public Safety', head: 'Er. A. Joshi', incidents: 2, resolved: 1, readiness: '1/1 Active', color: '#dc2626' }
          ].map((dept, i) => (
            <div key={i} className="dept-card">
              <div className="dept-header">
                <span className="dept-name" style={{ color: dept.color }}>{dept.name}</span>
                <span className="dept-head">{dept.head}</span>
              </div>
              <div className="dept-metrics-row">
                <div>
                  <span className="metric-title">Active Clusters</span>
                  <strong>{dept.incidents}</strong>
                </div>
                <div>
                  <span className="metric-title">Resolved</span>
                  <strong style={{ color: '#16a34a' }}>{dept.resolved}</strong>
                </div>
                <div>
                  <span className="metric-title">Fleet Assigned</span>
                  <strong>{dept.readiness}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Resource Readiness */}
      <div className="admin-section-card">
        <h3 className="admin-card-heading">Municipal Response Fleet Registry</h3>
        <div className="fleet-registry-table-wrapper">
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Unit ID</th>
                <th>Vehicle / Crew Name</th>
                <th>Specialization</th>
                <th>Base Station</th>
                <th>Operational Status</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => {
                const isAvail = (r.availability || '').toUpperCase() === 'AVAILABLE';
                return (
                  <tr key={r.id}>
                    <td><code>{r.id}</code></td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.type}</td>
                    <td>{r.base_station || 'Central Depot'}</td>
                    <td>
                      <span className={`fleet-status-chip ${isAvail ? 'available' : 'unavailable'}`}>
                        {r.availability}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log / Event Trail */}
      <div className="admin-section-card">
        <h3 className="admin-card-heading">Recent System Event Audit Log</h3>
        <p className="admin-card-sub">
          Chronological record of recent correlation events, status adjustments, and simulation triggers:
        </p>

        <div className="admin-audit-trail">
          {[
            { id: 'LOG-301', time: 'Just now', type: 'SYSTEM_HEALTH', desc: 'CivicPulse multi-factor correlation & spatial clustering engine running normally.' },
            { id: 'LOG-300', time: '10 mins ago', type: 'CHAT_INITIALIZED', desc: 'Private 1-to-1 conversation initialized between citizen and Officer Deshmukh for complaint #R-101.' },
            { id: 'LOG-299', time: '25 mins ago', type: 'CORRELATION_EVENT', desc: 'Citizen report R-130 correlated into incident CIV-104 (Confidence: 88%).' },
            { id: 'LOG-298', time: '40 mins ago', type: 'RESOURCE_DISPATCH', desc: 'Water Response Team (RSRC-03) assigned to CIV-104 at Shivaji Nagar Junction.' }
          ].map((ev) => (
            <div key={ev.id} className="audit-event-item">
              <span className="audit-time">{ev.time}</span>
              <span className="audit-badge">{ev.type}</span>
              <span className="audit-desc">{ev.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

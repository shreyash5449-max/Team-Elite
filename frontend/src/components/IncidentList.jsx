import React, { useState } from 'react';
import { 
  Search, 
  Users, 
  AlertTriangle, 
  Flame, 
  Droplet, 
  Wrench, 
  Zap,
  ArrowUpDown
} from 'lucide-react';

export default function IncidentList({ 
  incidents = [], 
  selectedIncidentId = null, 
  onSelectIncident 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('SEVERITY'); // 'SEVERITY' | 'REPORTS' | 'TIME'

  // Filter incidents
  const filtered = incidents.filter(inc => {
    const q = searchTerm.toLowerCase();
    const titleMatch = inc.title?.toLowerCase().includes(q);
    const idMatch = inc.id?.toLowerCase().includes(q);
    const catMatch = inc.categories?.some(c => c.toLowerCase().includes(q));

    if (!titleMatch && !idMatch && !catMatch) return false;

    if (activeFilter === 'CRITICAL_HIGH') {
      return inc.priority === 'CRITICAL' || inc.priority === 'HIGH';
    }
    if (activeFilter === 'WATER') {
      return inc.categories?.includes('Water & Sanitation');
    }
    if (activeFilter === 'ROAD') {
      return inc.categories?.includes('Road & Infrastructure');
    }
    if (activeFilter === 'ELECTRICAL') {
      return inc.categories?.includes('Electrical & Public Safety');
    }
    if (activeFilter === 'SHORTAGE') {
      return inc.shortage_detected || inc.recommended_resources?.some(r => r.status === 'CONTINGENCY_RECOMMENDED' || r.is_contingency);
    }
    return true;
  });

  // Sort incidents
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'SEVERITY') {
      return (b.severity || 0) - (a.severity || 0);
    }
    if (sortBy === 'REPORTS') {
      const aCount = a.report_ids?.length || a.linked_report_ids?.length || 0;
      const bCount = b.report_ids?.length || b.linked_report_ids?.length || 0;
      return bCount - aCount;
    }
    if (sortBy === 'TIME') {
      return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    }
    return 0;
  });

  const getCategoryClass = (cat) => {
    if (cat.includes('Water')) return 'water';
    if (cat.includes('Road')) return 'road';
    if (cat.includes('Electrical')) return 'electrical';
    return 'compound';
  };

  const getPriorityClass = (priority) => {
    const p = (priority || '').toUpperCase();
    if (p === 'CRITICAL') return 'critical';
    if (p === 'HIGH') return 'high';
    if (p === 'MEDIUM') return 'medium';
    return 'low';
  };

  return (
    <aside className="incident-panel" id="incident-panel">
      {/* Search & Filter Controls */}
      <div className="incident-filter-bar">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input
            id="incident-search-input"
            type="text"
            className="search-input"
            placeholder="Search incident, junction, hazard..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <button
            className={`filter-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            All ({incidents.length})
          </button>
          <button
            className={`filter-pill ${activeFilter === 'CRITICAL_HIGH' ? 'active' : ''}`}
            onClick={() => setActiveFilter('CRITICAL_HIGH')}
          >
            Critical / High
          </button>
          <button
            className={`filter-pill ${activeFilter === 'WATER' ? 'active' : ''}`}
            onClick={() => setActiveFilter('WATER')}
          >
            Water
          </button>
          <button
            className={`filter-pill ${activeFilter === 'ROAD' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ROAD')}
          >
            Roads
          </button>
          <button
            className={`filter-pill ${activeFilter === 'ELECTRICAL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ELECTRICAL')}
          >
            Electrical
          </button>
          <button
            className={`filter-pill ${activeFilter === 'SHORTAGE' ? 'active' : ''}`}
            onClick={() => setActiveFilter('SHORTAGE')}
          >
            Shortage Alert
          </button>
        </div>
      </div>

      {/* Incident Cards Feed */}
      <div className="incident-list-container" id="incident-cards-container">
        {sorted.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            No incident clusters matching criteria.
          </div>
        ) : (
          sorted.map((inc) => {
            const isSelected = inc.id === selectedIncidentId;
            const priorityClass = getPriorityClass(inc.priority);
            const reportCount = inc.report_ids?.length || inc.linked_report_ids?.length || 0;
            const hasShortageAlert = inc.shortage_detected || inc.recommended_resources?.some(r => r.status === 'CONTINGENCY_RECOMMENDED' || r.is_contingency);

            return (
              <div
                key={inc.id}
                id={`incident-card-${inc.id}`}
                className={`incident-card ${isSelected ? 'selected' : ''} is-${priorityClass}`}
                onClick={() => onSelectIncident(inc.id)}
              >
                <div className="card-top-row">
                  <span className="incident-id-badge">{inc.id}</span>
                  <div className={`severity-pill ${priorityClass}`}>
                    {inc.priority === 'CRITICAL' && <Flame size={12} />}
                    <span>{inc.severity}/100 {inc.priority}</span>
                  </div>
                </div>

                <h4 className="card-title">{inc.title}</h4>

                <div className="card-tags">
                  {inc.categories?.map((cat, idx) => (
                    <span key={idx} className={`category-tag ${getCategoryClass(cat)}`}>
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="card-meta-row">
                  <span className="corroboration-count">
                    <Users size={12} />
                    {reportCount} Corroborated Reports
                  </span>

                  {hasShortageAlert && (
                    <span className="shortage-warning-badge" title="Contingency dispatched due to resource shortage">
                      <AlertTriangle size={11} />
                      Contingency
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

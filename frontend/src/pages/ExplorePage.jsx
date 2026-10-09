import React, { useState, useMemo } from 'react';
import MapView from '../components/MapView';
import { 
  Search, 
  MapPin, 
  Clock, 
  Filter, 
  X, 
  PlusCircle, 
  MessageSquare, 
  ChevronRight, 
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { getFriendlyLocationName } from '../utils/geoUtils';

export default function ExplorePage({
  incidents = [],
  reports = [],
  resources = [],
  selectedIncidentId,
  panToCoordinates,
  onSelectIncident,
  onOpenCitizenChat,
  onOpenCitizenDetails,
  onOpenSubmitModal,
  myReportIds = [],
  onCenterMap
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [viewLayout, setViewLayout] = useState('split'); // 'split' | 'map-full'

  // Filtered issues list
  const filteredIssues = useMemo(() => {
    return incidents.filter(inc => {
      // 1. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = inc.id.toLowerCase().includes(q);
        const matchesTitle = inc.title?.toLowerCase().includes(q);
        const matchesCat = (inc.categories || []).some(c => c.toLowerCase().includes(q));
        if (!matchesId && !matchesTitle && !matchesCat) return false;
      }

      // 2. Category
      if (selectedCategory !== 'All') {
        const matches = (inc.categories || []).some(c => 
          c.toLowerCase().includes(selectedCategory.toLowerCase())
        );
        if (!matches) return false;
      }

      // 3. Status
      if (selectedStatus !== 'All') {
        const isResolved = (inc.status || '').toLowerCase().includes('resolve');
        if (selectedStatus === 'Resolved' && !isResolved) return false;
        if (selectedStatus === 'Active' && isResolved) return false;
      }

      // 4. Priority
      if (selectedPriority !== 'All') {
        if ((inc.priority || '').toUpperCase() !== selectedPriority.toUpperCase()) return false;
      }

      return true;
    });
  }, [incidents, searchQuery, selectedCategory, selectedStatus, selectedPriority]);

  const handleCardClick = (inc) => {
    onSelectIncident(inc.id);
    if (onCenterMap && inc.latitude && inc.longitude) {
      onCenterMap(inc.latitude, inc.longitude);
    }
  };

  return (
    <div className="explore-page" id="explore-page">
      {/* Top Controls Header */}
      <div className="explore-header-bar">
        <div className="explore-header-left">
          <h2 className="explore-title">Explore City Grid Issues</h2>
          <span className="explore-subtitle">
            Showing {filteredIssues.length} active civic issues across Pune
          </span>
        </div>

        {/* View Layout Switcher */}
        <div className="explore-layout-toggle">
          <button
            type="button"
            className={`layout-btn ${viewLayout === 'split' ? 'active' : ''}`}
            onClick={() => setViewLayout('split')}
          >
            <span>Split View</span>
          </button>
          <button
            type="button"
            className={`layout-btn ${viewLayout === 'map-full' ? 'active' : ''}`}
            onClick={() => setViewLayout('map-full')}
          >
            <span>Full Map</span>
          </button>
          <button
            type="button"
            className="explore-report-btn"
            onClick={onOpenSubmitModal}
          >
            <PlusCircle size={15} />
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className={`explore-container ${viewLayout}`}>
        {/* Left / Center: Interactive Map Panel */}
        <div className="explore-map-wrapper">
          <MapView
            incidents={incidents}
            reports={reports}
            resources={resources}
            selectedIncidentId={selectedIncidentId}
            panToCoordinates={panToCoordinates}
            onSelectIncident={onSelectIncident}
            onOpenCitizenChat={onOpenCitizenChat}
            viewMode="citizen"
            myReportIds={myReportIds}
            onOpenCitizenDetails={onOpenCitizenDetails}
            onOpenSubmitModal={onOpenSubmitModal}
          />
        </div>

        {/* Right Side: Searchable & Filterable Directory Panel (in Split View) */}
        {viewLayout === 'split' && (
          <div className="explore-directory-wrapper">
            {/* Search Box */}
            <div className="explore-search-tray">
              <div className="explore-search-box">
                <Search size={15} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search by street, area, or complaint #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="explore-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="explore-search-clear"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filters Row */}
              <div className="explore-filters-row">
                {/* Category Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="explore-filter-select"
                >
                  <option value="All">All Categories</option>
                  <option value="Water & Sanitation">💧 Water & Drainage</option>
                  <option value="Road & Infrastructure">🛣️ Roads & Footpaths</option>
                  <option value="Electrical & Public Safety">⚡ Electricity & Safety</option>
                </select>

                {/* Status Dropdown */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="explore-filter-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active / In Progress</option>
                  <option value="Resolved">🟢 Resolved</option>
                </select>

                {/* Priority Dropdown */}
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="explore-filter-select"
                >
                  <option value="All">All Priorities</option>
                  <option value="CRITICAL">🔴 Critical</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🔵 Low</option>
                </select>
              </div>
            </div>

            {/* Issues List Feed */}
            <div className="explore-issues-list">
              {filteredIssues.length === 0 ? (
                <div className="explore-empty-state">
                  <div className="empty-icon-circle">
                    <Search size={22} color="#94a3b8" />
                  </div>
                  <strong style={{ color: '#1e293b' }}>No Matching Issues Found</strong>
                  <p style={{ fontSize: '12px', color: '#64748b', maxWidth: '240px', margin: '4px auto 12px auto' }}>
                    Try adjusting your search terms or clearing selected category and priority filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedStatus('All');
                      setSelectedPriority('All');
                    }}
                    className="btn-clear-filters"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                filteredIssues.map((inc) => {
                  const isSelected = inc.id === selectedIncidentId;
                  const isResolved = (inc.status || '').toLowerCase().includes('resolve');
                  const friendlyLoc = getFriendlyLocationName(inc.latitude, inc.longitude);
                  const priority = (inc.priority || 'MEDIUM').toUpperCase();
                  const priorityColor = isResolved ? '#16a34a' : priority === 'CRITICAL' ? '#dc2626' : priority === 'HIGH' ? '#ea580c' : '#2563eb';

                  const primaryReport = reports.find(r => inc.linked_report_ids?.includes(r.report_id || r.id)) || {
                    report_id: inc.linked_report_ids?.[0] || inc.id,
                    id: inc.linked_report_ids?.[0] || inc.id,
                    title: inc.title,
                    description: inc.title,
                    category: inc.categories?.[0] || 'Road & Infrastructure',
                    latitude: inc.latitude,
                    longitude: inc.longitude,
                    status: inc.status || 'Active'
                  };

                  return (
                    <div
                      key={inc.id}
                      className={`explore-issue-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleCardClick(inc)}
                    >
                      {/* Top Row: ID, Priority & Status */}
                      <div className="card-top-row">
                        <strong className="card-issue-id">#{inc.id}</strong>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span 
                            className="card-priority-badge"
                            style={{ 
                              background: `${priorityColor}15`, 
                              color: priorityColor,
                              border: `1px solid ${priorityColor}30`
                            }}
                          >
                            {isResolved ? 'RESOLVED' : `${priority}`}
                          </span>
                          <span className={`card-status-badge ${isResolved ? 'resolved' : 'active'}`}>
                            {inc.status || 'Under Review'}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="card-issue-title">
                        {inc.title}
                      </h4>

                      {/* Category & Location */}
                      <div className="card-meta-row">
                        <div className="card-meta-item">
                          <span>🏷️</span>
                          <span style={{ fontWeight: 600 }}>{inc.categories?.join(', ')}</span>
                        </div>
                        <div className="card-meta-item">
                          <MapPin size={12} color="#0284c7" />
                          <span>{friendlyLoc}</span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="card-action-bar">
                        <button
                          type="button"
                          className="btn-card-details"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenCitizenDetails) onOpenCitizenDetails(primaryReport);
                          }}
                        >
                          <span>View Details</span>
                          <ChevronRight size={13} />
                        </button>

                        <button
                          type="button"
                          className="btn-card-chat"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenCitizenChat) onOpenCitizenChat(primaryReport);
                          }}
                          title="Chat with authority assigned to this incident"
                        >
                          <MessageSquare size={13} />
                          <span>Chat</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

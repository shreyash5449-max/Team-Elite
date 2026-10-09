import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  PlusCircle, 
  Search, 
  ChevronRight, 
  Image as ImageIcon,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { getFriendlyLocationName } from '../utils/geoUtils';

export default function MyComplaintsPage({
  reports = [],
  myReportIds = [],
  onNavigate,
  onOpenDetails,
  onOpenChat,
  onViewOnMap
}) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter citizen's own complaints
  const myComplaints = useMemo(() => {
    return reports.filter(r => {
      const id = r.report_id || r.id;
      return myReportIds.includes(id);
    });
  }, [reports, myReportIds]);

  const filteredComplaints = useMemo(() => {
    return myComplaints.filter(r => {
      const id = r.report_id || r.id;
      const isResolved = (r.status || '').toLowerCase().includes('resolve');
      const isProgress = (r.status || '').toLowerCase().includes('progress') || (r.status || '').toLowerCase().includes('dispatch');
      const isReview = !isResolved && !isProgress;

      if (statusFilter === 'Under Review' && !isReview) return false;
      if (statusFilter === 'In Progress' && !isProgress) return false;
      if (statusFilter === 'Resolved' && !isResolved) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = id.toLowerCase().includes(q);
        const matchesDesc = (r.description || '').toLowerCase().includes(q);
        const matchesCat = (r.category || '').toLowerCase().includes(q);
        if (!matchesId && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [myComplaints, statusFilter, searchQuery]);

  return (
    <div className="my-complaints-page site-container" id="my-complaints-page">
      {/* Header Bar */}
      <div className="page-header-row">
        <div>
          <span className="section-label">Citizen Grievance Center</span>
          <h1 className="page-title">My Filed Complaints</h1>
          <p className="page-subtitle">
            Track real-time inspection milestones and direct communication for issues you reported.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary-header"
          onClick={() => onNavigate('report')}
        >
          <PlusCircle size={16} />
          <span>Report New Problem</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="complaints-filter-bar">
        <div className="status-tab-group">
          {[
            { label: 'All', count: myComplaints.length },
            { label: 'Under Review', count: myComplaints.filter(r => !(r.status || '').toLowerCase().includes('resolve') && !(r.status || '').toLowerCase().includes('progress')).length },
            { label: 'In Progress', count: myComplaints.filter(r => (r.status || '').toLowerCase().includes('progress') || (r.status || '').toLowerCase().includes('dispatch')).length },
            { label: 'Resolved', count: myComplaints.filter(r => (r.status || '').toLowerCase().includes('resolve')).length }
          ].map(tab => (
            <button
              key={tab.label}
              type="button"
              className={`status-tab-btn ${statusFilter === tab.label ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.label)}
            >
              <span>{tab.label}</span>
              <span className="tab-count-pill">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="complaints-search-box">
          <Search size={15} color="#64748b" />
          <input
            type="text"
            placeholder="Search your complaints by ID, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="complaints-search-input"
          />
        </div>
      </div>

      {/* Complaints Feed */}
      {filteredComplaints.length === 0 ? (
        <div className="complaints-empty-state">
          <div className="empty-icon-circle">
            <ClipboardList size={32} color="#94a3b8" />
          </div>
          <h3 className="empty-title">
            {myComplaints.length === 0 ? 'No Complaints Filed Yet' : 'No Matching Complaints Found'}
          </h3>
          <p className="empty-desc">
            {myComplaints.length === 0 
              ? 'Notice a problem in your street or neighborhood? Report it in 2 minutes and monitor its resolution here.'
              : 'Try clearing your search query or selecting the "All" status filter.'}
          </p>
          <button
            type="button"
            className="btn-primary-large"
            onClick={() => onNavigate('report')}
            style={{ marginTop: '12px' }}
          >
            <PlusCircle size={16} />
            <span>Report a Problem Now</span>
          </button>
        </div>
      ) : (
        <div className="complaints-cards-grid">
          {filteredComplaints.map(report => {
            const repId = report.report_id || report.id;
            const isResolved = (report.status || '').toLowerCase().includes('resolve');
            const isDispatched = (report.status || '').toLowerCase().includes('progress') || (report.status || '').toLowerCase().includes('dispatch');
            const currentStep = isResolved ? 4 : isDispatched ? 3 : 2;
            const friendlyLoc = getFriendlyLocationName(report.latitude, report.longitude);
            const photoUrl = report.evidence || (report.image ? `/evidence/${report.image}` : null);
            const dateStr = report.timestamp 
              ? new Date(report.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Recently Logged';

            return (
              <div key={repId} className="citizen-complaint-tracking-card">
                {/* Top Row: Ref ID & Status Badge */}
                <div className="tracking-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="complaint-ref-pill">#{repId}</span>
                    <span className="complaint-category-pill">{report.category}</span>
                  </div>
                  <span className={`status-badge-pill ${isResolved ? 'resolved' : isDispatched ? 'in-progress' : 'review'}`}>
                    {isResolved ? '✓ Resolved' : isDispatched ? '⚡ In Progress' : '📋 Under Review'}
                  </span>
                </div>

                {/* Description */}
                <h3 className="tracking-card-title">
                  {report.description}
                </h3>

                {/* 4-Step Resolution Progress Tracker */}
                <div className="tracking-progress-section">
                  <div className="progress-steps-row">
                    {[
                      { step: 1, label: 'Reported' },
                      { step: 2, label: 'Under Review' },
                      { step: 3, label: 'In Progress' },
                      { step: 4, label: 'Resolved' }
                    ].map(st => {
                      const isCompleted = currentStep >= st.step;
                      const isCurrent = currentStep === st.step;
                      return (
                        <div key={st.step} className="progress-step-item">
                          <div className={`step-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            {isCompleted ? '✓' : st.step}
                          </div>
                          <span className={`step-text ${isCompleted ? 'completed' : ''}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Location & Metadata Row */}
                <div className="tracking-meta-row">
                  <div className="meta-tag">
                    <MapPin size={13} color="#0284c7" />
                    <span>{friendlyLoc}</span>
                  </div>
                  <div className="meta-tag">
                    <Clock size={13} color="#64748b" />
                    <span>{dateStr}</span>
                  </div>
                  {photoUrl && (
                    <div className="meta-tag photo-tag">
                      <ImageIcon size={13} color="#10b981" />
                      <span>Photo Proof Attached</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="tracking-card-actions">
                  <button
                    type="button"
                    className="btn-tracking-action"
                    onClick={() => {
                      if (onViewOnMap) onViewOnMap(report.latitude, report.longitude);
                    }}
                  >
                    <MapPin size={13} />
                    <span>View on Map</span>
                  </button>

                  <button
                    type="button"
                    className="btn-tracking-action"
                    onClick={() => onOpenDetails && onOpenDetails(report)}
                  >
                    <span>Full Details</span>
                    <ChevronRight size={13} />
                  </button>

                  <button
                    type="button"
                    className="btn-tracking-chat"
                    onClick={() => onOpenChat && onOpenChat(report)}
                  >
                    <MessageSquare size={13} />
                    <span>Chat with Authority</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

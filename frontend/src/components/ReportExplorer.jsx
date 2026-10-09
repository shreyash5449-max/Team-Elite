import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Image as ImageIcon, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Plus, 
  Check, 
  X, 
  AlertCircle,
  Eye,
  MessageSquare
} from 'lucide-react';

export default function ReportExplorer({
  reports = [],
  incidents = [],
  onOpenSubmitModal,
  onOpenEvidenceModal,
  onSelectIncident,
  onCenterMapOnCoordinates,
  onUpdateReport,
  onDeleteReport,
  onOpenCitizenChat
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [editingReportId, setEditingReportId] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', category: '', status: '' });
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filter reports
  const filteredReports = reports.filter(report => {
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = (report.report_id || report.id || '').toLowerCase().includes(term);
      const matchDesc = (report.description || '').toLowerCase().includes(term);
      const matchCat = (report.category || '').toLowerCase().includes(term);
      if (!matchId && !matchDesc && !matchCat) return false;
    }

    // Category
    if (selectedCategory !== 'All' && report.category !== selectedCategory) {
      return false;
    }

    // Status
    if (selectedStatus !== 'All') {
      const repStatus = (report.status || 'Linked').toLowerCase();
      if (repStatus !== selectedStatus.toLowerCase()) return false;
    }

    return true;
  });

  const handleStartEdit = (report) => {
    setEditingReportId(report.report_id || report.id);
    setEditForm({
      description: report.description,
      category: report.category,
      status: report.status || 'Linked'
    });
    setActionError(null);
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setEditForm({ description: '', category: '', status: '' });
  };

  const handleSaveEdit = async (reportId) => {
    if (!editForm.description.trim()) {
      setActionError('Description cannot be empty.');
      return;
    }

    try {
      setActionError(null);
      await onUpdateReport(reportId, editForm);
      setEditingReportId(null);
      setActionSuccess(`Report ${reportId} updated successfully.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to update report.');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm(`Are you sure you want to delete report ${reportId}? This will update related incident clusters.`)) {
      return;
    }

    try {
      setActionError(null);
      await onDeleteReport(reportId);
      setActionSuccess(`Report ${reportId} deleted.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to delete report.');
    }
  };

  // Find which incident a report belongs to
  const getLinkedIncident = (repId) => {
    return incidents.find(inc => inc.linked_report_ids?.includes(repId));
  };

  return (
    <div className="reports-explorer-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header Bar */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-medium)', background: '#0b1120' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Citizen Incident Reports ({reports.length})
            </h2>
          </div>

          <button
            type="button"
            className="btn-header btn-primary-header"
            onClick={onOpenSubmitModal}
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            <Plus size={13} />
            <span>+ New Report</span>
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search reports by ID, description, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px', fontSize: '12px' }}
          />
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {['All', 'Water & Sanitation', 'Road & Infrastructure', 'Electrical & Public Safety'].map(cat => (
            <button
              key={cat}
              type="button"
              className={`preset-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                background: selectedCategory === cat ? '#0284c7' : 'rgba(15, 23, 42, 0.6)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: selectedCategory === cat ? '1px solid #38bdf8' : '1px solid var(--border-subtle)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>Status:</span>
          {['All', 'Linked', 'Open', 'Resolved'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              style={{
                background: 'transparent',
                border: 'none',
                color: selectedStatus === st ? '#38bdf8' : 'var(--text-muted)',
                fontWeight: selectedStatus === st ? 700 : 400,
                textDecoration: selectedStatus === st ? 'underline' : 'none',
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              {st}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
            Showing {filteredReports.length} of {reports.length}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div style={{ margin: '8px 20px', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Check size={14} />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div style={{ margin: '8px 20px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Reports Scrollable Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredReports.map(report => {
          const repId = report.report_id || report.id;
          const isEditing = editingReportId === repId;
          const linkedInc = getLinkedIncident(repId);
          const hasPhoto = Boolean(report.image || report.evidence);
          const photoUrl = report.evidence || (report.image ? `/evidence/${report.image}` : null);

          if (isEditing) {
            return (
              <div 
                key={repId}
                style={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid #38bdf8',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#38bdf8' }}>
                    Edit {repId}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-header"
                      onClick={() => handleSaveEdit(repId)}
                      style={{ background: '#0284c7', color: '#fff', padding: '4px 10px', fontSize: '11px' }}
                    >
                      <Check size={12} /> Save
                    </button>
                    <button
                      type="button"
                      className="btn-header"
                      onClick={handleCancelEdit}
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Category</label>
                  <select
                    className="form-select"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    <option value="Water & Sanitation">Water & Sanitation</option>
                    <option value="Road & Infrastructure">Road & Infrastructure</option>
                    <option value="Electrical & Public Safety">Electrical & Public Safety</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Description</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Status</label>
                  <select
                    className="form-select"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Linked">Linked</option>
                    <option value="Open">Open</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>
            );
          }

          return (
            <div
              key={repId}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'border-color 0.2s'
              }}
            >
              {/* Top Meta */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    fontSize: '12px',
                    color: '#38bdf8'
                  }}>
                    {repId}
                  </span>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: report.category?.includes('Water') ? 'rgba(56, 189, 248, 0.15)' :
                                report.category?.includes('Electrical') ? 'rgba(239, 68, 68, 0.15)' :
                                'rgba(245, 158, 11, 0.15)',
                    color: report.category?.includes('Water') ? '#38bdf8' :
                           report.category?.includes('Electrical') ? '#f87171' :
                           '#fbbf24',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    {report.category}
                  </span>

                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: (report.status || 'Linked') === 'Resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                    color: (report.status || 'Linked') === 'Resolved' ? '#34d399' : 'var(--text-secondary)'
                  }}>
                    {report.status || 'Linked'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(report)}
                    title="Edit report"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(repId)}
                    title="Delete report"
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '3px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: '13px', color: '#f8fafc', lineHeight: 1.4 }}>
                {report.description}
              </div>

              {/* Photo Evidence & Details Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} />
                    {report.timestamp ? new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Logged'}
                  </span>

                  {report.latitude && (
                    <button
                      type="button"
                      onClick={() => onCenterMapOnCoordinates && onCenterMapOnCoordinates(report.latitude, report.longitude)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        padding: 0,
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title="Center on map"
                    >
                      <MapPin size={11} />
                      {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                    </button>
                  )}

                  {linkedInc && (
                    <button
                      type="button"
                      onClick={() => onSelectIncident && onSelectIncident(linkedInc.id)}
                      style={{
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        color: '#38bdf8',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title={`Inspect unified incident ${linkedInc.id}`}
                    >
                      <span>Cluster: {linkedInc.id}</span>
                      <ExternalLink size={9} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn-header"
                    onClick={() => onOpenCitizenChat && onOpenCitizenChat(report)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      background: 'rgba(14, 165, 233, 0.15)',
                      border: '1px solid #0284c7',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={`Open private chat with assigned authority for complaint ${repId}`}
                  >
                    <MessageSquare size={11} />
                    <span>Chat with Authority</span>
                  </button>

                  {hasPhoto && (
                    <button
                      type="button"
                      className="btn-header"
                      onClick={() => onOpenEvidenceModal && onOpenEvidenceModal(report)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        cursor: 'pointer'
                      }}
                    >
                      <ImageIcon size={11} />
                      <span>View Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredReports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <div style={{ fontSize: '13px', fontWeight: 600 }}>No reports matched filters</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>Try adjusting your search query or category filters.</div>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  PlusCircle, 
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { getFriendlyLocationName } from '../utils/geoUtils';

export default function CitizenMyComplaintsDrawer({
  isOpen,
  onClose,
  reports = [],
  myReportIds = [],
  onViewOnMap,
  onOpenDetails,
  onOpenChat,
  onOpenReportModal
}) {
  if (!isOpen) return null;

  // Find all citizen reports matching myReportIds
  const myReports = reports.filter(r => {
    const id = r.report_id || r.id;
    return myReportIds.includes(id);
  });

  return (
    <div 
      className="citizen-drawer-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1100,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      <div 
        className="citizen-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          background: '#ffffff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s ease-out'
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Citizen Grievance Tracker
            </span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              My Filed Complaints ({myReports.length})
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Header Button */}
        <div style={{ padding: '12px 16px', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenReportModal) onOpenReportModal();
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
            }}
          >
            <PlusCircle size={15} />
            <span>Report a New Civic Problem</span>
          </button>
        </div>

        {/* Drawer List Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myReports.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#64748b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={24} color="#94a3b8" />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                No Complaints Filed Yet
              </div>
              <div style={{ fontSize: '12px', maxWidth: '280px', lineHeight: 1.4 }}>
                When you report issues on the map, they will appear here with live resolution updates and authority chat.
              </div>
            </div>
          ) : (
            myReports.map((rep) => {
              const repId = rep.report_id || rep.id;
              const isResolved = (rep.status || '').toLowerCase().includes('resolve');
              const isDispatched = (rep.status || '').toLowerCase().includes('progress') || (rep.status || '').toLowerCase().includes('dispatch');
              const statusText = isResolved ? 'Resolved' : isDispatched ? 'In Progress' : 'Under Review';
              const statusBg = isResolved ? '#dcfce7' : isDispatched ? '#e0f2fe' : '#fef9c3';
              const statusColor = isResolved ? '#15803d' : isDispatched ? '#0369a1' : '#a16207';
              const friendlyLoc = getFriendlyLocationName(rep.latitude, rep.longitude);

              return (
                <div
                  key={repId}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'border-color 0.15s, box-shadow 0.15s'
                  }}
                >
                  {/* Top Bar: ID & Status Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '12.5px', color: '#0284c7', fontFamily: 'monospace' }}>
                      #{repId}
                    </strong>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: statusBg,
                      color: statusColor
                    }}>
                      {statusText}
                    </span>
                  </div>

                  {/* Category & Description */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      {rep.category}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '2px', lineHeight: 1.35 }}>
                      {rep.description}
                    </div>
                  </div>

                  {/* Location & Date */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={12} color="#0284c7" />
                      <span>{friendlyLoc}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={12} />
                      <span>{rep.timestamp ? new Date(rep.timestamp).toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px',
                    paddingTop: '8px',
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onViewOnMap) onViewOnMap(rep.latitude, rep.longitude);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <MapPin size={12} />
                      <span>View Map</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenDetails) onOpenDetails(rep);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#0284c7',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Details</span>
                      <ChevronRight size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenChat) onOpenChat(rep);
                      }}
                      style={{
                        padding: '6px 10px',
                        background: '#0284c7',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 1px 4px rgba(2, 132, 199, 0.3)'
                      }}
                      title="Chat with assigned authority"
                    >
                      <MessageSquare size={12} />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

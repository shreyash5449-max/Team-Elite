import React from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Image as ImageIcon, 
  AlertTriangle,
  Shield,
  Truck
} from 'lucide-react';
import { getFriendlyLocationName } from '../utils/geoUtils';

export default function CitizenComplaintModal({
  isOpen,
  onClose,
  complaint,
  onOpenChat
}) {
  if (!isOpen || !complaint) return null;

  const id = complaint.id || complaint.report_id;
  const isResolved = (complaint.status || '').toLowerCase().includes('resolve');
  const isDispatched = (complaint.status || '').toLowerCase().includes('dispatch') || (complaint.status || '').toLowerCase().includes('progress');

  // Friendly status step
  const currentStep = isResolved ? 4 : isDispatched ? 3 : 2;

  // Category Icon & Color
  const cat = complaint.category || (complaint.categories?.[0]) || 'General Civic Issue';
  const isWater = cat.includes('Water');
  const isElec = cat.includes('Electrical');
  const isRoad = cat.includes('Road');

  const catIcon = isWater ? '💧' : isElec ? '⚡' : isRoad ? '🛣️' : '⚠️';

  // Photo
  const photoUrl = complaint.evidence || (complaint.image ? `/evidence/${complaint.image}` : null);

  // Friendly formatted date
  const reportedDate = complaint.timestamp 
    ? new Date(complaint.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Recently Logged';

  return (
    <div className="modal-overlay" id="citizen-complaint-modal" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '520px', 
          background: '#ffffff', 
          color: '#1e293b', 
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>{catIcon}</span>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Complaint #{id}
              </span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                {complaint.title || complaint.description?.slice(0, 45) || 'Civic Issue'}
              </h3>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Progress Tracker Bar */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
              Resolution Progress
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              {[
                { label: 'Reported', step: 1 },
                { label: 'Under Review', step: 2 },
                { label: 'In Progress', step: 3 },
                { label: 'Resolved', step: 4 }
              ].map((st, idx) => {
                const isPassed = currentStep >= st.step;
                const isCurrent = currentStep === st.step;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: isPassed ? '#10b981' : '#e2e8f0',
                      color: isPassed ? '#fff' : '#64748b',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: isCurrent ? '2px solid #047857' : 'none',
                      boxShadow: isCurrent ? '0 0 6px rgba(16, 185, 129, 0.4)' : 'none'
                    }}>
                      {isPassed ? '✓' : st.step}
                    </div>
                    <span style={{ fontSize: '10.5px', marginTop: '4px', color: isPassed ? '#0f172a' : '#94a3b8', fontWeight: isCurrent ? 700 : 500 }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Issue Details Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
              {complaint.description || complaint.title}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#64748b', paddingTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="#0284c7" />
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {complaint.location_name || getFriendlyLocationName(complaint.latitude, complaint.longitude)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} color="#64748b" />
                <span>{reportedDate}</span>
              </div>
            </div>
          </div>

          {/* Photo Evidence (if any) */}
          {photoUrl && (
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <img 
                src={photoUrl} 
                alt="Complaint evidence" 
                style={{ width: '100%', maxHeight: '180px', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div style={{ padding: '6px 10px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ImageIcon size={12} />
                <span>Citizen photographic proof verified</span>
              </div>
            </div>
          )}

          {/* Assigned Officer / Team Note */}
          <div style={{
            background: 'rgba(2, 132, 199, 0.06)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            borderRadius: '8px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Shield size={18} color="#0284c7" />
            <div style={{ fontSize: '11.5px', color: '#0f172a', lineHeight: 1.35 }}>
              <div><strong>Municipal Department:</strong> {cat}</div>
              <div style={{ color: '#64748b' }}>Assigned for inspection and public safety resolution.</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #f1f5f9',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenChat) onOpenChat(complaint);
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
            }}
          >
            <MessageSquare size={14} />
            <span>Chat with Authority</span>
          </button>
        </div>
      </div>
    </div>
  );
}

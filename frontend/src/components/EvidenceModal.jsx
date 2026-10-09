import React from 'react';
import { X, Camera, MapPin, Clock, CheckCircle } from 'lucide-react';

export default function EvidenceModal({ isOpen, onClose, report = null }) {
  if (!isOpen || !report) return null;

  const imageSrc = report.imageSrc || 
    (report.evidence && (report.evidence.startsWith('data:') || report.evidence.startsWith('/')) ? report.evidence : null) || 
    (report.image ? (report.image.startsWith('/') ? report.image : `/evidence/${report.image}`) : '');

  return (
    <div className="modal-overlay" id="evidence-inspection-modal" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Camera size={18} color="#38bdf8" />
            <span>Citizen Photographic Evidence Inspection ({report.id || report.report_id})</span>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
            <img
              src={imageSrc}
              alt="Evidence photo"
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '380px', objectFit: 'contain', background: '#090d16' }}
            />
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(16, 185, 129, 0.9)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle size={12} />
              <span>Verified Citizen Asset</span>
            </div>
          </div>

          <div style={{ background: '#111a2e', padding: '12px 14px', borderRadius: '8px', border: '1px solid #223254', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
              {report.description}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                {new Date(report.timestamp).toLocaleString()}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} />
                {report.latitude}°N, {report.longitude}°E
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

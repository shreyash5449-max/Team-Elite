import React, { useState, useRef } from 'react';
import { 
  X, 
  Send, 
  MapPin, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Compass,
  Copy,
  Check,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import { PUNE_LANDMARKS, getFriendlyLocationName } from '../utils/geoUtils';

const PROBLEM_CATEGORIES = [
  {
    id: 'Water & Sanitation',
    title: 'Water & Drainage',
    icon: '💧',
    desc: 'Pipeline leaks, overflowing sewers, drainage blockage, waterlogging',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd'
  },
  {
    id: 'Road & Infrastructure',
    title: 'Roads & Footpaths',
    icon: '🛣️',
    desc: 'Deep potholes, broken sidewalks, damaged road dividers, street debris',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a'
  },
  {
    id: 'Electrical & Public Safety',
    title: 'Electricity & Streetlights',
    icon: '⚡',
    desc: 'Fallen or sparking wires, unlit streetlights, open electric boxes',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca'
  },
  {
    id: 'Public Safety & Hazards',
    title: 'General Civic Issue',
    icon: '⚠️',
    desc: 'Garbage dump accumulation, fallen trees, public hygiene hazards',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe'
  }
];

const SUGGESTED_DESCRIPTIONS = {
  'Water & Sanitation': [
    'Major water pipe leak flooding the road',
    'Sewage overflowing onto pedestrian walkway',
    'Drainage cover missing, causing traffic hazard',
    'Low water pressure and dirty municipal supply'
  ],
  'Road & Infrastructure': [
    'Deep dangerous pothole damaging two-wheelers',
    'Caved-in asphalt surface after recent rains',
    'Broken footpath tiles creating trip hazard',
    'Damaged road guardrail posing danger to vehicles'
  ],
  'Electrical & Public Safety': [
    'Live power wire dangling near walkway',
    'Streetlights completely off along entire block',
    'Electrical distribution box left open and sparking',
    'Leaning streetlight pole at risk of collapse'
  ],
  'Public Safety & Hazards': [
    'Large fallen tree branch obstructing traffic',
    'Unattended garbage pile attracting strays',
    'Open construction ditch without warning barricades'
  ]
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function SubmitReportModal({ 
  isOpen, 
  onClose, 
  onSubmitReport,
  onTrackInMyComplaints,
  onViewOnMap
}) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Type, 2: Description, 3: Location, 4: Photo, 5: Review
  const [category, setCategory] = useState('Water & Sanitation');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(18.5314);
  const [longitude, setLongitude] = useState(73.8446);
  const [selectedLandmark, setSelectedLandmark] = useState('Shivaji Nagar Junction');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  // Photo Evidence State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Submission & Confirmation State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSelectCategory = (catId) => {
    setCategory(catId);
  };

  const handleSelectLandmark = (lm) => {
    setSelectedLandmark(lm.name);
    setLatitude(lm.lat);
    setLongitude(lm.lng);
    setLocationError(null);
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setLocationError('GPS geolocation is not supported by your browser. Please choose an area below.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        setSelectedLandmark('Current GPS Location');
      },
      (err) => {
        setIsLocating(false);
        setLocationError('Location permission denied or unavailable. Please select your nearest neighborhood below.');
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    const fileType = file.type ? file.type.toLowerCase() : '';
    const hasValidExt = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!ALLOWED_MIME_TYPES.includes(fileType) && !hasValidExt) {
      setFileError('Invalid format. Please attach a JPG, PNG, or WEBP photo.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`File size (${sizeMb} MB) exceeds maximum allowed 5 MB limit.`);
      e.target.value = '';
      return;
    }

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile(file);
      setPreviewUrl(reader.result);
      setIsProcessingFile(false);
    };
    reader.onerror = () => {
      setFileError('Could not process photo. Please try again.');
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleCopyComplaintId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleResetForm = () => {
    setCurrentStep(1);
    setCategory('Water & Sanitation');
    setDescription('');
    setLatitude(18.5314);
    setLongitude(73.8446);
    setSelectedLandmark('Shivaji Nagar Junction');
    handleRemovePhoto();
    setSubmitting(false);
    setSubmitError(null);
    setSubmittedReport(null);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setCurrentStep(2);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await onSubmitReport({
        category: category,
        description: description.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date().toISOString(),
        evidence: previewUrl || null,
        image: selectedFile ? selectedFile.name : null,
        metadata: {
          source: 'Citizen Public Portal',
          landmark: selectedLandmark,
          has_photo: Boolean(previewUrl)
        }
      });

      const reportObj = res?.report || res?.data?.report || {
        report_id: `R-${Math.floor(1000 + Math.random() * 9000)}`,
        category,
        description,
        latitude,
        longitude,
        status: 'Linked'
      };

      setSubmittedReport(reportObj);
      setSubmitting(false);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit report. Please check connection and try again.');
      setSubmitting(false);
    }
  };

  const activeCategoryObj = PROBLEM_CATEGORIES.find(c => c.id === category) || PROBLEM_CATEGORIES[0];
  const friendlyLocationText = getFriendlyLocationName(latitude, longitude);

  // =========================================================================
  // SUCCESS / CONFIRMATION SCREEN
  // =========================================================================
  if (submittedReport) {
    const reportId = submittedReport.report_id || submittedReport.id;
    return (
      <div className="modal-overlay" id="submit-success-modal" onClick={handleClose} style={{ zIndex: 1200 }}>
        <div 
          className="modal-content" 
          onClick={(e) => e.stopPropagation()} 
          style={{ 
            maxWidth: '520px', 
            background: '#ffffff', 
            color: '#0f172a',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
            border: '1px solid #cbd5e1',
            overflow: 'hidden',
            padding: '0'
          }}
        >
          {/* Top Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            padding: '28px 24px 22px 24px',
            textAlign: 'center',
            color: '#ffffff'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#ffffff',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
            }}>
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0' }}>
              Complaint Registered Successfully!
            </h2>
            <p style={{ fontSize: '13px', margin: 0, opacity: 0.9 }}>
              Your issue has been logged with Pune Municipal Coordination
            </p>
          </div>

          {/* Ticket Details Body */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Complaint ID Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Your Complaint Reference ID
                </span>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#0284c7', fontFamily: 'monospace', marginTop: '2px' }}>
                  #{reportId}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyComplaintId(reportId)}
                style={{
                  background: copiedId ? '#dcfce7' : '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: copiedId ? '#15803d' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                title="Copy Reference ID"
              >
                {copiedId ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '12px',
              background: '#ffffff'
            }}>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Problem Category</span>
                <strong style={{ color: '#0f172a', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span>{activeCategoryObj.icon}</span>
                  <span>{category}</span>
                </strong>
              </div>

              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Current Status</span>
                <strong style={{ color: '#0284c7', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }}></span>
                  <span>Received & Under Review</span>
                </strong>
              </div>

              <div style={{ gridColumn: 'span 2', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Reported Location</span>
                <strong style={{ color: '#0f172a', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <MapPin size={13} color="#0284c7" />
                  <span>{friendlyLocationText}</span>
                </strong>
              </div>
            </div>

            {/* Reassurance Message */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(2, 132, 199, 0.06)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '12px',
              color: '#334155'
            }}>
              <Clock size={16} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                Municipal response teams inspect civic hazards promptly. You can monitor live progress under <strong>My Complaints</strong> or chat directly with assigned officers.
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  const id = reportId;
                  handleClose();
                  if (onTrackInMyComplaints) onTrackInMyComplaints(id);
                }}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                }}
              >
                <span>Track in My Complaints</span>
                <span>→</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    if (onViewOnMap) onViewOnMap(latitude, longitude);
                  }}
                  style={{
                    flex: 1,
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  View on Map
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  style={{
                    flex: 1,
                    background: '#f8fafc',
                    color: '#0284c7',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Report Another Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5-STEP GUIDED CITIZEN REPORT FORM
  // =========================================================================
  return (
    <div className="modal-overlay" id="submit-report-modal" onClick={handleClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '560px', 
          background: '#ffffff', 
          color: '#0f172a',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
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
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Citizen Grievance Portal
            </span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Report a Civic Problem
            </h3>
          </div>

          <button 
            type="button" 
            onClick={handleClose}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 5-Step Progress Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: '8px 16px',
          gap: '4px',
          overflowX: 'auto'
        }}>
          {[
            { step: 1, label: '1. Problem Type' },
            { step: 2, label: '2. Description' },
            { step: 3, label: '3. Location' },
            { step: 4, label: '4. Photo' },
            { step: 5, label: '5. Review' }
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? '#0284c7' : isCompleted ? '#e0f2fe' : 'transparent',
                  color: isActive ? '#ffffff' : isCompleted ? '#0369a1' : '#64748b',
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Form Body per Step */}
        <div style={{ padding: '20px', minHeight: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {submitError && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          {/* =========================================================================
              STEP 1: SELECT PROBLEM TYPE (Visual Cards)
              ========================================================================= */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  What kind of issue are you reporting?
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Select the category that best matches what you observed on the street:
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {PROBLEM_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id)}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        border: isSelected ? `2px solid ${cat.color}` : '1.5px solid #e2e8f0',
                        background: isSelected ? cat.bg : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? `0 4px 12px ${cat.color}25` : '0 1px 3px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ fontSize: '24px' }}>{cat.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                        {cat.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.35 }}>
                        {cat.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 2: SHORT CITIZEN DESCRIPTION
              ========================================================================= */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Describe the issue in your own words
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Provide simple details so our municipal maintenance crew can find and resolve it quickly:
                </p>
              </div>

              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Huge water leak flooding the main road near junction, causing vehicles to skid and traffic jams..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />

              {/* Quick suggestions */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Or click a quick suggestion to fill:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(SUGGESTED_DESCRIPTIONS[category] || SUGGESTED_DESCRIPTIONS['Water & Sanitation']).map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDescription(sug)}
                      style={{
                        padding: '5px 9px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 3: CHOOSE LOCATION ON MAP OR GPS
              ========================================================================= */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Where is this issue located?
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Use your device GPS or select your nearest Pune area:
                </p>
              </div>

              {/* GPS Button */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleUseGps}
                  disabled={isLocating}
                  style={{
                    flex: 1,
                    background: '#f0f9ff',
                    border: '1.5px solid #0284c7',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#0284c7',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isLocating ? <Loader2 size={16} className="spin-icon" /> : <Compass size={16} />}
                  <span>{isLocating ? 'Detecting GPS...' : 'Use My Current Location (GPS)'}</span>
                </button>
              </div>

              {locationError && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#b45309',
                  fontSize: '11.5px'
                }}>
                  {locationError}
                </div>
              )}

              {/* Popular Pune Landmarks Grid */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Select Nearest Pune Neighborhood / Road:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {PUNE_LANDMARKS.slice(0, 8).map((lm) => {
                    const isSelected = selectedLandmark === lm.name;
                    return (
                      <button
                        key={lm.name}
                        type="button"
                        onClick={() => handleSelectLandmark(lm)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                          background: isSelected ? '#f0f9ff' : '#ffffff',
                          color: isSelected ? '#0369a1' : '#334155',
                          fontSize: '11.5px',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          textAlign: 'left'
                        }}
                      >
                        <MapPin size={13} color={isSelected ? '#0284c7' : '#94a3b8'} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lm.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Selected Location Indicator */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <MapPin size={14} color="#0284c7" />
                <span>Selected: <strong style={{ color: '#0f172a' }}>{friendlyLocationText}</strong></span>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 4: OPTIONAL PHOTO EVIDENCE
              ========================================================================= */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Add a Photo (Optional)
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  A photo helps city workers verify the severity and bring the right equipment:
                </p>
              </div>

              {fileError && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '11.5px'
                }}>
                  {fileError}
                </div>
              )}

              {/* Photo Upload Area */}
              {!previewUrl ? (
                <div style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Camera size={22} />
                  </div>

                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                      Take a photo or browse your gallery
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      JPG, PNG, or WEBP up to 5 MB
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '7px 14px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Upload size={14} />
                      <span>Choose File</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      style={{
                        padding: '7px 14px',
                        background: '#0284c7',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Camera size={14} />
                      <span>Take Photo</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div style={{
                  position: 'relative',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid #cbd5e1',
                  background: '#000000',
                  maxHeight: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={previewUrl}
                    alt="Uploaded issue"
                    style={{ maxHeight: '200px', width: '100%', objectFit: 'contain' }}
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Remove photo"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              STEP 5: REVIEW & SUBMIT
              ========================================================================= */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Review your complaint before sending
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Please check the summary below. Everything can be edited before final submission:
                </p>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '12.5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>Problem Type</span>
                  <strong style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{activeCategoryObj.icon}</span>
                    <span>{category}</span>
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>Location</span>
                  <strong style={{ color: '#0284c7', textAlign: 'right' }}>
                    {friendlyLocationText}
                  </strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>Description</span>
                  <div style={{
                    background: '#ffffff',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    color: '#1e293b',
                    fontSize: '12px',
                    lineHeight: 1.4
                  }}>
                    {description.trim() || '(No description written yet)'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>Photo Attached</span>
                  <span style={{ color: previewUrl ? '#16a34a' : '#64748b', fontWeight: 600 }}>
                    {previewUrl ? '✓ Photo Attached' : 'None (Optional)'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #f1f5f9',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 2 && !description.trim()) {
                  setSubmitError('Please provide a short description before proceeding.');
                  return;
                }
                setSubmitError(null);
                setCurrentStep(prev => prev + 1);
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
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !description.trim()}
              style={{
                padding: '9px 20px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
              }}
            >
              {submitting ? <Loader2 size={16} className="spin-icon" /> : <Send size={15} />}
              <span>{submitting ? 'Submitting...' : 'Submit Complaint'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

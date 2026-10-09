import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import { 
  Send, 
  MapPin, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  Copy, 
  Check, 
  Loader2, 
  Clock, 
  ShieldCheck, 
  ArrowLeft,
  X,
  ChevronRight
} from 'lucide-react';
import { PUNE_LANDMARKS, getFriendlyLocationName } from '../utils/geoUtils';

const PROBLEM_CATEGORIES = [
  {
    id: 'Road & Infrastructure',
    sub: 'Roads and potholes',
    icon: '🛣️',
    title: 'Roads & Potholes',
    desc: 'Deep craters, caved-in asphalt, damaged dividers, broken speed breakers'
  },
  {
    id: 'Water & Sanitation',
    sub: 'Water supply and leakage',
    icon: '💧',
    title: 'Water Supply & Leakage',
    desc: 'Drinking water pipeline bursts, low pressure, dirty or contaminated water'
  },
  {
    id: 'Water & Sanitation',
    sub: 'Drainage and flooding',
    icon: '🌊',
    title: 'Drainage & Flooding',
    desc: 'Sewage overflow, blocked storm drains, waterlogging after rainfall'
  },
  {
    id: 'Electrical & Public Safety',
    sub: 'Streetlights',
    icon: '💡',
    title: 'Streetlights & Lighting',
    desc: 'Darkened streets, unlit poles, flickering bulbs, damaged electrical post'
  },
  {
    id: 'Electrical & Public Safety',
    sub: 'Live wires & electrical hazards',
    icon: '⚡',
    title: 'Exposed Wires & Arcing',
    desc: 'Fallen overhead cables, open transformer boxes, sparking electrical lines'
  },
  {
    id: 'Public Safety & Hazards',
    sub: 'Garbage and sanitation',
    icon: '🗑️',
    title: 'Garbage & Sanitation',
    desc: 'Uncollected refuse, overflowing community bins, open dumping hazard'
  }
];

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function ReportProblemPage({
  onSubmitReport,
  onNavigate,
  onTrackInMyComplaints,
  onViewOnMap
}) {
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [latitude, setLatitude] = useState(18.5314);
  const [longitude, setLongitude] = useState(73.8446);
  const [addressInput, setAddressInput] = useState('Shivaji Nagar Junction, Pune');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Photo Attachment
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize interactive location picker map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const pinHtml = `
      <div style="width: 28px; height: 38px; cursor: move; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
        <svg width="28" height="38" viewBox="0 0 28 38" fill="none">
          <path d="M14 0C6.26801 0 0 6.26801 0 14C0 24.5 14 38 14 38C14 38 28 24.5 28 14C28 6.26801 21.732 0 14 0Z" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
          <circle cx="14" cy="14" r="7" fill="#ffffff"/>
          <circle cx="14" cy="14" r="4" fill="#0284c7"/>
        </svg>
      </div>
    `;

    const icon = L.divIcon({
      className: 'picker-pin-icon',
      html: pinHtml,
      iconSize: [28, 38],
      iconAnchor: [14, 38]
    });

    const marker = L.marker([latitude, longitude], { icon, draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const newLat = parseFloat(pos.lat.toFixed(5));
      const newLng = parseFloat(pos.lng.toFixed(5));
      setLatitude(newLat);
      setLongitude(newLng);
      setAddressInput(getFriendlyLocationName(newLat, newLng));
    });

    map.on('click', (e) => {
      const newLat = parseFloat(e.latlng.lat.toFixed(5));
      const newLng = parseFloat(e.latlng.lng.toFixed(5));
      marker.setLatLng([newLat, newLng]);
      setLatitude(newLat);
      setLongitude(newLng);
      setAddressInput(getFriendlyLocationName(newLat, newLng));
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map pin when landmark or GPS changes
  const updateMapPosition = (lat, lng, label) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddressInput(label || getFriendlyLocationName(lat, lng));
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.0 });
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setLocationError('GPS is not supported on this device. Please pick your area below.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        updateMapPosition(lat, lng, 'Current GPS Location (Pune)');
      },
      (err) => {
        setIsLocating(false);
        setLocationError('GPS permission was denied. You can select your area below or click on the map.');
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
      setFileError('Invalid file type. Please upload a JPG, PNG, or WEBP image.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`File size (${sizeMb} MB) exceeds maximum allowed 5 MB limit.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile(file);
      setPreviewUrl(reader.result);
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

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setSubmitError('Please enter a description of the issue.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const activeCat = PROBLEM_CATEGORIES[selectedCategoryIdx];

    try {
      const res = await onSubmitReport({
        category: activeCat.id,
        description: (title ? `${title}: ` : '') + description.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date().toISOString(),
        evidence: previewUrl || null,
        image: selectedFile ? selectedFile.name : null,
        metadata: {
          title: title.trim() || activeCat.title,
          sub_category: activeCat.sub,
          location_label: addressInput,
          additional_notes: additionalNotes.trim(),
          source: 'Citizen Web Portal',
          has_photo: Boolean(previewUrl)
        }
      });

      const reportData = res?.report || res?.data?.report || {
        report_id: `R-${Math.floor(1000 + Math.random() * 9000)}`,
        category: activeCat.id,
        title: title || activeCat.title,
        description,
        latitude,
        longitude
      };

      setSubmittedTicket(reportData);
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit complaint. Please try again.');
      setSubmitting(false);
    }
  };

  const activeCategory = PROBLEM_CATEGORIES[selectedCategoryIdx];

  // =========================================================================
  // CONFIRMATION SCREEN
  // =========================================================================
  if (submittedTicket) {
    const reportId = submittedTicket.report_id || submittedTicket.id;
    return (
      <div className="report-page site-container" id="report-success-screen">
        <div className="confirmation-card">
          <div className="confirmation-header">
            <div className="confirmation-icon-circle">
              <CheckCircle2 size={44} color="#10b981" />
            </div>
            <h2 className="confirmation-heading">Complaint Registered Successfully!</h2>
            <p className="confirmation-sub">
              Your grievance has been received and added to the official municipal dispatch queue.
            </p>
          </div>

          <div className="confirmation-body">
            <div className="ticket-id-strip">
              <div>
                <span className="ticket-label">Complaint Reference ID</span>
                <div className="ticket-number">#{reportId}</div>
              </div>
              <button
                type="button"
                className="btn-copy-ticket"
                onClick={() => handleCopyId(reportId)}
              >
                {copiedId ? <Check size={14} color="#15803d" /> : <Copy size={14} />}
                <span>{copiedId ? 'Copied' : 'Copy Reference ID'}</span>
              </button>
            </div>

            <div className="ticket-summary-grid">
              <div className="summary-field">
                <span className="field-label">Problem Category</span>
                <strong className="field-value">
                  {activeCategory.icon} {activeCategory.title}
                </strong>
              </div>

              <div className="summary-field">
                <span className="field-label">Status</span>
                <strong className="field-value status-active">
                  <span className="status-dot"></span>
                  Received • Under Review
                </strong>
              </div>

              <div className="summary-field full-width">
                <span className="field-label">Location</span>
                <strong className="field-value">
                  <MapPin size={13} color="#0284c7" />
                  <span>{addressInput}</span>
                </strong>
              </div>

              <div className="summary-field full-width">
                <span className="field-label">Next Step</span>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: 1.4 }}>
                  The assigned municipal division will inspect the site and allocate an active response vehicle. You can track this complaint anytime or message the officer directly.
                </p>
              </div>
            </div>

            <div className="confirmation-actions">
              <button
                type="button"
                className="btn-primary-large"
                onClick={() => onTrackInMyComplaints && onTrackInMyComplaints(reportId)}
              >
                <span>Track in My Complaints</span>
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                className="btn-secondary-large"
                onClick={() => onViewOnMap && onViewOnMap(latitude, longitude)}
              >
                <span>View on Map</span>
              </button>

              <button
                type="button"
                className="btn-plain-link"
                onClick={() => {
                  setSubmittedTicket(null);
                  setTitle('');
                  setDescription('');
                  setAdditionalNotes('');
                  handleRemovePhoto();
                }}
              >
                Submit Another Complaint
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN REPORT FORM
  // =========================================================================
  return (
    <div className="report-page site-container" id="report-page">
      <div className="report-page-header">
        <span className="section-label">Official Grievance Submission</span>
        <h1 className="report-page-title">Report a Civic Problem</h1>
        <p className="report-page-subtitle">
          Submit local street hazards, water leaks, potholes, or unlit poles directly to Pune municipal teams.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="report-form-layout">
        {/* Left Form Column */}
        <div className="report-form-fields">
          {submitError && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          {/* 1. Category Selection */}
          <div className="form-section-card">
            <h3 className="form-section-heading">
              1. Select Problem Category
            </h3>
            <p className="form-section-sub">
              Choose the category that matches the hazard you observed:
            </p>

            <div className="category-selection-grid">
              {PROBLEM_CATEGORIES.map((cat, idx) => {
                const isSelected = selectedCategoryIdx === idx;
                return (
                  <div
                    key={idx}
                    className={`category-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCategoryIdx(idx)}
                  >
                    <div className="category-option-icon">{cat.icon}</div>
                    <div className="category-option-title">{cat.title}</div>
                    <div className="category-option-desc">{cat.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Issue Title & Description */}
          <div className="form-section-card">
            <h3 className="form-section-heading">
              2. Describe the Problem
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="complaint-title">
                Short Title / Headline <span className="label-optional">(Optional)</span>
              </label>
              <input
                id="complaint-title"
                type="text"
                placeholder="E.g., Deep pothole causing skids outside Sancheti Hospital"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="complaint-description">
                Detailed Description <span className="label-required">*</span>
              </label>
              <textarea
                id="complaint-description"
                rows={4}
                required
                placeholder="Describe what happened, the size or danger of the issue, and how long it has been present..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="complaint-notes">
                Nearest Landmark / Additional Directions <span className="label-optional">(Optional)</span>
              </label>
              <input
                id="complaint-notes"
                type="text"
                placeholder="E.g., In front of Bank of Maharashtra ATM, near pillar #4"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* 3. Photo or Document Attachment */}
          <div className="form-section-card">
            <h3 className="form-section-heading">
              3. Photo or Document Attachment <span className="label-optional">(Optional)</span>
            </h3>
            <p className="form-section-sub">
              Photos help field engineers bring the right tools and replacement parts immediately.
            </p>

            {fileError && (
              <div className="form-error-banner" style={{ marginBottom: '10px' }}>
                <AlertCircle size={15} />
                <span>{fileError}</span>
              </div>
            )}

            {!previewUrl ? (
              <div className="photo-upload-dropzone">
                <div className="upload-icon-circle">
                  <Camera size={24} color="#0284c7" />
                </div>
                <div className="upload-text">
                  <strong>Take a photo or choose an image</strong>
                  <span>Supports JPG, PNG, or WEBP up to 5 MB</span>
                </div>
                <div className="upload-buttons-row">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-upload-choice"
                  >
                    <Upload size={14} />
                    <span>Browse Files</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="btn-upload-choice btn-camera"
                  >
                    <Camera size={14} />
                    <span>Camera</span>
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
              <div className="photo-preview-wrapper">
                <img src={previewUrl} alt="Complaint attachment" className="preview-image" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="btn-remove-photo"
                  title="Remove photo"
                >
                  <X size={16} />
                </button>
                <div className="photo-verified-tag">
                  <CheckCircle2 size={13} color="#10b981" />
                  <span>Photo Ready for Dispatch Team</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Location & Submit Card */}
        <div className="report-form-sidebar">
          {/* Location Card */}
          <div className="form-section-card location-card">
            <h3 className="form-section-heading">
              4. Issue Location
            </h3>
            <p className="form-section-sub">
              Click on the map or use GPS to pinpoint where the problem is located:
            </p>

            {/* GPS Button */}
            <button
              type="button"
              className="btn-use-gps"
              onClick={handleUseGps}
              disabled={isLocating}
            >
              {isLocating ? <Loader2 size={15} className="spin-icon" /> : <Compass size={15} />}
              <span>{isLocating ? 'Detecting GPS...' : 'Use My Current Location'}</span>
            </button>

            {locationError && (
              <div className="form-warning-banner">
                {locationError}
              </div>
            )}

            {/* Address Label Display */}
            <div className="location-selected-pill">
              <MapPin size={14} color="#0284c7" />
              <span><strong>Selected:</strong> {addressInput}</span>
            </div>

            {/* Interactive Map Picker */}
            <div className="map-picker-frame">
              <div ref={mapContainerRef} className="map-picker-canvas" />
              <div className="map-picker-hint">
                <span>📍 Click anywhere or drag the blue pin to set exact coordinates</span>
              </div>
            </div>

            {/* Popular Landmarks Grid */}
            <div className="popular-landmarks-section">
              <span className="landmarks-title">Or pick a popular Pune sector:</span>
              <div className="landmarks-chips-grid">
                {PUNE_LANDMARKS.slice(0, 8).map((lm) => (
                  <button
                    key={lm.name}
                    type="button"
                    className="landmark-chip"
                    onClick={() => updateMapPosition(lm.lat, lm.lng, `${lm.name} (${lm.area})`)}
                  >
                    <span>{lm.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submission Action Box */}
          <div className="form-section-card submit-card">
            <div className="submit-card-summary">
              <div>
                <span className="summary-label">Category</span>
                <strong>{activeCategory.title}</strong>
              </div>
              <div>
                <span className="summary-label">Privacy</span>
                <span className="summary-private-badge">
                  <ShieldCheck size={13} color="#10b981" />
                  Protected
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="btn-submit-complaint"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  <span>Submitting to Municipal Queue...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>

            <span className="submit-disclaimer">
              By submitting, your complaint will be assigned to Pune Municipal Corporation for inspection.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}

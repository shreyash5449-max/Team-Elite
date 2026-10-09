import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, CheckCircle2, AlertTriangle, ArrowRight, Compass } from 'lucide-react';
import { getFriendlyLocationName } from '../utils/geoUtils';

export default function InteractiveMapPreview({ 
  incidents = [], 
  onSelectIssue,
  onExploreClick 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Take top 4 incidents or realistic defaults
  const previewIncidents = (incidents.length > 0 ? incidents.slice(0, 5) : [
    { id: 'CIV-104', title: 'Main Water Line Rupture', category: 'Water & Sanitation', priority: 'HIGH', status: 'In Progress', latitude: 18.5205, longitude: 73.8568 },
    { id: 'CIV-109', title: 'Deep Pothole Cluster', category: 'Road & Infrastructure', priority: 'HIGH', status: 'Under Review', latitude: 18.5245, longitude: 73.8420 },
    { id: 'CIV-112', title: 'Damaged Electric Junction Box', category: 'Electrical & Public Safety', priority: 'CRITICAL', status: 'Active', latitude: 18.5313, longitude: 73.8466 },
    { id: 'CIV-125', title: 'Streetlight Outage Restored', category: 'Electrical & Public Safety', priority: 'LOW', status: 'Resolved', latitude: 18.5141, longitude: 73.8591 }
  ]);

  useEffect(() => {
    if (!selectedItem && previewIncidents.length > 0) {
      setSelectedItem(previewIncidents[0]);
    }
  }, [previewIncidents, selectedItem]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [18.524, 73.850],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);

    previewIncidents.forEach(inc => {
      if (!inc.latitude || !inc.longitude) return;

      const isResolved = (inc.status || '').toLowerCase().includes('resolve');
      const isCritical = (inc.priority || '').toUpperCase() === 'CRITICAL';
      const isHigh = (inc.priority || '').toUpperCase() === 'HIGH';

      const color = isResolved ? '#16a34a' : isCritical ? '#dc2626' : isHigh ? '#ea580c' : '#2563eb';

      const pinHtml = `
        <div style="width: 24px; height: 32px; cursor: pointer; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <svg width="24" height="32" viewBox="0 0 28 38" fill="none">
            <path d="M14 0C6.26801 0 0 6.26801 0 14C0 24.5 14 38 14 38C14 38 28 24.5 28 14C28 6.26801 21.732 0 14 0Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
            <circle cx="14" cy="14" r="7.5" fill="#ffffff"/>
            <circle cx="14" cy="14" r="4.5" fill="${color}"/>
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        className: 'preview-pin-icon',
        html: pinHtml,
        iconSize: [24, 32],
        iconAnchor: [12, 32]
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon });
      marker.on('click', () => {
        setSelectedItem(inc);
        map.panTo([inc.latitude, inc.longitude], { animate: true });
      });

      markersGroup.addLayer(marker);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="hero-interactive-map-card">
      <div className="hero-map-header">
        <div className="hero-map-title">
          <span className="live-dot"></span>
          <span>Live Pune Incident Grid (OpenStreetMap)</span>
        </div>
        <button
          type="button"
          className="hero-map-explore-btn"
          onClick={onExploreClick}
        >
          <span>Open Full Map</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Map Viewport */}
      <div 
        ref={mapContainerRef} 
        className="hero-map-canvas"
        style={{ width: '100%', height: '280px', position: 'relative' }}
      />

      {/* Floating Interactive Status Card */}
      {selectedItem && (
        <div className="hero-preview-status-card">
          <div className="status-card-header">
            <span className="status-card-id">#{selectedItem.id}</span>
            <span className={`status-pill ${selectedItem.status?.toLowerCase().includes('resolve') ? 'resolved' : 'active'}`}>
              {selectedItem.status || 'Under Review'}
            </span>
          </div>

          <div className="status-card-title">
            {selectedItem.title}
          </div>

          <div className="status-card-meta">
            <div className="meta-item">
              <MapPin size={12} color="#0284c7" />
              <span>{getFriendlyLocationName(selectedItem.latitude, selectedItem.longitude)}</span>
            </div>
            <div className="meta-item">
              <span>🏷️ {selectedItem.categories?.[0] || selectedItem.category || 'Civic Issue'}</span>
            </div>
          </div>

          <div className="status-card-footer">
            <span className="status-hint">Click markers to explore issues</span>
            <button
              type="button"
              className="status-card-action"
              onClick={() => onSelectIssue && onSelectIssue(selectedItem)}
            >
              View Details →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

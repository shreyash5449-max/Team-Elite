import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { 
  Search, 
  X, 
  Plus, 
  Minus, 
  RotateCcw, 
  Layers, 
  MapPin, 
  ShieldAlert, 
  Truck, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Compass,
  Radio,
  ExternalLink,
  MessageSquare,
  SlidersHorizontal,
  PlusCircle,
  Filter,
  Check
} from 'lucide-react';
import { PUNE_LANDMARKS, getFriendlyLocationName, calculateDistanceKm } from '../utils/geoUtils';

// Helper: Generate clean Google Maps teardrop pin SVG
function createGmapsPinHtml(color, label, isSelected = false) {
  return `
    <div class="gmaps-pin-container ${isSelected ? 'is-selected' : ''}" style="width: 28px; height: 38px; position: relative;">
      <svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.32));">
        <path d="M14 0C6.26801 0 0 6.26801 0 14C0 24.5 14 38 14 38C14 38 28 24.5 28 14C28 6.26801 21.732 0 14 0Z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="14" cy="14" r="7.5" fill="#ffffff"/>
        <text x="14" y="17.2" text-anchor="middle" font-size="8.5" font-weight="800" font-family="-apple-system, system-ui, sans-serif" fill="${color}">
          ${label}
        </text>
      </svg>
      ${isSelected ? '<div style="position: absolute; bottom: -3px; left: 50%; transform: translateX(-50%); width: 14px; height: 4px; border-radius: 50%; background: rgba(0,0,0,0.3); filter: blur(1px);"></div>' : ''}
    </div>
  `;
}

// Helper: Generate clean Google Maps cluster circle badge
function createGmapsClusterHtml(count, maxPriority = 'HIGH') {
  let bg = '#1a73e8'; // Google Blue (2-4 items)
  if (count >= 10 || maxPriority === 'CRITICAL') bg = '#dc2626'; // Red
  else if (count >= 5 || maxPriority === 'HIGH') bg = '#ea580c'; // Orange

  return `
    <div class="gmaps-cluster-marker" style="width: 36px; height: 36px; border-radius: 50%; background: ${bg}; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.28); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 13px; font-family: -apple-system, system-ui, sans-serif; cursor: pointer;">
      <span>${count}</span>
    </div>
  `;
}

export default function MapView({ 
  incidents = [], 
  reports = [],
  resources = [], 
  selectedIncidentId = null, 
  panToCoordinates = null,
  onSelectIncident,
  onOpenCitizenChat,
  viewMode = 'citizen', // 'citizen' | 'authority'
  myReportIds = [],
  onOpenCitizenDetails,
  onOpenSubmitModal
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    heatmapLayer: null,
    buffersLayer: null,
    reportsLayer: null,
    resourcesLayer: null,
    incidentsLayer: null,
    userLocationLayer: null
  });

  // Layer Toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showClustering, setShowClustering] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showBuffers, setShowBuffers] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  // Quick Plain-Language Filters (Citizen Friendly)
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'my' | 'nearby' | 'in-progress' | 'resolved'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // UI State
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(14);

  // 1. Initialize Leaflet Map with OpenStreetMap raster tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Pune municipal core
    const map = L.map(mapContainerRef.current, {
      center: [18.525, 73.850],
      zoom: 14,
      zoomControl: false,
      attributionControl: true
    });

    // Standard OpenStreetMap raster tile layer (strictly keyless, free, public OSM)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Initialize layer groups in z-index order
    layersRef.current.heatmapLayer = L.layerGroup().addTo(map);
    layersRef.current.buffersLayer = L.layerGroup().addTo(map);
    layersRef.current.reportsLayer = L.layerGroup().addTo(map);
    layersRef.current.resourcesLayer = L.layerGroup().addTo(map);
    layersRef.current.incidentsLayer = L.layerGroup().addTo(map);
    layersRef.current.userLocationLayer = L.layerGroup().addTo(map);

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Filter incidents based on quick plain-language filters and advanced options
  const filteredIncidents = useMemo(() => {
    const centerLat = userLocation?.lat || 18.525;
    const centerLng = userLocation?.lng || 73.850;

    return incidents.filter(inc => {
      const isResolved = (inc.status || '').toLowerCase().includes('resolve');
      const isLinkedToMy = (inc.linked_report_ids || []).some(id => myReportIds.includes(id));

      // 1. Quick Filters
      if (quickFilter === 'my') {
        if (!isLinkedToMy) return false;
      } else if (quickFilter === 'nearby') {
        if (!inc.latitude || !inc.longitude) return false;
        const distKm = calculateDistanceKm(centerLat, centerLng, inc.latitude, inc.longitude);
        if (distKm > 2.5) return false;
      } else if (quickFilter === 'in-progress') {
        if (isResolved) return false;
      } else if (quickFilter === 'resolved') {
        if (!isResolved) return false;
      }

      // 2. Advanced Filters: Category
      if (selectedCategory !== 'All') {
        const matchesCat = (inc.categories || []).some(c => 
          c.toLowerCase().includes(selectedCategory.toLowerCase())
        );
        if (!matchesCat) return false;
      }

      // 3. Advanced Filters: Priority
      if (selectedPriority !== 'All') {
        if ((inc.priority || '').toUpperCase() !== selectedPriority.toUpperCase()) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, quickFilter, myReportIds, userLocation, selectedCategory, selectedPriority]);

  // Filter individual citizen reports
  const filteredReports = useMemo(() => {
    const centerLat = userLocation?.lat || 18.525;
    const centerLng = userLocation?.lng || 73.850;

    return reports.filter(rep => {
      const repId = rep.report_id || rep.id;
      const isResolved = (rep.status || '').toLowerCase().includes('resolve');
      const isMine = myReportIds.includes(repId);

      // 1. Quick Filters
      if (quickFilter === 'my') {
        if (!isMine) return false;
      } else if (quickFilter === 'nearby') {
        if (!rep.latitude || !rep.longitude) return false;
        const distKm = calculateDistanceKm(centerLat, centerLng, rep.latitude, rep.longitude);
        if (distKm > 2.5) return false;
      } else if (quickFilter === 'in-progress') {
        if (isResolved) return false;
      } else if (quickFilter === 'resolved') {
        if (!isResolved) return false;
      }

      // 2. Category
      if (selectedCategory !== 'All') {
        if (!rep.category?.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [reports, quickFilter, myReportIds, userLocation, selectedCategory]);

  // Count of citizen's own complaints
  const myComplaintsCount = useMemo(() => {
    return reports.filter(r => myReportIds.includes(r.report_id || r.id)).length;
  }, [reports, myReportIds]);

  // Search Autocomplete Suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();

    const matches = [];

    // Match Incidents
    incidents.forEach(inc => {
      if (
        inc.id.toLowerCase().includes(query) ||
        inc.title?.toLowerCase().includes(query) ||
        (inc.categories || []).some(c => c.toLowerCase().includes(query))
      ) {
        matches.push({
          type: 'incident',
          id: inc.id,
          title: `${inc.id}: ${inc.title}`,
          subtitle: `${inc.priority} Priority • ${inc.categories?.join(', ')}`,
          lat: inc.latitude,
          lng: inc.longitude
        });
      }
    });

    // Match Citizen Reports
    reports.forEach(rep => {
      const repId = rep.report_id || rep.id;
      if (
        repId.toLowerCase().includes(query) ||
        rep.description?.toLowerCase().includes(query) ||
        rep.category?.toLowerCase().includes(query)
      ) {
        matches.push({
          type: 'report',
          id: repId,
          title: `Complaint #${repId}`,
          subtitle: rep.description ? (rep.description.slice(0, 50) + '...') : rep.category,
          lat: rep.latitude,
          lng: rep.longitude
        });
      }
    });

    // Match Pune Landmarks
    PUNE_LANDMARKS.forEach(lm => {
      if (
        lm.name.toLowerCase().includes(query) ||
        lm.area.toLowerCase().includes(query)
      ) {
        matches.push({
          type: 'landmark',
          id: lm.name,
          title: lm.name,
          subtitle: `Pune Landmark (${lm.area})`,
          lat: lm.lat,
          lng: lm.lng
        });
      }
    });

    return matches.slice(0, 6);
  }, [searchQuery, incidents, reports]);

  // Fast Distance-Based Spatial Clustering Algorithm
  const computeSpatialClusters = useCallback((items, map, radiusPx = 48) => {
    if (!map || !showClustering || map.getZoom() >= 16) {
      return { clusters: [], singles: items };
    }

    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < items.length; i++) {
      if (visited.has(i)) continue;
      const itemA = items[i];
      if (!itemA.latitude || !itemA.longitude) continue;

      const ptA = map.latLngToLayerPoint([itemA.latitude, itemA.longitude]);
      const members = [itemA];
      visited.add(i);

      for (let j = i + 1; j < items.length; j++) {
        if (visited.has(j)) continue;
        const itemB = items[j];
        if (!itemB.latitude || !itemB.longitude) continue;

        const ptB = map.latLngToLayerPoint([itemB.latitude, itemB.longitude]);
        const dist = ptA.distanceTo(ptB);

        if (dist <= radiusPx) {
          members.push(itemB);
          visited.add(j);
        }
      }

      if (members.length > 1) {
        const avgLat = members.reduce((sum, m) => sum + m.latitude, 0) / members.length;
        const avgLng = members.reduce((sum, m) => sum + m.longitude, 0) / members.length;
        const hasCritical = members.some(m => (m.priority || '').toUpperCase() === 'CRITICAL' || m.severity >= 75);
        const hasHigh = members.some(m => (m.priority || '').toUpperCase() === 'HIGH' || m.severity >= 50);

        clusters.push({
          id: `cluster-${i}`,
          lat: avgLat,
          lng: avgLng,
          count: members.length,
          maxPriority: hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : 'MEDIUM',
          members
        });
      }
    }

    const clusteredMemberSet = new Set();
    clusters.forEach(c => c.members.forEach(m => clusteredMemberSet.add(m.id || m.report_id)));

    const singles = items.filter(it => !clusteredMemberSet.has(it.id || it.report_id));

    return { clusters, singles };
  }, [showClustering]);

  // 2. Render Incident Markers, Hazard Buffers & Heatmap
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { incidentsLayer, buffersLayer, heatmapLayer } = layersRef.current;
    incidentsLayer.clearLayers();
    buffersLayer.clearLayers();
    heatmapLayer.clearLayers();

    // Heatmap density circles (Authority Mode)
    if (showHeatmap && filteredIncidents.length > 0) {
      filteredIncidents.forEach(inc => {
        if (!inc.latitude || !inc.longitude) return;
        const isCritical = (inc.priority || '').toUpperCase() === 'CRITICAL' || inc.severity >= 75;
        const isHigh = (inc.priority || '').toUpperCase() === 'HIGH' || inc.severity >= 50;
        
        const heatColor = isCritical ? '#dc2626' : isHigh ? '#ea580c' : '#eab308';
        const heatRadius = isCritical ? 260 : isHigh ? 200 : 140;

        const heatCircle = L.circle([inc.latitude, inc.longitude], {
          radius: heatRadius,
          color: heatColor,
          fillColor: heatColor,
          fillOpacity: 0.16,
          weight: 0,
          interactive: false
        });
        heatmapLayer.addLayer(heatCircle);
      });
    }

    if (!showIncidents) return;

    // Compute spatial clusters vs single pins
    const { clusters, singles } = computeSpatialClusters(filteredIncidents, map, 48);

    // A. Render Clusters
    clusters.forEach(cl => {
      const clusterIcon = L.divIcon({
        className: 'gmaps-cluster-div-icon',
        html: createGmapsClusterHtml(cl.count, cl.maxPriority),
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const clusterMarker = L.marker([cl.lat, cl.lng], { icon: clusterIcon });
      clusterMarker.bindTooltip(`Cluster of ${cl.count} complaints (Click to zoom in)`, {
        direction: 'top',
        offset: [0, -18]
      });

      clusterMarker.on('click', () => {
        map.setView([cl.lat, cl.lng], map.getZoom() + 2, { animate: true });
      });

      incidentsLayer.addLayer(clusterMarker);
    });

    // B. Render Single Incident Pins
    singles.forEach(inc => {
      if (!inc.latitude || !inc.longitude) return;

      const priority = (inc.priority || 'MEDIUM').toUpperCase();
      const severity = inc.severity ?? 50;
      const isSelected = inc.id === selectedIncidentId;
      const isResolved = (inc.status || '').toLowerCase().includes('resolve');

      // Pin Color matching specification:
      // Red: Critical, Orange: High, Yellow: Medium, Blue: Ordinary, Green: Resolved
      let pinColor = '#2563eb'; // Ordinary Blue
      if (isResolved) {
        pinColor = '#16a34a'; // Green
      } else if (priority === 'CRITICAL' || severity >= 75) {
        pinColor = '#dc2626'; // Red
      } else if (priority === 'HIGH' || severity >= 50) {
        pinColor = '#ea580c'; // Orange
      } else if (priority === 'MEDIUM' || severity >= 25) {
        pinColor = '#eab308'; // Yellow
      }

      // Pin Label: Checkmark if resolved, otherwise short tier letter
      const pinLabel = isResolved ? '✓' : priority === 'CRITICAL' ? '!' : priority === 'HIGH' ? 'H' : priority === 'MEDIUM' ? 'M' : '•';

      // 1. Hazard Buffer Circle (Authority toggle)
      if (showBuffers && !isResolved) {
        const radius = severity >= 90 ? 160 : severity >= 65 ? 120 : 80;
        const circle = L.circle([inc.latitude, inc.longitude], {
          radius: radius,
          color: pinColor,
          fillColor: pinColor,
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 4'
        });
        buffersLayer.addLayer(circle);
      }

      // 2. Google Maps Teardrop Marker Pin
      const icon = L.divIcon({
        className: 'gmaps-div-icon',
        html: createGmapsPinHtml(pinColor, pinLabel, isSelected),
        iconSize: [28, 38],
        iconAnchor: [14, 38],
        popupAnchor: [0, -36]
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon });

      // Clean Google Maps Info Window Popup
      const priorityBadgeBg = isResolved ? '#dcfce7' :
        priority === 'CRITICAL' ? '#fee2e2' :
        priority === 'HIGH' ? '#ffedd5' :
        priority === 'MEDIUM' ? '#fef9c3' : '#dbeafe';

      const priorityBadgeText = isResolved ? '#15803d' :
        priority === 'CRITICAL' ? '#b91c1c' :
        priority === 'HIGH' ? '#c2410c' :
        priority === 'MEDIUM' ? '#a16207' : '#1d4ed8';

      // Human-friendly location name without raw coordinates
      const friendlyLocation = getFriendlyLocationName(inc.latitude, inc.longitude);

      // Find primary report associated with this incident for details/chat
      const primaryReport = reports.find(r => inc.linked_report_ids?.includes(r.report_id || r.id)) || {
        report_id: inc.linked_report_ids?.[0] || inc.id,
        id: inc.linked_report_ids?.[0] || inc.id,
        title: inc.title,
        description: inc.title,
        category: inc.categories?.[0] || 'Road & Infrastructure',
        latitude: inc.latitude,
        longitude: inc.longitude,
        status: inc.status || 'Active',
        timestamp: inc.updated_at || inc.created_at || new Date().toISOString()
      };

      const reportedDateStr = inc.updated_at 
        ? new Date(inc.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recently Logged';

      // CITIZEN-FRIENDLY POPUP: Clear title, category, friendly location, current status, date, View Details, Chat
      const popupHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 230px; padding: 2px;">
          <!-- Top Row: Complaint Ref & Status Badge -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 12.5px; color: #0284c7; font-family: monospace;">#${inc.id}</strong>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 12px; background: ${priorityBadgeBg}; color: ${priorityBadgeText};">
              ${isResolved ? 'RESOLVED' : `${priority} PRIORITY`}
            </span>
          </div>

          <!-- Complaint Title -->
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px; line-height: 1.35;">
            ${inc.title}
          </div>

          <!-- Category, Friendly Location & Status -->
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; color: #475569; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span>🏷️</span>
              <span style="color: #0f172a; font-weight: 600;">${inc.categories?.join(', ') || 'Civic Infrastructure'}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span>📍</span>
              <span style="color: #334155;">${friendlyLocation}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span>⚡</span>
              <span>Status: <strong style="color: ${isResolved ? '#15803d' : '#0284c7'};">${inc.status || 'Under Review'}</strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px; font-size: 10.5px; color: #64748b;">
              <span>🕒</span>
              <span>Reported: ${reportedDateStr}</span>
            </div>
          </div>

          <!-- Action Buttons Stack: View Details & Chat with Authority -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <button id="gmaps-popup-btn-${inc.id}" class="gmaps-popup-btn-primary" style="cursor: pointer;">
              <span>View Details</span>
              <span>→</span>
            </button>
            <button id="gmaps-popup-chat-btn-${inc.id}" class="gmaps-popup-btn-chat" style="cursor: pointer;">
              <span>💬</span>
              <span>Chat with Authority</span>
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'gmaps-popup',
        maxWidth: 290
      });

      marker.on('click', () => {
        onSelectIncident(inc.id);
      });

      marker.on('popupopen', () => {
        const viewBtn = document.getElementById(`gmaps-popup-btn-${inc.id}`);
        if (viewBtn) {
          viewBtn.onclick = () => {
            if (viewMode === 'citizen' && onOpenCitizenDetails) {
              onOpenCitizenDetails(primaryReport);
            } else {
              onSelectIncident(inc.id);
            }
          };
        }
        const chatBtn = document.getElementById(`gmaps-popup-chat-btn-${inc.id}`);
        if (chatBtn && onOpenCitizenChat) {
          chatBtn.onclick = () => onOpenCitizenChat(primaryReport);
        }
      });

      incidentsLayer.addLayer(marker);
    });
  }, [filteredIncidents, reports, selectedIncidentId, showIncidents, showBuffers, showHeatmap, showClustering, currentZoom, computeSpatialClusters, onSelectIncident, onOpenCitizenChat, viewMode, onOpenCitizenDetails]);

  // 3. Render Individual Citizen Report Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { reportsLayer } = layersRef.current;
    reportsLayer.clearLayers();

    if (!showReports || !filteredReports.length) return;

    filteredReports.forEach(report => {
      if (!report.latitude || !report.longitude) return;

      const isWater = report.category?.includes('Water');
      const isElec = report.category?.includes('Electrical');
      const isResolved = (report.status || '').toLowerCase().includes('resolve');

      // Matching colors: Red: Critical, Orange: High, Yellow: Medium, Blue: Ordinary, Green: Resolved
      const dotColor = isResolved ? '#16a34a' : isElec ? '#dc2626' : isWater ? '#0284c7' : '#ea580c';
      const repId = report.report_id || report.id;
      const friendlyLocation = getFriendlyLocationName(report.latitude, report.longitude);

      const dotHtml = `
        <div style="width: 14px; height: 14px; border-radius: 50%; background: ${dotColor}; border: 2.5px solid #ffffff; box-shadow: 0 1px 5px rgba(0,0,0,0.32); cursor: pointer;" title="Complaint #${repId}"></div>
      `;

      const icon = L.divIcon({
        className: 'gmaps-report-icon',
        html: dotHtml,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10]
      });

      const marker = L.marker([report.latitude, report.longitude], { icon });

      const dateStr = report.timestamp 
        ? new Date(report.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recently Logged';

      const popupHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 220px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <strong style="font-size: 12px; color: #0284c7; font-family: monospace;">#${repId}</strong>
            <span style="font-size: 10px; font-weight: 700; color: ${dotColor};">${report.category}</span>
          </div>
          <div style="font-size: 12.5px; font-weight: 600; color: #0f172a; margin-bottom: 6px; line-height: 1.35;">
            ${report.description}
          </div>
          <div style="display: flex; flex-direction: column; gap: 3px; font-size: 11px; color: #475569; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>📍</span>
              <span>${friendlyLocation}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>⚡</span>
              <span>Status: <strong style="color: ${isResolved ? '#15803d' : '#0284c7'};">${report.status || 'Under Review'}</strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 10px; color: #64748b;">
              <span>🕒</span>
              <span>Reported: ${dateStr}</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 5px;">
            <button id="gmaps-rep-details-btn-${repId}" class="gmaps-popup-btn-primary" style="padding: 6px 10px; font-size: 11px; cursor: pointer;">
              <span>View Details</span>
              <span>→</span>
            </button>
            <button id="gmaps-rep-chat-btn-${repId}" class="gmaps-popup-btn-chat" style="padding: 6px 10px; font-size: 11px; cursor: pointer;">
              <span>💬</span>
              <span>Chat with Authority</span>
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'gmaps-popup', maxWidth: 280 });

      marker.on('popupopen', () => {
        const detailsBtn = document.getElementById(`gmaps-rep-details-btn-${repId}`);
        if (detailsBtn && onOpenCitizenDetails) {
          detailsBtn.onclick = () => onOpenCitizenDetails(report);
        }
        const chatBtn = document.getElementById(`gmaps-rep-chat-btn-${repId}`);
        if (chatBtn && onOpenCitizenChat) {
          chatBtn.onclick = () => onOpenCitizenChat(report);
        }
      });

      reportsLayer.addLayer(marker);
    });
  }, [filteredReports, showReports, onSelectIncident, onOpenCitizenChat, onOpenCitizenDetails]);

  // 4. Render Municipal Fleet Vehicle Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { resourcesLayer } = layersRef.current;
    resourcesLayer.clearLayers();

    if (!showResources || !resources.length) return;

    resources.forEach(res => {
      if (!res.latitude || !res.longitude) return;

      const isUnavailable = res.availability === 'UNAVAILABLE' || res.availability === 'Unavailable';
      const symbol = res.type?.includes('Water') ? '💧' : res.type?.includes('Electrical') ? '⚡' : res.type?.includes('Multi') ? '🚨' : '🛠️';

      const vehicleHtml = `
        <div class="gmaps-vehicle-marker" title="${res.name} (${res.availability})">
          <span>${symbol}</span>
          <span class="gmaps-vehicle-status-dot ${isUnavailable ? 'unavailable' : 'available'}"></span>
        </div>
      `;

      const icon = L.divIcon({
        className: 'gmaps-vehicle-div-icon',
        html: vehicleHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([res.latitude, res.longitude], { icon });

      const popupHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 200px; padding: 2px;">
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
            ${res.name}
          </div>
          <div style="font-size: 11px; font-weight: 600; color: ${isUnavailable ? '#dc2626' : '#16a34a'}; margin-bottom: 6px;">
            Status: ${res.availability}
          </div>
          <div style="font-size: 11px; color: #64748b; line-height: 1.35;">
            <div><strong>Base Station:</strong> ${res.base_station || 'Municipal Depot'}</div>
            <div><strong>Assigned Sector:</strong> Central Pune</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'gmaps-popup', maxWidth: 240 });
      resourcesLayer.addLayer(marker);
    });
  }, [resources, showResources]);

  // Smoothly pan when selectedIncidentId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedIncidentId) return;

    const selected = incidents.find(i => i.id === selectedIncidentId);
    if (selected && selected.latitude && selected.longitude) {
      map.flyTo([selected.latitude, selected.longitude], 15, { duration: 1.0 });
    }
  }, [selectedIncidentId, incidents]);

  // Pan when external component requests coordinate pan
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !panToCoordinates || !panToCoordinates.lat) return;

    map.flyTo([panToCoordinates.lat, panToCoordinates.lng], 16, { duration: 1.0 });
  }, [panToCoordinates]);

  // Map Navigation Control Handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetView = () => {
    mapInstanceRef.current?.flyTo([18.525, 73.850], 14, { duration: 1.0 });
  };

  // Browser Current-Location Handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      setTimeout(() => setLocationStatus(null), 3000);
      return;
    }

    setLocationStatus('Locating current position...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationStatus(null);

        const map = mapInstanceRef.current;
        if (!map) return;

        const { userLocationLayer } = layersRef.current;
        userLocationLayer.clearLayers();

        const userHtml = `
          <div class="gmaps-user-dot">
            <div class="gmaps-user-dot-pulse"></div>
            <div class="gmaps-user-dot-core"></div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'gmaps-user-icon',
          html: userHtml,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        const userMarker = L.marker([latitude, longitude], { icon });
        userMarker.bindPopup(`
          <div style="font-family: system-ui; font-size: 12px; color: #1e293b; padding: 4px;">
            <strong>Your Current Location</strong>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${getFriendlyLocationName(latitude, longitude)}
            </div>
          </div>
        `, { className: 'gmaps-popup' });

        userLocationLayer.addLayer(userMarker);
        map.flyTo([latitude, longitude], 15, { duration: 1.2 });
      },
      (err) => {
        setLocationStatus('Could not access location (permission denied).');
        setTimeout(() => setLocationStatus(null), 3500);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Search Selection Handler
  const handleSelectSearchItem = (item) => {
    setSearchQuery(item.title);
    setIsSearchFocused(false);

    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([item.lat, item.lng], 16, { duration: 1.2 });

    if (item.type === 'incident') {
      onSelectIncident(item.id);
    }
  };

  // Search input key press
  const handleSearchKeyDown = async (e) => {
    if (e.key === 'Enter') {
      if (searchSuggestions.length > 0) {
        handleSelectSearchItem(searchSuggestions[0]);
        return;
      }

      const coordMatch = searchQuery.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          mapInstanceRef.current?.flyTo([lat, lng], 16, { duration: 1.0 });
          setIsSearchFocused(false);
          return;
        }
      }

      if (searchQuery.trim().length > 2) {
        setSearchLoading(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Pune')}&limit=1`, {
            headers: { 
              'Accept': 'application/json',
              'User-Agent': 'CivicPulse/1.0 (PuneCivicIncidentCoordination)'
            }
          });
          const data = await res.json();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            mapInstanceRef.current?.flyTo([lat, lon], 16, { duration: 1.2 });
            setIsSearchFocused(false);
          }
        } catch {
          // silent fallback
        } finally {
          setSearchLoading(false);
        }
      }
    }
  };

  return (
    <div className="map-panel" id="map-panel">
      {/* 1. Top-Left Floating Google Maps Search & Plain-Language Quick Filters */}
      <div className="gmaps-search-container" id="gmaps-search-container">
        {/* Search Bar */}
        <div className="gmaps-search-card">
          <Search size={16} color="#64748b" />
          <input
            type="text"
            className="gmaps-search-input"
            placeholder="Search Pune streets, landmarks, or complaint #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchQuery && (
            <button
              type="button"
              className="gmaps-search-clear"
              onClick={() => {
                setSearchQuery('');
                setIsSearchFocused(false);
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Autocomplete Dropdown */}
        {isSearchFocused && searchSuggestions.length > 0 && (
          <div className="gmaps-search-dropdown" onMouseDown={(e) => e.preventDefault()}>
            {searchSuggestions.map((item, idx) => (
              <div 
                key={`${item.id}-${idx}`}
                className="gmaps-search-item"
                onClick={() => handleSelectSearchItem(item)}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{item.subtitle}</div>
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Plain-Language Quick Filter Pills (Requirement 6) */}
        <div className="gmaps-filter-pills" id="gmaps-filter-pills">
          <button
            type="button"
            className={`gmaps-pill ${quickFilter === 'all' ? 'active' : ''}`}
            onClick={() => setQuickFilter('all')}
          >
            All Complaints
          </button>

          <button
            type="button"
            className={`gmaps-pill ${quickFilter === 'my' ? 'active' : ''}`}
            onClick={() => setQuickFilter('my')}
          >
            📋 My Complaints {myComplaintsCount > 0 ? `(${myComplaintsCount})` : ''}
          </button>

          <button
            type="button"
            className={`gmaps-pill ${quickFilter === 'nearby' ? 'active' : ''}`}
            onClick={() => {
              setQuickFilter('nearby');
              if (!userLocation) handleLocateMe();
            }}
          >
            📍 Nearby Issues
          </button>

          <button
            type="button"
            className={`gmaps-pill ${quickFilter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setQuickFilter('in-progress')}
          >
            ⏳ In Progress
          </button>

          <button
            type="button"
            className={`gmaps-pill ${quickFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setQuickFilter('resolved')}
          >
            🟢 Resolved
          </button>

          <button
            type="button"
            className={`gmaps-pill ${showAdvancedFilters ? 'active' : ''}`}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            title="Expand advanced filters"
          >
            <SlidersHorizontal size={11} />
            <span>Filters</span>
          </button>
        </div>

        {/* Expandable Advanced Filters Box */}
        {showAdvancedFilters && (
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
            border: '1px solid #cbd5e1',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '11.5px',
            color: '#334155'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
              <strong style={{ color: '#0f172a' }}>Advanced Filters</strong>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedPriority('All');
                  setQuickFilter('all');
                }}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
              >
                Reset All
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: 600, color: '#64748b' }}>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                >
                  <option value="All">All Categories</option>
                  <option value="Water & Sanitation">💧 Water & Drainage</option>
                  <option value="Road & Infrastructure">🛣️ Roads & Footpaths</option>
                  <option value="Electrical & Public Safety">⚡ Electricity & Safety</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontWeight: 600, color: '#64748b' }}>Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                >
                  <option value="All">All Priorities</option>
                  <option value="CRITICAL">🔴 Critical</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🔵 Low</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '4px' }}>
              <label className="gmaps-layer-toggle" title="Show or hide municipal response vehicles">
                <input
                  type="checkbox"
                  checked={showResources}
                  onChange={(e) => setShowResources(e.target.checked)}
                />
                <span>Municipal Fleet Vehicles</span>
              </label>

              <label className="gmaps-layer-toggle" title="Group nearby complaints together">
                <input
                  type="checkbox"
                  checked={showClustering}
                  onChange={(e) => setShowClustering(e.target.checked)}
                />
                <span>Group Nearby Pins</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 2. Floating Prominent "Report a Problem" Button (Requirement 5) */}
      <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 500, display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          id="btn-floating-report-problem"
          onClick={onOpenSubmitModal}
          style={{
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '24px',
            boxShadow: '0 3px 12px rgba(37, 99, 235, 0.38)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          title="Click to report a street or civic problem"
        >
          <PlusCircle size={16} />
          <span>Report a Problem</span>
        </button>

        {/* Top-Right Layers Dropdown Toggle (for Authority / Advanced Map controls) */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              padding: '7px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#1e293b',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Toggle Map Overlays"
          >
            <Layers size={14} color="#1a73e8" />
            <span>Layers</span>
            <ChevronDown size={12} color="#64748b" style={{ transform: isLayersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {isLayersOpen && (
            <div style={{
              position: 'absolute',
              top: '38px',
              right: 0,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              padding: '12px 14px',
              width: '210px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              zIndex: 600
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                Map Overlays
              </div>

              <label className="gmaps-layer-toggle">
                <input
                  type="checkbox"
                  checked={showIncidents}
                  onChange={(e) => setShowIncidents(e.target.checked)}
                />
                <span>Complaints ({filteredIncidents.length})</span>
              </label>

              <label className="gmaps-layer-toggle">
                <input
                  type="checkbox"
                  checked={showReports}
                  onChange={(e) => setShowReports(e.target.checked)}
                />
                <span>Citizen Reports ({filteredReports.length})</span>
              </label>

              <label className="gmaps-layer-toggle">
                <input
                  type="checkbox"
                  checked={showResources}
                  onChange={(e) => setShowResources(e.target.checked)}
                />
                <span>Municipal Teams ({resources.length})</span>
              </label>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '2px 0' }} />

              <label className="gmaps-layer-toggle">
                <input
                  type="checkbox"
                  checked={showBuffers}
                  onChange={(e) => setShowBuffers(e.target.checked)}
                />
                <span>Hazard Danger Zones</span>
              </label>

              {viewMode === 'authority' && (
                <label className="gmaps-layer-toggle">
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                  />
                  <span>Incident Heatmap</span>
                </label>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom-Left Collapsible Navigation Map Legend (Requirement 3) */}
      <div className="gmaps-legend-card" id="gmaps-legend-card">
        <div 
          className="gmaps-legend-title"
          onClick={() => setIsLegendExpanded(!isLegendExpanded)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <span>Map Legend</span>
          <span style={{ color: '#64748b' }}>
            {isLegendExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </span>
        </div>

        {isLegendExpanded && (
          <>
            <div className="gmaps-legend-item">
              <span className="gmaps-legend-dot" style={{ background: '#dc2626' }} />
              <span>Critical Issue (Immediate hazard)</span>
            </div>
            <div className="gmaps-legend-item">
              <span className="gmaps-legend-dot" style={{ background: '#ea580c' }} />
              <span>High Priority Complaint</span>
            </div>
            <div className="gmaps-legend-item">
              <span className="gmaps-legend-dot" style={{ background: '#eab308' }} />
              <span>Medium Priority Complaint</span>
            </div>
            <div className="gmaps-legend-item">
              <span className="gmaps-legend-dot" style={{ background: '#2563eb' }} />
              <span>Other Reported Issues</span>
            </div>
            <div className="gmaps-legend-item">
              <span className="gmaps-legend-dot" style={{ background: '#16a34a' }} />
              <span>Resolved Issues</span>
            </div>
            <div className="gmaps-legend-item">
              <span style={{ fontSize: '13px' }}>🛠️</span>
              <span>Municipal Response Team</span>
            </div>
            <div className="gmaps-legend-item">
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#1a73e8', color: '#fff', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
              <span>Grouped Area (Click to zoom)</span>
            </div>
          </>
        )}
      </div>

      {/* 4. Bottom-Right Google Maps Navigation Controls */}
      <div className="gmaps-nav-controls" id="gmaps-nav-controls">
        {/* Recenter & Location Group */}
        <div className="gmaps-ctrl-group">
          <button
            type="button"
            className="gmaps-ctrl-btn"
            onClick={handleResetView}
            title="Return to default Pune view"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            className="gmaps-ctrl-btn"
            onClick={handleLocateMe}
            title="Use my current location (GPS)"
          >
            <Compass size={17} color={userLocation ? '#2563eb' : '#475569'} />
          </button>
        </div>

        {/* Zoom In / Zoom Out Group */}
        <div className="gmaps-ctrl-group">
          <button
            type="button"
            className="gmaps-ctrl-btn"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            className="gmaps-ctrl-btn"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <Minus size={18} />
          </button>
        </div>
      </div>

      {/* Location Status Toast (if any) */}
      {locationStatus && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '14px',
          zIndex: 600,
          background: '#ffffff',
          color: '#0f172a',
          fontSize: '11px',
          padding: '6px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          border: '1px solid #cbd5e1'
        }}>
          {locationStatus}
        </div>
      )}

      {/* Actual Map Root Container */}
      <div ref={mapContainerRef} className="map-root" id="leaflet-map" />
    </div>
  );
}

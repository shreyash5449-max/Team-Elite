/**
 * CivicPulse - Initial Synthetic Civic Data
 * 
 * Provides 20 initial reports clustered into 6 incidents across 3 categories.
 * All data is synthetic and non-personal.
 */

export const INITIAL_RESOURCES = [
  {
    id: 'RSRC-01',
    name: 'General Repair Team 1',
    type: 'Road & Infrastructure',
    capabilities: ['Road & Infrastructure', 'General', 'Debris Clearance'],
    availability: 'Available',
    current_status: 'Ready on Standby',
    current_assignment: null,
    latitude: 18.5230,
    longitude: 73.8510,
    base_station: 'Central Municipal Depot A',
    cost_per_hour: 95,
    capacity: 2
  },
  {
    id: 'RSRC-02',
    name: 'General Repair Team 2',
    type: 'Road & Infrastructure',
    capabilities: ['Road & Infrastructure', 'General', 'Barrier Fixing'],
    availability: 'Available',
    current_status: 'Ready on Standby',
    current_assignment: null,
    latitude: 18.5170,
    longitude: 73.8620,
    base_station: 'Eastern Sector Depot B',
    cost_per_hour: 95,
    capacity: 2
  },
  {
    id: 'RSRC-03',
    name: 'Water Response Team',
    type: 'Water & Sanitation',
    capabilities: ['Water & Sanitation', 'Pipeline Repair', 'High-Volume Pumping'],
    availability: 'Available',
    current_status: 'Ready on Standby',
    current_assignment: null,
    latitude: 18.5280,
    longitude: 73.8540,
    base_station: 'Northern Water Works Facility',
    cost_per_hour: 150,
    capacity: 3
  },
  {
    id: 'RSRC-04',
    name: 'Electrical Response Team',
    type: 'Electrical & Public Safety',
    capabilities: ['Electrical & Public Safety', 'High Voltage', 'Grid Isolation', 'Wire Repair'],
    availability: 'Available',
    current_status: 'Ready on Standby',
    current_assignment: null,
    latitude: 18.5190,
    longitude: 73.8490,
    base_station: 'Safety & Power Substation 4',
    cost_per_hour: 180,
    capacity: 2
  },
  {
    id: 'RSRC-05',
    name: 'Emergency Response Vehicle',
    type: 'Multi-Hazards / Quick Response',
    capabilities: ['Emergency Response Vehicle', 'Multi-Hazards', 'Traffic Diversion', 'Hazard Containment'],
    availability: 'Available',
    current_status: 'Rapid Deployment Ready',
    current_assignment: null,
    latitude: 18.5210,
    longitude: 73.8550,
    base_station: 'Civic Quick Reaction Center',
    cost_per_hour: 140,
    capacity: 4
  }
];

export const INITIAL_REPORTS = [
  // --- INCIDENT CIV-104 (Major Water Leak / Flooding - 8 Reports) ---
  {
    report_id: 'R-101',
    category: 'Water & Sanitation',
    description: 'Water is leaking heavily onto the road near Shivaji Nagar junction.',
    latitude: 18.5204,
    longitude: 73.8567,
    timestamp: '2026-10-08T09:05:00',
    image: 'water_leak_junction.jpg',
    metadata: { source: 'Mobile App', channel: 'Citizen Mobile' }
  },
  {
    report_id: 'R-107',
    category: 'Water & Sanitation',
    description: 'The road near the junction is flooded with gushing water from a broken main.',
    latitude: 18.5206,
    longitude: 73.8569,
    timestamp: '2026-10-08T09:12:00',
    image: null,
    metadata: { source: 'Web Portal', channel: 'Public Portal' }
  },
  {
    report_id: 'R-112',
    category: 'Water & Sanitation',
    description: 'There is a large water leak near the bus stop causing traffic slowdown and puddle accumulation.',
    latitude: 18.5203,
    longitude: 73.8565,
    timestamp: '2026-10-08T09:18:00',
    image: null,
    metadata: { source: 'Mobile App', channel: 'Citizen Mobile' }
  },
  {
    report_id: 'R-119',
    category: 'Water & Sanitation',
    description: 'Underground water pipeline appears cracked; water spilling across two traffic lanes.',
    latitude: 18.5208,
    longitude: 73.8571,
    timestamp: '2026-10-08T09:22:00',
    image: null,
    metadata: { source: 'Hotline', channel: 'IVR Voice Log' }
  },
  {
    report_id: 'R-121',
    category: 'Water & Sanitation',
    description: 'Flooding spreading across the pedestrian crossing near Shivaji Nagar bus stop.',
    latitude: 18.5205,
    longitude: 73.8568,
    timestamp: '2026-10-08T09:25:00',
    image: 'flooded_street_crossing.jpg',
    metadata: { source: 'Mobile App', channel: 'Citizen Mobile' }
  },
  {
    report_id: 'R-124',
    category: 'Water & Sanitation',
    description: 'Two wheelers slipping on waterlogged street; deep pooling water at the intersection.',
    latitude: 18.5207,
    longitude: 73.8566,
    timestamp: '2026-10-08T09:26:00',
    image: null,
    metadata: { source: 'Web Portal', channel: 'Public Portal' }
  },
  {
    report_id: 'R-128',
    category: 'Water & Sanitation',
    description: 'Severe water overflow from underground line entering bus shelter area.',
    latitude: 18.5202,
    longitude: 73.8569,
    timestamp: '2026-10-08T09:27:00',
    image: null,
    metadata: { source: 'Mobile App', channel: 'Citizen Mobile' }
  },
  {
    report_id: 'R-130',
    category: 'Water & Sanitation',
    description: 'Water pressure gushing from damaged valve near pavement curb.',
    latitude: 18.5209,
    longitude: 73.8572,
    timestamp: '2026-10-08T09:28:00',
    image: null,
    metadata: { source: 'Mobile App', channel: 'Citizen Mobile' }
  },

  // --- INCIDENT CIV-109 (Road & Infrastructure - 3 Reports) ---
  {
    report_id: 'R-102',
    category: 'Road & Infrastructure',
    description: 'Deep hazardous pothole cluster on FC Road causing sudden vehicle swerves.',
    latitude: 18.5245,
    longitude: 73.8420,
    timestamp: '2026-10-08T08:30:00',
    image: 'deep_pothole.jpg',
    metadata: { source: 'Mobile App' }
  },
  {
    report_id: 'R-108',
    category: 'Road & Infrastructure',
    description: 'Sunken road surface and caved asphalt creating dangerous trap for motorbikes.',
    latitude: 18.5248,
    longitude: 73.8423,
    timestamp: '2026-10-08T08:45:00',
    image: null,
    metadata: { source: 'Web Portal' }
  },
  {
    report_id: 'R-115',
    category: 'Road & Infrastructure',
    description: 'Crater on FC road lane 2; broken pavement stones scattered on road.',
    latitude: 18.5243,
    longitude: 73.8418,
    timestamp: '2026-10-08T08:52:00',
    image: null,
    metadata: { source: 'Mobile App' }
  },

  // --- INCIDENT CIV-112 (Electrical & Public Safety - 2 Reports) ---
  {
    report_id: 'R-103',
    category: 'Electrical & Public Safety',
    description: 'Damaged electrical junction box with exposed sparking wires at JM Road corner.',
    latitude: 18.5312,
    longitude: 73.8465,
    timestamp: '2026-10-08T08:55:00',
    image: 'exposed_wires_box.jpg',
    metadata: { source: 'Mobile App' }
  },
  {
    report_id: 'R-114',
    category: 'Electrical & Public Safety',
    description: 'Feeder pillar door is broken open with loose high-voltage cables visible to pedestrians.',
    latitude: 18.5315,
    longitude: 73.8468,
    timestamp: '2026-10-08T09:10:00',
    image: null,
    metadata: { source: 'Hotline' }
  },

  // --- INCIDENT CIV-118 (Water & Sanitation - 3 Reports) ---
  {
    report_id: 'R-105',
    category: 'Water & Sanitation',
    description: 'Clogged storm drain overflowing black stagnant sewage water near Model Colony market.',
    latitude: 18.5360,
    longitude: 73.8340,
    timestamp: '2026-10-08T08:15:00',
    image: 'clogged_drain.jpg',
    metadata: { source: 'Web Portal' }
  },
  {
    report_id: 'R-117',
    category: 'Water & Sanitation',
    description: 'Drainage channel blocked by plastic silt; sewage spilling onto sidewalk.',
    latitude: 18.5363,
    longitude: 73.8342,
    timestamp: '2026-10-08T08:40:00',
    image: null,
    metadata: { source: 'Mobile App' }
  },
  {
    report_id: 'R-122',
    category: 'Water & Sanitation',
    description: 'Manhole grating clogged with trash causing foul water backup.',
    latitude: 18.5358,
    longitude: 73.8338,
    timestamp: '2026-10-08T09:02:00',
    image: null,
    metadata: { source: 'Mobile App' }
  },

  // --- INCIDENT CIV-120 (Road & Infrastructure - 2 Reports) ---
  {
    report_id: 'R-106',
    category: 'Road & Infrastructure',
    description: 'Broken metal guard rail dangling into vehicular lane on Sancheti flyover ramp.',
    latitude: 18.5285,
    longitude: 73.8525,
    timestamp: '2026-10-08T07:50:00',
    image: 'broken_guardrail.jpg',
    metadata: { source: 'Mobile App' }
  },
  {
    report_id: 'R-125',
    category: 'Road & Infrastructure',
    description: 'Damaged crash barrier protruding into fast traffic lane.',
    latitude: 18.5287,
    longitude: 73.8527,
    timestamp: '2026-10-08T08:20:00',
    image: null,
    metadata: { source: 'Web Portal' }
  },

  // --- INCIDENT CIV-125 (Electrical & Public Safety - 2 Reports) ---
  {
    report_id: 'R-109',
    category: 'Electrical & Public Safety',
    description: 'Streetlight pole #42 blinking erratically; base cover missing.',
    latitude: 18.5140,
    longitude: 73.8590,
    timestamp: '2026-10-08T07:15:00',
    image: null,
    metadata: { source: 'Mobile App' }
  },
  {
    report_id: 'R-126',
    category: 'Electrical & Public Safety',
    description: 'Streetlight mast dark and loose wiring bundle visible near ground.',
    latitude: 18.5143,
    longitude: 73.8592,
    timestamp: '2026-10-08T07:35:00',
    image: null,
    metadata: { source: 'Web Portal' }
  }
];

export const INITIAL_INCIDENTS = [
  {
    id: 'CIV-104',
    title: 'Major Water Leak & Road Flooding',
    categories: ['Water & Sanitation'],
    status: 'In Progress',
    severity: 68,
    priority: 'HIGH',
    latitude: 18.5205,
    longitude: 73.8568,
    linked_report_ids: ['R-101', 'R-107', 'R-112', 'R-119', 'R-121', 'R-124', 'R-128', 'R-130'],
    created_at: '2026-10-08T09:05:00',
    updated_at: '2026-10-08T09:28:00',
    evidence_breakdown: {
      location_score: 93,
      time_score: 87,
      text_score: 81,
      evidence_score: 90,
      overall_confidence: 88,
      confidence_level: 'Strong correlation'
    },
    severity_breakdown: {
      factors: [
        { name: 'Multiple Linked Reports', category: 'Volume', points: 18, description: '8 citizen reports independently corroborate this incident cluster.' },
        { name: 'Rapid Incident Growth', category: 'Temporal Velocity', points: 15, description: 'Reports arrived in under 23 minutes showing accelerating flooding.' },
        { name: 'Geographic Impact Area', category: 'Spatial Spread', points: 10, description: 'Flooding spans across ~120m junction radius.' },
        { name: 'Verified Visual Evidence', category: 'Corroboration Confidence', points: 10, description: '2 citizen photos confirm submerged street and burst main.' },
        { name: 'Road & Transit Obstruction', category: 'Public Mobility Risk', points: 15, description: 'Shivaji Nagar junction thoroughfare partially blocked.' }
      ],
      total_score: 68
    },
    status_trail: [
      { id: 'EV-1001', timestamp: '09:05:00', event_type: 'REPORT_RECEIVED', description: 'First citizen report received: Water leak near junction (R-101)', previous_value: null, new_value: 'R-101' },
      { id: 'EV-1002', timestamp: '09:12:00', event_type: 'REPORT_CORRELATED', description: 'Second report correlated: Road flooded with gushing water (R-107)', previous_value: null, new_value: 'R-107' },
      { id: 'EV-1003', timestamp: '09:18:00', event_type: 'INCIDENT_CREATED', description: 'Incident CIV-104 formally clustered with initial Severity 42 [MEDIUM]', previous_value: null, new_value: 'CIV-104' },
      { id: 'EV-1004', timestamp: '09:22:00', event_type: 'SEVERITY_INCREASED', description: 'Additional reports linked (R-112, R-119); Severity increased 42 -> 56', previous_value: '42', new_value: '56' },
      { id: 'EV-1005', timestamp: '09:25:00', event_type: 'EVIDENCE_ADDED', description: 'Photographic evidence added (flooded_street_crossing.jpg)', previous_value: null, new_value: 'R-121' },
      { id: 'EV-1006', timestamp: '09:28:00', event_type: 'PRIORITY_ESCALATED', description: 'Severity increased 56 -> 68; Priority adjusted to HIGH', previous_value: 'MEDIUM', new_value: 'HIGH' }
    ]
  },
  {
    id: 'CIV-109',
    title: 'Deep Pothole Cluster & Caved Footpath',
    categories: ['Road & Infrastructure'],
    status: 'Triaged',
    severity: 72,
    priority: 'HIGH',
    latitude: 18.5245,
    longitude: 73.8420,
    linked_report_ids: ['R-102', 'R-108', 'R-115'],
    created_at: '2026-10-08T08:30:00',
    updated_at: '2026-10-08T08:52:00',
    evidence_breakdown: {
      location_score: 91,
      time_score: 84,
      text_score: 82,
      evidence_score: 85,
      overall_confidence: 86,
      confidence_level: 'Strong correlation'
    },
    severity_breakdown: {
      factors: [
        { name: 'Multiple Linked Reports', category: 'Volume', points: 12, description: '3 verified reports on FC Road corridor.' },
        { name: 'Rapid Incident Growth', category: 'Temporal Velocity', points: 12, description: 'Multiple reports within 22 minutes.' },
        { name: 'Road & Transit Obstruction', category: 'Public Mobility Risk', points: 18, description: 'Severe crater causes two-wheelers to swerve into oncoming traffic.' },
        { name: 'Geographic Impact Area', category: 'Spatial Spread', points: 15, description: 'Span across 75m of high-speed artery.' },
        { name: 'Verified Visual Evidence', category: 'Corroboration Confidence', points: 15, description: 'High-res image of deep asphalt depression.' }
      ],
      total_score: 72
    },
    status_trail: [
      { id: 'EV-1007', timestamp: '08:30:00', event_type: 'REPORT_RECEIVED', description: 'Pothole hazard reported on FC Road (R-102)', previous_value: null, new_value: 'R-102' },
      { id: 'EV-1008', timestamp: '08:52:00', event_type: 'INCIDENT_CREATED', description: 'Clustered into CIV-109; Severity calculated at 72 [HIGH]', previous_value: null, new_value: '72' }
    ]
  },
  {
    id: 'CIV-112',
    title: 'Damaged Electrical Junction Box with Exposed Cables',
    categories: ['Electrical & Public Safety'],
    status: 'Triaged',
    severity: 58,
    priority: 'HIGH',
    latitude: 18.5313,
    longitude: 73.8466,
    linked_report_ids: ['R-103', 'R-114'],
    created_at: '2026-10-08T08:55:00',
    updated_at: '2026-10-08T09:10:00',
    evidence_breakdown: {
      location_score: 94,
      time_score: 86,
      text_score: 88,
      evidence_score: 89,
      overall_confidence: 89,
      confidence_level: 'Strong correlation'
    },
    severity_breakdown: {
      factors: [
        { name: 'Critical Electrical / Safety Risk', category: 'Life Safety Threat', points: 25, description: 'High voltage junction box with open access door.' },
        { name: 'Verified Visual Evidence', category: 'Corroboration Confidence', points: 10, description: 'Photographic evidence of exposed live wiring.' },
        { name: 'Road & Transit Obstruction', category: 'Public Mobility Risk', points: 11, description: 'Located directly along pedestrian sidewalk.' },
        { name: 'Multiple Linked Reports', category: 'Volume', points: 12, description: '2 independent citizen submissions.' }
      ],
      total_score: 58
    },
    status_trail: [
      { id: 'EV-1009', timestamp: '08:55:00', event_type: 'REPORT_RECEIVED', description: 'Sparking feeder pillar reported at JM Road (R-103)', previous_value: null, new_value: 'R-103' },
      { id: 'EV-1010', timestamp: '09:10:00', event_type: 'INCIDENT_CREATED', description: 'Correlated with R-114 into CIV-112; Severity: 58 [HIGH]', previous_value: null, new_value: '58' }
    ]
  },
  {
    id: 'CIV-118',
    title: 'Clogged Storm Drain & Sewage Overflow',
    categories: ['Water & Sanitation'],
    status: 'Logged',
    severity: 41,
    priority: 'MEDIUM',
    latitude: 18.5360,
    longitude: 73.8340,
    linked_report_ids: ['R-105', 'R-117', 'R-122'],
    created_at: '2026-10-08T08:15:00',
    updated_at: '2026-10-08T09:02:00',
    evidence_breakdown: {
      location_score: 92,
      time_score: 82,
      text_score: 79,
      evidence_score: 84,
      overall_confidence: 85,
      confidence_level: 'Strong correlation'
    },
    severity_breakdown: {
      factors: [
        { name: 'Multiple Linked Reports', category: 'Volume', points: 10, description: '3 reports confirming persistent blockage.' },
        { name: 'Geographic Impact Area', category: 'Spatial Spread', points: 9, description: 'Stagnant water ponding in market alley.' },
        { name: 'Road & Transit Obstruction', category: 'Public Mobility Risk', points: 12, description: 'Sidewalk flooded, forcing pedestrians onto road.' },
        { name: 'Verified Visual Evidence', category: 'Corroboration Confidence', points: 10, description: 'Image confirms silt buildup.' }
      ],
      total_score: 41
    },
    status_trail: [
      { id: 'EV-1011', timestamp: '08:15:00', event_type: 'REPORT_RECEIVED', description: 'Sewage overflow reported near Model Colony market (R-105)', previous_value: null, new_value: 'R-105' },
      { id: 'EV-1012', timestamp: '09:02:00', event_type: 'INCIDENT_CREATED', description: 'Clustered into CIV-118; Severity: 41 [MEDIUM]', previous_value: null, new_value: '41' }
    ]
  },
  {
    id: 'CIV-120',
    title: 'Broken Guard Rail & Flyover Debris',
    categories: ['Road & Infrastructure'],
    status: 'Logged',
    severity: 28,
    priority: 'MEDIUM',
    latitude: 18.5286,
    longitude: 73.8526,
    linked_report_ids: ['R-106', 'R-125'],
    created_at: '2026-10-08T07:50:00',
    updated_at: '2026-10-08T08:20:00',
    evidence_breakdown: {
      location_score: 95,
      time_score: 88,
      text_score: 84,
      evidence_score: 88,
      overall_confidence: 89,
      confidence_level: 'Strong correlation'
    },
    severity_breakdown: {
      factors: [
        { name: 'Multiple Linked Reports', category: 'Volume', points: 6, description: '2 reports on flyover ramp.' },
        { name: 'Road & Transit Obstruction', category: 'Public Mobility Risk', points: 14, description: 'Bent metal rail protruding into lane.' },
        { name: 'Verified Visual Evidence', category: 'Corroboration Confidence', points: 8, description: 'Visual of bent guardrail.' }
      ],
      total_score: 28
    },
    status_trail: [
      { id: 'EV-1013', timestamp: '07:50:00', event_type: 'REPORT_RECEIVED', description: 'Bent barrier reported on Sancheti flyover (R-106)', previous_value: null, new_value: 'R-106' },
      { id: 'EV-1014', timestamp: '08:20:00', event_type: 'INCIDENT_CREATED', description: 'Clustered into CIV-120; Severity: 28 [MEDIUM]', previous_value: null, new_value: '28' }
    ]
  },
  {
    id: 'CIV-125',
    title: 'Flickering Streetlight Cluster along MG Road',
    categories: ['Electrical & Public Safety'],
    status: 'Logged',
    severity: 19,
    priority: 'LOW',
    latitude: 18.5141,
    longitude: 73.8591,
    linked_report_ids: ['R-109', 'R-126'],
    created_at: '2026-10-08T07:15:00',
    updated_at: '2026-10-08T07:35:00',
    evidence_breakdown: {
      location_score: 96,
      time_score: 90,
      text_score: 82,
      evidence_score: 75,
      overall_confidence: 86,
      confidence_level: 'Strong correlation'
    },
    severity_breakdown: {
      factors: [
        { name: 'Multiple Linked Reports', category: 'Volume', points: 6, description: '2 reports of non-functional illumination.' },
        { name: 'Low Direct Hazard', category: 'Public Safety', points: 8, description: 'Darkened sidewalk during early hours; no exposed active arcing.' },
        { name: 'Geographic Impact Area', category: 'Spatial Spread', points: 5, description: 'Isolated to two lamp posts.' }
      ],
      total_score: 19
    },
    status_trail: [
      { id: 'EV-1015', timestamp: '07:15:00', event_type: 'REPORT_RECEIVED', description: 'Streetlight outage logged on MG Road (R-109)', previous_value: null, new_value: 'R-109' },
      { id: 'EV-1016', timestamp: '07:35:00', event_type: 'INCIDENT_CREATED', description: 'Clustered into CIV-125; Severity: 19 [LOW]', previous_value: null, new_value: '19' }
    ]
  }
];

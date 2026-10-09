# Synthetic Civic Dataset

This directory contains the synthetic benchmark datasets used by **CivicPulse** for incident correlation, clustering, severity estimation, and municipal resource prioritization.

---

## 🔒 Privacy & Synthetic Guarantee
- **Zero Personal Identifiable Information (PII):** All citizen names, phone numbers, exact residential coordinates, and contact details have been omitted or synthetically generated.
- **Synthesized Geographic Focus:** Coordinates are calibrated around the central civic core of Pune, Maharashtra (Shivaji Nagar, FC Road, JM Road, Model Colony, MG Road) to model realistic urban density and emergency transit velocities.

---

## 📁 Dataset Contents

### 1. `synthetic_reports/reports.json`
Contains **20 synthetic multi-channel citizen submissions** across 3 primary municipal domains:
- **Water & Sanitation:** Burst water mains, junction flooding, clogged storm drains, sewage overflows.
- **Road & Infrastructure:** Arterial potholes, sunken asphalt, broken guardrail barriers.
- **Electrical & Public Safety:** Damaged feeder pillars, sparking transformers, street light outages.

#### Report Schema:
```json
{
  "report_id": "R-101",
  "category": "Water & Sanitation",
  "description": "Water is leaking heavily onto the road near Shivaji Nagar junction.",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "timestamp": "2026-10-08T09:05:00",
  "image": "water_leak_junction.jpg",
  "metadata": {
    "source": "Mobile App",
    "channel": "Citizen Mobile"
  }
}
```

---

### 2. `synthetic_resources/resources.json`
Contains **5 municipal emergency response assets** mapped with specific capabilities and base depot coordinates.

#### Resource Schema:
```json
{
  "id": "RSRC-03",
  "name": "Water Response Team",
  "type": "Water & Sanitation",
  "capabilities": ["Water & Sanitation", "Pipeline Repair", "High-Volume Pumping"],
  "availability": "Available",
  "current_assignment": null,
  "latitude": 18.5280,
  "longitude": 73.8540,
  "base_station": "Northern Water Works Facility"
}
```

---

## 🧪 Simulation Scenarios Covered
1. **Multi-Source Corroboration:** 8 independent reports cluster into `CIV-104` with 88% confidence.
2. **Evolving Compound Escalation:** Injection of severe report `R-140` / `R-1021` (live electrical wire fallen into flooded street) triggers cross-domain hazard logic, escalating severity from **68 (HIGH)** to **94 (CRITICAL)**.
3. **Resource Shortage & Fallback:** Detaining `RES-04` (Electrical Response Team) triggers shortage resolution, automatically routing `RES-05` (Emergency Response Vehicle) for safety containment.

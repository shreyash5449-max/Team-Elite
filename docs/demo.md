# CivicPulse Hackathon Demo Guide 🏆

This guide provides a reproducible, step-by-step walkthrough of the **CivicPulse** platform for judges, evaluators, and teammates.

---

## 🎯 Demo Objectives
Demonstrate that CivicPulse:
1. Clusters fragmented multi-channel citizen reports into coherent civic incidents.
2. Explains the exact factors driving algorithmic severity scores.
3. Dynamically escalates compound cross-domain hazards (Water + Electrical).
4. Handles real-world municipal resource shortages with automated contingency rerouting.

---

## 📋 12-Step Demonstration Script

### Step 1: Open the Application
- Open `http://localhost:5173/` in your browser.
- **What to observe:**
  - Header displays live KPI indicators: `6 Incidents`, `20 Corroborated Reports`, `0 Crit • 3 High`, `5/5 Active Fleet Units`.
  - Tactical Leaflet radar map is centered on Pune municipal core with color-coded incident beacons and buffer zones.

### Step 2: Inspect Initial Incident Clustering (`CIV-104`)
- Click on **`CIV-104: Major Water Leak & Road Flooding`** in the left panel.
- **What to observe:**
  - Initial Severity: **`68 / 100`** with **`HIGH PRIORITY`**.
  - Notice the **Explainable Severity Index**:
    - Multiple Linked Reports: $+18$ pts (8 reports linked)
    - Rapid Incident Growth: $+15$ pts (surge within 23 mins)
    - Road & Transit Obstruction: $+15$ pts
    - Spatial Spread: $+10$ pts (~120m radius)
    - Verified Visual Evidence: $+10$ pts

### Step 3: Inspect Multi-Source Evidence Linkage
- Switch to the **Corroborated Evidence** tab in the right intelligence drawer.
- **What to observe:**
  - 4-metric confidence breakdown: Spatial (93%), Temporal (87%), NLP (81%), Visual Evidence (90%) with an **88% Strong Correlation**.
  - 8 distinct citizen reports submitted via Mobile App, Web Portal, and Voice IVR.
  - Photographic evidence thumbnail (`flooded_street_crossing.jpg`). Click **View Photo** to inspect the verified asset with metadata watermark.

### Step 4: Inspect Baseline Resource Dispatch
- Switch to the **Dispatch Allocation** tab.
- **What to observe:**
  - `Water Response Team` is recommended with an ETA of ~5 minutes based on proximity.

### Step 5: Test Real-Time Citizen Report Submission
- Click **"2. Test Citizen Submission"** or **"Submit Report"** in the top bar.
- Select the preset: **`Shivaji Nagar Junction (CIV-104 Area)`**.
- Type: `Water gushing across two lanes near the bus stop.`
- Click **Submit & Correlate**.
- **What to observe:**
  - Instant clustering engine feedback confirms the report was correlated into `CIV-104` with high confidence.

### Step 6: Trigger Compound Hazard Escalation (Step 3 Simulation)
- Click **"3. Inject Severe Hazard (CIV-104 → 94 CRIT)"** in the top stepper bar.
- **What to observe:**
  - An emergency toast notification triggers: *"Critical Threat Escalation! Live power line fell in flooded area!"*
  - `CIV-104` title evolves to: **`Major Water Leak & Live Electrical Hazard`**.
  - Severity jumps from **`68`** to **`94 / 100 [CRITICAL]`**.
  - Priority badge turns glowing **`CRITICAL`** with a flame icon.
  - Map beacon pulses with an animated critical red radar ring.

### Step 7: Examine Severity Explainability After Escalation
- In the right drawer, observe the updated factors:
  - **Critical Electrical / Safety Risk:** $+25$ points (submerged live cable in public area).
  - **Cross-Domain Compound Hazard:** $+15$ points (Water & Sanitation interacting with Electrical).
  - Total severity is now 94/100, explaining why it jumped to the top of the municipal dispatch queue.

### Step 8: Observe Resource Recalculation
- Switch to **Dispatch Allocation** tab for `CIV-104`.
- **What to observe:**
  - Recommended units updated: Both **Water Response Team** AND **Electrical Response Team** are now dispatched.

### Step 9: Simulate Municipal Resource Shortage (Step 4 Simulation)
- Click **"4. Resource Shortage (Electrical Detained)"** in the top stepper bar.
- **What to observe:**
  - Toast notification appears: *"Electrical Response Team detained off-grid. Optimization engine automatically re-routed Emergency Response Vehicle!"*
  - A bright amber warning callout appears in the dispatch panel:
    > **DYNAMIC RESOURCE SHORTAGE MITIGATION:** Primary electrical repair team is detained due to off-grid transformer failure. The optimization engine automatically re-routed **Emergency Response Vehicle** for perimeter isolation and pedestrian safety containment.

### Step 10: Inspect Municipal Fleet Modal
- Click **"Fleet & Analytics"** in the top header.
- **What to observe:**
  - Fleet readiness updates to **`4/5 Available`**.
  - `RES-04: Electrical Response Team` is marked **`UNAVAILABLE`** with the detention reason.
  - Category and severity distribution charts display the updated city-wide metrics.
  - Close the modal.

### Step 11: Inspect Chronological Status Audit Trail
- Switch to the **Status Trail** tab for `CIV-104`.
- **What to observe:**
  - The complete event lifecycle is logged:
    1. Initial report received (`R-101`)
    2. Reports correlated into `CIV-104` with 88% confidence
    3. Severity increased to 68 [HIGH]
    4. Severe report linked (`R-140` / `R-1021`)
    5. Priority escalated `HIGH → CRITICAL`
    6. Resource shortage detected (`RES-04` unavailable)
    7. Fallback containment vehicle deployed.

### Step 12: Reset Demo State
- Click **"Reset Demo"** in the top bar.
- **What to observe:**
  - System cleanly returns to baseline state (20 reports, 6 incidents, 5 available resources).
  - The entire demo is ready to run again!

---

## 🤖 Round 2 Demo Scenario: CivicPulse Assistant Walkthrough

The **CivicPulse Assistant** makes all underlying algorithmic calculations accessible to non-technical evaluators and dispatch commanders:

1. **Open Incident CIV-104 & Switch to Assistant:**
   - Select `CIV-104` (68 HIGH).
   - In the right-hand panel, click the **"🤖 CivicPulse Assistant"** tab.
2. **Ask Baseline Severity Question:**
   - Click the suggested question: `[Why is CIV-104 HIGH priority?]`
   - *Assistant Response:* Explains the 68/100 score with the exact point breakdown (+18 Volume from 8 reports, +15 Velocity, +15 Transit Obstruction).
3. **Escalate to Severe Hazard:**
   - Click **"3. Inject Severe Hazard"** in the top simulation bar.
   - Severity updates to 94 CRITICAL.
4. **Ask Why Severity Increased:**
   - Click suggested question: `[Why did CIV-104 change from 68 to 94?]`
   - *Assistant Response:* Explains that report `R-140` added the Critical Electrical Risk (+25 pts) and Cross-Domain Compound Threat (+15 pts), elevating the priority to CRITICAL.
5. **Ask About Evidence Linkage:**
   - Click suggested question: `[What evidence is linked to CIV-104?]`
   - *Assistant Response:* Transparently breaks down the 40/20/25/15 model (Location 98%, Time 88%, Text 79%, Category 95%) and identifies Location as the primary signal.
6. **Simulate Resource Shortage:**
   - Click **"4. Resource Shortage (Electrical Detained)"** in the top bar.
7. **Ask What Happens Now:**
   - Click suggested question: `[What happens now?]` (or `[What happens if the Electrical Response Team is unavailable?]`).
   - *Assistant Response:* Reports that the Electrical Team is unavailable and explains that the optimization engine automatically rerouted the Emergency Response Vehicle for safety containment (ETA ~8 min).
8. **Ask About History:**
   - Ask: `"What changed in CIV-104?"`
   - *Assistant Response:* Produces a numbered chronological timeline from the initial 09:05 report to final contingency fallback.


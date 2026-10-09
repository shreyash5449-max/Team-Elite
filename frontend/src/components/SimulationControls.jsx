import React from 'react';
import { 
  Zap, 
  AlertTriangle, 
  RotateCcw, 
  Send, 
  Flame, 
  Truck,
  CheckCircle2
} from 'lucide-react';

export default function SimulationControls({
  currentStep = 1,
  onSelectStep,
  onInjectSevere,
  onSimulateShortage,
  onResetSimulation,
  onOpenSubmitModal,
  isSevereActive = false,
  isShortageActive = false,
  loading = false
}) {
  return (
    <div className="simulation-bar" id="simulation-bar">
      <div className="simulation-lead">
        <span className="demo-indicator">
          <Zap size={12} />
          SCENARIO SIMULATOR
        </span>
        <span>Interactive Workflow Progression:</span>
      </div>

      <div className="sim-steps-wrapper">
        {/* Step 1: Baseline */}
        <button
          id="btn-step-baseline"
          className={`sim-step-btn ${!isSevereActive && !isShortageActive ? 'active-step' : ''}`}
          onClick={() => onResetSimulation()}
          disabled={loading}
          title="Baseline: 20 Citizen Reports clustered into 6 Incidents"
        >
          <CheckCircle2 size={14} />
          <span>1. Baseline Cluster (20 Reports)</span>
        </button>

        {/* Step 2: Submit Citizen Report */}
        <button
          id="btn-step-submit-report"
          className="sim-step-btn"
          onClick={onOpenSubmitModal}
          disabled={loading}
          title="Submit new report to test real-time clustering engine"
        >
          <Send size={13} />
          <span>2. Test Citizen Submission</span>
        </button>

        {/* Step 3: Inject Severe Report into CIV-104 */}
        <button
          id="btn-step-inject-severe"
          className={`sim-step-btn ${isSevereActive ? 'active-step danger-step' : 'danger-step'}`}
          onClick={onInjectSevere}
          disabled={loading}
          title="Simulate Step 3: Live wire in flooded street. Escalates CIV-104 to 94 [CRITICAL]"
        >
          <Flame size={14} color="#ef4444" />
          <span>3. Inject Severe Hazard (CIV-104 → 94 CRIT)</span>
        </button>

        {/* Step 4: Simulate Resource Shortage */}
        <button
          id="btn-step-resource-shortage"
          className={`sim-step-btn ${isShortageActive ? 'active-step warning-step' : 'warning-step'}`}
          onClick={onSimulateShortage}
          disabled={loading}
          title="Simulate Step 6: Electrical Response Team detained. Dispatches fallback Emergency Vehicle!"
        >
          <AlertTriangle size={14} color="#f59e0b" />
          <span>4. Resource Shortage (Electrical Detained)</span>
        </button>

        {/* Reset State */}
        <button
          id="btn-step-reset"
          className="sim-step-btn btn-reset"
          onClick={onResetSimulation}
          disabled={loading}
          title="Reset to initial state"
        >
          <RotateCcw size={13} />
          <span>Reset Demo</span>
        </button>
      </div>
    </div>
  );
}

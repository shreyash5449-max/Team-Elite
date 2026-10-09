import React, { useState } from 'react';
import SimulationControls from '../components/SimulationControls';
import IncidentList from '../components/IncidentList';
import MapView from '../components/MapView';
import IncidentDetail from '../components/IncidentDetail';
import CivicPulseAssistant from '../components/CivicPulseAssistant';
import ReportExplorer from '../components/ReportExplorer';
import { 
  FileText, 
  Bot, 
  BarChart3, 
  MessageSquare, 
  PlusCircle, 
  Radio, 
  ShieldAlert, 
  Layers, 
  Truck, 
  User, 
  ArrowLeft 
} from 'lucide-react';

export default function AuthorityDashboardPage({
  incidents = [],
  reports = [],
  resources = [],
  analytics = null,
  selectedIncidentId,
  selectedIncidentDetail,
  panToCoordinates,
  onSelectIncident,
  onOpenCitizenChat,
  onOpenAuthorityChat,
  onOpenSubmitModal,
  onOpenFleetModal,
  onOpenEvidenceModal,
  onInjectSevere,
  onSimulateShortage,
  onResetSimulation,
  onRecalculate,
  onUpdateReport,
  onDeleteReport,
  onCenterMap,
  isSevereActive,
  isShortageActive,
  loading,
  unreadChatCount = 0,
  onNavigate
}) {
  const [activeRightTab, setActiveRightTab] = useState('intel'); // 'intel' | 'reports' | 'assistant'

  const activeIncident = selectedIncidentDetail || incidents.find(i => i.id === selectedIncidentId);
  const criticalCount = incidents.filter(i => i.priority === 'CRITICAL').length;
  const highCount = incidents.filter(i => i.priority === 'HIGH').length;
  const availableResources = resources.filter(r => (r.availability || '').toUpperCase() === 'AVAILABLE').length;

  return (
    <div className="authority-dashboard-page" id="authority-dashboard">
      {/* 1. Tactical Command Sub-Header */}
      <div className="authority-sub-header">
        <div className="auth-brand-strip">
          <div className="auth-tag">
            <Radio size={12} className="spin-pulse" />
            <span>Staff Command Center</span>
          </div>
          <span className="auth-title">Intelligent Multi-Source Incident Coordination</span>
        </div>

        {/* Tactical KPI Strip */}
        <div className="auth-kpi-strip">
          <div className="kpi-mini-item">
            <Layers size={13} color="#38bdf8" />
            <span className="kpi-mini-label">Incidents:</span>
            <strong className="kpi-mini-val">{incidents.length}</strong>
          </div>
          <div className="kpi-mini-divider" />
          <div className="kpi-mini-item">
            <FileText size={13} color="#94a3b8" />
            <span className="kpi-mini-label">Corroborated:</span>
            <strong className="kpi-mini-val">{reports.length}</strong>
          </div>
          <div className="kpi-mini-divider" />
          <div className="kpi-mini-item">
            <ShieldAlert size={13} color={criticalCount > 0 ? '#ef4444' : '#f97316'} />
            <span className="kpi-mini-label">Priority:</span>
            <strong className="kpi-mini-val" style={{ color: criticalCount > 0 ? '#ef4444' : '#f97316' }}>
              {criticalCount} Crit • {highCount} High
            </strong>
          </div>
          <div className="kpi-mini-divider" />
          <div className="kpi-mini-item">
            <Truck size={13} color="#10b981" />
            <span className="kpi-mini-label">Fleet:</span>
            <strong className="kpi-mini-val">{availableResources}/{resources.length} Active</strong>
          </div>
        </div>

        {/* Command Actions */}
        <div className="auth-header-actions">
          <button
            type="button"
            className="btn-auth-action"
            onClick={onOpenAuthorityChat}
            title="Inspect citizen messages"
          >
            <MessageSquare size={14} color={unreadChatCount > 0 ? '#38bdf8' : 'currentColor'} />
            <span>Messages</span>
            {unreadChatCount > 0 && <span className="auth-unread-pill">{unreadChatCount}</span>}
          </button>

          <button
            type="button"
            className="btn-auth-action"
            onClick={onOpenFleetModal}
            title="Inspect municipal fleet and analytics"
          >
            <BarChart3 size={14} />
            <span>Fleet Analytics</span>
          </button>

          <button
            type="button"
            className="btn-return-citizen"
            onClick={() => onNavigate('home')}
            title="Return to public citizen portal"
          >
            <ArrowLeft size={13} />
            <span>Citizen Site</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Simulation Workflow Bar */}
      <SimulationControls
        onInjectSevere={onInjectSevere}
        onSimulateShortage={onSimulateShortage}
        onResetSimulation={onResetSimulation}
        onOpenSubmitModal={onOpenSubmitModal}
        isSevereActive={isSevereActive}
        isShortageActive={isShortageActive}
        loading={loading}
      />

      {/* 3. 3-Panel Tactical Command Center */}
      <main className="workspace-grid" id="command-center-workspace">
        {/* Left: Incident Cluster Feed */}
        <IncidentList
          incidents={incidents}
          selectedIncidentId={selectedIncidentId}
          onSelectIncident={onSelectIncident}
        />

        {/* Center: Tactical Geospatial Map */}
        <MapView
          incidents={incidents}
          reports={reports}
          resources={resources}
          selectedIncidentId={selectedIncidentId}
          panToCoordinates={panToCoordinates}
          onSelectIncident={onSelectIncident}
          onOpenCitizenChat={onOpenCitizenChat}
          viewMode="authority"
          onOpenSubmitModal={onOpenSubmitModal}
        />

        {/* Right: Tabbed Deep Intelligence, Reports Management & CivicPulse Assistant Drawer */}
        <div className="right-panel-wrapper" id="right-command-drawer">
          {/* Top Tab Bar */}
          <div className="right-panel-tabs">
            <button
              className={`tab-btn ${activeRightTab === 'intel' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('intel')}
              id="tab-btn-intel"
              title="View Incident Intelligence Scorecard"
            >
              <span>📊 Tactical Intel</span>
            </button>
            <button
              className={`tab-btn ${activeRightTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('reports')}
              id="tab-btn-reports"
              title="Manage and inspect citizen reports"
            >
              <FileText size={14} color={activeRightTab === 'reports' ? '#38bdf8' : 'currentColor'} />
              <span>Citizen Reports ({reports.length})</span>
            </button>
            <button
              className={`tab-btn ${activeRightTab === 'assistant' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('assistant')}
              id="tab-btn-assistant"
              title="Open CivicPulse Assistant Decision Support"
            >
              <Bot size={14} color={activeRightTab === 'assistant' ? '#38bdf8' : 'currentColor'} />
              <span>Assistant</span>
              <span className="tab-badge-round2">AI</span>
            </button>
          </div>

          {/* Panel View Switcher */}
          {activeRightTab === 'intel' && (
            <IncidentDetail
              incident={activeIncident}
              allReports={reports}
              onOpenEvidenceModal={onOpenEvidenceModal}
              onOpenCitizenChat={onOpenCitizenChat}
              onRecalculate={onRecalculate}
              onOpenAssistant={(id) => {
                if (id) onSelectIncident(id);
                setActiveRightTab('assistant');
              }}
            />
          )}

          {activeRightTab === 'reports' && (
            <ReportExplorer
              reports={reports}
              incidents={incidents}
              onOpenSubmitModal={onOpenSubmitModal}
              onOpenEvidenceModal={onOpenEvidenceModal}
              onOpenCitizenChat={onOpenCitizenChat}
              onSelectIncident={(id) => {
                onSelectIncident(id);
                setActiveRightTab('intel');
              }}
              onCenterMapOnCoordinates={onCenterMap}
              onUpdateReport={onUpdateReport}
              onDeleteReport={onDeleteReport}
            />
          )}

          {activeRightTab === 'assistant' && (
            <CivicPulseAssistant
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={onSelectIncident}
              isSevereActive={isSevereActive}
              isShortageActive={isShortageActive}
            />
          )}
        </div>
      </main>
    </div>
  );
}

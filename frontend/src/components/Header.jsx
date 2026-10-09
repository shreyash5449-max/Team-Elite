import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Layers, 
  FileText, 
  Truck, 
  PlusCircle, 
  BarChart3, 
  Radio,
  Bot,
  MessageSquare,
  Map,
  Shield,
  User,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

export default function Header({ 
  viewMode = 'citizen', // 'citizen' | 'authority'
  onToggleViewMode,
  activeCitizenTab = 'map', // 'map' | 'my-complaints'
  onSelectCitizenTab,
  incidents = [], 
  reports = [], 
  resources = [], 
  analytics = null,
  activeRightTab = 'intel',
  onToggleAssistant,
  onOpenSubmitModal,
  onOpenFleetModal,
  onOpenAuthorityChat,
  onOpenCitizenChat,
  unreadChatCount = 0,
  myComplaintsCount = 0
}) {
  const criticalCount = incidents.filter(i => i.priority === 'CRITICAL').length;
  const highCount = incidents.filter(i => i.priority === 'HIGH').length;
  const availableResources = resources.filter(r => r.availability === 'AVAILABLE' || r.availability === 'Available').length;
  const totalResources = resources.length || 5;

  // 1. CITIZEN-FRIENDLY HEADER (Default View for Ordinary Citizens)
  if (viewMode === 'citizen') {
    return (
      <header className="top-header citizen-header" id="top-header" style={{ height: '62px' }}>
        {/* Brand Section */}
        <div className="brand-section">
          <div className="logo-badge" style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}>
            <Activity size={22} color="#ffffff" />
          </div>
          <div className="brand-title">
            <div className="brand-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>CivicPulse</span>
              <span className="pulse-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: 4 }}></span>
                Public City Grid
              </span>
            </div>
            <span className="brand-subtitle" style={{ color: '#94a3b8' }}>
              Citizen Grievance & Incident Support
            </span>
          </div>
        </div>

        {/* Citizen Navigation Links */}
        <nav className="citizen-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className={`btn-header ${activeCitizenTab === 'map' ? 'active-citizen-nav' : ''}`}
            onClick={() => onSelectCitizenTab && onSelectCitizenTab('map')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              background: activeCitizenTab === 'map' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              borderColor: activeCitizenTab === 'map' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
              color: activeCitizenTab === 'map' ? '#38bdf8' : 'var(--text-secondary)'
            }}
          >
            <Map size={14} />
            <span>Map</span>
          </button>

          <button
            type="button"
            className={`btn-header ${activeCitizenTab === 'my-complaints' ? 'active-citizen-nav' : ''}`}
            onClick={() => onSelectCitizenTab && onSelectCitizenTab('my-complaints')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              background: activeCitizenTab === 'my-complaints' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              borderColor: activeCitizenTab === 'my-complaints' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
              color: activeCitizenTab === 'my-complaints' ? '#38bdf8' : 'var(--text-secondary)'
            }}
          >
            <ClipboardList size={14} />
            <span>My Complaints</span>
            {myComplaintsCount > 0 && (
              <span style={{
                background: '#0284c7',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
                marginLeft: '4px'
              }}>
                {myComplaintsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="btn-header"
            onClick={onOpenCitizenChat}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'transparent',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)'
            }}
          >
            <MessageSquare size={14} />
            <span>Messages</span>
            {unreadChatCount > 0 && (
              <span style={{
                background: '#0284c7',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
                marginLeft: '4px'
              }}>
                {unreadChatCount}
              </span>
            )}
          </button>
        </nav>

        {/* Action Buttons: Prominent Report Button + Staff Mode Switch */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            id="btn-report-problem-header"
            className="btn-header"
            onClick={onOpenSubmitModal}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Report a civic problem in your area"
          >
            <PlusCircle size={16} />
            <span>Report a Problem</span>
          </button>

          <button 
            type="button"
            className="btn-header"
            onClick={onToggleViewMode}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              color: '#94a3b8',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              background: 'rgba(15, 23, 42, 0.6)'
            }}
            title="Switch to Municipal Staff / Authority Command Center"
          >
            <Shield size={13} color="#38bdf8" />
            <span>Staff Portal</span>
          </button>
        </div>
      </header>
    );
  }

  // 2. AUTHORIZED AUTHORITY VIEW (Tactical Command Center)
  return (
    <header className="top-header" id="top-header">
      {/* Brand Section */}
      <div className="brand-section">
        <div className="logo-badge">
          <Activity size={22} color="#ffffff" />
        </div>
        <div className="brand-title">
          <div className="brand-name">
            CivicPulse
            <span className="pulse-tag" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <Radio size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Staff Command
            </span>
          </div>
          <span className="brand-subtitle">
            Intelligent Multi-Source Civic Incident Coordination
          </span>
        </div>
      </div>

      {/* Real-time KPI Stats Strip */}
      <div className="kpi-strip" id="header-kpi-strip">
        <div className="kpi-item">
          <Layers size={14} color="#38bdf8" />
          <span className="kpi-label">Incidents:</span>
          <span className="kpi-value active">{incidents.length}</span>
        </div>

        <div className="kpi-divider" />

        <div className="kpi-item">
          <FileText size={14} color="#94a3b8" />
          <span className="kpi-label">Corroborated Reports:</span>
          <span className="kpi-value">{reports.length}</span>
        </div>

        <div className="kpi-divider" />

        <div className="kpi-item">
          <ShieldAlert size={14} color={criticalCount > 0 ? '#ef4444' : '#f97316'} />
          <span className="kpi-label">Critical / High:</span>
          <span className={`kpi-value ${criticalCount > 0 ? 'critical' : 'high'}`}>
            {criticalCount} Crit • {highCount} High
          </span>
        </div>

        <div className="kpi-divider" />

        <div className="kpi-item">
          <Truck size={14} color="#10b981" />
          <span className="kpi-label">Fleet Readiness:</span>
          <span className="kpi-value">
            {availableResources}/{totalResources} Active
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="header-actions">
        <button 
          id="btn-toggle-assistant"
          className="btn-header"
          onClick={onToggleAssistant}
          style={{
            borderColor: activeRightTab === 'assistant' ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)',
            background: activeRightTab === 'assistant' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.08)',
            color: '#38bdf8'
          }}
          title="Open CivicPulse Decision-Support Assistant (Round 2)"
        >
          <Bot size={15} color="#38bdf8" />
          <span>Assistant</span>
        </button>

        <button 
          id="btn-open-authority-chat"
          className="btn-header"
          onClick={onOpenAuthorityChat}
          style={{
            borderColor: unreadChatCount > 0 ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
            background: unreadChatCount > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            color: unreadChatCount > 0 ? '#38bdf8' : 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Citizen Messages - 1-to-1 Authority Command Center"
        >
          <MessageSquare size={15} color={unreadChatCount > 0 ? '#38bdf8' : 'currentColor'} />
          <span>Citizen Messages</span>
          {unreadChatCount > 0 && (
            <span style={{
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '10px',
              lineHeight: '1.2'
            }}>
              {unreadChatCount}
            </span>
          )}
        </button>

        <button 
          id="btn-open-fleet-modal"
          className="btn-header"
          onClick={onOpenFleetModal}
          title="Inspect Municipal Fleet & Analytics"
        >
          <BarChart3 size={15} />
          <span>Fleet & Analytics</span>
        </button>

        <button 
          id="btn-open-submit-modal"
          className="btn-header btn-primary-header"
          onClick={onOpenSubmitModal}
          title="Submit a citizen incident report to test real-time clustering"
        >
          <PlusCircle size={15} />
          <span>Submit Report</span>
        </button>

        <button 
          type="button"
          className="btn-header"
          onClick={onToggleViewMode}
          style={{
            borderColor: '#10b981',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#34d399',
            marginLeft: '4px'
          }}
          title="Return to Citizen-Friendly View"
        >
          <User size={14} />
          <span>Citizen View</span>
        </button>
      </div>
    </header>
  );
}

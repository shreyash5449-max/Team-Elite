import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ReportProblemPage from './pages/ReportProblemPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import ChatPage from './pages/ChatPage';
import AboutPage from './pages/AboutPage';
import AuthorityDashboardPage from './pages/AuthorityDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SubmitReportModal from './components/SubmitReportModal';
import CitizenComplaintModal from './components/CitizenComplaintModal';
import CitizenChatModal from './components/CitizenChatModal';
import FleetAnalyticsModal from './components/FleetAnalyticsModal';
import EvidenceModal from './components/EvidenceModal';
import AuthorityChatModal from './components/AuthorityChatModal';
import { 
  fetchIncidents, 
  fetchIncidentById, 
  fetchReports, 
  fetchResources, 
  fetchAnalytics, 
  submitCitizenReport, 
  updateReport, 
  deleteReport, 
  toggleResourceAvailability, 
  triggerSevereReportSimulation, 
  triggerResourceShortageSimulation, 
  resetSimulationState, 
  recalculatePriorities, 
  fetchChatUnreadCount 
} from './services/api';
import { AlertCircle, CheckCircle2, Flame, AlertTriangle } from 'lucide-react';

export default function App() {
  // Navigation Route: 'home' | 'explore' | 'report' | 'my-complaints' | 'chat' | 'about' | 'authority' | 'admin'
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const valid = ['home', 'explore', 'report', 'my-complaints', 'chat', 'about', 'authority', 'admin'];
    return valid.includes(hash) ? hash : 'home';
  });

  // User Profile / Demo Persona
  const [currentUser, setCurrentUser] = useState({
    name: 'Dhruva Supali',
    role: 'citizen' // 'citizen' | 'authority' | 'admin'
  });

  // Data Store
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState('CIV-104');
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState(null);
  const [reports, setReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Tracked Citizen Complaint IDs
  const [myReportIds, setMyReportIds] = useState(() => {
    try {
      const saved = localStorage.getItem('civicpulse_my_reports');
      return saved ? JSON.parse(saved) : ['R-101', 'R-1021'];
    } catch {
      return ['R-101', 'R-1021'];
    }
  });

  // Simulation State Flags (Authority Mode)
  const [isSevereActive, setIsSevereActive] = useState(false);
  const [isShortageActive, setIsShortageActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Map Navigation
  const [panToCoordinates, setPanToCoordinates] = useState(null);

  // Global Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCitizenComplaintOpen, setIsCitizenComplaintOpen] = useState(false);
  const [citizenDetailComplaint, setCitizenDetailComplaint] = useState(null);
  const [isCitizenChatOpen, setIsCitizenChatOpen] = useState(false);
  const [citizenChatReport, setCitizenChatReport] = useState(null);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [evidenceModalReport, setEvidenceModalReport] = useState(null);
  const [isAuthorityChatOpen, setIsAuthorityChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (title, message, type = 'info') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Sync route with URL hash
  const navigateTo = (pageId) => {
    setCurrentPage(pageId);
    window.location.hash = `#/${pageId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const valid = ['home', 'explore', 'report', 'my-complaints', 'chat', 'about', 'authority', 'admin'];
      if (valid.includes(hash)) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load all initial data from backend
  const loadData = useCallback(async (preserveSelectedId = null) => {
    try {
      const [incRes, repRes, rsrcRes, anaRes] = await Promise.all([
        fetchIncidents(),
        fetchReports(),
        fetchResources(),
        fetchAnalytics()
      ]);

      const incList = incRes.data || [];
      setIncidents(incList);
      setReports(repRes.data || []);
      setResources(rsrcRes.data || []);
      setAnalytics(anaRes.data || null);

      // Check shortage state
      const shortageExists = (rsrcRes.data || []).some(
        r => r.availability === 'UNAVAILABLE' || r.availability === 'Unavailable'
      );
      setIsShortageActive(shortageExists);

      // Check severe state
      const civ104 = incList.find(i => i.id === 'CIV-104');
      setIsSevereActive(Boolean(civ104 && civ104.severity >= 90));

      const targetId = preserveSelectedId || selectedIncidentId || (incList[0]?.id || 'CIV-104');
      setSelectedIncidentId(targetId);

      if (targetId) {
        try {
          const detailRes = await fetchIncidentById(targetId);
          setSelectedIncidentDetail(detailRes.data);
        } catch {
          const fallback = incList.find(i => i.id === targetId);
          setSelectedIncidentDetail(fallback || null);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      showToast('Connection Error', err.message, 'error');
    }
  }, [selectedIncidentId]);

  useEffect(() => {
    loadData();
  }, []);

  // Poll for unread citizen/authority messages
  useEffect(() => {
    let isMounted = true;
    const updateUnread = async () => {
      try {
        const role = currentUser.role === 'authority' ? 'authority' : 'citizen';
        const userId = currentUser.role === 'authority' ? 'authority-current' : 'citizen-current';
        const res = await fetchChatUnreadCount(role, userId);
        if (isMounted && res && typeof res.unread_count === 'number') {
          setUnreadChatCount(res.unread_count);
        }
      } catch {
        // silent polling fallback
      }
    };
    updateUnread();
    const interval = setInterval(updateUnread, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser.role]);

  // Center map helper
  const handleCenterMap = (lat, lng) => {
    setPanToCoordinates({ lat, lng, timestamp: Date.now() });
    navigateTo('explore');
  };

  // Open Citizen Complaint Details Modal
  const handleOpenCitizenDetails = (complaint) => {
    let target = complaint;
    if (complaint && complaint.linked_report_ids) {
      target = reports.find(r => complaint.linked_report_ids.includes(r.report_id || r.id)) || complaint;
    }
    setCitizenDetailComplaint(target);
    setIsCitizenComplaintOpen(true);
  };

  // Open Citizen Chat
  const handleOpenCitizenChat = (report) => {
    let target = report;
    if (report && report.linked_report_ids) {
      target = reports.find(r => report.linked_report_ids.includes(r.report_id || r.id)) || {
        report_id: report.linked_report_ids[0] || report.id,
        id: report.linked_report_ids[0] || report.id,
        description: report.title,
        category: report.categories?.[0] || 'Road & Infrastructure',
        status: report.status || 'Active'
      };
    } else if (!report) {
      target = reports.find(r => myReportIds.includes(r.report_id || r.id)) || reports[0] || {
        report_id: 'R-101',
        description: 'General Municipal Grievance',
        category: 'Road & Infrastructure',
        status: 'Active'
      };
    }
    setCitizenChatReport(target);
    // Navigate to Chat page or open chat modal
    setCitizenChatReport(target);
    navigateTo('chat');
  };

  // Select incident (for authority or map focus)
  const handleSelectIncident = async (id) => {
    setSelectedIncidentId(id);
    try {
      const res = await fetchIncidentById(id);
      setSelectedIncidentDetail(res.data);
    } catch {
      const fallback = incidents.find(i => i.id === id);
      setSelectedIncidentDetail(fallback || null);
    }
  };

  // Citizen Report Submission handler
  const handleSubmitReport = async (reportData) => {
    const res = await submitCitizenReport(reportData);
    const newReportId = res?.report?.report_id || res?.data?.report?.report_id;
    if (newReportId) {
      setMyReportIds(prev => {
        const next = [newReportId, ...prev.filter(id => id !== newReportId)];
        try {
          localStorage.setItem('civicpulse_my_reports', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
    const affectedIncId = res?.incident?.id || res?.data?.incident?.id || 'CIV-104';
    await loadData(affectedIncId);
    showToast(
      'Complaint Received',
      `Reference ID #${newReportId || 'NEW'} submitted and queued for municipal inspection.`,
      'success'
    );
    return res;
  };

  // STEP 3 Simulation: Inject Severe Report
  const handleInjectSevere = async () => {
    setLoading(true);
    try {
      await triggerSevereReportSimulation();
      setIsSevereActive(true);
      await loadData('CIV-104');
      showToast(
        'Critical Threat Escalation!',
        'R-1021 / R-140 correlated: Live power line fell in flooded area! CIV-104 escalated to 94 [CRITICAL].',
        'critical'
      );
    } catch (err) {
      showToast('Simulation Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // STEP 4 Simulation: Resource Shortage
  const handleSimulateShortage = async () => {
    setLoading(true);
    try {
      await triggerResourceShortageSimulation();
      setIsShortageActive(true);
      await loadData('CIV-104');
      showToast(
        'Resource Shortage Detected',
        'Electrical Response Team detained off-grid. Emergency Response Vehicle auto-rerouted for safety containment!',
        'warning'
      );
    } catch (err) {
      showToast('Simulation Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset Demo Simulation
  const handleResetSimulation = async () => {
    setLoading(true);
    try {
      await resetSimulationState();
      setIsSevereActive(false);
      setIsShortageActive(false);
      await loadData('CIV-104');
      showToast(
        'Baseline Restored',
        'Scenario reset to default conditions: 20 citizen reports clustered across 6 incidents.',
        'success'
      );
    } catch (err) {
      showToast('Reset Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Recalculate Priorities
  const handleRecalculate = async () => {
    try {
      await recalculatePriorities();
      await loadData(selectedIncidentId);
      showToast('Metrics Updated', 'Explainable severities & resource ranks recalculated.', 'info');
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Report CRUD (Authority)
  const handleUpdateReport = async (reportId, updateData) => {
    try {
      const res = await updateReport(reportId, updateData);
      await loadData(selectedIncidentId);
      showToast('Report Updated', `Report ${reportId} modified. Cluster metrics dynamically refreshed.`, 'success');
      return res;
    } catch (err) {
      showToast('Update Failed', err.message, 'error');
      throw err;
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      const res = await deleteReport(reportId);
      await loadData(selectedIncidentId);
      showToast('Report Removed', `Report ${reportId} unlinked from incident clusters.`, 'info');
      return res;
    } catch (err) {
      showToast('Deletion Failed', err.message, 'error');
      throw err;
    }
  };

  const myComplaintsCount = reports.filter(r => myReportIds.includes(r.report_id || r.id)).length;

  return (
    <div className="website-app-root" id="civicpulse-website">
      {/* Main Unified Website Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        myComplaintsCount={myComplaintsCount}
        unreadChatCount={unreadChatCount}
        currentUser={currentUser}
        onChangeUserRole={(user) => {
          setCurrentUser(user);
          showToast('Persona Switched', `Active view updated to ${user.name} (${user.role.toUpperCase()}).`, 'info');
        }}
      />

      {/* Multi-Page View Switcher */}
      <div className="website-page-content" id="website-page-content">
        {currentPage === 'home' && (
          <HomePage
            incidents={incidents}
            reports={reports}
            resources={resources}
            onNavigate={navigateTo}
            onOpenDetails={handleOpenCitizenDetails}
          />
        )}

        {currentPage === 'explore' && (
          <ExplorePage
            incidents={incidents}
            reports={reports}
            resources={resources}
            selectedIncidentId={selectedIncidentId}
            panToCoordinates={panToCoordinates}
            onSelectIncident={handleSelectIncident}
            onOpenCitizenChat={handleOpenCitizenChat}
            onOpenCitizenDetails={handleOpenCitizenDetails}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
            myReportIds={myReportIds}
            onCenterMap={handleCenterMap}
          />
        )}

        {currentPage === 'report' && (
          <ReportProblemPage
            onSubmitReport={handleSubmitReport}
            onNavigate={navigateTo}
            onTrackInMyComplaints={(id) => navigateTo('my-complaints')}
            onViewOnMap={(lat, lng) => handleCenterMap(lat, lng)}
          />
        )}

        {currentPage === 'my-complaints' && (
          <MyComplaintsPage
            reports={reports}
            myReportIds={myReportIds}
            onNavigate={navigateTo}
            onOpenDetails={handleOpenCitizenDetails}
            onOpenChat={handleOpenCitizenChat}
            onViewOnMap={(lat, lng) => handleCenterMap(lat, lng)}
          />
        )}

        {currentPage === 'chat' && (
          <ChatPage
            reports={reports}
            myReportIds={myReportIds}
            initialReport={citizenChatReport}
            currentUser={currentUser}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'about' && (
          <AboutPage onNavigate={navigateTo} />
        )}

        {currentPage === 'authority' && (
          <AuthorityDashboardPage
            incidents={incidents}
            reports={reports}
            resources={resources}
            analytics={analytics}
            selectedIncidentId={selectedIncidentId}
            selectedIncidentDetail={selectedIncidentDetail}
            panToCoordinates={panToCoordinates}
            onSelectIncident={handleSelectIncident}
            onOpenCitizenChat={handleOpenCitizenChat}
            onOpenAuthorityChat={() => setIsAuthorityChatOpen(true)}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
            onOpenFleetModal={() => setIsFleetModalOpen(true)}
            onOpenEvidenceModal={(rep) => setEvidenceModalReport(rep)}
            onInjectSevere={handleInjectSevere}
            onSimulateShortage={handleSimulateShortage}
            onResetSimulation={handleResetSimulation}
            onRecalculate={handleRecalculate}
            onUpdateReport={handleUpdateReport}
            onDeleteReport={handleDeleteReport}
            onCenterMap={handleCenterMap}
            isSevereActive={isSevereActive}
            isShortageActive={isShortageActive}
            loading={loading}
            unreadChatCount={unreadChatCount}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'admin' && (
          <AdminDashboardPage
            incidents={incidents}
            reports={reports}
            resources={resources}
            onNavigate={navigateTo}
            onResetSimulation={handleResetSimulation}
            onRecalculate={handleRecalculate}
          />
        )}
      </div>

      {/* Global Modals */}
      <SubmitReportModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmitReport={handleSubmitReport}
        onTrackInMyComplaints={(id) => navigateTo('my-complaints')}
        onViewOnMap={(lat, lng) => handleCenterMap(lat, lng)}
      />

      <CitizenComplaintModal
        isOpen={isCitizenComplaintOpen}
        onClose={() => {
          setIsCitizenComplaintOpen(false);
          setCitizenDetailComplaint(null);
        }}
        complaint={citizenDetailComplaint}
        onOpenChat={handleOpenCitizenChat}
      />

      <CitizenChatModal
        isOpen={isCitizenChatOpen}
        onClose={() => {
          setIsCitizenChatOpen(false);
          setCitizenChatReport(null);
        }}
        report={citizenChatReport}
      />

      <FleetAnalyticsModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        resources={resources}
        analytics={analytics}
        incidents={incidents}
        onToggleResource={toggleResourceAvailability}
      />

      <EvidenceModal
        isOpen={!!evidenceModalReport}
        onClose={() => setEvidenceModalReport(null)}
        report={evidenceModalReport}
      />

      <AuthorityChatModal
        isOpen={isAuthorityChatOpen}
        onClose={() => {
          setIsAuthorityChatOpen(false);
          fetchChatUnreadCount('authority', 'authority-current')
            .then(res => {
              if (res && typeof res.unread_count === 'number') {
                setUnreadChatCount(res.unread_count);
              }
            })
            .catch(() => {});
        }}
        onInspectComplaint={(reportId) => {
          setIsAuthorityChatOpen(false);
          navigateTo('authority');
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div 
          className={`toast-notification ${toast.type === 'critical' ? 'error' : ''}`}
          id="toast-notification"
        >
          {toast.type === 'critical' && <Flame size={20} color="#ef4444" />}
          {toast.type === 'warning' && <AlertTriangle size={20} color="#f59e0b" />}
          {toast.type === 'success' && <CheckCircle2 size={20} color="#10b981" />}
          {toast.type === 'info' && <AlertCircle size={20} color="#38bdf8" />}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              {toast.title}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.35, marginTop: '2px' }}>
              {toast.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

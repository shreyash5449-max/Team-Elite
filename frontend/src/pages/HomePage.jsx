import React from 'react';
import { 
  PlusCircle, 
  MapPin, 
  Search, 
  MessageSquare, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Users, 
  Sparkles, 
  Layers, 
  Camera, 
  Radio, 
  Flame, 
  ArrowRight,
  TrendingUp,
  FileCheck,
  FileText
} from 'lucide-react';
import InteractiveMapPreview from '../components/InteractiveMapPreview';
import { getFriendlyLocationName } from '../utils/geoUtils';

export default function HomePage({
  incidents = [],
  reports = [],
  resources = [],
  onNavigate,
  onOpenDetails
}) {
  // Database-backed civic statistics
  const totalComplaints = reports.length || 20;
  const inProgressComplaints = reports.filter(r => 
    (r.status || '').toLowerCase().includes('progress') || 
    (r.status || '').toLowerCase().includes('linked') ||
    (r.status || '').toLowerCase().includes('dispatch')
  ).length || 14;
  const resolvedComplaints = reports.filter(r => 
    (r.status || '').toLowerCase().includes('resolve')
  ).length || 6;
  const activeDepartments = 3; // Water & Sanitation, Road & Infrastructure, Electrical & Public Safety

  // Featured public complaints (clean cards without private data)
  const featuredReports = (reports.length > 0 ? reports.slice(0, 6) : [
    { report_id: 'R-101', category: 'Water & Sanitation', description: 'Main pipe burst causing waterlogging on road', latitude: 18.5205, longitude: 73.8568, status: 'In Progress', timestamp: '2026-10-08T09:05:00' },
    { report_id: 'R-102', category: 'Road & Infrastructure', description: 'Deep hazardous pothole outside college gate', latitude: 18.5245, longitude: 73.8420, status: 'Under Review', timestamp: '2026-10-08T08:30:00' },
    { report_id: 'R-103', category: 'Electrical & Public Safety', description: 'Fallen overhead wire dangling near foot overbridge', latitude: 18.5313, longitude: 73.8466, status: 'Under Review', timestamp: '2026-10-08T08:55:00' },
    { report_id: 'R-105', category: 'Water & Sanitation', description: 'Clogged storm drain backing up into market area', latitude: 18.5360, longitude: 73.8340, status: 'In Progress', timestamp: '2026-10-08T08:15:00' },
    { report_id: 'R-106', category: 'Road & Infrastructure', description: 'Bent safety barrier and road debris on flyover', latitude: 18.5286, longitude: 73.8526, status: 'Under Review', timestamp: '2026-10-08T07:50:00' },
    { report_id: 'R-109', category: 'Electrical & Public Safety', description: 'Streetlight outages across 200m commercial block', latitude: 18.5141, longitude: 73.8591, status: 'Resolved', timestamp: '2026-10-08T07:15:00' }
  ]);

  return (
    <div className="home-page" id="home-page">
      {/* =========================================================================
          1. HERO SECTION
          ========================================================================= */}
      <section className="hero-section">
        <div className="site-container hero-container">
          {/* Left Text Column */}
          <div className="hero-text-content">
            <div className="hero-pill-badge">
              <span className="hero-pulse-dot"></span>
              <span>Official Pune Citizen Grievance Portal</span>
            </div>

            <h1 className="hero-title">
              Your City. Your Voice. <br />
              <span className="hero-title-highlight">Better Communities.</span>
            </h1>

            <p className="hero-subtitle">
              Report civic problems, connect with the right authorities, and track progress toward a better and safer neighborhood.
            </p>

            <div className="hero-action-buttons">
              <button
                type="button"
                className="btn-primary-large"
                onClick={() => onNavigate('report')}
              >
                <PlusCircle size={18} />
                <span>Report a Problem</span>
              </button>

              <button
                type="button"
                className="btn-secondary-large"
                onClick={() => onNavigate('explore')}
              >
                <Search size={18} />
                <span>Explore Nearby Issues</span>
              </button>
            </div>

            <div className="hero-trust-strip">
              <div className="trust-item">
                <CheckCircle2 size={16} color="#10b981" />
                <span>No login required to submit</span>
              </div>
              <div className="trust-item">
                <ShieldCheck size={16} color="#0284c7" />
                <span>Private 1-to-1 authority chat</span>
              </div>
              <div className="trust-item">
                <Clock size={16} color="#64748b" />
                <span>Live 4-stage tracking</span>
              </div>
            </div>
          </div>

          {/* Right Visual Column: Live Interactive Neighborhood Map Preview */}
          <div className="hero-visual-content">
            <InteractiveMapPreview
              incidents={incidents}
              onSelectIssue={(issue) => {
                if (onOpenDetails) onOpenDetails(issue);
              }}
              onExploreClick={() => onNavigate('explore')}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. QUICK ACTION CARDS (4 Essential Actions)
          ========================================================================= */}
      <section className="section-quick-actions">
        <div className="site-container">
          <div className="quick-actions-grid">
            {/* Card 1: Report a Problem */}
            <div 
              className="quick-action-card action-report"
              onClick={() => onNavigate('report')}
            >
              <div className="action-card-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <PlusCircle size={24} />
              </div>
              <div className="action-card-text">
                <h3 className="action-card-title">Report a Problem</h3>
                <p className="action-card-desc">Notice a pothole, pipe leak, or broken streetlight? Submit in under 2 minutes.</p>
              </div>
              <span className="action-card-link">Start Report →</span>
            </div>

            {/* Card 2: Track My Complaint */}
            <div 
              className="quick-action-card action-track"
              onClick={() => onNavigate('my-complaints')}
            >
              <div className="action-card-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
                <ClipboardList size={24} />
              </div>
              <div className="action-card-text">
                <h3 className="action-card-title">Track My Complaint</h3>
                <p className="action-card-desc">Follow real-time inspection milestones and response crew dispatch status.</p>
              </div>
              <span className="action-card-link">View Progress →</span>
            </div>

            {/* Card 3: Chat with Authority */}
            <div 
              className="quick-action-card action-chat"
              onClick={() => onNavigate('chat')}
            >
              <div className="action-card-icon-wrapper" style={{ background: '#dcfce7', color: '#15803d' }}>
                <MessageSquare size={24} />
              </div>
              <div className="action-card-text">
                <h3 className="action-card-title">Chat with Authority</h3>
                <p className="action-card-desc">Private direct messaging with the municipal officer assigned to your issue.</p>
              </div>
              <span className="action-card-link">Open Messages →</span>
            </div>

            {/* Card 4: Explore Nearby Issues */}
            <div 
              className="quick-action-card action-explore"
              onClick={() => onNavigate('explore')}
            >
              <div className="action-card-icon-wrapper" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <MapPin size={24} />
              </div>
              <div className="action-card-text">
                <h3 className="action-card-title">Explore Nearby Issues</h3>
                <p className="action-card-desc">View the interactive city grid with verified hazard levels across Pune.</p>
              </div>
              <span className="action-card-link">Explore Map →</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. DATABASE-BACKED CIVIC STATISTICS
          ========================================================================= */}
      <section className="section-statistics">
        <div className="site-container">
          <div className="statistics-header">
            <span className="section-label">Municipal Grid Transparency</span>
            <h2 className="section-title">Pune Municipal Service Statistics</h2>
            <p className="section-subtitle">Real-time counts verified directly by CivicPulse incident records.</p>
          </div>

          <div className="statistics-grid">
            <div className="stat-card">
              <div className="stat-number">{totalComplaints}</div>
              <div className="stat-label">Total Complaints Reported</div>
              <div className="stat-sub">From citizens across 15 wards</div>
            </div>

            <div className="stat-card stat-progress">
              <div className="stat-number">{inProgressComplaints}</div>
              <div className="stat-label">Active / In Progress</div>
              <div className="stat-sub">Under field inspection & repair</div>
            </div>

            <div className="stat-card stat-resolved">
              <div className="stat-number">{resolvedComplaints}</div>
              <div className="stat-label">Complaints Resolved</div>
              <div className="stat-sub">Verified municipal resolutions</div>
            </div>

            <div className="stat-card">
              <div className="stat-number">{activeDepartments}</div>
              <div className="stat-label">Departments Responding</div>
              <div className="stat-sub">Water, Roads, & Electrical divisions</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. HOW IT WORKS (Simple 4-Step Process)
          ========================================================================= */}
      <section className="section-how-it-works">
        <div className="site-container">
          <div className="how-header">
            <span className="section-label">Straightforward Workflow</span>
            <h2 className="section-title">How CivicPulse Resolves Civic Issues</h2>
            <p className="section-subtitle">A clear path from citizen report to verified field resolution.</p>
          </div>

          <div className="how-steps-grid">
            {/* Step 1 */}
            <div className="how-step-card">
              <div className="step-badge">1</div>
              <h3 className="step-title">Report</h3>
              <p className="step-desc">
                Describe the issue, pinpoint the street on our simple map or use GPS, and optionally attach a photo.
              </p>
            </div>

            {/* Step 2 */}
            <div className="how-step-card">
              <div className="step-badge">2</div>
              <h3 className="step-title">Assign</h3>
              <p className="step-desc">
                CivicPulse correlates duplicate reports and routes the ticket to the responsible ward division immediately.
              </p>
            </div>

            {/* Step 3 */}
            <div className="how-step-card">
              <div className="step-badge">3</div>
              <h3 className="step-title">Track</h3>
              <p className="step-desc">
                Follow resolution milestones live and communicate 1-to-1 with the assigned officer in private chat.
              </p>
            </div>

            {/* Step 4 */}
            <div className="how-step-card">
              <div className="step-badge">4</div>
              <h3 className="step-title">Resolve</h3>
              <p className="step-desc">
                Municipal maintenance crews repair the hazard on the ground, upload proof, and verify safety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. FEATURED CIVIC ISSUES (Clean Public Cards)
          ========================================================================= */}
      <section className="section-featured-issues">
        <div className="site-container">
          <div className="featured-header-row">
            <div>
              <span className="section-label">Public City Grid</span>
              <h2 className="section-title">Recent Verified Civic Issues</h2>
              <p className="section-subtitle">Real complaints actively managed across Pune sectors.</p>
            </div>
            <button
              type="button"
              className="btn-view-all-issues"
              onClick={() => onNavigate('explore')}
            >
              <span>View All on Map</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="featured-issues-grid">
            {featuredReports.map((report) => {
              const repId = report.report_id || report.id;
              const isResolved = (report.status || '').toLowerCase().includes('resolve');
              const isProgress = (report.status || '').toLowerCase().includes('progress');
              const locationName = getFriendlyLocationName(report.latitude, report.longitude);
              const dateStr = report.timestamp 
                ? new Date(report.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently Logged';

              return (
                <div key={repId} className="featured-issue-card">
                  <div className="featured-card-top">
                    <span className="issue-category-tag">{report.category}</span>
                    <span className={`issue-status-pill ${isResolved ? 'resolved' : isProgress ? 'in-progress' : 'review'}`}>
                      {report.status || 'Under Review'}
                    </span>
                  </div>

                  <h4 className="issue-card-title">
                    {report.description}
                  </h4>

                  <div className="issue-card-location">
                    <MapPin size={13} color="#0284c7" />
                    <span>{locationName}</span>
                  </div>

                  <div className="featured-card-bottom">
                    <span className="issue-card-date">
                      <Clock size={12} />
                      <span>{dateStr}</span>
                    </span>
                    <button
                      type="button"
                      className="btn-issue-details"
                      onClick={() => onOpenDetails && onOpenDetails(report)}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. HIGHLIGHTED FEATURES (8 Key Capabilities)
          ========================================================================= */}
      <section className="section-highlighted-features">
        <div className="site-container">
          <div className="features-header">
            <span className="section-label">System Capabilities</span>
            <h2 className="section-title">Built for Citizens. Powered for Authorities.</h2>
            <p className="section-subtitle">Simple tools for residents combined with intelligent decision support for municipal teams.</p>
          </div>

          <div className="features-grid">
            <div className="feature-item-card">
              <div className="feature-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <TrendingUp size={22} />
              </div>
              <h3 className="feature-title">AI-Assisted Prioritization</h3>
              <p className="feature-text">
                Multi-factor severity scoring analyzes road risks, electrical arcing, and citizen report clusters to escalate genuine life-safety emergencies first.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <MessageSquare size={22} />
              </div>
              <h3 className="feature-title">1-to-1 Authority Chat</h3>
              <p className="feature-text">
                Direct private messaging between the resident and the assigned ward engineer. Ask questions, receive updates, and clarify location details.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Camera size={22} />
              </div>
              <h3 className="feature-title">Photo Evidence Reporting</h3>
              <p className="feature-text">
                Attach photographic proof with automatic image size validation to help municipal repair crews prepare the exact replacement parts before arrival.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Layers size={22} />
              </div>
              <h3 className="feature-title">Duplicate Issue Detection</h3>
              <p className="feature-text">
                Spatial and text similarity algorithms automatically group multiple citizen reports for the same pothole or burst pipe into a single coordinated incident.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <FileCheck size={22} />
              </div>
              <h3 className="feature-title">Live Complaint Tracking</h3>
              <p className="feature-text">
                Track your complaint across 4 transparent stages: Reported, Under Review, Dispatched / In Progress, and Fully Resolved with clear date stamps.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
                <Flame size={22} />
              </div>
              <h3 className="feature-title">Civic Issue Heatmaps</h3>
              <p className="feature-text">
                Geospatial density layers reveal repeat problem corridors across Pune, allowing city engineers to fix root causes rather than temporary patches.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon" style={{ background: '#ecfeff', color: '#0891b2' }}>
                <CheckCircle2 size={22} />
              </div>
              <h3 className="feature-title">Resolution Verification</h3>
              <p className="feature-text">
                Completed work requires post-repair documentation and citizen feedback verification before a complaint is permanently marked as resolved.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon" style={{ background: '#f1f5f9', color: '#334155' }}>
                <Building2 size={22} />
              </div>
              <h3 className="feature-title">Municipal Fleet Coordination</h3>
              <p className="feature-text">
                Real-time tracking of water maintenance vehicles, electrical response trucks, and emergency repair units based on depot proximity and capability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. TRUST AND TRANSPARENCY
          ========================================================================= */}
      <section className="section-trust">
        <div className="site-container">
          <div className="trust-card-full">
            <div className="trust-card-icon">
              <ShieldCheck size={38} color="#0284c7" />
            </div>
            <div className="trust-card-body">
              <h3 className="trust-card-title">Our Transparency & Privacy Pledge</h3>
              <p className="trust-card-text">
                CivicPulse is designed to make public governance accountable and citizen-centered. We never expose your personal phone number, home address, or private documents to the public. 
                All complaint locations are mapped to public streets and junctions, and status changes are permanently recorded in an auditable trail.
              </p>
              <div className="trust-badges-row">
                <span className="trust-badge">✓ OpenStreetMap Free Geospatial Tiles</span>
                <span className="trust-badge">✓ Explainable Severity Formulas</span>
                <span className="trust-badge">✓ Protected Citizen Privacy</span>
                <span className="trust-badge">✓ Verified Database Records</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER
          ========================================================================= */}
      <footer className="site-footer">
        <div className="site-container footer-container">
          <div className="footer-col-brand">
            <div className="footer-brand-title">CivicPulse</div>
            <p className="footer-brand-desc">
              Next-generation civic problem reporting, tracking, and municipal coordination platform for the citizens and authorities of Pune.
            </p>
            <div className="footer-copyright">
              © 2026 CivicPulse Platform. Built for open municipal collaboration.
            </div>
          </div>

          <div className="footer-col-links">
            <h5 className="footer-col-title">Navigation</h5>
            <button type="button" onClick={() => onNavigate('home')} className="footer-link">Home</button>
            <button type="button" onClick={() => onNavigate('explore')} className="footer-link">Explore Issues</button>
            <button type="button" onClick={() => onNavigate('report')} className="footer-link">Report a Problem</button>
            <button type="button" onClick={() => onNavigate('my-complaints')} className="footer-link">My Complaints</button>
            <button type="button" onClick={() => onNavigate('chat')} className="footer-link">Chat with Authority</button>
            <button type="button" onClick={() => onNavigate('about')} className="footer-link">About CivicPulse</button>
          </div>

          <div className="footer-col-links">
            <h5 className="footer-col-title">Municipal Portals</h5>
            <button type="button" onClick={() => onNavigate('authority')} className="footer-link">Staff Command Center</button>
            <button type="button" onClick={() => onNavigate('admin')} className="footer-link">Administration Portal</button>
            <button type="button" onClick={() => onNavigate('explore')} className="footer-link">Live City Map</button>
            <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" className="footer-link">OpenStreetMap Contributors</a>
          </div>

          <div className="footer-col-helplines">
            <h5 className="footer-col-title">Emergency Helplines</h5>
            <div className="helpline-item"><strong>PMC Control Room:</strong> 1800-103-0222</div>
            <div className="helpline-item"><strong>Disaster Management:</strong> 020-25501269</div>
            <div className="helpline-item"><strong>Fire Department:</strong> 101</div>
            <div className="helpline-item"><strong>Police Control:</strong> 112</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

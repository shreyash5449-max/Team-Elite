import React from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Activity, 
  CheckCircle2, 
  Layers, 
  Radio, 
  Lock, 
  Users, 
  MapPin, 
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

export default function AboutPage({ onNavigate }) {
  return (
    <div className="about-page site-container" id="about-page">
      {/* Header */}
      <div className="about-hero-section">
        <span className="section-label">Municipal Governance Innovation</span>
        <h1 className="about-title">About CivicPulse</h1>
        <p className="about-subtitle">
          CivicPulse is an intelligent, multi-source civic incident coordination platform built to bridge the gap between citizens and municipal authorities in Pune.
        </p>
      </div>

      {/* Mission & Vision Grid */}
      <div className="about-mission-grid">
        <div className="about-mission-card">
          <div className="mission-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Activity size={24} />
          </div>
          <h3>Our Citizen Mission</h3>
          <p>
            To empower everyday residents with a simple, transparent, and responsive platform to report street hazards, track real-time resolution progress, and communicate directly with assigned municipal authorities.
          </p>
        </div>

        <div className="about-mission-card">
          <div className="mission-icon-box" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <Building2 size={24} />
          </div>
          <h3>Our Municipal Mission</h3>
          <p>
            To equip municipal field teams, ward engineers, and emergency crews with explainable AI prioritization, duplicate report clustering, and optimal vehicle dispatch to resolve life-safety hazards faster.
          </p>
        </div>
      </div>

      {/* How the Technology Works */}
      <div className="about-tech-section">
        <h2 className="about-section-heading">How CivicPulse Works Under the Hood</h2>
        <p className="about-section-sub">
          Unlike legacy grievance boxes that bury complaints in queues, CivicPulse applies mathematical intelligence and spatial clustering:
        </p>

        <div className="tech-pillars-grid">
          <div className="tech-pillar-card">
            <div className="pillar-num">01</div>
            <h4>4-Factor Signal Correlation</h4>
            <p>
              When multiple residents submit complaints, our correlation engine measures <strong>spatial distance (40%)</strong>, <strong>time proximity (20%)</strong>, <strong>TF-IDF text similarity (25%)</strong>, and <strong>visual photographic evidence (15%)</strong> to instantly detect whether reports refer to the same street issue.
            </p>
          </div>

          <div className="tech-pillar-card">
            <div className="pillar-num">02</div>
            <h4>Explainable Severity Scoring</h4>
            <p>
              Incidents are ranked using transparent, auditable factors — report volume, escalation velocity, danger radius, photographic verification, and life-safety threats (such as high-voltage arcing or severe flooding) — producing an open 0 to 100 severity index.
            </p>
          </div>

          <div className="tech-pillar-card">
            <div className="pillar-num">03</div>
            <h4>Proximity Fleet Routing</h4>
            <p>
              The system calculates distance and estimated travel time for water tankers, electrical repair vans, and multi-hazard emergency trucks, automatically identifying backup contingency vehicles if a primary squad is detained off-grid.
            </p>
          </div>

          <div className="tech-pillar-card">
            <div className="pillar-num">04</div>
            <h4>Transparent 4-Stage Life-Cycle</h4>
            <p>
              Every ticket moves through four verified statuses: <strong>Reported</strong>, <strong>Under Review</strong>, <strong>In Progress</strong>, and <strong>Resolved</strong> with auditable timestamps and officer accountability.
            </p>
          </div>
        </div>
      </div>

      {/* Coverage across Pune City */}
      <div className="about-coverage-section">
        <h2 className="about-section-heading">Monitored Sectors & Coverage</h2>
        <p className="about-section-sub">
          Active operational coverage across central Pune municipal wards and transit corridors:
        </p>

        <div className="coverage-tags-grid">
          {[
            'Shivaji Nagar Ward Office',
            'FC Road Commercial Corridor',
            'JM Road Heritage Precinct',
            'Deccan Gymkhana Interchange',
            'Swargate Municipal Terminal',
            'Model Colony & Deep Bungalow',
            'Pune Central Railway Sector',
            'Camp & MG Road Cantonment',
            'Aundh Ward Division',
            'Kothrud Central Depot',
            'Sambhaji Riverside Belt',
            'Viman Nagar IT Corridor'
          ].map((tag) => (
            <div key={tag} className="coverage-tag-item">
              <MapPin size={14} color="#0284c7" />
              <span>{tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Privacy Charter */}
      <div className="about-privacy-charter">
        <div className="charter-icon-wrapper">
          <Lock size={36} color="#0284c7" />
        </div>
        <div className="charter-body">
          <h3>The CivicPulse Citizen Privacy Charter</h3>
          <p>
            Your privacy is our core principle. When you submit a complaint on CivicPulse:
          </p>
          <ul className="charter-list">
            <li>Your personal telephone number and email address are never exposed publicly.</li>
            <li>Incident map pins pinpoint public street coordinates only, never private residence interiors.</li>
            <li>Messages exchanged with authorities are protected by role-based authorization.</li>
            <li>All status updates and simulation states are fully transparent and auditable.</li>
          </ul>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="about-cta-bar">
        <div>
          <h3>Ready to make your neighborhood better?</h3>
          <p>Report an issue on the street or explore ongoing repairs in your sector.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-primary-large"
            onClick={() => onNavigate('report')}
          >
            <span>Report a Problem</span>
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            className="btn-secondary-large"
            onClick={() => onNavigate('explore')}
          >
            <span>Explore City Issues</span>
          </button>
        </div>
      </div>
    </div>
  );
}

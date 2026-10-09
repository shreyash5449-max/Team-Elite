import React, { useState } from 'react';
import { 
  Activity, 
  MapPin, 
  PlusCircle, 
  FileText, 
  MessageSquare, 
  Info, 
  Shield, 
  User, 
  Menu, 
  X, 
  Compass, 
  ChevronDown,
  Building2,
  CheckCircle2,
  Layers,
  Settings
} from 'lucide-react';

export default function Navbar({
  currentPage = 'home', // 'home' | 'explore' | 'report' | 'my-complaints' | 'chat' | 'about' | 'authority' | 'admin'
  onNavigate,
  myComplaintsCount = 0,
  unreadChatCount = 0,
  currentUser = { name: 'Dhruva Supali', role: 'citizen' },
  onChangeUserRole
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'explore', label: 'Explore Issues' },
    { id: 'report', label: 'Report a Problem', isPrimary: true },
    { id: 'my-complaints', label: 'My Complaints', badge: myComplaintsCount },
    { id: 'chat', label: 'Chat with Authority', badge: unreadChatCount },
    { id: 'about', label: 'About CivicPulse' }
  ];

  const handleLinkClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="site-header" id="site-header">
      <div className="site-header-container">
        {/* Brand / Logo */}
        <div 
          className="site-brand"
          onClick={() => handleLinkClick('home')}
          style={{ cursor: 'pointer' }}
        >
          <div className="site-logo-badge">
            <Activity size={22} color="#ffffff" />
          </div>
          <div className="site-brand-text">
            <div className="site-brand-title">
              <span>CivicPulse</span>
              <span className="site-city-tag">Pune</span>
            </div>
            <span className="site-brand-tagline">Citizen Grievance & Municipal Coordination</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="site-nav-desktop" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            if (link.isPrimary) {
              return (
                <button
                  key={link.id}
                  type="button"
                  className={`site-nav-btn-primary ${isActive ? 'active' : ''}`}
                  onClick={() => handleLinkClick(link.id)}
                >
                  <PlusCircle size={15} />
                  <span>{link.label}</span>
                </button>
              );
            }

            return (
              <button
                key={link.id}
                type="button"
                className={`site-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleLinkClick(link.id)}
              >
                <span>{link.label}</span>
                {link.badge > 0 && (
                  <span className="site-nav-badge">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: User Profile & Portals Switcher */}
        <div className="site-header-actions">
          {/* Authority / Admin Quick Jump */}
          <div className="site-portal-buttons">
            <button
              type="button"
              className={`portal-shortcut-btn ${currentPage === 'authority' ? 'active' : ''}`}
              onClick={() => handleLinkClick('authority')}
              title="Open Municipal Staff Command Center"
            >
              <Shield size={14} color="#0284c7" />
              <span>Staff Portal</span>
            </button>

            <button
              type="button"
              className={`portal-shortcut-btn ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => handleLinkClick('admin')}
              title="Open Central Administration Dashboard"
            >
              <Settings size={14} color="#64748b" />
              <span>Admin</span>
            </button>
          </div>

          {/* User Profile Selector Pill */}
          <div className="site-user-dropdown-wrapper">
            <button
              type="button"
              className="site-user-pill"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              title="Active User Profile (Click to switch demo persona)"
            >
              <div className="site-user-avatar">
                {currentUser.role === 'authority' ? '👮' : currentUser.role === 'admin' ? '🏛️' : '👤'}
              </div>
              <div className="site-user-info">
                <span className="site-user-name">{currentUser.name}</span>
                <span className="site-user-role">
                  {currentUser.role === 'authority' ? 'Municipal Officer' : currentUser.role === 'admin' ? 'City Admin' : 'Citizen'}
                </span>
              </div>
              <ChevronDown size={14} color="#64748b" style={{ transform: profileDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {profileDropdownOpen && (
              <div className="site-user-dropdown-menu">
                <div className="dropdown-header">
                  <span>Switch Demonstration Persona</span>
                </div>

                <div 
                  className={`dropdown-item ${currentUser.role === 'citizen' ? 'selected' : ''}`}
                  onClick={() => {
                    onChangeUserRole({ name: 'Dhruva Supali', role: 'citizen' });
                    setProfileDropdownOpen(false);
                    if (currentPage === 'authority' || currentPage === 'admin') onNavigate('home');
                  }}
                >
                  <span className="persona-icon">👤</span>
                  <div>
                    <strong>Dhruva Supali</strong>
                    <div className="persona-sub">Resident, Shivaji Nagar Ward</div>
                  </div>
                  {currentUser.role === 'citizen' && <CheckCircle2 size={16} color="#10b981" />}
                </div>

                <div 
                  className={`dropdown-item ${currentUser.role === 'authority' ? 'selected' : ''}`}
                  onClick={() => {
                    onChangeUserRole({ name: 'Officer Rajesh Deshmukh', role: 'authority' });
                    setProfileDropdownOpen(false);
                    onNavigate('authority');
                  }}
                >
                  <span className="persona-icon">👮</span>
                  <div>
                    <strong>Officer Rajesh Deshmukh</strong>
                    <div className="persona-sub">Senior Field Engineer, Ward 7</div>
                  </div>
                  {currentUser.role === 'authority' && <CheckCircle2 size={16} color="#10b981" />}
                </div>

                <div 
                  className={`dropdown-item ${currentUser.role === 'admin' ? 'selected' : ''}`}
                  onClick={() => {
                    onChangeUserRole({ name: 'S. Patil, IAS', role: 'admin' });
                    setProfileDropdownOpen(false);
                    onNavigate('admin');
                  }}
                >
                  <span className="persona-icon">🏛️</span>
                  <div>
                    <strong>S. Patil, IAS</strong>
                    <div className="persona-sub">Additional Municipal Commissioner</div>
                  </div>
                  {currentUser.role === 'admin' && <CheckCircle2 size={16} color="#10b981" />}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="site-nav-mobile">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              className={`site-mobile-link ${currentPage === link.id ? 'active' : ''}`}
              onClick={() => handleLinkClick(link.id)}
            >
              <span>{link.label}</span>
              {link.badge > 0 && (
                <span className="site-nav-badge">{link.badge}</span>
              )}
            </button>
          ))}
          <div className="mobile-divider" />
          <button
            type="button"
            className="site-mobile-link"
            onClick={() => handleLinkClick('authority')}
          >
            <Shield size={16} color="#0284c7" />
            <span>Staff Portal (Command Center)</span>
          </button>
          <button
            type="button"
            className="site-mobile-link"
            onClick={() => handleLinkClick('admin')}
          >
            <Settings size={16} color="#64748b" />
            <span>Admin Dashboard</span>
          </button>
        </div>
      )}
    </header>
  );
}

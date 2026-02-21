import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { role, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className="nav-wrapper">
            {/* --- Tier 1: Professional Utility --- */}
            <div className="nav-tier-utility">
                <div className="elite-container utility-content">
                    <div className="utility-left">
                        <div className="utility-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--elite-saffron)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                            Helpline: <span className="elite-saffron-text" style={{ fontWeight: '800' }}>1902</span>
                        </div>
                        <div className="utility-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--elite-saffron-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                            support@samadhana.gov.in
                        </div>
                    </div>
                    <div className="utility-right">
                        <div className="utility-item">Accessibility Options</div>
                        <div className="utility-item">
                            <select style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 'inherit', cursor: 'pointer', outline: 'none' }}>
                                <option style={{ color: 'black' }}>English</option>
                                <option style={{ color: 'black' }}>ಕನ್ನಡ</option>
                                <option style={{ color: 'black' }}>हिंदी</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Tier 2: Main Navigation --- */}
            <nav className="nav-tier-main">
                <div className="elite-container nav-main-flex">
                    <div className="elite-brand">
                        <div className="brand-symbol" style={{ background: 'var(--elite-navy-deep)', border: 'none' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--elite-saffron-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21h18" />
                                <path d="M3 7h18" />
                                <path d="M5 21V7" />
                                <path d="M19 21V7" />
                                <path d="M9 21V7" />
                                <path d="M15 21V7" />
                                <path d="M3 7l9-4 9 4" />
                            </svg>
                        </div>
                        <div className="brand-text-stack">
                            <span className="brand-name" style={{ color: 'var(--elite-navy-deep)' }}>SAMADHANA AI</span>
                            <span className="brand-tagline" style={{ color: 'var(--elite-saffron-light)', fontWeight: '700' }}>National Grievance Infrastructure</span>
                        </div>
                    </div>

                    <div className="elite-nav-links">
                        <NavLink to="/dashboard" className={({ isActive }) => `elite-nav-link ${isActive ? 'active' : ''}`}>
                            DASHBOARD
                        </NavLink>
                        <NavLink to="/services" className={({ isActive }) => `elite-nav-link ${isActive ? 'active' : ''}`}>
                            SERVICES
                        </NavLink>
                        <NavLink to="/grievance/new" className={({ isActive }) => `elite-nav-link ${isActive ? 'active' : ''}`}>
                            GRIEVANCE
                        </NavLink>
                        {role === 'admin' && (
                            <button className="btn-elite btn-elite-outline" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => navigate('/admin')}>
                                ADMIN PANEL
                            </button>
                        )}
                        <button className="btn-elite btn-elite-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={handleLogout}>
                            LOGOUT
                        </button>
                    </div>

                    <div className="elite-nav-actions">
                        {/* Actions area intentionally left for future controls */}
                    </div>
                </div>
            </nav>
        </div>
    );
}

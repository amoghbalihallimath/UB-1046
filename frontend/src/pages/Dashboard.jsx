import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

export default function Dashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setLoading(false);
    }, [user]);

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Citizen';

    return (
        <div className="elite-dashboard">
            {/* --- Phase 2: Split Hero Section --- */}
            <header className="hero-split">
                <div className="elite-container hero-content-side">
                    <div className="hero-badge-elite" style={{ color: 'var(--elite-navy-deep)', border: 'none', padding: '0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--elite-saffron)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18" />
                            <path d="M3 7h18" />
                            <path d="M5 21V7" />
                            <path d="M19 21V7" />
                            <path d="M9 21V7" />
                            <path d="M15 21V7" />
                            <path d="M3 7l9-4 9 4" />
                        </svg>
                        Digital Infrastructure for every citizen
                    </div>
                    <h1 className="hero-headline-elite">
                        Government <br /><span>Services</span> Making <br />Life Easier.
                    </h1>
                    <p className="hero-subtext-elite">
                        Welcome, <strong>{displayName}</strong>. Your bridge to transparent governance, efficient service delivery, and real-time grievance redressal.
                    </p>
                    <div className="elite-nav-actions">
                        <Link to="/grievance/new" className="btn-elite btn-elite-primary" style={{ padding: '10px 24px' }}>
                            START NOW
                        </Link>
                        <button className="btn-elite btn-elite-outline" style={{ padding: '10px 24px' }}>
                            VIEW GUIDELINES
                        </button>
                    </div>
                </div>
                <div className="hero-visual-side">
                    {/* Visual Asset Background via CSS */}
                </div>
            </header>

            {/* --- Phase 2: Game Changer Feature Cards --- */}
            <div className="game-changer-section">
                <div className="elite-container">
                    <div className="feature-grid-elite">
                        <Link to="/services" className="feature-card-elite">
                            <div className="feature-icon-elite">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--elite-navy-deep)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" width="18" height="18" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                            </div>
                            <h3 className="feature-title-elite">Official Services</h3>
                            <p className="feature-desc-elite">
                                Access a unified catalog of 200+ government services including Aadhaar, Passport, and Digital Certificates.
                            </p>
                            <div className="card-action-trigger">EXPLORE CATALOG →</div>
                        </Link>

                        <Link to="/grievance/new" className="feature-card-elite highlight-card">
                            <div className="feature-icon-elite">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--elite-saffron)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10v6M9 22v-4a3 3 0 1 1 6 0v4M4 10a8 8 0 0 1 16 0" /><path d="M12 10v6M7 10v3M17 10v3" /></svg>
                            </div>
                            <h3 className="feature-title-elite">Raise Grievance</h3>
                            <p className="feature-desc-elite">
                                Your voice matters. Use our AI-enhanced portal to file grievances directly with the relevant departments.
                            </p>
                            <div className="card-action-trigger" style={{ color: 'var(--elite-saffron)' }}>SUBMIT REQUEST →</div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* --- Phase 3: Short & Smart Final Polish --- */}
            <section className="elite-container" style={{ marginTop: '80px', marginBottom: '80px' }}>
                <div className="gov-card" style={{ display: 'flex', gap: '40px', alignItems: 'center', padding: '40px' }}>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Making <span>Governance</span> Inclusive.</h2>
                        <p style={{ color: 'var(--elite-text-muted)', fontSize: '1.1rem' }}>
                            Samadhana AI is part of the national mission to ensure no citizen is left behind. Our platform supports voice-based inputs in 12+ regional languages.
                        </p>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <button className="btn-elite btn-elite-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
                            LEARN ABOUT OUR MISSION
                        </button>
                    </div>
                </div>
            </section>

            {/* --- Elite Minimalist Footer --- */}
            <footer className="elite-footer">
                <div className="elite-container">
                    <div className="footer-main-grid">
                        <div className="footer-brand-side">
                            <h4 className="brand-name">SAMADHANA AI</h4>
                            <p>An official initiative for digital empowerment and grievance redressal under the National e-Governance Plan.</p>
                        </div>
                        <div className="footer-nav-col">
                            <h5>Quick Links</h5>
                            <ul className="footer-links-list">
                                <li>Official Services</li>
                                <li>Grievance Guidelines</li>
                                <li>News & Notifications</li>
                            </ul>
                        </div>
                        <div className="footer-nav-col">
                            <h5>Governance</h5>
                            <ul className="footer-links-list">
                                <li>Privacy Policy</li>
                                <li>Terms of Service</li>
                                <li>Security Audit</li>
                            </ul>
                        </div>
                        <div className="footer-nav-col">
                            <h5>Support</h5>
                            <ul className="footer-links-list">
                                <li>Helpline: <strong>1902</strong></li>
                                <li>Email: <strong>gov-support@samadhana.in</strong></li>
                                <li>Nearest Seva Kendra</li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom-strip">
                        <span>© 2026 National e-Governance Project. All rights reserved.</span>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <span>Language: English (US)</span>
                            <span>Region: India</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

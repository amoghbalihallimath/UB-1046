import React, { useState } from 'react';
import '../styles/OfficialServices.css';

const SERVICES = [
    {
        id: 'aadhaar',
        name: 'Aadhaar Services',
        description: 'Update address, download e-Aadhaar, biometric lock, and official UIDAI verification services.',
        icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h10M7 16h6" /></svg>,
        category: 'Identity',
        url: 'https://uidai.gov.in',
        color: '#1e3a8a'
    },
    {
        id: 'voter',
        name: 'Voter Portal',
        description: 'Voter registration, EPIC card download, electoral roll search, and polling booth station details.',
        icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10H7z" /><path d="M12 7V3" /><path d="M7 3h10" /><path d="m3 7 4 4" /><path d="m21 7-4 4" /></svg>,
        category: 'Democracy',
        url: 'https://voterportal.eci.gov.in',
        color: '#065f46'
    },
    {
        id: 'passport',
        name: 'Passport Seva',
        description: 'Apply for fresh passport, renewal, police clearance certificate (PCC), and real-time appointment tracking.',
        icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M8 7h6" /></svg>,
        category: 'Travel',
        url: 'https://passportindia.gov.in',
        color: '#1e40af'
    },
    {
        id: 'parivahan',
        name: 'Parivahan Seva',
        description: 'Citizen DL services, vehicle registration (RC), e-challan payment, and transport-related NOCs.',
        icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>,
        category: 'Transport',
        url: 'https://parivahan.gov.in',
        color: '#365314'
    },
    {
        id: 'bescom',
        name: 'BESCOM Services',
        description: 'Unified electricity portal for bill payment, new connection, and grievance reporting.',
        icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
        category: 'Utilities',
        url: 'https://www.bescom.org',
        color: '#c2410c'
    },
    {
        id: 'bwssb',
        name: 'Water Supply (BWSSB)',
        description: 'Official water supply management, bill desk, and local sewerage board complaints.',
        icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>,
        category: 'Utilities',
        url: 'https://bwssb.gov.in',
        color: '#0891b2'
    },
    {
        id: 'digilocker',
        name: 'DigiLocker Node',
        description: 'Secure digital document wallet for cloud-based storage of government-issued paperless certificates.',
        icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
        category: 'Digital',
        url: 'https://digilocker.gov.in',
        color: '#5b21b6'
    },
    {
        id: 'umang',
        name: 'UMANG Infrastructure',
        description: 'Unified Mobile Application for New-age Governance. Access 1200+ centralized government services.',
        icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><circle cx="12" cy="11" r="3" /></svg>,
        category: 'National',
        url: 'https://web.umang.gov.in',
        color: '#9d174d'
    }
];

const CATEGORIES = ['All', ...new Set(SERVICES.map(s => s.category))];

export default function OfficialServices() {
    const [filter, setFilter] = useState('All');

    const filtered = filter === 'All' ? SERVICES : SERVICES.filter(s => s.category === filter);

    const handleOpen = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="services-page">
            <div className="elite-container">
                {/* --- Elite Header --- */}
                <header className="services-header-elite">
                    <h1 className="services-title-elite">Official Service Gateway</h1>
                    <p className="services-subtitle-elite">Unified access point for verified national and state-level government infrastructures.</p>
                </header>

                {/* --- Security Trust Bar --- */}
                <div className="trust-bar-elite" style={{ background: 'var(--elite-navy-deep)', color: 'white' }}>
                    <span className="trust-icon-elite" style={{ color: 'var(--elite-saffron-light)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </span>
                    <div className="trust-text-elite">
                        <strong>Security Protocol Active:</strong> JanSeva Samadhana provides encrypted redirects strictly to verified <strong>.gov.in</strong> domains.
                        Official citizen identity protection is our highest priority.
                    </div>
                </div>

                {/* --- Professional Filter System --- */}
                <div className="filter-bar-elite">
                    {CATEGORIES.map(cat => (
                        <button key={cat} className={`filter-chip-elite ${filter === cat ? 'active' : ''}`}
                            onClick={() => setFilter(cat)}>
                            {cat.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* --- Elite Service Grid --- */}
                <div className="services-grid-elite">
                    {filtered.map(service => (
                        <div key={service.id} className="service-card-elite" style={{ '--service-theme': service.color }}>
                            <div className="card-header-elite">
                                <div className="icon-box-elite">
                                    <service.icon width="24" height="24" />
                                </div>
                                <span className="tag-elite">{service.category}</span>
                            </div>

                            <h3 className="service-name-elite">{service.name}</h3>
                            <p className="service-desc-elite">{service.description}</p>

                            <div className="card-footer-elite">
                                <span className="url-hint-elite">{new URL(service.url).hostname}</span>
                                <button className="btn-elite btn-elite-primary" style={{ padding: '8px 20px', fontSize: '0.75rem' }}
                                    onClick={() => handleOpen(service.url)}>
                                    VISIT PORTAL
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- Bottom Mission Notice --- */}
                <div className="sidebar-card-elite" style={{ marginTop: '80px', textAlign: 'center', borderStyle: 'dashed' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--elite-text-muted)' }}>
                        Looking for a service not listed here? Our AI nodes are constantly mapping new government APIs.
                        Reporting of unofficial service clones helps protect the community.
                    </p>
                </div>
            </div>
        </div>
    );
}

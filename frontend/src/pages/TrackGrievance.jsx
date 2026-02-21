import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import '../styles/TrackGrievance.css';

// Status badge component
function StatusBadge({ status }) {
    const map = {
        'Pending': { cls: 'badge-pending', icon: '⏳' },
        'Processing': { cls: 'badge-processing', icon: '⚙️' },
        'Resolved': { cls: 'badge-resolved', icon: '✅' },
        'Rejected': { cls: 'badge-rejected', icon: '❌' },
    };
    const { cls, icon } = map[status] || { cls: 'badge-pending', icon: '⏳' };
    return (
        <span className={`track-badge ${cls}`}>
            {icon} {status}
        </span>
    );
}

// Progress stepper
function ProgressTracker({ status }) {
    const steps = ['Submitted', 'Under Review', 'Processing', 'Resolved'];
    const activeIdx = status === 'Pending' ? 1 : status === 'Processing' ? 2 : status === 'Resolved' ? 3 : 0;
    return (
        <div className="progress-tracker">
            {steps.map((step, i) => (
                <div key={step} className={`progress-step ${i <= activeIdx ? 'done' : ''} ${i === activeIdx ? 'active' : ''}`}>
                    <div className="progress-circle">{i < activeIdx ? '✓' : i + 1}</div>
                    {i < steps.length - 1 && <div className={`progress-line ${i < activeIdx ? 'done' : ''}`} />}
                    <span className="progress-label">{step}</span>
                </div>
            ))}
        </div>
    );
}

export default function TrackGrievance() {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        if (!user) return;

        // Real-time listener for this user's complaints
        const q = query(
            collection(db, 'complaints'),
            where('userId', '==', user.id),
            orderBy('created_at', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    complaint_id: `SAI-${doc.id.slice(0, 8).toUpperCase()}`,
                    title: d.title || 'Untitled Complaint',
                    category: d.category,
                    status: d.status || 'Pending',
                    department_name: d.department_name,
                    department_email: d.department_email,
                    location: d.location || '—',
                    ward: d.ward || '—',
                    description: d.description,
                    created_at: d.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
                    attachments: d.attachments || [],
                    department_response: d.department_response || null,
                    status_history: d.status_history || [],
                };
            });
            setComplaints(data);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        processing: complaints.filter(c => c.status === 'Processing').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
    };

    const filtered = filter === 'All' ? complaints : complaints.filter(c => c.status === filter);

    const formatDate = (ts) => ts
        ? new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';

    return (
        <div className="track-page">

            {/* ---- Header ---- */}
            <div className="track-header">
                <div className="track-header-inner">
                    <div>
                        <h1 className="track-title">My Complaints</h1>
                        <p className="track-subtitle">Track status of all your submitted grievances in real-time</p>
                    </div>
                    <div className="track-header-badge">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10v6M9 22v-4a3 3 0 1 1 6 0v4M4 10a8 8 0 0 1 16 0" />
                        </svg>
                        Samadhana AI Portal
                    </div>
                </div>
            </div>

            <div className="track-body elite-container">

                {/* ---- Stats Row ---- */}
                <div className="track-stats-row">
                    {[
                        { label: 'Total', value: stats.total, color: '#001F3D', bg: '#e8edf4', icon: '📋' },
                        { label: 'Pending', value: stats.pending, color: '#b45309', bg: '#fef3c7', icon: '⏳' },
                        { label: 'Processing', value: stats.processing, color: '#1d4ed8', bg: '#dbeafe', icon: '⚙️' },
                        { label: 'Resolved', value: stats.resolved, color: '#15803d', bg: '#dcfce7', icon: '✅' },
                    ].map(s => (
                        <div key={s.label} className="track-stat-card" onClick={() => setFilter(s.label === 'Total' ? 'All' : s.label)}
                            style={{ cursor: 'pointer', outline: filter === (s.label === 'Total' ? 'All' : s.label) ? `2px solid ${s.color}` : 'none' }}>
                            <div className="track-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                            <div>
                                <div className="track-stat-number" style={{ color: s.color }}>{s.value}</div>
                                <div className="track-stat-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ---- Filter Tabs ---- */}
                <div className="track-filter-tabs">
                    {['All', 'Pending', 'Processing', 'Resolved'].map(f => (
                        <button key={f} className={`track-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f}
                        </button>
                    ))}
                </div>

                {/* ---- Complaint Cards ---- */}
                {loading ? (
                    <div className="track-loading">
                        <div className="track-spinner" />
                        <p>Loading your complaints...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="track-empty">
                        <div className="track-empty-icon">📋</div>
                        <h3>No complaints found</h3>
                        <p>No {filter !== 'All' ? filter.toLowerCase() : ''} complaints to show.</p>
                    </div>
                ) : (
                    <div className="complaint-cards-list">
                        {filtered.map(c => (
                            <div key={c.id} className="complaint-card" onClick={() => setSelected(c)}>
                                <div className="complaint-card-top">
                                    <div>
                                        <span className="complaint-card-id">{c.complaint_id}</span>
                                        <h3 className="complaint-card-title">{c.title}</h3>
                                    </div>
                                    <StatusBadge status={c.status} />
                                </div>
                                <div className="complaint-card-meta">
                                    <span className="complaint-meta-item">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                        {c.location}
                                    </span>
                                    <span className="complaint-meta-item">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                                        {formatDate(c.created_at)}
                                    </span>
                                    <span className="complaint-meta-item">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /></svg>
                                        Ward {c.ward}
                                    </span>
                                    <span className="complaint-category-pill">{c.category}</span>
                                </div>
                                <div className="complaint-card-footer">
                                    <span className="complaint-dept-tag">{c.department_name}</span>
                                    <span className="complaint-view-cta">View Details →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ---- Detail Modal ---- */}
            {selected && (
                <div className="track-modal-overlay" onClick={() => setSelected(null)}>
                    <div className="track-modal" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="track-modal-header">
                            <div>
                                <div className="track-modal-id">{selected.complaint_id}</div>
                                <h2 className="track-modal-title">{selected.title}</h2>
                            </div>
                            <button className="track-modal-close" onClick={() => setSelected(null)}>×</button>
                        </div>

                        {/* Progress Bar */}
                        <div className="track-modal-section">
                            <ProgressTracker status={selected.status} />
                        </div>

                        {/* Key Details Grid */}
                        <div className="track-modal-section">
                            <div className="track-detail-grid">
                                <div className="track-detail-item">
                                    <span className="track-detail-label">Status</span>
                                    <StatusBadge status={selected.status} />
                                </div>
                                <div className="track-detail-item">
                                    <span className="track-detail-label">Category</span>
                                    <span className="track-detail-value">{selected.category}</span>
                                </div>
                                <div className="track-detail-item">
                                    <span className="track-detail-label">Department</span>
                                    <span className="track-detail-value">{selected.department_name}</span>
                                </div>
                                <div className="track-detail-item">
                                    <span className="track-detail-label">Dept. Email</span>
                                    <span className="track-detail-value">{selected.department_email}</span>
                                </div>
                                <div className="track-detail-item">
                                    <span className="track-detail-label">📍 Location</span>
                                    <span className="track-detail-value">{selected.location}</span>
                                </div>
                                <div className="track-detail-item">
                                    <span className="track-detail-label">🏘️ Ward Number</span>
                                    <span className="track-detail-value highlight">Ward {selected.ward}</span>
                                </div>
                                <div className="track-detail-item">
                                    <span className="track-detail-label">Submitted On</span>
                                    <span className="track-detail-value">{formatDate(selected.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="track-modal-section">
                            <div className="track-detail-label" style={{ marginBottom: '8px' }}>Complaint Description</div>
                            <div className="track-description-box">{selected.description}</div>
                        </div>

                        {/* Department Response */}
                        {selected.department_response && (
                            <div className="track-modal-section">
                                <div className="track-detail-label" style={{ marginBottom: '8px' }}>📨 Department Response</div>
                                <div className="track-response-box">{selected.department_response}</div>
                            </div>
                        )}

                        {/* Status Timeline */}
                        {selected.status_history?.length > 0 && (
                            <div className="track-modal-section">
                                <div className="track-detail-label" style={{ marginBottom: '12px' }}>Status Timeline</div>
                                <div className="track-timeline">
                                    {[...selected.status_history].reverse().map((h, i) => (
                                        <div key={i} className="track-timeline-item">
                                            <div className={`track-timeline-dot ${i === 0 ? 'current' : ''}`} />
                                            {i < selected.status_history.length - 1 && <div className="track-timeline-line" />}
                                            <div className="track-timeline-content">
                                                <StatusBadge status={h.status} />
                                                <div className="track-timeline-note">{h.note}</div>
                                                <div className="track-timeline-date">{new Date(h.timestamp).toLocaleString('en-IN')}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Attachments */}
                        {selected.attachments?.length > 0 && (
                            <div className="track-modal-section">
                                <div className="track-detail-label" style={{ marginBottom: '8px' }}>Attachments</div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {selected.attachments.map((att, i) => (
                                        <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="track-attachment-link">
                                            📎 {att.name}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="track-modal-footer">
                            <button className="track-modal-close-btn" onClick={() => setSelected(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

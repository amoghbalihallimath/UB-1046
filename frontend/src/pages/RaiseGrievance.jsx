import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../styles/RaiseGrievance.css';

const DEPT_MAP = {
    Electricity: [{ name: 'BESCOM (Bangalore Electricity Supply Company)', email: 'cchelpline@bescom.org' }],
    'Water Supply': [
        { name: 'BWSSB (Bangalore Water Supply & Sewerage Board)', email: 'customercare@bwssb.org' },
        { name: 'PWD (Public Works Department)', email: 'pwd.karnataka@gov.in' }
    ],
    Sanitation: [
        { name: 'BBMP Solid Waste Management', email: 'swm@bbmp.gov.in' },
        { name: 'BBMP Helpdesk', email: 'helpdesk@bbmp.gov.in' }
    ],
    Roads: [
        { name: 'BBMP Roads Division', email: 'roads@bbmp.gov.in' },
        { name: 'PWD Roads & Bridges', email: 'pwdroads@karnataka.gov.in' }
    ],
    Health: [
        { name: 'District Health Office, Bangalore', email: 'dho.bangalore@karnataka.gov.in' },
        { name: 'BBMP Health Wing', email: 'health@bbmp.gov.in' }
    ],
    Others: [{ name: 'District Collector Office', email: 'dc.bangalore@karnataka.gov.in' }]
};

const CATEGORIES = Object.keys(DEPT_MAP);
const LANGS = [
    { code: 'en-IN', label: 'English', short: 'EN' },
    { code: 'hi-IN', label: 'Hindi', short: 'HI' },
    { code: 'kn-IN', label: 'Kannada', short: 'ಕನ್ನಡ' }
];

export default function RaiseGrievance() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '', description: '', category: '', department: null,
        ward: '', locationText: '', locationCoords: null, attachments: []
    });
    const [voiceLang, setVoiceLang] = useState('en-IN');
    const [isRecording, setIsRecording] = useState(false);
    const [activeVoiceField, setActiveVoiceField] = useState(null);
    const [interimText, setInterimText] = useState('');   // live transcript preview
    const [enhancing, setEnhancing] = useState(false);
    const [trackingLocation, setTrackingLocation] = useState(false);
    const [locationAccuracy, setLocationAccuracy] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [globalError, setGlobalError] = useState('');

    const recognitionRef = useRef(null);
    const fileInputRef = useRef(null);
    const watchIdRef = useRef(null);   // holds watchPosition id

    // Stop GPS watch when component unmounts
    React.useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const handleCategory = (cat) => setForm(f => ({ ...f, category: cat, department: null }));
    const handleDept = (dept) => setForm(f => ({ ...f, department: dept }));


    const startVoice = useCallback((field) => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setGlobalError('Voice input requires Chrome or Edge browser.'); return; }

        // If already recording the SAME field → stop
        if (isRecording && activeVoiceField === field) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            setActiveVoiceField(null);
            setInterimText('');
            return;
        }

        // Stop any previous session first
        recognitionRef.current?.stop();

        const recognition = new SR();
        recognition.lang = voiceLang;
        recognition.continuous = true;        // keep listening until stopped
        recognition.interimResults = true;    // show words as you speak
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        let finalText = form[field] || '';

        recognition.onstart = () => {
            setIsRecording(true);
            setActiveVoiceField(field);
            setInterimText('');
            setGlobalError('');
        };

        recognition.onresult = (e) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal) {
                    finalText += (finalText ? ' ' : '') + t.trim();
                    setForm(f => ({ ...f, [field]: finalText }));
                } else {
                    interim += t;
                }
            }
            setInterimText(interim);
        };

        recognition.onerror = (e) => {
            if (e.error === 'no-speech') return;   // ignore silence
            setGlobalError('Voice error: ' + e.error);
            setIsRecording(false);
            setActiveVoiceField(null);
            setInterimText('');
        };

        recognition.onend = () => {
            // auto-restart if still in recording mode (handles browser timeouts)
            if (recognitionRef.current && isRecording) {
                try { recognition.start(); } catch { }
            } else {
                setIsRecording(false);
                setActiveVoiceField(null);
                setInterimText('');
            }
        };

        recognition.start();
    }, [isRecording, activeVoiceField, voiceLang, form]);

    const enhanceText = async (field) => {
        const text = form[field];
        if (!text || text.trim().length < 20) {
            setGlobalError('Enter at least 20 characters before enhancing.');
            return;
        }

        const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (!GEMINI_KEY || GEMINI_KEY === 'your_gemini_api_key_here') {
            setGlobalError('AI Enhancement: Add your Gemini API key to frontend/.env as VITE_GEMINI_API_KEY');
            return;
        }

        setEnhancing(true);
        setGlobalError('');
        try {
            const prompt = `You are an official government grievance writing assistant for India. 
Rewrite the following citizen complaint in clear, formal, official language suitable for submission to ${form.department?.name || 'a government department'}. 
Category: ${form.category || 'General'}
Original complaint: "${text}"
Rules: Keep all factual details. Be concise and professional. Do NOT add fictional information. Return ONLY the rewritten text, no explanations.`;

            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.4, maxOutputTokens: 512 }
                    })
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || 'Gemini API error');
            const enhanced = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (!enhanced) throw new Error('Empty response from AI');
            setForm(f => ({ ...f, [field]: enhanced }));
        } catch (err) {
            setGlobalError('AI enhancement failed: ' + err.message);
        } finally {
            setEnhancing(false);
        }
    };


    // ── Real-time location tracking ──────────────────────────────────────────
    const stopLocationTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setTrackingLocation(false);
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const a = data.address || {};
            const parts = [
                a.road || a.pedestrian || a.footway || a.path,
                a.neighbourhood || a.suburb || a.quarter,
                a.city || a.town || a.village || a.county,
                a.state
            ].filter(Boolean);
            return parts.length > 0 ? parts.join(', ') : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        } catch {
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    };

    const toggleLocationTracking = () => {
        if (!navigator.geolocation) { setGlobalError('Geolocation not supported by your browser.'); return; }
        if (trackingLocation) { stopLocationTracking(); return; }   // second click = stop

        setGlobalError('');
        setTrackingLocation(true);
        setLocationAccuracy(null);

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                setLocationAccuracy(Math.round(accuracy));
                const address = await reverseGeocode(latitude, longitude);
                setForm(f => ({
                    ...f,
                    locationCoords: { lat: latitude, lng: longitude },
                    locationText: address
                }));
            },
            (err) => {
                const msg = err.code === 1
                    ? 'Permission denied — click the 🔒 lock icon in your browser bar → allow Location.'
                    : err.code === 2 ? 'Location unavailable. Move to an open area and try again.'
                        : 'Location timed out. Please try again.';
                setGlobalError(msg);
                stopLocationTracking();
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
    };

    // ── Address search (for desktop / inaccurate GPS) ────────────────────────
    const searchAddress = async (q) => {
        setSearchQuery(q);
        if (q.length < 3) { setSearchResults([]); return; }
        setSearchLoading(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=in`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            setSearchResults(data);
        } catch { setSearchResults([]); }
        finally { setSearchLoading(false); }
    };

    const selectSearchResult = (result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setForm(f => ({
            ...f,
            locationCoords: { lat, lng },
            locationText: result.display_name.split(',').slice(0, 4).join(', ')
        }));
        setSearchQuery('');
        setSearchResults([]);
        setLocationAccuracy(null);
        stopLocationTracking();
    };


    const handleFiles = (files) => {
        // Limit to 2MB since we're converting to Base64 for Firestore
        const valid = Array.from(files).filter(f => f.size < 2 * 1024 * 1024);
        if (valid.length < files.length) {
            setGlobalError('Some files were ignored because they exceed the 2MB limit.');
        }
        setForm(f => ({ ...f, attachments: [...f.attachments, ...valid].slice(0, 3) }));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category) { setGlobalError('Please select a category.'); return; }
        if (!form.description.trim()) { setGlobalError('Please enter a description.'); return; }

        setSubmitting(true);
        setGlobalError('');

        try {
            // 1. Convert evidence files to Base64 (bypasses Firebase Storage paywall)
            const attachmentURLs = [];
            for (const file of form.attachments) {
                const base64Url = await fileToBase64(file);
                attachmentURLs.push({ name: file.name, url: base64Url });
            }

            // 2. Save complaint to Firestore
            const complaintData = {
                userId: user.id,
                userEmail: user.email,
                userName: user.name,
                title: form.title || form.description.slice(0, 60),
                description: form.description,
                category: form.category,
                department_name: form.department?.name || null,
                department_email: form.department?.email || null,
                location: form.locationText || null,
                locationCoords: form.locationCoords || null,
                ward: form.ward || null,
                attachments: attachmentURLs,
                status: 'Pending',
                created_at: serverTimestamp(),
                department_response: null,
                status_history: [{ status: 'Pending', note: 'Complaint received and logged.', timestamp: new Date().toISOString() }]
            };

            const docRef = await addDoc(collection(db, 'complaints'), complaintData);
            console.log('Complaint saved:', docRef.id);

            // 3. Show success message (user explicitly requested this confirmation)
            setShowSuccess(true);
        } catch (err) {
            console.error('Submission failed:', err);
            setGlobalError('Submission failed: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grievance-page">
            <div className="elite-container">

                {/* ---- Dark Header ---- */}
                <header className="grievance-header-elite">
                    <h1 className="grievance-title-elite">Grievance Registration Form</h1>
                    <div className="header-badges">
                        <span className="header-badge">Official Document</span>
                        <span className="header-badge">Janseva Direct</span>
                    </div>
                </header>

                {/* ---- Form Body ---- */}
                <div className="grievance-form-body">

                    {/* AI Banner */}
                    <div className="ai-tip-banner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#001F3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                        </svg>
                        <div>
                            <div className="ai-tip-title">AI-Powered Assistance</div>
                            <div className="ai-tip-text">
                                This system uses AI to automatically categorize and prioritize your grievance.
                                Tip: Provide clear details for faster resolution.
                            </div>
                        </div>
                    </div>

                    {/* Quick Voice Input */}
                    <div className="quick-voice-strip">
                        <span className="quick-voice-label">Quick Input</span>
                        <button type="button"
                            className={`voice-trigger-elite ${isRecording && activeVoiceField === 'description' ? 'pulse-active' : ''}`}
                            onClick={() => startVoice('description')}
                            style={{ width: 'auto', padding: '8px 20px', gap: '8px', borderRadius: '20px', display: 'flex', alignItems: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" x2="12" y1="19" y2="22" />
                            </svg>
                            Tap to Speak
                        </button>
                    </div>

                    {globalError && <div className="form-error-banner">{globalError}</div>}

                    <form onSubmit={handleSubmit}>

                        {/* Section 1 — Classification */}
                        <section className="form-section-elite">
                            <h3 className="form-section-title-elite">
                                <span className="step-indicator-elite">1</span> Classification Details
                            </h3>

                            <div className="elite-input-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label className="elite-label">Category <span className="req" style={{ color: '#e11d48' }}>*</span></label>
                                    <select className="elite-select" value={form.category} onChange={e => handleCategory(e.target.value)}>
                                        <option value="">Select Category</option>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="elite-label">Department <span style={{ color: '#e11d48' }}>*</span></label>
                                    <select className="elite-select" value={form.department?.name || ''} onChange={e => {
                                        const dept = (DEPT_MAP[form.category] || []).find(d => d.name === e.target.value);
                                        if (dept) handleDept(dept);
                                    }} disabled={!form.category}>
                                        <option value="">Select Department</option>
                                        {(DEPT_MAP[form.category] || []).map((d, i) => <option key={i} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Section 2 — Grievance Details */}
                        <section className="form-section-elite">
                            <h3 className="form-section-title-elite">
                                <span className="step-indicator-elite">2</span> Grievance Details
                            </h3>

                            <div className="elite-input-group">
                                <label className="elite-label">Detailed Description of Issue <span style={{ color: '#e11d48' }}>*</span></label>
                                <textarea className={`elite-textarea ${isRecording && activeVoiceField === 'description' ? 'voice-active-textarea' : ''}`}
                                    placeholder="Please provide specific details about the incident, including time, affected area, and nature of the problem..."
                                    value={form.description}
                                    style={{ marginBottom: '16px' }}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

                                {/* Live voice transcript preview */}
                                {isRecording && activeVoiceField === 'description' && (
                                    <div className="voice-interim-preview" style={{ marginBottom: '16px', marginTop: '-10px' }}>
                                        <span className="voice-listening-dot" />
                                        <span className="voice-interim-text">
                                            {interimText || 'Listening... speak now'}
                                        </span>
                                    </div>
                                )}
                                <button type="button"
                                    className={`voice-trigger-elite ${isRecording && activeVoiceField === 'description' ? 'pulse-active' : ''}`}
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        padding: '12px',
                                        background: '#fafbfc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        color: '#334155'
                                    }}
                                    onClick={() => startVoice('description')} title={isRecording && activeVoiceField === 'description' ? 'Stop Recording' : 'Start Voice Input'}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                        <line x1="12" x2="12" y1="19" y2="22" />
                                    </svg>
                                    <span style={{ marginLeft: '8px', fontSize: '0.95rem', fontWeight: 600 }}>
                                        {isRecording && activeVoiceField === 'description' ? 'Stop Recording' : 'Tap to Speak'}
                                    </span>
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'flex-start' }}>
                                <div style={{ position: 'relative' }}>
                                    <label className="elite-label">Incident Location <span style={{ color: '#e11d48' }}>*</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="text" className="elite-input" placeholder="Search exact address or area..."
                                            value={searchQuery || form.locationText}
                                            onChange={e => {
                                                setForm(f => ({ ...f, locationText: e.target.value }));
                                                searchAddress(e.target.value);
                                            }} />
                                        {searchLoading && <div style={{ position: 'absolute', right: '12px', top: '12px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" className="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></div>}
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '220px', overflowY: 'auto' }}>
                                            {searchResults.map((res, i) => (
                                                <div key={i} onClick={() => selectSearchResult(res)}
                                                    style={{ padding: '10px 12px', borderBottom: i === searchResults.length - 1 ? 'none' : '1px solid #f1f5f9', cursor: 'pointer', fontSize: '12px', color: '#374151', display: 'flex', alignItems: 'flex-start', gap: '8px', transition: 'background 0.15s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                                    <span style={{ lineHeight: '1.4' }}>{res.display_name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button type="button"
                                    className={`loc-detect-btn ${trackingLocation ? 'detecting' : ''}`}
                                    onClick={toggleLocationTracking}
                                    title={trackingLocation ? 'Stop tracking' : 'Start real-time location tracking'}
                                    style={{ background: trackingLocation ? '#fee2e2' : undefined, borderColor: trackingLocation ? '#ef4444' : undefined }}>
                                    {trackingLocation
                                        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#001F3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><line x1="12" x2="12" y1="2" y2="5" /><line x1="12" x2="12" y1="19" y2="22" /><line x1="2" x2="5" y1="12" y2="12" /><line x1="19" x2="22" y1="12" y2="12" /></svg>
                                    }
                                </button>
                            </div>

                            {/* Live tracking status bar */}
                            {trackingLocation && (
                                <div className="location-accuracy-badge" style={{ color: '#ef4444', marginTop: '8px', justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="voice-listening-dot" style={{ background: '#ef4444' }} />
                                        {locationAccuracy !== null
                                            ? `Tracking live — GPS ±${locationAccuracy}m${locationAccuracy < 20 ? ' ✓ Excellent' : locationAccuracy < 60 ? ' · Good' : ' · Move to open area'}`
                                            : 'Acquiring GPS signal…'}
                                    </span>
                                    <button type="button" onClick={stopLocationTracking}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>✕ Stop</button>
                                </div>
                            )}
                            {/* GPS accuracy badge when stopped */}
                            {!trackingLocation && locationAccuracy !== null && form.locationCoords && (
                                <div className="location-accuracy-badge">
                                    <span className={`accuracy-dot ${locationAccuracy < 20 ? 'green' : locationAccuracy < 60 ? 'yellow' : 'grey'}`} />
                                    GPS ±{locationAccuracy}m — {locationAccuracy < 20 ? 'Excellent accuracy ✓' : locationAccuracy < 60 ? 'Good accuracy' : 'Move to open area'}
                                </div>
                            )}
                            {/* Live map preview */}
                            {form.locationCoords && (
                                <div style={{ marginTop: '10px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
                                    {trackingLocation && (
                                        <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span className="voice-listening-dot" style={{ background: '#fff', width: '6px', height: '6px' }} />LIVE
                                        </div>
                                    )}
                                    <iframe
                                        key={`${form.locationCoords.lat.toFixed(4)}-${form.locationCoords.lng.toFixed(4)}`}
                                        title="Location Preview"
                                        width="100%" height="180"
                                        style={{ display: 'block', border: 'none' }}
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.locationCoords.lng - 0.005},${form.locationCoords.lat - 0.005},${form.locationCoords.lng + 0.005},${form.locationCoords.lat + 0.005}&layer=mapnik&marker=${form.locationCoords.lat},${form.locationCoords.lng}`}
                                    />
                                </div>
                            )}

                            <div className="elite-input-group" style={{ marginTop: '14px' }}>
                                <label className="elite-label">Ward Number</label>
                                <input type="number" className="elite-input" placeholder="e.g. 45"
                                    value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} />
                            </div>
                        </section>

                        {/* Section 3 — Evidence */}
                        <section className="form-section-elite">
                            <h3 className="form-section-title-elite">
                                <span className="step-indicator-elite">3</span> Evidence
                            </h3>
                            <label className="elite-label">Supporting Evidence (Optional)</label>
                            <div className="upload-zone"
                                onClick={() => fileInputRef.current.click()}
                                onDrop={handleDrop}
                                onDragOver={e => e.preventDefault()}>
                                <div className="upload-zone-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                        <path d="M12 12v9" /><path d="m16 16-4-4-4 4" />
                                    </svg>
                                </div>
                                <div className="upload-zone-text">
                                    Click to upload or <strong>drag and drop</strong>
                                </div>
                                <div className="upload-zone-hint">SVG, PNG, JPG or GIF (MAX. 10MB)</div>
                            </div>
                            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                                onChange={e => handleFiles(e.target.files)} />
                            {form.attachments.map((f, i) => (
                                <div key={i} className="attachment-item">
                                    <span>{f.name}</span>
                                    <span className="attachment-size">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                                </div>
                            ))}
                        </section>

                        {/* Submit */}
                        <button type="submit" className="submit-btn-elite" disabled={submitting}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                            </svg>
                            {submitting ? 'Submitting...' : 'Submit Grievance →'}
                        </button>

                        <p className="form-footer-legal">
                            By submitting, you agree to the Terms of Service and Privacy Policy
                        </p>

                        <div className="form-footer-secure">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#22c55e" stroke="none"><circle cx="12" cy="12" r="10" /></svg>
                            Secure & Confidential • Government of India Initiative
                        </div>
                    </form>
                </div>
            </div>

            {/* Backend Success Confirmation Modal */}
            {showSuccess && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 31, 61, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '40px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'popIn 0.3s ease-out forwards' }}>
                        <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#001F3D', margin: '0 0 12px 0' }}>Data Stored Securely!</h2>
                        <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: '0 0 32px 0' }}>
                            Your grievance has been successfully encrypted and saved to the <strong>Firebase Backend Database</strong>. It is now syncing in real-time.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{ width: '100%', background: '#ED985F', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(237, 152, 95, 0.3)' }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Return to Dashboard →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

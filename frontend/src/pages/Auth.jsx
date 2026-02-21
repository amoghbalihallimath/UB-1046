import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function Auth() {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [pendingEmail, setPendingEmail] = useState(null);

    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const handle = (e) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
        setErrors(er => ({ ...er, [e.target.name]: '' }));
        setGlobalError('');
    };

    const validate = () => {
        const errs = {};
        if (mode === 'signup' && !form.name.trim()) errs.name = 'Full name is required';
        if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Enter a valid email address';
        if (!PASSWORD_REGEX.test(form.password)) {
            errs.password = 'Min 8 characters with uppercase, lowercase, and number';
        }
        if (mode === 'signup' && form.password !== form.confirm) {
            errs.confirm = 'Passwords do not match';
        }
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        try {
            if (mode === 'signup') {
                const { email } = await signup(form.name.trim(), form.email.trim(), form.password);
                setPendingEmail(email);
            } else {
                await login(form.email.trim(), form.password);
                navigate('/dashboard');
            }
        } catch (err) {
            const code = err.code || '';
            if (code === 'auth/email-not-verified') {
                setPendingEmail(err.email || form.email.trim());
                return;
            }
            const msg =
                code === 'auth/email-already-in-use'
                    ? 'User already exists. Please sign in'
                    : code === 'auth/invalid-credential' ||
                        code === 'auth/wrong-password' ||
                        code === 'auth/user-not-found' ||
                        code === 'auth/invalid-email'
                        ? 'Email or password is incorrect'
                        : err.message || 'An error occurred. Please try again.';
            setGlobalError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Verification screen ──────────────────────────────────────────────────
    if (pendingEmail) {
        return (
            <div className="auth-page">
                <div className="auth-split">
                    <div className="auth-brand">
                        <div className="auth-brand-logo">SA</div>
                        <h1 className="auth-brand-title">Samadhana AI</h1>
                        <p className="auth-brand-tagline">
                            Citizen Services &amp; AI-Powered<br />Grievance Redressal System
                        </p>
                        <div className="auth-brand-divider"></div>
                        <div className="auth-brand-features">
                            <div className="auth-feature-item">✅ Official government service links</div>
                            <div className="auth-feature-item">🎙️ AI-powered grievance submission</div>
                            <div className="auth-feature-item">📊 Real-time complaint tracking</div>
                            <div className="auth-feature-item">🔒 Secure &amp; encrypted platform</div>
                        </div>
                        <p className="auth-brand-disclaimer">
                            🇮🇳 An initiative to empower citizens at the district level
                        </p>
                    </div>

                    <div className="auth-form-panel">
                        <div className="auth-form-card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                            <h2 style={{ marginBottom: '0.75rem' }}>Verify Your Email</h2>
                            <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                We have sent you a verification email to{' '}
                                <strong>{pendingEmail}</strong>. Please verify it and log in.
                            </p>
                            <button
                                id="btn-go-to-login"
                                className="btn btn-primary btn-full"
                                onClick={() => {
                                    setPendingEmail(null);
                                    setMode('login');
                                    setForm(f => ({ ...f, email: pendingEmail, password: '', confirm: '' }));
                                }}
                            >
                                Login
                            </button>
                            <p className="auth-legal" style={{ marginTop: '1rem' }}>
                                Didn't receive it? Check your spam folder or try signing up again.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Normal login / signup form ───────────────────────────────────────────
    return (
        <div className="auth-page">
            <div className="auth-split">
                {/* Left — Branding */}
                <div className="auth-brand">
                    <div className="auth-brand-logo">SA</div>
                    <h1 className="auth-brand-title">Samadhana AI</h1>
                    <p className="auth-brand-tagline">
                        Citizen Services &amp; AI-Powered<br />Grievance Redressal System
                    </p>
                    <div className="auth-brand-divider"></div>
                    <div className="auth-brand-features">
                        <div className="auth-feature-item">✅ Official government service links</div>
                        <div className="auth-feature-item">🎙️ AI-powered grievance submission</div>
                        <div className="auth-feature-item">📊 Real-time complaint tracking</div>
                        <div className="auth-feature-item">🔒 Secure &amp; encrypted platform</div>
                    </div>
                    <p className="auth-brand-disclaimer">
                        🇮🇳 An initiative to empower citizens at the district level
                    </p>
                </div>

                {/* Right — Form */}
                <div className="auth-form-panel">
                    <div className="auth-form-card">
                        <div className="auth-form-header">
                            <h2>{mode === 'login' ? 'Sign In to Samadhana AI' : 'Create Your Account'}</h2>
                            <p>{mode === 'login'
                                ? 'Access government services and track your grievances'
                                : 'Join thousands of citizens using Samadhana AI'}</p>
                        </div>

                        <div className="auth-tab-group">
                            <button
                                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                                onClick={() => { setMode('login'); setErrors({}); setGlobalError(''); }}
                                id="tab-login"
                            >Sign In</button>
                            <button
                                className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                                onClick={() => { setMode('signup'); setErrors({}); setGlobalError(''); }}
                                id="tab-signup"
                            >Sign Up</button>
                        </div>

                        {globalError && <div className="alert alert-error">{globalError}</div>}

                        <form onSubmit={handleSubmit} noValidate>
                            {mode === 'signup' && (
                                <div className="form-group">
                                    <label className="form-label" htmlFor="name">Full Name <span className="required">*</span></label>
                                    <input id="name" name="name" type="text"
                                        className={`form-input ${errors.name ? 'input-error' : ''}`}
                                        placeholder="Enter your full name"
                                        value={form.name} onChange={handle} autoComplete="name" />
                                    {errors.name && <span className="form-error">{errors.name}</span>}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email ID <span className="required">*</span></label>
                                <input id="email" name="email" type="email"
                                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                                    placeholder="yourname@example.com"
                                    value={form.email} onChange={handle} autoComplete="email" />
                                {errors.email && <span className="form-error">{errors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="password">Password <span className="required">*</span></label>
                                <input id="password" name="password" type="password"
                                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                                    placeholder={mode === 'signup' ? 'Min 8 chars, uppercase, number' : 'Enter your password'}
                                    value={form.password} onChange={handle}
                                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                                {errors.password && <span className="form-error">{errors.password}</span>}
                            </div>

                            {mode === 'signup' && (
                                <div className="form-group">
                                    <label className="form-label" htmlFor="confirm">Confirm Password <span className="required">*</span></label>
                                    <input id="confirm" name="confirm" type="password"
                                        className={`form-input ${errors.confirm ? 'input-error' : ''}`}
                                        placeholder="Re-enter password"
                                        value={form.confirm} onChange={handle} autoComplete="new-password" />
                                    {errors.confirm && <span className="form-error">{errors.confirm}</span>}
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary btn-full" id="btn-submit-auth" disabled={loading}>
                                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        <p className="auth-legal">
                            By continuing, you agree to the terms of service.
                            This is an official citizen services platform.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

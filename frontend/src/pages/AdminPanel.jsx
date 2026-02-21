import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import "../styles/AdminPanel.css";

const mockCases = [
    { id: "GRV-2025-0041", title: "Sewage overflow on Main Street", dept: "Sanitation", priority: "Critical", status: "In Progress", location: "Sector 12, Block B", timeOpen: 3, citizen: "Ramesh Kumar", phone: "9812345678", description: "Sewage has been overflowing for 3 days near the market area, causing unhygienic conditions. Multiple shops affected.", assignedTo: "Officer Priya Sharma", timeline: [{ date: "Jan 15", event: "Complaint Registered", by: "System" }, { date: "Jan 15", event: "Auto-routed to Sanitation", by: "AI Router" }, { date: "Jan 16", event: "Assigned to Officer Priya Sharma", by: "Dept. Head" }, { date: "Jan 17", event: "Field Inspection Completed", by: "Officer Priya Sharma" }] },
    { id: "GRV-2025-0039", title: "Pothole causing accidents near school", dept: "Roads", priority: "High", status: "Assigned", location: "Sector 4, Near DPS", timeOpen: 5, citizen: "Sunita Devi", phone: "9876543210", description: "Large pothole near school entrance causing accidents. Children at risk.", assignedTo: "Officer Amit Verma", timeline: [{ date: "Jan 13", event: "Complaint Registered", by: "System" }, { date: "Jan 13", event: "Auto-routed to Roads Dept.", by: "AI Router" }, { date: "Jan 14", event: "Assigned to Officer Amit Verma", by: "Dept. Head" }] },
    { id: "GRV-2025-0037", title: "No water supply for 4 days", dept: "Water Supply", priority: "Critical", status: "Under Review", location: "Block C, RK Puram", timeOpen: 7, citizen: "Mohammed Farooq", phone: "9765432109", description: "Entire Block C has had no water supply for 4 days. Elderly and children severely affected.", assignedTo: "Unassigned", timeline: [{ date: "Jan 11", event: "Complaint Registered", by: "System" }, { date: "Jan 11", event: "Auto-routed to Water Supply", by: "AI Router" }, { date: "Jan 13", event: "Under Review by Senior Engineer", by: "SE Mohan Das" }] },
    { id: "GRV-2025-0035", title: "Street lights non-functional", dept: "Electricity", priority: "Medium", status: "Registered", location: "Lane 7, Vasant Kunj", timeOpen: 2, citizen: "Anita Singh", phone: "9654321098", description: "All 12 street lights in Lane 7 have been non-functional for 2 weeks, creating safety concerns.", assignedTo: "Unassigned", timeline: [{ date: "Jan 16", event: "Complaint Registered", by: "System" }, { date: "Jan 16", event: "Auto-routed to Electricity Dept.", by: "AI Router" }] },
    { id: "GRV-2025-0033", title: "Garbage not collected for 10 days", dept: "Sanitation", priority: "High", status: "In Progress", location: "Sector 9, Dwarka", timeOpen: 10, citizen: "Vijay Prakash", phone: "9543210987", description: "Municipal garbage truck has not visited our area for 10 days. Health hazard building up.", assignedTo: "Supervisor Meena Gupta", timeline: [{ date: "Jan 8", event: "Complaint Registered", by: "System" }, { date: "Jan 8", event: "Auto-routed to Sanitation", by: "AI Router" }, { date: "Jan 9", event: "Assigned to Supervisor Meena Gupta", by: "Dept. Head" }, { date: "Jan 15", event: "Special Collection Scheduled", by: "Supervisor Meena Gupta" }] },
    { id: "GRV-2025-0031", title: "Broken footpath causing falls", dept: "Public Works", priority: "Medium", status: "Closed", location: "MG Road, Near Bus Stand", timeOpen: 0, citizen: "Geeta Sharma", phone: "9432109876", description: "Footpath tiles broken and uneven causing multiple falls. Senior citizens especially affected.", assignedTo: "Engineer Raju Nair", timeline: [{ date: "Jan 5", event: "Complaint Registered", by: "System" }, { date: "Jan 6", event: "Assigned to Engineer Raju Nair", by: "Dept. Head" }, { date: "Jan 12", event: "Repair Completed", by: "Engineer Raju Nair" }, { date: "Jan 13", event: "Case Closed", by: "Dept. Head" }] },
];

// Removed static mock data since we are using live Firestore cases
const monthly = [{ m: "Aug", f: 45, r: 38 }, { m: "Sep", f: 52, r: 47 }, { m: "Oct", f: 61, r: 53 }, { m: "Nov", f: 48, r: 51 }, { m: "Dec", f: 39, r: 40 }, { m: "Jan", f: 67, r: 44 }];

const PCOLORS = { Critical: "#dc2626", High: "#ea580c", Medium: "#ca8a04", Low: "#16a34a" };
const SCOLORS = { Registered: "#3b82f6", Assigned: "#8b5cf6", "Under Review": "#f97316", "In Progress": "#10b981", "Pending Closure": "#f59e0b", Closed: "#6b7280" };
const PIE_COLORS = ["#dc2626", "#ea580c", "#ca8a04", "#16a34a"];
const STATUSES = ["Pending", "Registered", "Assigned", "Under Review", "In Progress", "Pending Closure", "Closed", "Rejected"];

export default function AdminPanel() {
    const [tab, setTab] = useState("dashboard");
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterPriority, setFilterPriority] = useState("All");
    const [selectedCase, setSelectedCase] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [remark, setRemark] = useState("");
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "complaints"), orderBy("created_at", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(docSnap => {
                const d = docSnap.data();
                const getPriority = (cat) => {
                    const critical = ["Emergency Services", "Medical / Health", "Fire Safety", "Women Safety"];
                    const high = ["Public Safety", "Water & Sanitation", "Electricity & Power"];
                    if (critical.includes(cat)) return "Critical";
                    if (high.includes(cat)) return "High";
                    return "Medium";
                };

                return {
                    id: docSnap.id,
                    display_id: `SAI-${docSnap.id.slice(0, 8).toUpperCase()}`,
                    title: d.title || "Untitled",
                    dept: d.department_name || d.category || "Unassigned",
                    priority: getPriority(d.category),
                    status: d.status || "Pending",
                    location: d.location || "—",
                    timeOpen: d.created_at ? Math.floor((Date.now() - d.created_at.toMillis()) / (1000 * 60 * 60 * 24)) : 0,
                    citizen: d.userName || "Unknown",
                    email: d.userEmail || "—",
                    phone: d.phone || "—",
                    description: d.description || "",
                    assignedTo: d.assignedTo || "—",
                    attachments: d.attachments || [],
                    ward: d.ward || "—",
                    department_email: d.department_email || "—",
                    timeline: d.status_history?.map(h => ({
                        date: new Date(h.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" }),
                        event: h.note || `Status updated to ${h.status}`,
                        by: h.by || (h.status === 'Pending' ? "System" : "Admin")
                    })) || []
                };
            });
            setCases(data);
            setLoading(false);
        }, (err) => {
            console.error("SNAPSHOT ERROR in ADMIN:", err);
            alert("Error fetching complaints in admin panel: " + err.message);
        });
        return () => unsubscribe();
    }, []);

    const filtered = cases.filter(c => {
        const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.display_id.toLowerCase().includes(search.toLowerCase()) || c.citizen.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === "All" || c.status === filterStatus;
        const matchPriority = filterPriority === "All" || c.priority === filterPriority;
        return matchSearch && matchStatus && matchPriority;
    });

    const handleUpdateStatus = async () => {
        if (!newStatus || !selectedCase) return;
        try {
            const caseRef = doc(db, "complaints", selectedCase.id);
            const newHistory = {
                status: newStatus,
                note: remark || `Status manually updated to ${newStatus}`,
                timestamp: new Date().toISOString(),
                by: "Admin"
            };
            await updateDoc(caseRef, {
                status: newStatus,
                status_history: arrayUnion(newHistory)
            });
            setShowStatusModal(false);
            setRemark("");
            setNewStatus("");
            setSelectedCase(prev => prev ? { ...prev, status: newStatus, timeline: [...prev.timeline, { date: "Now", event: newHistory.note, by: "Admin" }] } : null);
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status.");
        }
    };

    // --- Dynamic Analytics Data ---
    const totalComplaints = cases.length;
    const pendingCases = cases.filter(c => ["Pending", "Registered", "Assigned"].includes(c.status)).length;
    const resolvedCases = cases.filter(c => c.status === "Closed" || c.status === "Resolved").length;

    // Status formatting
    const statusCounts = {};
    STATUSES.forEach(s => statusCounts[s] = 0);
    cases.forEach(c => {
        if (statusCounts[c.status] !== undefined) statusCounts[c.status]++;
    });
    const dynamicByStatus = Object.keys(statusCounts).map(s => ({ name: s, count: statusCounts[s] })).filter(s => s.count > 0);

    // Priority breakdown
    const priorityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    cases.forEach(c => {
        if (priorityCounts[c.priority] !== undefined) priorityCounts[c.priority]++;
    });
    const dynamicByPriority = Object.keys(priorityCounts).map(p => ({ name: p, value: priorityCounts[p] })).filter(p => p.value > 0);

    // Department breakdown
    const deptCounts = {};
    cases.forEach(c => {
        const d = c.dept || "Unassigned";
        deptCounts[d] = (deptCounts[d] || 0) + 1;
    });
    const dynamicByDept = Object.keys(deptCounts).map(d => ({ name: d, value: deptCounts[d] })).sort((a, b) => b.value - a.value).slice(0, 6);

    const NavItem = ({ id, label, icon }) => (
        <button
            className={`ap-nav-btn ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
        >
            {icon}
            {label}
        </button>
    );

    const navigate = useNavigate();

    return (
        <div className="ap-shell">
            {/* ── Sidebar ── */}
            <aside className="ap-sidebar">
                <div className="ap-brand">
                    <div className="ap-brand-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#001F3D" strokeWidth="2.5" width="20" height="20"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <div>
                        <div className="ap-brand-name">SAMADHANA AI</div>
                        <div className="ap-brand-sub">Admin Portal</div>
                    </div>
                </div>

                <div className="ap-nav-section-label">Overview</div>
                <NavItem id="dashboard" label="Dashboard" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>} />
                <NavItem id="cases" label="Case Inbox" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>} />

                <div className="ap-nav-section-label">Analytics</div>
                <NavItem id="analytics" label="Reports" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>} />

                <div className="ap-nav-section-label">System</div>
                <NavItem id="settings" label="Settings" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>} />

                <div className="ap-sidebar-footer">
                    <div className="ap-avatar-sm">A</div>
                    <div>
                        <div className="ap-avatar-name">Admin User</div>
                        <div className="ap-avatar-role">System Administrator</div>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="ap-main">
                {/* Topbar */}
                <header className="ap-topbar">
                    <div className="ap-topbar-left">
                        <div className="ap-live-dot" />
                        <span className="ap-live-label">Live System</span>
                        <span className="ap-topbar-divider" />
                        <span className="ap-topbar-title">{tab === "dashboard" ? "Command Center" : tab === "cases" ? "Case Inbox" : tab === "analytics" ? "Reports" : "Settings"}</span>
                    </div>
                    <div className="ap-topbar-right">
                        <div className="ap-search-wrap">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input className="ap-search" placeholder="Search cases, citizens…" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button className="ap-btn-outline">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Export
                        </button>
                        <div className="ap-avatar">A</div>
                    </div>
                </header>

                {/* ── Dashboard Tab ── */}
                {tab === "dashboard" && (
                    <div className="ap-content">
                        {/* KPI Cards */}
                        <div className="ap-kpi-grid">
                            {[
                                { label: "Total Complaints", value: totalComplaints.toString(), sub: "All time", subColor: "#16a34a", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#001F3D" strokeWidth="2" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>, accent: "#001F3D" },
                                { label: "Pending Resolution", value: pendingCases.toString(), sub: "Needs attention", subColor: "#ea580c", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>, accent: "#ea580c" },
                                { label: "Resolved / Closed", value: resolvedCases.toString(), sub: "Great work!", subColor: "#16a34a", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="22" height="22"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>, accent: "#16a34a" },
                                { label: "Avg Resolution Time", value: "—", sub: "Gathering data", subColor: "#3b82f6", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, accent: "#3b82f6" },
                            ].map((k, i) => (
                                <div key={i} className="ap-kpi-card">
                                    <div className="ap-kpi-icon" style={{ background: `${k.accent}15` }}>{k.icon}</div>
                                    <div className="ap-kpi-body">
                                        <div className="ap-kpi-label">{k.label}</div>
                                        <div className="ap-kpi-value" style={{ color: k.accent }}>{k.value}</div>
                                        <div className="ap-kpi-sub" style={{ color: k.subColor }}>{k.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts */}
                        <div className="ap-charts-grid">
                            <div className="ap-card">
                                <div className="ap-card-header"><span className="ap-card-title">Monthly Trends</span></div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={monthly} barCategoryGap="30%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#6b7280" }} />
                                        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                                        <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e5e7eb" }} />
                                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                                        <Bar dataKey="f" name="Filed" fill="#001F3D" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="r" name="Resolved" fill="#ED985F" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="ap-card">
                                <div className="ap-card-header"><span className="ap-card-title">Priority Breakdown</span></div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={dynamicByPriority} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                            {dynamicByPriority.map((e, i) => <Cell key={i} fill={PCOLORS[e.name] || PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="ap-card">
                                <div className="ap-card-header"><span className="ap-card-title">By Department</span></div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={dynamicByDept} layout="vertical" barCategoryGap="20%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#6b7280" }} width={70} />
                                        <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                                        <Bar dataKey="value" name="Cases" fill="#001F3D" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Status Summary Tiles */}
                        <div className="ap-status-tiles">
                            {dynamicByStatus.map((s, i) => (
                                <div key={i} className="ap-status-tile" style={{ borderTop: `3px solid ${SCOLORS[s.name] || '#6b7280'}` }}>
                                    <div className="ap-status-tile-count" style={{ color: SCOLORS[s.name] || '#6b7280' }}>{s.count}</div>
                                    <div className="ap-status-tile-name">{s.name}</div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Cases */}
                        <div className="ap-card">
                            <div className="ap-card-header">
                                <span className="ap-card-title">Recent Cases</span>
                                <button className="ap-link-btn" onClick={() => setTab("cases")}>View All →</button>
                            </div>
                            <CaseTable cases={cases.slice(0, 3)} onSelect={c => { setSelectedCase(c); setTab("cases"); }} loading={loading} />
                        </div>
                    </div>
                )}

                {/* ── Cases Tab ── */}
                {tab === "cases" && (
                    <div className="ap-content" style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Filters */}
                            <div className="ap-filters-bar">
                                <div className="ap-filter-group">
                                    {["All", "Registered", "Assigned", "Under Review", "In Progress", "Pending Closure", "Closed"].map(s => (
                                        <button key={s} className={`ap-filter-btn ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)}>{s}</button>
                                    ))}
                                </div>
                                <select className="ap-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                                    <option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                                </select>
                            </div>
                            <div className="ap-card" style={{ padding: 0, overflow: "hidden" }}>
                                <div className="ap-results-bar">{filtered.length} results</div>
                                <CaseTable cases={filtered} onSelect={setSelectedCase} selected={selectedCase} loading={loading} />
                            </div>
                        </div>

                        {/* Detail Panel */}
                        {selectedCase && (
                            <div className="ap-detail-panel">
                                <div className="ap-detail-header">
                                    <div>
                                        <div className="ap-detail-id">{selectedCase.display_id}</div>
                                        <div className="ap-detail-title">{selectedCase.title}</div>
                                    </div>
                                    <button className="ap-close-btn" onClick={() => setSelectedCase(null)}>✕</button>
                                </div>

                                <div className="ap-badge-row">
                                    <span className="ap-priority-badge" style={{ color: PCOLORS[selectedCase.priority], background: `${PCOLORS[selectedCase.priority]}15` }}>{selectedCase.priority}</span>
                                    <span className="ap-status-badge" style={{ color: SCOLORS[selectedCase.status], background: `${SCOLORS[selectedCase.status]}15` }}>{selectedCase.status}</span>
                                </div>

                                <div className="ap-detail-section">
                                    <div className="ap-detail-row"><span>Department</span><strong>{selectedCase.dept}</strong></div>
                                    <div className="ap-detail-row"><span>Dept Email</span><strong>{selectedCase.department_email}</strong></div>
                                    <div className="ap-detail-row"><span>Citizen</span><strong>{selectedCase.citizen}</strong></div>
                                    <div className="ap-detail-row"><span>Citizen Email</span><strong>{selectedCase.email}</strong></div>
                                    <div className="ap-detail-row"><span>Phone Number</span><strong>{selectedCase.phone}</strong></div>
                                    <div className="ap-detail-row"><span>Location</span><strong>{selectedCase.location}</strong></div>
                                    <div className="ap-detail-row"><span>Ward</span><strong>{selectedCase.ward}</strong></div>
                                    <div className="ap-detail-row"><span>Days Open</span><strong style={{ color: selectedCase.timeOpen > 7 ? "#dc2626" : "#001F3D" }}>{selectedCase.timeOpen} days</strong></div>
                                </div>

                                <div className="ap-detail-label">Description</div>
                                <div className="ap-detail-desc">{selectedCase.description}</div>

                                {selectedCase.attachments && selectedCase.attachments.length > 0 && (
                                    <>
                                        <div className="ap-detail-label">Attachments ({selectedCase.attachments.length})</div>
                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
                                            {selectedCase.attachments.map((att, i) => (
                                                <a key={i} href={att.url} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', padding: '4px', background: '#f8fafc', textDecoration: 'none' }}>
                                                    {att.url.startsWith('data:image') || att.url.includes('.jpg') || att.url.includes('.png') || att.url.includes('.jpeg') ? (
                                                        <img src={att.url} alt={att.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                                                    ) : (
                                                        <div style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', color: '#475569', fontSize: '24px', borderRadius: '4px' }}>📎</div>
                                                    )}
                                                    <div style={{ fontSize: '10px', color: '#475569', padding: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px', textAlign: 'center' }}>{att.name}</div>
                                                </a>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="ap-detail-label">Timeline</div>
                                <div className="ap-timeline">
                                    {selectedCase.timeline.map((t, i) => (
                                        <div key={i} className="ap-timeline-item">
                                            <div className="ap-timeline-dot" />
                                            <div className="ap-timeline-body">
                                                <div className="ap-timeline-event">{t.event}</div>
                                                <div className="ap-timeline-meta">{t.date} · {t.by}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="ap-detail-actions">
                                    <button className="ap-btn-primary" onClick={() => { setNewStatus(selectedCase.status); setShowStatusModal(true); }}>Update Status</button>
                                    <button className="ap-btn-outline" onClick={() => window.open(`mailto:?subject=Re: ${selectedCase.id}`)}>Send Email</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Analytics Tab ── */}
                {tab === "analytics" && (
                    <div className="ap-content">
                        <div className="ap-kpi-grid">
                            {[
                                { label: "Total Filed", value: "2,845", sub: "This financial year" },
                                { label: "Resolution Rate", value: "87.4%", sub: "Above national avg" },
                                { label: "Avg Response Time", value: "18 hrs", sub: "First response" },
                                { label: "Citizen Satisfaction", value: "4.2/5", sub: "Based on feedback" },
                            ].map((k, i) => <div key={i} className="ap-kpi-card" style={{ gridTemplateColumns: "1fr" }}><div className="ap-kpi-label">{k.label}</div><div className="ap-kpi-value" style={{ color: "#001F3D", fontSize: "28px" }}>{k.value}</div><div className="ap-kpi-sub" style={{ color: "#6b7280" }}>{k.sub}</div></div>)}
                        </div>
                        <div className="ap-charts-grid">
                            <div className="ap-card" style={{ gridColumn: "span 2" }}>
                                <div className="ap-card-header"><span className="ap-card-title">Cases by Status Distribution</span></div>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={byStatus}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                                        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                                        <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                                        <Bar dataKey="count" name="Cases" radius={[6, 6, 0, 0]}>
                                            {byStatus.map((e, i) => <Cell key={i} fill={Object.values(SCOLORS)[i]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="ap-card">
                                <div className="ap-card-header"><span className="ap-card-title">Dept. Load</span></div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={byDept} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
                                            {byDept.map((e, i) => <Cell key={i} fill={["#001F3D", "#1d4ed8", "#0891b2", "#059669", "#d97706", "#dc2626"][i]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Settings Tab ── */}
                {tab === "settings" && (
                    <div className="ap-content">
                        <div className="ap-card" style={{ maxWidth: "540px" }}>
                            <div className="ap-card-header"><span className="ap-card-title">System Configuration</span></div>
                            {[
                                { label: "Portal Name", value: "Samadhana AI" },
                                { label: "Admin Email", value: "jansevaaiportal@gmail.com" },
                                { label: "SLA – Critical (hrs)", value: "24" },
                                { label: "SLA – High (hrs)", value: "48" },
                                { label: "SLA – Medium (hrs)", value: "72" },
                            ].map((f, i) => (
                                <div key={i} className="ap-settings-row">
                                    <label className="ap-settings-label">{f.label}</label>
                                    <input className="ap-settings-input" defaultValue={f.value} />
                                </div>
                            ))}
                            <button className="ap-btn-primary" style={{ marginTop: "16px" }}>Save Changes</button>
                        </div>
                    </div>
                )}
            </main>

            {/* ── Status Modal ── */}
            {showStatusModal && (
                <div className="ap-modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="ap-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="ap-modal-title">Update Status</h3>
                        <p className="ap-modal-sub">{selectedCase?.display_id} — {selectedCase?.title}</p>
                        <select className="ap-select" style={{ width: "100%", marginBottom: "12px" }} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                            {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <textarea className="ap-textarea" placeholder="Add a remark (optional)…" value={remark} onChange={e => setRemark(e.target.value)} />
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
                            <button className="ap-btn-outline" onClick={() => setShowStatusModal(false)}>Cancel</button>
                            <button className="ap-btn-primary" onClick={handleUpdateStatus}>Confirm Update</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CaseTable({ cases, onSelect, selected, loading }) {
    return (
        <table className="ap-table">
            <thead>
                <tr>
                    <th>Case ID / Citizen</th>
                    <th>Issue</th>
                    <th>Dept</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Days</th>
                </tr>
            </thead>
            <tbody>
                {cases.map(c => (
                    <tr key={c.id} className={selected?.id === c.id ? "selected" : ""} onClick={() => onSelect(c)}>
                        <td>
                            <div className="ap-case-id">{c.display_id}</div>
                            <div className="ap-case-citizen">{c.citizen}</div>
                        </td>
                        <td>
                            <div className="ap-case-title">{c.title}</div>
                            <div className="ap-case-loc">📍 {c.location}</div>
                        </td>
                        <td className="ap-muted">{c.dept}</td>
                        <td><span className="ap-priority-badge" style={{ color: PCOLORS[c.priority], background: `${PCOLORS[c.priority]}15` }}>{c.priority}</span></td>
                        <td><span className="ap-status-badge" style={{ color: SCOLORS[c.status], background: `${SCOLORS[c.status]}15` }}>{c.status}</span></td>
                        <td className={c.timeOpen > 7 ? "ap-days-warn" : "ap-muted"}>{c.timeOpen}d</td>
                    </tr>
                ))}
                {cases.length < 1 && (
                    <tr>
                        <td colSpan={6} className="ap-empty" style={{ textAlign: "center", padding: "40px 0" }}>
                            {loading ? "Loading..." : "No cases match your filters."}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}

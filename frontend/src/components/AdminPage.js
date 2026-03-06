// ─── AdminPage.jsx ────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  API_URL, toast,
  Pill, StatusPill, Avatar, Card, CardHead, TH, TD, EmptyRow, Btn, StatCard, FilterBar,
  fmtFull, fmtDate, fmtTime,
  OFFICIAL_STATUS_MAP, TIMELINE_COLORS,
  OfficialStatusBadge,
  Sidebar,
} from './Shared';

// ─── Approvals Sub-View ───────────────────────────────────────────────────────
const ApprovalsView = () => {
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState('');
  const load = () =>
    fetch(`${API_URL}/admin/pending-approvals`).then(r => r.json()).then(d => setPending(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const approve = (id) => {
    if (!window.confirm('Approve this user?')) return;
    fetch(`${API_URL}/admin/approve-user/${id}`, { method: 'PUT' }).then(() => { toast('success', 'Approved!'); load(); });
  };
  const rows = pending.filter(u => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()));
  return (
    <Card>
      <CardHead title="Pending Approvals" count={pending.length} />
      <div style={{ padding: '14px 20px 0' }}><FilterBar search={search} onSearch={setSearch} placeholder="Search by name or username..." /></div>
      {rows.length === 0
        ? <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>✅ No pending approvals</div>
        : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><TH>Name</TH><TH>Username</TH><TH>Email</TH><TH>Role</TH><TH>Action</TH></tr></thead>
            <tbody>{rows.map(u => (
              <tr key={u.id} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'} style={{ background: 'white' }}>
                <TD s={{ fontWeight: 600 }}>{u.full_name}</TD>
                <TD s={{ color: '#6B7280' }}>{u.username}</TD>
                <TD s={{ color: '#6B7280' }}>{u.email || '—'}</TD>
                <TD><Pill bg='#E3F2FD' color='#1565C0'>{u.role}</Pill></TD>
                <TD><Btn variant='green' onClick={() => approve(u.id)}>✓ Approve</Btn></TD>
              </tr>
            ))}</tbody>
          </table>}
    </Card>
  );
};

// ─── Reports Sub-View ─────────────────────────────────────────────────────────
const ReportsView = () => {
  const [s, setS] = useState({ total: 0, avgTime: 0, byStatus: [], byCategory: [] });
  useEffect(() => {
    fetch(`${API_URL}/admin/reports`).then(r => r.json()).then(d =>
      setS({ total: d.total || 0, avgTime: d.avgTime || 0, byStatus: d.byStatus || [], byCategory: d.byCategory || [] })
    ).catch(() => {});
  }, []);
  const backlog = s.byStatus.filter(x => ['New', 'Assigned', 'Solving'].includes(x.status)).reduce((a, x) => a + Number(x.count), 0);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard label="Total Tickets" value={s.total} accent='#F97316' />
        <StatCard label="Avg. Resolution" value={`${parseFloat(s.avgTime || 0).toFixed(1)}h`} accent='#10B981' />
        <StatCard label="Current Backlog" value={backlog} accent='#F59E0B' />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHead title="By Status" />
          <div style={{ padding: '16px 20px' }}>
            {s.byStatus.map(x => (
              <div key={x.status} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span style={{ fontWeight: 600 }}>{x.status}</span><span style={{ color: '#6B7280' }}>{x.count}</span></div>
                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3 }}><div style={{ height: '100%', background: '#F97316', borderRadius: 3, width: `${s.total > 0 ? (x.count / s.total) * 100 : 0}%`, transition: 'width .5s' }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead title="By Category" />
          <div style={{ padding: '0 20px 8px' }}>
            {s.byCategory.map(x => (
              <div key={x.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{x.name}</span>
                <Pill bg='#F97316' color='white'>{x.count}</Pill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── Admin Ticket Detail View ─────────────────────────────────────────────────
const AdminTicketDetail = ({ ticket, onBack }) => {
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const commentsEndRef = useRef(null);
  const t = ticket;

  useEffect(() => {
    if (!t?.id) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/tickets/${t.id}/comments`).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/assignee/history/${t.id}`).then(r => r.ok ? r.json() : []),
    ]).then(([c, h]) => {
      setComments(Array.isArray(c) ? c : []);
      setHistory(Array.isArray(h) ? h : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [t?.id]);

  // Auto-refresh
  useEffect(() => {
    if (!t?.id) return;
    const interval = setInterval(() => {
      fetch(`${API_URL}/tickets/${t.id}/comments`).then(r => r.ok ? r.json() : []).then(data => {
        setComments(prev => prev.length !== data.length ? data : prev);
      }).catch(() => {});
      fetch(`${API_URL}/assignee/history/${t.id}`).then(r => r.ok ? r.json() : []).then(data => {
        setHistory(prev => prev.length !== data.length ? data : prev);
      }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [t?.id]);

  useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments.length]);

  const handlePostComment = async () => {
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const r = await fetch(`${API_URL}/tickets/${t.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: 'Admin', message: newComment }),
      });
      if (r.ok) {
        setComments(prev => [...prev, { id: Date.now(), user_name: 'Admin', message: newComment, created_at: new Date().toISOString(), is_admin: true }]);
        setNewComment('');
        toast('success', 'Comment posted');
      }
    } catch { toast('error', 'Error', 'Network error.'); }
    finally { setPosting(false); }
  };

  const statusCfg = OFFICIAL_STATUS_MAP[t.status] || { bg: '#F3F4F6', color: '#6B7280' };

  const timelineItems = [
    { label: 'Ticket created', sub: t.ticket_no || '', time: t.created_at, color: '#10B981', icon: '🎫' },
    ...history.map(h => ({
      label: h.action_type === 'STATUS_CHANGE' ? `${h.old_value || 'New'} → ${h.new_value}` : h.action_type.replace(/_/g, ' '),
      sub: h.performed_by_name || '', time: h.created_at,
      color: h.action_type === 'STATUS_CHANGE'
        ? (h.new_value === 'Solved' ? '#059669' : h.new_value === 'Failed' ? '#EF4444' : '#3B82F6')
        : TIMELINE_COLORS[h.action_type] || TIMELINE_COLORS.default,
      icon: h.action_type === 'STATUS_CHANGE'
        ? (h.new_value === 'Solved' ? '✅' : h.new_value === 'Failed' ? '❌' : '🔄')
        : '📝',
    })),
    ...comments.map(c => ({
      label: `${c.user_name || 'User'} commented`,
      sub: (c.message || '').substring(0, 45) + ((c.message || '').length > 45 ? '…' : ''),
      time: c.created_at, color: '#F97316', icon: '💬',
    })),
  ].filter(i => i.time).sort((a, b) => new Date(a.time) - new Date(b.time));

  const rawPath = t.resolution_path;
  let resolutionSteps = [];
  if (rawPath) {
    if (Array.isArray(rawPath)) resolutionSteps = rawPath.filter(Boolean);
    else { try { const p = JSON.parse(rawPath); resolutionSteps = Array.isArray(p) ? p.filter(Boolean) : [String(rawPath)]; } catch { resolutionSteps = String(rawPath).split(/\n+/).map(s => s.replace(/^\d+[.)\s]*/, '').trim()).filter(Boolean); } }
  }

  return (
    <div style={{ animation: 'fdIn 0.2s ease' }}>
      <style>{`@keyframes fdIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${statusCfg.color}, ${statusCfg.color}88)` }} />
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              {t.ticket_no && <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#F97316', fontWeight: 700, background: '#FFF7ED', padding: '2px 8px', borderRadius: 6, border: '1px solid #FED7AA' }}>{t.ticket_no}</span>}
              <span style={{ fontWeight: 800, fontSize: 16, color: '#1A1A2E' }}>{t.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <OfficialStatusBadge status={t.status} />
              {t.category && <Pill bg='#E3F2FD' color='#1565C0'>{t.category}</Pill>}
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>Created {fmtFull(t.created_at)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
            {t.assignee_name && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Assignee</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Avatar size={22} name={t.assignee_name} /><span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{t.assignee_name}</span></div>
              </div>
            )}
            {t.deadline && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Deadline</div>
                <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{fmtDate(t.deadline)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body: 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 200px', gap: 14, alignItems: 'start' }}>

        {/* Left: Discussion */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', minHeight: 420 }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>💬</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>Discussion</span>
            {comments.length > 0 && <Pill bg='#FFF7ED' color='#F97316'>{comments.length}</Pill>}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', maxHeight: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>⏳ Loading…</div>
            ) : comments.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>No messages yet</div>
              </div>
            ) : comments.map((c, i) => {
              const isAdmin = c.is_admin || c.user_name === 'Admin';
              return (
                <div key={c.id || i} style={{ display: 'flex', flexDirection: isAdmin ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end', animation: 'msgIn 0.2s ease' }}>
                  <Avatar size={30} name={c.user_name || 'User'} img={c.profile_image} />
                  <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: isAdmin ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{c.user_name || 'User'}</span>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>{fmtTime(c.created_at)}</span>
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: isAdmin ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: isAdmin ? 'linear-gradient(135deg,#F97316,#EA580C)' : '#F3F4F6', color: isAdmin ? 'white' : '#1A1A2E', fontSize: 13, lineHeight: 1.6, wordBreak: 'break-word' }}>{c.message}</div>
                  </div>
                </div>
              );
            })}
            <div ref={commentsEndRef} />
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <Avatar size={30} name="Admin" />
              <textarea rows={2} value={newComment} onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handlePostComment(); } }}
                placeholder="Reply as Admin…  Ctrl+Enter to send"
                style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: 'white', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }} />
              <button onClick={handlePostComment} disabled={posting || !newComment.trim()}
                style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: posting || !newComment.trim() ? 0.5 : 1 }}>→</button>
            </div>
          </div>
        </div>

        {/* Middle: Summary + Resolution Path + Assignee Resolution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {t.summary ? (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)' }}>
                <span>✦</span><span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>AI Summary</span>
              </div>
              <div style={{ padding: '14px 16px' }}><p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.75 }}>{t.summary}</p></div>
            </div>
          ) : (
            <div style={{ background: '#FAFAFA', borderRadius: 14, border: '1px dashed #E5E7EB', padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>✦ No AI summary</div>
          )}

          {resolutionSteps.length > 0 && (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#EFF6FF,#EEF2FF)' }}>
                <span>🛠</span><span style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>Resolution Path</span>
                <Pill bg='#DBEAFE' color='#1D4ED8'>{resolutionSteps.length} steps</Pill>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resolutionSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 12, color: '#1E3A5F', lineHeight: 1.65, paddingTop: 3 }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(t.status === 'Solved' || t.status === 'Failed') && t.resolution_comment && (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, background: t.status === 'Solved' ? 'linear-gradient(135deg,#F0FDF4,#ECFDF5)' : 'linear-gradient(135deg,#FEF2F2,#FEF2F2)' }}>
                <span>{t.status === 'Solved' ? '✅' : '❌'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: t.status === 'Solved' ? '#059669' : '#DC2626' }}>Assignee Resolution</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{t.resolution_comment}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden', position: 'sticky', top: 0 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12 }}>🕐</span><span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E' }}>Timeline</span>
          </div>
          <div style={{ padding: '14px 14px', maxHeight: 560, overflowY: 'auto' }}>
            {timelineItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', position: 'relative' }}>
                {i < timelineItems.length - 1 && <div style={{ position: 'absolute', left: 9, top: 18, width: 2, height: 'calc(100% - 4px)', background: `${item.color}22`, zIndex: 0 }} />}
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${item.color}18`, border: `2px solid ${item.color}`, flexShrink: 0, marginTop: 2, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>{item.icon}</div>
                <div style={{ flex: 1, paddingBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.4 }}>{item.label}</div>
                  {item.sub && <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{item.sub}</div>}
                  <div style={{ fontSize: 10, color: '#D1D5DB', marginTop: 3 }}>{fmtTime(item.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Nav config ───────────────────────────────────────────────────────────────
const ADMIN_NAV = [
  { icon: '/dashboard.png', label: 'Dashboard', view: 'dashboard' },
  { icon: '/draft.png', label: 'Draft Tickets', view: 'drafts' },
  { icon: '/ticket.png', label: 'Active Tickets', view: 'official' },
  { icon: '/request.png', label: 'User Requests', view: 'user-requests' },
  { icon: '/users.png', label: 'User Mgmt', view: 'users' },
  { icon: '/reports.png', label: 'Reports', view: 'reports' },
  { icon: '/history.png', label: 'History', view: 'history' },
];

const PAGE_TITLES = {
  dashboard: 'Dashboard', drafts: 'Draft Tickets', official: 'Active Tickets',
  'user-requests': 'User Requests', users: 'User Management',
  reports: 'Reports', history: 'Ticket History',
};

// ─── AdminPage ────────────────────────────────────────────────────────────────
function AdminPage({ username, userEmail, onLogout, profileImage, createNewAdmin, createTeam, userId }) {
  const [view, setView] = useState('dashboard');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null); // for active ticket detail
  const [drafts, setDrafts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selDrafts, setSelDrafts] = useState([]);
  const [dSearch, setDSearch] = useState(''); const [dFilter, setDFilter] = useState('all');
  const [oSearch, setOSearch] = useState(''); const [oFilter, setOFilter] = useState('all');
  const [rSearch, setRSearch] = useState(''); const [rFilter, setRFilter] = useState('all');
  const [uSearch, setUSearch] = useState(''); const [uFilter, setUFilter] = useState('all');
  const [hSearch, setHSearch] = useState('');

  const toArr = d => Array.isArray(d) ? d : [];

  useEffect(() => { loadAll(); loadAssignees(); }, []);
  useEffect(() => { if (view === 'history') loadHistory(); }, [view]);
  // Clear ticket detail when navigating away from official
  useEffect(() => { if (view !== 'official') setSelectedTicket(null); }, [view]);

  const loadAll = async () => {
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        fetch(`${API_URL}/admin/user-requests`), fetch(`${API_URL}/admin/draft-tickets`),
        fetch(`${API_URL}/admin/official-tickets`), fetch(`${API_URL}/admin/users`),
        fetch(`${API_URL}/categories`),
      ]);
      const [d1, d2, d3, d4, d5] = await Promise.all([
        r1.ok ? r1.json().catch(() => []) : [], r2.ok ? r2.json().catch(() => []) : [],
        r3.ok ? r3.json().catch(() => []) : [], r4.ok ? r4.json().catch(() => []) : [],
        r5.ok ? r5.json().catch(() => []) : [],
      ]);
      setRequests(toArr(d1)); setDrafts(toArr(d2)); setTickets(toArr(d3));
      setUsers(toArr(d4)); setCategories(toArr(d5));
    } catch (e) { console.error(e); }
  };

  const loadAssignees = async () => {
    try { const r = await fetch(`${API_URL}/users/assignees`); if (!r.ok) return; setAssignees(toArr(await r.json().catch(() => []))); } catch {}
  };

  const loadHistory = async () => {
    try { const r = await fetch(`${API_URL}/ticket-history?userId=${userId}&role=admin`); if (!r.ok) return; setHistory(toArr(await r.json().catch(() => []))); } catch {}
  };

  const navigate = (v) => { setView(v); setSelectedTask(null); setSelectedTicket(null); };

  // ── Actions ───────────────────────────────────────────────────────────────────
  const saveDraft = async (id, fields) => {
    try {
      setLoading(true);
      const f = { ...fields };
      if (f.deadline) f.deadline = f.deadline.replace('T', ' ').substring(0, 19);
      const r = await fetch(`${API_URL}/admin/draft-tickets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      if (r.ok) { setDrafts(p => p.map(d => d.id === id ? { ...d, ...f } : d)); toast('success', 'Saved!'); }
      else { const e = await r.json(); throw new Error(e.message); }
    } catch (e) { toast('error', 'Error', e.message); }
    finally { setLoading(false); }
  };

  const approveToOfficial = async (draft) => {
    if (!draft.assigned_to) { toast('warning', 'No Assignee', 'Please assign someone first.'); return; }
    try {
      const r = await fetch(`${API_URL}/admin/approve-ticket`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: draft.id, title: draft.title, category: draft.category || draft.ai_category_name, summary: draft.summary, resolution_path: draft.resolution_path, assignee_id: draft.assigned_to, userRequestId: draft.linked_requests?.[0]?.id || null, deadline: draft.deadline })
      });
      if (r.ok) { toast('success', 'Approved!', 'Moved to Active Tickets.'); setSelectedTask(null); loadAll(); }
      else { const e = await r.json(); toast('error', 'Error', e.message); }
    } catch (e) { console.error(e); }
  };

  const mergeDrafts = async (ids) => {
    if (!window.confirm(`Merge ${ids.length} tickets?`)) return;
    try {
      const r = await fetch(`${API_URL}/admin/merge-tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketIds: ids }) });
      const d = await r.json();
      if (r.ok) {
        toast('success', 'Merged!', 'Opening merged ticket…');
        setSelDrafts([]);
        setDFilter('all');
        setDSearch('');
        setView('drafts');
        setSelectedTask(null);
        // Reload fresh drafts
        const fresh = await fetch(`${API_URL}/admin/draft-tickets`).then(res => res.ok ? res.json() : []).catch(() => []);
        const freshArr = Array.isArray(fresh) ? fresh : [];
        setDrafts(freshArr);
        loadAll();
        // Find the merged result ticket (newest non-Merged draft, or by returned ID)
        const mergedId = d.mergedId || d.id || d.newDraftId;
        const validDrafts = freshArr.filter(dr => dr.status !== 'Merged');
        const merged = mergedId
          ? (validDrafts.find(dr => dr.id === mergedId) || validDrafts.sort((a, b) => b.id - a.id)[0])
          : validDrafts.sort((a, b) => b.id - a.id)[0];
        if (merged) setTimeout(() => setSelectedTask(merged), 150);
      } else toast('error', 'Error', d.message);
    } catch { toast('error', 'Error', 'Merge failed.'); }
  };

  const unlinkRequest = async (requestId, draftId) => {
    if (!window.confirm(`Unlink Request #${requestId} into a separate draft?`)) return;
    try {
      const r = await fetch(`${API_URL}/admin/unlink-request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, currentDraftId: draftId }) });
      const d = await r.json();
      if (r.ok) { toast('success', 'Unlinked', `Draft #${d.newDraftId} created.`); setSelectedTask(null); loadAll(); }
      else toast('error', 'Error', d.error);
    } catch (e) { console.error(e); }
  };

  const saveUser = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_URL}/admin/users/${selectedTask.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: selectedTask.full_name, role: selectedTask.role, skills: selectedTask.skills }) });
      if (r.ok) { toast('success', 'Saved!'); setSelectedTask(null); loadAll(); }
      else throw new Error('Failed');
    } catch (e) { toast('error', 'Error', e.message); }
    finally { setLoading(false); }
  };

  const toggleSkill = (id) => { const cur = selectedTask.skills || []; setSelectedTask({ ...selectedTask, skills: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] }); };
  const toggleSelDraft = (id) => setSelDrafts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const getAssigneeName = id => assignees.find(a => String(a.id) === String(id))?.username;

  // ── Render: Draft Edit ─────────────────────────────────────────────────────────
  const renderDraftEdit = () => (
    <Card>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => setSelectedTask(null)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E' }}>Ticket #{selectedTask.id}</span>
            <StatusPill s={selectedTask.status} />
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Created {fmtDate(selectedTask.created_at)}</div>
        </div>
        <Btn variant='outline' onClick={() => saveDraft(selectedTask.id, selectedTask)} disabled={loading}>💾 Save Draft</Btn>
        <Btn variant='primary' onClick={() => approveToOfficial(selectedTask)} disabled={loading}>✓ Approve & Submit</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr' }}>
        <div style={{ padding: 24, borderRight: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ticket Details</div>
          {[{ label: 'Title', field: 'title' }, { label: 'Category', field: 'category' }].map(({ label, field }) => (
            <div key={field}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{label}</label>
              <input value={selectedTask[field] || ''} onChange={e => setSelectedTask({ ...selectedTask, [field]: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#F9FAFB', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Assignee</label>
            {(() => {
              const cat = (selectedTask.category || selectedTask.ai_category_name || '').toLowerCase();
              const suggested = assignees.filter(a =>
                a.skill_names && a.skill_names.toLowerCase().split(',').some(s => s.trim() && cat.includes(s.trim()))
              );
              return (
                <>
                  {suggested.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>✦ AI Suggested</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {suggested.map(a => (
                          <button key={a.id} onClick={() => setSelectedTask({ ...selectedTask, assigned_to: String(a.id) })}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: `1.5px solid ${String(selectedTask.assigned_to) === String(a.id) ? '#8B5CF6' : '#E9D5FF'}`, background: String(selectedTask.assigned_to) === String(a.id) ? '#F5F3FF' : 'white', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{a.username?.charAt(0).toUpperCase()}</div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E' }}>{a.username}</div>
                              <div style={{ fontSize: 10, color: '#8B5CF6' }}>{a.skill_names}</div>
                            </div>
                            {String(selectedTask.assigned_to) === String(a.id) && <span style={{ marginLeft: 'auto', color: '#8B5CF6', fontSize: 12 }}>✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <select value={selectedTask.assigned_to || ''} onChange={e => setSelectedTask({ ...selectedTask, assigned_to: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#F9FAFB', outline: 'none', cursor: 'pointer' }}>
                    <option value="">— Select Assignee —</option>
                    {assignees.map(a => <option key={a.id} value={a.id}>{a.username}{suggested.some(s => s.id === a.id) ? ' ✦' : ''}</option>)}
                  </select>
                </>
              );
            })()}
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Due Date</label>
            <input type="datetime-local" value={selectedTask.deadline ? selectedTask.deadline.substring(0, 16) : ''}
              onChange={e => setSelectedTask({ ...selectedTask, deadline: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#F9FAFB', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Original Messages</div>
            {selectedTask.linked_requests?.length > 0
              ? selectedTask.linked_requests.map((req, i) => (
                <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>#{req.id} · {req.user_email}</div>
                    <div style={{ fontSize: 12, color: '#1A1A2E', fontStyle: 'italic' }}>"{req.message}"</div>
                  </div>
                  {selectedTask.linked_requests.length > 1 && (
                    <button onClick={() => unlinkRequest(req.id, selectedTask.id)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>✂</button>
                  )}
                </div>
              ))
              : <p style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>No linked requests</p>}
          </div>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>✦ AI Summary</div>
            <textarea rows={5} value={selectedTask.summary || ''} onChange={e => setSelectedTask({ ...selectedTask, summary: e.target.value })}
              style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, fontSize: 13, resize: 'vertical', outline: 'none', background: '#F9FAFB', boxSizing: 'border-box', lineHeight: 1.6 }} />
          </div>
          {selectedTask.resolution_path?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Resolution Path</div>
              {selectedTask.resolution_path.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ minWidth: 22, height: 22, borderRadius: '50%', background: '#F97316', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>{i + 1}</span>
                  <textarea rows={2} value={step} onChange={e => { const p = [...selectedTask.resolution_path]; p[i] = e.target.value; setSelectedTask({ ...selectedTask, resolution_path: p }); }}
                    style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12, resize: 'none', background: '#F9FAFB', outline: 'none', lineHeight: 1.5 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <Btn variant='ghost' onClick={() => selDrafts.length > 1 && mergeDrafts(selDrafts)}>⊕ Merge with Selected</Btn>
      </div>
    </Card>
  );

  // ── Render: User Edit ──────────────────────────────────────────────────────────
  const renderUserEdit = () => (
    <Card>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => setSelectedTask(null)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 16 }}>←</button>
        <Avatar img={selectedTask.profile_image} size={40} />
        <div><div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E' }}>{selectedTask.full_name}</div><div style={{ fontSize: 12, color: '#9CA3AF' }}>@{selectedTask.username}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ padding: 24, borderRight: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Account Info</div>
          {[{ label: 'Full Name', field: 'full_name' }, { label: 'Username', field: 'username' }].map(({ label, field }) => (
            <div key={field} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{label}</label>
              <input defaultValue={selectedTask[field]} onChange={e => setSelectedTask({ ...selectedTask, [field]: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#F9FAFB', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Role</label>
            <select defaultValue={selectedTask.role} disabled={selectedTask.role === 'admin'} onChange={e => setSelectedTask({ ...selectedTask, role: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#F9FAFB', outline: 'none', cursor: selectedTask.role === 'admin' ? 'not-allowed' : 'pointer', opacity: selectedTask.role === 'admin' ? 0.6 : 1 }}>
              <option value="user">User</option><option value="assignee">Assignee</option><option value="admin">Admin</option>
            </select>
            {selectedTask.role === 'admin' && <small style={{ color: '#EF4444', fontSize: 11 }}>Admin role cannot be changed</small>}
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>Skills & Categories</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {categories.map(cat => {
              const checked = selectedTask.skills?.includes(cat.id);
              return (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: `1px solid ${checked ? '#F97316' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: checked ? '#FFF7ED' : 'white', transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={checked || false} onChange={() => toggleSkill(cat.id)} style={{ accentColor: '#F97316' }} />
                  <span style={{ fontSize: 12, fontWeight: checked ? 600 : 400, color: checked ? '#EA580C' : '#374151' }}>{cat.name}</span>
                </label>
              );
            })}
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn variant='primary' onClick={saveUser} disabled={loading}>Save Changes</Btn>
          </div>
        </div>
      </div>
    </Card>
  );

  // ── Render: Drafts Table ───────────────────────────────────────────────────────
  const renderDrafts = () => {
    const allDrafts = drafts.filter(d => d.status !== 'Merged');
    const rows = allDrafts
      .filter(d => dFilter === 'all' || d.status === dFilter)
      .filter(d => !dSearch || [d.title, d.summary, d.category].some(v => v?.toLowerCase().includes(dSearch.toLowerCase())));

    const needsAction = allDrafts.filter(d => d.status === 'Draft' && !d.assigned_to);
    const readyToApprove = allDrafts.filter(d => d.status === 'Draft' && d.assigned_to);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* ── Action Required Banner ── */}
        {needsAction.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: '1px solid #FCD34D', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#92400E' }}>{needsAction.length} ticket{needsAction.length !== 1 ? 's' : ''} need an assignee</div>
                <div style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>These drafts cannot be approved until someone is assigned.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Btn variant='warning' onClick={() => { setDFilter('Draft'); setDSearch(''); }}>View Unassigned</Btn>
            </div>
          </div>
        )}

        {/* ── Ready to Approve Banner ── */}
        {readyToApprove.length > 0 && (
          <div style={{ background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)', border: '1px solid #6EE7B7', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#065F46' }}>{readyToApprove.length} ticket{readyToApprove.length !== 1 ? 's' : ''} ready to approve</div>
                <div style={{ fontSize: 11, color: '#047857', marginTop: 2 }}>Assigned and waiting for your approval.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', maxWidth: 360 }}>
              {readyToApprove.slice(0, 3).map(t => (
                <button key={t.id} onClick={() => setSelectedTask(t)}
                  style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #6EE7B7', background: 'white', fontSize: 11, fontWeight: 600, color: '#065F46', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  #{t.id} {(t.title || '').substring(0, 18)}{(t.title || '').length > 18 ? '…' : ''}
                </button>
              ))}
              {readyToApprove.length > 3 && <span style={{ fontSize: 11, color: '#047857', alignSelf: 'center' }}>+{readyToApprove.length - 3} more</span>}
            </div>
          </div>
        )}

        <Card>
          <CardHead title="Draft Tickets" count={rows.length} right={
            <div style={{ display: 'flex', gap: 8 }}>
              {selDrafts.length > 1 && <Btn variant='warning' onClick={() => mergeDrafts(selDrafts)}>⊕ Merge ({selDrafts.length})</Btn>}
            </div>
          } />
          <div style={{ padding: '14px 20px 0' }}>
            <FilterBar search={dSearch} onSearch={setDSearch} filter={dFilter} onFilter={setDFilter} placeholder="Search title, category, summary..."
              filterOpts={[{ value: 'all', label: 'All Status' }, { value: 'Draft', label: 'Draft' }, { value: 'Submitted', label: 'Submitted' }]} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH s={{ width: 36 }} /><TH>ID</TH><TH>Title</TH><TH>Category</TH><TH>Assignee</TH><TH>Date</TH><TH>Status</TH><TH>Actions</TH></tr></thead>
              <tbody>
                {rows.map(item => {
                  const sel = selDrafts.includes(item.id);
                  const unassigned = item.status === 'Draft' && !item.assigned_to;
                  const ready = item.status === 'Draft' && item.assigned_to;
                  return (
                    <tr key={item.id}
                      style={{ background: sel ? '#FFF7ED' : unassigned ? '#FFFBEB' : 'white' }}
                      onMouseEnter={e => e.currentTarget.style.background = sel ? '#FFF7ED' : '#FAFAFA'}
                      onMouseLeave={e => e.currentTarget.style.background = sel ? '#FFF7ED' : unassigned ? '#FFFBEB' : 'white'}>
                      <TD s={{ width: 36 }}><input type="checkbox" checked={sel} onChange={() => toggleSelDraft(item.id)} style={{ accentColor: '#F97316', cursor: 'pointer' }} /></TD>
                      <TD s={{ fontWeight: 700, color: '#9CA3AF' }}>{item.id}</TD>
                      <TD>
                        <div style={{ fontWeight: 600, color: '#1A1A2E', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {item.title}
                          {item.linked_requests?.length > 1 && <Pill bg='#E3F2FD' color='#1565C0'>⊕{item.linked_requests.length}</Pill>}
                          {unassigned && <Pill bg='#FEF3C7' color='#92400E'>Needs Assignee</Pill>}
                          {ready && <Pill bg='#D1FAE5' color='#065F46'>Ready</Pill>}
                        </div>
                        {item.summary && <div style={{ fontSize: 11, color: '#9CA3AF', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.summary}</div>}
                      </TD>
                      <TD><Pill bg='#E3F2FD' color='#1565C0'>{item.category || item.ai_category_name || 'Uncategorized'}</Pill></TD>
                      <TD>
                        {getAssigneeName(item.assigned_to)
                          ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar size={24} name={getAssigneeName(item.assigned_to)} /><span style={{ fontSize: 12 }}>{getAssigneeName(item.assigned_to)}</span></div>
                          : <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>⚠ Unassigned</span>}
                      </TD>
                      <TD s={{ fontSize: 12, color: '#9CA3AF' }}>{fmtDate(item.created_at)}</TD>
                      <TD><StatusPill s={item.status} /></TD>
                      <TD>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn variant='ghost' onClick={() => setSelectedTask(item)}>Edit ›</Btn>
                          {ready && <Btn variant='green' onClick={async (e) => { e.stopPropagation(); await approveToOfficial(item); }}>✓ Approve</Btn>}
                        </div>
                      </TD>
                    </tr>
                  );
                })}
                {rows.length === 0 && <EmptyRow cols={8} />}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  // ── Render: Official Tickets Table ─────────────────────────────────────────────
  const renderOfficial = () => {
    const rows = tickets.filter(t => oFilter === 'all' || t.status === oFilter).filter(t => !oSearch || [t.title, t.ticket_no, t.assignee_name, t.category].some(v => v?.toLowerCase().includes(oSearch.toLowerCase())));
    return (
      <Card>
        <CardHead title="Active Tickets" count={rows.length} />
        <div style={{ padding: '14px 20px 0' }}>
          <FilterBar search={oSearch} onSearch={setOSearch} filter={oFilter} onFilter={setOFilter} placeholder="Search title, ticket no, assignee..."
            filterOpts={[{ value: 'all', label: 'All Status' }, { value: 'New', label: 'New' }, { value: 'Assigned', label: 'Assigned' }, { value: 'Solving', label: 'Solving' }, { value: 'Solved', label: 'Solved' }, { value: 'Failed', label: 'Failed' }]} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><TH>Ticket No</TH><TH>Title</TH><TH>Category</TH><TH>Assignee</TH><TH>Status</TH><TH>Deadline</TH><TH>Updated</TH></tr></thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id} onClick={() => setSelectedTicket(t)} style={{ background: 'white', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <TD s={{ fontWeight: 700, color: '#F97316', fontFamily: 'monospace' }}>{t.ticket_no || `#${t.id}`}</TD>
                  <TD><div style={{ fontWeight: 600, color: '#1A1A2E' }}>{t.title}</div>{t.summary && <div style={{ fontSize: 11, color: '#9CA3AF', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.summary}</div>}</TD>
                  <TD><Pill bg='#E3F2FD' color='#1565C0'>{t.category || 'IT Support'}</Pill></TD>
                  <TD><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar size={24} name={t.assignee_name} /><span style={{ fontSize: 12 }}>{t.assignee_name || 'Unassigned'}</span></div></TD>
                  <TD><StatusPill s={t.status} /></TD>
                  <TD s={{ fontSize: 12, color: '#9CA3AF' }}>{fmtFull(t.deadline)}</TD>
                  <TD s={{ fontSize: 12, color: '#9CA3AF' }}>{t.updated_at ? fmtDate(t.updated_at) : '—'}</TD>
                </tr>
              ))}
              {rows.length === 0 && <EmptyRow cols={7} />}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  // ── Render: Requests Table ─────────────────────────────────────────────────────
  const renderRequests = () => {
    const rows = requests.filter(r => rFilter === 'all' || r.status === rFilter).filter(r => !rSearch || [r.message, r.user_email].some(v => v?.toLowerCase().includes(rSearch.toLowerCase())));
    return (
      <Card>
        <CardHead title="User Requests" count={rows.length} />
        <div style={{ padding: '14px 20px 0' }}>
          <FilterBar search={rSearch} onSearch={setRSearch} filter={rFilter} onFilter={setRFilter} placeholder="Search by message or email..."
            filterOpts={[{ value: 'all', label: 'All Status' }, { value: 'received', label: 'Received' }, { value: 'draft', label: 'Draft' }, { value: 'ticket', label: 'Ticket' }]} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>ID</TH><TH>Message</TH><TH>User</TH><TH>Status</TH><TH>Date</TH></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ background: 'white' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <TD s={{ fontWeight: 700, color: '#9CA3AF' }}>{r.id}</TD>
                <TD s={{ fontWeight: 500, color: '#1A1A2E' }}>{r.message}</TD>
                <TD s={{ fontSize: 12, color: '#6B7280' }}>{r.user_email}</TD>
                <TD><StatusPill s={r.status} /></TD>
                <TD s={{ fontSize: 12, color: '#9CA3AF' }}>{fmtFull(r.created_at)}</TD>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow cols={5} />}
          </tbody>
        </table>
      </Card>
    );
  };

  // ── Render: Users Table ────────────────────────────────────────────────────────
  const renderUsers = () => {
    const rows = users.filter(u => uFilter === 'all' || u.role === uFilter).filter(u => !uSearch || [u.username, u.full_name, u.email].some(v => v?.toLowerCase().includes(uSearch.toLowerCase())));
    return (
      <Card>
        <CardHead title="All Users" count={rows.length} right={
          <div style={{ display: 'flex', gap: 8 }}>
            {createTeam && <Btn variant='ghost' onClick={createTeam}>👥 Create Team</Btn>}
            {createNewAdmin && <Btn variant='primary' onClick={createNewAdmin}>+ Add Admin</Btn>}
          </div>
        } />
        <div style={{ padding: '14px 20px 0' }}>
          <FilterBar search={uSearch} onSearch={setUSearch} filter={uFilter} onFilter={setUFilter} placeholder="Search by name, username, email..."
            filterOpts={[{ value: 'all', label: 'All Roles' }, { value: 'admin', label: 'Admin' }, { value: 'assignee', label: 'Assignee' }, { value: 'user', label: 'User' }]} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>User</TH><TH>Role</TH><TH>Skills</TH><TH s={{ textAlign: 'right' }}>Action</TH></tr></thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} style={{ background: 'white' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <TD><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar img={u.profile_image} size={34} /><div><div style={{ fontWeight: 600, color: '#1A1A2E', fontSize: 13 }}>{u.full_name || u.username}</div><div style={{ color: '#9CA3AF', fontSize: 11 }}>@{u.username}</div></div></div></TD>
                <TD><Pill bg={u.role === 'admin' ? '#FFEBEE' : u.role === 'assignee' ? '#E3F2FD' : '#F3F4F6'} color={u.role === 'admin' ? '#C62828' : u.role === 'assignee' ? '#1565C0' : '#6B7280'}>{u.role}</Pill></TD>
                <TD><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{u.skill_names ? u.skill_names.split(',').map((sk, i) => <Pill key={i} bg='#E3F2FD' color='#1565C0'>{sk.trim()}</Pill>) : <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>}</div></TD>
                <TD s={{ textAlign: 'right' }}><Btn variant='ghost' onClick={() => setSelectedTask({ ...u, skills: u.skill_ids ? u.skill_ids.split(',').map(Number) : [] })}>Manage</Btn></TD>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow cols={4} />}
          </tbody>
        </table>
      </Card>
    );
  };

  // ── Render: History Table ──────────────────────────────────────────────────────
  const openTicketFromHistory = async (ticketId) => {
    // First try to find in already-loaded active tickets
    const found = tickets.find(t => String(t.id) === String(ticketId) || t.ticket_no === String(ticketId));
    if (found) { setSelectedTicket(found); setView('official'); return; }
    // Otherwise fetch it directly
    try {
      const r = await fetch(`${API_URL}/admin/official-tickets`);
      if (!r.ok) return;
      const all = await r.json();
      const match = Array.isArray(all) ? all.find(t => String(t.id) === String(ticketId)) : null;
      if (match) { setTickets(all); setSelectedTicket(match); setView('official'); }
      else toast('warning', 'Not found', `Ticket #${ticketId} is not in Active Tickets.`);
    } catch { toast('error', 'Error', 'Could not load ticket.'); }
  };

  const renderHistory = () => {
    const rows = history.filter(h => !hSearch || String(h.ticket_id).includes(hSearch) || h.action_type?.toLowerCase().includes(hSearch.toLowerCase()) || h.performed_by_name?.toLowerCase().includes(hSearch.toLowerCase()));
    return (
      <Card>
        <CardHead title="Ticket History" count={rows.length} right={<Pill bg='#F3F4F6' color='#6B7280'>👁 Click a row to view ticket</Pill>} />
        <div style={{ padding: '14px 20px 0' }}><FilterBar search={hSearch} onSearch={setHSearch} placeholder="Search by ticket ID, action, or user..." /></div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>Ticket</TH><TH>Action</TH><TH>Change</TH><TH>Performed By</TH><TH>Time</TH><TH></TH></tr></thead>
          <tbody>
            {rows.map((log, i) => (
              <tr key={i} style={{ background: 'white', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                onClick={() => openTicketFromHistory(log.ticket_id)}>
                <TD>
                  <span style={{ fontWeight: 700, color: '#F97316', fontFamily: 'monospace', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                    #{log.ticket_id}
                  </span>
                </TD>
                <TD><StatusPill s={log.action_type} /></TD>
                <TD><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>{log.old_value || '—'}</span><span style={{ color: '#F97316', fontSize: 12 }}>→</span><span style={{ fontSize: 12, fontWeight: 600 }}>{log.new_value}</span></div></TD>
                <TD s={{ fontSize: 12 }}>{log.performed_by_name || `#${log.performed_by}`}</TD>
                <TD s={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(log.created_at).toLocaleString('th-TH')}</TD>
                <TD s={{ textAlign: 'right' }}><span style={{ fontSize: 11, color: '#9CA3AF' }}>View →</span></TD>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow cols={6} />}
          </tbody>
        </table>
      </Card>
    );
  };

  // ── Render: Dashboard ──────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard label="Total Drafts" value={drafts.length} sub={`${drafts.filter(d => d.status === 'Draft').length} pending`} accent='#F97316' />
        <StatCard label="Pending Review" value={drafts.filter(d => d.status === 'Draft').length} sub="awaiting action" accent='#F59E0B' />
        <StatCard label="Active Tickets" value={tickets.length} sub={`${tickets.filter(t => t.status === 'New').length} new`} accent='#3B82F6' />
        <StatCard label="Resolved" value={tickets.filter(t => t.status === 'Solved').length} sub="tickets solved" accent='#10B981' />
      </div>
      <Card>
        <CardHead title="Recent Draft Tickets" count={Math.min(drafts.length, 8)}
          right={<button onClick={() => navigate('drafts')} style={{ background: '#FFF7ED', border: '1px solid #FDBA74', color: '#EA580C', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View All →</button>}
        />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>Title</TH><TH>Category</TH><TH>Assignee</TH><TH>Created</TH><TH>Status</TH></tr></thead>
          <tbody>
            {drafts.slice(0, 8).map((t, i) => (
              <tr key={i} style={{ cursor: 'pointer', background: 'white' }} onClick={() => { navigate('drafts'); setSelectedTask(t); }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <TD s={{ fontWeight: 600, color: '#1A1A2E' }}>{t.title}</TD>
                <TD><Pill bg='#E3F2FD' color='#1565C0'>{t.category || 'Uncategorized'}</Pill></TD>
                <TD s={{ fontSize: 12, color: '#6B7280' }}>{getAssigneeName(t.assigned_to) || <span style={{ color: '#EF4444' }}>Unassigned</span>}</TD>
                <TD s={{ fontSize: 12, color: '#9CA3AF' }}>{fmtDate(t.created_at)}</TD>
                <TD><StatusPill s={t.status} /></TD>
              </tr>
            ))}
            {drafts.length === 0 && <EmptyRow cols={5} msg="No draft tickets yet." />}
          </tbody>
        </table>
      </Card>
    </div>
  );

  // ── Content router ─────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (view === 'official' && selectedTicket) return <AdminTicketDetail ticket={selectedTicket} onBack={() => setSelectedTicket(null)} />;
    if (view === 'drafts' && selectedTask) return renderDraftEdit();
    if (view === 'users' && selectedTask) return renderUserEdit();
    switch (view) {
      case 'dashboard': return renderDashboard();
      case 'drafts': return renderDrafts();
      case 'official': return renderOfficial();
      case 'user-requests': return renderRequests();
      case 'users': return renderUsers();
      case 'reports': return <ReportsView />;
      case 'history': return renderHistory();
      default: return null;
    }
  };

  // Breadcrumb label for topbar
  const detailLabel = selectedTicket?.title || selectedTask?.title || selectedTask?.full_name;

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F5F5F5', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <Sidebar navItems={ADMIN_NAV} activeView={view} onNavigate={navigate} onLogout={onLogout} profileImage={profileImage} username={username} userEmail={userEmail} role="admin" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'white', height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{PAGE_TITLES[view]}</span>
            {detailLabel && (<><span style={{ color: '#D1D5DB', fontSize: 14 }}>›</span><span style={{ fontSize: 13, color: '#6B7280' }}>{detailLabel}</span></>)}
          </div>
        </div>
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>{renderContent()}</div>
      </div>
    </div>
  );
}

export default AdminPage;
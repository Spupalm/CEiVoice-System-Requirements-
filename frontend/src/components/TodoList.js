import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import AssigneeDashboard from './AssigneeDashboard';

const API_URL = process.env.REACT_APP_API_URL;

// ─── Toast ────────────────────────────────────────────────────────────────────
const toast = (icon, title, text = '') => {
  const colors = { success: '#10B981', error: '#EF4444', warning: '#F59E0B' };
  const el = document.createElement('div');
  el.innerHTML = `<div style="position:fixed;top:20px;right:20px;z-index:9999;background:white;border-radius:10px;padding:14px 18px;box-shadow:0 8px 24px rgba(0,0,0,0.12);border-left:4px solid ${colors[icon] || '#9CA3AF'};min-width:260px;animation:ti .25s ease"><strong style="color:#111;font-size:13px;display:block">${title}</strong>${text ? `<span style="font-size:12px;color:#6B7280">${text}</span>` : ''}</div><style>@keyframes ti{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}</style>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
};

// ─── Shared Atoms ─────────────────────────────────────────────────────────────
const Pill = ({ bg = '#F3F4F6', color = '#374151', children }) => (
  <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>{children}</span>
);

const STATUS_MAP = {
  New: ['#E8F5E9', '#2E7D32'], Assigned: ['#E3F2FD', '#1565C0'],
  Solving: ['#FFF3E0', '#E65100'], Solved: ['#E8F5E9', '#2E7D32'],
  Failed: ['#FFEBEE', '#C62828'], Fail: ['#FFEBEE', '#C62828'],
  Draft: ['#FFF3E0', '#F97316'], Submitted: ['#E3F2FD', '#1565C0'],
  Merged: ['#F3E8FF', '#7C3AED'], received: ['#F3F4F6', '#6B7280'],
  draft: ['#FFF3E0', '#F97316'], ticket: ['#E8F5E9', '#2E7D32'],
  STATUS_CHANGE: ['#E8F5E9', '#2E7D32'], SUBMIT_DRAFT: ['#FFF3E0', '#F97316'],
  REASSIGN: ['#E3F2FD', '#1565C0'], COMMENT: ['#F3E8FF', '#7C3AED'],
};
const StatusPill = ({ s }) => {
  const [bg, color] = STATUS_MAP[s] || ['#F3F4F6', '#6B7280'];
  return <Pill bg={bg} color={color}>{s}</Pill>;
};

const Avatar = ({ img, size = 32, name = '' }) => {
  const src = !img ? null : img.startsWith('http') ? img : `http://localhost:5001/uploads/${img}`;
  const initials = name ? name.charAt(0).toUpperCase() : '👤';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <span style={{ color: 'white', fontSize: size * 0.38, fontWeight: 700, lineHeight: 1 }}>{initials}</span>}
    </div>
  );
};

const Card = ({ children, style: s = {} }) => (
  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', ...s }}>{children}</div>
);
const CardHead = ({ title, count, right }) => (
  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>{title}</span>
      {count !== undefined && <Pill bg='#F97316' color='white'>{count}</Pill>}
    </div>
    {right && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{right}</div>}
  </div>
);
const TH = ({ children, s = {} }) => (
  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap', ...s }}>{children}</th>
);
const TD = ({ children, s = {} }) => (
  <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F9FAFB', verticalAlign: 'middle', ...s }}>{children}</td>
);
const EmptyRow = ({ cols, msg = 'No items found.' }) => (
  <tr><td colSpan={cols} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>{msg}</td></tr>
);
const Btn = ({ onClick, disabled, children, variant = 'outline', style: s = {} }) => {
  const V = {
    primary: { background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', border: 'none', boxShadow: '0 2px 8px rgba(249,115,22,0.25)' },
    outline: { background: 'white', color: '#F97316', border: '1px solid #F97316' },
    ghost: { background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB' },
    danger: { background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' },
    warning: { background: '#FFFBEB', color: '#D97706', border: '1px solid #FCD34D' },
    green: { background: '#ECFDF5', color: '#059669', border: '1px solid #6EE7B7' },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...V[variant], padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, whiteSpace: 'nowrap', ...s }}>
      {children}
    </button>
  );
};
const StatCard = ({ label, value, sub, accent = '#F97316' }) => (
  <Card>
    <div style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#1A1A2E', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{sub}</div>}
      <div style={{ height: 3, background: '#F3F4F6', borderRadius: 2, marginTop: 12 }}>
        <div style={{ height: '100%', width: '55%', background: accent, borderRadius: 2 }} />
      </div>
    </div>
  </Card>
);
const FilterBar = ({ search, onSearch, filter, onFilter, filterOpts, placeholder }) => (
  <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 14px' }}>
      <span style={{ color: '#9CA3AF', fontSize: 14 }}>🔍</span>
      <input value={search} onChange={e => onSearch(e.target.value)} placeholder={placeholder || 'Search...'}
        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#111827', width: '100%' }} />
      {search && <span onClick={() => onSearch('')} style={{ cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1 }}>×</span>}
    </div>
    {filterOpts && (
      <select value={filter} onChange={e => onFilter(e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: 'white', color: '#374151', outline: 'none', cursor: 'pointer', minWidth: 130 }}>
        {filterOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )}
  </div>
);

// ─── Date helpers ─────────────────────────────────────────────────────────────
const parseDate = (d) => {
  if (!d) return null;
  let s = String(d).trim();
  if (s.includes('Z') || s.includes('+') || (s.includes('-') && s.lastIndexOf('-') > 7)) return new Date(s);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) return new Date(s.replace(' ', 'T') + 'Z');
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) return new Date(s + 'Z');
  return new Date(s);
};
const fmtFull = (d) => { const date = parseDate(d); if (!date || isNaN(date)) return '—'; return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }); };
const fmtDate = (d) => { const date = parseDate(d); if (!date || isNaN(date)) return '—'; return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }); };
const fmtTime = (d) => {
  const date = parseDate(d);
  if (!date || isNaN(date)) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${Math.max(0, diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
};

// ─── User status maps ─────────────────────────────────────────────────────────
const REQUEST_STATUS_MAP = {
  received: { bg: '#F3F4F6', color: '#6B7280', label: 'Waiting for AI' },
  draft: { bg: '#FFF3E0', color: '#F97316', label: 'Admin Reviewing' },
  ticket: { bg: '#E8F5E9', color: '#2E7D32', label: 'Ticket Created' },
};
const OFFICIAL_STATUS_MAP = {
  New: { bg: '#E8F5E9', color: '#2E7D32' }, Assigned: { bg: '#E3F2FD', color: '#1565C0' },
  Solving: { bg: '#FFF3E0', color: '#E65100' }, Solved: { bg: '#ECFDF5', color: '#059669' },
  Fail: { bg: '#FFEBEE', color: '#C62828' }, Failed: { bg: '#FFEBEE', color: '#C62828' },
};
const TIMELINE_COLORS = { STATUS_CHANGE: '#10B981', COMMENT: '#F97316', SUBMIT_DRAFT: '#8B5CF6', REASSIGN: '#3B82F6', default: '#9CA3AF' };
const RequestStatusBadge = ({ status }) => { const cfg = REQUEST_STATUS_MAP[status] || { bg: '#F3F4F6', color: '#6B7280', label: status }; return <Pill bg={cfg.bg} color={cfg.color}>{cfg.label || status}</Pill>; };
const OfficialStatusBadge = ({ status }) => { const cfg = OFFICIAL_STATUS_MAP[status] || { bg: '#F3F4F6', color: '#6B7280' }; return <Pill bg={cfg.bg} color={cfg.color}>{status}</Pill>; };

// ─── Ticket Detail View (User) ────────────────────────────────────────────────
const TicketDetailView = ({ ticket, userId, username, userEmail, profileImage, onBack }) => {
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [fullTicket, setFullTicket] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const commentsEndRef = useRef(null);
  const textareaRef = useRef(null);
  const t = fullTicket ? { ...ticket, ...fullTicket } : ticket;

  useEffect(() => {
    if (!ticket) return;
    const reqStatus = ticket.request_status || ticket.status;
    const requestId = ticket.request_id || ticket.id;
    
    if (reqStatus === 'ticket') {
      fetch(`${API_URL}/admin/official-tickets`).then(r => r.ok ? r.json() : []).then(list => {
        
        // 🟢 FIX: เพิ่มการค้นหาจาก official_ticket_id กลับเข้าไป (โค้ดเก่าของคุณโดนทับไป)
        const found = Array.isArray(list) ? list.find(tk =>
          tk.id === ticket.official_ticket_id || 
          (ticket.ticket_no && tk.ticket_no === ticket.ticket_no) ||
          tk.request_id === requestId || tk.user_request_id === requestId ||
          (tk.linked_requests && tk.linked_requests.some(r => String(r.id) === String(requestId)))
        ) : null;
        
        // 🟢 FIX: บังคับให้โหลดข้อมูล Comment ทันทีถ้ามี official_ticket_id 
        if (found || ticket.official_ticket_id) {
          const matchedTicket = found || ticket;
          setFullTicket(matchedTicket);
          const tkId = matchedTicket.id || matchedTicket.official_ticket_id || matchedTicket.ticket_id;
          
          if (tkId) {
            setLoadingComments(true);
            fetch(`${API_URL}/tickets/${tkId}/comments`).then(r => r.ok ? r.json() : []).then(d => { setComments(Array.isArray(d) ? d : []); setLoadingComments(false); }).catch(() => setLoadingComments(false));
            fetch(`${API_URL}/assignee/history/${tkId}`).then(r => r.ok ? r.json() : []).then(d => setHistory(Array.isArray(d) ? d : [])).catch(() => {});
          }
        } else { setLoadingComments(false); }
      }).catch(() => setLoadingComments(false));
    } else {
      setLoadingComments(false);
      fetch(`${API_URL}/admin/draft-tickets`).then(r => r.ok ? r.json() : []).then(list => {
        const found = Array.isArray(list) ? list.find(d => d.linked_requests?.some(r => String(r.id) === String(requestId))) : null;
        if (found) setFullTicket(found);
      }).catch(() => {});
    }
  }, [ticket?.request_id, ticket?.id, ticket?.request_status, ticket?.status, ticket?.official_ticket_id, ticket?.ticket_no]);

  // 🟢 แก้ไขระบบเลื่อนจอ ให้เลื่อนเฉพาะตอนที่มี "ข้อความเพิ่มขึ้น" เท่านั้น
  useEffect(() => { 
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [comments.length]);

  // 🟢 ระบบ Auto-Refresh ดึงแชทและประวัติแบบ Real-time ฝั่ง User
  useEffect(() => {
      const tkId = fullTicket?.id || fullTicket?.ticket_id || ticket?.official_ticket_id;
      if (!tkId) return;

      const interval = setInterval(() => {
          fetch(`${API_URL}/tickets/${tkId}/comments`)
              .then(r => r.ok ? r.json() : [])
              .then(data => {
                  const newComments = Array.isArray(data) ? data : [];
                  setComments(prev => prev.length !== newComments.length ? newComments : prev);
              })
              .catch(() => {});
          
          fetch(`${API_URL}/assignee/history/${tkId}`)
              .then(r => r.ok ? r.json() : [])
              .then(data => {
                  const newHistory = Array.isArray(data) ? data : [];
                  setHistory(prev => prev.length !== newHistory.length ? newHistory : prev);
              })
              .catch(() => {});
      }, 3000);

      return () => clearInterval(interval);
  }, [fullTicket?.id, fullTicket?.ticket_id, ticket?.official_ticket_id]);

  const handlePostComment = async () => {
    if (!newComment.trim() || posting) return;
    const id = fullTicket?.id || fullTicket?.ticket_id || ticket.official_ticket_id;
    if (!id) { toast('error', 'Not available', 'Comments only available on approved tickets.'); return; }
    setPosting(true);
    try {
      const r = await fetch(`${API_URL}/tickets/${id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: username, user_email: userEmail, message: newComment }),
      });
      if (r.ok) {
        setComments(prev => [...prev, { id: Date.now(), user_name: username, user_email: userEmail, profile_image: profileImage, message: newComment, created_at: new Date().toISOString(), is_own: true }]);
        setNewComment('');
        toast('success', 'Comment posted');
        setTimeout(() => textareaRef.current?.focus(), 100);
      } else { toast('error', 'Failed', 'Could not post comment.'); }
    } catch { toast('error', 'Error', 'Network error.'); }
    finally { setPosting(false); }
  };

  const timelineItems = [
    { label: 'Request submitted', sub: ticket.message || ticket.original_message || '', time: ticket.created_at, color: '#10B981', icon: '📨' },
    ...(ticket.draft_ticket_id && fullTicket?.created_at && fullTicket.created_at !== ticket.created_at ? [{ label: 'AI draft created', sub: fullTicket.title || '', time: fullTicket.created_at, color: '#8B5CF6', icon: '🤖' }] : []),
    ...((ticket.request_status === 'ticket' || ticket.status === 'ticket') && fullTicket?.id ? [{ label: 'Ticket approved & created', sub: fullTicket.ticket_no || '', time: fullTicket.created_at, color: '#059669', icon: '🎫' }] : []),
    ...history.map(h => ({ label: h.action_type === 'STATUS_CHANGE' ? `${h.old_value || 'New'} → ${h.new_value}` : h.action_type.replace(/_/g, ' '), sub: h.performed_by_name || '', time: h.created_at, color: h.action_type === 'STATUS_CHANGE' ? (h.new_value === 'Solved' ? '#059669' : h.new_value === 'Failed' ? '#EF4444' : '#3B82F6') : TIMELINE_COLORS[h.action_type] || TIMELINE_COLORS.default, icon: h.action_type === 'STATUS_CHANGE' ? (h.new_value === 'Solved' ? '✅' : h.new_value === 'Failed' ? '❌' : '🔄') : '📝' })),
    ...comments.map(c => ({ label: `${c.user_name || c.user_email || 'User'} commented`, sub: (c.message || '').substring(0, 45) + ((c.message || '').length > 45 ? '…' : ''), time: c.created_at, color: '#F97316', icon: '💬' })),
  ].filter(i => i.time).sort((a, b) => new Date(a.time) - new Date(b.time));

  const officialStatus = fullTicket?.status || t.official_status;
  const statusCfg = officialStatus ? (OFFICIAL_STATUS_MAP[officialStatus] || { bg: '#F3F4F6', color: '#6B7280' }) : (REQUEST_STATUS_MAP[t.request_status] || { bg: '#F3F4F6', color: '#6B7280' });

  const rawPath = t.resolution_path || t.ai_resolution;
  let resolutionSteps = [];
  if (rawPath) {
    if (Array.isArray(rawPath)) resolutionSteps = rawPath.filter(Boolean);
    else { try { const p = JSON.parse(rawPath); resolutionSteps = Array.isArray(p) ? p.filter(Boolean) : [String(rawPath)]; } catch { resolutionSteps = String(rawPath).split(/\n+/).map(s => s.replace(/^\d+[.)\s]*/, '').trim()).filter(Boolean); } }
  }

  return (
    <div style={{ animation: 'fdIn 0.25s ease' }}>
      <style>{`@keyframes fdIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {/* Header */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${statusCfg.color}, ${statusCfg.color}88)` }} />
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              {t.ticket_no && <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#F97316', fontWeight: 700, background: '#FFF7ED', padding: '2px 8px', borderRadius: 6, border: '1px solid #FED7AA' }}>{t.ticket_no}</span>}
              <span style={{ fontWeight: 800, fontSize: 16, color: '#1A1A2E' }}>{t.title || t.ai_title || 'Ticket'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {officialStatus ? <OfficialStatusBadge status={officialStatus} /> : <RequestStatusBadge status={t.request_status} />}
              {t.category && <Pill bg='#E3F2FD' color='#1565C0'>{t.category}</Pill>}
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>Opened {fmtFull(t.created_at)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
            {t.assignee_name && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Assignee</div><div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Avatar size={22} name={t.assignee_name} /><span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{t.assignee_name}</span></div></div>}
            {t.deadline && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Due</div><span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{fmtDate(t.deadline)}</span></div>}
          </div>
        </div>
      </div>
      {/* Body: 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 200px', gap: 14, alignItems: 'start' }}>
        {/* Left: original request + chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFF3E0)', border: '1px solid #FED7AA', borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>📋 Your Original Request</div>
            <div style={{ fontSize: 13, color: '#1A1A2E', fontStyle: 'italic', lineHeight: 1.7 }}>"{t.original_message || t.linked_requests?.[0]?.message || t.message || '—'}"</div>
          </div>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', minHeight: 360 }}>
            <div style={{ padding: '13px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 14 }}>💬</span><span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>Discussion</span>
              {comments.length > 0 && <Pill bg='#FFF7ED' color='#F97316'>{comments.length} message{comments.length !== 1 ? 's' : ''}</Pill>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>⏳ Loading messages…</div>
              ) : comments.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>{(ticket.request_status || ticket.status) === 'ticket' ? '💬' : '⏳'}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{(ticket.request_status || ticket.status) === 'ticket' ? 'No messages yet' : 'Pending admin review'}</div>
                </div>
              ) : comments.map((c, i) => {
                const isOwn = c.is_own || c.user_email === userEmail;
                return (
                  <div key={c.id || i} style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end', animation: 'msgIn 0.2s ease' }}>
                    <Avatar img={c.profile_image} size={30} name={c.user_name || c.user_email} />
                    <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{c.user_name || c.user_email || 'User'}</span>
                        <span style={{ fontSize: 10, color: '#9CA3AF' }}>{fmtTime(c.created_at)}</span>
                      </div>
                      <div style={{ padding: '10px 14px', borderRadius: isOwn ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: isOwn ? 'linear-gradient(135deg,#F97316,#EA580C)' : '#F3F4F6', color: isOwn ? 'white' : '#1A1A2E', fontSize: 13, lineHeight: 1.6, wordBreak: 'break-word' }}>{c.message}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <Avatar img={profileImage} size={30} name={username} />
                <textarea ref={textareaRef} rows={2} value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handlePostComment(); } }}
                  placeholder={(ticket.request_status || ticket.status) === 'ticket' ? 'Type a message…  Ctrl+Enter to send' : 'Available after admin approves the ticket'}
                  disabled={(ticket.request_status || ticket.status) !== 'ticket'}
                  style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: 'white', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }} />
                <button onClick={handlePostComment} disabled={posting || !newComment.trim() || (ticket.request_status || ticket.status) !== 'ticket'}
                  style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: posting || !newComment.trim() ? 0.5 : 1 }}>→</button>
              </div>
            </div>
          </div>
        </div>
        {/* Middle: AI Summary + Resolution Path */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(t.summary || t.ai_summary) ? (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)' }}>
                <span>✦</span><span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>AI Summary</span>
              </div>
              <div style={{ padding: '14px 16px' }}><p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.75 }}>{t.summary || t.ai_summary}</p></div>
            </div>
          ) : <div style={{ background: '#FAFAFA', borderRadius: 14, border: '1px dashed #E5E7EB', padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>✦ AI summary not yet available</div>}
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

          {/* 🟢 เพิ่มกล่องแสดง Resolution ของ Assignee ตรงนี้ */}
          {(t.official_status === 'Solved' || t.official_status === 'Failed') && t.resolution_comment && (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, background: t.official_status === 'Solved' ? 'linear-gradient(135deg,#F0FDF4,#ECFDF5)' : 'linear-gradient(135deg,#FEF2F2,#FEF2F2)' }}>
                <span>{t.official_status === 'Solved' ? '✅' : '❌'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: t.official_status === 'Solved' ? '#059669' : '#DC2626' }}>Assignee Resolution</span>
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

// ─── Standalone sub-views (Admin) ─────────────────────────────────────────────
const ApprovalsView = () => {
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState('');
  const load = () => fetch(`${API_URL}/admin/pending-approvals`).then(r => r.json()).then(d => setPending(Array.isArray(d) ? d : [])).catch(() => {});
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

const ReportsView = () => {
  const [s, setS] = useState({ total: 0, avgTime: 0, byStatus: [], byCategory: [] });
  useEffect(() => { fetch(`${API_URL}/admin/reports`).then(r => r.json()).then(d => setS({ total: d.total || 0, avgTime: d.avgTime || 0, byStatus: d.byStatus || [], byCategory: d.byCategory || [] })).catch(() => {}); }, []);
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

// ─── MAIN TODOLIST ─────────────────────────────────────────────────────────────
function TodoList({ username, userEmail, onLogout, profileImage, createNewAdmin, userId, role }) {
  console.log("TodoList Props:", { username, userEmail, profileImage, userId, role });

  // ── Admin state ──
  const [view, setView] = useState('dashboard');
  const [selectedTask, setSelectedTask] = useState(null);
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

  // ── User state ──
  const [currentView, setCurrentView] = useState('user-requests');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const toArr = d => Array.isArray(d) ? d : [];

  // ── Load data ──
  useEffect(() => {
    if (role === 'admin') { loadAll(); loadAssignees(); }
  }, [role]);
  useEffect(() => {
    if (role === 'admin' && view === 'history') loadHistory();
  }, [view]);

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
    try { const r = await fetch(`${API_URL}/ticket-history?userId=${userId}&role=${role}`); if (!r.ok) return; setHistory(toArr(await r.json().catch(() => []))); } catch {}
  };

  const navigate = (v) => { setView(v); setSelectedTask(null); };

  // ── Admin actions ──
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
      if (r.ok) { toast('success', 'Merged!'); setSelDrafts([]); loadAll(); }
      else toast('error', 'Error', d.message);
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

  // ── Admin render functions ──
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
            <select value={selectedTask.assigned_to || ''} onChange={e => setSelectedTask({ ...selectedTask, assigned_to: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: '#F9FAFB', outline: 'none', cursor: 'pointer' }}>
              <option value="">— Select Assignee —</option>
              {assignees.map(a => <option key={a.id} value={a.id}>{a.username}</option>)}
            </select>
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

  const renderDrafts = () => {
    const rows = drafts.filter(d => dFilter === 'all' || d.status === dFilter).filter(d => !dSearch || [d.title, d.summary, d.category].some(v => v?.toLowerCase().includes(dSearch.toLowerCase())));
    return (
      <Card>
        <CardHead title="Draft Tickets" count={rows.length} right={selDrafts.length > 1 && <Btn variant='warning' onClick={() => mergeDrafts(selDrafts)}>⊕ Merge ({selDrafts.length})</Btn>} />
        <div style={{ padding: '14px 20px 0' }}>
          <FilterBar search={dSearch} onSearch={setDSearch} filter={dFilter} onFilter={setDFilter} placeholder="Search title, category, summary..."
            filterOpts={[{ value: 'all', label: 'All Status' }, { value: 'Draft', label: 'Draft' }, { value: 'Submitted', label: 'Submitted' }, { value: 'Merged', label: 'Merged' }]} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><TH s={{ width: 36 }} /><TH>ID</TH><TH>Title</TH><TH>Category</TH><TH>Assignee</TH><TH>Date</TH><TH>Status</TH><TH>Actions</TH></tr></thead>
            <tbody>
              {rows.map(item => {
                const sel = selDrafts.includes(item.id);
                return (
                  <tr key={item.id} style={{ background: sel ? '#FFF7ED' : 'white' }} onMouseEnter={e => e.currentTarget.style.background = sel ? '#FFF7ED' : '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = sel ? '#FFF7ED' : 'white'}>
                    <TD s={{ width: 36 }}><input type="checkbox" checked={sel} onChange={() => toggleSelDraft(item.id)} style={{ accentColor: '#F97316', cursor: 'pointer' }} /></TD>
                    <TD s={{ fontWeight: 700, color: '#9CA3AF' }}>{item.id}</TD>
                    <TD>
                      <div style={{ fontWeight: 600, color: '#1A1A2E', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.title}
                        {item.linked_requests?.length > 1 && <Pill bg='#E3F2FD' color='#1565C0'>⊕{item.linked_requests.length}</Pill>}
                      </div>
                      {item.summary && <div style={{ fontSize: 11, color: '#9CA3AF', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.summary}</div>}
                    </TD>
                    <TD><Pill bg='#E3F2FD' color='#1565C0'>{item.category || item.ai_category_name || 'Uncategorized'}</Pill></TD>
                    <TD>{getAssigneeName(item.assigned_to) ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar size={24} /><span style={{ fontSize: 12 }}>{getAssigneeName(item.assigned_to)}</span></div> : <span style={{ fontSize: 12, color: '#EF4444' }}>Unassigned</span>}</TD>
                    <TD s={{ fontSize: 12, color: '#9CA3AF' }}>{fmtDate(item.created_at)}</TD>
                    <TD><StatusPill s={item.status} /></TD>
                    <TD><Btn variant='ghost' onClick={() => setSelectedTask(item)}>Edit ›</Btn></TD>
                  </tr>
                );
              })}
              {rows.length === 0 && <EmptyRow cols={8} />}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

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
                <tr key={t.id} style={{ background: 'white' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <TD s={{ fontWeight: 700, color: '#F97316', fontFamily: 'monospace' }}>{t.ticket_no || `#${t.id}`}</TD>
                  <TD><div style={{ fontWeight: 600, color: '#1A1A2E' }}>{t.title}</div>{t.summary && <div style={{ fontSize: 11, color: '#9CA3AF', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.summary}</div>}</TD>
                  <TD><Pill bg='#E3F2FD' color='#1565C0'>{t.category || 'IT Support'}</Pill></TD>
                  <TD><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar size={24} /><span style={{ fontSize: 12 }}>{t.assignee_name || 'Unassigned'}</span></div></TD>
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

  const renderUsers = () => {
    const rows = users.filter(u => uFilter === 'all' || u.role === uFilter).filter(u => !uSearch || [u.username, u.full_name, u.email].some(v => v?.toLowerCase().includes(uSearch.toLowerCase())));
    return (
      <Card>
        <CardHead title="All Users" count={rows.length} right={createNewAdmin && <Btn variant='primary' onClick={createNewAdmin}>+ Add Admin</Btn>} />
        <div style={{ padding: '14px 20px 0' }}>
          <FilterBar search={uSearch} onSearch={setUSearch} filter={uFilter} onFilter={setUFilter} placeholder="Search by name, username, email..."
            filterOpts={[{ value: 'all', label: 'All Roles' }, { value: 'admin', label: 'Admin' }, { value: 'assignee', label: 'Assignee' }, { value: 'user', label: 'User' }]} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>User</TH><TH>Role</TH><TH>Skills</TH><TH>Status</TH><TH s={{ textAlign: 'right' }}>Action</TH></tr></thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} style={{ background: 'white' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <TD><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar img={u.profile_image} size={34} /><div><div style={{ fontWeight: 600, color: '#1A1A2E', fontSize: 13 }}>{u.full_name || u.username}</div><div style={{ color: '#9CA3AF', fontSize: 11 }}>@{u.username}</div></div></div></TD>
                <TD><Pill bg={u.role === 'admin' ? '#FFEBEE' : u.role === 'assignee' ? '#E3F2FD' : '#F3F4F6'} color={u.role === 'admin' ? '#C62828' : u.role === 'assignee' ? '#1565C0' : '#6B7280'}>{u.role}</Pill></TD>
                <TD><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{u.skill_names ? u.skill_names.split(',').map((sk, i) => <Pill key={i} bg='#E3F2FD' color='#1565C0'>{sk.trim()}</Pill>) : <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>}</div></TD>
                <TD><Pill bg={u.is_approved ? '#E8F5E9' : '#FFEBEE'} color={u.is_approved ? '#2E7D32' : '#C62828'}>{u.is_approved ? 'Active' : 'Pending'}</Pill></TD>
                <TD s={{ textAlign: 'right' }}><Btn variant='ghost' onClick={() => setSelectedTask({ ...u, skills: u.skill_ids ? u.skill_ids.split(',').map(Number) : [] })}>Manage</Btn></TD>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow cols={5} />}
          </tbody>
        </table>
      </Card>
    );
  };

  const renderHistory = () => {
    const rows = history.filter(h => !hSearch || String(h.ticket_id).includes(hSearch) || h.action_type?.toLowerCase().includes(hSearch.toLowerCase()) || h.performed_by_name?.toLowerCase().includes(hSearch.toLowerCase()));
    return (
      <Card>
        <CardHead title="Ticket History" count={rows.length} right={<Pill bg='#F3F4F6' color='#6B7280'>👁 Read-Only</Pill>} />
        <div style={{ padding: '14px 20px 0' }}><FilterBar search={hSearch} onSearch={setHSearch} placeholder="Search by ticket ID, action, or user..." /></div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><TH>Ticket</TH><TH>Action</TH><TH>Change</TH><TH>Performed By</TH><TH>Time</TH></tr></thead>
          <tbody>
            {rows.map((log, i) => (
              <tr key={i} style={{ background: 'white' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <TD s={{ fontWeight: 700, color: '#F97316' }}>#{log.ticket_id}</TD>
                <TD><StatusPill s={log.action_type} /></TD>
                <TD><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>{log.old_value || '—'}</span><span style={{ color: '#F97316', fontSize: 12 }}>→</span><span style={{ fontSize: 12, fontWeight: 600 }}>{log.new_value}</span></div></TD>
                <TD s={{ fontSize: 12 }}>{log.performed_by_name || `#${log.performed_by}`}</TD>
                <TD s={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(log.created_at).toLocaleString('th-TH')}</TD>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow cols={5} />}
          </tbody>
        </table>
      </Card>
    );
  };

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

  const renderAdminContent = () => {
    if (view === 'drafts' && selectedTask) return renderDraftEdit();
    if (view === 'users' && selectedTask) return renderUserEdit();
    switch (view) {
      case 'dashboard': return renderDashboard();
      case 'drafts': return renderDrafts();
      case 'official': return renderOfficial();
      case 'user-requests': return renderRequests();
      case 'users': return renderUsers();
      case 'approvals': return <ApprovalsView />;
      case 'reports': return <ReportsView />;
      case 'history': return renderHistory();
      default: return null;
    }
  };

  // ─── Nav configs ──────────────────────────────────────────────────────────────
  const ADMIN_NAV = [
    { icon: '/dashboard.png', label: 'Dashboard', view: 'dashboard' },
    { icon: '/draft.png', label: 'Draft Tickets', view: 'drafts' },
    { icon: '/ticket.png', label: 'Active Tickets', view: 'official' },
    { icon: '/request.png', label: 'User Requests', view: 'user-requests' },
    { icon: '/users.png', label: 'User Mgmt', view: 'users' },
    { icon: '/approvals.png', label: 'Approvals', view: 'approvals' },
    { icon: '/reports.png', label: 'Reports', view: 'reports' },
    { icon: '/history.png', label: 'History', view: 'history' },
  ];
  const USER_NAV = [
    { icon: '/request.png', label: 'Submit Request', view: 'user-requests' },
    { icon: '/ticket.png', label: 'Track My Tickets', view: 'track-tickets' },
    { icon: '/history.png', label: 'Ticket History', view: 'history' },
  ];
  const PAGE_TITLES_ADMIN = { dashboard: 'Dashboard', drafts: 'Draft Tickets', official: 'Active Tickets', 'user-requests': 'User Requests', users: 'User Management', approvals: 'Approvals', reports: 'Reports', history: 'Ticket History' };
  const PAGE_TITLES_USER = { 'user-requests': 'Submit a Request', 'track-tickets': 'Track My Tickets', history: 'Ticket History' };

  // ─── Sidebar renderer ─────────────────────────────────────────────────────────
  const renderSidebar = (navItems, activeView, onNavigate) => (
    <div style={{ width: 210, background: '#1A1A2E', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '2px 0 8px rgba(0,0,0,0.15)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #2D2D4E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/CeiLogoColor.png" style={{ height: 44, objectFit: 'contain' }} alt="CEI" onError={e => e.target.style.display = 'none'} />
      </div>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #2D2D4E', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Avatar img={profileImage} size={54} name={username} />
        <div style={{ color: 'white', fontSize: 13, fontWeight: 600, marginTop: 10 }}>{username}</div>
        {userEmail && userEmail !== 'null' && userEmail.trim() !== '' && (
          <div style={{ color: '#9CA3AF', fontSize: 10, marginTop: 3, wordBreak: 'break-all', padding: '0 6px', lineHeight: 1.4 }}>{userEmail}</div>
        )}
        <div style={{ marginTop: 8 }}>
          {role === 'admin' && <Pill bg='rgba(239,68,68,0.15)' color='#EF4444'>Admin</Pill>}
          {role === 'assignee' && <Pill bg='rgba(59,130,246,0.15)' color='#60A5FA'>Assignee</Pill>}
          {role === 'user' && <Pill bg='rgba(255,255,255,0.07)' color='#9CA3AF'>Personal Account</Pill>}
        </div>
      </div>
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {navItems.map(item => {
          const active = activeView === item.view;
          return (
            <div key={item.view} onClick={() => onNavigate(item.view)}
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: active ? '#F97316' : 'transparent', color: active ? 'white' : '#9CA3AF', fontSize: 13, fontWeight: active ? 600 : 400, borderLeft: active ? '3px solid rgba(255,255,255,0.3)' : '3px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#2D2D4E'; e.currentTarget.style.color = 'white'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; } }}>
              <img src={item.icon} alt="" style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0, filter: active ? 'brightness(0) invert(1)' : 'brightness(0) invert(0.6)' }} onError={e => e.target.style.display = 'none'} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </div>
          );
        })}
      </nav>
      <div onClick={onLogout}
        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#EF4444', fontSize: 13, borderTop: '1px solid #2D2D4E', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <img src="/logout.png" alt="logout" style={{ width: 16, height: 16, objectFit: 'contain', filter: 'invert(40%) sepia(80%) saturate(500%) hue-rotate(320deg)' }} onError={e => e.target.style.display = 'none'} />
        <span>Logout</span>
      </div>
    </div>
  );

  // ─── ADMIN LAYOUT ─────────────────────────────────────────────────────────────
  if (role === 'admin') {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F5F5F5', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
        {renderSidebar(ADMIN_NAV, view, navigate)}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: 'white', height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{PAGE_TITLES_ADMIN[view]}</span>
              {selectedTask && (<><span style={{ color: '#D1D5DB', fontSize: 14 }}>›</span><span style={{ fontSize: 13, color: '#6B7280' }}>{selectedTask.title || selectedTask.full_name}</span></>)}
            </div>
          </div>
          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>{renderAdminContent()}</div>
        </div>
      </div>
    );
  }

  // ─── ASSIGNEE LAYOUT ──────────────────────────────────────────────────────────
  if (role === 'assignee') {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F5F5F5', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
        {renderSidebar([{ icon: '/ticket.png', label: 'My Tasks', view: 'tasks' }], 'tasks', () => {})}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: 'white', height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>My Assigned Tasks</span>
          </div>
          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
            <AssigneeDashboard userId={userId} API_URL={API_URL} />
          </div>
        </div>
      </div>
    );
  }

  // ─── USER LAYOUT ─────────────────────────────────────────────────────────────
  // Sub-views
  const SubmitRequestView = () => {
    const [requestMessage, setRequestMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!requestMessage.trim()) return;
      setSubmitting(true);
      try {
        const response = await fetch(`${API_URL}/user-requests`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_email: userEmail || username, message: requestMessage, user_id: userId }),
        });
        if (response.ok) { toast('success', 'Request Submitted', 'AI has generated a draft for the Admin to review.'); setRequestMessage(''); setRefreshKey(k => k + 1); }
        else toast('error', 'Failed', 'Could not send request.');
      } catch { toast('error', 'Error', 'Failed to send request.'); }
      finally { setSubmitting(false); }
    };
    return (
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 6px 20px rgba(249,115,22,0.3)' }}><span style={{ fontSize: 28 }}>💬</span></div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1A1A2E' }}>How can we help?</h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#9CA3AF' }}>Describe your issue and our AI will process it for you</p>
        </div>
        <Card style={{ padding: 28 }}>
          {userEmail && userEmail !== 'null' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '7px 12px', marginBottom: 18 }}>
              <span style={{ fontSize: 12 }}>✉️</span><span style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 500 }}>{userEmail}</span>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Submit New Request (AI Handled) <span style={{ color: '#EF4444' }}>*</span></label>
              <textarea rows={5} value={requestMessage} onChange={e => setRequestMessage(e.target.value)} placeholder="Describe your issue..." required
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: 'white', color: '#111827', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
                onFocus={e => { e.target.style.borderColor = '#F97316'; }} onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }} />
            </div>
            <button type="submit" disabled={submitting}
              style={{ width: '100%', padding: '12px', background: submitting ? '#E5E7EB' : 'linear-gradient(135deg,#F97316,#EA580C)', color: submitting ? '#9CA3AF' : 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Processing...' : 'Send Request to AI →'}
            </button>
          </form>
        </Card>
        <div style={{ marginTop: 14, padding: '11px 15px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 12, color: '#92400E', display: 'flex', gap: 8 }}>
          <span>💡</span><span>Your request will be reviewed by AI and then an admin. Track progress under <strong>Track My Tickets</strong>.</span>
        </div>
      </div>
    );
  };

  const TrackTicketsView = () => {
    const [userTickets, setUserTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    useEffect(() => {
      fetch(`${API_URL}/users/${userId}/tickets`).then(r => r.ok ? r.json() : []).then(d => { setUserTickets(Array.isArray(d) ? d : []); setLoadingTickets(false); }).catch(() => setLoadingTickets(false));
    }, []);
    if (loadingTickets) return <Card style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading your tickets...</Card>;
    return (
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>Track My Tickets</span>
          <Pill bg='#F3F4F6' color='#6B7280'>{userTickets.length} total</Pill>
        </div>
        {userTickets.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 12 }}>📭</div><div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No tickets found.</div><div style={{ fontSize: 13, color: '#9CA3AF' }}>Submit a request to get started</div></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH>Date</TH><TH>Your Request</TH><TH>AI Draft Title</TH><TH>Status</TH><TH>Official Status</TH><TH /></tr></thead>
              <tbody>
                {userTickets.map((t, idx) => (
                  <tr key={`${t.request_id || t.id}-${idx}`} style={{ background: 'white', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'} onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    onClick={() => setSelectedTicket(t)}>
                    <TD s={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(t.created_at)}</TD>
                    <TD><div style={{ fontWeight: 500, color: '#1A1A2E', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.original_message || t.message}</div></TD>
                    <TD s={{ color: '#6B7280', fontStyle: 'italic' }}>{t.ai_title || t.title || <span style={{ color: '#D1D5DB' }}>Processing...</span>}</TD>
                    <TD><RequestStatusBadge status={t.request_status || t.status} /></TD>
                    <TD>{t.official_status ? <OfficialStatusBadge status={t.official_status} /> : <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>}</TD>
                    <TD><div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F97316', fontWeight: 600, fontSize: 12 }}><span>View</span><span style={{ fontSize: 14 }}>→</span></div></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  };

  const UserHistoryView = () => {
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    useEffect(() => {
      fetch(`${API_URL}/ticket-history?userId=${userId}&role=${role}`).then(r => r.ok ? r.json() : []).then(d => { setHistoryData(Array.isArray(d) ? d : []); setLoadingHistory(false); }).catch(() => setLoadingHistory(false));
    }, []);
    if (loadingHistory) return <Card style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading history...</Card>;
    return (
      <Card>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>Ticket Activity History</div><div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Track all changes and updates</div></div>
          <Pill bg='#F3F4F6' color='#6B7280'>👁 Read-Only View</Pill>
        </div>
        {historyData.length === 0 ? <div style={{ padding: 56, textAlign: 'center', color: '#9CA3AF' }}><div style={{ fontSize: 40, marginBottom: 10 }}>📋</div><div style={{ fontSize: 13 }}>No activity history found.</div></div>
          : <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH>Ticket ID</TH><TH>Action</TH><TH>Update Details</TH><TH>Performed By</TH><TH>Timestamp</TH></tr></thead>
              <tbody>
                {historyData.map((log, i) => (
                  <tr key={i} style={{ background: 'white' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <TD s={{ fontWeight: 700, color: '#F97316' }}>#{log.ticket_id}</TD>
                    <TD><StatusPill s={log.action_type} /></TD>
                    <TD><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>{log.old_value || 'None'}</span><span style={{ color: '#F97316', fontSize: 12 }}>→</span><span style={{ fontSize: 12, fontWeight: 600 }}>{log.new_value}</span></div></TD>
                    <TD s={{ fontSize: 12 }}>{log.performed_by_name || `User ID: ${log.performed_by}`}</TD>
                    <TD s={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(log.created_at).toLocaleString('th-TH')}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </Card>
    );
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F5F5F5', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      {renderSidebar(USER_NAV, currentView, (v) => { setCurrentView(v); setSelectedTicket(null); })}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'white', height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0, gap: 8 }}>
          {selectedTicket && (
            <button onClick={() => setSelectedTicket(null)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#6B7280' }}>←</button>
          )}
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>{PAGE_TITLES_USER[currentView]}</span>
          {selectedTicket && (<><span style={{ color: '#D1D5DB', fontSize: 14 }}>›</span><span style={{ fontSize: 13, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedTicket.title || selectedTicket.ai_title || `Request #${selectedTicket.request_id || selectedTicket.id}`}</span></>)}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {currentView === 'track-tickets' && selectedTicket ? (
            <TicketDetailView ticket={selectedTicket} userId={userId} username={username} userEmail={userEmail} profileImage={profileImage} onBack={() => setSelectedTicket(null)} />
          ) : (
            <>
              {currentView === 'user-requests' && <SubmitRequestView key={refreshKey} />}
              {currentView === 'track-tickets' && <TrackTicketsView key={refreshKey} />}
              {currentView === 'history' && <UserHistoryView />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TodoList;
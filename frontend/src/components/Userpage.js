import React, { useState, useEffect, useRef } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// ─── Toast ─────────────────────────────────────────────────────────────────────
const toast = (icon, title, text = '') => {
  const colors = { success: '#10B981', error: '#EF4444', warning: '#F59E0B' };
  const el = document.createElement('div');
  el.innerHTML = `<div style="position:fixed;top:20px;right:20px;z-index:9999;background:white;border-radius:10px;padding:14px 18px;box-shadow:0 8px 24px rgba(0,0,0,0.12);border-left:4px solid ${colors[icon]||'#9CA3AF'};min-width:260px;animation:ti .25s ease"><strong style="color:#111;font-size:13px;display:block">${title}</strong>${text?`<span style="font-size:12px;color:#6B7280">${text}</span>`:''}</div><style>@keyframes ti{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}</style>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
};

// ─── Atoms ─────────────────────────────────────────────────────────────────────
const Avatar = ({ img, size = 32, name = '' }) => {
  const src = !img ? null : img.startsWith('http') ? img : `http://localhost:5001/uploads/${img}`;
  const initials = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ color: 'white', fontSize: size * 0.38, fontWeight: 700, lineHeight: 1 }}>{initials}</span>}
    </div>
  );
};

const Pill = ({ bg = '#F3F4F6', color = '#374151', children }) => (
  <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>{children}</span>
);

const Card = ({ children, style: s = {} }) => (
  <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', ...s }}>{children}</div>
);

const TH = ({ children }) => (
  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>{children}</th>
);
const TD = ({ children, s = {} }) => (
  <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F9FAFB', verticalAlign: 'middle', ...s }}>{children}</td>
);

// ─── Status maps ───────────────────────────────────────────────────────────────
const REQUEST_STATUS_MAP = {
  received: { bg: '#F3F4F6', color: '#6B7280',  label: 'Waiting for AI' },
  draft:    { bg: '#FFF3E0', color: '#F97316',   label: 'Admin Reviewing' },
  ticket:   { bg: '#E8F5E9', color: '#2E7D32',   label: 'Ticket Created' },
};
const OFFICIAL_STATUS_MAP = {
  New:      { bg: '#E8F5E9', color: '#2E7D32' },
  Assigned: { bg: '#E3F2FD', color: '#1565C0' },
  Solving:  { bg: '#FFF3E0', color: '#E65100' },
  Solved:   { bg: '#ECFDF5', color: '#059669' },
  Fail:     { bg: '#FFEBEE', color: '#C62828' },
  Failed:   { bg: '#FFEBEE', color: '#C62828' },
};
const TIMELINE_COLORS = {
  STATUS_CHANGE: '#10B981', COMMENT: '#F97316',
  SUBMIT_DRAFT: '#8B5CF6', REASSIGN: '#3B82F6', default: '#9CA3AF',
};

const RequestStatusBadge = ({ status }) => {
  const cfg = REQUEST_STATUS_MAP[status] || { bg: '#F3F4F6', color: '#6B7280', label: status };
  return <Pill bg={cfg.bg} color={cfg.color}>{cfg.label || status}</Pill>;
};
const OfficialStatusBadge = ({ status }) => {
  const cfg = OFFICIAL_STATUS_MAP[status] || { bg: '#F3F4F6', color: '#6B7280' };
  return <Pill bg={cfg.bg} color={cfg.color}>{status}</Pill>;
};

// Parse server date — DB dump shows SET time_zone="+00:00", so MySQL timestamps are UTC.
// Append 'Z' to treat bare strings as UTC, then display in local browser time.
const parseDate = (d) => {
  if (!d) return null;
  let s = String(d).trim();
  // Already has timezone info — use as-is
  if (s.includes('Z') || s.includes('+') || (s.includes('-') && s.lastIndexOf('-') > 7)) {
    return new Date(s);
  }
  // "2026-03-03 09:03:00" — MySQL TIMESTAMP (UTC), convert space to T and add Z
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) return new Date(s.replace(' ', 'T') + 'Z');
  // "2026-03-03T09:03:00" — ISO without timezone, treat as UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) return new Date(s + 'Z');
  return new Date(s);
};

const fmtTime = (d) => {
  const date = parseDate(d);
  if (!date || isNaN(date)) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${Math.max(0, diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
};
const fmtFull = (d) => {
  const date = parseDate(d);
  if (!date || isNaN(date)) return '—';
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};
const fmtDate = (d) => {
  const date = parseDate(d);
  if (!date || isNaN(date)) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
};

// ─── TICKET DETAIL VIEW ─────────────────────────────────────────────────────────
const TicketDetailView = ({ ticket, userId, username, userEmail, profileImage, onBack }) => {
  const [comments, setComments]     = useState([]);
  const [history, setHistory]       = useState([]);
  const [fullTicket, setFullTicket] = useState(null); // full draft/official ticket data
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting]       = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const commentsEndRef              = useRef(null);
  const textareaRef                 = useRef(null);

  // Merge base ticket with fullTicket so summary/resolution_path are available
  const t = fullTicket ? { ...ticket, ...fullTicket } : ticket;

  useEffect(() => {
    if (!ticket) return;

    const reqStatus = ticket.request_status || ticket.status;
    const requestId = ticket.request_id || ticket.id;

    console.log('[TicketDetail] reqStatus:', reqStatus, 'requestId:', requestId, 'ticket:', ticket);

    if (reqStatus === 'ticket') {
      // ── Official ticket: find via tickets_user_mapping using request_id ──
      // Fetch all official tickets and find the one linked to this request
      fetch(`${API_URL}/admin/official-tickets`)
        .then(r => r.ok ? r.json() : [])
        .then(list => {
          const found = Array.isArray(list) ? list.find(tk =>
            tk.request_id === requestId ||
            tk.user_request_id === requestId ||
            (tk.linked_requests && tk.linked_requests.some(r => String(r.id) === String(requestId)))
          ) : null;
          if (found) {
            console.log('[TicketDetail] matched official ticket:', found);
            setFullTicket(found);
            // Fetch comments using the official ticket id
            const tkId = found.id || found.ticket_id;
            if (tkId) {
              setLoadingComments(true);
              fetch(`${API_URL}/tickets/${tkId}/comments`)
                .then(r => r.ok ? r.json() : [])
                .then(d => { setComments(Array.isArray(d) ? d : []); setLoadingComments(false); })
                .catch(() => setLoadingComments(false));
              fetch(`${API_URL}/ticket-history?ticketId=${tkId}`)
                .then(r => r.ok ? r.json() : [])
                .then(d => setHistory(Array.isArray(d) ? d : []))
                .catch(() => {});
            }
          } else {
            console.warn('[TicketDetail] no official ticket found for requestId:', requestId);
            setLoadingComments(false);
          }
        })
        .catch(() => setLoadingComments(false));

    } else {
      // ── Draft/received: find draft via linked_requests ──
      setLoadingComments(false);
      fetch(`${API_URL}/admin/draft-tickets`)
        .then(r => r.ok ? r.json() : [])
        .then(list => {
          const found = Array.isArray(list) ? list.find(d =>
            d.linked_requests?.some(r => String(r.id) === String(requestId))
          ) : null;
          if (found) {
            console.log('[TicketDetail] matched draft:', found);
            setFullTicket(found);
          }
        })
        .catch(() => {});
    }
  }, [ticket?.request_id, ticket?.id, ticket?.request_status, ticket?.status]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handlePostComment = async () => {
    if (!newComment.trim() || posting) return;
    const id = fullTicket?.id || fullTicket?.ticket_id || ticket.official_ticket_id;
    if (!id) { toast('error', 'Not available', 'Comments only available on approved tickets.'); setPosting(false); return; }
    setPosting(true);
    try {
      const r = await fetch(`${API_URL}/tickets/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: username, user_email: userEmail, message: newComment }),
      });
      if (r.ok) {
        const optimistic = {
          id: Date.now(), user_name: username, user_email: userEmail,
          profile_image: profileImage, message: newComment,
          created_at: new Date().toISOString(), is_own: true,
        };
        setComments(prev => [...prev, optimistic]);
        setNewComment('');
        toast('success', 'Comment posted');
        setTimeout(() => textareaRef.current?.focus(), 100);
      } else {
        toast('error', 'Failed', 'Could not post comment.');
      }
    } catch { toast('error', 'Error', 'Network error.'); }
    finally { setPosting(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePostComment();
    }
  };

  // Build timeline from: request creation, draft creation, ticket approval, status changes, comments
  const timelineItems = [
    // 1. User submitted the request
    {
      label: 'Request submitted',
      sub: ticket.message || ticket.original_message || '',
      time: ticket.created_at,
      color: '#10B981', icon: '📨',
    },
    // 2. Draft created (if draft_ticket_id exists and fullTicket has created_at)
    ...(ticket.draft_ticket_id && fullTicket?.created_at && fullTicket.created_at !== ticket.created_at ? [{
      label: 'AI draft created',
      sub: fullTicket.title || '',
      time: fullTicket.created_at,
      color: '#8B5CF6', icon: '🤖',
    }] : []),
    // 3. Official ticket created (if status = 'ticket' and fullTicket has ticket created_at)
    ...((ticket.request_status === 'ticket' || ticket.status === 'ticket') && fullTicket?.id && fullTicket?.created_at ? [{
      label: 'Ticket approved & created',
      sub: fullTicket.ticket_no || '',
      time: fullTicket.created_at,
      color: '#059669', icon: '🎫',
    }] : []),
    // 4. Status change history from ticket_history table
    ...history.map(h => ({
      label: h.action_type === 'STATUS_CHANGE'
        ? `${h.old_value || 'New'} → ${h.new_value}`
        : h.action_type.replace(/_/g, ' '),
      sub: h.performed_by_name || '',
      time: h.created_at,
      color: h.action_type === 'STATUS_CHANGE'
        ? (h.new_value === 'Solved' ? '#059669' : h.new_value === 'Failed' ? '#EF4444' : '#3B82F6')
        : TIMELINE_COLORS[h.action_type] || TIMELINE_COLORS.default,
      icon: h.action_type === 'STATUS_CHANGE'
        ? (h.new_value === 'Solved' ? '✅' : h.new_value === 'Failed' ? '❌' : '🔄')
        : '📝',
    })),
    // 5. Comments
    ...comments.map(c => ({
      label: `${c.user_name || c.user_email || 'User'} commented`,
      sub: (c.message || '').substring(0, 45) + ((c.message || '').length > 45 ? '…' : ''),
      time: c.created_at,
      color: '#F97316', icon: '💬',
    })),
  ]
    .filter(item => item.time) // remove items with no timestamp
    .sort((a, b) => new Date(a.time) - new Date(b.time));

  // Determine status color for header stripe
  // Status: prefer fullTicket.status (official) > official_status > request_status
  const officialStatus = fullTicket?.status || t.official_status;
  const statusCfg = officialStatus
    ? OFFICIAL_STATUS_MAP[officialStatus] || { bg: '#F3F4F6', color: '#6B7280' }
    : REQUEST_STATUS_MAP[t.request_status] || { bg: '#F3F4F6', color: '#6B7280' };

  return (
    <div style={{ animation: 'fdIn 0.25s ease' }}>
      <style>{`
        @keyframes fdIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes msgIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        .comment-bubble:hover { background: #F9FAFB !important; }
        .send-btn:hover:not(:disabled) { transform: scale(1.04); box-shadow: 0 4px 14px rgba(249,115,22,0.4) !important; }
        .back-btn:hover { background: #F9FAFB !important; border-color: #D1D5DB !important; }
        textarea:focus { border-color: #F97316 !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.1) !important; }
        .ticket-row-clickable { transition: all 0.15s ease; }
        .ticket-row-clickable:hover { background: #FFF7ED !important; cursor: pointer; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 16, overflow: 'hidden' }}>
        {/* Color stripe */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${statusCfg.color}, ${statusCfg.color}88)` }} />

        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Back button */}
          <button className="back-btn" onClick={onBack}
            style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0, transition: 'all 0.15s' }}>←</button>

          {/* Ticket info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              {t.ticket_no && (
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#F97316', fontWeight: 700, background: '#FFF7ED', padding: '2px 8px', borderRadius: 6, border: '1px solid #FED7AA' }}>
                  {t.ticket_no || `#${t.official_ticket_id || t.id}`}
                </span>
              )}
              <span style={{ fontWeight: 800, fontSize: 16, color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.title || t.ai_title || 'Ticket'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {officialStatus
                ? <OfficialStatusBadge status={officialStatus} />
                : <RequestStatusBadge status={t.request_status} />}
              {t.category && <Pill bg='#E3F2FD' color='#1565C0'>{t.category}</Pill>}
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>Opened {fmtFull(t.created_at)}</span>
            </div>
          </div>

          {/* Meta pills */}
          <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
            {t.assignee_name && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Assignee</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Avatar size={22} name={t.assignee_name} />
                  <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{t.assignee_name}</span>
                </div>
              </div>
            )}
            {t.deadline && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Due</div>
                <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{fmtDate(t.deadline)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Three-column body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 200px', gap: 14, alignItems: 'start' }}>

        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>



          {/* Original Request */}
          <div style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFF3E0)', border: '1px solid #FED7AA', borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>📋</span> Your Original Request
            </div>
            <div style={{ fontSize: 13, color: '#1A1A2E', fontStyle: 'italic', lineHeight: 1.7 }}>
              "{t.original_message || (t.linked_requests && t.linked_requests[0]?.message) || t.message || '—'}"
            </div>
          </div>

          {/* ── Discussion / Chat ── */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', minHeight: 360 }}>
            {/* Chat header */}
            <div style={{ padding: '13px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 14 }}>💬</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>Discussion</span>
              {comments.length > 0 && (
                <Pill bg='#FFF7ED' color='#F97316'>{comments.length} message{comments.length !== 1 ? 's' : ''}</Pill>
              )}
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingComments ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 8, animation: 'fdIn 0.5s ease infinite alternate' }}>⏳</div>
                    Loading messages…
                  </div>
                </div>
              ) : comments.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>
                    {(ticket.request_status || ticket.status) === 'ticket' ? '💬' : '⏳'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {(ticket.request_status || ticket.status) === 'ticket' ? 'No messages yet' : 'Pending admin review'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
                    {(ticket.request_status || ticket.status) === 'ticket'
                      ? 'Start the conversation below. The support team will reply here.'
                      : 'Your request is being reviewed. Discussion will be available once the ticket is approved.'}
                  </div>
                </div>
              ) : (
                comments.map((c, i) => {
                  const isOwn = c.is_own || c.user_email === userEmail;
                  return (
                    <div key={c.id || i}
                      style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end', animation: 'msgIn 0.2s ease' }}>
                      <Avatar img={c.profile_image} size={30} name={c.user_name || c.user_email} />
                      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{c.user_name || c.user_email || 'User'}</span>
                          <span style={{ fontSize: 10, color: '#9CA3AF' }}>{fmtTime(c.created_at)}</span>
                          {isOwn && <Pill bg='#FFF7ED' color='#F97316' style={{ fontSize: 9 }}>You</Pill>}
                        </div>
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: isOwn ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                          background: isOwn
                            ? 'linear-gradient(135deg, #F97316, #EA580C)'
                            : '#F3F4F6',
                          color: isOwn ? 'white' : '#1A1A2E',
                          fontSize: 13,
                          lineHeight: 1.6,
                          wordBreak: 'break-word',
                          boxShadow: isOwn ? '0 2px 8px rgba(249,115,22,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
                        }}>
                          {c.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <Avatar img={profileImage} size={30} name={username} />
                <div style={{ flex: 1, position: 'relative' }}>
                  <textarea
                    ref={textareaRef}
                    rows={2}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={(ticket.request_status || ticket.status) === "ticket" ? "Type a message…  Ctrl+Enter to send" : "Discussion available after admin approves the ticket"}
                    disabled={(ticket.request_status || ticket.status) !== "ticket"}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1.5px solid #E5E7EB',
                      borderRadius: 10,
                      fontSize: 13,
                      background: 'white',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      color: '#1A1A2E',
                    }}
                  />
                </div>
                <button
                  className="send-btn"
                  onClick={handlePostComment}
                  disabled={posting || !newComment.trim()}
                  style={{
                    width: 42, height: 42,
                    background: posting || !newComment.trim()
                      ? '#E5E7EB'
                      : 'linear-gradient(135deg,#F97316,#EA580C)',
                    color: posting || !newComment.trim() ? '#9CA3AF' : 'white',
                    border: 'none',
                    borderRadius: 11,
                    cursor: posting || !newComment.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                    transition: 'all 0.15s',
                    boxShadow: posting || !newComment.trim() ? 'none' : '0 2px 8px rgba(249,115,22,0.3)',
                  }}>
                  {posting ? '…' : '➤'}
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 6, paddingLeft: 40 }}>
                Press <kbd style={{ background: '#E5E7EB', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontFamily: 'monospace' }}>Ctrl+Enter</kbd> to send quickly
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE column — AI Summary + Resolution Path */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* AI Summary */}
          {(t.summary || t.ai_summary) ? (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)' }}>
                <span style={{ fontSize: 13 }}>✦</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>AI Summary</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.75 }}>{t.summary || t.ai_summary}</p>
              </div>
            </div>
          ) : (
            <div style={{ background: '#FAFAFA', borderRadius: 14, border: '1px dashed #E5E7EB', padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
              AI summary not yet available
            </div>
          )}

          {/* Resolution Path */}
          {(() => {
            const rawPath = t.resolution_path || t.ai_resolution;
            let steps = [];
            if (rawPath) {
              if (Array.isArray(rawPath)) {
                steps = rawPath.filter(Boolean);
              } else {
                try { const p = JSON.parse(rawPath); steps = Array.isArray(p) ? p.filter(Boolean) : [String(rawPath)]; }
                catch { steps = String(rawPath).split(/\n+/).map(s => s.replace(/^\d+[.)\s]*/, '').trim()).filter(Boolean); }
              }
            }
            return steps.length > 0 ? (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: '11px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#EFF6FF,#EEF2FF)' }}>
                  <span style={{ fontSize: 13 }}>🛠</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>Resolution Path</span>
                  <Pill bg='#DBEAFE' color='#1D4ED8'>{steps.length} steps</Pill>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, boxShadow: '0 2px 6px rgba(249,115,22,0.3)' }}>{i + 1}</div>
                      <div style={{ fontSize: 12, color: '#1E3A5F', lineHeight: 1.65, paddingTop: 3 }}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: '#FAFAFA', borderRadius: 14, border: '1px dashed #E5E7EB', padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🛠</div>
                Resolution steps not yet available
              </div>
            );
          })()}
        </div>


        {/* RIGHT column — Timeline */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', position: 'sticky', top: 0 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12 }}>🕐</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E' }}>Timeline</span>
          </div>
          <div style={{ padding: '14px 14px', maxHeight: 560, overflowY: 'auto' }}>
            {timelineItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: '20px 0' }}>No activity yet</div>
            ) : (
              timelineItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', position: 'relative' }}>
                  {i < timelineItems.length - 1 && (
                    <div style={{ position: 'absolute', left: 9, top: 18, width: 2, height: 'calc(100% - 4px)', background: `${item.color}22`, zIndex: 0 }} />
                  )}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: `${item.color}18`,
                    border: `2px solid ${item.color}`,
                    flexShrink: 0, marginTop: 2, zIndex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.4 }}>{item.label}</div>
                    {item.sub && <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2, lineHeight: 1.4 }}>{item.sub}</div>}
                    <div style={{ fontSize: 10, color: '#D1D5DB', marginTop: 3 }}>{fmtTime(item.time)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Submit Request View ────────────────────────────────────────────────────────
const SubmitRequestView = ({ userEmail, userId, onSuccess }) => {
  const [requestMessage, setRequestMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestMessage.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/user-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: userEmail, message: requestMessage, user_id: userId }),
      });
      if (response.ok) {
        toast('success', 'Request Submitted', 'AI has generated a draft for the Admin to review.');
        setRequestMessage('');
        if (onSuccess) onSuccess();
      } else {
        toast('error', 'Failed', 'Could not send request.');
      }
    } catch (err) {
      toast('error', 'Error', 'Failed to send request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 540, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 6px 20px rgba(249,115,22,0.3)' }}>
          <span style={{ fontSize: 28 }}>💬</span>
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1A1A2E' }}>How can we help?</h2>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#9CA3AF' }}>Describe your issue and our AI will process it for you</p>
      </div>
      <Card style={{ padding: 28 }}>
        {userEmail && userEmail !== 'null' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '7px 12px', marginBottom: 18 }}>
            <span style={{ fontSize: 12 }}>✉️</span>
            <span style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 500 }}>{userEmail}</span>
          </div>
        )}
        <form onSubmit={handleSubmitRequest}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Submit New Request (AI Handled) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea rows={5} value={requestMessage} onChange={e => setRequestMessage(e.target.value)}
              placeholder="Describe your issue..." required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: 'white', color: '#111827', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit', transition: 'border-color 0.15s' }}
              onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#E5E7EB' : 'linear-gradient(135deg,#F97316,#EA580C)', color: loading ? '#9CA3AF' : 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 8px rgba(249,115,22,0.3)', transition: 'all 0.15s' }}>
            {loading ? 'Processing...' : 'Send Request to AI →'}
          </button>
        </form>
      </Card>
      <div style={{ marginTop: 14, padding: '11px 15px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 12, color: '#92400E', display: 'flex', gap: 8 }}>
        <span>💡</span>
        <span>Your request will be reviewed by AI and then an admin. Track progress under <strong>Track My Tickets</strong>.</span>
      </div>
    </div>
  );
};

// ─── Track Tickets View ─────────────────────────────────────────────────────────
const TrackTicketsView = ({ userId, onOpenTicket }) => {
  const [userTickets, setUserTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/users/${userId}/tickets`)
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        const arr = Array.isArray(d) ? d : [];
        console.log('[TrackTickets] API response sample:', arr[0]);
        setUserTickets(arr);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return <Card style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading your tickets...</Card>;

  return (
    <Card>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>Track My Tickets</span>
        <Pill bg='#F3F4F6' color='#6B7280'>{userTickets.length} total</Pill>
      </div>
      {userTickets.length === 0
        ? <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No tickets found.</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Submit a request to get started</div>
          </div>
        : <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Date</TH>
                  <TH>Your Request</TH>
                  <TH>AI Draft Title</TH>
                  <TH>Status</TH>
                  <TH>Official Status</TH>
                  <TH></TH>
                </tr>
              </thead>
              <tbody>
                {userTickets.map((t, idx) => {
                  return (
                    <tr
                      key={`${t.request_id || t.id}-${idx}`}
                      style={{ background: 'white', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      onClick={() => onOpenTicket && onOpenTicket(t)}
                    >
                      <TD s={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(t.created_at)}</TD>
                      <TD>
                        <div style={{ fontWeight: 500, color: '#1A1A2E', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.original_message || t.message}
                        </div>
                      </TD>
                      <TD s={{ color: '#6B7280', fontStyle: 'italic' }}>
                        {t.ai_title || t.title || <span style={{ color: '#D1D5DB' }}>Processing...</span>}
                      </TD>
                      <TD><RequestStatusBadge status={t.request_status || t.status} /></TD>
                      <TD>
                        {t.official_status
                          ? <OfficialStatusBadge status={t.official_status} />
                          : <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>}
                      </TD>
                      <TD>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F97316', fontWeight: 600, fontSize: 12 }}>
                          <span>View</span>
                          <span style={{ fontSize: 14 }}>→</span>
                        </div>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>}
    </Card>
  );
};

// ─── History View ───────────────────────────────────────────────────────────────
const HistoryView = ({ userId, role }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/ticket-history?userId=${userId}&role=${role}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setHistoryData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId, role]);

  if (loading) return <Card style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading history...</Card>;

  return (
    <Card>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>Ticket Activity History</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Track all changes and updates</div>
        </div>
        <Pill bg='#F3F4F6' color='#6B7280'>👁 Read-Only View</Pill>
      </div>
      {historyData.length === 0
        ? <div style={{ padding: 56, textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 13 }}>No activity history found.</div>
          </div>
        : <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><TH>Ticket ID</TH><TH>Action</TH><TH>Update Details</TH><TH>Performed By</TH><TH>Timestamp</TH></tr>
              </thead>
              <tbody>
                {historyData.map((log, i) => (
                  <tr key={i} style={{ background: 'white' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <TD s={{ fontWeight: 700, color: '#F97316' }}>#{log.ticket_id}</TD>
                    <TD>
                      <Pill
                        bg={log.action_type === 'STATUS_CHANGE' ? '#ECFDF5' : log.action_type === 'ASSIGNED' ? '#EFF6FF' : '#FFFBEB'}
                        color={log.action_type === 'STATUS_CHANGE' ? '#059669' : log.action_type === 'ASSIGNED' ? '#1D4ED8' : '#D97706'}>
                        {log.action_type}
                      </Pill>
                    </TD>
                    <TD>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>{log.old_value || 'None'}</span>
                        <span style={{ color: '#F97316', fontSize: 12 }}>→</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{log.new_value}</span>
                      </div>
                    </TD>
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

// ─── NAV ───────────────────────────────────────────────────────────────────────
const NAV = [
  { icon: '/request.png', label: 'Submit Request',   view: 'user-requests'  },
  { icon: '/ticket.png',  label: 'Track My Tickets', view: 'track-tickets'  },
  { icon: '/history.png', label: 'Ticket History',   view: 'history'        },
];
const PAGE_TITLES = {
  'user-requests': 'Submit a Request',
  'track-tickets': 'Track My Tickets',
  'history':       'Ticket History',
};

// ─── MAIN USER PAGE ─────────────────────────────────────────────────────────────
export default function UserPage({
  onLogout,
  username = 'User',
  userEmail = '',
  profileImage,
  userId,
  role = 'user',
}) {
  const [currentView, setCurrentView]       = useState('user-requests');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [refreshKey, setRefreshKey]         = useState(0);

  const handleNavChange = (view) => {
    setCurrentView(view);
    setSelectedTicket(null);
  };

  const topBarTitle = PAGE_TITLES[currentView];

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F5F5F5', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>

      {/* Sidebar */}
      <div style={{ width: 210, background: '#1A1A2E', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '2px 0 8px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #2D2D4E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/CeiLogoColor.png" style={{ height: 44, objectFit: 'contain' }} alt="CEI" />
        </div>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #2D2D4E', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Avatar img={profileImage} size={54} name={username} />
          <div style={{ color: 'white', fontSize: 13, fontWeight: 600, marginTop: 10 }}>{username}</div>
          {userEmail && userEmail !== 'null' && userEmail.trim() !== '' && (
            <div style={{ color: '#9CA3AF', fontSize: 10, marginTop: 3, wordBreak: 'break-all', padding: '0 6px', lineHeight: 1.4 }}>{userEmail}</div>
          )}
          <div style={{ marginTop: 8 }}>
            <Pill bg='rgba(255,255,255,0.07)' color='#9CA3AF'>Personal Account</Pill>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          <div style={{ padding: '6px 16px 4px', fontSize: 10, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>My Activity</div>
          {NAV.map(item => {
            const active = currentView === item.view;
            return (
              <div key={item.view} onClick={() => handleNavChange(item.view)}
                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: active ? '#F97316' : 'transparent', color: active ? 'white' : '#9CA3AF', fontSize: 13, fontWeight: active ? 600 : 400, borderLeft: active ? '3px solid rgba(255,255,255,0.3)' : '3px solid transparent', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#2D2D4E'; e.currentTarget.style.color = 'white'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; } }}>
                <img src={item.icon} alt="" style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0, filter: active ? 'brightness(0) invert(1)' : 'brightness(0) invert(0.6)' }}
                  onError={e => e.target.style.display = 'none'} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </div>
            );
          })}
        </nav>
        <div onClick={onLogout}
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#EF4444', fontSize: 13, borderTop: '1px solid #2D2D4E', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <img src="/logout.png" alt="logout" style={{ width: 16, height: 16, objectFit: 'contain', filter: 'invert(40%) sepia(80%) saturate(500%) hue-rotate(320deg)' }} />
          <span>Logout</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ background: 'white', height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0, gap: 8 }}>
          {selectedTicket && (
            <button onClick={() => setSelectedTicket(null)}
              style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#6B7280' }}>←</button>
          )}
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>{topBarTitle}</span>
          {selectedTicket && (
            <>
              <span style={{ color: '#D1D5DB', fontSize: 14 }}>›</span>
              <span style={{ fontSize: 13, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedTicket.title || selectedTicket.ai_title || `Request #${selectedTicket.request_id || selectedTicket.id}`}
              </span>
            </>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {currentView === 'track-tickets' && selectedTicket ? (
            <TicketDetailView
              ticket={selectedTicket}
              userId={userId}
              username={username}
              userEmail={userEmail}
              profileImage={profileImage}
              onBack={() => setSelectedTicket(null)}
            />
          ) : (
            <>
              {currentView === 'user-requests' && (
                <SubmitRequestView
                  userEmail={userEmail}
                  userId={userId}
                  onSuccess={() => setRefreshKey(k => k + 1)}
                />
              )}
              {currentView === 'track-tickets' && (
                <TrackTicketsView
                  key={refreshKey}
                  userId={userId}
                  onOpenTicket={t => setSelectedTicket(t)}
                />
              )}
              {currentView === 'history' && (
                <HistoryView userId={userId} role={role} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
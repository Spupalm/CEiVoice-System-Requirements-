// ─── UserPage.jsx ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  API_URL, toast,
  Pill, Avatar, Card, TH, TD, EmptyRow, StatusPill,
  fmtFull, fmtDate, fmtTime,
  REQUEST_STATUS_MAP, OFFICIAL_STATUS_MAP, TIMELINE_COLORS,
  RequestStatusBadge, OfficialStatusBadge,
  Sidebar,
} from './Shared';

// ─── Responsive hook ──────────────────────────────────────────────────────────
const useBreakpoint = () => {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return {
    isMobile: w < 640,
    isTablet: w >= 640 && w < 1024,
    isDesktop: w >= 1024,
    width: w,
  };
};

// ─── Ticket Detail View ───────────────────────────────────────────────────────
const TicketDetailView = ({ ticket, userId, username, userEmail, profileImage, onBack }) => {
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [fullTicket, setFullTicket] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const commentsEndRef = useRef(null);
  const textareaRef = useRef(null);
  const t = fullTicket ? { ...ticket, ...fullTicket } : ticket;
  const { isMobile, isTablet } = useBreakpoint();

  useEffect(() => {
    if (!ticket) return;
    const reqStatus = ticket.request_status || ticket.status;
    const requestId = ticket.request_id || ticket.id;

    if (reqStatus === 'ticket') {
      fetch(`${API_URL}/admin/official-tickets`).then(r => r.ok ? r.json() : []).then(list => {
        const found = Array.isArray(list) ? list.find(tk =>
          tk.id === ticket.official_ticket_id ||
          (ticket.ticket_no && tk.ticket_no === ticket.ticket_no) ||
          tk.request_id === requestId || tk.user_request_id === requestId ||
          (tk.linked_requests && tk.linked_requests.some(r => String(r.id) === String(requestId)))
        ) : null;

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

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  useEffect(() => {
    const tkId = fullTicket?.id || fullTicket?.ticket_id || ticket?.official_ticket_id;
    if (!tkId) return;
    const interval = setInterval(() => {
      fetch(`${API_URL}/tickets/${tkId}/comments`).then(r => r.ok ? r.json() : []).then(data => {
        const newComments = Array.isArray(data) ? data : [];
        setComments(prev => prev.length !== newComments.length ? newComments : prev);
      }).catch(() => {});
      fetch(`${API_URL}/assignee/history/${tkId}`).then(r => r.ok ? r.json() : []).then(data => {
        const newHistory = Array.isArray(data) ? data : [];
        setHistory(prev => prev.length !== newHistory.length ? newHistory : prev);
      }).catch(() => {});
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
    ...history.map(h => ({
      label: h.action_type === 'STATUS_CHANGE' ? `${h.old_value || 'New'} → ${h.new_value}` : h.action_type.replace(/_/g, ' '),
      sub: h.performed_by_name || '', time: h.created_at,
      color: h.action_type === 'STATUS_CHANGE' ? (h.new_value === 'Solved' ? '#059669' : h.new_value === 'Failed' ? '#EF4444' : '#3B82F6') : TIMELINE_COLORS[h.action_type] || TIMELINE_COLORS.default,
      icon: h.action_type === 'STATUS_CHANGE' ? (h.new_value === 'Solved' ? '✅' : h.new_value === 'Failed' ? '❌' : '🔄') : '📝',
    })),
    ...comments.map(c => ({
      label: `${c.user_name || c.user_email || 'User'} commented`,
      sub: (c.message || '').substring(0, 45) + ((c.message || '').length > 45 ? '…' : ''),
      time: c.created_at, color: '#F97316', icon: '💬',
    })),
  ].filter(i => i.time).sort((a, b) => new Date(a.time) - new Date(b.time));

  const officialStatus = fullTicket?.status || t.official_status;
  const statusCfg = officialStatus
    ? (OFFICIAL_STATUS_MAP[officialStatus] || { bg: '#F3F4F6', color: '#6B7280' })
    : (REQUEST_STATUS_MAP[t.request_status] || { bg: '#F3F4F6', color: '#6B7280' });

  const rawPath = t.resolution_path || t.ai_resolution;
  let resolutionSteps = [];
  if (rawPath) {
    if (Array.isArray(rawPath)) resolutionSteps = rawPath.filter(Boolean);
    else { try { const p = JSON.parse(rawPath); resolutionSteps = Array.isArray(p) ? p.filter(Boolean) : [String(rawPath)]; } catch { resolutionSteps = String(rawPath).split(/\n+/).map(s => s.replace(/^\d+[.)\s]*/, '').trim()).filter(Boolean); } }
  }

  // Timeline drawer for mobile
  const TimelineDrawer = () => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.4)',
      display: showTimeline ? 'flex' : 'none',
      alignItems: 'flex-end',
    }} onClick={() => setShowTimeline(false)}>
      <div style={{
        background: 'white', borderRadius: '16px 16px 0 0',
        width: '100%', maxHeight: '70vh', overflowY: 'auto',
        padding: '16px 0',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px', borderBottom: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>🕐 Timeline</span>
          <button onClick={() => setShowTimeline(false)} style={{ border: 'none', background: '#F3F4F6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {timelineItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', position: 'relative' }}>
              {i < timelineItems.length - 1 && <div style={{ position: 'absolute', left: 9, top: 18, width: 2, height: 'calc(100% - 4px)', background: `${item.color}22`, zIndex: 0 }} />}
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${item.color}18`, border: `2px solid ${item.color}`, flexShrink: 0, marginTop: 2, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>{item.icon}</div>
              <div style={{ flex: 1, paddingBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E', lineHeight: 1.4 }}>{item.label}</div>
                {item.sub && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{item.sub}</div>}
                <div style={{ fontSize: 10, color: '#D1D5DB', marginTop: 3 }}>{fmtTime(item.time)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fdIn 0.25s ease' }}>
      <style>{`
        @keyframes fdIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Mobile Timeline Drawer */}
      {isMobile && <TimelineDrawer />}

      {/* Header */}
      <div style={{ background: 'white', borderRadius: isMobile ? 10 : 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${statusCfg.color}, ${statusCfg.color}88)` }} />
        <div style={{ padding: isMobile ? '12px 14px' : '16px 20px', display: 'flex', alignItems: 'flex-start', gap: isMobile ? 10 : 14 }}>
          <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              {t.ticket_no && <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#F97316', fontWeight: 700, background: '#FFF7ED', padding: '2px 7px', borderRadius: 6, border: '1px solid #FED7AA' }}>{t.ticket_no}</span>}
              <span style={{ fontWeight: 800, fontSize: isMobile ? 14 : 16, color: '#1A1A2E', wordBreak: 'break-word' }}>{t.title || t.ai_title || 'Ticket'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {officialStatus ? <OfficialStatusBadge status={officialStatus} /> : <RequestStatusBadge status={t.request_status} />}
              {t.category && !isMobile && <Pill bg='#E3F2FD' color='#1565C0'>{t.category}</Pill>}
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtDate(t.created_at)}</span>
            </div>
            {/* Mobile: assignee + deadline inline */}
            {isMobile && (t.assignee_name || t.deadline) && (
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {t.assignee_name && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Avatar size={18} name={t.assignee_name} /><span style={{ fontSize: 11, color: '#374151' }}>{t.assignee_name}</span></div>}
                {t.deadline && <span style={{ fontSize: 11, color: '#6B7280' }}>Due: {fmtDate(t.deadline)}</span>}
              </div>
            )}
          </div>
          {/* Desktop: assignee + deadline */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
              {t.assignee_name && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Assignee</div><div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Avatar size={22} name={t.assignee_name} /><span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{t.assignee_name}</span></div></div>}
              {t.deadline && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>Due</div><span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{fmtDate(t.deadline)}</span></div>}
            </div>
          )}
          {/* Mobile: timeline button */}
          {isMobile && timelineItems.length > 0 && (
            <button onClick={() => setShowTimeline(true)} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🕐</button>
          )}
        </div>
      </div>

      {/* Body: responsive layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 240px' : '1fr 280px 200px',
        gap: isMobile ? 12 : 14,
        alignItems: 'start',
      }}>
        {/* Left: original request + chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFF3E0)', border: '1px solid #FED7AA', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>📋 Your Original Request</div>
            <div style={{ fontSize: 13, color: '#1A1A2E', fontStyle: 'italic', lineHeight: 1.7 }}>"{t.original_message || t.linked_requests?.[0]?.message || t.message || '—'}"</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', minHeight: isMobile ? 300 : 360 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 14 }}>💬</span><span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>Discussion</span>
              {comments.length > 0 && <Pill bg='#FFF7ED' color='#F97316'>{comments.length} message{comments.length !== 1 ? 's' : ''}</Pill>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', maxHeight: isMobile ? 280 : 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>⏳ Loading messages…</div>
              ) : comments.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', color: '#9CA3AF' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{(ticket.request_status || ticket.status) === 'ticket' ? '💬' : '⏳'}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{(ticket.request_status || ticket.status) === 'ticket' ? 'No messages yet' : 'Pending admin review'}</div>
                </div>
              ) : comments.map((c, i) => {
                const isOwn = c.is_own || c.user_email === userEmail;
                return (
                  <div key={c.id || i} style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', animation: 'msgIn 0.2s ease' }}>
                    <Avatar img={c.profile_image} size={28} name={c.user_name || c.user_email} />
                    <div style={{ maxWidth: isMobile ? '82%' : '72%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{c.user_name || c.user_email || 'User'}</span>
                        <span style={{ fontSize: 10, color: '#9CA3AF' }}>{fmtTime(c.created_at)}</span>
                      </div>
                      <div style={{ padding: '9px 13px', borderRadius: isOwn ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: isOwn ? 'linear-gradient(135deg,#F97316,#EA580C)' : '#F3F4F6', color: isOwn ? 'white' : '#1A1A2E', fontSize: 13, lineHeight: 1.6, wordBreak: 'break-word' }}>{c.message}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                {!isMobile && <Avatar img={profileImage} size={28} name={username} />}
                <textarea ref={textareaRef} rows={isMobile ? 2 : 2} value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handlePostComment(); } }}
                  placeholder={(ticket.request_status || ticket.status) === 'ticket' ? (isMobile ? 'Type a message…' : 'Type a message…  Ctrl+Enter to send') : 'Available after admin approves'}
                  disabled={(ticket.request_status || ticket.status) !== 'ticket'}
                  style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: 'white', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }} />
                <button onClick={handlePostComment} disabled={posting || !newComment.trim() || (ticket.request_status || ticket.status) !== 'ticket'}
                  style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: posting || !newComment.trim() ? 0.5 : 1 }}>→</button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: AI Summary + Resolution Path + Assignee Resolution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(t.summary || t.ai_summary) ? (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F0FDF4,#ECFDF5)' }}>
                <span>✦</span><span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>AI Summary</span>
              </div>
              <div style={{ padding: '12px 14px' }}><p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.75 }}>{t.summary || t.ai_summary}</p></div>
            </div>
          ) : <div style={{ background: '#FAFAFA', borderRadius: 12, border: '1px dashed #E5E7EB', padding: '20px 14px', textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>✦ AI summary not yet available</div>}

          {resolutionSteps.length > 0 && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#EFF6FF,#EEF2FF)' }}>
                <span>🛠</span><span style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>Resolution Path</span>
                <Pill bg='#DBEAFE' color='#1D4ED8'>{resolutionSteps.length} steps</Pill>
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resolutionSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 12, color: '#1E3A5F', lineHeight: 1.65, paddingTop: 3 }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(t.official_status === 'Solved' || t.official_status === 'Failed') && t.resolution_comment && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6, background: t.official_status === 'Solved' ? 'linear-gradient(135deg,#F0FDF4,#ECFDF5)' : 'linear-gradient(135deg,#FEF2F2,#FEF2F2)' }}>
                <span>{t.official_status === 'Solved' ? '✅' : '❌'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: t.official_status === 'Solved' ? '#059669' : '#DC2626' }}>Assignee Resolution</span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{t.resolution_comment}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline — desktop only (mobile uses drawer) */}
        {!isMobile && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', overflow: 'hidden', position: 'sticky', top: 0 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12 }}>🕐</span><span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E' }}>Timeline</span>
            </div>
            <div style={{ padding: '12px 12px', maxHeight: 560, overflowY: 'auto' }}>
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
        )}
      </div>
    </div>
  );
};

// ─── Submit Request View ──────────────────────────────────────────────────────
const SubmitRequestView = ({ userId, username, userEmail, onSubmitted }) => {
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [dots, setDots] = useState('');
  const pollRef = useRef(null);
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    if (!aiProcessing) return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, [aiProcessing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestMessage.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/user-requests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: userEmail || username, message: requestMessage, user_id: userId }),
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const requestId = data.id || data.request_id;
        setRequestMessage('');
        setSubmitting(false);
        setAiProcessing(true);

        let attempts = 0;
        pollRef.current = setInterval(async () => {
          attempts++;
          try {
            const r = await fetch(`${API_URL}/users/${userId}/tickets`);
            if (!r.ok) return;
            const tickets = await r.json();
            const match = Array.isArray(tickets) ? tickets.find(t =>
              (requestId && (t.request_id === requestId || t.id === requestId)) ||
              (!requestId && tickets[tickets.length - 1])
            ) : null;
            const target = match || (Array.isArray(tickets) ? tickets[tickets.length - 1] : null);
            if (target && (target.ai_title || target.title)) {
              clearInterval(pollRef.current);
              setAiProcessing(false);
              setAiDone(true);
              setTimeout(() => { onSubmitted?.(target); }, 1200);
            }
          } catch {}
          if (attempts >= 20) {
            clearInterval(pollRef.current);
            setAiProcessing(false);
            toast('success', 'Submitted!', 'AI is still processing. Check Track My Tickets shortly.');
            onSubmitted?.();
          }
        }, 1000);
      } else {
        toast('error', 'Failed', 'Could not send request.');
        setSubmitting(false);
      }
    } catch {
      toast('error', 'Error', 'Failed to send request.');
      setSubmitting(false);
    }
  };

  if (aiProcessing || aiDone) {
    return (
      <div style={{ maxWidth: 480, margin: isMobile ? '32px auto 0' : '60px auto 0', textAlign: 'center', padding: isMobile ? '0 4px' : 0 }}>
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', padding: isMobile ? '36px 20px' : '48px 32px' }}>
          {aiDone ? (
            <>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)', fontSize: 28 }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A2E', marginBottom: 8 }}>AI Done!</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>Taking you to your ticket{dots}</div>
            </>
          ) : (
            <>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(139,92,246,0.3)', fontSize: 28, animation: 'spin 2s linear infinite' }}>🤖</div>
              <style>{`@keyframes spin { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A2E', marginBottom: 8 }}>AI is processing{dots}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Analyzing your request and generating a draft ticket</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Classifying issue', 'Generating summary', 'Building resolution path'].map((step, i) => (
                  <div key={i} style={{ padding: '4px 10px', borderRadius: 20, background: '#F3F4F6', fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{step}</div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 540, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 20 : 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 6px 20px rgba(249,115,22,0.3)' }}><span style={{ fontSize: 26 }}>💬</span></div>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1A1A2E' }}>How can we help?</h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9CA3AF' }}>Describe your issue and our AI will process it</p>
      </div>
      <Card style={{ padding: isMobile ? 18 : 28 }}>
        {userEmail && userEmail !== 'null' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '7px 12px', marginBottom: 16, overflow: 'hidden' }}>
            <span style={{ fontSize: 12, flexShrink: 0 }}>✉️</span><span style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Submit New Request (AI Handled) <span style={{ color: '#EF4444' }}>*</span></label>
            <textarea rows={5} value={requestMessage} onChange={e => setRequestMessage(e.target.value)} placeholder="Describe your issue..." required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, background: 'white', color: '#111827', outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#F97316'; }} onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }} />
          </div>
          <button type="submit" disabled={submitting}
            style={{ width: '100%', padding: '12px', background: submitting ? '#E5E7EB' : 'linear-gradient(135deg,#F97316,#EA580C)', color: submitting ? '#9CA3AF' : 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Sending...' : 'Send Request to AI →'}
          </button>
        </form>
      </Card>
      <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 12, color: '#92400E', display: 'flex', gap: 8 }}>
        <span style={{ flexShrink: 0 }}>💡</span><span>Your request will be reviewed by AI and then an admin. Track progress under <strong>Track My Tickets</strong>.</span>
      </div>
    </div>
  );
};

// ─── Track Tickets View ───────────────────────────────────────────────────────
const TrackTicketsView = ({ userId, onSelectTicket }) => {
  const [userTickets, setUserTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    fetch(`${API_URL}/users/${userId}/tickets`).then(r => r.ok ? r.json() : []).then(d => { setUserTickets(Array.isArray(d) ? d : []); setLoadingTickets(false); }).catch(() => setLoadingTickets(false));
  }, [userId]);

  if (loadingTickets) return <Card style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading your tickets...</Card>;

  return (
    <Card>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>Track My Tickets</span>
        <Pill bg='#F3F4F6' color='#6B7280'>{userTickets.length} total</Pill>
      </div>
      {userTickets.length === 0 ? (
        <div style={{ padding: 56, textAlign: 'center' }}><div style={{ fontSize: 44, marginBottom: 12 }}>📭</div><div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No tickets found.</div><div style={{ fontSize: 13, color: '#9CA3AF' }}>Submit a request to get started</div></div>
      ) : isMobile ? (
        /* Mobile: card list instead of table */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {userTickets.map((t, idx) => (
            <div key={`${t.request_id || t.id}-${idx}`}
              onClick={() => onSelectTicket(t)}
              style={{ padding: '14px 16px', borderBottom: '1px solid #F9F9F9', cursor: 'pointer', background: 'white', transition: 'background 0.15s' }}
              onTouchStart={e => e.currentTarget.style.background = '#FFF7ED'}
              onTouchEnd={e => e.currentTarget.style.background = 'white'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A2E', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.ai_title || t.title || <span style={{ color: '#D1D5DB' }}>Processing...</span>}</div>
                <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{fmtDate(t.created_at)}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.original_message || t.message}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <RequestStatusBadge status={t.request_status || t.status} />
                {t.official_status && <OfficialStatusBadge status={t.official_status} />}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#F97316', fontWeight: 600 }}>View →</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead><tr><TH>Date</TH><TH>Your Request</TH><TH>AI Draft Title</TH><TH>Status</TH><TH>Official Status</TH><TH /></tr></thead>
            <tbody>
              {userTickets.map((t, idx) => (
                <tr key={`${t.request_id || t.id}-${idx}`} style={{ background: 'white', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'} onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  onClick={() => onSelectTicket(t)}>
                  <TD s={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(t.created_at)}</TD>
                  <TD><div style={{ fontWeight: 500, color: '#1A1A2E', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.original_message || t.message}</div></TD>
                  <TD s={{ color: '#6B7280', fontStyle: 'italic', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.ai_title || t.title || <span style={{ color: '#D1D5DB' }}>Processing...</span>}</TD>
                  <TD><RequestStatusBadge status={t.request_status || t.status} /></TD>
                  <TD>{t.official_status ? <OfficialStatusBadge status={t.official_status} /> : <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>}</TD>
                  <TD><div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F97316', fontWeight: 600, fontSize: 12 }}><span>View</span><span>→</span></div></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

// ─── User History View ────────────────────────────────────────────────────────
const UserHistoryView = ({ userId, role }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    fetch(`${API_URL}/ticket-history?userId=${userId}&role=${role}`).then(r => r.ok ? r.json() : []).then(d => { setHistoryData(Array.isArray(d) ? d : []); setLoadingHistory(false); }).catch(() => setLoadingHistory(false));
  }, [userId, role]);

  if (loadingHistory) return <Card style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading history...</Card>;

  return (
    <Card>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div><div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>Ticket Activity History</div><div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Track all changes and updates</div></div>
        <Pill bg='#F3F4F6' color='#6B7280'>👁 Read-Only</Pill>
      </div>
      {historyData.length === 0
        ? <div style={{ padding: 56, textAlign: 'center', color: '#9CA3AF' }}><div style={{ fontSize: 36, marginBottom: 10 }}>📋</div><div style={{ fontSize: 13 }}>No activity history found.</div></div>
        : isMobile ? (
          /* Mobile: stacked cards */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {historyData.map((log, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #F9F9F9', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: '#F97316', fontSize: 13 }}>#{log.ticket_id}</span>
                  <StatusPill s={log.action_type} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>{log.old_value || 'None'}</span>
                  <span style={{ color: '#F97316', fontSize: 12 }}>→</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{log.new_value}</span>
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{log.performed_by_name || `User ID: ${log.performed_by}`} · {new Date(log.created_at).toLocaleString('th-TH')}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead><tr><TH>Ticket ID</TH><TH>Action</TH><TH>Update Details</TH><TH>Performed By</TH><TH>Timestamp</TH></tr></thead>
              <tbody>
                {historyData.map((log, i) => (
                  <tr key={i} style={{ background: 'white' }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <TD s={{ fontWeight: 700, color: '#F97316' }}>#{log.ticket_id}</TD>
                    <TD><StatusPill s={log.action_type} /></TD>
                    <TD><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>{log.old_value || 'None'}</span><span style={{ color: '#F97316', fontSize: 12 }}>→</span><span style={{ fontSize: 12, fontWeight: 600 }}>{log.new_value}</span></div></TD>
                    <TD s={{ fontSize: 12 }}>{log.performed_by_name || `User ID: ${log.performed_by}`}</TD>
                    <TD s={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('th-TH')}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </Card>
  );
};

// ─── Nav config ───────────────────────────────────────────────────────────────
const USER_NAV = [
  { icon: '/request.png', label: 'Submit Request', view: 'user-requests' },
  { icon: '/ticket.png', label: 'Track My Tickets', view: 'track-tickets' },
  { icon: '/history.png', label: 'Ticket History', view: 'history' },
];

const PAGE_TITLES = {
  'user-requests': 'Submit a Request',
  'track-tickets': 'Track My Tickets',
  history: 'Ticket History',
};

// ─── UserPage ─────────────────────────────────────────────────────────────────
function UserPage({ username, userEmail, onLogout, profileImage, userId, role }) {
  const [currentView, setCurrentView] = useState('user-requests');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMobile } = useBreakpoint();

  const handleNavigate = (v) => { setCurrentView(v); setSelectedTicket(null); };

  const handleSubmitted = (ticket) => {
    setRefreshKey(k => k + 1);
    if (ticket && (ticket.ai_title || ticket.title)) {
      setCurrentView('track-tickets');
      setSelectedTicket(ticket);
    } else {
      setCurrentView('track-tickets');
    }
  };

  // Page title with optional breadcrumb
  const pageTitle = PAGE_TITLES[currentView] || 'Dashboard';

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F5F5F5', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <Sidebar
        navItems={USER_NAV}
        activeView={currentView}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        profileImage={profileImage}
        username={username}
        userEmail={userEmail}
        role="user"
        collapsed={sidebarCollapsed}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar — matches AssigneePage pattern */}
        <div style={{
          background: 'white',
          height: isMobile ? 50 : 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 14px 0 12px' : '0 18px 0 16px',
          borderBottom: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          flexShrink: 0,
          gap: 8,
        }}>
          {/* Left: hamburger + title + breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <button
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setSidebarCollapsed(c => !c)}
              style={{
                background: 'none', border: 'none', color: '#1A1A2E', cursor: 'pointer',
                fontSize: 22, padding: 0, width: 32, height: 32, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {sidebarCollapsed
                ? <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>&#9776;</span>
                : <span>&#9776;</span>}
            </button>

            <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: '#1A1A2E', flexShrink: 0 }}>{pageTitle}</span>

            {selectedTicket && (
              <>
                <span style={{ color: '#D1D5DB', fontSize: 14, flexShrink: 0 }}>›</span>
                <span style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  {selectedTicket.title || selectedTicket.ai_title || `Request #${selectedTicket.request_id || selectedTicket.id}`}
                </span>
              </>
            )}
          </div>

          {/* Right: search bar */}
          <div style={{
            width: isMobile ? 120 : 300, maxWidth: '45%',
            background: '#F3F4F6', border: '1px solid #E5E7EB',
            borderRadius: 999, height: 28,
            display: 'flex', alignItems: 'center',
            padding: '0 12px', gap: 7, flexShrink: 0,
          }}>
            <span style={{ color: '#9CA3AF', fontSize: 11 }}>🔍</span>
            <span style={{ color: '#9CA3AF', fontSize: 11, letterSpacing: '0.01em' }}>Search here</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 12 : 24, WebkitOverflowScrolling: 'touch' }}>
          {currentView === 'track-tickets' && selectedTicket ? (
            <TicketDetailView ticket={selectedTicket} userId={userId} username={username} userEmail={userEmail} profileImage={profileImage} onBack={() => setSelectedTicket(null)} />
          ) : (
            <>
              {currentView === 'user-requests' && <SubmitRequestView key={refreshKey} userId={userId} username={username} userEmail={userEmail} onSubmitted={handleSubmitted} />}
              {currentView === 'track-tickets' && <TrackTicketsView key={refreshKey} userId={userId} onSelectTicket={setSelectedTicket} />}
              {currentView === 'history' && <UserHistoryView userId={userId} role={role} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserPage;
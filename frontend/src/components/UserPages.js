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

// ─── Ticket Detail View ───────────────────────────────────────────────────────
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

        {/* Middle: AI Summary + Resolution Path + Assignee Resolution */}
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

// ─── Submit Request View ──────────────────────────────────────────────────────
const SubmitRequestView = ({ userId, username, userEmail, onSubmitted }) => {
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [dots, setDots] = useState('');
  const pollRef = useRef(null);

  // Animated dots while AI processes
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

        // Poll until AI sets ai_title (meaning it's done processing)
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
          if (attempts >= 20) { // 20s timeout
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

  // AI processing screen
  if (aiProcessing || aiDone) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto 0', textAlign: 'center' }}>
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F3F4F6', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', padding: '48px 32px' }}>
          {aiDone ? (
            <>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)', fontSize: 32 }}>✓</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E', marginBottom: 8 }}>AI Done!</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>Taking you to your ticket{dots}</div>
            </>
          ) : (
            <>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(139,92,246,0.3)', fontSize: 32, animation: 'spin 2s linear infinite' }}>🤖</div>
              <style>{`@keyframes spin { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E', marginBottom: 8 }}>AI is processing{dots}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Analyzing your request and generating a draft ticket</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
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
            {submitting ? 'Sending...' : 'Send Request to AI →'}
          </button>
        </form>
      </Card>
      <div style={{ marginTop: 14, padding: '11px 15px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 12, color: '#92400E', display: 'flex', gap: 8 }}>
        <span>💡</span><span>Your request will be reviewed by AI and then an admin. Track progress under <strong>Track My Tickets</strong>.</span>
      </div>
    </div>
  );
};

// ─── Track Tickets View ───────────────────────────────────────────────────────
const TrackTicketsView = ({ userId, onSelectTicket }) => {
  const [userTickets, setUserTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/users/${userId}/tickets`).then(r => r.ok ? r.json() : []).then(d => { setUserTickets(Array.isArray(d) ? d : []); setLoadingTickets(false); }).catch(() => setLoadingTickets(false));
  }, [userId]);

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
                  onClick={() => onSelectTicket(t)}>
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

// ─── User History View ────────────────────────────────────────────────────────
const UserHistoryView = ({ userId, role }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/ticket-history?userId=${userId}&role=${role}`).then(r => r.ok ? r.json() : []).then(d => { setHistoryData(Array.isArray(d) ? d : []); setLoadingHistory(false); }).catch(() => setLoadingHistory(false));
  }, [userId, role]);

  if (loadingHistory) return <Card style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading history...</Card>;

  return (
    <Card>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><div style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>Ticket Activity History</div><div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Track all changes and updates</div></div>
        <Pill bg='#F3F4F6' color='#6B7280'>👁 Read-Only View</Pill>
      </div>
      {historyData.length === 0
        ? <div style={{ padding: 56, textAlign: 'center', color: '#9CA3AF' }}><div style={{ fontSize: 40, marginBottom: 10 }}>📋</div><div style={{ fontSize: 13 }}>No activity history found.</div></div>
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

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F5F5F5', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <Sidebar navItems={USER_NAV} activeView={currentView} onNavigate={handleNavigate} onLogout={onLogout} profileImage={profileImage} username={username} userEmail={userEmail} role="user" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'white', height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0, gap: 8 }}>
          {selectedTicket && (
            <button onClick={() => setSelectedTicket(null)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#6B7280' }}>←</button>
          )}
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>{PAGE_TITLES[currentView]}</span>
          {selectedTicket && (<><span style={{ color: '#D1D5DB', fontSize: 14 }}>›</span><span style={{ fontSize: 13, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedTicket.title || selectedTicket.ai_title || `Request #${selectedTicket.request_id || selectedTicket.id}`}</span></>)}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
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
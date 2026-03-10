// src/components/TrackPage.js
// ─── Public ticket tracking page — no login required ─────────────────────────
import React, { useEffect, useState } from 'react';
import { API_URL, fmtFull, fmtDate } from './Shared';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#0F0F14',
  surface: '#17171F',
  card: '#1E1E2A',
  border: '#2A2A3A',
  orange: '#F97316',
  orangeLight: 'rgba(249,115,22,0.12)',
  text: '#F0F0F5',
  muted: '#7A7A95',
  green: '#10B981',
  blue: '#3B82F6',
  amber: '#F59E0B',
  red: '#EF4444',
};

// ── Status config ─────────────────────────────────────────────────────────────
const REQUEST_STAGES = [
  { key: 'received', label: 'Submitted',    desc: 'Your request has been received' },
  { key: 'draft',    label: 'Under Review', desc: 'Admin is reviewing your request' },
  { key: 'ticket',   label: 'Ticket Created', desc: 'An official ticket has been created' },
];

const TICKET_STAGES = [
  { key: 'New',      label: 'New',      color: C.blue },
  { key: 'Assigned', label: 'Assigned', color: C.amber },
  { key: 'Solving',  label: 'In Progress', color: C.orange },
  { key: 'Solved',   label: 'Resolved', color: C.green },
  { key: 'Failed',   label: 'Failed',   color: C.red },
];

const REQUEST_STAGE_IDX = { received: 0, draft: 1, ticket: 2 };

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTicketStageIdx(status) {
  return TICKET_STAGES.findIndex(s => s.key === status);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: `linear-gradient(135deg, ${C.orange}, #EA580C)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: 'white', fontSize: 16, boxShadow: `0 0 16px rgba(249,115,22,0.35)`,
      }}>V</div>
      <span style={{ color: C.text, fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>
        CEi<span style={{ color: C.orange }}>Voice</span>
      </span>
    </div>
  );
}

function StatusDot({ color }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0,
    }} />
  );
}

function RequestProgressBar({ status }) {
  const currentIdx = REQUEST_STAGE_IDX[status] ?? 0;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, position: 'relative', marginBottom: 8 }}>
        {/* connecting line */}
        <div style={{
          position: 'absolute', top: 14, left: '10%', right: '10%', height: 2,
          background: C.border, zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', top: 14, left: '10%', height: 2, zIndex: 1,
          background: `linear-gradient(90deg, ${C.orange}, ${C.orange}88)`,
          width: currentIdx === 0 ? '0%' : currentIdx === 1 ? '40%' : '80%',
          transition: 'width 0.6s ease',
        }} />

        {REQUEST_STAGES.map((stage, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? C.orange : C.card,
                border: `2px solid ${done ? C.orange : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? `0 0 16px rgba(249,115,22,0.5)` : 'none',
                transition: 'all 0.3s ease',
              }}>
                {done
                  ? <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{i < currentIdx ? '✓' : '●'}</span>
                  : <span style={{ color: C.border, fontSize: 11 }}>○</span>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: done ? C.text : C.muted, letterSpacing: '0.03em' }}>
                  {stage.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TicketProgressBar({ status }) {
  const currentIdx = getTicketStageIdx(status);
  if (currentIdx === -1) return null;
  const currentColor = TICKET_STAGES[currentIdx]?.color || C.orange;
  const isFailed = status === 'Failed';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', marginBottom: 8 }}>
        <div style={{
          position: 'absolute', top: 14, left: '8%', right: '8%', height: 2,
          background: C.border, zIndex: 0,
        }} />
        {!isFailed && (
          <div style={{
            position: 'absolute', top: 14, left: '8%', height: 2, zIndex: 1,
            background: `linear-gradient(90deg, ${currentColor}, ${currentColor}88)`,
            width: `${(Math.min(currentIdx, 3) / 3) * 84}%`,
            transition: 'width 0.6s ease',
          }} />
        )}

        {TICKET_STAGES.filter(s => s.key !== 'Failed').map((stage, i) => {
          const realIdx = getTicketStageIdx(stage.key);
          const done = !isFailed && realIdx <= currentIdx;
          const active = realIdx === currentIdx && !isFailed;
          const stageColor = stage.color;
          return (
            <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? stageColor : C.card,
                border: `2px solid ${done ? stageColor : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? `0 0 16px ${stageColor}66` : 'none',
                transition: 'all 0.3s ease',
              }}>
                {done
                  ? <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{active ? '●' : '✓'}</span>
                  : <span style={{ color: C.border, fontSize: 11 }}>○</span>}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: done ? C.text : C.muted, textAlign: 'center', letterSpacing: '0.03em' }}>
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>

      {isFailed && (
        <div style={{ marginTop: 4, textAlign: 'center', color: C.red, fontSize: 12, fontWeight: 700 }}>
          ✕ This ticket was marked as Failed
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ width: 120, flexShrink: 0, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 2 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: accent || C.text, fontWeight: accent ? 600 : 400, flex: 1, wordBreak: 'break-word' }}>
        {value || '—'}
      </span>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 16, r = 6, mb = 0 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, marginBottom: mb,
      background: `linear-gradient(90deg, ${C.card} 25%, ${C.border} 50%, ${C.card} 75%)`,
      backgroundSize: '400% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function TrackPage() {
  const [data, setData]     = useState(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setError('No tracking token found in this link.');
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/track/${token}`)
      .then(async r => {
        if (!r.ok) {
          // Safely try to parse JSON error; fall back to a plain text message or status code
          const text = await r.text();
          let message = `Request failed (${r.status})`;
          try {
            const json = JSON.parse(text);
            message = json.error || json.message || message;
          } catch (_) {
            // Server returned non-JSON (e.g. HTML error page) — use the status code message
            if (r.status === 404) message = 'Tracking link not found or has expired.';
            else if (r.status === 410) message = 'This tracking link has expired.';
          }
          throw new Error(message);
        }
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  // ── Current status label ──────────────────────────────────────────────────
  const currentStatusLabel = (() => {
    if (!data) return '';
    if (data.ticket_status) {
      const s = TICKET_STAGES.find(t => t.key === data.ticket_status);
      return s ? s.label : data.ticket_status;
    }
    const s = REQUEST_STAGES.find(r => r.key === data.request_status);
    return s ? s.label : data.request_status;
  })();

  const currentStatusColor = (() => {
    if (!data) return C.orange;
    if (data.ticket_status) {
      return TICKET_STAGES.find(t => t.key === data.ticket_status)?.color || C.orange;
    }
    return data.request_status === 'ticket' ? C.green : C.orange;
  })();

  return (
    <div style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',    // add this
        top: 0,               // add this
        left: 0,              // add this
        background: C.bg,
        color: C.text,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: '0 16px 60px',
        overflowY: 'auto',    // add this so it still scrolls
        zIndex: 9999,         // add this to sit on top of everything
        }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .track-card { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        maxWidth: 680, margin: '0 auto',
        padding: '24px 0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 32,
      }}>
        <Logo />
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Request Tracker
        </span>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* ── Loading ───────────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton h={80} r={12} />
            <Skeleton h={160} r={12} />
            <Skeleton h={120} r={12} />
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="track-card" style={{
            background: C.card, border: `1px solid ${C.red}44`,
            borderRadius: 16, padding: 40, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              Link Not Found
            </div>
            <div style={{ fontSize: 14, color: C.muted, maxWidth: 320, margin: '0 auto' }}>
              {error}
            </div>
          </div>
        )}

        {/* ── Main content ──────────────────────────────────────────────────── */}
        {!loading && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Status Hero */}
            <div className="track-card" style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: '28px 28px 24px',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* glow */}
              <div style={{
                position: 'absolute', top: -40, right: -40, width: 180, height: 180,
                borderRadius: '50%', background: `radial-gradient(circle, ${currentStatusColor}18 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Current Status
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusDot color={currentStatusColor} />
                    <span style={{ fontSize: 22, fontWeight: 800, color: currentStatusColor, letterSpacing: '-0.02em' }}>
                      {currentStatusLabel}
                    </span>
                  </div>
                </div>
                {data.ticket_no && (
                  <div style={{
                    background: C.orangeLight, border: `1px solid ${C.orange}44`,
                    borderRadius: 8, padding: '6px 14px',
                    fontSize: 12, fontWeight: 700, color: C.orange, letterSpacing: '0.04em',
                  }}>
                    {data.ticket_no}
                  </div>
                )}
              </div>

              {/* Progress bar — request stage if no ticket yet, ticket stage if ticket exists */}
              {data.request_status !== 'ticket' ? (
                <RequestProgressBar status={data.request_status} />
              ) : (
                <TicketProgressBar status={data.ticket_status || 'New'} />
              )}
            </div>

            {/* Your Request */}
            <div className="track-card" style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: '22px 28px',
              animationDelay: '0.1s',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
                Your Request
              </div>
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.orange}`,
                borderRadius: 8, padding: '14px 16px',
                fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 16,
                fontStyle: 'italic',
              }}>
                "{data.original_message}"
              </div>
              <InfoRow label="Submitted" value={fmtFull(data.submitted_at)} />
              {data.category && <InfoRow label="Category" value={data.category} accent={C.orange} />}
            </div>

            {/* Ticket Details (only if ticket exists) */}
            {data.ticket_status && (
              <div className="track-card" style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: '22px 28px',
                animationDelay: '0.2s',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
                  Ticket Details
                </div>

                <InfoRow label="Title" value={data.ticket_title || data.draft_title} />
                <InfoRow label="Status" value={currentStatusLabel} accent={currentStatusColor} />
                {data.last_updated && <InfoRow label="Last Updated" value={fmtFull(data.last_updated)} />}
                {data.deadline && <InfoRow label="Deadline" value={fmtDate(data.deadline)} />}

                {data.summary && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                      Summary
                    </div>
                    <div style={{
                      background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: 8, padding: '12px 14px',
                      fontSize: 13, color: '#C0C0D0', lineHeight: 1.65,
                    }}>
                      {data.summary}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Under review / waiting state */}
            {data.request_status === 'draft' && (
              <div className="track-card" style={{
                background: `rgba(245,158,11,0.06)`, border: `1px solid rgba(245,158,11,0.2)`,
                borderRadius: 16, padding: '18px 24px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
                animationDelay: '0.2s',
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>📋</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>
                    Under Admin Review
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
                    Your request has been processed by our AI and is now being reviewed by an admin. You'll receive an email once a ticket is officially created.
                  </div>
                </div>
              </div>
            )}

            {data.request_status === 'received' && (
              <div className="track-card" style={{
                background: `rgba(59,130,246,0.06)`, border: `1px solid rgba(59,130,246,0.2)`,
                borderRadius: 16, padding: '18px 24px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
                animationDelay: '0.2s',
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>⏳</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 4 }}>
                    Request Received
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
                    We've received your request and our AI is currently analyzing it. This usually takes less than a minute.
                  </div>
                </div>
              </div>
            )}

            {/* Expiry note */}
            {data.expires_at && (
              <div style={{ textAlign: 'center', fontSize: 11, color: C.muted }}>
                This tracking link is valid until {fmtDate(data.expires_at)}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default TrackPage;
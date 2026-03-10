// ─── shared.jsx ───────────────────────────────────────────────────────────────
// Shared atoms, helpers, and constants used by AdminPage, AssigneePage, UserPage

export const API_URL = process.env.REACT_APP_API_URL;

// ─── Toast ────────────────────────────────────────────────────────────────────
export const toast = (icon, title, text = '') => {
  const colors = { success: '#10B981', error: '#EF4444', warning: '#F59E0B' };
  const el = document.createElement('div');
  el.innerHTML = `<div style="position:fixed;top:20px;right:20px;z-index:9999;background:white;border-radius:10px;padding:14px 18px;box-shadow:0 8px 24px rgba(0,0,0,0.12);border-left:4px solid ${colors[icon] || '#9CA3AF'};min-width:260px;animation:ti .25s ease"><strong style="color:#111;font-size:13px;display:block">${title}</strong>${text ? `<span style="font-size:12px;color:#6B7280">${text}</span>` : ''}</div><style>@keyframes ti{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}</style>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
};

// ─── Shared Atoms ─────────────────────────────────────────────────────────────
export const Pill = ({ bg = '#F3F4F6', color = '#374151', children }) => (
  <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>{children}</span>
);

export const STATUS_MAP = {
  New: ['#E8F5E9', '#2E7D32'], Assigned: ['#E3F2FD', '#1565C0'],
  Solving: ['#FFF3E0', '#E65100'], Solved: ['#E8F5E9', '#2E7D32'],
  Failed: ['#FFEBEE', '#C62828'], Fail: ['#FFEBEE', '#C62828'],
  Draft: ['#FFF3E0', '#F97316'], Submitted: ['#E3F2FD', '#1565C0'],
  Merged: ['#F3E8FF', '#7C3AED'], received: ['#F3F4F6', '#6B7280'],
  draft: ['#FFF3E0', '#F97316'], ticket: ['#E8F5E9', '#2E7D32'],
  STATUS_CHANGE: ['#E8F5E9', '#2E7D32'], SUBMIT_DRAFT: ['#FFF3E0', '#F97316'],
  REASSIGN: ['#E3F2FD', '#1565C0'], COMMENT: ['#F3E8FF', '#7C3AED'],
};

export const StatusPill = ({ s }) => {
  const [bg, color] = STATUS_MAP[s] || ['#F3F4F6', '#6B7280'];
  return <Pill bg={bg} color={color}>{s}</Pill>;
};

export const Avatar = ({ img, size = 32, name = '' }) => {
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

export const Card = ({ children, style: s = {} }) => (
  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', ...s }}>{children}</div>
);

export const CardHead = ({ title, count, right }) => (
  <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>{title}</span>
      {count !== undefined && <Pill bg='#F97316' color='white'>{count}</Pill>}
    </div>
    {right && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{right}</div>}
  </div>
);

export const TH = ({ children, s = {} }) => (
  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap', ...s }}>{children}</th>
);

export const TD = ({ children, s = {} }) => (
  <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F9FAFB', verticalAlign: 'middle', ...s }}>{children}</td>
);

export const EmptyRow = ({ cols, msg = 'No items found.' }) => (
  <tr><td colSpan={cols} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>{msg}</td></tr>
);

export const Btn = ({ onClick, disabled, children, variant = 'outline', style: s = {} }) => {
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

export const StatCard = ({ label, value, sub, accent = '#F97316', progress }) => {
  const prog = typeof progress === 'number' ? progress : 0.5;
  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      padding: '20px 24px 18px 24px',
      minWidth: 0,
      minHeight: 110,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      position: 'relative',
      overflow: 'hidden',
      gap: 2,
    }}>
    <div style={{ color: '#A0AEC0', fontWeight: 600, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
    <div style={{ color: '#23233a', fontWeight: 800, fontSize: 32, margin: '0 0 2px 0', lineHeight: 1 }}>{value}</div>
    <div style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 400, marginBottom: 8 }}>{sub}</div>
    <div style={{ width: '100%', height: 4, background: '#F3F4F6', borderRadius: 2, marginTop: 'auto', position: 'absolute', left: 0, bottom: 0 }}>
      <div style={{ width: `${Math.max(0, Math.min(1, prog)) * 100}%`, height: '100%', background: accent, borderRadius: 2, transition: 'width 0.3s' }} />
    </div>
    </div>
  );
}

export const FilterBar = ({ search, onSearch, filter, onFilter, filterOpts, placeholder }) => (
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
export const parseDate = (d) => {
  if (!d) return null;
  let s = String(d).trim();
  if (s.includes('Z') || s.includes('+') || (s.includes('-') && s.lastIndexOf('-') > 7)) return new Date(s);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) return new Date(s.replace(' ', 'T') + 'Z');
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) return new Date(s + 'Z');
  return new Date(s);
};

export const fmtFull = (d) => {
  const date = parseDate(d);
  if (!date || isNaN(date)) return '—';
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const fmtDate = (d) => {
  const date = parseDate(d);
  if (!date || isNaN(date)) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
};

export const fmtTime = (d) => {
  const date = parseDate(d);
  if (!date || isNaN(date)) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${Math.max(0, diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
};

// ─── Status badge configs ─────────────────────────────────────────────────────
export const REQUEST_STATUS_MAP = {
  received: { bg: '#F3F4F6', color: '#6B7280', label: 'Waiting for AI' },
  draft: { bg: '#FFF3E0', color: '#F97316', label: 'Admin Reviewing' },
  ticket: { bg: '#E8F5E9', color: '#2E7D32', label: 'Ticket Created' },
};

export const OFFICIAL_STATUS_MAP = {
  New: { bg: '#E8F5E9', color: '#2E7D32' }, Assigned: { bg: '#E3F2FD', color: '#1565C0' },
  Solving: { bg: '#FFF3E0', color: '#E65100' }, Solved: { bg: '#ECFDF5', color: '#059669' },
  Fail: { bg: '#FFEBEE', color: '#C62828' }, Failed: { bg: '#FFEBEE', color: '#C62828' },
};

export const TIMELINE_COLORS = {
  STATUS_CHANGE: '#10B981', COMMENT: '#F97316', SUBMIT_DRAFT: '#8B5CF6',
  REASSIGN: '#3B82F6', default: '#9CA3AF',
};

export const RequestStatusBadge = ({ status }) => {
  const cfg = REQUEST_STATUS_MAP[status] || { bg: '#F3F4F6', color: '#6B7280', label: status };
  return <Pill bg={cfg.bg} color={cfg.color}>{cfg.label || status}</Pill>;
};

export const OfficialStatusBadge = ({ status }) => {
  const cfg = OFFICIAL_STATUS_MAP[status] || { bg: '#F3F4F6', color: '#6B7280' };
  return <Pill bg={cfg.bg} color={cfg.color}>{status}</Pill>;
};

// ─── Shared Sidebar ───────────────────────────────────────────────────────────
export const Sidebar = ({ navItems, activeView, onNavigate, onLogout, profileImage, username, userEmail, role, collapsed }) => (
  <div style={{ width: collapsed ? 56 : 210, background: '#1A1A2E', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '2px 0 8px rgba(0,0,0,0.15)', transition: 'width 0.2s', position: 'relative' }}>
    <style>{`
      .sidebar-nav-active.sidebar-collapsed {
        background: #F97316 !important;
        color: white !important;
        border-radius: 50% !important;
        width: 44px !important;
        height: 44px !important;
        min-width: 44px !important;
        min-height: 44px !important;
        padding: 0 !important;
        margin: 0 auto 8px auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-left: none !important;
      }
    `}</style>
    <div style={{ padding: '14px 16px', borderBottom: '1px solid #2D2D4E', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 44 }}>
      {!collapsed && (
        <img src="/CeiLogoColor.png" style={{ height: 44, objectFit: 'contain' }} alt="CEI" onError={e => e.target.style.display = 'none'} />
      )}
      {collapsed && (
        <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Improved CSS vector logo for collapsed sidebar: true C with dot */}
          <div style={{
            position: 'absolute',
            width: 17,
            height: 15,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'block',
          }}>
            {/* Main C: orange circle */}
            <div style={{
              position: 'absolute',
              width: 15,
              height: 15,
              background: '#F36601',
              borderRadius: '50%',
              left: 0,
              top: 0,
            }} />
            {/* Circular cutout for C opening */}
            <div style={{
              position: 'absolute',
              width: 9,
              height: 9,
              background: '#23233a', // match sidebar bg
              borderRadius: '50%',
              left: 8,
              top: 3,
            }} />
            {/* Dot: yellow circle */}
            <div style={{
              position: 'absolute',
              width: 3,
              height: 3,
              background: '#FFB000',
              borderRadius: '50%',
              left: 13,
              top: 6,
              boxShadow: '0 0 1px #F36601',
            }} />
          </div>
        </div>
      )}
    </div>
    {!collapsed && (
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
    )}
    <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: collapsed ? 'center' : 'stretch' }}>
      {navItems.map(item => {
        const active = activeView === item.view;
        const navClass = active ? ('sidebar-nav-active' + (collapsed ? ' sidebar-collapsed' : '')) : '';
        return (
          <div key={item.view} onClick={() => onNavigate(item.view)}
            className={navClass}
            style={{ padding: collapsed ? '10px 0' : '10px 16px', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, cursor: 'pointer', background: active ? '#F97316' : 'transparent', color: active ? 'white' : '#9CA3AF', fontSize: 13, fontWeight: active ? 600 : 400, borderLeft: active && !collapsed ? '3px solid rgba(255,255,255,0.3)' : '3px solid transparent', transition: 'all 0.15s', justifyContent: collapsed ? 'center' : 'flex-start' }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#2D2D4E'; e.currentTarget.style.color = 'white'; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; } }}>
            <img src={item.icon} alt="" style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0, filter: active ? 'brightness(0) invert(1)' : 'brightness(0) invert(0.6)' }} onError={e => e.target.style.display = 'none'} />
            {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
          </div>
        );
      })}
    </nav>
    <div onClick={onLogout}
      style={{ padding: collapsed ? '14px 0' : '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#EF4444', fontSize: 13, borderTop: '1px solid #2D2D4E', transition: 'background 0.15s', justifyContent: collapsed ? 'center' : 'flex-start' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <img src="/logout.png" alt="logout" style={{ width: 16, height: 16, objectFit: 'contain', filter: 'invert(40%) sepia(80%) saturate(500%) hue-rotate(320deg)' }} onError={e => e.target.style.display = 'none'} />
      {!collapsed && <span>Logout</span>}
    </div>
  </div>
);
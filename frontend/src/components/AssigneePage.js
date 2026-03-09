// ─── AssigneePage.jsx ─────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from 'react';
import AssigneeDashboard from './AssigneeDashboard';
import { API_URL, Avatar } from './Shared';

const ASSIGNEE_NAV = [
  { icon: '/dashboard.png', label: 'Dashboard', view: 'dashboard' },
  { icon: '/ticket.png', label: 'Active Tickets', view: 'active' },
  { icon: '/history.png', label: 'Closed Tickets', view: 'closed' },
  { icon: '/users.png', label: 'Following', view: 'following' },
  { icon: '/history.png', label: 'History', view: 'history' },
];

const VIEW_TITLE = {
  dashboard: 'Dashboard',
  active: 'My Active Tickets',
  closed: 'Closed Tickets',
  following: 'Following Tickets',
  history: 'Ticket History',
};

function AssigneeSidebar({ username, userEmail, profileImage, onLogout, activeView, onNavigate, badgeMap }) {
  return (
    <div
      style={{
        width: 220,
        background: 'linear-gradient(180deg,#1A1A2E 0%, #17172A 100%)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        boxShadow: '4px 0 18px rgba(0,0,0,0.22)',
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #2D2D4E', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#F97316', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
          E
        </div>
        <span style={{ color: '#F97316', fontSize: 19, fontWeight: 700 }}>Voice</span>
      </div>

      <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid #2D2D4E', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Avatar img={profileImage} size={54} name={username} />
        <div style={{ color: 'white', fontSize: 13, fontWeight: 600, marginTop: 10 }}>{username}</div>
        {userEmail && userEmail !== 'null' && userEmail.trim() !== '' && (
          <div style={{ color: '#9CA3AF', fontSize: 10, marginTop: 3, wordBreak: 'break-all', lineHeight: 1.35 }}>{userEmail}</div>
        )}
        <div style={{ marginTop: 8, background: 'rgba(249,115,22,0.18)', color: '#F97316', borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 600 }}>
          Assignee
        </div>
      </div>

      <div style={{ color: '#7f8bb4', fontSize: 10, letterSpacing: '0.06em', fontWeight: 700, textTransform: 'uppercase', padding: '10px 16px 6px' }}>
        Navigation
      </div>
      <nav style={{ flex: 1, padding: '4px 0', overflowY: 'auto' }}>
        {ASSIGNEE_NAV.map((item) => {
          const isActive = item.view === activeView;
          const badge = badgeMap[item.view];
          return (
          <div
            key={item.view}
            onClick={() => onNavigate(item.view)}
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: isActive ? '#F97316' : 'transparent',
              color: isActive ? 'white' : '#9CA3AF',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              borderLeft: isActive ? '3px solid rgba(255,255,255,0.35)' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(event) => {
              if (!isActive) {
                event.currentTarget.style.background = '#2D2D4E';
                event.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(event) => {
              if (!isActive) {
                event.currentTarget.style.background = 'transparent';
                event.currentTarget.style.color = '#9CA3AF';
              }
            }}
          >
            <img
              src={item.icon}
              alt=""
              style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0, filter: isActive ? 'brightness(0) invert(1)' : 'brightness(0) invert(0.65)' }}
              onError={(event) => {
                event.target.style.display = 'none';
              }}
            />
            <span style={{ flex: 1 }}>{item.label}</span>
            {typeof badge === 'number' && badge > 0 && (
              <span style={{ background: isActive ? 'rgba(255,255,255,0.26)' : 'rgba(249,115,22,0.9)', color: 'white', borderRadius: 999, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
                {badge}
              </span>
            )}
          </div>
        );})}
      </nav>

      <div
        onClick={onLogout}
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          color: '#EF4444',
          fontSize: 13,
          borderTop: '1px solid #2D2D4E',
        }}
      >
        <img
          src="/logout.png"
          alt="logout"
          style={{ width: 16, height: 16, objectFit: 'contain', filter: 'invert(40%) sepia(80%) saturate(500%) hue-rotate(320deg)' }}
          onError={(event) => {
            event.target.style.display = 'none';
          }}
        />
        <span>Logout</span>
      </div>
    </div>
  );
}

function AssigneePage({ username, userEmail, onLogout, profileImage, userId }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/assignee/my-tasks/${userId}`)
      .then((res) => res.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]));
  }, [userId]);

  const badgeMap = useMemo(() => {
    const activeCount = tasks.filter((item) => ['new', 'assigned', 'solving'].includes(String(item.status || '').toLowerCase())).length;
    const closedCount = tasks.filter((item) => ['solved', 'failed'].includes(String(item.status || '').toLowerCase())).length;
    const followingCount = tasks.filter((item) => Number(item.assignee_id) !== Number(userId)).length;
    const historyCount = tasks.length;

    return {
      dashboard: 0,
      active: activeCount,
      closed: closedCount,
      following: followingCount,
      history: historyCount,
    };
  }, [tasks, userId]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F5F5F5', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <AssigneeSidebar
        onLogout={onLogout}
        profileImage={profileImage}
        username={username}
        userEmail={userEmail}
        activeView={activeView}
        onNavigate={setActiveView}
        badgeMap={badgeMap}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'white', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px 0 16px', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{VIEW_TITLE[activeView] || 'Dashboard'}</span>
          <div style={{ width: 300, maxWidth: '45%', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 999, height: 28, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 7 }}>
            <span style={{ color: '#9CA3AF', fontSize: 11 }}>🔍</span>
            <span style={{ color: '#9CA3AF', fontSize: 11, letterSpacing: '0.01em' }}>Search here</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <AssigneeDashboard userId={userId} API_URL={API_URL} view={activeView} />
        </div>
      </div>
    </div>
  );
}

export default AssigneePage;
// ─── AssigneePage.jsx ─────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from 'react';
import AssigneeDashboard from './AssigneeDashboard';
import { API_URL, Sidebar } from './Shared';

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


function AssigneePage({ username, userEmail, onLogout, profileImage, userId }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // CHANGED
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width: 400px) {
        .admin-stat-grid {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 8px !important;
          width: 100% !important;
        }
        .admin-stat-grid > * {
          width: 100% !important;
          min-width: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F5F5F5', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <Sidebar
        navItems={ASSIGNEE_NAV}
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={onLogout}
        profileImage={profileImage}
        username={username}
        userEmail={userEmail}
        role="assignee"
        collapsed={sidebarCollapsed}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'white', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px 0 16px', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setSidebarCollapsed(c => !c)}
              style={{
                background: 'none',
                border: 'none',
                color: '#1A1A2E',
                cursor: 'pointer',
                fontSize: 22,
                marginRight: 10,
                padding: 0,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {sidebarCollapsed ? (
                <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>&#9776;</span>
              ) : (
                <span>&#9776;</span>
              )}
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{VIEW_TITLE[activeView] || 'Dashboard'}</span>
          </div>
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
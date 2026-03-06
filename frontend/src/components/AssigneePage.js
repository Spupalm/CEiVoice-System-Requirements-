// ─── AssigneePage.jsx ─────────────────────────────────────────────────────────
import React from 'react';
import AssigneeDashboard from './AssigneeDashboard';
import { API_URL, Sidebar } from './Shared';

const ASSIGNEE_NAV = [
  { icon: '/ticket.png', label: 'My Tasks', view: 'tasks' },
];

function AssigneePage({ username, userEmail, onLogout, profileImage, userId }) {
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F5F5F5', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <Sidebar
        navItems={ASSIGNEE_NAV}
        activeView="tasks"
        onNavigate={() => {}}
        onLogout={onLogout}
        profileImage={profileImage}
        username={username}
        userEmail={userEmail}
        role="assignee"
      />
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

export default AssigneePage;
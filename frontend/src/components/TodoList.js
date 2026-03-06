// ─── TodoList.jsx ─────────────────────────────────────────────────────────────
// Role router — delegates rendering to AdminPage, AssigneePage, or UserPage
import React from 'react';
import AdminPage from './AdminPage';
import AssigneePage from './AssigneePage';
import UserPage from './UserPages';

function TodoList({ username, userEmail, onLogout, profileImage, createNewAdmin, userId, role }) {
  console.log('TodoList Props:', { username, userEmail, profileImage, userId, role });

  if (role === 'admin') {
    return (
      <AdminPage
        username={username}
        userEmail={userEmail}
        onLogout={onLogout}
        profileImage={profileImage}
        createNewAdmin={createNewAdmin}
        userId={userId}
      />
    );
  }

  if (role === 'assignee') {
    return (
      <AssigneePage
        username={username}
        userEmail={userEmail}
        onLogout={onLogout}
        profileImage={profileImage}
        userId={userId}
      />
    );
  }

  // Default: user
  return (
    <UserPage
      username={username}
      userEmail={userEmail}
      onLogout={onLogout}
      profileImage={profileImage}
      userId={userId}
      role={role}
    />
  );
}

export default TodoList;
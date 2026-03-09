import React from 'react';
import AdminPage from './AdminPage';
import AssigneePage from './AssigneePage';
import UserPage from './UserPages';

function TodoList({
  username,
  userEmail,
  onLogout,
  profileImage,
  createNewAdmin,
  createTeam,
  userId,
  role,
}) {
  if (role === 'admin') {
    return (
      <AdminPage
        username={username}
        userEmail={userEmail}
        onLogout={onLogout}
        profileImage={profileImage}
        createNewAdmin={createNewAdmin}
        createTeam={createTeam}
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

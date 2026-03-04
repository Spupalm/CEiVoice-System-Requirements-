import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import DashBoard from './components/AdminPage';
import UserPage from './components/Userpage';
import CreateNewAdmin from './components/CreateNewAdmin';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState('Login');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('todo_username');
    if (storedUser) setCurrentUser(storedUser);
    const storedImage = localStorage.getItem('todo_profile');
    if (storedImage) setProfileImage(storedImage);
    const storedRole = localStorage.getItem('todo_user_role');
    if (storedRole) setUserRole(storedRole);
    const storedUserId = localStorage.getItem('todo_user_id');
    if (storedUserId) setCurrentUserId(storedUserId);
    const storedEmail = localStorage.getItem('todo_user_email');
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  const handleLogin = (username, image, id, role, email) => {
    setCurrentUser(username);
    setCurrentUserId(id);
    setProfileImage(image);
    setUserRole(role);
    setUserEmail(email);
    localStorage.setItem('todo_username', username);
    localStorage.setItem('todo_user_id', id);
    localStorage.setItem('todo_profile', image);
    localStorage.setItem('todo_user_email', email);
    localStorage.setItem('todo_user_role', role);
    setPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('todo_username');
    localStorage.removeItem('todo_user_id');
    localStorage.removeItem('todo_profile');
    localStorage.removeItem('todo_user_email');
    localStorage.removeItem('todo_user_role');
    setCurrentUser(null);
    setCurrentUserId(null);
    setUserEmail('');
    setUserRole('');
    setPage('Login');
  };

  const renderPage = () => {
    if (!currentUser) return <Login onLogin={handleLogin} />;

    // Admin routes
    if (userRole === 'admin') {
      if (page === 'createNewAdmin') {
        return (
          <CreateNewAdmin
            onSuccess={() => setPage('dashboard')}
            onBack={() => setPage('dashboard')}
          />
        );
      }
      return (
        <DashBoard
          username={currentUser}
          userId={currentUserId}
          onLogout={handleLogout}
          userEmail={userEmail}
          profileImage={profileImage}
          createNewAdmin={() => setPage('createNewAdmin')}
          role={userRole}
        />
      );
    }

    // User / Assignee routes — everyone else lands here
    return (
      <UserPage
        username={currentUser}
        userId={currentUserId}
        onLogout={handleLogout}
        userEmail={userEmail}
        profileImage={profileImage}
        role={userRole}
      />
    );
  };

  return (
    <div style={{ overflow: 'hidden', width: '100vw', height: '100vh' }}>
      {renderPage()}
    </div>
  );
}

export default App;
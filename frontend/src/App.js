import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import TodoList from './components/TodoList';
import CreateTeam from './components/CreateTeam';
import CreateNewAdmin from './components/CreateNewAdminNew';
import './App.css';
import TrackPage from './components/TrackPage';

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [page, setPage] = useState('login');
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

    const urlParams = new URLSearchParams(window.location.search);
    if (window.location.pathname === '/track' || urlParams.get('token')) {
    return <TrackPage />;
    }
 
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
        setPage('todoList');
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
        setPage('login');
    };

    // ── Not logged in ─────────────────────────────────────────────────────────
    if (!currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    // ── Create Team (full-screen, no card wrapper) ────────────────────────────
    if (page === 'createTeam') {
        return (
            <CreateTeam
                username={currentUser}
                onBack={() => setPage('todoList')}
            />
        );
    }

    // ── Create New Admin (full-screen, no card wrapper) ───────────────────────
    if (page === 'createNewAdmin') {
        return (
            <CreateNewAdmin
                onSuccess={() => setPage('todoList')}
                onBack={() => setPage('todoList')}
            />
        );
    }

    // ── Main app ──────────────────────────────────────────────────────────────
    return (
        <TodoList
            username={currentUser}
            userId={currentUserId}
            onLogout={handleLogout}
            userEmail={userEmail}
            profileImage={profileImage}
            createTeam={() => setPage('createTeam')}
            createNewAdmin={() => setPage('createNewAdmin')}
            role={userRole}
        />
    );
}

export default App;
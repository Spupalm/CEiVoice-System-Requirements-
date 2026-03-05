import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import TodoList from './components/TodoList';
import CreateTeam from './components/CreateTeam';
import CreateNewAdmin from './components/CreateNewAdmin';
import './App.css';

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

    return (
        <>
            {currentUser ? (
                <div className="min-vh-100 d-flex align-items-center justify-content-center py-4 px-3">
                    <div
                        className="col-12 col-lg-11 col-xl-11"
                        style={{ maxWidth: '1400px', transition: 'all 0.3s ease' }}
                    >
                        <div className="card shadow-sm border-0 rounded-4">
                            <div className="card-body p-4 p-sm-5">
                                <main>
                                    {page === 'createTeam' ? (
                                        <CreateTeam
                                            username={currentUser}
                                            onBack={() => setPage('todoList')}
                                        />
                                    ) : page === 'createNewAdmin' ? (
                                        <CreateNewAdmin
                                            onSuccess={() => setPage('todoList')}
                                            onBack={() => setPage('todoList')}
                                        />
                                    ) : (
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
                                    )}
                                </main>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Login handles both Login + Sign Up internally via the slider UI */
                <Login onLogin={handleLogin} />
            )}
        </>
    );
}

export default App;
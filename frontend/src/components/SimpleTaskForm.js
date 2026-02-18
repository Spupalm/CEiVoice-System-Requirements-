import React, { useState } from 'react';
import Swal from 'sweetalert2';

function SimpleTaskForm({ userId, userEmail, API_URL, onTaskAdded }) {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/user-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_email: userEmail,
                    message: message,
                    user_id: userId
                }),
            });

            if (response.ok) {
                Swal.fire('Success', 'Task sent to Admin!', 'success');
                setMessage('');
                if (onTaskAdded) onTaskAdded(); // Refresh the list in the main component
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to send task', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card shadow-sm mb-4 border-0" style={{ borderRadius: '15px', background: '#f8f9fa' }}>
            <div className="card-body p-4">
                <h5 className="fw-bold mb-3"><i className="bi bi-plus-circle me-2"></i>Add New Task</h5>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input 
                            type="text" 
                            className="form-control border-0 shadow-none" 
                            placeholder="What needs to be done?"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={loading}
                        />
                        <button className="btn btn-primary px-4 fw-bold" type="submit" disabled={loading}>
                            {loading ? 'Sending...' : 'Add Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SimpleTaskForm;
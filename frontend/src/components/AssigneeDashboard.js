import React, { useState, useEffect } from 'react';

function AssigneeDashboard({ userId, API_URL }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [history, setHistory] = useState([]);
    const [comments, setComments] = useState([]);
    const [users, setUsers] = useState([]); // For Reassignment dropdown
    const [resComment, setResComment] = useState("");
    const [newStatus, setNewStatus] = useState("");

    // 1. Fetch Tasks (EP04-ST001: Filtered and Sorted)
    useEffect(() => {
        fetch(`${API_URL}/assignee/my-tasks/${userId}`)
            .then(res => res.json())
            .then(data => {
                const activeTasks = data
                    .filter(t => t.status !== 'Solved' && t.status !== 'Failed')
                    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
                setTasks(activeTasks);
            });
        
        // Fetch users for reassignment (EP04-ST004)
        fetch(`${API_URL}/users`).then(res => res.json()).then(setUsers);
    }, [userId, API_URL]);

    // 2. Load Details when a ticket is clicked
    const handleSelectTicket = (ticket) => {
        setSelectedTicket(ticket);
        setNewStatus(ticket.status);
        // Load History (EP04-ST003)
        fetch(`${API_URL}/assignee/history/${ticket.id}`).then(res => res.json()).then(setHistory);
        // Load Comments (EP05-ST001)
        fetch(`${API_URL}/comments/${ticket.id}?role=assignee`).then(res => res.json()).then(setComments);
    };

    // 3. Update Status (EP04-ST002)
    const updateStatus = () => {
        if ((newStatus === 'Solved' || newStatus === 'Failed') && !resComment) {
            alert("Resolution comment is required for Solved/Failed!");
            return;
        }
        fetch(`${API_URL}/assignee/update-status/${selectedTicket.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, performed_by: userId, resolution_comment: resComment })
        }).then(() => window.location.reload());
    };

    return (
        <div className="container-fluid mt-4">
            <div className="row">
                {/* LEFT: Ticket List (EP04-ST001) */}
                <div className="col-md-4">
                    <h4 className="fw-bold mb-3">My Workload</h4>
                    <div className="list-group">
                        {tasks.map(task => (
                            <button 
                                key={task.id} 
                                onClick={() => handleSelectTicket(task)}
                                className={`list-group-item list-group-item-action mb-2 rounded shadow-sm ${selectedTicket?.id === task.id ? 'active' : ''}`}
                            >
                                <div className="d-flex justify-content-between">
                                    <span className="fw-bold text-truncate">{task.title}</span>
                                    <small>{new Date(task.deadline).toLocaleDateString()}</small>
                                </div>
                                <small className="d-block mt-1">Status: {task.status}</small>
                            </button>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Ticket View (EP04 & EP05) */}
                {selectedTicket ? (
                    <div className="col-md-8 border-start ps-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <h2>{selectedTicket.title}</h2>
                            <span className="badge bg-info text-dark">{selectedTicket.status}</span>
                        </div>
                        <p className="text-muted">{selectedTicket.summary}</p>
                        <hr />

                        {/* Involvement (EP05-ST003) */}
                        <div className="mb-4">
                            <h6><i className="bi bi-people-fill"></i> Involved Personnel</h6>
                            <small><b>Assignee:</b> {selectedTicket.assignee_name} | <b>Creator ID:</b> {selectedTicket.creator_id}</small>
                        </div>

                        {/* Status Update & Reassign (EP04-ST002 & ST004) */}
                        <div className="card p-3 bg-light mb-4">
                            <h6>Update Workflow</h6>
                            <div className="row g-2">
                                <div className="col-md-6">
                                    <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Solving">Solving</option>
                                        <option value="Solved">Solved</option>
                                        <option value="Failed">Failed</option>
                                    </select>
                                </div>
                                <div className="col-md-6 text-end">
                                    <button className="btn btn-primary w-100" onClick={updateStatus}>Update Status</button>
                                </div>
                                {(newStatus === 'Solved' || newStatus === 'Failed') && (
                                    <div className="col-12 mt-2">
                                        <textarea 
                                            className="form-control" 
                                            placeholder="Enter final resolution comment..." 
                                            value={resComment}
                                            onChange={(e) => setResComment(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments & History Tabs (EP04-ST003 & EP05-ST001) */}
                        <ul className="nav nav-tabs" id="ticketTabs">
                            <li className="nav-item">
                                <button className="nav-link active">Comments</button>
                            </li>
                        </ul>
                        <div className="p-3 border border-top-0 rounded-bottom bg-white" style={{maxHeight: '300px', overflowY: 'auto'}}>
                            {comments.map(c => (
                                <div key={c.id} className={`mb-2 p-2 rounded ${c.comment_type === 'Internal' ? 'bg-warning-subtle' : 'bg-light'}`}>
                                    <small className="fw-bold">{c.username} ({c.comment_type})</small>
                                    <p className="mb-0">{c.comment_text}</p>
                                </div>
                            ))}
                            <hr />
                            <h6>History Log</h6>
                            {history.map(h => (
                                <div key={h.id} className="small text-muted mb-1">
                                    • {new Date(h.created_at).toLocaleString()}: {h.old_value} → {h.new_value} (by {h.assignee_name})
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="col-md-8 text-center py-5 text-muted">
                        <p>Select a ticket from the left to start working.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AssigneeDashboard;
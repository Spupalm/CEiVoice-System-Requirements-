import React, { useState, useEffect } from 'react';

// 1. Color Helper with your specific Purple Indigo for "New"
const getStatusColor = (status) => {
    switch (status) {
        case 'New': return 'custom-bg-new text-indigo-dark'; 
        case 'Assigned': return 'bg-primary text-white';
        case 'Solving': return 'bg-warning text-dark';
        case 'Solved': return 'bg-success text-white';
        case 'Failed': return 'bg-danger text-white';
        default: return 'bg-secondary text-white';
    }
};

function AssigneeDashboard({ userId, API_URL }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [history, setHistory] = useState([]);
    const [allUsers, setAllUsers] = useState([]); // To hold filtered assignees
    const [newAssigneeId, setNewAssigneeId] = useState("");
    const [resolution, setResolution] = useState("");
    const [tempStatus, setTempStatus] = useState("");

useEffect(() => {
        // 1. Load Tasks [EP04-ST001]
        fetch(`${API_URL}/assignee/my-tasks/${userId}`)
            .then(res => res.json())
            .then(data => {
                const sorted = data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
                setTasks(sorted);
            });

        // 2. Load Assignees for the dropdown [EP04-ST004]
        // We use the new route we just added to assigneeRoutes.js
        fetch(`${API_URL}/assignee/list-all`)
            .then(res => res.json())
            .then(data => {
                console.log("Assignee list loaded:", data);
                setAllUsers(data); 
            })
            .catch(err => console.error("Dropdown fetch error:", err));
    }, [userId, API_URL]);

    const totalWorkload = tasks.filter(t => ['New', 'Assigned', 'Solving'].includes(t.status)).length;

    const handleOpenDetails = (ticket) => {
        setSelectedTicket(ticket);
        setTempStatus(ticket.status);
        setNewAssigneeId(ticket.assignee_id);
        fetch(`${API_URL}/assignee/history/${ticket.id}`).then(res => res.json()).then(setHistory);
        const modal = new window.bootstrap.Modal(document.getElementById('detailsModal'));
        modal.show();
    };

    const submitUpdate = () => {
        if ((tempStatus === 'Solved' || tempStatus === 'Failed') && !resolution.trim()) {
            alert("Resolution comment is required to close this ticket!");
            return;
        }

        fetch(`${API_URL}/assignee/update-ticket/${selectedTicket.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: tempStatus,
                assignee_id: newAssigneeId, // Reassignment logic
                resolution_comment: resolution,
                performed_by: userId,
                old_status: selectedTicket.status,
                old_assignee_id: selectedTicket.assignee_id
            })
        }).then(() => window.location.reload());
    };

    return (
        <div className="container mt-4">
            {/* Custom Style for your Purple "New" status */}
            <style>{`
                .custom-bg-new { background-color: #e0e7ff !important; }
                .text-indigo-dark { color: #4338ca !important; }
            `}</style>

            <div className="d-flex align-items-center mb-4">
                <h3 className="fw-bold text-primary mb-0">📂 Current Workload</h3>
                <span className="badge bg-primary ms-3 fs-5 rounded-pill px-3">{totalWorkload}</span>
            </div>

            {/* Render Groups - Now including Solved and Failed again */}
{['New', 'Assigned', 'Solving', 'Solved', 'Failed'].map(status => (
    <div key={status} className="mb-4">
        {/* We use a conditional check to add the custom indigo style only to 'New' */}
        <div className={`p-3 rounded-4 d-flex justify-content-between align-items-center ${
            status === 'New' ? 'custom-bg-new text-indigo-dark' : 
            status === 'Solved' ? 'bg-success text-white' : 
            status === 'Failed' ? 'bg-danger text-white' : 
            'bg-light'
        }`}>
            <span className="fw-bold">{status}</span>
            <span className="badge bg-white text-dark shadow-sm">
                {tasks.filter(t => t.status === status).length}
            </span>
        </div>
        
        {tasks.filter(t => t.status === status).map(task => (
            <div key={task.id} className="ms-3 p-3 bg-white border rounded-3 mt-2 shadow-sm d-flex justify-content-between align-items-center">
                <div>
                    <div className="fw-bold">{task.title}</div>
                    <small className="text-muted">Deadline: {new Date(task.deadline).toLocaleDateString()}</small>
                </div>
                <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenDetails(task)}>View</button>
            </div>
        ))}

        {/* Show a small message if a category is empty */}
        {tasks.filter(t => t.status === status).length === 0 && (
            <div className="ms-3 mt-2 small text-muted italic">No tickets in this category.</div>
        )}
    </div>
))}

            {/* --- MODAL WITH FILTERED REASSIGN --- */}
            <div className="modal fade" id="detailsModal" tabIndex="-1">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content rounded-4 border-0 shadow">
                        <div className="modal-header border-0 bg-light rounded-top-4">
                            <h5 className="fw-bold m-0">Manage Ticket</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body p-4">
                            <div className="row">
                                <div className="col-md-6 border-end">
                                    <h6 className="fw-bold text-muted small uppercase mb-3">Workflow & Reassign</h6>
                                    
                                    <label className="small">Update Status</label>
                                    <select className="form-select mb-3" value={tempStatus} onChange={(e) => setTempStatus(e.target.value)}>
                                        <option value="New">New</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Solving">Solving</option>
                                        <option value="Solved">Solved</option>
                                        <option value="Failed">Failed</option>
                                    </select>

                                    <label className="small">Reassign To (Assignees Only)</label>
<select className="form-select mb-3" value={newAssigneeId} onChange={(e) => setNewAssigneeId(e.target.value)}>
    <option value="">-- Choose New Assignee --</option>
    {allUsers.length > 0 ? allUsers.map(user => (
        <option key={user.id} value={user.id}>
            {user.full_name || user.username} (ID: {user.id})
        </option>
    )) : (
        <option disabled>No assignees found...</option>
    )}
</select>

                                    {(tempStatus === 'Solved' || tempStatus === 'Failed') && (
                                        <textarea className="form-control mb-3" placeholder="Resolution comment..." value={resolution} onChange={(e) => setResolution(e.target.value)} />
                                    )}
                                    <button className="btn btn-primary w-100 rounded-pill" onClick={submitUpdate}>Save Changes</button>
                                </div>

                                <div className="col-md-6 ps-4">
                                    <h6 className="fw-bold text-muted small uppercase mb-3">Status History</h6>
                                    <div className="history-list overflow-auto" style={{maxHeight: '300px'}}>
                                        {history.map(h => (
                                            <div key={h.id} className="mb-3 border-start border-2 border-primary ps-3">
                                                <div className="d-flex align-items-center">
                                                    <span className={`badge rounded-pill ${getStatusColor(h.old_value)}`}>{h.old_value || "Start"}</span>
                                                    <span className="mx-2 text-primary">→</span>
                                                    <span className={`badge rounded-pill ${getStatusColor(h.new_value)}`}>{h.new_value}</span>
                                                </div>
                                                <small className="text-muted d-block mt-1">
                                                    Modified at {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {new Date(h.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AssigneeDashboard;
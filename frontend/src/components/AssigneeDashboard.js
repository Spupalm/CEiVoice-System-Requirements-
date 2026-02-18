import React, { useState, useEffect } from 'react';

function AssigneeDashboard({ userId, API_URL }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [history, setHistory] = useState([]);
    const [comments, setComments] = useState([]);
    
    // States for inputs
    const [newAssignee, setNewAssignee] = useState("");
    const [resolution, setResolution] = useState("");
    const [commentText, setCommentText] = useState("");
    const [tempStatus, setTempStatus] = useState("");

    useEffect(() => {
        fetch(`${API_URL}/assignee/my-tasks/${userId}`)
            .then(res => res.json())
            .then(data => setTasks(data));
    }, [userId, API_URL]);

    const totalWorkload = tasks.filter(t => ['New', 'Assigned', 'Solving'].includes(t.status)).length;

    const handleOpenDetails = (ticket) => {
        setSelectedTicket(ticket);
        setTempStatus(ticket.status);
        setNewAssignee(ticket.assignee_id || "");
        
        // Fetch History
        fetch(`${API_URL}/assignee/history/${ticket.id}`).then(res => res.json()).then(setHistory);
        // Fetch Comments
        fetch(`${API_URL}/comments/${ticket.id}?role=assignee`).then(res => res.json()).then(setComments);
        
        const modal = new window.bootstrap.Modal(document.getElementById('detailsModal'));
        modal.show();
    };

    const submitUpdate = () => {
        // EP04-ST002: Require comment for Solved/Failed
        if ((tempStatus === 'Solved' || tempStatus === 'Failed') && !resolution) {
            alert("Please provide a resolution comment to close this ticket.");
            return;
        }

        fetch(`${API_URL}/assignee/update-ticket/${selectedTicket.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: tempStatus,
                assignee_id: newAssignee,
                resolution_comment: resolution,
                performed_by: userId
            })
        }).then(() => window.location.reload());
    };

    const postComment = (type) => {
        if (!commentText) return;
        fetch(`${API_URL}/assignee/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticket_id: selectedTicket.id,
                user_id: userId,
                comment_text: commentText,
                comment_type: type // Public or Internal
            })
        }).then(() => {
            setCommentText("");
            fetch(`${API_URL}/comments/${selectedTicket.id}?role=assignee`).then(res => res.json()).then(setComments);
        });
    };

    const renderTaskGroup = (title, status, bgColor, textColor) => {
        const filteredTasks = tasks.filter(t => t.status === status);
        return (
            <div className="mb-4">
                <div className="p-3 rounded-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: bgColor, color: textColor }}>
                    <span className="fw-bold">{title}</span>
                    <span className="badge bg-white text-dark">{filteredTasks.length}</span>
                </div>
                {filteredTasks.map(task => (
                    <div key={task.id} className="ms-3 p-3 bg-white border rounded-3 mt-2 shadow-sm d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fw-bold">{task.title}</div>
                            <small className="text-muted">Deadline: {new Date(task.deadline).toLocaleDateString()}</small>
                        </div>
                        <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => handleOpenDetails(task)}>View Details</button>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="container mt-4">
            <div className="d-flex align-items-center mb-4">
                <h3 className="fw-bold text-primary mb-0">📂 Current Workload</h3>
                <span className="badge bg-primary ms-3 fs-5 rounded-pill px-3">{totalWorkload}</span>
            </div>

            {renderTaskGroup("New", "New", "#e0e7ff", "#4338ca")}
            {renderTaskGroup("Assigned", "Assigned", "#e0f2fe", "#0369a1")}
            {renderTaskGroup("Solving", "Solving", "#fef3c7", "#b45309")}

            <hr className="my-5" />
            <h3 className="mb-4 fw-bold text-secondary">✔️ Completed & History</h3>
            {renderTaskGroup("Solved", "Solved", "#dcfce7", "#15803d")}
            {renderTaskGroup("Failed", "Failed", "#fee2e2", "#b91c1c")}

            {/* --- THE POPUP MODAL --- */}
            <div className="modal fade" id="detailsModal" tabIndex="-1">
                <div className="modal-dialog modal-xl">
                    <div className="modal-content rounded-4 shadow">
                        <div className="modal-header border-0 bg-light">
                            <h5 className="fw-bold m-0">Ticket: {selectedTicket?.title}</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body p-4">
                            <div className="row">
                                {/* Workflow Column (EP04) */}
                                <div className="col-md-4 border-end">
                                    <h6 className="fw-bold text-muted small mb-3">WORKFLOW & REASSIGN</h6>
                                    <label className="small">Current Status</label>
                                    <select className="form-select mb-3" value={tempStatus} onChange={(e) => setTempStatus(e.target.value)}>
                                        <option value="New">New</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Solving">Solving</option>
                                        <option value="Solved">Solved</option>
                                        <option value="Failed">Failed</option>
                                    </select>

                                    <label className="small">Reassign To (User ID)</label>
                                    <input type="number" className="form-control mb-3" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} />

                                    {(tempStatus === 'Solved' || tempStatus === 'Failed') && (
                                        <textarea className="form-control mb-3" placeholder="Required: Why is this ticket closed?" value={resolution} onChange={(e) => setResolution(e.target.value)} />
                                    )}
                                    <button className="btn btn-primary w-100 rounded-pill" onClick={submitUpdate}>Save Changes</button>
                                    
                                    <h6 className="fw-bold text-muted small mt-4 mb-2">HISTORY LOG</h6>
                                    <div className="small overflow-auto" style={{maxHeight: '150px'}}>
                                        {history.map(h => (
                                            <div key={h.id} className="mb-1 border-bottom pb-1">
                                                <span className="text-primary">{h.new_value}</span> <small className="text-muted">({new Date(h.created_at).toLocaleDateString()})</small>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Comments Column (EP05) */}
                                <div className="col-md-8 ps-4">
                                    <h6 className="fw-bold text-muted small mb-3">CONVERSATION THREAD</h6>
                                    <div className="bg-light p-3 rounded-3 mb-3" style={{height: '300px', overflowY: 'auto'}}>
                                        {comments.map(c => (
                                            <div key={c.id} className={`p-2 mb-2 rounded shadow-sm ${c.comment_type === 'Internal' ? 'bg-warning-subtle border-start border-warning border-3' : 'bg-white'}`}>
                                                <div className="d-flex justify-content-between small fw-bold">
                                                    <span>{c.username}</span>
                                                    <span className="text-muted">{c.comment_type}</span>
                                                </div>
                                                <div className="mt-1">{c.comment_text}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <textarea className="form-control mb-2" rows="3" placeholder="Type your message..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-outline-secondary w-50 rounded-pill" onClick={() => postComment('Public')}>Public Comment</button>
                                        <button className="btn btn-warning w-50 rounded-pill" onClick={() => postComment('Internal')}>Internal (Team Only)</button>
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
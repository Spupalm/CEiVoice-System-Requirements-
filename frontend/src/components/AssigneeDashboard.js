import React, { useState, useEffect } from 'react';

// 1. Color Helper for Status Badges
const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'new': return 'custom-bg-new text-indigo-dark'; 
        case 'assigned': return 'bg-primary text-white';
        case 'solving': return 'bg-warning text-dark';
        case 'solved': return 'bg-success text-white';
        case 'failed': return 'bg-danger text-white';
        default: return 'bg-secondary text-white';
    }
};

function AssigneeDashboard({ userId, API_URL }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [history, setHistory] = useState([]);
    const [allUsers, setAllUsers] = useState([]); 
    const [comments, setComments] = useState([]); 
    
    // EP05-ST002 States
    const [newComment, setNewComment] = useState("");
    const [isInternal, setIsInternal] = useState(false);

    const [newAssigneeId, setNewAssigneeId] = useState("");
    const [resolution, setResolution] = useState("");
    const [tempStatus, setTempStatus] = useState("");

    useEffect(() => {
        fetch(`${API_URL}/assignee/my-tasks/${userId}`)
            .then(res => res.json())
            .then(data => {
                const sorted = data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
                setTasks(sorted);
            });

        fetch(`${API_URL}/assignee/list-all`)
            .then(res => res.json())
            .then(data => setAllUsers(data))
            .catch(err => console.error("Dropdown fetch error:", err));
    }, [userId, API_URL]);

    const totalWorkload = tasks.filter(t => ['new', 'assigned', 'solving'].includes(t.status.toLowerCase())).length;

    const handleOpenDetails = (ticket) => {
        setSelectedTicket(ticket);
        setTempStatus(ticket.status);
        setNewAssigneeId(ticket.assignee_id);
        
        // Refresh History & Comments
        fetch(`${API_URL}/assignee/history/${ticket.id}`).then(res => res.json()).then(setHistory);
        fetch(`${API_URL}/assignee/comments/${ticket.id}`).then(res => res.json()).then(setComments);

        const modal = new window.bootstrap.Modal(document.getElementById('detailsModal'));
        modal.show();
    };

    const handlePostComment = () => {
        if (!newComment.trim()) return;

        fetch(`${API_URL}/assignee/post-comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticket_id: selectedTicket.id,
                user_id: userId,
                comment_text: newComment,
                is_internal: isInternal
            })
        })
        .then(res => res.json())
        .then(() => {
            setNewComment(""); 
            setIsInternal(false); 
            fetch(`${API_URL}/assignee/comments/${selectedTicket.id}`).then(res => res.json()).then(setComments);
        });
    };

    const submitUpdate = () => {
        if ((tempStatus.toLowerCase() === 'solved' || tempStatus.toLowerCase() === 'failed') && !resolution.trim()) {
            alert("Resolution comment is required to close this ticket!");
            return;
        }

        fetch(`${API_URL}/assignee/update-ticket/${selectedTicket.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: tempStatus,
                assignee_id: newAssigneeId,
                resolution_comment: resolution,
                performed_by: userId,
                old_status: selectedTicket.status,
                old_assignee_id: selectedTicket.assignee_id
            })
        }).then(() => window.location.reload());
    };

    return (
        <div className="container mt-4 pb-5">
            <style>{`
                .custom-bg-new { background-color: #e0e7ff !important; }
                .text-indigo-dark { color: #4338ca !important; }
                /* Visual effects for internal vs public */
                .comment-internal { background-color: #fff4e5 !important; border-left: 5px solid #ff9800 !important; }
                .comment-public { background-color: #f8f9fa !important; border-left: 5px solid #0d6efd !important; }
                .text-orange { color: #e67e22 !important; }
            `}</style>

            <div className="d-flex align-items-center mb-4">
                <h3 className="fw-bold text-primary mb-0">📂 Current Workload</h3>
                <span className="badge bg-primary ms-3 fs-5 rounded-pill px-3">{totalWorkload}</span>
            </div>

            {['New', 'Assigned', 'Solving', 'Solved', 'Failed'].map(group => {
                const groupTasks = tasks.filter(t => t.status.toLowerCase() === group.toLowerCase());
                return (
                    <div key={group} className="mb-4">
                        <div className={`p-3 rounded-4 d-flex justify-content-between align-items-center ${
                            group === 'New' ? 'custom-bg-new text-indigo-dark' : 
                            group === 'Solved' ? 'bg-success text-white' : 
                            group === 'Failed' ? 'bg-danger text-white' : 'bg-light'
                        }`}>
                            <span className="fw-bold">{group}</span>
                            <span className="badge bg-white text-dark shadow-sm">{groupTasks.length}</span>
                        </div>
                        {groupTasks.map(task => (
                            <div key={task.id} className="ms-3 p-3 bg-white border rounded-3 mt-2 shadow-sm d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="fw-bold">{task.title}</div>
                                    {/* Updated: Showing Date and Time for Deadline */}
                                    <small className="text-muted">
                                        Deadline: {new Date(task.deadline).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                </div>
                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenDetails(task)}>View</button>
                            </div>
                        ))}
                    </div>
                );
            })}

            {/* Modal */}
            <div className="modal fade" id="detailsModal" tabIndex="-1">
                <div className="modal-dialog modal-xl">
                    <div className="modal-content rounded-4 border-0 shadow">
                        <div className="modal-header border-0 bg-light">
                            <h5 className="fw-bold m-0">Ticket Details: {selectedTicket?.title}</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body p-4">
                            <div className="row">
                                <div className="col-md-4 border-end">
                                    <label className="small fw-bold">Update Status</label>
                                    <select className="form-select mb-3" value={tempStatus} onChange={(e) => setTempStatus(e.target.value)}>
                                        <option value="New">New</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Solving">Solving</option>
                                        <option value="Solved">Solved</option>
                                        <option value="Failed">Failed</option>
                                    </select>

                                    <label className="small fw-bold">Reassign To</label>
                                    <select className="form-select mb-3" value={newAssigneeId} onChange={(e) => setNewAssigneeId(e.target.value)}>
                                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.username}</option>)}
                                    </select>

                                    {(tempStatus.toLowerCase() === 'solved' || tempStatus.toLowerCase() === 'failed') && (
                                        <textarea className="form-control mb-3" placeholder="Closing resolution..." value={resolution} onChange={(e) => setResolution(e.target.value)} />
                                    )}
                                    <button className="btn btn-primary w-100 rounded-pill mb-4" onClick={submitUpdate}>Save Changes</button>
                                    
                                    <h6 className="small fw-bold text-muted uppercase">History Log</h6>
                                    <div className="overflow-auto pe-2" style={{maxHeight: '200px'}}>
                                        {history.map(h => (
    <div key={h.id} className="small border-bottom mb-2 pb-1 border-start border-3 ps-2 border-primary">
        <div className="fw-bold">{h.old_value} → {h.new_value}</div>
        
        {/* ADD THIS LINE BELOW */}
        <div className="text-dark small">By: {h.performer_name || h.performer_username || 'System'}</div>
        
        <div className="text-muted" style={{fontSize: '0.7rem'}}>
            {new Date(h.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
    </div>
))}
                                    </div>
                                </div>

                                <div className="col-md-8 ps-4">
                                    <h6 className="fw-bold mb-3">💬 Comments & Communications</h6>
                                    <div className="overflow-auto mb-3 pe-2" style={{ height: '350px' }}>
                                        {comments.map(c => (
                                            <div key={c.id} className={`p-3 mb-3 rounded-3 shadow-sm ${c.comment_type === 'internal' ? 'comment-internal' : 'comment-public'}`}>
                                                <div className="d-flex justify-content-between small fw-bold mb-1">
                                                    <span>{c.full_name || c.username}</span>
                                                    {c.comment_type === 'internal' && <span className="text-orange">🔒 INTERNAL NOTE</span>}
                                                </div>
                                                <div className="mb-1" style={{fontSize: '0.95rem'}}>{c.comment_text}</div>
                                                {/* Added: Timestamp for comments */}
                                                <div className="text-muted" style={{fontSize: '0.7rem'}}>
                                                    {new Date(c.created_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-3 border-top">
                                        <textarea 
                                            className="form-control mb-2" 
                                            rows="2"
                                            placeholder="Type your reply..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="form-check form-switch mt-1">
                                                <input className="form-check-input" type="checkbox" id="intSwitch" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                                                <label className="form-check-label small fw-bold" htmlFor="intSwitch">Internal Note</label>
                                            </div>
                                            <button className="btn btn-primary btn-sm rounded-pill px-4 fw-bold" onClick={handlePostComment}>Send Message</button>
                                        </div>
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
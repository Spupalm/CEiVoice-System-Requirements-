import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import AssigneeDashboard from './AssigneeDashboard'; // Add this

const API_URL = process.env.REACT_APP_API_URL;

function TodoList({ username, userEmail, onLogout, profileImage, createNewAdmin, userId, role }) {
    const [todos, setTodos] = useState([]);
    const [requestMessage, setRequestMessage] = useState(''); // สำหรับ User ส่ง Request
    const [assignees, setAssignees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userTickets, setUserTickets] = useState([]);
    const [currentView, setCurrentView] = useState('user-requests');
    const [drafts, setDrafts] = useState([]);
    const [userRequests, setUserRequests] = useState([]);
    const [officialTickets, setOfficialTickets] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedDraftIds, setSelectedDraftIds] = useState([]);
    const viewConfigs = {
        // เดิมอาจจะเป็น ['draft', 'received', 'ticket'] ให้เปลี่ยนเป็น:
        'user-requests': ['received', 'draft', 'ticket'],
        'drafts': ['Draft', 'Submitted', 'Merged'],
        'official': ['New', 'Assigned', 'Solving', 'Solved', 'Fail'],
        'users': ['admin', 'assignee', 'user'],
        'approvals': []
    }
    // Load Data
    useEffect(() => {
        // ดึงข้อมูลสำหรับ User ทั่วไป (ถ้ายังมีตาราง todo เดิมอยู่)
        // fetchTodos(); 

        // ถ้าเป็น Admin ให้ดึงข้อมูลจาก 3 ตารางใหม่
        if (role === 'admin') {
            fetchAdminData(); // <--- เพิ่มการเรียกใช้งานบรรทัดนี้
            fetchAssignees(); // ดึงรายชื่อพนักงาน (ถ้ามีฟังก์ชันนี้)
        }
        if (role === 'user') {
            fetchUserTickets();
        }
    }, [role, currentView]); // ทำงานทุกครั้งที่สลับเมนู หรือมีการ Login/Logout

    const handleSelectTask = (task) => {
        console.log("Selected Task for Editing:", task);
        setSelectedTask(task);
    };

    const fetchUserTickets = async () => {
        try {
            const response = await fetch(`${API_URL}/users/${userId}/tickets`);
            const data = await response.json();
            setUserTickets(data);
        } catch (err) {
            console.error("Tracking fetch error:", err);
        }
    };

    const fetchAdminData = async () => {
        if (role !== 'admin') return;
        try {
            const [reqRes, draftRes, officialRes, usersRes, categoriesRes] = await Promise.all([
                fetch(`${API_URL}/admin/user-requests`),
                fetch(`${API_URL}/admin/draft-tickets`),
                fetch(`${API_URL}/admin/official-tickets`),
                fetch(`${API_URL}/admin/users`),
                fetch(`${API_URL}/categories`) // ดึงหมวดหมู่สำหรับจัดการทักษะของ Assignee
            ]);
            //console.log("Admin Data Responses:", { reqRes, draftRes, officialRes, usersRes, categoriesRes });
            setUserRequests(await reqRes.json());
            setDrafts(await draftRes.json());
            setOfficialTickets(await officialRes.json());
            setCategories(await categoriesRes.json());
            setUsers(await usersRes.json());
            console.log(drafts);
        } catch (err) {
            console.error("Error loading admin data:", err);
        }
    };
    const convertToOfficial = async (draft) => {
        // ตรวจสอบความพร้อมของข้อมูลก่อน Approve
        console.log(draft);
        if (!draft.assigned_to) {
            alert("Please assign a person before approving.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/approve-ticket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    draft_id: draft.id,
                    title: draft.title,
                    category: draft.ai_category_name || draft.category,
                    summary: draft.summary,
                    resolution_path: draft.resolution_path,
                    assignee_id: draft.assigned_to,
                    userRequestId: draft.linked_requests && draft.linked_requests.length > 0 ? draft.linked_requests[0].id : null,
                    deadline: draft.deadline
                })
            });

            if (response.ok) {
                alert("Ticket approved and moved to Official Tickets!");
                fetchAdminData(); // รีโหลดข้อมูลเพื่อย้าย Draft ที่หายไปไปอยู่ในช่อง Official
            } else {
                const errData = await response.json();
                alert("Error: " + errData.message);
            }
        } catch (err) {
            console.error("Approval failed:", err);
        }
    };
    const fetchTodos = async () => {
        try {
            // ดึงข้อมูลตาม Role (Admin เห็นหมด, User/Assignee เห็นเฉพาะที่เกี่ยวข้อง)
            const response = await fetch(`${API_URL}/todos/${username}?role=${role}&userId=${userId}`);
            const data = await response.json();
            setTodos(data);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    const toggleSelectDraft = (id) => {
        setSelectedDraftIds(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const fetchAssignees = async () => {
        try {
            const response = await fetch(`${API_URL}/users/assignees`);
            const data = await response.json();
            setAssignees(data);
        } catch (err) {
            console.error('Error fetching assignees:', err);
        }
    };
    const handleInlineUpdate = async (id, updatedFields) => {
        try {
            setLoading(true);
            // จัดการเรื่อง Deadline ให้เป็นรูปแบบที่ MySQL รับได้ (YYYY-MM-DD HH:mm:ss)
            let finalFields = { ...updatedFields };
            if (finalFields.deadline) {
                finalFields.deadline = finalFields.deadline.replace('T', ' ').substring(0, 19);
            }

            const response = await fetch(`${API_URL}/admin/draft-tickets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalFields)
            });

            if (response.ok) {
                // อัปเดต State ในหน้าจอเพื่อให้ข้อมูลเป็นปัจจุบัน
                setDrafts(prev => prev.map(d => d.id === id ? { ...d, ...finalFields } : d));

                Swal.fire({
                    icon: 'success',
                    title: 'Saved!',
                    text: 'Draft has been updated successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Update failed');
            }
        } catch (err) {
            console.error("Update failed:", err);
            Swal.fire('Error', 'Could not save draft: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMergeClick = async (ids) => {
        if (!window.confirm(`Are you sure you want to merge these ${ids.length} tickets? This action cannot be undone.`)) {
            return;
        }

        try {
            console.log("Merging tickets with IDs:", ids);
            // ใช้ URL จาก API_URL ที่คุณประกาศไว้ข้างบน
            const response = await fetch(`${API_URL}/admin/merge-tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketIds: ids }),
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire('Success', 'Tickets merged successfully!', 'success'); // ใช้ Swal ตามสไตล์โค้ดคุณ
                setSelectedDraftIds([]);

                // เปลี่ยนจาก fetchDrafts() เป็น fetchAdminData()
                fetchAdminData();
            } else {
                Swal.fire('Error', result.message || 'Failed to merge tickets', 'error');
            }
        } catch (error) {
            console.error('Error merging tickets:', error);
            Swal.fire('Error', 'An error occurred while merging.', 'error');
        }
    };
    // --- ส่วนของ USER: Submit New Request ---  
    const handleSkillChange = (categoryId) => {
        // สมมติว่าใน selectedTask.skills เก็บเป็น Array ของ ID [1, 2, 5]
        console.log("Selected Task:", selectedTask);
        const currentSkills = selectedTask.skills || [];
        console.log("Current Skills before change:", currentSkills);
        let newSkills;

        if (currentSkills.includes(categoryId)) {
            newSkills = currentSkills.filter(id => id !== categoryId);
        } else {
            newSkills = [...currentSkills, categoryId];
        }

        setSelectedTask({ ...selectedTask, skills: newSkills });
    };

    const handleSaveUser = async () => {
        try {
            console.log("Saving user with data:", selectedTask.full_name, selectedTask.role, selectedTask.skills);
            setLoading(true);
            const response = await fetch(`${API_URL}/admin/users/${selectedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: selectedTask.full_name,
                    role: selectedTask.role,
                    skills: selectedTask.skills // ส่ง Array ของ Category ID ไป เช่น [1, 3]
                })
            });

            if (response.ok) {
                Swal.fire('Success', 'User updated successfully', 'success');
                setSelectedTask(null); // ปิดหน้า Edit
                fetchAdminData();      // รีโหลดตาราง
            } else {
                throw new Error('Failed to update');
            }
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        if (!requestMessage.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/user-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_email: userEmail || username, // ใช้อีเมลหรือ username
                    message: requestMessage,
                    user_id: userId
                }),
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Request Submitted',
                    text: 'AI has generated a draft for the Admin to review.',
                    confirmButtonColor: '#007bff'
                });
                setRequestMessage('');
                fetchTodos(); // Refresh list
            }
        } catch (err) {
            console.error('Error submitting request:', err);
            Swal.fire('Error', 'Failed to send request', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlinkRequest = async (requestId, currentDraftId) => {
        if (!window.confirm(`Do you want to unlink Request #${requestId} and create a separate draft?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/unlink-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, currentDraftId })
            });

            const data = await response.json();

            if (response.ok) {
                // แก้ไขตรงนี้: จาก setShowEditModal(false) เป็น setSelectedTask(null)
                setSelectedTask(null);

                // โหลดข้อมูลในตารางใหม่
                fetchAdminData();

                alert(`Request #${requestId} has been unlinked to Draft #${data.newDraftId}`);
            } else {
                alert(data.error || "Failed to unlink request");
            }
        } catch (error) {
            console.error("Error unlinking request:", error);
            alert("An error occurred while unlinking.");
        }
    };
    const handleUpdateDraft = async (draftId, updatedData) => {
        try {
            const response = await fetch(`${API_URL}/admin/draft-tickets/${draftId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            if (response.ok) {
                fetchAdminData(); // โหลดข้อมูลใหม่หลังแก้ไขสำเร็จ
                alert("Draft updated successfully");
            }
        } catch (err) {
            console.error("Update Draft Error:", err);
        }
    };

    const handleManageClick = (user) => {
        setSelectedTask({
            ...user,
            // แปลงจาก "1,2,5" เป็น [1, 2, 5]
            skills: user.skill_ids ? user.skill_ids.split(',').map(Number) : []
        });

    };

    const getProfileImageUrl = (imageName) => {
        if (!imageName) return "/default-avatar.png";
        return imageName.startsWith('http') ? imageName : `http://localhost:5001/uploads/${imageName}`;
    };

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('en-GB') : 'No Deadline';

    // Sidebar Render
    const renderSidebar = () => (
        <div className="d-none d-md-flex flex-column border-end shadow-sm bg-light" style={{ width: '280px', minHeight: '100vh', padding: '2rem 1.5rem', position: 'sticky', top: 0 }}>
            <div className="text-center mb-5">
                <img src={getProfileImageUrl(profileImage)} alt="Profile" className="rounded-circle border border-4 border-white shadow-sm mb-3" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                <h5 className="fw-bold text-dark mb-0">{username}</h5>
                <div className="mt-1">
                    {role === 'admin' && <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2">Admin System</span>}
                    {role === 'assignee' && <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2">Assignee</span>}
                    {role === 'user' && <span className="text-muted small">Personal Account</span>}
                </div>
            </div>

            {role === 'admin' && (
                <button className="btn btn-primary w-100 mb-4 py-2 shadow-sm fw-bold rounded-3" onClick={createNewAdmin}>
                    <i className="bi bi-person-plus me-2"></i>Create Admin
                </button>
            )}

            <div className="mb-4">
                <h6 className="text-muted small fw-bold text-uppercase mb-3 px-2">Task Management</h6>

                <button
                    className={`btn text-start w-100 py-2 px-3 rounded-3 mb-2 transition-all ${currentView === 'user-requests' ? 'btn-primary shadow-sm text-white' : 'btn-light text-dark'}`}
                    onClick={() => setCurrentView('user-requests')}
                >
                    <i className="bi bi-chat-left-text me-2"></i> User Requests
                </button>

                <button
                    className={`btn text-start w-100 py-2 px-3 rounded-3 mb-2 transition-all ${currentView === 'drafts' ? 'btn-primary shadow-sm text-white' : 'btn-light text-dark'}`}
                    onClick={() => setCurrentView('drafts')}
                >
                    <i className="bi bi-pencil-square me-2"></i> Draft Tickets
                </button>

                <button
                    className={`btn text-start w-100 py-2 px-3 rounded-3 mb-2 transition-all ${currentView === 'official' ? 'btn-primary shadow-sm text-white' : 'btn-light text-dark'}`}
                    onClick={() => setCurrentView('official')}
                >
                    <i className="bi bi-ticket-perforated me-2"></i> Official Tickets
                </button>
            </div>
            {role === 'user' && (
                <div className="mb-4">
                    <h6 className="text-muted small fw-bold text-uppercase mb-3 px-2">My Activity</h6>
                    <button
                        className={`btn text-start w-100 py-2 px-3 rounded-3 mb-2 ${currentView === 'track-tickets' ? 'btn-primary text-white' : 'btn-light'}`}
                        onClick={() => setCurrentView('track-tickets')}
                    >
                        <i className="bi bi-search me-2"></i> Track My Tickets
                    </button>
                </div>
            )}

            {/* Section: User Management (แสดงเฉพาะ Admin) */}
            {role === 'admin' && (
                <div className="mb-4">
                    <h6 className="text-muted small fw-bold text-uppercase mb-3 px-2">User Management</h6>
                    <button
                        className={`btn text-start w-100 py-2 px-3 rounded-3 mb-2 transition-all ${currentView === 'users' ? 'btn-primary shadow-sm text-white' : 'btn-light text-dark'}`}
                        onClick={() => setCurrentView('users')}
                    >
                        <i className="bi bi-people me-2"></i> Users
                    </button>
                    <button
                        className={`btn text-start w-100 py-2 px-3 rounded-3 mb-2 transition-all ${currentView === 'approvals' ? 'btn-primary shadow-sm text-white' : 'btn-light text-dark'}`}
                        onClick={() => setCurrentView('approvals')}
                    >
                        <i className="bi bi-person-check me-2"></i> Approvals
                    </button>
                </div>
            )}
        </div>
    );

    const renderDraftEditView = () => (
        <div className="container-fluid bg-white p-4 rounded shadow-sm border">
            {/* Header ส่วนบน: ปุ่มย้อนกลับ และ ชื่อ Ticket */}
            <div className="d-flex align-items-center mb-4 border-bottom pb-3">
                <button
                    className="btn btn-outline-secondary btn-sm rounded-circle me-3"
                    onClick={() => setSelectedTask(null)}
                    title="Go Back"
                >
                    <i className="bi bi-arrow-left"></i>
                </button>
                <div>
                    <h4 className="fw-bold mb-0">
                        {selectedTask.title}
                        <span className="badge bg-warning text-dark ms-2 small">DRAFT</span>
                    </h4>
                    <small className="text-muted">Ticket #{selectedTask.id}</small>
                </div>
            </div>

            <div className="row">
                {/* ฝั่งซ้าย: ฟอร์มแก้ไขข้อมูล */}
                <div className="col-md-5 border-end">
                    <div className="mb-3">
                        <label className="form-label text-muted small fw-bold text-uppercase">Title</label>
                        <input type="text" className="form-control bg-light"
                            value={selectedTask.title || ""}
                            onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label text-muted small fw-bold text-uppercase">Category</label>
                        <input type="text" className="form-control bg-light"
                            value={selectedTask.ai_category_name || selectedTask.category || ""}
                            onChange={(e) => setSelectedTask({ ...selectedTask, ai_category_name: e.target.value })} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label text-muted small fw-bold text-uppercase">Assignee</label>
                        <select className="form-select bg-light"
                            value={selectedTask.assigned_to || ""}
                            onChange={(e) => setSelectedTask({ ...selectedTask, assigned_to: e.target.value })}>
                            <option value="">Select Assignee</option>
                            {assignees.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label text-muted small fw-bold text-uppercase">Due Date</label>
                        <input type="datetime-local" className="form-control bg-light"
                            value={selectedTask.deadline ? selectedTask.deadline.substring(0, 16) : ""}
                            onChange={(e) => setSelectedTask({ ...selectedTask, deadline: e.target.value })} />
                    </div>
                </div>

                {/* ฝั่งขวา: ข้อมูลประกอบจาก AI และ Original Message */}
                <div className="col-md-7">
                    <div className="bg-light p-3 rounded-3 mb-3 border shadow-sm">
                        <h6 className="fw-bold text-primary mb-2">
                            <i className="bi bi-stars me-2"></i>AI Summary
                        </h6>
                        <textarea
                            className="form-control bg-gray border-0 shadow-sm"
                            rows="4"
                            value={selectedTask.summary || ""}
                            placeholder="Edit AI-generated summary here..."
                            onChange={(e) => setSelectedTask({ ...selectedTask, summary: e.target.value })}
                            style={{ fontSize: '0.9rem', lineHeight: '1.5' }}
                        />
                    </div>

                    {/* ส่วน Linked User Requests พร้อมปุ่ม Unlink */}
                    <div className="d-flex flex-column gap-2">
                        {selectedTask.linked_requests && selectedTask.linked_requests.length > 0 ? (
                            selectedTask.linked_requests.map((req, idx) => (
                                <div key={idx} className="p-3 bg-light border rounded shadow-xs d-flex justify-content-between align-items-center">
                                    <div style={{ flex: 1 }}>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <span className="badge bg-white text-dark border small" style={{ fontSize: '0.7rem' }}>
                                                Request #{req.id}
                                            </span>
                                            <small className="text-muted" style={{ fontSize: '0.8rem' }}>{req.user_email}</small>
                                        </div>
                                        <p className="mb-0 text-dark" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                            "{req.message}"
                                        </p>
                                    </div>

                                    {/* ปุ่ม Unlink ทรงเหลี่ยมมน */}
                                    {selectedTask.linked_requests.length > 1 && (
                                        <button
                                            className="btn btn-outline-danger d-flex align-items-center justify-content-center shadow-sm p-0"
                                            style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '10px',
                                                transition: 'all 0.2s ease'
                                            }}
                                            title="Unlink this request into a new ticket"
                                            onClick={() => handleUnlinkRequest(req.id, selectedTask.id)}
                                        >
                                            <i className="bi bi-scissors-italic fs-5"></i>
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-muted small italic text-center py-3">No linked requests.</p>
                        )}
                    </div>

                    <div className="border p-3 rounded-3 bg-white shadow-sm d-flex flex-column" style={{ minHeight: '400px', height: '100%' }}>
                        <h6 className="fw-bold small text-muted text-uppercase mb-3 border-bottom pb-2">
                            <i className="bi bi-list-check me-2"></i>Resolution Path
                        </h6>

                        <div className="flex-grow-1 overflow-auto pe-2">
                            {selectedTask.resolution_path && selectedTask.resolution_path.length > 0 ? (
                                <div className="d-flex flex-column gap-3">
                                    {selectedTask.resolution_path.map((step, index) => (
                                        <div key={index} className="d-flex align-items-start gap-2">
                                            <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: '24px', height: '24px', minWidth: '24px', marginTop: '6px' }}>
                                                {index + 1}
                                            </span>
                                            <textarea
                                                className="form-control form-control-sm bg-light border-0"
                                                rows="3"
                                                value={step}
                                                onChange={(e) => {
                                                    const newPath = [...selectedTask.resolution_path];
                                                    newPath[index] = e.target.value;
                                                    setSelectedTask({ ...selectedTask, resolution_path: newPath });
                                                }}
                                                style={{ resize: 'none' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted small mt-auto mb-auto">
                                    <i className="bi bi-info-circle d-block mb-2 fs-4"></i>
                                    No resolution steps suggested by AI.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer: ปุ่มจัดการ */}
            <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top">
                <button className="btn btn-outline-dark px-4" onClick={() => {/* Logic สำหรับ Merge */ }}>
                    <i className="bi bi-layers me-2"></i>Merge
                </button>

                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary px-4" onClick={() => handleInlineUpdate(selectedTask.id, selectedTask)}>
                        <i className="bi bi-save me-2"></i>Save Draft
                    </button>

                    <button
                        className="btn px-4 py-2 text-white fw-bold shadow-sm"
                        style={{ backgroundColor: '#ff6b00', borderRadius: '8px' }}
                        onClick={() => convertToOfficial(selectedTask)}
                    >
                        <i className="bi bi-check-circle me-2"></i>Approve & Submit
                    </button>
                </div>
            </div>
        </div>
    );

    const renderUserEditView = (user) => (

        <div className="container-fluid bg-white p-3 rounded shadow-sm border">
            {/* Header: แสดงชื่อและปุ่มย้อนกลับ */}
            <div className="d-flex align-items-center mb-3 border-bottom pb-2">
                <button
                    className="btn btn-outline-secondary btn-sm rounded-circle me-3"
                    onClick={() => setSelectedTask(null)}
                    title="Go Back"
                >
                    <i className="bi bi-arrow-left"></i>
                </button>
                <h5 className="fw-bold mb-0">Edit User: {user.full_name}</h5>
            </div>

            <div className="row g-4">
                {/* ฝั่งซ้าย: ข้อมูลบัญชี (Account Info) */}
                <div className="col-md-5 border-end">
                    <h6 className="text-primary fw-bold mb-3 small text-uppercase">Account Information</h6>

                    {/* Profile Image Preview */}
                    <div className="text-center mb-3">
                        <img
                            src={user.profile_image ? getProfileImageUrl(user.profile_image) : "/default-avatar.png"}
                            className="rounded-circle border shadow-sm"
                            width="100" height="100" alt="profile"
                            style={{ objectFit: 'cover' }}
                        />
                        <div className="mt-2">
                            <button className="btn btn-sm btn-outline-secondary">Change Photo</button>
                        </div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label small fw-bold text-muted">FULL NAME</label>
                        <input type="text" className="form-control form-control-sm" defaultValue={user.full_name} />
                    </div>

                    <div className="mb-2">
                        <label className="form-label small fw-bold text-muted">USERNAME</label>
                        <input type="text" className="form-control form-control-sm" defaultValue={user.username} />
                    </div>

                    <div className="mb-3">
                        <label className="form-label small fw-bold text-muted">ROLE</label>
                        <select
                            className="form-select form-select-sm"
                            defaultValue={user.role}
                            disabled={user.role === 'admin'}
                            onChange={(e) => setSelectedTask({ ...selectedTask, role: e.target.value })}
                        >
                            <option value="user">User</option>
                            <option value="assignee">Assignee</option>
                            <option value="admin">Admin</option>
                        </select>
                        {user.role === 'admin' && (
                            <small className="text-danger" style={{ fontSize: '0.7rem' }}>
                                * Administrator roles cannot be changed for security reasons.
                            </small>
                        )}
                    </div>

                    <div className="p-2 bg-light rounded border">
                        <label className="form-label small fw-bold text-danger">RESET PASSWORD</label>
                        <input type="password" HTML className="form-control form-control-sm" placeholder="Enter new password" />
                    </div>
                </div>

                {/* ฝั่งขวา: ทักษะและความเชี่ยวชาญ (Skills & Categories) */}
                <div className="col-md-7">
                    <h6 className="text-primary fw-bold mb-3 small text-uppercase">Skills & Assignments</h6>

                    <p className="text-muted small">Select the categories this user can manage:</p>

                    <div className="row g-2">
                        {categories.map((cat) => (
                            <div key={cat.id} className="col-6">
                                <div className="form-check form-switch p-2 border rounded shadow-xs">
                                    <input
                                        className="form-check-input ms-0 me-2"
                                        type="checkbox"
                                        checked={selectedTask.skills?.includes(cat.id)}
                                        onChange={() => handleSkillChange(cat.id)}
                                    />
                                    <label className="form-check-label small">{cat.name}</label>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-3 border-top">
                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-primary px-4 shadow-sm" onClick={handleSaveUser}>Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTrackingView = () => (
        <div className="container-fluid py-4">
            <div className="table-responsive bg-white rounded-4 shadow-sm border p-3">
                <table className="table table-hover align-middle">
                    <thead>
                        <tr className="text-muted small text-uppercase">
                            <th>Date</th>
                            <th>Your Request</th>
                            <th>AI Draft Title</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userTickets.map((t) => (
                            <tr key={t.request_id}>
                                <td className="small text-muted">
                                    {new Date(t.created_at).toLocaleDateString()}
                                </td>
                                <td className="fw-medium">{t.original_message}</td>
                                <td className="text-muted italic">{t.ai_title || "Processing..."}</td>
                                <td>
                                    {t.request_status === 'received' && <span className="badge bg-secondary">Waiting for AI</span>}
                                    {t.request_status === 'draft' && <span className="badge bg-warning text-dark">Admin Reviewing</span>}
                                    {t.request_status === 'ticket' && (
                                        <span className="badge bg-success">
                                            {t.official_status}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {userTickets.length === 0 && (
                    <div className="text-center py-5 text-muted">
                        <p>No tickets found in your history.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderTaskGroup = (statusLabel) => {
        let dataSource = [];
        if (currentView === 'user-requests') dataSource = userRequests;
        else if (currentView === 'drafts') dataSource = drafts;
        else if (currentView === 'official') dataSource = officialTickets;
        else if (currentView === 'users') dataSource = users;

        const filteredItems = currentView === 'users'
            ? dataSource.filter(u => u.role === statusLabel)
            : dataSource.filter(item => item.status === statusLabel);

        return (
            <div key={statusLabel} className="mb-5 shadow-sm rounded border">
                {/* Header ส่วนหัวกลุ่มงาน */}
                <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0 text-uppercase small text-muted">{statusLabel}</h6>

                    {/* ปุ่ม Merge จะแสดงเมื่ออยู่ในหน้า Draft และเลือก Ticket มากกว่า 1 ใบ */}
                    {currentView === 'drafts' && selectedDraftIds.length > 1 && (
                        <button
                            className="btn btn-sm btn-warning fw-bold shadow-sm animate__animated animate__fadeIn"
                            onClick={() => handleMergeClick(selectedDraftIds)}
                        >
                            <i className="bi bi-intersect me-1"></i> Merge Selected ({selectedDraftIds.length})
                        </button>
                    )}
                </div>

                <div className="table-responsive bg-white">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr className="small text-uppercase text-muted">
                                {/* เพิ่มคอลัมน์ Checkbox เฉพาะหน้า Drafts */}
                                {currentView === 'drafts' && <th style={{ width: '40px' }}></th>}
                                <th style={{ width: '50px' }}>ID</th>
                                {currentView === 'users' ? (
                                    <>
                                        <th>Username</th>
                                        <th>Skills</th>
                                        <th className="text-end">Action</th>
                                    </>
                                ) : (
                                    <>
                                        <th>{currentView === 'drafts' ? 'Title / Summary' : 'Message / Details'}</th>
                                        {currentView === 'drafts' && <th>Category</th>}
                                        {currentView === 'drafts' && <th>Assignee</th>}
                                        {currentView === 'drafts' && <th>Ai Suggested Merge</th>}
                                        <th>{currentView === 'drafts' ? 'Deadline' : 'Status'}</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => {
                                const isSelected = selectedDraftIds.includes(item.id);
                                //console.log("Rendering item:", item, "Selected IDs:", selectedDraftIds);
                                return (
                                    <tr
                                        key={item.id}
                                        onClick={() => currentView === 'drafts' && handleSelectTask(item)}
                                        className={isSelected ? 'table-warning' : ''}
                                        style={{ cursor: currentView === 'drafts' ? 'pointer' : 'default' }}
                                    >
                                        {/* คอลัมน์ Checkbox */}
                                        {currentView === 'drafts' && (
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectDraft(item.id)}
                                                />
                                            </td>
                                        )}

                                        <td className="fw-bold text-muted">{item.id}</td>

                                        {currentView === 'users' ? (
                                            <>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <img src={getProfileImageUrl(item.profile_image)} alt="" className="rounded-circle me-2 border" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
                                                        <div>
                                                            <div className="fw-bold text-dark small">{item.username || "N/A"}</div>
                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="align-middle">
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {item.skill_names ? item.skill_names.split(',').map((skill, index) => (
                                                            <span key={index} className="badge bg-info text-dark rounded-pill shadow-xs">{skill}</span>
                                                        )) : <span className="text-muted">-</span>}
                                                    </div>
                                                </td>
                                                <td className="text-end">
                                                    <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => handleManageClick(item)}>Manage</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="fw-bold text-dark">{item.title || item.message}</div>

                                                        {/* แสดง Badge จำนวน Request ที่ถูก Merge เข้ามา (เฉพาะหน้า Drafts) */}
                                                        {currentView === 'drafts' && item.linked_requests?.length > 1 && (
                                                            <span
                                                                className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle"
                                                                title={`Merged from ${item.linked_requests.length} requests`}
                                                                style={{ fontSize: '0.7rem' }}
                                                            >
                                                                <i className="bi bi-stack me-1"></i>
                                                                {item.linked_requests.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {currentView === 'drafts' && <div className="small text-muted text-truncate" style={{ maxWidth: '250px' }}>{item.summary}</div>}
                                                </td>
                                                {currentView === 'drafts' && (
                                                    <>
                                                        <td><span className="badge bg-info-subtle text-info border border-info-subtle">{item.ai_category_name || item.category || 'Uncategorized'}</span></td>
                                                        <td><div className="small text-dark"><i className="bi bi-person me-1"></i>{assignees.find(a => String(a.id) === String(item.assigned_to))?.username || <span className="text-danger">Not Assigned</span>}</div></td>
                                                        <td><div className="small text-dark"><i className="bi bi-person me-1"></i>{item.ai_suggested_merge_id || <span className="text-danger">Not Assigned</span>}</div></td>
                                                    </>
                                                )}

                                                <td><span className={`badge ${item.status === 'New' ? 'bg-success' : 'bg-secondary'}`}>{currentView === 'drafts' ? formatDate(item.deadline) : item.status}</span></td>

                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };
    const AdminApprovalSection = ({ API_URL }) => {
        const [pendingUsers, setPendingUsers] = React.useState([]);

        const fetchPending = () => {
            fetch(`${API_URL}/admin/pending-approvals`)
                .then(res => res.json())
                .then(data => setPendingUsers(data))
                .catch(err => console.error(err));
        };

        React.useEffect(() => { fetchPending(); }, []);

        const handleApprove = (id) => {
            Swal.fire({
                title: 'Confirm Approval?',
                text: "This user will gain access to the system.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                confirmButtonText: 'Yes, Approve'
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch(`${API_URL}/admin/approve-user/${id}`, { method: 'PUT' })
                        .then(res => res.json())
                        .then(() => {
                            Swal.fire('Approved!', 'User is now active.', 'success');
                            fetchPending();
                        });
                }
            });
        };

        return (
            <div className="card border-0 shadow-sm rounded-4 p-4">
                <h4 className="fw-bold mb-4 text-primary"><i className="bi bi-person-check-fill me-2"></i>Pending Approvals</h4>
                {pendingUsers.length === 0 ? (
                    <div className="text-center py-5 text-muted">No pending registrations found.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingUsers.map(u => (
                                    <tr key={u.id}>
                                        <td className="fw-bold">{u.full_name}</td>
                                        <td>{u.username}</td>
                                        <td><span className="badge bg-info text-dark">{u.role}</span></td>
                                        <td>
                                            <button className="btn btn-success btn-sm rounded-pill px-3" onClick={() => handleApprove(u.id)}>
                                                Approve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };
    return (
        <div className="d-flex min-vh-100 bg-white">
            {renderSidebar()}
            <div className="flex-grow-1 p-4 p-lg-5">

                {/* 1. ส่วนการแก้ไข (Admin Editing Views) - จะแสดงทับหน้าหลักเมื่อมี SelectedTask */}
                {role === 'admin' && currentView === 'drafts' && selectedTask ? (
                    renderDraftEditView()
                ) : role === 'admin' && currentView === 'users' && selectedTask ? (
                    renderUserEditView(selectedTask)
                ) : (
                    /* 2. พื้นที่แสดงเนื้อหาหลัก (Main Content Area) */
                    <div className="mx-auto" style={{ maxWidth: '1100px' }}>

                        {/* Header Section */}
                        <div className="d-flex justify-content-between align-items-center mb-5">
                            <h2 className="fw-bold mb-0">
                                {currentView === 'user-requests' ? 'User Requests' :
                                    currentView === 'drafts' ? 'AI Draft Management' :
                                        currentView === 'track-tickets' ? 'My Ticket Status' :
                                            currentView === 'users' ? 'User Management' : 'Official Tickets'}
                            </h2>
                            <button className="btn btn-outline-danger px-4 rounded-pill" onClick={onLogout}>Logout</button>
                        </div>

                        {/* --- แสดงเนื้อหาตาม Role และ View --- */}

                        {/* CASE: USER */}
                        {role === 'user' && (
                            <>
                                {currentView === 'track-tickets' && renderTrackingView()}
                                {currentView === 'user-requests' && (
                                    <>
                                        <form onSubmit={handleSubmitRequest} className="mb-5 p-4 border rounded-4 shadow-sm bg-white">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold small text-muted">Submit New Request (AI Handled)</label>
                                                <textarea
                                                    className="form-control border-0 bg-light py-2"
                                                    rows="3"
                                                    placeholder="Describe your issue..."
                                                    value={requestMessage}
                                                    onChange={(e) => setRequestMessage(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <button className="btn btn-primary px-5 py-2 fw-bold shadow-sm rounded-pill w-100" type="submit" disabled={loading}>
                                                {loading ? 'Processing...' : 'Send Request to AI'}
                                            </button>
                                        </form>
                                        {/* รายการคำขอของ User */}
                                        {viewConfigs['user-requests']?.map(status => renderTaskGroup(status))}
                                    </>
                                )}
                            </>
                        )}

                        {/* CASE: ADMIN */}
                        {role === 'admin' && (
                            viewConfigs[currentView] ? (
                                viewConfigs[currentView].map(status => renderTaskGroup(status))
                            ) : (
                                <div className="text-center py-5 text-muted">No configuration for this view.</div>
                            )
                        )}

                        {/* CASE: ASSIGNEE (Kwan's Section) */}
                        {role === 'assignee' && (
                            <AssigneeDashboard userId={userId} API_URL={API_URL} />
                        )}

                        {/* Security Check: ถ้าไม่ใช่ Admin แต่พยายามเข้าหน้า Admin */}
                        {role !== 'admin' && (currentView === 'drafts' || currentView === 'users') && (
                            <div className="text-center py-5">
                                <i className="bi bi-lock text-muted display-1"></i>
                                <p className="mt-3 text-muted">Access Denied: Admin Only</p>
                            </div>
                        )}
                        {role === 'admin' && (
                            currentView === 'approvals' ? (
                                /* เพิ่มบรรทัดนี้เพื่อเรียกใช้ Section ที่เราสร้างไว้ข้างบน */
                                <AdminApprovalSection API_URL={API_URL} />
                            ) : (
                                viewConfigs[currentView] ? (
                                    viewConfigs[currentView].map(status => renderTaskGroup(status))
                                ) : (
                                    <div className="text-center py-5 text-muted">No configuration for this view.</div>
                                )
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TodoList;
// CHANGED
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Card, CardHead, TH, TD, EmptyRow, Pill, StatusPill, StatCard, FilterBar } from './Shared';

function AssigneeDashboard({ userId, API_URL, view = 'dashboard' }) {
  const ensureArray = (value) => (Array.isArray(value) ? value : []);
  // CHANGED
  const [isNarrow, setIsNarrow] = useState(false);
  const statGridRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [resolution, setResolution] = useState('');
  const [tempStatus, setTempStatus] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const getDeadlineTime = (ticket) => {
    if (!ticket?.deadline) return Number.POSITIVE_INFINITY;
    const deadline = new Date(ticket.deadline).getTime();
    return Number.isNaN(deadline) ? Number.POSITIVE_INFINITY : deadline;
  };

  const getUrgencyLabel = (ticket) => {
    if (!ticket?.deadline) return 'No deadline';
    const now = Date.now();
    const deadlineTime = getDeadlineTime(ticket);
    if (deadlineTime === Number.POSITIVE_INFINITY) return 'No deadline';

    const diffMs = deadlineTime - now;
    const absHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));

    if (diffMs < 0) return `Overdue ${absHours}h`;
    if (absHours < 24) return `${absHours}h left`;
    const days = Math.floor(absHours / 24);
    return `${days}d left`;
  };

  const loadTasks = () => {
    fetch(`${API_URL}/assignee/my-tasks/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = ensureArray(data).sort((first, second) => {
          const firstDate = new Date(first.created_at || first.deadline || 0).getTime();
          const secondDate = new Date(second.created_at || second.deadline || 0).getTime();
          return secondDate - firstDate;
        });
        setTasks(sorted);
      })
      .catch(() => setTasks([]));
  };

  useEffect(() => {
    loadTasks();

    fetch(`${API_URL}/assignee/list-all`)
      .then((res) => res.json())
      .then((data) => setAllUsers(ensureArray(data)))
      .catch(() => setAllUsers([]));
  }, [userId, API_URL]);

  useEffect(() => {
    if (!selectedTicket) return;

    const interval = setInterval(() => {
      fetch(`${API_URL}/assignee/comments/${selectedTicket.id}`)
        .then((res) => res.json())
        .then((data) => {
          const safeData = ensureArray(data);
          setComments((prev) => (prev.length !== safeData.length ? safeData : prev));
        })
        .catch(() => {});

      fetch(`${API_URL}/assignee/history/${selectedTicket.id}`)
        .then((res) => res.json())
        .then((data) => {
          const safeData = ensureArray(data);
          setHistory((prev) => (prev.length !== safeData.length ? safeData : prev));
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedTicket, API_URL]);

  // CHANGED
  useEffect(() => {
    if (!statGridRef.current) return;
    const observer = new window.ResizeObserver(entries => {
      for (const entry of entries) {
        setIsNarrow(entry.contentRect.width < 400);
      }
    });
    observer.observe(statGridRef.current);
    return () => observer.disconnect();
  }, []);

  const getNameFromId = (id) => {
    if (!id) return 'Unassigned';
    const cleanId = String(id).replace('User ', '').trim();
    const user = ensureArray(allUsers).find((item) => Number(item.id) === Number(cleanId));
    if (user) return user.full_name || user.username;
    return id;
  };

  const counters = useMemo(() => {
    const all = tasks.length;
    const pending = tasks.filter((ticket) => String(ticket.status || '').toLowerCase() === 'new').length;
    const active = tasks.filter((ticket) => ['new', 'assigned', 'solving'].includes(String(ticket.status || '').toLowerCase())).length;
    const resolved = tasks.filter((ticket) => String(ticket.status || '').toLowerCase() === 'solved').length;

    const myAssignedTasks = tasks.filter((ticket) => Number(ticket.assignee_id) === Number(userId));
    const currentlyAssigned = myAssignedTasks.filter(
      (ticket) => !['solved', 'failed'].includes(String(ticket.status || '').toLowerCase())
    ).length;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const closedLast30Days = myAssignedTasks.filter((ticket) => {
      const status = String(ticket.status || '').toLowerCase();
      if (!['solved', 'failed'].includes(status)) return false;
      const closeTime = new Date(ticket.updated_at || ticket.created_at || 0).getTime();
      return !Number.isNaN(closeTime) && closeTime >= thirtyDaysAgo;
    }).length;

    return { all, pending, active, resolved, currentlyAssigned, closedLast30Days };
  }, [tasks, userId]);

  const filteredTasks = useMemo(() => {
    const activeOnly = tasks.filter(
      (ticket) => !['solved', 'failed'].includes(String(ticket.status || '').toLowerCase())
    );

    const closedOnly = tasks.filter((ticket) => ['solved', 'failed'].includes(String(ticket.status || '').toLowerCase()));
    const followingOnly = tasks.filter((ticket) => Number(ticket.assignee_id) !== Number(userId));

    const sortedByUrgency = [...activeOnly].sort((first, second) => getDeadlineTime(first) - getDeadlineTime(second));
    const sortedClosed = [...closedOnly].sort((first, second) => new Date(second.updated_at || second.created_at || 0) - new Date(first.updated_at || first.created_at || 0));
    const sortedFollowing = [...followingOnly].sort((first, second) => getDeadlineTime(first) - getDeadlineTime(second));

    const viewBase =
      view === 'active'
        ? sortedByUrgency
        : view === 'closed'
          ? sortedClosed
          : view === 'following'
            ? sortedFollowing
            : view === 'history'
              ? [...tasks].sort((first, second) => new Date(second.updated_at || second.created_at || 0) - new Date(first.updated_at || first.created_at || 0))
              : sortedByUrgency;

    let scoped = viewBase;
    if (view === 'active' && statusFilter !== 'all') {
      scoped = scoped.filter((ticket) => String(ticket.status || '').toLowerCase() === statusFilter);
    }

    if (!search.trim()) return scoped;
    const keyword = search.toLowerCase();
    return scoped.filter((ticket) =>
      [ticket.title, ticket.category, ticket.assignee_name, ticket.ticket_no]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [tasks, search, statusFilter, userId, view]);

  const orderedComments = useMemo(
    () => [...comments].sort((first, second) => new Date(first.created_at) - new Date(second.created_at)),
    [comments]
  );

  const visibleRows = showAll ? filteredTasks : filteredTasks.slice(0, 8);

  const formatCompactDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatusChip = (status) => {
    const s = String(status || 'New');
    const map = {
      New: ['#E8F5E9', '#2E7D32'],
      Assigned: ['#E3F2FD', '#1565C0'],
      Solving: ['#FFF3E0', '#E65100'],
      Solved: ['#ECFDF5', '#059669'],
      Failed: ['#FFEBEE', '#C62828'],
    };
    const [bg, color] = map[s] || ['#F3F4F6', '#6B7280'];
    return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{s}</span>;
  };

  const handleOpenDetails = (ticket) => {
    setSelectedTicket(ticket);
    setTempStatus(ticket.status);
    setNewAssigneeId(ticket.assignee_id);
    setResolution('');

    fetch(`${API_URL}/assignee/history/${ticket.id}`)
      .then((res) => res.json())
      .then((data) => setHistory(ensureArray(data)))
      .catch(() => setHistory([]));

    fetch(`${API_URL}/assignee/comments/${ticket.id}`)
      .then((res) => res.json())
      .then((data) => setComments(ensureArray(data)))
      .catch(() => setComments([]));

    fetch(`${API_URL}/assignee/followers/${ticket.id}`)
      .then((res) => res.json())
      .then((data) => setFollowers(ensureArray(data)))
      .catch(() => setFollowers([]));

    const modal = new window.bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
  };

  const handleAddFollower = (ticketId, teammateId) => {
    if (!teammateId) return;

    fetch(`${API_URL}/assignee/add-follower`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticketId, user_id: teammateId }),
    }).then(() => {
      fetch(`${API_URL}/assignee/followers/${ticketId}`)
        .then((res) => res.json())
        .then((data) => setFollowers(ensureArray(data)))
        .catch(() => setFollowers([]));
    });
  };

  const handlePostComment = () => {
    if (!newComment.trim() || !selectedTicket) return;

    fetch(`${API_URL}/assignee/post-comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticket_id: selectedTicket.id,
        user_id: userId,
        comment_text: newComment,
        is_internal: isInternal,
      }),
    }).then(() => {
      setNewComment('');
      setIsInternal(false);
      fetch(`${API_URL}/assignee/comments/${selectedTicket.id}`)
        .then((res) => res.json())
        .then((data) => setComments(ensureArray(data)))
        .catch(() => setComments([]));
    });
  };

  const submitUpdate = async () => {
    if (!selectedTicket) return;

    const isClosing = tempStatus.toLowerCase() === 'solved' || tempStatus.toLowerCase() === 'failed';
    if (isClosing && !resolution.trim()) {
      alert('Resolution comment is required to close this ticket!');
      return;
    }

    try {
      await fetch(`${API_URL}/assignee/update-ticket/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: tempStatus,
          assignee_id: newAssigneeId,
          resolution_comment: resolution,
          performed_by: userId,
          old_status: selectedTicket.status,
          old_assignee_id: selectedTicket.assignee_id,
        }),
      });

      loadTasks();
      setSelectedTicket((prev) => (prev ? { ...prev, status: tempStatus, assignee_id: newAssigneeId } : prev));
      alert('Ticket updated successfully.');
    } catch (error) {
      console.error('Update failed:', error);
      alert('There was an error updating the ticket.');
    }
  };

  return (
    <div>
      <style>{`
        .comment-internal {
          background-color: #fff4e5 !important;
          border-left: 5px solid #ff9800 !important;
        }
        .comment-public {
          background-color: #fff7ed !important;
          border-left: 5px solid #f97316 !important;
        }
        .assignee-row {
          transition: background-color .12s ease;
        }
        .text-orange { color: #e67e22 !important; }
        .resolution-tag { color: #198754; font-weight: bold; }
        .modal-backdrop { display: none !important; }
        .StatCard {
          font-size: 13px !important;
          padding: 10px 8px !important;
        }
        .CardHead, .Card {
          padding: 8px 4px !important;
        }
        table, th, td {
          font-size: 12px !important;
        }
        .assignee-table-scroll {
          min-width: 340px !important;
        }
      `}</style>

      {view === 'dashboard' && (
      <>
        // CHANGED
        <div
          ref={statGridRef}
          className="assignee-stat-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: isNarrow ? '1fr' : 'repeat(4, 1fr)',
            gap: isNarrow ? 8 : 16,
            marginBottom: 20,
            width: '100%',
          }}
        >
          <StatCard label="Currently Assigned" value={counters.currentlyAssigned} sub="assigned to you now" accent="#F97316" />
          <StatCard label="Solved/Failed (30d)" value={counters.closedLast30Days} sub="closed by status in 30 days" accent="#F59E0B" />
          <StatCard label="Active Tickets" value={counters.active} sub="in progress" accent="#3B82F6" />
          <StatCard label="Resolved" value={counters.resolved} sub="tickets solved" accent="#10B981" />
        </div>
      </>
      )}

      <Card style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <CardHead
          title={
            view === 'active'
              ? 'Active Tickets'
              : view === 'closed'
                ? 'Closed Tickets'
                : view === 'following'
                  ? 'Following Tickets'
                  : view === 'history'
                    ? 'Ticket History'
                    : 'Urgent Active Tickets'
          }
          count={visibleRows.length}
          right={
            <button
              onClick={() => setShowAll((prev) => !prev)}
              style={{
                background: '#FFF7ED',
                border: '1px solid #FDBA74',
                color: '#EA580C',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showAll ? 'Show Less' : 'View All →'}
            </button>
          }
        />

        <div style={{ padding: '14px 20px 0' }}>
          <FilterBar
            search={search}
            onSearch={setSearch}
            filter={statusFilter}
            onFilter={setStatusFilter}
            filterOpts={
              view === 'active'
                ? [
                    { value: 'all', label: 'All Status' },
                    { value: 'new', label: 'New' },
                    { value: 'assigned', label: 'Assigned' },
                    { value: 'solving', label: 'Solving' },
                  ]
                : undefined
            }
            placeholder={view === 'active' ? 'Search title, ticket no, assignee...' : 'Search tickets by title, category, assignee, ticket no...'}
          />
        </div>

        <div className="assignee-table-scroll" style={{ overflowX: 'auto' }}>
          {view === 'active' ? (
          <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH>Ticket No</TH>
                <TH>Title</TH>
                <TH>Category</TH>
                <TH>Assignee</TH>
                <TH>Status</TH>
                <TH>Deadline</TH>
                <TH>Updated</TH>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((ticket) => {
                const assigneeName = ticket.assignee_name || getNameFromId(ticket.assignee_id);
                const initial = String(assigneeName || 'A').charAt(0).toUpperCase();
                return (
                  <tr
                    className="assignee-row"
                    key={ticket.id}
                    style={{ background: 'white', cursor: 'pointer' }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = '#FAFAFA';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = 'white';
                    }}
                    onClick={() => handleOpenDetails(ticket)}
                  >
                    <TD s={{ width: '16%', color: '#F97316', fontWeight: 700, fontFamily: 'monospace' }}>{ticket.ticket_no || `TK-${ticket.id}`}</TD>
                    <TD s={{ width: '34%' }}>
                      <div style={{ fontWeight: 700, color: '#1A1A2E', fontSize: 13 }}>{ticket.title || `Ticket #${ticket.id}`}</div>
                      {ticket.summary && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.summary}</div>}
                    </TD>
                    <TD s={{ width: '12%' }}><Pill bg="#E3F2FD" color="#1565C0">{ticket.category || 'IT Support'}</Pill></TD>
                    <TD s={{ width: '12%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#F97316', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initial}</div>
                        <span style={{ fontSize: 12, color: '#374151' }}>{assigneeName}</span>
                      </div>
                    </TD>
                    <TD s={{ width: '10%' }}>{renderStatusChip(ticket.status)}</TD>
                    <TD s={{ width: '8%', fontSize: 11, color: '#9CA3AF' }}>{formatCompactDate(ticket.deadline)}</TD>
                    <TD s={{ width: '8%', fontSize: 11, color: '#9CA3AF' }}>{formatCompactDate(ticket.updated_at || ticket.created_at)}</TD>
                  </tr>
                );
              })}
              {visibleRows.length === 0 && <EmptyRow cols={7} msg="No active tickets found." />}
            </tbody>
          </table>
          ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH>Title</TH>
                <TH>Category</TH>
                <TH>Assignee</TH>
                <TH>{view === 'closed' || view === 'history' ? 'Updated' : 'Urgency'}</TH>
                <TH>Status</TH>
                <TH>Action</TH>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((ticket) => {
                const assigneeName = ticket.assignee_name || getNameFromId(ticket.assignee_id);
                return (
                  <tr
                    className="assignee-row"
                    key={ticket.id}
                    style={{ background: 'white', cursor: 'pointer' }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = '#FAFAFA';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = 'white';
                    }}
                    onClick={() => handleOpenDetails(ticket)}
                  >
                    <TD s={{ width: '34%' }}>
                      <div style={{ fontWeight: 600, color: '#1A1A2E' }}>{ticket.title || `Ticket #${ticket.id}`}</div>
                      {ticket.ticket_no && (
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{ticket.ticket_no}</div>
                      )}
                    </TD>
                    <TD s={{ width: '14%' }}>
                      <Pill bg="#FFF7ED" color="#EA580C">{ticket.category || 'IT Support'}</Pill>
                    </TD>
                    <TD s={{ width: '16%', fontSize: 12, color: assigneeName === 'Unassigned' ? '#EF4444' : '#6B7280' }}>
                      {assigneeName}
                    </TD>
                    <TD s={{ width: '14%', fontSize: 12, color: getUrgencyLabel(ticket).startsWith('Overdue') ? '#EF4444' : '#9CA3AF', fontWeight: getUrgencyLabel(ticket).startsWith('Overdue') ? 700 : 500 }}>
                      {view === 'closed' || view === 'history'
                        ? new Date(ticket.updated_at || ticket.created_at || Date.now()).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : getUrgencyLabel(ticket)}
                    </TD>
                    <TD s={{ width: '12%' }}>
                      <StatusPill s={ticket.status || 'New'} />
                    </TD>
                    <TD s={{ width: '10%' }}>
                      <button
                        className="btn btn-sm"
                        style={{ border: '1px solid #F97316', color: '#F97316', background: '#fff' }}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenDetails(ticket);
                        }}
                      >
                        View
                      </button>
                    </TD>
                  </tr>
                );
              })}
              {visibleRows.length === 0 && <EmptyRow cols={6} msg="No tickets found." />}
            </tbody>
          </table>
          )}
        </div>
      </Card>

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
                  <div className="bg-light p-3 rounded-3 mb-4 border">
                    <h6 className="fw-bold text-muted small mb-2 text-uppercase">Project Roles</h6>
                    <div className="mb-2">
                      <span className="badge bg-secondary me-2">Creator</span>
                      <span className="small">{selectedTicket?.creator_name || 'Customer'}</span>
                    </div>
                    <div className="mb-3">
                      <span className="badge me-2" style={{ backgroundColor: '#F97316' }}>Head Lead</span>
                      <span className="small fw-bold">{getNameFromId(selectedTicket?.assignee_id)}</span>
                    </div>
                    <hr />
                    <h6 className="fw-bold text-muted small mb-2 text-uppercase">Teammates</h6>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {followers.length > 0 ? followers.map((follower) => (
                        <span key={follower.id} className="badge bg-white text-dark border shadow-sm small">
                          👤 {follower.full_name || follower.username}
                        </span>
                      )) : <div className="small text-muted italic">No followers</div>}
                    </div>
                    <select
                      className="form-select form-select-sm"
                      onChange={(event) => handleAddFollower(selectedTicket.id, event.target.value)}
                      value=""
                    >
                      <option value="" disabled>+ Add Teammate</option>
                      {ensureArray(allUsers).map((user) => (
                        <option key={user.id} value={user.id}>{user.full_name || user.username}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 border rounded-3 bg-white mb-4">
                    <label className="small fw-bold mb-1">Update Status</label>
                    <select className="form-select mb-3" value={tempStatus} onChange={(event) => setTempStatus(event.target.value)}>
                      <option value="New">New</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Solving">Solving</option>
                      <option value="Solved">Solved</option>
                      <option value="Failed">Failed</option>
                    </select>

                    <label className="small fw-bold mb-1">Reassign Head Lead</label>
                    <select className="form-select mb-3" value={newAssigneeId || ''} onChange={(event) => setNewAssigneeId(event.target.value)}>
                      <option value="" disabled>Select Lead</option>
                      {ensureArray(allUsers).map((user) => (
                        <option key={user.id} value={user.id}>{user.full_name || user.username}</option>
                      ))}
                    </select>

                    {(tempStatus.toLowerCase() === 'solved' || tempStatus.toLowerCase() === 'failed') && (
                      <textarea
                        className="form-control mb-3"
                        placeholder="Closing resolution (will be shared with customer)..."
                        value={resolution}
                        onChange={(event) => setResolution(event.target.value)}
                      />
                    )}

                    <button className="btn w-100 rounded-pill text-white" style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', border: 'none' }} onClick={submitUpdate}>Save Changes</button>
                  </div>

                  <h6 className="small fw-bold text-muted uppercase">History Log</h6>
                  <div className="overflow-auto pe-2" style={{ maxHeight: '150px' }}>
                    {history.map((item) => (
                      <div key={item.id} className="small border-bottom mb-2 pb-1 border-start border-3 ps-2" style={{ borderLeftColor: '#F97316' }}>
                        <div className="fw-bold">[{item.action_type}] {item.old_value || '—'} → {item.new_value || '—'}</div>
                        <div className="text-dark small">By: {item.performer_name || item.performer_username || 'System'}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {new Date(item.created_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-md-8 ps-4">
                  <h6 className="fw-bold mb-3">💬 Communications</h6>
                  <div className="overflow-auto mb-3 pe-2" style={{ height: '350px' }}>
                    {orderedComments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 mb-3 rounded-3 shadow-sm ${String(comment.comment_type).toLowerCase() === 'internal' ? 'comment-internal' : 'comment-public'}`}
                      >
                        {String(comment.comment_type).toLowerCase() === 'internal' && <span className="text-orange">🔒 INTERNAL NOTE</span>}
                        <div className="d-flex justify-content-between small fw-bold mb-1">
                          <span>{comment.full_name || comment.username}</span>
                          {comment.comment_type === 'internal' && <span className="text-orange">🔒 INTERNAL NOTE</span>}
                        </div>
                        <div className="mb-1" style={{ fontSize: '0.95rem' }}>
                          {comment.comment_text.startsWith('[RESOLUTION]') ? (
                            <span className="resolution-tag">{comment.comment_text}</span>
                          ) : comment.comment_text}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {new Date(comment.created_at).toLocaleString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-top">
                    <textarea
                      className="form-control mb-2"
                      rows="2"
                      placeholder="Type a message..."
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                    />
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="form-check form-switch mt-1">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="intSwitch"
                          checked={isInternal}
                          onChange={(event) => setIsInternal(event.target.checked)}
                        />
                        <label className="form-check-label small fw-bold" htmlFor="intSwitch">Internal Note</label>
                      </div>
                      <button className="btn btn-sm rounded-pill px-4 fw-bold text-white" style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', border: 'none' }} onClick={handlePostComment}>Send Message</button>
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

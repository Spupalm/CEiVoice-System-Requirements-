import express from 'express';
const router = express.Router();

export default (db) => {

// Add a teammate (follower)
router.post('/add-follower', (req, res) => {
    const { ticket_id, user_id } = req.body;
    const sql = "INSERT IGNORE INTO ticket_followers (ticket_id, user_id) VALUES (?, ?)";
    db.query(sql, [ticket_id, user_id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Teammate added" });
    });
});

// Get all teammates for a specific ticket
router.get('/followers/:ticketId', (req, res) => {
    const sql = `
        SELECT u.id, u.username, u.full_name 
        FROM ticket_followers tf
        JOIN users u ON tf.user_id = u.id
        WHERE tf.ticket_id = ?`;
    db.query(sql, [req.params.ticketId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

router.post('/post-comment', (req, res) => {
    const { ticket_id, user_id, comment_text, is_internal } = req.body;

    // Convert the checkbox (true/false) into your DB's expected strings
    const type = is_internal ? 'internal' : 'public';

    const sql = "INSERT INTO comments (ticket_id, user_id, comment_text, comment_type) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [ticket_id, user_id, comment_text, type], (err, result) => {
        if (err) {
            console.error("SQL Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Success", id: result.insertId });
    });
});


// EP05-ST001: Get all comments for a ticket
router.get('/comments/:ticketId', (req, res) => {
    const { ticketId } = req.params;
    // We join with users to get the name of the person who commented
    const sql = `
        SELECT c.id, c.comment_text, c.comment_type, c.created_at, u.username, u.full_name        
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.ticket_id = ?
        ORDER BY c.created_at ASC
    `;
    db.query(sql, [ticketId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

    // Add this inside assigneeRoutes.js
router.get('/list-all', (req, res) => {
    // We fetch only assignees and admins to fulfill EP04-ST004
    const sql = "SELECT id, username, full_name FROM users WHERE role = 'assignee'";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
    // 1. Get My Tasks (EP04-ST001)
    // Fetches tickets where user is Assignee or a Follower
    router.get('/my-tasks/:userId', (req, res) => {
        const userId = req.params.userId;
        const sql = `
            SELECT t.*, u.full_name AS assignee_name 
            FROM tickets t
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE t.assignee_id = ?
            UNION
            SELECT t.*, u.full_name AS assignee_name 
            FROM tickets t
            JOIN ticket_followers tf ON t.id = tf.ticket_id
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE tf.user_id = ?`;
            
        db.query(sql, [userId, userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // 2. Update Ticket Status & History (EP04-ST002, ST003, ST005)
    router.put('/update-ticket/:id', (req, res) => {
        const { id } = req.params;
        const { status, assignee_id, resolution_comment, performed_by, old_status, old_assignee_id } = req.body;

        // Update the main ticket record
        const updateSql = `
            UPDATE tickets 
            SET status = ?, assignee_id = ?, resolution_comment = ? 
            WHERE id = ?`;

        db.query(updateSql, [status, assignee_id, resolution_comment, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // LOG STATUS CHANGE (EP04-ST003)
            if (old_status && old_status !== status) {
                const statusHistorySql = `
                    INSERT INTO ticket_history (ticket_id, action_type, old_value, new_value, performed_by) 
                    VALUES (?, 'STATUS_CHANGE', ?, ?, ?)`;
                db.query(statusHistorySql, [id, old_status, status, performed_by]);
            }

// LOG REASSIGNMENT (EP04-ST005)
if (old_assignee_id && parseInt(old_assignee_id) !== parseInt(assignee_id)) {
    const reassignHistorySql = `
        INSERT INTO ticket_history (ticket_id, action_type, old_value, new_value, performed_by) 
        VALUES (?, 'REASSIGN', ?, ?, ?)`;
    // FIX: Remove `User ` prefix
    db.query(reassignHistorySql, [id, old_assignee_id, assignee_id, performed_by]);
}
            res.json({ success: true });
        });
    });

router.get('/history/:ticketId', (req, res) => {
    const { ticketId } = req.params;
    const sql = `
        SELECT 
            h.*, 
            u.full_name AS performer_name,
            u.username AS performer_username
        FROM ticket_history h
        LEFT JOIN users u ON h.performed_by = u.id
        WHERE h.ticket_id = ?
        ORDER BY h.created_at DESC
    `;
    db.query(sql, [ticketId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

    // 4. Post a Comment (EP05-ST002)
    router.post('/comment', (req, res) => {
        const { ticket_id, user_id, comment_text, comment_type } = req.body;
        const sql = `INSERT INTO comments (ticket_id, user_id, comment_text, comment_type) VALUES (?, ?, ?, ?)`;
        db.query(sql, [ticket_id, user_id, comment_text, comment_type], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });

    return router;
};
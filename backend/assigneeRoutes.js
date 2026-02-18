import express from 'express';
const router = express.Router();

export default (db) => {
    // Get tasks assigned to user or where they are a follower
    router.get('/my-tasks/:userId', (req, res) => {
        const userId = req.params.userId;
        const sql = `
            SELECT t.*, u.username AS assignee_name 
            FROM tickets t
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE t.assignee_id = ?
            UNION
            SELECT t.*, u.username AS assignee_name 
            FROM tickets t
            JOIN ticket_followers tf ON t.id = tf.ticket_id
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE tf.user_id = ?`;
        db.query(sql, [userId, userId], (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    });

    // Get ticket history
    router.get('/history/:ticketId', (req, res) => {
        const sql = `
            SELECT h.*, u.username as assignee_name 
            FROM ticket_history h
            LEFT JOIN users u ON h.performed_by = u.id
            WHERE h.ticket_id = ?
            ORDER BY h.created_at DESC`;
        db.query(sql, [req.params.ticketId], (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    });

    // 1. Post a new comment (EP05-ST002)
    router.post('/comment', (req, res) => {
        const { ticket_id, user_id, comment_text, comment_type } = req.body;
        const sql = `INSERT INTO comments (ticket_id, user_id, comment_text, comment_type) VALUES (?, ?, ?, ?)`;
        db.query(sql, [ticket_id, user_id, comment_text, comment_type], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
    });

    // 2. Reassign ticket & update status (EP04-ST002, ST004)
    router.put('/update-ticket/:id', (req, res) => {
        const { id } = req.params;
        const { status, assignee_id, resolution_comment, performed_by } = req.body;
        
        // Update ticket main info
        const sql = `UPDATE tickets SET status = ?, assignee_id = ?, resolution_comment = ? WHERE id = ?`;
        db.query(sql, [status, assignee_id, resolution_comment, id], (err) => {
            if (err) return res.status(500).json(err);
            
            // Log to history automatically (EP04-ST003)
            const historySql = `INSERT INTO ticket_history (ticket_id, action_type, new_value, performed_by) VALUES (?, 'UPDATE', ?, ?)`;
            db.query(historySql, [id, status, performed_by], () => {
                res.json({ success: true });
            });
        });
    });

    return router;
};
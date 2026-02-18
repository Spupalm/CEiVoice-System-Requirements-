const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // 1. GET TASKS: Get tickets where user is Assignee OR Follower
    router.get('/my-tasks/:userId', (req, res) => {
        const userId = parseInt(req.params.userId);
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
            WHERE tf.user_id = ?
            ORDER BY deadline ASC`;
        
        db.query(sql, [userId, userId], (err, results) => {
            if (err) return res.status(500).send({ message: err.sqlMessage });
            res.json(results);
        });
    });

    // 2. UPDATE STATUS: Update ticket and log to ticket_history
    router.put('/update-status/:id', (req, res) => {
        const { id } = req.params;
        const { status, performed_by, resolution_comment } = req.body; 

        db.query('SELECT status FROM tickets WHERE id = ?', [id], (err, current) => {
            if (err || current.length === 0) return res.status(404).send({ message: 'Ticket not found' });
            const oldStatus = current[0].status;

            const sqlUpdate = 'UPDATE tickets SET status = ?, resolution_comment = ? WHERE id = ?';
            db.query(sqlUpdate, [status, resolution_comment || null, id], (err) => {
                if (err) return res.status(500).send({ message: err.sqlMessage });

                const historySql = `
                    INSERT INTO ticket_history (ticket_id, action_type, action_comment, old_value, new_value, performed_by) 
                    VALUES (?, "STATUS_CHANGE", ?, ?, ?, ?)`;
                
                db.query(historySql, [id, resolution_comment || 'Updated status', oldStatus, status, performed_by], (histErr) => {
                    if (histErr) console.error("HISTORY LOG ERROR:", histErr.sqlMessage);
                    res.send({ success: true, message: 'Status updated and history logged' });
                });
            });
        });
    });

    // 3. REASSIGN: Change assignee and log the move
    router.put('/reassign/:id', (req, res) => {
        const { id } = req.params;
        const { new_assignee_id, performed_by } = req.body;

        const findOldSql = `
            SELECT t.assignee_id, u.username 
            FROM tickets t 
            LEFT JOIN users u ON t.assignee_id = u.id 
            WHERE t.id = ?`;

        db.query(findOldSql, [id], (err, results) => {
            if (err || results.length === 0) return res.status(404).send("Ticket not found");
            const oldAssigneeName = results[0].username || "Unassigned";

            db.query('UPDATE tickets SET assignee_id = ? WHERE id = ?', [new_assignee_id, id], (err) => {
                if (err) return res.status(500).send(err);

                const historySql = `
                    INSERT INTO ticket_history (ticket_id, action_type, action_comment, old_value, new_value, performed_by) 
                    VALUES (?, "REASSIGN", ?, ?, (SELECT username FROM users WHERE id = ?), ?)`;
                
                db.query(historySql, [id, `Moved from ${oldAssigneeName}`, oldAssigneeName, new_assignee_id, performed_by], (histErr) => {
                    if (histErr) return res.status(500).send(histErr);
                    res.send({ success: true });
                });
            });
        });
    });

    // 4. FOLLOWERS: Add a teammate to a ticket
    router.post('/followers', (req, res) => {
        const { ticket_id, user_id } = req.body;
        const sql = 'INSERT IGNORE INTO ticket_followers (ticket_id, user_id) VALUES (?, ?)';
        db.query(sql, [ticket_id, user_id], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
    });

    // 5. HISTORY: Fetch the timeline for a ticket
    router.get('/history/:ticketId', (req, res) => {
        const { ticketId } = req.params;
        const sql = `
            SELECT h.*, IFNULL(u.username, 'System/Unknown') as assignee_name 
            FROM ticket_history h
            LEFT JOIN users u ON h.performed_by = u.id
            WHERE h.ticket_id = ?
            ORDER BY h.created_at DESC`;

        db.query(sql, [ticketId], (err, results) => {
            if (err) return res.status(500).send(err);
            res.json(results);
        });
    });

    return router;
};
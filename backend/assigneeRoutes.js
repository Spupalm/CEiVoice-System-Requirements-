import express from 'express';
import { sendNotificationEmail } from './services/emailService.js';
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

// 🟢 ตรวจสอบถ้าสถานะคือ Solved ให้ส่งอีเมล
        if (status === 'Solved') {
            // คำสั่ง SQL ปรับปรุงใหม่: ดึงข้อความปัญหาเดิม (original_message) และชื่อหัวข้อ (ticket_title) มาด้วย
            const getEmailSql = `
                SELECT 
                    COALESCE(ur.user_email, ur2.user_email) AS user_email,
                    COALESCE(ur.message, ur2.message) AS original_message,
                    t.title AS ticket_title,
                    u.full_name AS assignee_name
                FROM tickets t
                LEFT JOIN users u ON t.assignee_id = u.id
                LEFT JOIN user_requests ur ON ur.user_id = t.follower_id
                LEFT JOIN draft_tickets dt ON t.title = dt.title
                LEFT JOIN draft_request_mapping drm ON dt.id = drm.draft_id
                LEFT JOIN user_requests ur2 ON drm.request_id = ur2.id
                WHERE t.id = ?
                ORDER BY ur.created_at DESC
                LIMIT 1
            `;
            
            db.query(getEmailSql, [id], (emailErr, rows) => { 
                if (!emailErr && rows.length > 0 && rows[0].user_email) {
                    // ดึงตัวแปรที่ได้จาก SQL ออกมาใช้
                    const { user_email, assignee_name, original_message, ticket_title } = rows[0];
                    console.log(`✅ Found Email: ${user_email}. Preparing to send HTML email...`);
                    
                    const solvedHtmlTemplate = `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <div style="background-color: #198754; color: white; padding: 20px; text-align: center;">
                            <h2 style="margin: 0; font-size: 24px;">CEiVoice Support</h2>
                        </div>
                        <div style="padding: 30px; background-color: #ffffff;">
                            <p style="font-size: 16px; color: #333;">Hello,</p>
                            <p style="font-size: 16px; color: #333;">Good news! Your support request has been successfully resolved.</p>
                            
                            <div style="background-color: #f8f9fa; border-left: 5px solid #6c757d; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                                <p style="margin-bottom: 5px; color: #555; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;"><strong>Issue Details:</strong></p>
                                <p style="margin-top: 0; margin-bottom: 8px; color: #333; font-size: 16px; font-weight: bold;">[${ticket_title || 'Ticket'}]</p>
                                <p style="margin-top: 0; color: #555; font-size: 15px; font-style: italic;">"${original_message || 'No description provided.'}"</p>
                            </div>
                            
                            <div style="background-color: #e8f5e9; border-left: 5px solid #198754; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                                <h3 style="margin-top: 0; color: #333; font-size: 18px;">Status: <span style="color: #198754;">✅ Solved</span></h3>
                                <p style="color: #555; font-size: 15px;"><strong>Solved by:</strong> ${assignee_name || 'CEiVoice Assignee'}</p>
                                <hr style="border: 0; border-top: 1px solid #c8e6c9; margin: 15px 0;">
                                <p style="margin-bottom: 5px; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;"><strong>Resolution Details:</strong></p>
                                <p style="margin-top: 0; color: #333; font-size: 16px; white-space: pre-wrap;">${resolution_comment || 'No further details provided.'}</p>
                            </div>
                            
                            <p style="font-size: 15px; color: #666; margin-top: 30px;">Thank you for using CEiVoice Support!<br/><strong style="color: #198754;">The CEiVoice Team</strong></p>
                        </div>
                    </div>
                    `;

                    sendNotificationEmail(
                        user_email,
                        "CEiVoice: Request Solved",
                        solvedHtmlTemplate
                    );
                } else {
                    console.log(`❌ Error: Could not find User Email for Ticket ID: ${id}`);
                }
            });
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
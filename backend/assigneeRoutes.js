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
    const type = is_internal ? 'internal' : 'public';

    const sql = "INSERT INTO comments (ticket_id, user_id, comment_text, comment_type) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [ticket_id, user_id, comment_text, type], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // 🟢 ส่งอีเมลแจ้งเตือน หากเป็นคอมเมนต์สาธารณะ
        if (type === 'public') {
            const getTicketInfoSql = `
                SELECT 
                    t.ticket_no, t.title, t.follower_id,
                    COALESCE(ur.user_email, ur2.user_email) AS user_email,
                    u_commenter.full_name AS commenter_name
                FROM tickets t
                LEFT JOIN users u_commenter ON u_commenter.id = ?
                LEFT JOIN user_requests ur ON ur.user_id = t.follower_id
                LEFT JOIN draft_tickets dt ON t.title = dt.title
                LEFT JOIN draft_request_mapping drm ON dt.id = drm.draft_id
                LEFT JOIN user_requests ur2 ON drm.request_id = ur2.id
                WHERE t.id = ?
                LIMIT 1
            `;
            db.query(getTicketInfoSql, [user_id, ticket_id], (err2, rows) => {
                if (!err2 && rows.length > 0) {
                    const { user_email, commenter_name, follower_id, ticket_no, title } = rows[0];
                    
                    // ป้องกันไม่ให้ส่งเมลแจ้งเตือนถ้า User เจ้าของตั๋วเป็นคนพิมพ์ตอบเอง
                    if (user_email && String(follower_id) !== String(user_id)) {
                        const commentHtml = `
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                            <div style="background-color: #0dcaf0; color: #000; padding: 20px; text-align: center;">
                                <h2 style="margin: 0; font-size: 24px;">New Message Received</h2>
                            </div>
                            <div style="padding: 30px; background-color: #ffffff;">
                                <p style="font-size: 16px; color: #333;">Hello,</p>
                                <p style="font-size: 16px; color: #333;">You have a new reply 💬 on your request:</p>
                                
                                <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 5px solid #0dcaf0;">
                                    <p style="margin: 0; font-size: 13px; color: #555; font-weight: bold; text-transform: uppercase;">ID: ${ticket_no}</p>
                                    <p style="margin: 8px 0 0 0; font-size: 18px; color: #212529; font-weight: bold;">${title}</p>
                                </div>
                                
                                <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 25px 0; border-radius: 6px;">
                                    <p style="margin-bottom: 5px; color: #555; font-size: 14px;"><strong>From:</strong> ${commenter_name}</p>
                                    <hr style="border: 0; border-top: 1px solid #dee2e6; margin: 15px 0;">
                                    <p style="margin-top: 0; color: #333; font-size: 16px; white-space: pre-wrap;">${comment_text}</p>
                                </div>
                                
                                <p style="font-size: 15px; color: #666;">Thank you,<br/><strong style="color: #0dcaf0;">The CEiVoice Team</strong></p>
                            </div>
                        </div>`;
                        
                        sendNotificationEmail(user_email, `CEiVoice: New update on Ticket ${ticket_no}`, commentHtml);
                    }
                }
            });
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
    // 2. Update Ticket Status & History (EP04-ST002, ST003, ST005)
    router.put('/update-ticket/:id', (req, res) => {
        const { id } = req.params;
        
        // 🟢 เปลี่ยนจาก const เป็น let เพื่อให้เราจัดระเบียบข้อมูลก่อนลง Database ได้
        let { status, assignee_id, resolution_comment, performed_by, old_status, old_assignee_id } = req.body;

        // 🛠️ FIX: ป้องกัน Error จาก Frontend ที่ส่งค่าเป็นช่องว่าง "" ซึ่งจะทำให้ SQL พัง
        assignee_id = assignee_id ? parseInt(assignee_id) : null;
        performed_by = performed_by ? parseInt(performed_by) : null;
        old_assignee_id = old_assignee_id ? parseInt(old_assignee_id) : null;

        const updateSql = `
            UPDATE tickets 
            SET status = ?, assignee_id = ?, resolution_comment = ? 
            WHERE id = ?`;

        db.query(updateSql, [status, assignee_id, resolution_comment, id], (err) => {
            if (err) {
                // เพิ่มตัวดักจับ Error สีแดงใน Terminal เพื่อให้รู้ว่า Database พังเพราะอะไร
                console.error("❌ SQL Update Error:", err.message);
                return res.status(500).json({ error: err.message });
            }

            // LOG STATUS CHANGE
            if (old_status && old_status !== status) {
                const statusHistorySql = `
                    INSERT INTO ticket_history (ticket_id, action_type, old_value, new_value, performed_by) 
                    VALUES (?, 'STATUS_CHANGE', ?, ?, ?)`;
                db.query(statusHistorySql, [id, old_status, status, performed_by]);
            }

            // LOG REASSIGNMENT
            if (old_assignee_id && old_assignee_id !== assignee_id) {
                const reassignHistorySql = `
                    INSERT INTO ticket_history (ticket_id, action_type, old_value, new_value, performed_by) 
                    VALUES (?, 'REASSIGN', ?, ?, ?)`;
                db.query(reassignHistorySql, [id, old_assignee_id, assignee_id, performed_by]);
            }

            // 🟢 เงื่อนไขที่ 2: แจ้งเตือนเมื่อสถานะเปลี่ยนเป็น Solved หรือ Failed
            if (status === 'Solved' || status === 'Failed') {
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
                        const { user_email, assignee_name, original_message, ticket_title } = rows[0];
                        
                        const isSolved = status === 'Solved';
                        const color = isSolved ? '#198754' : '#dc3545';
                        const bgColor = isSolved ? '#e8f5e9' : '#f8d7da';
                        const headerEmoji = isSolved ? '✅' : '❌';
                        const headerMsg = isSolved ? 'has been successfully resolved.' : 'has been marked as failed/unresolved.';

                        const solvedHtmlTemplate = `
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                            <div style="background-color: ${color}; color: white; padding: 20px; text-align: center;">
                                <h2 style="margin: 0; font-size: 24px;">CEiVoice Support</h2>
                            </div>
                            <div style="padding: 30px; background-color: #ffffff;">
                                <p style="font-size: 16px; color: #333;">Hello,</p>
                                <p style="font-size: 16px; color: #333;">Your support request ${headerMsg}</p>
                                
                                <div style="background-color: #f8f9fa; border-left: 5px solid #6c757d; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                                    <p style="margin-bottom: 5px; color: #555; font-size: 13px; text-transform: uppercase;"><strong>Issue Details:</strong></p>
                                    <p style="margin-top: 0; margin-bottom: 8px; color: #333; font-size: 16px; font-weight: bold;">[${ticket_title || 'Ticket'}]</p>
                                    <p style="margin-top: 0; color: #555; font-size: 15px; font-style: italic;">"${original_message || 'No description provided.'}"</p>
                                </div>
                                
                                <div style="background-color: ${bgColor}; border-left: 5px solid ${color}; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                                    <h3 style="margin-top: 0; color: #333; font-size: 18px;">Status: <span style="color: ${color};">${status} ${headerEmoji}</span></h3>
                                    <p style="color: #555; font-size: 15px;"><strong>Handled by:</strong> ${assignee_name || 'CEiVoice Assignee'}</p>
                                    <hr style="border: 0; border-top: 1px solid ${color}; opacity: 0.3; margin: 15px 0;">
                                    <p style="margin-bottom: 5px; color: #555; font-size: 14px; text-transform: uppercase;"><strong>Resolution Note:</strong></p>
                                    <p style="margin-top: 0; color: #333; font-size: 16px; white-space: pre-wrap;">${resolution_comment || 'No further details provided.'}</p>
                                </div>
                                
                                <p style="font-size: 15px; color: #666; margin-top: 30px;">Thank you for using CEiVoice Support!</p>
                            </div>
                        </div>`;
                        
                        sendNotificationEmail(user_email, `CEiVoice: Request ${status}`, solvedHtmlTemplate);
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
import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcrypt';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { generateSupportTicket } from "./services/aiService.js";
import assigneeRoutes from './assigneeRoutes.js';
import { sendNotificationEmail } from './services/emailService.js';

const app = express();
const port = 5001;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use('/uploads', express.static('uploads'));
app.use(cors());
app.use(express.json());

// ─── MySQL Connection ──────────────────────────────────────────────────────────
const db = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    port: process.env.port
});

db.connect(err => {
    if (err) { console.error('Error connecting to MySQL:', err); return; }
    console.log('Connected to MySQL Database.');
});

// ─── Assignee Routes Middleware ────────────────────────────────────────────────
app.use('/api/assignee', assigneeRoutes(db));

// ─── Multer Storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });
const uploadProfile = upload;

// ─── Admin Auth Middleware ─────────────────────────────────────────────────────
// Expects the client to send: { "user_id": <id> } in request body,
// OR pass ?user_id=<id> as a query param for GET requests.
// The middleware looks up the user in DB and confirms role === 'admin'.
const requireAdmin = (req, res, next) => {
    const userId = req.body?.user_id || req.query?.user_id;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: user_id is required' });
    }

    db.query('SELECT role FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        if (!results || results.length === 0) {
            return res.status(401).json({ message: 'Unauthorized: user not found' });
        }
        if (results[0].role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: admin access only' });
        }
        next();
    });
};

// ─── Authentication ────────────────────────────────────────────────────────────

app.post('/api/login', async (req, res) => {
    const { username, password, captchaToken } = req.body;
    if (!username || !password || !captchaToken) {
        return res.status(400).json({ message: 'Missing credentials or captcha' });
    }
    try {
        const captchaResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify', null,
            { params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: captchaToken } }
        );
        if (!captchaResponse.data.success) {
            return res.status(400).json({ message: 'CAPTCHA verification failed' });
        }
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) return res.status(500).json({ message: 'Internal server error' });
            if (!results || results.length === 0) return res.status(401).json({ message: 'Invalid username or password' });

            const user = results[0];
            if (user.is_approved === 0) return res.status(403).json("Your account is pending approval from Admin.");

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ message: 'Invalid username or password' });

            res.json({
                success: true,
                user: { id: user.id, username: user.username, fullName: user.full_name, profileImage: user.profile_image, role: user.role, email: user.email }
            });
        });
    } catch (err) {
        console.error("Login route error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/google-login', async (req, res) => {
    const { token, profileImage } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });
    try {
        const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
        const { email, name } = ticket.getPayload();

        db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (results && results.length > 0) {
                const user = results[0];
                db.query('UPDATE users SET profile_image = ? WHERE id = ?', [profileImage || user.profile_image, user.id], (updateErr) => {
                    if (updateErr) console.error('Error updating profile image:', updateErr);
                    return res.json({ success: true, user: { id: user.id, username: user.username, fullName: user.full_name, email: user.email, profileImage: profileImage || user.profile_image, role: user.role } });
                });
            } else {
                db.query(
                    'INSERT INTO users (full_name, username, email, password, profile_image, role, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [name, name, email, 'OAUTH_USER_NO_PASSWORD', profileImage, 'user', 1],
                    (err, result) => {
                        if (err) return res.status(500).json({ message: 'Error creating user' });
                        res.json({ success: true, user: { id: result.insertId, username: email, fullName: name, email, profileImage, role: 'user' } });
                    }
                );
            }
        });
    } catch (error) {
        console.error('Google Verify Error:', error);
        res.status(401).json({ message: 'Invalid Google token' });
    }
});

app.post('/api/register', uploadProfile.single('profileImage'), async (req, res) => {
    const { fullName, username, password, role, email } = req.body;
    const profileImage = req.file ? req.file.filename : null;
    if (!fullName || !username || !password) return res.status(400).json({ message: 'Missing required fields' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const isApproved = role === 'user' ? 1 : 0;
        db.query(
            'INSERT INTO users (full_name, username, password, profile_image, role, email, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fullName, username, hashedPassword, profileImage, role || 'user', email, isApproved],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Username already exists' });
                    return res.status(500).json({ message: 'Error creating user' });
                }
                res.json({ success: true, userId: result.insertId });
            }
        );
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ─── Categories ────────────────────────────────────────────────────────────────

app.get('/api/categories', (req, res) => {
    db.query("SELECT id, name FROM categories", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results || []);
    });
});

// ─── User Requests ─────────────────────────────────────────────────────────────

app.get('/api/admin/user-requests', requireAdmin, (req, res) => {
    db.query('SELECT * FROM user_requests ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results || []);
    });
});

app.post('/api/user-requests', async (req, res) => {
    const { user_email, message, user_id } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    try {
        db.query(
            'INSERT INTO user_requests (user_email, message, user_id, status) VALUES (?, ?, ?, ?)',
            [user_email, message, user_id, 'received'],
            async (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                const requestId = result.insertId;

                try {
                    const aiResult = await generateSupportTicket(message);

                    db.query(
                        `INSERT INTO draft_tickets (title, category, summary, original_message, resolution_path, status)
                         VALUES (?, ?, ?, ?, ?, 'Draft')`,
                        [aiResult.title, aiResult.category || 'IT Support', aiResult.summary, message, JSON.stringify(aiResult.resolution_path || [])],
                        (draftErr, draftResult) => {
                            if (draftErr) return res.status(500).json({ error: draftErr.message });
                            const draftId = draftResult.insertId;

                            db.query('INSERT INTO draft_request_mapping (draft_id, request_id) VALUES (?, ?)', [draftId, requestId]);
                            db.query('UPDATE user_requests SET draft_ticket_id = ?, status = ? WHERE id = ?', [draftId, 'draft', requestId]);

                            res.json({ success: true, requestId, draftId });
                        }
                    );
                } catch (aiErr) {
                    console.error('AI generation error:', aiErr);
                    res.json({ success: true, requestId, draftId: null });
                }
            }
        );
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Draft Tickets ─────────────────────────────────────────────────────────────

app.get('/api/admin/draft-tickets', requireAdmin, (req, res) => {
    db.query(
        `SELECT dt.*,
         IFNULL(
           JSON_ARRAYAGG(
             CASE WHEN ur.id IS NOT NULL
             THEN JSON_OBJECT('id', ur.id, 'message', ur.message, 'user_email', ur.user_email)
             ELSE NULL END
           ), JSON_ARRAY()
         ) as linked_requests
         FROM draft_tickets dt
         LEFT JOIN draft_request_mapping drm ON drm.draft_id = dt.id
         LEFT JOIN user_requests ur ON ur.id = drm.request_id
         GROUP BY dt.id
         ORDER BY dt.created_at DESC`,
        (err, results) => {
            if (err) {
                console.error('❌ draft-tickets error:', err.sqlMessage || err.message);
                return res.status(500).json({ error: err.sqlMessage || err.message });
            }
            const parsed = (results || []).map(r => ({
                ...r,
                linked_requests: (() => {
                    try {
                        const arr = typeof r.linked_requests === 'string' ? JSON.parse(r.linked_requests) : r.linked_requests;
                        return (arr || []).filter(Boolean);
                    } catch { return []; }
                })(),
                resolution_path: (() => {
                    try {
                        return typeof r.resolution_path === 'string' ? JSON.parse(r.resolution_path) : r.resolution_path || [];
                    } catch { return []; }
                })()
            }));
            res.json(parsed);
        }
    );
});

app.put('/api/admin/draft-tickets/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { title, summary, resolution_path, assigned_to, deadline, category } = req.body;
    db.query(
        `UPDATE draft_tickets SET title = ?, summary = ?, resolution_path = ?,
         assigned_to = ?, deadline = ?, category = ? WHERE id = ?`,
        [title, summary, JSON.stringify(resolution_path || []), assigned_to || null, deadline || null, category || null, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// ─── Approve Draft → Official Ticket ──────────────────────────────────────────

app.post('/api/admin/approve-ticket', requireAdmin, (req, res) => {
    const { draft_id, title, category, summary, resolution_path, assignee_id, userRequestId, deadline } = req.body;
    if (!assignee_id) return res.status(400).json({ message: 'Assignee is required' });

    const ticketNo = 'TK-' + Date.now();

    db.query(
        `INSERT INTO tickets (ticket_no, title, category, summary, resolution_path, assignee_id, status, deadline)
         VALUES (?, ?, ?, ?, ?, ?, 'New', ?)`,
        [ticketNo, title, category, summary, JSON.stringify(resolution_path || []), assignee_id, deadline || null],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            const ticketId = result.insertId;

            db.query("UPDATE draft_tickets SET status = 'Submitted' WHERE id = ?", [draft_id]);

            db.query(
                'SELECT request_id FROM draft_request_mapping WHERE draft_id = ?', [draft_id],
                (mapErr, mappings) => {
                    if (!mapErr && mappings.length > 0) {
                        mappings.forEach(m => {
                            db.query('SELECT user_id FROM user_requests WHERE id = ?', [m.request_id], (uErr, uRes) => {
                                if (!uErr && uRes.length > 0) {
                                    db.query(
                                        'INSERT IGNORE INTO tickets_user_mapping (ticket_id, user_id, request_id) VALUES (?, ?, ?)',
                                        [ticketId, uRes[0].user_id, m.request_id]
                                    );
                                }
                                db.query("UPDATE user_requests SET status = 'ticket' WHERE id = ?", [m.request_id]);
                            });
                        });
                    }
                }
            );

            db.query(
                "INSERT INTO ticket_history (ticket_id, action_type, new_value, performed_by) VALUES (?, 'SUBMIT_DRAFT', 'New', ?)",
                [ticketId, req.body.admin_id || null]
            );

            db.query('SELECT email, username FROM users WHERE id = ?', [assignee_id], (uErr, users) => {
                if (!uErr && users.length > 0 && users[0].email) {
                    sendNotificationEmail(users[0].email, users[0].username, title, ticketId)
                        .catch(e => console.error('Email error:', e));
                }
            });

            res.json({ success: true, ticketId });
        }
    );
});

// ─── Merge Draft Tickets ───────────────────────────────────────────────────────

app.post('/api/admin/merge-tickets', requireAdmin, (req, res) => {
    const { ticketIds } = req.body;
    if (!ticketIds || ticketIds.length < 2) return res.status(400).json({ message: 'At least 2 tickets required' });

    const placeholders = ticketIds.map(() => '?').join(',');
    db.query(`SELECT * FROM draft_tickets WHERE id IN (${placeholders})`, ticketIds, (err, tickets) => {
        if (err) return res.status(500).json({ error: err.message });

        const combinedTitle = tickets[0].title + ' (Merged)';
        const combinedSummary = tickets.map(t => t.summary).filter(Boolean).join('\n\n');

        db.query(
            "INSERT INTO draft_tickets (title, summary, category, status) VALUES (?, ?, ?, 'Draft')",
            [combinedTitle, combinedSummary, tickets[0].category],
            (insertErr, insertResult) => {
                if (insertErr) return res.status(500).json({ error: insertErr.message });
                const newDraftId = insertResult.insertId;

                db.query(
                    `UPDATE draft_request_mapping SET draft_id = ? WHERE draft_id IN (${placeholders})`,
                    [newDraftId, ...ticketIds]
                );
                db.query(
                    `UPDATE user_requests SET draft_ticket_id = ? WHERE draft_ticket_id IN (${placeholders})`,
                    [newDraftId, ...ticketIds]
                );
                db.query(`UPDATE draft_tickets SET status = 'Merged' WHERE id IN (${placeholders})`, ticketIds);

                res.json({ success: true, newDraftId });
            }
        );
    });
});

// ─── Unlink Request from Draft ─────────────────────────────────────────────────

app.post('/api/admin/unlink-request', requireAdmin, async (req, res) => {
    const { requestId, currentDraftId } = req.body;

    db.query('SELECT * FROM user_requests WHERE id = ?', [requestId], async (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'Request not found' });
        const request = results[0];

        let newTitle = `Request #${requestId}`;
        let newSummary = request.message;

        try {
            const aiResult = await generateSupportTicket(request.message);
            newTitle = aiResult.title;
            newSummary = aiResult.summary;
        } catch (aiErr) { console.error('AI error during unlink:', aiErr); }

        db.query(
            "INSERT INTO draft_tickets (title, summary, category, status) VALUES (?, ?, 'IT Support', 'Draft')",
            [newTitle, newSummary],
            (insertErr, insertResult) => {
                if (insertErr) return res.status(500).json({ error: insertErr.message });
                const newDraftId = insertResult.insertId;

                db.query(
                    'UPDATE draft_request_mapping SET draft_id = ? WHERE draft_id = ? AND request_id = ?',
                    [newDraftId, currentDraftId, requestId]
                );
                db.query('UPDATE user_requests SET draft_ticket_id = ? WHERE id = ?', [newDraftId, requestId]);

                res.json({ success: true, newDraftId });
            }
        );
    });
});

// ─── Official Tickets ──────────────────────────────────────────────────────────

app.get('/api/admin/official-tickets', requireAdmin, (req, res) => {
    db.query(
        `SELECT t.*, u.username as assignee_name
         FROM tickets t
         LEFT JOIN users u ON t.assignee_id = u.id
         ORDER BY t.created_at DESC`,
        (err, results) => {
            if (err) {
                console.error('❌ official-tickets error:', err.sqlMessage || err.message);
                return res.status(500).json({ error: err.sqlMessage || err.message });
            }
            const parsed = (results || []).map(r => ({
                ...r,
                resolution_path: (() => {
                    try { return typeof r.resolution_path === 'string' ? JSON.parse(r.resolution_path) : r.resolution_path || []; }
                    catch { return []; }
                })()
            }));
            res.json(parsed);
        }
    );
});

app.put('/api/admin/official-tickets/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status, assignee_id, performed_by } = req.body;

    db.query('SELECT status FROM tickets WHERE id = ?', [id], (selErr, selRes) => {
        const oldStatus = selRes?.[0]?.status || null;

        db.query(
            'UPDATE tickets SET status = ?, assignee_id = COALESCE(?, assignee_id) WHERE id = ?',
            [status, assignee_id || null, id],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });

                db.query(
                    "INSERT INTO ticket_history (ticket_id, action_type, old_value, new_value, performed_by) VALUES (?, 'STATUS_CHANGE', ?, ?, ?)",
                    [id, oldStatus, status, performed_by || null]
                );

                res.json({ success: true });
            }
        );
    });
});

// ─── Users Management ──────────────────────────────────────────────────────────

app.get('/api/admin/users', requireAdmin, (req, res) => {
    db.query(
        `SELECT u.id, u.username, u.full_name, u.email, u.role, u.profile_image, u.is_approved,
         GROUP_CONCAT(DISTINCT us.category_id) as skill_ids,
         GROUP_CONCAT(DISTINCT c.name) as skill_names
         FROM users u
         LEFT JOIN user_skills us ON u.id = us.user_id
         LEFT JOIN categories c ON us.category_id = c.id
         GROUP BY u.id
         ORDER BY u.id DESC`,
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results || []);
        }
    );
});

app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { full_name, role, skills } = req.body;

    db.query('UPDATE users SET full_name = ?, role = ? WHERE id = ?', [full_name, role, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query('DELETE FROM user_skills WHERE user_id = ?', [id], (delErr) => {
            if (delErr) return res.status(500).json({ error: delErr.message });

            if (skills && skills.length > 0) {
                const skillValues = skills.map(catId => [id, catId]);
                db.query('INSERT INTO user_skills (user_id, category_id) VALUES ?', [skillValues], (insErr) => {
                    if (insErr) return res.status(500).json({ error: insErr.message });
                    res.json({ success: true });
                });
            } else {
                res.json({ success: true });
            }
        });
    });
});

// ─── Assignees ─────────────────────────────────────────────────────────────────

app.get('/api/users/assignees', (req, res) => {
    db.query(
        "SELECT id, username, email FROM users WHERE role = 'assignee' AND is_approved = 1",
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results || []);
        }
    );
});

// ─── User Ticket Tracking ──────────────────────────────────────────────────────

app.get('/api/users/:userId/tickets', (req, res) => {
    const { userId } = req.params;
    db.query(
        `SELECT ur.id as request_id, ur.message as original_message, ur.status as request_status,
         ur.created_at, dt.title as ai_title, t.status as official_status
         FROM user_requests ur
         LEFT JOIN draft_tickets dt ON ur.draft_ticket_id = dt.id
         LEFT JOIN tickets_user_mapping tum ON tum.request_id = ur.id
         LEFT JOIN tickets t ON tum.ticket_id = t.id
         WHERE ur.user_id = ?
         ORDER BY ur.created_at DESC`,
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results || []);
        }
    );
});

// ─── Pending Approvals ─────────────────────────────────────────────────────────

app.get('/api/admin/pending-approvals', requireAdmin, (req, res) => {
    db.query(
        "SELECT id, full_name, username, email, role FROM users WHERE is_approved = 0 ORDER BY id DESC",
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results || []);
        }
    );
});

app.put('/api/admin/approve-user/:id', requireAdmin, (req, res) => {
    db.query('UPDATE users SET is_approved = 1 WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ─── Ticket History ────────────────────────────────────────────────────────────

app.get('/api/ticket-history', (req, res) => {
    const { userId, role } = req.query;

    const query = role === 'admin'
        ? `SELECT th.*, u.username as performed_by_name
           FROM ticket_history th
           LEFT JOIN users u ON th.performed_by = u.id
           ORDER BY th.created_at DESC`
        : `SELECT th.*, u.username as performed_by_name
           FROM ticket_history th
           LEFT JOIN users u ON th.performed_by = u.id
           WHERE th.performed_by = ?
           ORDER BY th.created_at DESC`;

    db.query(query, role === 'admin' ? [] : [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results || []);
    });
});

// ─── Reports ───────────────────────────────────────────────────────────────────

app.get('/api/admin/reports', requireAdmin, (req, res) => {
    Promise.all([
        new Promise((resolve, reject) =>
            db.query('SELECT COUNT(*) as total FROM tickets', (e, r) => {
                if (e) { console.error('❌ reports total:', e.sqlMessage); reject(e); }
                else resolve(r[0]?.total || 0);
            })),
        new Promise((resolve, reject) =>
            db.query(
                "SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avgTime FROM tickets WHERE status = 'Solved'",
                (e, r) => {
                    if (e) { console.error('❌ reports avgTime:', e.sqlMessage); reject(e); }
                    else resolve(r[0]?.avgTime || 0);
                })),
        new Promise((resolve, reject) =>
            db.query('SELECT status, COUNT(*) as count FROM tickets GROUP BY status', (e, r) => {
                if (e) { console.error('❌ reports byStatus:', e.sqlMessage); reject(e); }
                else resolve(r || []);
            })),
        new Promise((resolve, reject) =>
            db.query(
                "SELECT IFNULL(category, 'Uncategorized') as name, COUNT(*) as count FROM tickets GROUP BY category",
                (e, r) => {
                    if (e) { console.error('❌ reports byCategory:', e.sqlMessage); reject(e); }
                    else resolve(r || []);
                })),
    ])
        .then(([total, avgTime, byStatus, byCategory]) => {
            res.json({ total, avgTime, byStatus, byCategory });
        })
        .catch(err => res.status(500).json({ error: err.sqlMessage || err.message }));
});

// ─── Create New Admin ──────────────────────────────────────────────────────────

app.post('/api/admin/create-admin', requireAdmin, uploadProfile.single('profileImage'), async (req, res) => {
    const { fullName, username, password, email } = req.body;
    const profileImage = req.file ? req.file.filename : null;
    if (!fullName || !username || !password) return res.status(400).json({ message: 'Missing required fields' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO users (full_name, username, password, profile_image, role, email, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [fullName, username, hashedPassword, profileImage, 'admin', email, 1],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Username already exists' });
                    return res.status(500).json({ message: 'Error creating admin' });
                }
                res.json({ success: true, userId: result.insertId });
            }
        );
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// ─── Start Server ──────────────────────────────────────────────────────────────

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
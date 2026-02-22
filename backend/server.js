import 'dotenv/config'; // แทนที่ require("dotenv").config()
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

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    port: process.env.port
});

// Then, and only then, you can use 'db'
app.use('/api/assignee', assigneeRoutes(db));


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });
const uploadFile = upload;
const uploadProfile = upload;

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Database.');
});

// ------------------------------------
// API: Authentication
// ------------------------------------
app.post('/api/login', async (req, res) => {
    const { username, password, captchaToken } = req.body;
    if (!username || !password || !captchaToken) {
        console.log(captchaToken);
        return res.status(400).json({ message: 'Missing credentials or captcha' });
    }

    try {
        // ✅ VERIFY CAPTCHA
        const captchaResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: captchaToken
                }
            }
        );

        if (!captchaResponse.data.success) {
            return res.status(400).json({ message: 'CAPTCHA verification failed' });
        }

        // ✅ EXISTING LOGIN LOGIC
        db.query(
            'SELECT * FROM users WHERE username = ?',
            [username],
            async (err, results) => {
                if (results.length === 0) {
                    return res.status(401).json({ message: 'Invalid username or password' });
                }

                const user = results[0];
                if (user.is_approved === 0) {
                    return res.status(403).json("Your account is pending approval from Admin.");
                }
                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) {
                    return res.status(401).json({ message: 'Invalid username or password' });
                }

                res.json({
                    success: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        fullName: user.full_name,
                        profileImage: user.profile_image,
                        role: user.role

                    }
                });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/google-login', async (req, res) => {
    const { token, profileImage } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    try {
        // 1. Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        // 2. Check if user exists in your MySQL DB
        // Using email or a specific 'google_id' column is recommended
        
        db.query(
            'SELECT * FROM users WHERE username = ? OR username = ?',
            [email, googleId],
            (err, results) => {
                if (err) return res.status(500).json({ message: 'Database error' });

                if (results.length > 0) {
                    const user = results[0];
                    db.query(
                        'UPDATE users SET profile_image = ? WHERE id = ?',
                        [profileImage, user.id],
                        (updateErr) => {
                            if (updateErr) console.error('Error updating profile image:', updateErr);

                            return res.json({
                                success: true,
                                user: {
                                    id: user.id,
                                    username: user.username,
                                    fullName: user.full_name,
                                    profileImage: profileImage, // ส่ง URL รูปกลับไปให้ Frontend
                                    role: user.role// 🟢 เพิ่มบรรทัดนี้! บัญชี Google สร้างใหม่จะได้ Role เป็น user เสมอ
                                }
                            });
                        }
                    );
                } else {
                    // User doesn't exist, create a new record
                    // Note: password can be null or a random string for OAuth users
                    db.query(
                        'INSERT INTO users (full_name, username, password, profile_image) VALUES (?, ?, ?, ?)',
                        [name, email, 'OAUTH_USER_NO_PASSWORD', profileImage],
                        (err, result) => {
                            if (err) return res.status(500).json({ message: 'Error creating user' });

                            res.json({
                                success: true,
                                user: {
                                    id: result.insertId,
                                    username: email,
                                    fullName: name,
                                    profileImage: profileImage // ส่ง URL รูปกลับไปให้ Frontend
                                }
                            });
                        }
                    );
                }
            }
        );
    } catch (error) {
        console.error('Google Verify Error:', error);
        res.status(401).json({ message: 'Invalid Google token' });
    }
});


app.post('/api/register', uploadProfile.single('profileImage'), async (req, res) => {
    const { fullName, username, password, captchaToken, role, skills } = req.body;

    if (!fullName || !username || !password || !captchaToken || !role) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // --- 1. ตรวจสอบ reCAPTCHA (เหมือนเดิม) ---
        const captchaResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            { params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: captchaToken } }
        );

        if (!captchaResponse.data.success) {
            return res.status(400).json({ message: 'CAPTCHA verification failed' });
        }

        // --- 2. ตรวจสอบ Username ซ้ำ (เหมือนเดิม) ---
        db.query('SELECT id FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (results.length > 0) return res.status(400).json({ message: 'Username already exists' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const profileImage = req.file ? req.file.filename : null;
            const isApproved = (role === 'assignee') ? 0 : 1;
            const sqlUser = `
                INSERT INTO users (full_name, username, password, profile_image, role, is_approved)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.query(sqlUser, [fullName, username, hashedPassword, profileImage, role, isApproved], (err, userResult) => {
                if (err) {
                    console.error("Registration Error:", err);
                    return res.status(500).json({ message: 'Database error during insertion' });
                }

                const userId = userResult.insertId; // ดึง ID ของ user ที่เพิ่งสร้าง

                // --- 4. บันทึกทักษะลงตาราง user_skills (ถ้ามี) ---
                if (role === 'assignee' && skills) {
                    try {
                        // แปลง string "[1,2,3]" ที่ส่งมาจาก Frontend ให้เป็น Array
                        const skillIds = JSON.parse(skills);

                        if (skillIds.length > 0) {
                            // เตรียมข้อมูลสำหรับ Bulk Insert: [[userId, catId1], [userId, catId2], ...]
                            const skillValues = skillIds.map(catId => [userId, catId]);

                            const sqlSkills = `INSERT INTO user_skills (user_id, category_id) VALUES ?`;

                            db.query(sqlSkills, [skillValues], (skillErr) => {
                                if (skillErr) console.error("Error saving user skills:", skillErr);
                                // เราไม่ return error ตรงนี้เพื่อให้การสมัครสมาชิกหลักยังสำเร็จ
                            });
                        }
                    } catch (parseErr) {
                        console.error("Failed to parse skills JSON:", parseErr);
                    }
                }

                if (role === 'assignee') {
                    res.status(201).json({
                        success: true,
                        isPending: true, // บอก Frontend ว่าสถานะคือรออนุมัติ
                        message: 'Registration successful! Your account is pending admin approval.'
                    });
                } else {
                    res.status(201).json({
                        success: true,
                        isPending: false, // บอก Frontend ว่าใช้งานได้เลย
                        message: 'Registration successful! You can now log in.'
                    });
                }
            });
        });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/categories', (req, res) => {
    db.query("SELECT id, name FROM categories", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/api/users/assignees', (req, res) => {
    const sql = "SELECT id, username FROM users WHERE role = 'assignee'";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch Assignees Error:", err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});

// Adding this route to your friend's server.js
app.post('/api/todos', (req, res) => {
    // We use their 'db' variable instead of your old one
    const { task, assigned_to } = req.body;
    const sql = "INSERT INTO todo (task, assigned_to) VALUES (?, ?)";

    db.query(sql, [task, assigned_to], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, id: result.insertId });
    });
});


app.get('/api/users/search/:username', (req, res) => {
    const { username } = req.params;
    db.query('SELECT id, username, full_name, profile_image FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(results[0]);
    });
});

app.post('/api/user-requests', (req, res) => {
    const { user_email, message, user_id } = req.body;

    if (!message) {
        return res.status(400).json({ message: "Please provide a description of your issue." });
    }

    const sqlRequest = "INSERT INTO user_requests (user_id, user_email, message, status) VALUES (?, ?, ?, 'received')";

    db.query(sqlRequest, [user_id, user_email, message], async (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Failed to save the request." });
        }

        const requestId = result.insertId;

        // 🟢 แทนที่โค้ดส่งอีเมลเดิมด้วยชุดนี้
        const receivedHtmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #0d6efd; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0; font-size: 24px;">CEiVoice Support</h2>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
                <p style="font-size: 16px; color: #333;">Hello,</p>
                <p style="font-size: 16px; color: #333;">We have received your support request.</p>
                
                <div style="background-color: #fff8e1; border-left: 5px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <h3 style="margin-top: 0; color: #333; font-size: 18px;">Status: <span style="color: #d39e00;">⏳ Waiting for Review</span></h3>
                    <hr style="border: 0; border-top: 1px solid #ffe082; margin: 15px 0;">
                    <p style="margin-bottom: 5px; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;"><strong>Issue Details:</strong></p>
                    <p style="margin-top: 0; color: #333; font-size: 16px; font-style: italic;">"${message}"</p>
                </div>
                
                <p style="font-size: 15px; color: #666;">We will notify you once an assignee reviews and resolves your request.</p>
                <p style="font-size: 15px; color: #666; margin-top: 30px;">Thank you,<br/><strong style="color: #0d6efd;">The CEiVoice Team</strong></p>
            </div>
        </div>
        `;

        sendNotificationEmail(
            user_email,
            "CEiVoice: Request Received",
            receivedHtmlTemplate
        );

        try {
            // 1. ดึงรายชื่อ Assignee ทั้งหมดพร้อมทักษะ (Expertise)
            const getAssigneesSql = `
                SELECT 
                    u.id, 
                    u.full_name, 
                    GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') AS expertise
                FROM users u
                INNER JOIN user_skills us ON u.id = us.user_id
                INNER JOIN categories c ON us.category_id = c.id
                LEFT JOIN draft_tickets dt ON u.id = dt.assigned_to
                WHERE u.role = 'assignee' 
                AND dt.assigned_to IS NULL
                GROUP BY u.id
            `;

            db.query(getAssigneesSql, async (assigneeErr, assigneesList) => {
                if (assigneeErr) return console.error("Error fetching assignees:", assigneeErr);
                const existingDrafts = await new Promise((resolve, reject) => {
                    db.query("SELECT id, title, summary FROM draft_tickets WHERE status = 'Draft'", (err, rows) => {
                        if (err) reject(err); resolve(rows);
                    });
                });
                // 2. ส่ง message และ รายชื่อพนักงานไปให้ AI (อย่าลืมแก้ generateSupportTicket ให้รับ parameter เพิ่ม)
                const ticket = await generateSupportTicket(message, assigneesList, existingDrafts);
                //console.log(assigneesList);
                console.log("AI Suggested Ticket:", ticket);
                // 3. หา ID ของคนที่ AI เลือกมา (เปรียบเทียบจากชื่อที่ AI คืนกลับมาใน ticket.assignee_category_id)
                const suggestedAssigneeId = ticket.assignee_category_id[0];


                // 4. หา ID ของหมวดหมู่ (Category) จากชื่อที่ AI แนะนำมา
                const findCategorySql = "SELECT id FROM categories WHERE name = ? LIMIT 1";

                db.query(findCategorySql, [ticket.category], (catErr, catResults) => {
                    const categoryId = (!catErr && catResults.length > 0) ? catResults[0].id : null;
                    const resolutionPath = JSON.stringify(ticket.suggestedSolution);

                    // 5. บันทึกลง draft_tickets พร้อม Assignee ID และ Category ID
                    const sqlDraft = `
                        INSERT INTO draft_tickets (title, category, summary, resolution_path, suggested_assignees,assigned_to, status, created_by_ai,ai_suggested_merge_id) 
                        VALUES (?, ?, ?, ?, ?, ?, 'Draft', 1, ?)`;
                    console.log("Inserting Draft Ticket with:", [ticket.title, ticket.category, ticket.summary, resolutionPath, suggestedAssigneeId, ticket.assigned_to_id, ticket.match_draft_id]);
                    db.query(sqlDraft, [ticket.title, ticket.category, ticket.summary, resolutionPath, suggestedAssigneeId, ticket.assigned_to_id, ticket.match_draft_id], (draftErr, draftResult) => {
                        if (draftErr) {
                            console.error("Draft Insert Error:", draftErr);
                            return;
                        }

                        const draftId = draftResult.insertId;

                        // ทำ 2 อย่างพร้อมกัน: Mapping และ Update Status
                        const mappingQuery = "INSERT INTO draft_request_mapping (draft_id, request_id) VALUES (?, ?)";
                        const updateRequestQuery = "UPDATE user_requests SET draft_ticket_id = ?, status = 'draft' WHERE id = ?";

                        // รันคำสั่ง Mapping
                        db.query(mappingQuery, [draftId, requestId], (mErr) => {
                            if (mErr) console.error("Mapping Fail:", mErr);

                            // รันคำสั่ง Update Status
                            db.query(updateRequestQuery, [draftId, requestId], (uErr) => {
                                if (uErr) console.error("Update Status Fail:", uErr);
                                console.log("--- All Processes Completed for Request:", requestId, "---");
                            });
                        });
                    });
                });
            });

        } catch (aiErr) {
            console.error("AI Analysis failed:", aiErr);
        }

        // ส่ง Response กลับทันทีเพื่อให้ User ไม่ต้องรอนาน
        res.status(201).json({
            success: true,
            message: "Request submitted successfully. AI is drafting your ticket.",
            request_id: requestId
        });
    });
});

app.post('/api/admin/unlink-request', async (req, res) => {
    const { requestId, currentDraftId } = req.body;

    try {
        await db.promise().query('START TRANSACTION');

        // 1. ดึงข้อมูล Request เดิม
        const [requests] = await db.promise().query(
            'SELECT message, user_email FROM user_requests WHERE id = ?', [requestId]
        );
        if (requests.length === 0) throw new Error("Request not found");
        const originalMsg = requests[0].message;

        // 2. ดึงข้อมูลประกอบสำหรับ AI (Assignees และ Existing Drafts)
        const getAssigneesSql = `
            SELECT u.id, u.full_name, GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') AS expertise
            FROM users u
            INNER JOIN user_skills us ON u.id = us.user_id
            INNER JOIN categories c ON us.category_id = c.id
            LEFT JOIN draft_tickets dt ON u.id = dt.assigned_to
            WHERE u.role = 'assignee' AND dt.assigned_to IS NULL
            GROUP BY u.id`;

        const [assigneesList] = await db.promise().query(getAssigneesSql);
        const [existingDrafts] = await db.promise().query("SELECT id, title, summary FROM draft_tickets WHERE status = 'Draft'");

        // 3. เรียก AI เจน Ticket ใหม่สำหรับ Request นี้โดยเฉพาะ
        const ticket = await generateSupportTicket(originalMsg, assigneesList, existingDrafts);
        const resolutionPath = JSON.stringify(ticket.suggestedSolution);
        const suggestedAssigneeId = ticket.assignee_category_id ? ticket.assignee_category_id[0] : null;

        // 4. สร้าง Draft Ticket ใหม่
        const sqlDraft = `
            INSERT INTO draft_tickets 
            (title, category, summary, resolution_path, suggested_assignees, assigned_to, status, created_by_ai) 
            VALUES (?, ?, ?, ?, ?, ?, 'Draft', 1)`;

        const [draftResult] = await db.promise().query(sqlDraft, [
            ticket.title, ticket.category, ticket.summary, resolutionPath,
            suggestedAssigneeId, ticket.assigned_to_id
        ]);
        const newDraftId = draftResult.insertId;

        // 5. Update Mapping และ User Request
        await db.promise().query('UPDATE draft_request_mapping SET draft_id = ? WHERE request_id = ?', [newDraftId, requestId]);
        await db.promise().query('UPDATE user_requests SET draft_ticket_id = ?, status = "draft" WHERE id = ?', [newDraftId, requestId]);

        // 6. ตรวจสอบ Draft เก่า ถ้าไม่เหลือใครเชื่อมอยู่ให้ลบออก
        const [remaining] = await db.promise().query('SELECT COUNT(*) as count FROM draft_request_mapping WHERE draft_id = ?', [currentDraftId]);
        if (remaining[0].count === 0) {
            await db.promise().query('DELETE FROM draft_tickets WHERE id = ?', [currentDraftId]);
        }

        await db.promise().query('COMMIT');
        res.json({ success: true, message: "Unlinked and AI redrafted successfully", newDraftId });

    } catch (err) {
        await db.promise().query('ROLLBACK');
        console.error("Unlink Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/draft-tickets', (req, res) => {
    const sql = `
        SELECT 
            dt.id,
            dt.title,
            dt.category AS ai_category_name,
            dt.summary,
            dt.resolution_path,
            dt.status,
            dt.ai_suggested_merge_id,
            dt.created_at,
            dt.assigned_to,
            dt.deadline,
            u.full_name AS suggested_assignee_name,
            u.profile_image AS assignee_image,
            c.name AS constraint_category_name,
            -- ดึงข้อมูล User Request ที่ผูกอยู่ทั้งหมดเป็น JSON Array
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', ur.id,
                    'message', ur.message,
                    'user_email', ur.user_email
                )
            ) AS linked_requests
        FROM draft_tickets dt
        LEFT JOIN users u ON dt.assigned_to = u.id
        LEFT JOIN categories c ON dt.suggested_assignees = c.id
        -- เชื่อมไปยังตาราง Mapping และ User Requests
        LEFT JOIN draft_request_mapping drm ON dt.id = drm.draft_id
        LEFT JOIN user_requests ur ON drm.request_id = ur.id
        GROUP BY dt.id -- สำคัญมาก: ต้อง GROUP BY เพื่อไม่ให้ข้อมูลซ้ำ
        ORDER BY dt.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching draft tickets:", err);
            return res.status(500).json({ error: "Failed to fetch draft tickets" });
        }

        const formattedResults = results.map(ticket => {
            // ป้องกันกรณี JSON_ARRAYAGG คืนค่า [null] เมื่อไม่มีข้อมูลเชื่อมโยง
            let requests = [];
            try {
                requests = typeof ticket.linked_requests === 'string'
                    ? JSON.parse(ticket.linked_requests)
                    : ticket.linked_requests;
                // กรองค่า null ออกถ้ามี
                requests = requests.filter(r => r && r.id !== null);
            } catch (e) { requests = []; }

            return {
                ...ticket,
                resolution_path: ticket.resolution_path ? JSON.parse(ticket.resolution_path) : [],
                linked_requests: requests
            };
        });

        res.json(formattedResults);
    });
});
app.put('/api/admin/draft-tickets/:id', (req, res) => {
    const { id } = req.params;
    // ปรับตรงนี้: ดึงค่าจาก ai_category_name มาใส่ใน category ถ้า ai_category_name มีค่าส่งมา
    const { title, category, ai_category_name, summary, assigned_to, deadline, status } = req.body;

    // เลือกใช้ค่า category ที่มีข้อมูล (รองรับทั้งชื่อเก่าและชื่อใหม่จาก AI)
    const finalCategory = ai_category_name || category;

    const sql = `
        UPDATE draft_tickets 
        SET title = ?, category = ?, summary = ?, resolution_path = ?, assigned_to = ?, deadline = ?, status = ?
        WHERE id = ?`;

    db.query(sql, [
        title,
        finalCategory, // ใช้ตัวแปรที่รวมค่ามาแล้ว
        summary,
        JSON.stringify(req.body.resolution_path) || null,
        assigned_to || null,
        deadline || null,
        status || 'Draft',
        id
    ], (err, result) => {
        if (err) {
            console.error("SQL Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// 1. ดึงข้อมูลจากตาราง user_requests (คำขอเริ่มต้น)
app.get('/api/admin/user-requests', (req, res) => {
    const sql = "SELECT * FROM user_requests ORDER BY created_at DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json(results);
    });
});

// 2. ดึงข้อมูลจากตาราง draft_tickets (งานที่ผ่าน AI วิเคราะห์แล้ว)
app.get('/api/admin/draft-tickets', (req, res) => {
    const sql = `
        SELECT dt.*, u.full_name as suggested_assignee_name 
        FROM draft_tickets dt
        LEFT JOIN users u ON dt.assigned_to = u.id
        ORDER BY dt.created_at DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// 3. ดึงข้อมูลจากตาราง tickets (งานที่เป็นทางการ)
app.get('/api/admin/official-tickets', (req, res) => {
    const sql = `
        SELECT t.*, u.full_name as assignee_name 
        FROM tickets t
        LEFT JOIN users u ON t.assignee_id = u.id
        ORDER BY t.created_at DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/admin/approve-ticket', async (req, res) => {
    const { draft_id, title, category, summary, resolution_path, assignee_id, userRequestId, deadline } = req.body;

    try {
        // 1. หา userId จาก userRequestId (เพื่อนำมาใส่ใน follower_id)
        const [userRows] = await db.promise().query(
            "SELECT user_id FROM user_requests WHERE id = ? LIMIT 1",
            [userRequestId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ error: "Original user request not found." });
        }

        const userId = userRows[0].user_id;

        // 2. เตรียมข้อมูลสำหรับ Ticket
        const formattedDeadline = deadline ? deadline.replace('T', ' ').replace(/\..*$/, '') : null;
        const ticketNo = `TK-${Date.now()}`;

        // 3. บันทึกลงตาราง tickets
        const sqlInsertTicket = `
            INSERT INTO tickets (ticket_no, title, category, summary, resolution_path, status, assignee_id, follower_id, deadline) 
            VALUES (?, ?, ?, ?, ?, 'New', ?, ?, ?)`;

        await db.promise().query(sqlInsertTicket, [
            ticketNo,
            title,
            category,
            summary,
            JSON.stringify(resolution_path),
            assignee_id,
            userId, // ตอนนี้ userId มีค่าแล้ว
            formattedDeadline
        ]);

        // 4. อัปเดตสถานะ Draft และ User Request (รันพร้อมกันได้)
        const updateDraft = db.promise().query("UPDATE draft_tickets SET status = 'Submitted' WHERE id = ?", [draft_id]);
        const updateRequest = db.promise().query("UPDATE user_requests SET status = 'ticket' WHERE draft_ticket_id = ?", [draft_id]);

        await Promise.all([updateDraft, updateRequest]);

        res.json({
            success: true,
            message: "Ticket approved successfully",
            ticket_no: ticketNo
        });

    } catch (err) {
        console.error("Approve Ticket Error:", err);
        res.status(500).json({ error: "Failed to approve ticket: " + err.message });
    }
});

app.get('/api/admin/users', (req, res) => {
    const sql = `
        SELECT 
            u.id, 
            u.full_name, 
            u.username, 
            u.role, 
            u.profile_image,
            GROUP_CONCAT(c.id) AS skill_ids,
            GROUP_CONCAT(c.name SEPARATOR ', ') AS skill_names
        FROM users u
        LEFT JOIN user_skills us ON u.id = us.user_id
        LEFT JOIN categories c ON us.category_id = c.id
        GROUP BY u.id`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database Error:", err.message);
            return res.status(500).json({ error: "Failed to fetch users" });
        }
        res.json(results);
    });
});



app.get('/api/users/:userId/tickets', (req, res) => {
    const { userId } = req.params;

    // We join user_requests -> draft_tickets -> tickets
    // This follows the request's journey through your database
    const sql = `
        SELECT 
            ur.id AS request_id, 
            ur.message AS original_message, 
            ur.status AS request_status, 
            ur.created_at,
            dt.title AS ai_title,
            t.status AS official_status,
            t.ticket_no
        FROM user_requests ur
        LEFT JOIN draft_tickets dt ON ur.draft_ticket_id = dt.id
        LEFT JOIN tickets t ON (t.title = dt.title AND ur.status = 'ticket')
        WHERE ur.user_id = ?
        ORDER BY ur.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Failed to fetch history" });
        }
        res.json(results);
    });
});


app.post('/api/admin/merge-tickets', async (req, res) => {
    const { ticketIds } = req.body; // รับ Array ของ ID เช่น [30, 31, 35]

    if (!ticketIds || ticketIds.length < 2) {
        return res.status(400).json({ message: "Select at least 2 tickets to merge" });
    }

    // กำหนดตัวแรกเป็น Draft หลัก
    const mainDraftId = ticketIds[0];
    const otherDraftIds = ticketIds.slice(1);

    try {
        // 1. ย้าย request_id จาก draft อื่นๆ มาผูกกับ draft หลัก
        const updateMappingSql = `
            UPDATE draft_request_mapping 
            SET draft_id = ? 
            WHERE draft_id IN (?)
        `;

        // 2. ลบ draft tickets ที่เหลือทิ้ง
        const deleteDraftsSql = `
            DELETE FROM draft_tickets 
            WHERE id IN (?)
        `;

        // ใช้ Transaction เพื่อความปลอดภัย (ต้องสำเร็จทั้งหมด หรือไม่สำเร็จเลย)
        await db.promise().query('START TRANSACTION');

        await db.promise().query(updateMappingSql, [mainDraftId, otherDraftIds]);
        await db.promise().query(deleteDraftsSql, [otherDraftIds]);

        await db.promise().query('COMMIT');

        res.json({ message: "Merge successful! All requests moved to Ticket #" + mainDraftId });
    } catch (err) {
        await db.promise().query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// 3. ดึงข้อมูลจากตาราง tickets (งานที่เป็นทางการ)
app.get('/api/admin/official-tickets', (req, res) => {
    const sql = `
        SELECT t.*, u.full_name as assignee_name 
        FROM tickets t
        LEFT JOIN users u ON t.assignee_id = u.id
        ORDER BY t.created_at DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/admin/approve-ticket', (req, res) => {
    const { draft_id, title, category, summary, resolution_path, assignee_id, deadline } = req.body;

    // แปลง ISO Date String เป็น MySQL Format (YYYY-MM-DD HH:MM:SS)
    const formattedDeadline = deadline ? deadline.replace('T', ' ').replace(/\..*$/, '') : null;

    const ticketNo = `TK-${Date.now()}`;

    const sqlInsertTicket = `
        INSERT INTO tickets (ticket_no, title, category, summary, resolution_path, status, assignee_id, deadline) 
        VALUES (?, ?, ?, ?, ?, 'New', ?, ?)`;

    db.query(sqlInsertTicket, [
        ticketNo,
        title,
        category,
        summary,
        JSON.stringify(resolution_path),
        assignee_id,
        formattedDeadline // ใช้ตัวแปรที่แปลงฟอร์แมตแล้ว
    ], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: err.sqlMessage });
        }

        // 3. อัปเดตสถานะใน draft_tickets เป็น 'Submitted' เพื่อให้หายไปจากหน้าตาราง Draft
        const sqlUpdateDraft = "UPDATE draft_tickets SET status = 'Submitted' WHERE id = ?";
        db.query(sqlUpdateDraft, [draft_id], (updateErr) => {
            if (updateErr) console.error("Update Draft Error:", updateErr);

            // 4. อัปเดตสถานะใน user_requests เป็น 'ticket' เพื่อแจ้งผู้ใช้ว่ารับเรื่องแล้ว
            db.query("UPDATE user_requests SET status = 'ticket' WHERE draft_ticket_id = ?", [draft_id]);

            res.json({
                success: true,
                message: "Ticket approved successfully",
                ticket_no: ticketNo
            });
        });
    });
});

app.get('/api/admin/users', (req, res) => {
    const sql = `
        SELECT 
            u.id, 
            u.full_name, 
            u.username, 
            u.role, 
            u.profile_image,
            GROUP_CONCAT(c.id) AS skill_ids,
            GROUP_CONCAT(c.name SEPARATOR ', ') AS skill_names
        FROM users u
        LEFT JOIN user_skills us ON u.id = us.user_id
        LEFT JOIN categories c ON us.category_id = c.id
        GROUP BY u.id`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database Error:", err.message);
            return res.status(500).json({ error: "Failed to fetch users" });
        }
        res.json(results);
    });
});

app.put('/api/admin/users/:id', async (req, res) => {
    console.log("Update User Request Body:", req.body);
    const userId = req.params.id;
    const { full_name, role, skills } = req.body;

    try {
        const connection = db.promise(); // ถ้าใช้วิธีที่ 2
        const [currentRow] = await connection.query('SELECT role FROM users WHERE id = ?', [userId]);

        if (currentRow.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentRole = currentRow[0].role;

        // 2. เงื่อนไข: ถ้าเป็น admin ห้ามเปลี่ยน role (แต่ยอมให้เปลี่ยนชื่อหรือ skills ได้ถ้าต้องการ)
        // หรือถ้าต้องการล็อคไม่ให้แก้เลยหากเป็น admin ให้ใช้เงื่อนไขนี้ครับ
        if (currentRole === 'admin' && role !== 'admin') {
            return res.status(403).json({ error: 'Security Restriction: Cannot change the role of an administrator.' });
        }
        await connection.query('UPDATE users SET full_name = ?, role = ? WHERE id = ?', [full_name, role, userId]);
        if (currentRole === 'assignee' && role === 'user') {
            console.log(`User ${userId} changed from assignee to user. Updating related tickets...`);
            const sqlFailTickets = `
                UPDATE tickets 
                SET status = 'Failed', 
                    summary = CONCAT(summary, '\n\n[System Note: Assignee role changed to user. Ticket failed automatically.]')
                WHERE assignee_id = ? AND status NOT IN ('Completed', 'Failed')
            `;
            await connection.query(sqlFailTickets, [userId]);

            // ถ้าคุณมีระบบ Draft Tickets ที่ Assign คนนี้ไว้ด้วย อาจจะอยากเคลียร์ออกด้วย
            await connection.query("UPDATE draft_tickets SET assigned_to = NULL WHERE assigned_to = ?", [userId]);
        }
        await connection.query('DELETE FROM user_skills WHERE user_id = ?', [userId]);

        if (skills && Array.isArray(skills) && skills.length > 0) {
            // ต้องเป็น [[u, s1], [u, s2]]
            const skillValues = skills.map(catId => [parseInt(userId), parseInt(catId)]);

            // ใส่ [skillValues] เสมอ
            await connection.query('INSERT INTO user_skills (user_id, category_id) VALUES ?', [skillValues]);
        }

        res.json({ message: 'Updated successfully' });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/pending-approvals', (req, res) => {
    const sql = "SELECT id, username, full_name, role FROM users WHERE is_approved = 0";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.put('/api/admin/approve-user/:id', (req, res) => {
    const { id } = req.params;
    const sql = "UPDATE users SET is_approved = 1 WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "User approved successfully" });
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
import 'dotenv/config'; // แทนที่ require("dotenv").config()
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcrypt';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { generateSupportTicket } from "./services/aiService.js";

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
                                    username: user.full_name,
                                    fullName: user.full_name,
                                    profileImage: profileImage // ส่ง URL รูปกลับไปให้ Frontend
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

            const sqlUser = `
                INSERT INTO users (full_name, username, password, profile_image, role)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(sqlUser, [fullName, username, hashedPassword, profileImage, role], (err, userResult) => {
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

                res.status(201).json({
                    success: true,
                    message: 'User registered successfully and skills linked!'
                });
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

app.put('/api/todos/:id/assign', (req, res) => {
    const { id } = req.params;
    const { assigned_to } = req.body; // รับ ID ของคนที่จะเปลี่ยนไปให้

    const sql = 'UPDATE todo SET assigned_to = ? WHERE id = ?';
    db.query(sql, [assigned_to === '' ? null : assigned_to, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ success: true, message: 'Assignee updated' });
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

        try {
            // 1. ดึงรายชื่อ Assignee ทั้งหมดพร้อมทักษะ (Expertise)
            const getAssigneesSql = `
                SELECT u.id, u.full_name, GROUP_CONCAT(c.name SEPARATOR ', ') AS expertise
                FROM users u
                INNER JOIN user_skills us ON u.id = us.user_id
                INNER JOIN categories c ON us.category_id = c.id
                WHERE u.role = 'assignee'
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
                console.log(assigneesList);
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

app.get('/api/admin/draft-tickets', (req, res) => {
    const sql = `
        SELECT 
            dt.id,
            dt.title,
            dt.category AS ai_category_name,
            dt.summary,
            dt.resolution_path,
            dt.status,
            dt.created_at,
            dt.assigned_to,
            dt.deadline,
            u.full_name AS suggested_assignee_name,
            u.profile_image AS assignee_image,
            c.name AS constraint_category_name
        FROM draft_tickets dt
        LEFT JOIN users u ON dt.assigned_to = u.id
        LEFT JOIN categories c ON dt.suggested_assignees = c.id
        ORDER BY dt.created_at DESC
    `;
    //console.log("Fetching draft tickets with SQL:", sql);
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching draft tickets:", err);
            return res.status(500).json({ error: "Failed to fetch draft tickets" });
        }

        // แปลง resolution_path จาก string กลับเป็น array ก่อนส่งไป frontend
        const formattedResults = results.map(ticket => ({
            ...ticket,
            resolution_path: ticket.resolution_path ? JSON.parse(ticket.resolution_path) : []
        }));

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

        await db.query('UPDATE users SET full_name = ?, role = ? WHERE id = ?', [full_name, role, userId]);

        await db.query('DELETE FROM user_skills WHERE user_id = ?', [userId]);

        if (skills && skills.length > 0) {
            const skillValues = skills.map(catId => [userId, catId]);
            await db.query('INSERT INTO user_skills (user_id, category_id) VALUES ?', [skillValues]);
        }

        res.json({ message: 'Updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
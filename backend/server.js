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
                        role: user.role,
                        skills: user.skills

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
// ------------------------------------
// API: Todo List (Updated for Statuses)
// ------------------------------------

// 1. READ: Added target_datetime to SELECT


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

            // --- 3. Insert User ลงตาราง users ---
            // เราจะไม่ส่ง skills ลงในตาราง users แล้ว แต่จะแยกไปตารางกลางแทน
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

app.get('/api/users/assignees', (req, res) => {
    const sql = "SELECT id, username, skills FROM users WHERE role = 'assignee'";
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

                // 2. ส่ง message และ รายชื่อพนักงานไปให้ AI (อย่าลืมแก้ generateSupportTicket ให้รับ parameter เพิ่ม)
                const ticket = await generateSupportTicket(message, assigneesList);
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
                        INSERT INTO draft_tickets (title, category, summary, resolution_path, suggested_assignees,assigned_to, status, created_by_ai) 
                        VALUES (?, ?, ?, ?, ?, ?, 'Draft', 1)`;
                    console.log("Inserting Draft Ticket with:", [ticket.title, ticket.category, ticket.summary, resolutionPath, suggestedAssigneeId, ticket.assigned_to_id]);
                    db.query(sqlDraft, [ticket.title, ticket.category, ticket.summary, resolutionPath, suggestedAssigneeId, ticket.assigned_to_id], (draftErr, draftResult) => {
                        if (draftErr) return console.error("Draft Insert Error:", draftErr);

                        // 6. อัปเดตสถานะ user_requests เป็น 'draft' เพื่อเชื่อมโยงข้อมูล
                        db.query("UPDATE user_requests SET draft_ticket_id = ?, status = 'draft' WHERE id = ?", [draftResult.insertId, requestId]);
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

app.get('/api/categories', (req, res) => {
    db.query("SELECT id, name FROM categories", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
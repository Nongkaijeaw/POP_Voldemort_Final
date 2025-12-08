const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "pop_voldemort"
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/');
    },
    filename: (req, file, cb) => {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const queryDB = (sql) => {
    return new Promise((resolve, reject) => {
        con.query(sql, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

const startServer = async () => {
    try {
        await new Promise((resolve, reject) => {
            con.connect((err) => {
                if (err) reject(err);
                else {
                    console.log("MySQL Connected!");
                    resolve();
                }
            });
        });

        await queryDB("CREATE DATABASE IF NOT EXISTS pop_voldemort");
        console.log("Database 'pop_voldemort' created or checked.");

        await queryDB("USE pop_voldemort");

        const userTable = `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            score INT DEFAULT 0,
            img_path VARCHAR(255) DEFAULT 'default.png', 
            bio TEXT,
            house_logo VARCHAR(255) DEFAULT 'Gryffindor_logo.png',
            reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        await queryDB(userTable);
        console.log("Table 'users' created or checked.");

        const houseTable = `CREATE TABLE IF NOT EXISTS houses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            logo_filename VARCHAR(255) NOT NULL,
            description VARCHAR(255)
        )`;
        await queryDB(houseTable);
        console.log("Table 'houses' created or checked.");

        const houses = [
            { name: 'Gryffindor', logo: 'Gryffindor_logo.png', desc: 'Brave & Bold' },
            { name: 'Hufflepuff', logo: 'Hufflepuff_logo.png', desc: 'Loyal & Kind' },
            { name: 'Slytherin', logo: 'Slytherin_logo.png', desc: 'Cunning & Ambitious' },
            { name: 'Ravenclaw', logo: 'Ravenclaw_logo.png', desc: 'Wise & Creative' }
        ];
        for (const house of houses) {
            const checkHouse = await queryDB(`SELECT * FROM houses WHERE name = '${house.name}'`);
            if (checkHouse.length === 0) {
                await queryDB(`INSERT INTO houses (name, logo_filename, description) VALUES ('${house.name}', '${house.logo}', '${house.desc}')`);
            }
        }
        console.log("Houses data checked and inserted if needed.");

        const commentTable = `CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sender_id INT,
            receiver_id INT,
            message TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        await queryDB(commentTable);
        console.log("Table 'comments' created or checked.");

        const likeTable = `CREATE TABLE IF NOT EXISTS likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            target_profile_id INT
        )`;
        await queryDB(likeTable);
        console.log("Table 'likes' created or checked.");

        console.log(">>> All Tables Ready! <<<");

    } catch (err) {
        console.error("Error setting up database:", err);
    }
};

startServer();

app.get('/', (req, res) => {
    const username = req.cookies.username;

    if (!username) {
        return res.redirect('/login.html');
    }

    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/register', upload.single('avatar'), async (req, res) => {
    const { username, password, house_logo } = req.body;
    if (!username || !password || !house_logo) return res.json({ status: 'error', message: 'กรอกข้อมูลให้ครบ' });

    try {
        const check = await queryDB(`SELECT * FROM users WHERE username = '${username}'`);
        if (check.length > 0) return res.json({ status: 'error', message: 'ชื่อนี้ถูกใช้แล้ว' });

        let img_path;
        if (req.file) {
            img_path = req.file.filename;
        } else {
            const houseName = house_logo.replace('_logo.png', '');
            img_path = `Profile_${houseName}_Base.png`;
        }

        const sql = `INSERT INTO users (username, password, bio, img_path, house_logo) VALUES ('${username}', '${password}', 'สวัสดี! ฉันเป็นสมาชิกใหม่', '${img_path}', '${house_logo}')`;
        await queryDB(sql);
        res.json({ status: 'success', message: 'สมัครสำเร็จ!' });
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
        const result = await queryDB(sql);

        if (result.length > 0) {
            res.cookie('username', username, { maxAge: 86400000 });
            res.json({ status: 'success', message: 'เข้าสู่ระบบสำเร็จ!', user: result[0] });
        } else {
            res.json({ status: 'error', message: 'ชื่อหรือรหัสผ่านผิด' });
        }
    } catch (err) {
        res.json({ status: 'error', message: err.message });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.json({ status: 'success', message: 'Logged out' });
});

app.get('/leaderboard', async (req, res) => {
    try {
        const sql = `SELECT username, score, img_path, house_logo FROM users ORDER BY score DESC LIMIT 10`;
        const result = await queryDB(sql);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/house-leaderboard', async (req, res) => {
    try {
        const sql = `
            SELECT 
                h.id,
                h.name,
                h.logo_filename as house_logo,
                h.description,
                SUM(u.score) as total_score,
                COUNT(u.id) as member_count
            FROM houses h
            LEFT JOIN users u ON u.house_logo = h.logo_filename
            GROUP BY h.id, h.name, h.logo_filename, h.description
            ORDER BY total_score DESC
        `;
        const result = await queryDB(sql);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/score', async (req, res) => {
    const username = req.cookies.username;

    if (!username) {
        return res.status(401).json({ error: "Unauthorized: กรุณาล็อกอินก่อน" });
    }

    try {
        const sql = `SELECT score FROM users WHERE username = '${username}'`;
        const result = await queryDB(sql);

        if (result.length > 0) {
            res.json({ score: result[0].score });
        } else {
            res.json({ score: 0 });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.post('/score', async (req, res) => {
    const username = req.cookies.username;

    if (!username) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const sql = `UPDATE users SET score = score + 1 WHERE username = '${username}'`;
        await queryDB(sql);
        
        res.json({ status: "success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.get('/api/profile', async (req, res) => {
    const targetUser = req.query.user || req.cookies.username;
    
    if (!targetUser) return res.status(401).json({ error: "No user specified" });

    try {
        const userSql = `SELECT id, username, score, img_path, bio FROM users WHERE username = '${targetUser}'`;
        const userResult = await queryDB(userSql);

        if (userResult.length === 0) return res.status(404).json({ error: "User not found" });
        const user = userResult[0];

        const likeSql = `SELECT COUNT(*) as count FROM likes WHERE target_profile_id = ${user.id}`;
        const likeResult = await queryDB(likeSql);
        user.likes = likeResult[0].count;

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/upload_profile', upload.single('avatar'), async (req, res) => {
    const username = req.cookies.username;
    if (!username || !req.file) return res.status(400).json({ error: "Upload failed" });

    try {
        const filename = req.file.filename;
        await queryDB(`UPDATE users SET img_path = '${filename}' WHERE username = '${username}'`);
        res.json({ status: "success", filename: filename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/update_bio', async (req, res) => {
    const username = req.cookies.username;
    const { bio } = req.body;

    console.log('Update bio request - Username:', username, 'Bio:', bio);

    if (!username) return res.status(401).json({ status: 'error', error: "Not logged in" });

    try {
        const escapedBio = (bio || '').replace(/'/g, "''");
        const escapedUsername = (username || '').replace(/'/g, "''");
        
        const sql = `UPDATE users SET bio = '${escapedBio}' WHERE username = '${escapedUsername}'`;
        console.log('SQL:', sql);
        
        await queryDB(sql);
        res.json({ status: "success" });
    } catch (err) {
        console.error('Update bio error:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

app.post('/api/like', async (req, res) => {
    const likerName = req.cookies.username;
    const { targetId } = req.body;

    try {
        const likerRes = await queryDB(`SELECT id FROM users WHERE username = '${likerName}'`);
        const likerId = likerRes[0].id;

        const check = await queryDB(`SELECT * FROM likes WHERE user_id = ${likerId} AND target_profile_id = ${targetId}`);
        
        if (check.length > 0) {
            await queryDB(`DELETE FROM likes WHERE user_id = ${likerId} AND target_profile_id = ${targetId}`);
            res.json({ status: "unliked" });
        } else {
            await queryDB(`INSERT INTO likes (user_id, target_profile_id) VALUES (${likerId}, ${targetId})`);
            res.json({ status: "liked" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/comments', async (req, res) => {
    const targetId = req.query.target_id;
    try {
        const sql = `
            SELECT c.message, c.timestamp, u.username, u.img_path 
            FROM comments c 
            JOIN users u ON c.sender_id = u.id 
            WHERE c.receiver_id = ${targetId} 
            ORDER BY c.timestamp DESC`;
        
        const comments = await queryDB(sql);
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/comment', async (req, res) => {
    const senderName = req.cookies.username;
    const { targetId, message } = req.body;

    try {
        const senderRes = await queryDB(`SELECT id FROM users WHERE username = '${senderName}'`);
        const senderId = senderRes[0].id;

        await queryDB(`INSERT INTO comments (sender_id, receiver_id, message) VALUES (${senderId}, ${targetId}, '${message}')`);
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


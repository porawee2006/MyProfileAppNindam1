// ดึงค่าการตั้งค่าจากไฟล์ .env มาใช้งาน
require('dotenv').config();
// นำเข้า Express Framework สำหรับสร้าง Web Server
const express = require('express');
// นำเข้า CORS อนุญาตให้แอป React Native เรียกใช้ API ได้
const cors = require('cors');
// นำเข้าตัวเชื่อมต่อ MySQL แบบ Promise
const mysql = require('mysql2/promise');
// นำเข้า bcrypt สำหรับเข้ารหัสรหัสผ่านให้ปลอดภัย
const bcrypt = require('bcrypt');
// นำเข้า jsonwebtoken สำหรับออก Token ล็อกอิน
const jwt = require('jsonwebtoken');

// สร้างอินสแตนซ์ของ Express App
const app = express();
// กำหนดพอร์ตในการรัน Server (เริ่มต้น 3028)
const port = process.env.PORT || 3028;

// เปิดใช้งาน CORS
app.use(cors());
// อนุญาตให้รับข้อมูลแบบ JSON ขนาดไม่เกิน 5MB
app.use(express.json({ limit: '5mb' }));

// ==========================================
// 🔌 1. จุดเชื่อมต่อไปยัง MySQL (phpMyAdmin)
// ==========================================
// ตรงนี้เป็นจุดที่เอาไว้ใส่ Host, Username, Password และชื่อ Database เพื่อเชื่อมต่อไป phpMyAdmin ครับ
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00"
});

(async function testMySQL() {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL:', process.env.DB_NAME);
    
    // Create users table if not exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed admin if not exists
    const [adminRows] = await conn.query('SELECT * FROM users WHERE username = ?', ['Admin']);
    if (adminRows.length === 0) {
      const hashedPass = await bcrypt.hash('123456', 10);
      await conn.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['Admin', hashedPass, 'admin']);
      console.log('Admin user seeded.');
    }

    conn.release();
  } catch (err) {
    console.error('MySQL Failed:', err.message);
    process.exit(1);
  }
})();

// คีย์ลับสำหรับเซ็นต์สร้าง JWT Token
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

// 🛡️ Middleware ตรวจสอบว่าผู้ใช้ส่ง Token ล็อกอินเข้ามาหรือยัง
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // ดึงคำว่า Bearer <Token>
  if (!token) return res.status(401).json({ error: 'Access Token Required' });
  
  // ยืนยันความถูกต้องของ Token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid Token' });
    req.user = user;
    next();
  });
}

// 👑 Middleware ตรวจสอบว่าผู้ใช้มีสิทธิ์เป็น Admin หรือไม่
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next(); // สิทธิ์ผ่าน อนุญาตให้รันคำสั่งถัดไป
    } else {
      res.status(403).json({ error: 'Admin Access Required' }); // ไม่ใช่ Admin ไม่อนุญาต!
    }
  });
}

// ==========================================
// ⚙️ [BACKEND] 5. ระบบ LOGIN & REGISTER (เข้าสู่ระบบ / สมัครสมาชิก)
// ==========================================

// ⚙️ [BACKEND] 5.1 ระบบสมัครสมาชิกสำหรับลูกค้า (Register)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    if (username.toLowerCase() === 'admin') {
       return res.status(400).json({ error: 'Cannot register as admin' });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPass, 'user']);
    res.status(201).json({ success: true, userId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// ⚙️ [BACKEND] 5.2 ระบบเข้าสู่ระบบ (Login) ทั้ง Admin และ Customer
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ==========================================
// ⚙️ [BACKEND] 4. ระบบค้นหา (SEARCH) & 6. ระบบกรองและเรียงลำดับราคา (FILTER & SORT)
// ==========================================
app.get('/api/products', async (req, res) => {
  try {
    const { q, minPrice, maxPrice, sort } = req.query;
    let query = 'SELECT * FROM powerbanks WHERE 1=1';
    let params = [];
    
    // ค้นหาตามชื่อสินค้าหรือแบรนด์
    if (q) {
       query += ' AND (name LIKE ? OR brand LIKE ?)';
       params.push(`%${q}%`, `%${q}%`);
    }

    // กรองตามราคาน้อยที่สุด (Min Price)
    if (minPrice && !isNaN(minPrice)) {
       query += ' AND price >= ?';
       params.push(parseFloat(minPrice));
    }

    // กรองตามราคามากที่สุด (Max Price)
    if (maxPrice && !isNaN(maxPrice)) {
       query += ' AND price <= ?';
       params.push(parseFloat(maxPrice));
    }

    // เรียงลำดับราคา (Price Low->High, High->Low, Newest)
    if (sort === 'price_asc') {
       query += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
       query += ' ORDER BY price DESC';
    } else {
       query += ' ORDER BY lastUpdate DESC';
    }

    try {
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch(e) {
      // Fallback สำหรับตารางที่ไม่มีคอลัมน์ lastUpdate
      query = query.replace(' ORDER BY lastUpdate DESC', '');
      const [rows2] = await pool.query(query, params);
      res.json(rows2);
    }
  } catch (e) {
    console.error('Products Error:', e.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ==========================================
// ⚙️ [BACKEND] 1. ระบบเพิ่มสินค้า (ADD PRODUCT - เฉพาะ Admin)
// ==========================================
app.post('/api/products', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const { name, brand = null, capacity = null, price = 0, stock = 0, image = null, category = null, location = null, status = 'Active' } = body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
      // First try the schema from the presentation
      const [rs] = await pool.query(
        `INSERT INTO powerbanks (name, stock, category, location, image, status, brand, lastUpdate) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [name, stock || 0, category || null, location || null, image || null, status || 'Active', brand || null]
      );
      return res.status(201).json({ success: true, productId: rs.insertId });
    } catch(e) {
      // Fallback to powerbanks schema derived from index.tsx
      const [rs2] = await pool.query(
        `INSERT INTO powerbanks (name, brand, capacity, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, brand, capacity, price, stock, image]
      );
      return res.status(201).json({ success: true, productId: rs2.insertId });
    }
  } catch (err) {
    console.error('Create Product Error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ==========================================
// ⚙️ [BACKEND] 3. ระบบแก้ไขสินค้า (EDIT PRODUCT - เฉพาะ Admin)
// ==========================================
app.put('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const { name, brand = null, capacity = null, price = 0, stock = 0, image = null, category = null, location = null, status = 'Active' } = body;

    if (!name) return res.status(400).json({ error: 'Missing name' });

    try {
       const [result] = await pool.query(
        `UPDATE powerbanks SET name = ?, stock = ?, category = ?, location = ?, status = ?, image = ?, brand = ?, lastUpdate = NOW() WHERE id = ?`,
        [name, stock || 0, category, location, status, image, brand, id]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      return res.json({ success: true });
    } catch(e) {
      const [result2] = await pool.query(
        `UPDATE powerbanks SET name = ?, brand = ?, capacity = ?, price = ?, stock = ?, image = ? WHERE id = ?`,
        [name, brand, capacity, price, stock, image, id]
      );
      if (result2.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ error: 'Failed to update product: ' + (err.message || 'Unknown error') });
  }
});

// ==========================================
// ⚙️ [BACKEND] 2. ระบบลบสินค้า (DELETE PRODUCT - เฉพาะ Admin)
// ==========================================
app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM powerbanks WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete Product Error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API running on port ${port}`);
});

app.get("/api", (req, res) => {
  res.send("API is running");
});

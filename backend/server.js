require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
// const jwt = require('jsonwebtoken'); // Included for reference if needed

const app = express();
const port = process.env.PORT || 3028;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// MySQL Connection
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
    conn.release();
  } catch (err) {
    console.error('MySQL Failed:', err.message);
    process.exit(1);
  }
})();

/* Middleware for checking token (reference from presentation)
function authToken(req, res, next){
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(!token) return res.status(401).json({ error:'Access Token Required' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if(err) return res.status(403).json({ error:'Invalid Token' });
      req.user = user;
      next();
  });
}
*/

// Get products
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM powerbanks ORDER BY lastUpdate DESC');
    res.json(rows);
  } catch (e) {
    console.error('Products Error:', e.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Add product
app.post('/api/products', async (req, res) => {
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

// Edit product
app.put('/api/products/:id', async (req, res) => {
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

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API running on port ${port}`);
});

app.get("/api", (req, res) => {
  res.send("API is running");
});

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// SQLite DB setup
const db = new sqlite3.Database('./expenses.db');

db.run(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL
  )
`);

// Add expense
app.post('/expenses', (req, res) => {
  const { amount, category, description, date } = req.body;
  if (!amount || !category || !date) {
    return res.status(400).json({ error: 'Amount, category, and date are required.' });
  }
  db.run(
    `INSERT INTO expenses (amount, category, description, date) VALUES (?, ?, ?, ?)`,
    [amount, category, description, date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Get expenses with filters
app.get('/expenses', (req, res) => {
  const { from, to, sort = 'desc' } = req.query;
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];

  if (from) {
    query += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND date <= ?';
    params.push(to);
  }

  query += ` ORDER BY date ${sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Summary by category
app.get('/summary', (req, res) => {
  db.all(`SELECT category, SUM(amount) as total FROM expenses GROUP BY category`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

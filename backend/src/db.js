const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function createPool(cfg) {
  return mysql.createPool({ ...cfg, waitForConnections: true, queueLimit: 0, timezone: 'Z' });
}

// Runs migrations/*.sql in order, once each, so the schema is created automatically.
async function migrate(pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const [rows] = await pool.query('SELECT name FROM schema_migrations');
  const done = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (done.has(file)) continue;
    console.log(`Applying migration ${file}`);
    await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
    await pool.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
  }
}

module.exports = { createPool, migrate };

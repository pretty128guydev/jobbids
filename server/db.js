const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

let pool = null;

async function init() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'jobbids';
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;

  // connect without database to ensure it exists
  const conn = await mysql.createConnection({ host, user, password, port });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();

  pool = mysql.createPool({ host, user, password, database, port, waitForConnections: true, connectionLimit: 10, queueLimit: 0 });

  // ensure tables exist by running the migration's CREATE TABLE if needed
  await ensureTables();
}

async function ensureTables() {
  if (!pool) throw new Error('DB pool not initialized');
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS bids (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL,
      job_title VARCHAR(255) NOT NULL,
      jd_link VARCHAR(1024) DEFAULT '',
      status VARCHAR(50) DEFAULT 'Applied',
      interview_status VARCHAR(100) DEFAULT '',
      bidded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      interview_scheduled DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.query(createTableSql);

  // insert sample rows if table empty
  const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM bids');
  if (rows[0].cnt === 0) {
    const sample = [
      ['Acme Corp','Frontend Engineer','https://acme.example/jd/frontend','Applied','',null],
      ['Acme Corp','Backend Engineer','https://acme.example/jd/backend','Interview','Phone screen','2026-02-10 10:00:00'],
      ['Globex','Fullstack Developer','https://globex.example/jd/fullstack','Offer','Onsite','2026-02-15 14:00:00']
    ];
    for (const s of sample) {
      await pool.execute(
        `INSERT INTO bids (company_name, job_title, jd_link, status, interview_status, interview_scheduled)
         VALUES (?, ?, ?, ?, ?, ?)`,
        s
      );
    }
  }
}

function getPool() {
  if (!pool) throw new Error('DB not initialized. Call init() first.');
  return pool;
}

module.exports = { init, getPool };
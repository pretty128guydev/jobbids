const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
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

  // Force JST for all session-level time calculations (NOW(), CURRENT_TIMESTAMP, etc.)
  pool.on('connection', (conn) => {
    conn.query("SET time_zone = '+09:00'");
  });

  // ensure tables and columns exist
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
      description TEXT,
      status VARCHAR(50) DEFAULT 'applied',
      interview_status VARCHAR(100) DEFAULT 'none',
      bidded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      interview_scheduled DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.query(createTableSql);

  // ensure description column exists for older schemas (portable check)
  const [colInfo] = await pool.query(
    "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bids' AND COLUMN_NAME = 'description'"
  );
  if (colInfo[0].cnt === 0) {
    await pool.query("ALTER TABLE bids ADD COLUMN description TEXT");
  }

  // insert sample rows if table empty
  const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM bids');
  if (rows[0].cnt === 0) {
    const sample = [
      ['Acme Corp','Frontend Engineer','https://acme.example/jd/frontend','Frontend role focusing on React','applied','none',null],
      ['Acme Corp','Backend Engineer','https://acme.example/jd/backend','Node.js + MySQL role','applied','recruiter','2026-02-10 10:00:00'],
      ['Globex','Fullstack Developer','https://globex.example/jd/fullstack','Fullstack with cloud experience','applied','tech','2026-02-15 14:00:00']
    ];
    for (const s of sample) {
      await pool.execute(
        `INSERT INTO bids (company_name, job_title, jd_link, description, status, interview_status, interview_scheduled)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        s
      );
    }
  }

  // normalize stored status and interview_status values
  await pool.query("UPDATE bids SET status = LOWER(TRIM(status))");
  await pool.query("UPDATE bids SET interview_status = LOWER(TRIM(interview_status))");
  await pool.query(
    "UPDATE bids SET status = 'applied' WHERE status IS NULL OR TRIM(status) = '' OR status NOT IN ('applied','refused','chatting','test task','fill the form')"
  );
  await pool.query(
    "UPDATE bids SET interview_status = 'none' WHERE interview_status IS NULL OR TRIM(interview_status) = '' OR interview_status NOT IN ('recruiter','tech','tech(live coding)','tech 2','final','none')"
  );
}

function getPool() {
  if (!pool) throw new Error('DB not initialized. Call init() first.');
  return pool;
}

module.exports = { init, getPool };

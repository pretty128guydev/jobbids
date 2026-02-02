const express = require('express');
const router = express.Router();
const db = require('../db');

// Helpers
async function query(sql, params) {
  const pool = db.getPool();
  const p = params || [];
  const [rows] = await pool.execute(sql, p);
  return rows;
}

// GET /api/bids - list with filters + pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, company, status, interview_status, job_title } = req.query;
    const offset = (page - 1) * limit;
    const where = [];
    const params = [];

    if (company) { where.push('company_name LIKE ?'); params.push(`%${company}%`); }
    if (job_title) { where.push('job_title LIKE ?'); params.push(`%${job_title}%`); }
    if (status) { where.push('status = ?'); params.push(status); }
    if (interview_status) { where.push('interview_status = ?'); params.push(interview_status); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const totalRows = await query(`SELECT COUNT(*) as cnt FROM bids ${whereSql}`, params);
    const total = totalRows[0].cnt;

    // Some MySQL servers have issues with parameterized LIMIT/OFFSET.
    // Validate and interpolate numeric values directly to avoid ER_WRONG_ARGUMENTS.
    const lim = Math.max(1, Math.min(1000, parseInt(limit, 10) || 10));
    const off = Math.max(0, parseInt(offset, 10) || 0);
    const rows = await query(
      `SELECT * FROM bids ${whereSql} ORDER BY bidded_date DESC LIMIT ${lim} OFFSET ${off}`,
      params
    );

    res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check by company name: GET /api/bids/check/company?company=...
router.get('/check/company', async (req, res) => {
  try {
    const { company } = req.query;
    if (!company) return res.status(400).json({ error: 'company required' });
    const rows = await query('SELECT COUNT(*) as cnt FROM bids WHERE company_name = ?', [company]);
    res.json({ exists: rows[0].cnt > 0 });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/bids/:id
router.get('/:id', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM bids WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/bids - add (sets bidded_date automatically)
router.post('/', async (req, res) => {
  try {
    const { company_name, job_title, jd_link = '', status = 'Applied', interview_status = '', interview_scheduled = null } = req.body;
    if (!company_name || !job_title) return res.status(400).json({ error: 'company_name and job_title required' });

    const pool = db.getPool();
    const [result] = await pool.execute(
      `INSERT INTO bids (company_name, job_title, jd_link, status, interview_status, bidded_date, interview_scheduled)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [company_name, job_title, jd_link, status, interview_status, interview_scheduled]
    );

    const id = result.insertId;
    const rows = await query('SELECT * FROM bids WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/bids/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { company_name, job_title, jd_link, status, interview_status, interview_scheduled } = req.body;
    const fields = [];
    const params = [];
    if (company_name !== undefined) { fields.push('company_name = ?'); params.push(company_name); }
    if (job_title !== undefined) { fields.push('job_title = ?'); params.push(job_title); }
    if (jd_link !== undefined) { fields.push('jd_link = ?'); params.push(jd_link); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }
    if (interview_status !== undefined) { fields.push('interview_status = ?'); params.push(interview_status); }
    if (interview_scheduled !== undefined) { fields.push('interview_scheduled = ?'); params.push(interview_scheduled); }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await query(`UPDATE bids SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
    const rows = await query('SELECT * FROM bids WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/bids/:id
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM bids WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// Summary /analysis endpoint
router.get('/summary/stats', async (req, res) => {
  try {
    const statusRows = await query('SELECT status, COUNT(*) as cnt FROM bids GROUP BY status', []);
    const interviewRows = await query('SELECT interview_status, COUNT(*) as cnt FROM bids GROUP BY interview_status', []);
    res.json({ byStatus: statusRows, byInterviewStatus: interviewRows });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
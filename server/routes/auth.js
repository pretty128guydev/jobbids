const express = require('express');
const router = express.Router();

// simple hardcoded auth: username 'tooth' password 'tooth'
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'tooth' && password === 'tooth') {
    req.session.user = 'tooth';
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('jobbids.sid');
    res.json({ ok: true });
  });
});

router.get('/status', (req, res) => {
  if (req.session && req.session.user === 'tooth') return res.json({ authenticated: true, user: 'tooth' });
  return res.json({ authenticated: false });
});

module.exports = router;

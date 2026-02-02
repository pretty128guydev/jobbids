const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const router = express.Router();

// simple hardcoded auth: username 'tooth' and password default set by ADMIN_PASSWORD env or string below
const PASSWORD = process.env.ADMIN_PASSWORD || 'Toothlessb!rth!s128';

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === 'tooth' && password === PASSWORD) {
    req.session.user = 'tooth';
    console.log('Auth login: session created', { id: req.sessionID, user: req.session.user });
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

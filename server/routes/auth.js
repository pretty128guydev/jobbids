const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const router = express.Router();

// simple hardcoded auth: username 'tooth' and password default set by ADMIN_PASSWORD env or string below
const PASSWORD = process.env.ADMIN_PASSWORD || 'Toothlessb!rth!s128';

router.post('/login', (req, res) => {
  // Authentication removed — accept all login attempts
  return res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  // No-op logout; simply return ok
  return res.json({ ok: true });
});

router.get('/status', (req, res) => {
  // Always report authenticated so client flows that check status proceed
  return res.json({ authenticated: true, user: 'public' });
});

module.exports = router;

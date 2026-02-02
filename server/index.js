const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');
const cookieParser = require('cookie-parser');
const session = require('express-session');

dotenv.config();
const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
	session({
		name: 'jobbids.sid',
		secret: process.env.SESSION_SECRET || 'change-me',
		resave: false,
		saveUninitialized: false,
		cookie: { secure: false, httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }
	})
);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// auth routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// protect API routes
function requireAuth(req, res, next) {
	if (req.session && req.session.user === 'tooth') return next();
	return res.status(401).json({ error: 'Unauthorized' });
}

const port = process.env.PORT || 4000;

(async () => {
	try {
		await db.init();
		const bidsRouter = require('./routes/bids');
		app.use('/api/bids', requireAuth, bidsRouter);
		app.listen(port, () => console.log(`Server listening on ${port}`));
	} catch (err) {
		console.error('Failed to initialize database:', err);
		process.exit(1);
	}
})();

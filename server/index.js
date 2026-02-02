const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');
const cookieParser = require('cookie-parser');
const session = require('express-session');

dotenv.config();
const app = express();

// Allow localhost for dev and Netlify domain for production
const allowedOrigins = [
	'http://localhost:3000',
	'http://localhost:3001',
	process.env.CLIENT_ORIGIN,
	'https://jobbids-prod.netlify.app' // Add your Netlify domain here
].filter(Boolean);

app.use(cors({ 
	origin: (origin, callback) => {
		// Allow requests with no origin (like curl or native apps)
		if (!origin) return callback(null, true);

		// Allow explicit origins or any Netlify subdomain
		if (allowedOrigins.includes(origin) || origin.endsWith('.netlify.app')) {
			return callback(null, true);
		}

		return callback(new Error('CORS not allowed'));
	},
	credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

app.use(
	session({
		name: 'jobbids.sid',
		secret: process.env.SESSION_SECRET || 'change-me',
		resave: false,
		saveUninitialized: false,
		cookie: { 
			// For cross-site requests from Netlify -> Render we need SameSite=None and secure
			secure: process.env.NODE_ENV === 'production',
			httpOnly: true, 
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
			maxAge: 24 * 60 * 60 * 1000,
			domain: process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === 'production' ? undefined : undefined)
		}
	})
);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// auth routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);
// also support legacy /auth path in case frontend calls that directly
app.use('/auth', authRouter);

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

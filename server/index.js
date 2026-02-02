const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');
const cookieParser = require('cookie-parser');
const session = require('express-session');

dotenv.config();
const app = express();

// When running behind a proxy (Render) we should trust the first proxy
// so Express correctly recognizes secure connections.
if (process.env.NODE_ENV === 'production') {
	app.set('trust proxy', 1);
}

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
			// Use explicit COOKIE_DOMAIN in production, otherwise set to the backend host
			domain: process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === 'production' ? 'jobbids-ncob.onrender.com' : undefined)
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
		// Mount bids router at both /api/bids and /bids to support clients
		// that use either base path (production build may request `/bids`).
		app.use('/api/bids', requireAuth, bidsRouter);
		app.use('/bids', requireAuth, bidsRouter);
		app.listen(port, () => console.log(`Server listening on ${port}`));
	} catch (err) {
		console.error('Failed to initialize database:', err);
		process.exit(1);
	}
})();

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;

(async () => {
	try {
		await db.init();
		const bidsRouter = require('./routes/bids');
		app.use('/api/bids', bidsRouter);
		app.listen(port, () => console.log(`Server listening on ${port}`));
	} catch (err) {
		console.error('Failed to initialize database:', err);
		process.exit(1);
	}
})();

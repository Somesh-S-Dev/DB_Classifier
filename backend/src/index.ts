import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import schemaRoutes from './routes/schemaRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/sessions', sessionRoutes);
app.use('/schema', schemaRoutes);

// Health Check
app.get('/health', async (req: express.Request, res: express.Response) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            status: 'ok',
            db: result.rows[0].now,
            server_time: new Date().toISOString(),
            version: '2.0.1'
        });
    } catch (err: any) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

import { initDb } from './utils/initDb.js';

app.listen(PORT, async () => {
    await initDb();
    console.log(`[server]: DB Classifier Backend running at http://localhost:${PORT}`);
});

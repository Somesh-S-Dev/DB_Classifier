import { readFile } from 'fs/promises';
import path from 'path';
import pool from '../config/db.js';

export const initDb = async () => {
    try {
        const initSqlPath = path.join(process.cwd(), 'db', 'init.sql');
        const sql = await readFile(initSqlPath, 'utf-8');

        console.log('[initDb]: Running initialization script...');
        await pool.query(sql);
        console.log('[initDb]: Database initialized successfully.');
    } catch (err) {
        console.error('[initDb]: Initialization failed:', err);
        // Do not throw, allow server to start? Or throw?
        // If critical tables missing, server will fail later.
        console.warn('[initDb]: Continuing startup despite DB init error (ignore if tables exist).');
    }
};

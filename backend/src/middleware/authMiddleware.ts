import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'Dotenv_is_not_loaded_you_idiot_developer';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
        if (err) return res.sendStatus(403);

        try {
            // Re-validate against database to ensure session hasn't been revoked
            const sessionCheck = await pool.query(
                'SELECT id FROM auth_sessions WHERE jwt_token = $1 AND expires_at > NOW() AND revoked = FALSE',
                [token]
            );

            if (sessionCheck.rows.length === 0) {
                return res.status(401).json({ message: 'Session expired or revoked' });
            }

            req.user = user as { id: string; email: string };
            next();
        } catch (dbErr) {
            console.error('Session validation error:', dbErr);
            res.sendStatus(500);
        }
    });
};

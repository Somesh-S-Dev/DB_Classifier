import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { sendOTPEmail, sendWelcomeEmail, sendSecurityAlert, sendPasswordSuccessEmail } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'Dotenv_is_not_loaded_you_idiot_developer';

const SESSION_EXPIRY_HOURS = parseInt(process.env.SESSION_EXPIRY_HOURS || '2');
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');

const createAuthSession = async (userId: string, token: string) => {
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
    await pool.query(
        'INSERT INTO auth_sessions (user_id, jwt_token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expiresAt]
    );
};

export const signupInitiate = async (req: Request, res: Response) => {
    const { name, companyName, employeeId, email, mobile, password } = req.body;

    try {
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR employee_id = $2', [email, employeeId]);
        let userId: string;

        const passwordHash = await bcrypt.hash(password, 10);

        if (userCheck.rows.length > 0) {
            const existingUser = userCheck.rows[0];
            if (existingUser.email_verified) {
                return res.status(400).json({ message: 'User already registered and verified' });
            }
            // Update existing unverified user
            await pool.query(
                'UPDATE users SET name = $1, company_name = $2, mobile = $3, password_hash = $4 WHERE id = $5',
                [name, companyName, mobile, passwordHash, existingUser.id]
            );
            userId = existingUser.id;
        } else {
            const result = await pool.query(
                'INSERT INTO users (name, company_name, employee_id, email, mobile, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [name, companyName, employeeId, email, mobile, passwordHash]
            );
            userId = result.rows[0].id;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await pool.query(
            'INSERT INTO otp_tokens (user_id, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
            [userId, otp, 'SIGNUP', expiresAt]
        );

        // SEND ACTUAL EMAIL
        await sendOTPEmail(email, otp, 'SIGNUP');

        console.log(`[SIGNUP-OTP LOG] for ${email}: ${otp}`);
        res.json({ message: 'OTP sent to email' });

    } catch (err: any) {
        console.error('Signup Initiate Error:', err);
        res.status(500).json({ message: err.message });
    }
};

export const signupVerify = async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) return res.status(404).json({ message: 'User not found' });

        const otpResult = await pool.query(
            'SELECT * FROM otp_tokens WHERE user_id = $1 AND otp_code = $2 AND purpose = $3 AND used = FALSE AND expires_at > NOW()',
            [user.id, otp, 'SIGNUP']
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const otpId = otpResult.rows[0].id;

        // Mark OTP as used and user as verified
        await pool.query('BEGIN');
        await pool.query('UPDATE otp_tokens SET used = TRUE WHERE id = $1', [otpId]);
        await pool.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [user.id]);
        await pool.query('COMMIT');

        // SEND WELCOME EMAIL
        await sendWelcomeEmail(user.email, user.name);

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
        await createAuthSession(user.id, token);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                employeeId: user.employee_id,
                companyName: user.company_name,
                mobile: user.mobile
            }
        });

    } catch (err: any) {
        if (pool) await pool.query('ROLLBACK');
        res.status(500).json({ message: err.message });
    }
};

export const login = async (req: Request, res: Response) => {
    const { identifier, password } = req.body;

    try {
        const userResult = await pool.query(
            'SELECT * FROM users WHERE (email = $1 OR employee_id = $1) AND is_active = TRUE',
            [identifier]
        );
        const user = userResult.rows[0];

        if (!user) {
            // Identifier not found - recommend signup
            // If identifier looks like an email, send them a "Not Found" security alert just in case
            if (identifier.includes('@')) {
                await sendSecurityAlert(identifier, 'NOT_FOUND').catch(() => { });
            }
            return res.status(404).json({
                message: 'Account not found. Would you like to sign up instead?',
                recommendSignup: true
            });
        }

        if (!(await bcrypt.compare(password, user.password_hash))) {
            // Incorrect password - send security alert
            await sendSecurityAlert(user.email, 'FAILED_LOGIN').catch(() => { });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.email_verified) {
            return res.status(403).json({ message: 'Please verify your email first' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
        await createAuthSession(user.id, token);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                employeeId: user.employee_id,
                companyName: user.company_name,
                mobile: user.mobile
            }
        });

    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const forgotInitiate = async (req: Request, res: Response) => {
    const { employeeId, email } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1 AND employee_id = $2', [email, employeeId]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ message: 'User not found or credentials mismatch' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await pool.query(
            'INSERT INTO otp_tokens (user_id, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
            [user.id, otp, 'FORGOT_PASSWORD', expiresAt]
        );

        // SEND ACTUAL EMAIL
        await sendOTPEmail(email, otp, 'FORGOT_PASSWORD');

        console.log(`[FORGOT-OTP LOG] for ${email}: ${otp}`);
        res.json({ message: 'OTP sent' });
    } catch (err: any) {
        console.error('Forgot Initiate Error:', err);
        res.status(500).json({ message: err.message });
    }
};

export const forgotVerify = async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otpResult = await pool.query(
            'SELECT * FROM otp_tokens WHERE user_id = $1 AND otp_code = $2 AND purpose = $3 AND used = FALSE AND expires_at > NOW()',
            [user.id, otp, 'FORGOT_PASSWORD']
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const forgotReset = async (req: Request, res: Response) => {
    const { employeeId, newPassword, otp } = req.body;
    try {
        const userResult = await pool.query('SELECT id, email FROM users WHERE employee_id = $1', [employeeId]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = userResult.rows[0];

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await pool.query('BEGIN');
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.id]);
        if (otp) {
            await pool.query('UPDATE otp_tokens SET used = TRUE WHERE user_id = $1 AND otp_code = $2 AND purpose = $3', [user.id, otp, 'FORGOT_PASSWORD']);
        }
        await pool.query('COMMIT');

        // SEND SUCCESS EMAIL
        await sendPasswordSuccessEmail(user.email);

        res.json({ message: 'Password reset successful' });
    } catch (err: any) {
        if (pool) await pool.query('ROLLBACK');
        res.status(500).json({ message: err.message });
    }
};

export const updateProfile = async (req: any, res: Response) => {
    const { name, companyName, mobile } = req.body;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, company_name = $2, mobile = $3 WHERE id = $4 RETURNING *',
            [name, companyName, mobile, userId]
        );
        const user = result.rows[0];
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                employeeId: user.employee_id,
                companyName: user.company_name,
                mobile: user.mobile
            }
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const changePasswordInitiate = async (req: any, res: Response) => {
    const { currentPassword } = req.body;
    const userId = req.user.id;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await pool.query(
            'INSERT INTO otp_tokens (user_id, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
            [userId, otp, 'FORGOT_PASSWORD', expiresAt]
        );

        await sendOTPEmail(user.email, otp, 'FORGOT_PASSWORD');
        res.json({ message: 'Security OTP sent to your email' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const changeEmailInitiate = async (req: any, res: Response) => {
    const { newEmail } = req.body;
    const userId = req.user.id;

    try {
        const check = await pool.query('SELECT id FROM users WHERE email = $1', [newEmail]);
        if (check.rows.length > 0) return res.status(400).json({ message: 'Email already in use' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await pool.query(
            'INSERT INTO otp_tokens (user_id, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
            [userId, otp, 'SIGNUP', expiresAt]
        );

        await sendOTPEmail(newEmail, otp, 'SIGNUP');
        res.json({ message: 'Verification OTP sent to your new email' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const changePasswordVerify = async (req: any, res: Response) => {
    const { otp, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const otpResult = await pool.query(
            'SELECT * FROM otp_tokens WHERE user_id = $1 AND otp_code = $2 AND purpose = $3 AND used = FALSE AND expires_at > NOW()',
            [userId, otp, 'FORGOT_PASSWORD']
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await pool.query('BEGIN');
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
        await pool.query('UPDATE otp_tokens SET used = TRUE WHERE id = $1', [otpResult.rows[0].id]);
        await pool.query('COMMIT');

        // Send success email
        await sendPasswordSuccessEmail(req.user.email);

        res.json({ message: 'Password changed successfully' });
    } catch (err: any) {
        if (pool) await pool.query('ROLLBACK');
        res.status(500).json({ message: err.message });
    }
};

export const changeEmailVerify = async (req: any, res: Response) => {
    const { otp, newEmail } = req.body;
    const userId = req.user.id;

    try {
        const otpResult = await pool.query(
            'SELECT * FROM otp_tokens WHERE user_id = $1 AND otp_code = $2 AND purpose = $3 AND used = FALSE AND expires_at > NOW()',
            [userId, otp, 'SIGNUP']
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        await pool.query('BEGIN');
        await pool.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, userId]);
        await pool.query('UPDATE otp_tokens SET used = TRUE WHERE id = $1', [otpResult.rows[0].id]);
        await pool.query('COMMIT');

        res.json({ message: 'Email updated successfully' });
    } catch (err: any) {
        if (pool) await pool.query('ROLLBACK');
        res.status(500).json({ message: err.message });
    }
};
export const changeMobileInitiate = async (req: any, res: Response) => {
    const { newMobile } = req.body;
    const userId = req.user.id;

    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await pool.query(
            'INSERT INTO otp_tokens (user_id, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
            [userId, otp, 'SIGNUP', expiresAt]
        );

        // For now, we reuse the email service to send the code to their email for verification
        // as we don't have an SMS gateway yet.
        await sendOTPEmail(req.user.email, otp, 'SIGNUP');
        res.json({ message: 'Security OTP sent to your email' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const changeMobileVerify = async (req: any, res: Response) => {
    const { otp, newMobile } = req.body;
    const userId = req.user.id;

    try {
        const otpResult = await pool.query(
            'SELECT * FROM otp_tokens WHERE user_id = $1 AND otp_code = $2 AND purpose = $3 AND used = FALSE AND expires_at > NOW()',
            [userId, otp, 'SIGNUP']
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        await pool.query('BEGIN');
        await pool.query('UPDATE users SET mobile = $1 WHERE id = $2', [newMobile, userId]);
        await pool.query('UPDATE otp_tokens SET used = TRUE WHERE id = $1', [otpResult.rows[0].id]);
        await pool.query('COMMIT');

        res.json({ message: 'Mobile number updated successfully' });
    } catch (err: any) {
        if (pool) await pool.query('ROLLBACK');
        res.status(500).json({ message: err.message });
    }
};

export const verify = async (req: any, res: Response) => {
    try {
        const userResult = await pool.query(
            'SELECT id, name, email, employee_id, company_name, mobile FROM users WHERE id = $1',
            [req.user.id]
        );
        const user = userResult.rows[0];
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                employeeId: user.employee_id,
                companyName: user.company_name,
                mobile: user.mobile
            }
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const logout = async (req: any, res: Response) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    try {
        if (token) {
            await pool.query('UPDATE auth_sessions SET revoked = TRUE WHERE jwt_token = $1', [token]);
        }
        res.json({ message: 'Logged out successfully' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const getEmailTemplate = (title: string, content: string) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0a0a0a; color: #ffffff; border: 1px solid #333; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-block; padding: 15px; background: linear-gradient(135deg, #0084ff, #00c8ff); border-radius: 16px; margin-bottom: 15px;">
                <h1 style="color: #ffffff; font-weight: 1000; letter-spacing: 3px; text-transform: uppercase; margin: 0; font-size: 24px;">WINS SOFT</h1>
            </div>
            <p style="color: #0084ff; font-weight: 900; letter-spacing: 5px; text-transform: uppercase; margin: 0; font-size: 10px; opacity: 0.8;">Classifier Studio</p>
        </div>
        
        <h2 style="font-size: 28px; font-weight: 900; margin-bottom: 25px; color: #ffffff; letter-spacing: -0.5px;">${title}</h2>
        ${content}
        
        <div style="border-top: 1px solid #222; margin-top: 50px; padding-top: 25px; text-align: center;">
            <p style="color: #444; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px;">Professional Schema Intelligence</p>
            <span style="color: #222; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">© 2026 Wins Soft DB Classifier</span>
        </div>
    </div>
`;

export const sendOTPEmail = async (email: string, otp: string, purpose: 'SIGNUP' | 'FORGOT_PASSWORD') => {
    const title = purpose === 'SIGNUP' ? 'Verify Your Identity' : 'Secure Reset Request';
    const actionText = purpose === 'SIGNUP' ? 'finalizing your registration' : 'resetting your secure credentials';

    const content = `
        <p style="color: #aaa; line-height: 1.8; font-size: 16px; font-weight: 400;">
            You are receiving this because you are ${actionText} in the Wins Soft Studio. Please use the following authorization code:
        </p>
        
        <div style="background: linear-gradient(180deg, #151515 0%, #0c0c0c 100%); border: 1px solid #222; padding: 40px; border-radius: 20px; text-align: center; margin: 35px 0; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);">
            <span style="display: block; color: #444; font-size: 10px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 20px;">Secure Access Token</span>
            <span style="font-family: 'SF Mono', 'Fira Code', monospace; font-size: 56px; font-weight: 900; letter-spacing: 15px; color: #0084ff; text-shadow: 0 0 30px rgba(0,132,255,0.3);">${otp}</span>
        </div>
        
        <p style="color: #555; font-size: 13px; text-align: center; margin-top: 30px; font-weight: 500;">
            This token is valid for 10 minutes. If you did not initiate this request, please secure your account immediately.
        </p>
    `;

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"Wins Soft Classifier" <no-reply@winssoft.com>',
        to: email,
        subject: `[SECURE] ${title}`,
        html: getEmailTemplate(title, content),
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('[EMAIL ERROR]', err);
        throw new Error('Email delivery failed.');
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    const content = `
        <p style="color: #aaa; line-height: 1.8; font-size: 16px;">
            Welcome to the future of schema intelligence, <strong>${name}</strong>. Your account has been successfully verified and is now fully active.
        </p>
        <p style="color: #aaa; line-height: 1.8; font-size: 16px;">
            You can now start classifying databases, building intelligent joins, and managing professional schema snapshots in your personal studio.
        </p>
        <div style="margin-top: 30px; padding: 20px; border-left: 4px solid #0084ff; background: #111; border-radius: 8px;">
            <p style="color: #0084ff; font-weight: 700; margin: 0;">Get Started</p>
            <p style="color: #666; font-size: 14px; margin: 5px 0 0;">Launch the Classifier Studio from your dashboard to begin your first session.</p>
        </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Welcome to Wins Soft Classifier Studio',
        html: getEmailTemplate('Registration Successful', content),
    });
};

export const sendSecurityAlert = async (email: string, type: 'FAILED_LOGIN' | 'NOT_FOUND') => {
    const title = 'Security Alert';
    const content = type === 'FAILED_LOGIN'
        ? `<p style="color: #aaa; line-height: 1.8; font-size: 16px;">We detected a failed login attempt on your account. If this wasn't you, we recommend resetting your password immediately.</p>`
        : `<p style="color: #aaa; line-height: 1.8; font-size: 16px;">Someone tried to log in using this email, but no account exists. If you intended to join us, please use the Signup link.</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `[ALERT] ${title}`,
        html: getEmailTemplate(title, content),
    });
};

export const sendPasswordSuccessEmail = async (email: string) => {
    const content = `<p style="color: #aaa; line-height: 1.8; font-size: 16px;">Your password has been successfully reset. You can now log in using your new credentials.</p>`;
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Credential Update Successful',
        html: getEmailTemplate('Security Reset Confirmed', content),
    });
};

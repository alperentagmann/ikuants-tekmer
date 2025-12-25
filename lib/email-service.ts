import nodemailer from 'nodemailer';

// Email configuration interface
interface EmailOptions {
    to?: string;
    subject: string;
    html: string;
    replyTo?: string;
}

// Create reusable transporter object using the default SMTP transport
const createTransporter = () => {
    // Check if essential environment variables are present
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP Configuration missing. Emails will not be sent.');
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false // Sometimes helpful implementation in development
        }
    });
};

/**
 * Sends an email using the configured SMTP transport.
 * 
 * @param options Email options (to, subject, html, replyTo)
 * @returns Promise<{ success: boolean; messageId?: string; error?: any }>
 */
export async function sendMail({ to, subject, html, replyTo }: EmailOptions) {
    const transporter = createTransporter();

    // Default recipient is the system admin if not specified
    const recipient = to || 'bilgi@ikuantstekmer.com';

    if (!transporter) {
        console.log('Would send email to:', recipient);
        console.log('Subject:', subject);
        return { success: false, error: 'SMTP Configuration missing' };
    }

    try {
        const info = await transporter.sendMail({
            from: `"İKÜANTS TEKMER" <${process.env.SMTP_USER}>`,
            to: recipient,
            replyTo: replyTo,
            subject: subject,
            html: html,
        });

        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error };
    }
}

/**
 * Generates a consistent HTML template for emails
 */
export function generateEmailTemplate(title: string, data: Record<string, any>) {
    const rows = Object.entries(data).map(([key, value]) => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; font-weight: bold; color: #444; width: 30%;">${key}</td>
            <td style="padding: 12px; color: #222;">${value ? value.toString() : '-'}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin:0;">${title}</h2>
        </div>
        <div class="content">
            <table>
                ${rows}
            </table>
        </div>
        <div class="footer">
            <p>Bu mesaj ikuantstekmer.com üzerinden gönderilmiştir.</p>
        </div>
    </div>
</body>
</html>
    `;
}

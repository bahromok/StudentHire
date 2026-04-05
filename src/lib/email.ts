import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, token: string) {
    const code = token.slice(0, 8); // Send an 8-character code like before

    const mailOptions = {
        from: process.env.SMTP_FROM || 'StudentHire Auth <onboarding@resend.dev>',
        to: [to],
        subject: 'Verify your StudentHire Account',
        html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
        <h2 style="color: #10b981;">StudentHire Security</h2>
        <p>Hello,</p>
        <p>Your email verification code is:</p>
        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 8px; margin: 24px 0;">
          ${code}
        </div>
        <p>Please enter this code on the verification screen to activate your account. This code expires in 24 hours.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 32px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    };

    const { data, error } = await resend.emails.send(mailOptions);

    if (error) {
        console.error('Error sending email with Resend:', error);
        throw error;
    }

    return data;
}

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "FREELANCER",
            }
        },
        modelName: "User",
        fields: {
            emailVerified: "isEmailVerified",
            image: "avatar",
        }
    },
    emailAndPassword: {
        enabled: true,
        async sendResetPassword({ user, url }) {
            await resend.emails.send({
                from: "StudentHire <onboarding@resend.dev>",
                to: user.email,
                subject: "Reset your password",
                html: `Click <a href="${url}">here</a> to reset your password.`,
            });
        },
    },
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }, request) {
                await sendVerificationEmail(email, otp);
            },
        }),
    ],
    secret: process.env.NEON_AUTH_COOKIE_SECRET || 'fallback_development_secret_override_me_with_something_longer',
    baseURL: (process.env.NEON_AUTH_BASE_URL || 'http://localhost:3000') + '/api/auth',
});

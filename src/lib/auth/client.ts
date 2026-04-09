import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

// Get the base URL for client-side auth
const getClientBaseUrl = () => {
    if (typeof window !== 'undefined') {
        // Client-side: use the current origin
        return window.location.origin;
    }
    // Server-side: use environment variables
    if (process.env.VERCEL_ENV === 'production') {
        return process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    if (process.env.VERCEL_ENV === 'preview') {
        return process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_BRANCH_URL}`;
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

// Next.js uses NEXT_PUBLIC_ for client-exposed environment variables
export const authClient = createAuthClient({
    baseURL: getClientBaseUrl(),
    plugins: [
        emailOTPClient()
    ]
});

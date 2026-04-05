import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

// Next.js uses NEXT_PUBLIC_ for client-exposed environment variables
export const authClient = createAuthClient({
    baseURL: (process.env.NEXT_PUBLIC_NEON_AUTH_URL || 'http://localhost:3000') + '/api/auth',
    plugins: [
        emailOTPClient()
    ]
});

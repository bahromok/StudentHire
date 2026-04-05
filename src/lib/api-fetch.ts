import { useAuthStore } from '@/store/auth-store'

/**
 * Auth-aware fetch wrapper. Automatically injects the Authorization header
 * with the current user's ID so that backend API routes can authenticate
 * the request.
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const user = useAuthStore.getState().user
  const headers = new Headers(options.headers || {})

  if (user?.id) {
    headers.set('Authorization', `userId:${user.id}`)
  }

  // Set Content-Type to JSON if body exists and no explicit content-type
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, { ...options, headers })
}

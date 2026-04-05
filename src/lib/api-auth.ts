import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export interface AuthUser {
  id: string
  email: string
  role: string
}

export async function getAuthenticatedUser(request: Request): Promise<AuthUser | NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('userId:')) {
    return apiError('Authentication required', 401)
  }
  const userId = authHeader.replace('userId:', '')
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return apiError('User not found', 401)
  return { id: user.id, email: user.email, role: user.role }
}

export function requireRole(user: AuthUser, roles: string | string[]): NextResponse | null {
  const roleArray = Array.isArray(roles) ? roles : [roles]
  if (!roleArray.includes(user.role)) {
    return apiError('Insufficient permissions', 403)
  }
  return null
}

export function isAuthUser(user: AuthUser | NextResponse): user is AuthUser {
  return !NextResponse.prototype.isPrototypeOf?.(user) && 'id' in user
}

export function apiError(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export function apiSuccess(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export async function parseBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>
}

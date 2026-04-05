import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const ADJECTIVES = [
  'Creative', 'Bold', 'Swift', 'Bright', 'Clever', 'Keen', 'Noble', 'Brave',
  'Agile', 'Sharp', 'Smart', 'Wise', 'Zen', 'Epic', 'Neo', 'Pro',
  'Alpha', 'Prime', 'Elite', 'Top', 'Grand', 'Ultra', 'Super', 'Hyper',
  'Cool', 'Fresh', 'Pure', 'True', 'Fast', 'Quick', 'Calm', 'Dare',
]

const ANIMALS = [
  'Wolf', 'Fox', 'Hawk', 'Lion', 'Bear', 'Eagle', 'Tiger', 'Panda',
  'Owl', 'Cat', 'Dog', 'Shark', 'Dragon', 'Phoenix', 'Falcon', 'Panther',
  'Lynx', 'Cobra', 'Raven', 'Hawk', 'Llama', 'Otter', 'Penguin', 'Dolphin',
  'Lizard', 'Gecko', 'Puma', 'Jaguar', 'Lynx', 'Moose', 'Bison', 'Crane',
]

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateDisplayName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  const num = Math.floor(Math.random() * 99) + 1
  return `${adj}${animal}${num}`
}

export function isAuthenticated(session: any): boolean {
  return !!session?.user?.id
}

export function hasRole(session: any, roles: string | string[]): boolean {
  if (!session?.user?.role) return false
  const roleArray = Array.isArray(roles) ? roles : [roles]
  return roleArray.includes(session.user.role)
}

export async function getClientProfile(userId: string) {
  return db.clientProfile.findUnique({
    where: { userId },
  })
}

export async function getFreelancerProfile(userId: string) {
  return db.freelancerProfile.findUnique({
    where: { userId },
  })
}

export async function getPublicUserData(userId: string, requesterId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      clientProfile: {
        select: {
          displayName: true,
          bio: true,
          companyName: true,
          companyLogo: true,
          location: true,
        },
      },
      freelancerProfile: {
        select: {
          displayName: true,
          avatar: true,
          bio: true,
          title: true,
          hourlyRate: true,
          skills: true,
          portfolio: true,
          location: true,
          availabilityStatus: true,
          rating: true,
          totalReviews: true,
          completedJobs: true,
        },
      },
    },
  })

  if (!user) return null

  return {
    id: user.id,
    role: user.role,
    displayName:
      user.clientProfile?.displayName ??
      user.freelancerProfile?.displayName ??
      'Anonymous',
    avatar:
      user.clientProfile?.companyLogo ??
      user.freelancerProfile?.avatar ??
      null,
    ...(user.role === 'CLIENT' && user.clientProfile
      ? { bio: user.clientProfile.bio, companyName: user.clientProfile.companyName, location: user.clientProfile.location }
      : {}),
    ...(user.role === 'FREELANCER' && user.freelancerProfile
      ? {
        bio: user.freelancerProfile.bio,
        title: user.freelancerProfile.title,
        hourlyRate: user.freelancerProfile.hourlyRate,
        skills: user.freelancerProfile.skills,
        portfolio: user.freelancerProfile.portfolio,
        location: user.freelancerProfile.location,
        availabilityStatus: user.freelancerProfile.availabilityStatus,
        rating: user.freelancerProfile.rating,
        totalReviews: user.freelancerProfile.totalReviews,
        completedJobs: user.freelancerProfile.completedJobs,
      }
      : {}),
  }
}

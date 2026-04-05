'use client'

import { AppShell } from '@/components/layout/app-shell'
import { AuthProvider } from '@/components/auth/auth-provider'
import { Toaster } from '@/components/ui/sonner'

export default function Home() {
  return (
    <AuthProvider>
      <AppShell />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  )
}

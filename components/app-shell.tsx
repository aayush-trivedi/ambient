'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { TabBar } from './tab-bar'
import { useTabStore } from '@/lib/stores/tab-store'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { setActiveTab, tabs } = useTabStore()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  // Sync URL with active tab
  useEffect(() => {
    if (pathname === '/dashboard') {
      setActiveTab('dashboard')
    } else if (pathname?.startsWith('/room/')) {
      const roomId = pathname.split('/room/')[1]
      const tab = tabs.find((t) => t.roomId === roomId)
      if (tab) {
        setActiveTab(tab.id)
      }
    }
  }, [pathname, tabs, setActiveTab])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      <TabBar />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

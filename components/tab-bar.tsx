'use client'

import { useEffect, useState } from 'react'
import { X, Search } from 'lucide-react'
import { useTabStore, Tab } from '@/lib/stores/tab-store'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTabStore()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab.id)
    if (tab.type === 'dashboard') {
      router.push('/dashboard')
    } else if (tab.roomId) {
      router.push(`/room/${tab.roomId}`)
    }
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    removeTab(tabId)

    // Navigate to the new active tab
    const { tabs: newTabs, activeTabId: newActiveId } = useTabStore.getState()
    const newActiveTab = newTabs.find((t) => t.id === newActiveId)
    if (newActiveTab) {
      if (newActiveTab.type === 'dashboard') {
        router.push('/dashboard')
      } else if (newActiveTab.roomId) {
        router.push(`/room/${newActiveTab.roomId}`)
      }
    }
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const userName = user?.user_metadata?.full_name || 'User'

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {/* Tabs - takes up most space */}
      <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId

          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`
                group flex items-center gap-2 px-3 py-1.5 rounded-xl
                border transition-all cursor-pointer select-none
                flex-shrink-0 min-w-[100px] max-w-[240px]
                ${isActive
                  ? 'bg-stone-950 border-stone-800'
                  : 'bg-black border-transparent'
                }
              `}
            >
              {/* Tab title with fade effect */}
              <div className="flex-1 min-w-0 relative overflow-hidden">
                <div className="text-sm text-white whitespace-nowrap pr-6">
                  {tab.title}
                </div>
                {/* Fade overlay on right edge */}
                <div
                  className={`
                    absolute right-0 top-0 bottom-0 w-12
                    bg-gradient-to-l to-transparent pointer-events-none
                    ${isActive ? 'from-stone-950' : 'from-black'}
                  `}
                />
              </div>

              {/* Close button (not for dashboard) */}
              {tab.type !== 'dashboard' && (
                <div className="relative flex-shrink-0 w-3 h-3">
                  <button
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="
                      absolute inset-0 flex items-center justify-center
                      rounded-full border border-transparent
                      opacity-0 group-hover:opacity-100
                      hover:border-stone-700 transition-all
                    "
                  >
                    <X className="h-3 w-3 text-stone-400 hover:text-white" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Right side - Search and Profile */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {/* Search button */}
        <button
          className="w-7 h-7 flex items-center justify-center text-white rounded-full border border-transparent hover:border-stone-700 transition-colors duration-150"
          onClick={() => {/* TODO: search modal */}}
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Profile avatar */}
        {avatarUrl && (
          <div className="cursor-pointer hover:opacity-80 transition-opacity rounded-full border border-transparent hover:border-stone-700 h-7 w-7 flex items-center justify-center">
            <img
              src={avatarUrl}
              alt={userName}
              className="w-6 h-6 rounded-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  )
}

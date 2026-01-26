'use client'

import { X, LayoutDashboard } from 'lucide-react'
import { useTabStore, Tab } from '@/lib/stores/tab-store'
import { useRouter, usePathname } from 'next/navigation'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTabStore()
  const router = useRouter()
  const pathname = usePathname()

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
    const tab = tabs.find((t) => t.id === tabId)
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

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-black border-b border-stone-900 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId

        return (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`
              group flex items-center gap-2 px-3 py-1.5 rounded-xl
              border transition-all cursor-pointer select-none
              min-w-[100px] max-w-[200px] flex-shrink-0
              ${isActive
                ? 'bg-stone-950 border-stone-800'
                : 'bg-black border-transparent hover:border-stone-800'
              }
            `}
          >
            {/* Icon */}
            {tab.type === 'dashboard' && (
              <LayoutDashboard className="h-4 w-4 text-stone-400 flex-shrink-0" />
            )}

            {/* Title with fade */}
            <div className="flex-1 min-w-0 relative overflow-hidden">
              <span className="text-sm text-white whitespace-nowrap">
                {tab.title}
              </span>
              <div
                className={`
                  absolute right-0 top-0 bottom-0 w-8
                  bg-gradient-to-l to-transparent pointer-events-none
                  ${isActive ? 'from-stone-950' : 'from-black'}
                `}
              />
            </div>

            {/* Close button (not for dashboard) */}
            {tab.type !== 'dashboard' && (
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-stone-800 transition-all"
              >
                <X className="h-3 w-3 text-stone-400 hover:text-white" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

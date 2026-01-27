'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Tab {
  id: string
  title: string
  type: 'dashboard' | 'room'
  roomId?: string
}

interface TabStore {
  tabs: Tab[]
  activeTabId: string | null
  addTab: (tab: Tab) => void
  removeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabTitle: (tabId: string, title: string) => void
  getTabByRoomId: (roomId: string) => Tab | undefined
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [{ id: 'dashboard', title: 'Dashboard', type: 'dashboard' }],
      activeTabId: 'dashboard',

      addTab: (tab) => {
        const existing = get().tabs.find((t) => t.id === tab.id)
        if (existing) {
          set({ activeTabId: tab.id })
          return
        }
        set((state) => ({
          tabs: [...state.tabs, tab],
          activeTabId: tab.id,
        }))
      },

      removeTab: (tabId) => {
        const { tabs, activeTabId } = get()

        // Can't close the last tab
        if (tabs.length <= 1) return

        const newTabs = tabs.filter((t) => t.id !== tabId)
        const wasActive = activeTabId === tabId

        set({
          tabs: newTabs,
          activeTabId: wasActive
            ? newTabs[newTabs.length - 1]?.id
            : activeTabId,
        })
      },

      setActiveTab: (tabId) => {
        set({ activeTabId: tabId })
      },

      updateTabTitle: (tabId, title) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, title } : t
          ),
        }))
      },

      getTabByRoomId: (roomId) => {
        return get().tabs.find((t) => t.roomId === roomId)
      },
    }),
    {
      name: 'ambient-tabs',
    }
  )
)

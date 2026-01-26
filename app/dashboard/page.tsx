'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Plus, LogOut } from 'lucide-react'

function generateRoomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
  }, [router])

  const createRoom = () => {
    const roomId = generateRoomId()
    router.push(`/room/${roomId}`)
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-white mb-3">Hey, {firstName}</h1>
          <p className="text-stone-500">Create a room and share the link</p>
        </div>

        <button
          onClick={createRoom}
          className="w-full bg-stone-950 hover:border-stone-700 rounded-3xl border border-stone-800 p-6 flex items-center justify-center gap-3 text-white transition-colors mb-4"
        >
          <Plus className="w-5 h-5" />
          <span>Create Room</span>
        </button>

        <button
          onClick={signOut}
          className="w-full rounded-3xl p-4 flex items-center justify-center gap-2 text-stone-500 hover:text-stone-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign out</span>
        </button>
      </div>
    </div>
  )
}

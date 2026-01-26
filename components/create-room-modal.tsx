'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

export function CreateRoomModal({ isOpen, onClose, onCreate }: CreateRoomModalProps) {
  const [name, setName] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim())
      setName('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
      <div className="w-full max-w-md bg-stone-950 rounded-3xl border border-stone-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-white">Create Room</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-stone-900 transition-colors"
          >
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Room name"
            className="w-full bg-stone-900 rounded-2xl border border-stone-800 px-4 py-3 text-white placeholder:text-stone-600 focus:outline-none focus:border-stone-700 mb-4"
            autoFocus
          />

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-white text-black rounded-2xl py-3 font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </form>
      </div>
    </div>
  )
}

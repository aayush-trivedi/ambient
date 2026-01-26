import { PresenceState } from '@/lib/supabase/types'

export function dedupeParticipants(participants: PresenceState[]): PresenceState[] {
  const seen = new Set<string>()
  return participants.filter((p) => {
    if (seen.has(p.user_id)) return false
    seen.add(p.user_id)
    return true
  })
}

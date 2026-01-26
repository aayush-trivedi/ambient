export interface Room {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface PresenceState {
  user_id: string
  user_name: string
  user_avatar: string
}

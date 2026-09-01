import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

export interface DbFolder {
  id: string
  user_id: string
  parent_id: string | null
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface DbMap {
  id: string
  user_id: string
  folder_id: string | null
  title: string
  raw_markdown: string
  mastered_node_ids: string[]
  layout_direction: 'BILATERAL' | 'LR' | 'TB'
  is_public: boolean
  share_slug: string | null
  created_at: string
  updated_at: string
}

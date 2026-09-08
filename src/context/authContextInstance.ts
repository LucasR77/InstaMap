import { createContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isConfigured: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

import { supabase } from '../../../infrastructure/supabase/client'

type SignInCredentials = Readonly<{
  email: string
  password: string
}>

export async function signInWithEmailPassword({
  email,
  password,
}: SignInCredentials): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(error.message)
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

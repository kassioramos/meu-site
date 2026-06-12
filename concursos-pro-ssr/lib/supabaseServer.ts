import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase Server no .env.local')
}

// Removido o fallback de string exposta por segurança!
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)
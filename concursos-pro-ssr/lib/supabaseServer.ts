import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mczmhvuxujvhrudqmpvg.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jem1odnV4dWp2aHJ1ZHFtcHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzgwMDksImV4cCI6MjA5MTUxNDAwOX0.vqNvzVRzpH9Otqb7DISpWXLw4b6eegdwzpaLBRJPwfY'

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)
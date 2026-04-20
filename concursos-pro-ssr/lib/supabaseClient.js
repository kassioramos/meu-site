import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mczmhvuxujvhrudqmpvg.supabase.co';
const supabaseAnonKey = 'sb_publishable_VTkTKTGqA7QtDR3cnENUwQ_mGDWVkle';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
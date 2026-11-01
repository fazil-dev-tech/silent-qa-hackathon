import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://vdifshqatwyaycxhtbua.supabase.co';

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseServiceKey) {
  console.warn('[Silent QA] Warning: SUPABASE_SERVICE_ROLE_KEY is not defined in environment.');
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

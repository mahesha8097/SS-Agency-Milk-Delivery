import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vckznoyjrdurjcaaxkrx.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZja3pub3lqcmR1cmpjYWF4a3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MTQyMzksImV4cCI6MjEwMzA5MDIzOX0.mZ60W6yN9hoMHNQynklwHVO1tbzNoTkX4fXY1jshh4g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured(): boolean {
  return (
    !!supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('demo-agency') &&
    !!supabaseAnonKey &&
    supabaseAnonKey.length > 20
  );
}


import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials in .env.local');
}

let supabase = null;

export const initializeAuth = async () => {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.supabaseAuth = supabase.auth;
  window.supabaseDb = supabase;
  console.log('✅ Supabase initialized');
};

export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return null;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Return auth user data directly (don't touch database)
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      role: 'actor',
      timezone: 'UTC',
      is_active: true
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSupabase = () => supabase;
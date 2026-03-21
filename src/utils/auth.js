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
    if (!user) return null;
    
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    return data;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSupabase = () => supabase;

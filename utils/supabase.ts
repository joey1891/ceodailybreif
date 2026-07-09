import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://inpfhtkdghdidkbgtrzj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlucGZodGtkZ2hkaWRrYmd0cnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1ODU4MzcsImV4cCI6MjA5OTE2MTgzN30.SyXPfQrg_fouFspx7NIxIn8YvWDkZB3uCREGGiJFbjI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
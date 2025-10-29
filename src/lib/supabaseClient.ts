import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rgvmvvegwwsdwtcuhbie.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJndm12dmVnd3dzZHd0Y3VoYmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDk0NTgsImV4cCI6MjA3NzEyNTQ1OH0.s_XYVVvniKpc8EQR9RNyf8XyHmwzgAQul-GKs7gU-ZI'
export const supabase = createClient(supabaseUrl, supabaseKey)
